<?php

namespace App\Http\Controllers;

use App\Http\Requests\ExportTicketsRequest;
use App\Http\Requests\StoreAdminTicketRequest;
use App\Models\Client;
use App\Models\Notification;
use App\Models\OrganizationUser;
use App\Models\SlaPolicy;
use App\Models\Task;
use App\Models\Ticket;
use App\Models\TicketAttachment;
use App\Models\TicketHistory;
use App\Models\User;
use App\Services\NotificationService;
use App\Services\TicketNumberGenerator;
use App\Services\WorkingHoursService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class AdminTicketController extends Controller
{
    /**
     * Create a new controller instance.
     */
    public function __construct(
        protected NotificationService $notificationService
    ) {}

    /**
     * Compute the work status of a ticket based on its tasks.
     * Returns an array with status, label, color and progress info.
     */
    public static function computeWorkStatus(Ticket $ticket): array
    {
        // Load tasks if not already loaded
        if (! $ticket->relationLoaded('tasks.assignedUsers')) {
            $ticket->load('tasks.assignedUsers');
        }

        $tasks = $ticket->tasks;

        if ($tasks->isEmpty()) {
            return [
                'status' => 'no-tasks',
                'label' => 'No Tasks',
                'color' => 'gray',
                'total' => 0,
                'completed' => 0,
                'in_progress' => 0,
                'blocked' => 0,
                'pending' => 0,
            ];
        }

        $total = $tasks->count();
        $completed = $tasks->filter(function ($task) {
            return in_array($task->state, ['Done', 'Cancelled', 'Rejected']);
        })->count();

        $inProgress = $tasks->filter(function ($task) {
            return in_array($task->state, ['InProgress', 'InReview', 'Assigned']);
        })->count();

        $blocked = $tasks->filter(function ($task) {
            return $task->state === 'Blocked';
        })->count();

        $pending = $tasks->filter(function ($task) {
            return $task->state === 'Draft';
        })->count();

        // Determine overall status
        $status = 'in-progress';
        $label = 'In Progress';
        $color = 'blue';

        if ($completed === $total) {
            $status = 'completed';
            $label = 'Completed';
            $color = 'green';
        } elseif ($blocked > 0) {
            $status = 'blocked';
            $label = 'Blocked';
            $color = 'red';
        } elseif ($pending === $total) {
            $status = 'pending';
            $label = 'Pending';
            $color = 'gray';
        } elseif ($inProgress > 0 && $completed > 0) {
            $status = 'partial';
            $label = 'Partial';
            $color = 'yellow';
        }

        return [
            'status' => $status,
            'label' => $label,
            'color' => $color,
            'total' => $total,
            'completed' => $completed,
            'in_progress' => $inProgress,
            'blocked' => $blocked,
            'pending' => $pending,
            'progress' => $total > 0 ? round(($completed / $total) * 100) : 0,
        ];
    }

    /**
     * Display a listing of all tickets (Admin view).
     */
    public function index(Request $request): Response
    {
        return Inertia::render('admin/tickets/Index', [
            'filters' => $this->ticketFilters($request),
        ]);
    }

    /**
     * Load the paginated ticket table after the page shell has rendered.
     */
    public function data(Request $request): JsonResponse
    {
        $query = Ticket::withTrashed()
            ->with([
                'client:id,name',
                'organizationUser:id,name,email',
                'assignedTo:id,name',
                'approvedBy:id,name',
                'createdBy:id,name',
                'tasks:id,ticket_id,title,state,task_code',
                'tasks.assignedUsers:id,name',
            ]);

        // Apply filters if provided
        if ($request->has('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        if ($request->has('priority') && $request->priority !== 'all') {
            $query->where('priority', $request->priority);
        }

        if ($request->has('client_id') && $request->client_id !== 'all') {
            $query->where('client_id', $request->client_id);
        }

        if ($request->has('search') && ! empty($request->search)) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                    ->orWhere('ticket_number', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%")
                    ->orWhereHas('client', function ($q) use ($search) {
                        $q->where('name', 'like', "%{$search}%");
                    });
            });
        }

        $sortableColumns = [
            'title' => 'tickets.title',
            'priority' => 'tickets.priority',
            'status' => 'tickets.status',
            'created_at' => 'tickets.created_at',
        ];
        $orderBy = $request->input('order_by', 'created_at');
        $direction = $request->input('order_direction', 'desc') === 'asc' ? 'asc' : 'desc';

        if ($orderBy === 'client') {
            $query->leftJoin('clients', 'tickets.client_id', '=', 'clients.id')
                ->orderBy('clients.name', $direction)
                ->orderBy('tickets.id')
                ->select('tickets.*');
        } elseif ($orderBy === 'assignee') {
            $query->leftJoin('users as assigned_users', 'tickets.assigned_to', '=', 'assigned_users.id')
                ->orderBy('assigned_users.name', $direction)
                ->orderBy('tickets.id')
                ->select('tickets.*');
        } elseif (array_key_exists($orderBy, $sortableColumns)) {
            $query->orderBy($sortableColumns[$orderBy], $direction)
                ->orderBy('tickets.id');
        } else {
            $orderBy = 'created_at';
            $direction = 'desc';
            $query->latest('tickets.created_at');
        }

        $tickets = $query->paginate(15);

        // Compute work status for each ticket
        $tickets->getCollection()->transform(function ($ticket) {
            $ticket->work_status = self::computeWorkStatus($ticket);

            return $ticket;
        });

        $clients = Client::select('id', 'name')->where('status', 'active')->get();

        return response()->json([
            'tickets' => $tickets,
            'clients' => $clients,
        ]);
    }

    /**
     * Load ticket summary cards independently from the ticket table.
     */
    public function stats(): JsonResponse
    {
        $stats = DB::table('tickets')
            ->whereNull('deleted_at')
            ->selectRaw("
                COUNT(CASE WHEN status = 'open' THEN 1 END) as total_open,
                COUNT(CASE WHEN status = 'open' AND DATE(created_at) = ? THEN 1 END) as open_today,
                COUNT(CASE WHEN status = 'in-progress' THEN 1 END) as in_progress,
                COUNT(CASE WHEN status = 'closed' THEN 1 END) as completed
            ", [Carbon::today()->toDateString()])
            ->first();

        return response()->json([
            'stats' => [
                'total_open' => (int) ($stats->total_open ?? 0),
                'open_today' => (int) ($stats->open_today ?? 0),
                'in_progress' => (int) ($stats->in_progress ?? 0),
                'completed' => (int) ($stats->completed ?? 0),
            ],
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function ticketFilters(Request $request): array
    {
        return [
            ...$request->only(['status', 'priority', 'client_id', 'search', 'page']),
            'order_by' => $request->input('order_by', 'created_at'),
            'order_direction' => $request->input('order_direction') === 'asc' ? 'asc' : 'desc',
        ];
    }

    /**
     * Display the specified ticket (Admin view).
     */
    public function show($ticket)
    {
        $ticket = Ticket::withTrashed()->find($ticket);
        if (! $ticket) {
            abort(404, 'Ticket not found');
        }

        $ticket->load([
            'client:id,name',
            'organizationUser:id,name,email',
            'assignedTo:id,name',
            'approvedBy:id,name',
            'createdBy:id,name',
            'attachments',
            'tasks' => function ($query) {
                $query->with(['assignedUsers:id,name', 'assignedDepartment:id,name', 'createdBy:id,name'])
                    ->latest('created_at');
            },
        ]);

        return Inertia::render('admin/tickets/Show', [
            'ticket' => $ticket,
        ]);
    }

    public function getTicketData(Ticket $ticket, WorkingHoursService $workingHoursService): JsonResponse
    {
        $ticket->load([
            'client',
            'organizationUser',
            'assignedTo',
            'approvedBy',
            'attachments',
            'tasks' => function ($query) {
                $query->with(['assignedUsers', 'assignedDepartment', 'createdBy'])
                    ->latest('created_at');
            },
        ]);

        $workingHoursConfig = $workingHoursService->getWorkingHoursConfig();
        $holidaysConfig = $workingHoursService->getHolidaysConfig();

        return response()->json([
            'ticket' => $ticket,
            'working_hours' => $workingHoursConfig,
            'holidays' => $holidaysConfig['holidays'] ?? [],
        ]);
    }

    /**
     * Show the form for creating a new ticket (Admin can create on behalf of clients).
     */
    public function create()
    {
        $clients = Client::with(['organizationUsers'])
            ->where('status', 'active')
            ->get();

        return Inertia::render('admin/tickets/Create', [
            'clients' => $clients,
        ]);
    }

    /**
     * Store a newly created ticket in storage (Admin can create for any client).
     */
    public function store(StoreAdminTicketRequest $request, TicketNumberGenerator $ticketNumberGenerator): RedirectResponse
    {
        $validated = $request->validated();

        try {
            $newTicket = DB::transaction(function () use ($request, $validated, $ticketNumberGenerator): Ticket {
                $client = Client::query()
                    ->lockForUpdate()
                    ->findOrFail($validated['client_id']);

                $ticket = Ticket::create([
                    'client_id' => $client->id,
                    'organization_user_id' => null,
                    'created_by' => Auth::id(),
                    'ticket_number' => $ticketNumberGenerator->generateForClient($client),
                    'title' => $validated['title'],
                    'description' => $validated['description'] ?? null,
                    'category' => 'technical',
                    'priority' => $validated['priority'] ?? 'low',
                    'status' => 'open',
                ]);

                foreach ($request->file('attachments', []) as $file) {
                    $path = $file->store('ticket-attachments', 'public');

                    TicketAttachment::create([
                        'ticket_id' => $ticket->id,
                        'file_path' => $path,
                        'file_type' => $file->getClientMimeType(),
                    ]);
                }

                return $ticket;
            }, 3);

            return redirect()->route('admin.tickets.show', $newTicket->id)
                ->with('success', 'Ticket created successfully');
        } catch (\Throwable $exception) {
            report($exception);

            return back()
                ->withErrors(['error' => 'The ticket could not be created. Please try again.'])
                ->withInput();
        }
    }

    /**
     * Show the form for editing the specified ticket.
     */
    public function edit(Request $request, $ticket_id)
    {
        $ticket = Ticket::with(['client', 'organizationUser'])->find($ticket_id);
        if (! $ticket) {
            abort(404, 'Ticket not found');
        }

        $clients = Client::with('organizationUsers')
            ->where('status', 'active')
            ->get();

        $users = User::where('status', 'active')->get();

        return Inertia::render('admin/tickets/Edit', [
            'ticket' => $ticket,
            'clients' => $clients,
            'users' => $users,
        ]);
    }

    /**
     * Update the specified ticket in storage.
     */
    public function update(Request $request, $ticket_id)
    {
        // Find the ticket
        $ticket = Ticket::find($ticket_id);
        if (! $ticket) {
            if ($request->expectsJson()) {
                return response()->json(['message' => 'Ticket not found'], 404);
            }
            abort(404, 'Ticket not found');
        }

        // Validate request
        $validated = $request->validate([
            'client_id' => 'required|integer|exists:clients,id',
            'organization_user_id' => 'nullable|integer|exists:organization_users,id',
            'ticket_number' => 'required|string|unique:tickets,ticket_number,'.$ticket_id,
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'priority' => 'required|in:low,medium,high,critical',
            'status' => 'required|in:open,approved,in-progress,closed,cancelled',
            'assigned_to' => 'nullable|integer|exists:users,id',
            'approved_by' => 'nullable|integer|exists:users,id',
        ]);

        $validated['client_id'] = (int) $validated['client_id'];
        $validated['organization_user_id'] = filled($validated['organization_user_id'] ?? null) ? (int) $validated['organization_user_id'] : null;
        $validated['assigned_to'] = filled($validated['assigned_to'] ?? null) ? (int) $validated['assigned_to'] : null;
        $validated['approved_by'] = filled($validated['approved_by'] ?? null) ? (int) $validated['approved_by'] : null;

        $previousStatus = $ticket->status;
        $organizationUser = null;

        if ($validated['organization_user_id'] !== null) {
            $organizationUser = OrganizationUser::where('id', $validated['organization_user_id'])
                ->where('client_id', $validated['client_id'])
                ->first();

            if (! $organizationUser) {
                $message = 'Organization user does not belong to the specified organization';
                if ($request->expectsJson()) {
                    return response()->json([
                        'message' => $message,
                    ], 422);
                }

                return back()
                    ->withErrors(['organization_user_id' => $message])
                    ->withInput();
            }
        }

        // Validate that assigned users are active and valid for update
        $assignedUser = null;

        if ($validated['assigned_to'] ?? null) {
            $assignedUser = User::find($validated['assigned_to']);
            if (! $assignedUser) {
                $message = 'Assigned user does not exist';
                if ($request->expectsJson()) {
                    return response()->json([
                        'message' => $message,
                    ], 422);
                }

                return back()
                    ->withErrors(['assigned_to' => $message])
                    ->withInput();
            }
        }

        if ($validated['approved_by'] ?? null) {
            $approvedUser = User::find($validated['approved_by']);
            if (! $approvedUser) {
                $message = 'Approving user does not exist';
                if ($request->expectsJson()) {
                    return response()->json([
                        'message' => $message,
                    ], 422);
                }

                return back()
                    ->withErrors(['approved_by' => $message])
                    ->withInput();
            }
        }

        $previousAssignedTo = $ticket->assigned_to;
        $currentUser = Auth::user();

        DB::beginTransaction();

        try {
            // Determine new status - change from 'open' to 'in-progress' when assigning
            $newStatus = $validated['status'];
            if ($ticket->status === 'open' && $validated['assigned_to'] && $previousAssignedTo !== $validated['assigned_to']) {
                $newStatus = 'in-progress';
            }

            $ticket->update([
                'client_id' => $validated['client_id'],
                'organization_user_id' => $validated['organization_user_id'],
                'ticket_number' => $validated['ticket_number'],
                'title' => $validated['title'],
                'description' => $validated['description'],
                'priority' => $validated['priority'],
                'status' => $newStatus,
                'assigned_to' => $validated['assigned_to'],
                'approved_by' => $validated['approved_by'],
            ]);

            if ($previousStatus !== $newStatus) {
                $this->recordTicketStatusHistory($ticket, $previousStatus, $newStatus, $currentUser->id);
            }

            if ($previousAssignedTo !== $validated['assigned_to']) {
                $this->syncTicketAssignmentFromEdit(
                    $ticket->fresh(['tasks.taskAssignments']),
                    $assignedUser ?? null,
                    $previousAssignedTo,
                    $currentUser
                );
            }

            DB::commit();

            if ($previousStatus !== $newStatus) {
                $this->notificationService->sendTicketStatusChangeExternalNotification(
                    $ticket->id,
                    $ticket->title,
                    $newStatus,
                    $currentUser->id
                );
            }
        } catch (\Exception $e) {
            DB::rollBack();

            if ($request->expectsJson()) {
                return response()->json([
                    'message' => 'Failed to update ticket assignment workflow',
                    'error' => $e->getMessage(),
                ], 500);
            }

            return back()
                ->withErrors(['error' => 'Failed to update ticket assignment workflow: '.$e->getMessage()])
                ->withInput();
        }

        if ($request->expectsJson()) {
            return response()->json([
                'message' => 'Ticket updated successfully',
                'ticket' => $ticket->load(['client', 'organizationUser']),
            ], 200);
        }

        return redirect()
            ->route('admin.tickets.show', $ticket->id)
            ->with('success', 'Ticket updated successfully');
    }

    private function syncTicketAssignmentFromEdit(Ticket $ticket, ?User $assignedUser, ?int $previousAssignedTo, User $currentUser): void
    {
        $task = $ticket->tasks()->latest('created_at')->first();
        $shouldCreateNewTask = $task && in_array($task->state, ['Done', 'Cancelled', 'Rejected'], true);

        if (! $assignedUser) {
            if ($task) {
                $task->activeTaskAssignments()->update(['is_active' => false]);
                $task->update([
                    'current_owner_id' => null,
                    'current_owner_kind' => null,
                    'state' => $task->state === 'Assigned' ? 'Draft' : $task->state,
                ]);
            }

            TicketHistory::create([
                'ticket_id' => $ticket->id,
                'old_status' => $previousAssignedTo ? 'Assigned user: '.$previousAssignedTo : 'Unassigned',
                'new_status' => 'Ticket unassigned',
                'changed_by' => $currentUser->id,
                'created_at' => Carbon::now(),
            ]);

            return;
        }

        if ($shouldCreateNewTask) {
            $task = null;
        }

        if (! $task) {
            $task = Task::create([
                'ticket_id' => $ticket->id,
                'title' => $ticket->title,
                'description' => $ticket->description,
                'sla_policy_id' => $this->findMatchingSlaPolicyForTicket($ticket)?->id,
                'state' => 'Assigned',
                'created_by' => $currentUser->id,
                'task_code' => 'TSK-'.$ticket->ticket_number.'-'.Str::random(4),
                'current_owner_id' => $assignedUser->id,
                'current_owner_kind' => 'USER',
                'start_at' => now(),
            ]);
        } else {
            $task->activeTaskAssignments()->update(['is_active' => false]);
            $task->update([
                'title' => $ticket->title,
                'description' => $ticket->description,
                'sla_policy_id' => $task->sla_policy_id ?: $this->findMatchingSlaPolicyForTicket($ticket)?->id,
                'current_owner_id' => $assignedUser->id,
                'current_owner_kind' => 'USER',
            ]);
        }

        if (! $task->isAssignedToUser($assignedUser->id)) {
            $task->assignUser(
                $assignedUser->id,
                $currentUser->id,
                $previousAssignedTo ? 'Reassigned from ticket edit' : 'Assigned from ticket edit'
            );
        }

        TicketHistory::create([
            'ticket_id' => $ticket->id,
            'old_status' => $previousAssignedTo ? 'Assigned user: '.$previousAssignedTo : 'Unassigned',
            'new_status' => 'Ticket assigned to '.$assignedUser->name,
            'changed_by' => $currentUser->id,
            'created_at' => Carbon::now(),
        ]);

        Notification::createWorkflowNotification(
            $assignedUser->id,
            'ticket_assigned',
            $previousAssignedTo ? 'Ticket Reassigned' : 'New Ticket Assignment',
            $previousAssignedTo
            ? "Ticket #{$ticket->ticket_number} has been reassigned to you: {$ticket->title}"
            : "You have been assigned ticket #{$ticket->ticket_number}: {$ticket->title}",
            [
                'ticket_id' => $ticket->id,
                'ticket_number' => $ticket->ticket_number,
                'task_id' => $task->id,
                'task_title' => $task->title,
                'assigned_by' => $currentUser->id,
                'assigned_by_name' => $currentUser->name,
            ]
        );

        // Send external notification (SMS/Email) to the assigned user
        $this->notificationService->sendTicketAssignmentExternalNotification(
            $ticket->id,
            $ticket->title,
            $assignedUser->id,
            $currentUser->id
        );
    }

    private function recordTicketStatusHistory(Ticket $ticket, ?string $oldStatus, string $newStatus, ?int $changedBy): void
    {
        TicketHistory::create([
            'ticket_id' => $ticket->id,
            'old_status' => $oldStatus,
            'new_status' => $newStatus,
            'action_type' => $newStatus === 'closed' ? 'closed' : 'status',
            'changed_by' => $changedBy,
            'created_at' => Carbon::now(),
        ]);
    }

    private function findMatchingSlaPolicyForTicket(Ticket $ticket): ?SlaPolicy
    {
        $ticketPriorityToSlaPriority = [
            'critical' => 'P1',
            'high' => 'P2',
            'medium' => 'P3',
            'low' => 'P4',
        ];

        $mappedSlaPriority = $ticketPriorityToSlaPriority[$ticket->priority] ?? 'P4';
        $mappedSlaPriorityRank = match ($mappedSlaPriority) {
            'P1' => 1,
            'P2' => 2,
            'P3' => 3,
            default => 4,
        };

        return SlaPolicy::where('is_active', true)
            ->orderByRaw(
                "ABS((CASE priority WHEN 'P1' THEN 1 WHEN 'P2' THEN 2 WHEN 'P3' THEN 3 WHEN 'P4' THEN 4 ELSE 5 END) - ?)",
                [$mappedSlaPriorityRank]
            )
            ->orderByRaw("CASE priority WHEN 'P1' THEN 1 WHEN 'P2' THEN 2 WHEN 'P3' THEN 3 WHEN 'P4' THEN 4 ELSE 5 END")
            ->first();
    }

    /**
     * Remove the specified ticket from storage.
     */
    public function destroy(Request $request, $ticket_id)
    {
        $forceDelete = $request->input('force_delete', false);

        if (! $forceDelete) {
            $ticket = Ticket::with('tasks')->find($ticket_id);
            if (! $ticket) {
                return response()->json(['message' => 'Ticket not found'], 404);
            }
            $hasPendingTasks = $ticket->tasks->contains(function ($task) {
                return in_array($task->status, ['pending', 'in-progress']);
            });

            if ($hasPendingTasks) {
                return response()->json([
                    'message' => 'Cannot delete ticket: There are pending or in-progress tasks associated with this ticket.',
                ], 422);
            }
            $ticket->delete();

            return $this->show($ticket->id);
        } else {
            $ticket = Ticket::with('tasks')->onlyTrashed()->find($ticket_id);
            if (! $ticket) {
                return response()->json(['message' => 'Deleted Ticket not found'], 404);
            }
            $ticket->comments()->delete();
            $ticket->attachments()->delete();
            $ticket->tasks()->delete();
            $ticket->forceDelete();

            return response()->json(['message' => 'Ticket permanently deleted successfully'], 200);
        }
    }

    /**
     * Restore soft-deleted ticket.
     */
    public function restore(Request $request, $ticket_id)
    {
        $ticket = Ticket::onlyTrashed()->find($ticket_id);
        if (! $ticket) {
            return response()->json(['message' => 'Ticket not found'], 404);
        }
        $ticket->restore();

        // redirect to ticket details page after restore but not as json
        return $this->show($ticket->id);
    }

    /**
     * Get all tickets for approval by admin.
     */
    public function getTicketsForApproval(Request $request)
    {
        $user = User::find(Auth::user()->id);

        if (! $user->hasPermission('ticket.approve')) {
            return response()->json(['message' => 'Insufficient permissions'], 403);
        }

        $query = Ticket::where('status', 'open')
            ->with(['client', 'organizationUser']);

        // Filter by client's department if they are in one
        $userDepartments = $user->departments;
        if ($userDepartments->count() > 0) {
            // For now, show all open tickets to users with approval permissions
            // This can be enhanced to filter by department-specific tickets
        }

        $tickets = $query->latest('created_at')->paginate(15);

        return response()->json([
            'tickets' => $tickets,
            'user_departments' => $userDepartments,
        ]);
    }

    /**
     * Approve ticket and create tasks (Admin only).
     */
    public function approve(Ticket $ticket)
    {
        $user = User::find(Auth::user()->id);

        if (! $user->hasPermission('ticket.approve')) {
            return response()->json(['message' => 'Insufficient permissions to approve tickets'], 403);
        }

        if (! $ticket) {
            return response()->json(['message' => 'Ticket not found'], 404);
        }

        // Validate ticket can be approved
        if ($ticket->status !== 'open') {
            return response()->json(['message' => 'Ticket cannot be approved in current status'], 422);
        }

        try {
            $previousStatus = $ticket->status;

            $ticket->update([
                'status' => 'approved',
                'approved_by' => $user->id,
                'approved_at' => now(),
            ]);

            $this->recordTicketStatusHistory($ticket, $previousStatus, 'approved', $user->id);

            // Send notifications
            $this->sendApprovalNotifications($ticket, $user);
            $this->notificationService->sendTicketStatusChangeExternalNotification(
                $ticket->id,
                $ticket->title,
                'approved',
                $user->id
            );

            return response()->json([
                'message' => 'Ticket approved successfully',
                'ticket' => $ticket->fresh(['client', 'organizationUser']),
            ], 201);

        } catch (\Exception $e) {
            DB::rollback();

            return response()->json([
                'message' => 'Something went wrong',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Reject ticket (Admin only).
     */
    public function reject(Request $request, $ticket_id)
    {
        $user = User::find(Auth::user()->id);

        if (! $user->hasPermission('ticket.approve')) {
            return response()->json(['message' => 'Insufficient permissions to reject tickets'], 403);
        }

        $ticket = Ticket::find($ticket_id);
        if (! $ticket) {
            return response()->json(['message' => 'Ticket not found'], 404);
        }

        $previousStatus = $ticket->status;

        $validated = $request->validate([
            'rejection_reason' => 'required|string|max:1000',
        ]);

        $ticket->update([
            'status' => 'rejected',
            'rejection_reason' => $validated['rejection_reason'],
            'rejected_by' => $user->id,
            'rejected_at' => now(),
        ]);

        if ($previousStatus !== 'rejected') {
            $this->recordTicketStatusHistory($ticket, $previousStatus, 'rejected', $user->id);

            $this->notificationService->sendTicketStatusChangeExternalNotification(
                $ticket->id,
                $ticket->title,
                'rejected',
                $user->id
            );
        }

        return response()->json([
            'message' => 'Ticket rejected successfully',
            'ticket' => $ticket,
        ]);
    }

    /**
     * Update ticket status (Admin only).
     */
    public function updateStatus(Request $request, $ticket_id)
    {
        $user = User::find(Auth::user()->id);

        if (! $user->hasPermission('ticket.update')) {
            return response()->json(['message' => 'Insufficient permissions'], 403);
        }

        $ticket = Ticket::find($ticket_id);
        if (! $ticket) {
            return response()->json(['message' => 'Ticket not found'], 404);
        }

        $previousStatus = $ticket->status;

        $validated = $request->validate([
            'status' => 'required|in:open,approved,in-progress,closed,cancelled,rejected',
        ]);

        $ticket->update([
            'status' => $validated['status'],
        ]);

        if ($previousStatus !== $validated['status']) {
            $this->recordTicketStatusHistory($ticket, $previousStatus, $validated['status'], $user->id);

            $this->notificationService->sendTicketStatusChangeExternalNotification(
                $ticket->id,
                $ticket->title,
                $validated['status'],
                $user->id
            );
        }

        return response()->json([
            'message' => 'Ticket status updated successfully',
            'ticket' => $ticket,
        ]);

    }

    /**
     * Check if all tasks are completed before closing/cancelling/rejecting a ticket.
     * Returns task details and completion status.
     */
    public function checkTaskStatus(Request $request, $ticket_id)
    {
        $ticket = Ticket::with([
            'tasks' => function ($query) {
                $query->with(['assignedUsers', 'assignedDepartment'])
                    ->withCount([
                        'comments',
                        'history',
                        'timeEntries',
                        'auditEvents',
                        'attachments',
                        'forwardings',
                    ]);
            },
        ])->find($ticket_id);

        if (! $ticket) {
            return response()->json(['message' => 'Ticket not found'], 404);
        }

        $tasks = $ticket->tasks;

        // Define terminal states that allow ticket closure
        $terminalStates = ['Done', 'Cancelled', 'Rejected'];

        // Get incomplete tasks (tasks not in terminal states)
        $incompleteTasks = $tasks->filter(function ($task) use ($terminalStates) {
            return ! in_array($task->state, $terminalStates);
        });

        // Format task details for response
        $taskDetails = $tasks->map(function ($task) {
            $assignees = $task->assignedUsers->map(function ($user) {
                return [
                    'id' => $user->id,
                    'name' => $user->name,
                ];
            });

            $activityCount = (int) ($task->comments_count ?? 0)
                + (int) ($task->history_count ?? 0)
                + (int) ($task->time_entries_count ?? 0)
                + (int) ($task->audit_events_count ?? 0)
                + (int) ($task->attachments_count ?? 0)
                + (int) ($task->forwardings_count ?? 0);

            return [
                'id' => $task->id,
                'task_code' => $task->task_code,
                'title' => $task->title,
                'state' => $task->state,
                'due_at' => $task->due_at,
                'assignees' => $assignees,
                'assigned_department' => $task->assignedDepartment ? [
                    'id' => $task->assignedDepartment->id,
                    'name' => $task->assignedDepartment->name,
                ] : null,
                'is_completed' => in_array($task->state, ['Done', 'Cancelled', 'Rejected']),
                'activity_count' => $activityCount,
            ];
        });

        $canClose = $incompleteTasks->isEmpty();

        $taskActivityTasks = $taskDetails
            ->filter(fn ($task) => ($task['activity_count'] ?? 0) > 0)
            ->values();

        return response()->json([
            'can_close' => $canClose,
            'total_tasks' => $tasks->count(),
            'completed_tasks' => $tasks->filter(function ($task) use ($terminalStates) {
                return in_array($task->state, $terminalStates);
            })->count(),
            'incomplete_tasks' => $incompleteTasks->count(),
            'tasks' => $taskDetails,
            'has_task_activity' => $taskActivityTasks->isNotEmpty(),
            'task_activity_task_count' => $taskActivityTasks->count(),
            'task_activity_tasks' => $taskActivityTasks->map(function ($task) {
                return [
                    'id' => $task['id'],
                    'task_code' => $task['task_code'],
                    'title' => $task['title'],
                    'activity_count' => $task['activity_count'],
                ];
            }),
            'incomplete_task_details' => $incompleteTasks->map(function ($task) {
                $primaryAssignee = $task->assignedUsers->first();

                return [
                    'id' => $task->id,
                    'task_code' => $task->task_code,
                    'title' => $task->title,
                    'state' => $task->state,
                    'due_at' => $task->due_at,
                    'assignee_name' => $primaryAssignee ? $primaryAssignee->name : ($task->assignedDepartment ? $task->assignedDepartment->name : 'Unassigned'),
                    'assignee_id' => $primaryAssignee ? $primaryAssignee->id : null,
                ];
            }),
        ]);
    }

    /**
     * Get all tickets (Admin API).
     */
    public function getAllTickets(Request $request)
    {
        $query = Ticket::with(['client', 'organizationUser']);

        // Apply filters
        if ($request->has('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        if ($request->has('priority') && $request->priority !== 'all') {
            $query->where('priority', $request->priority);
        }

        $tickets = $query->latest('created_at')->paginate(15);

        return response()->json($tickets, 200);
    }

    /**
     * Export tickets as CSV.
     */
    public function exportTickets(ExportTicketsRequest $request): StreamedResponse
    {
        $validated = $request->validated();
        $startDate = Carbon::parse($validated['start_date'])->startOfDay();
        $endDate = Carbon::parse($validated['end_date'])->endOfDay();

        $query = Ticket::withTrashed()
            ->with([
                'client:id,name',
                'assignedTo:id,name',
                'createdBy:id,name',
            ])
            ->withCount(['tasks', 'comments', 'attachments'])
            ->whereBetween('created_at', [$startDate, $endDate])
            ->whereIn('status', $validated['statuses']);

        if (! empty($validated['client_id'])) {
            $query->where('client_id', $validated['client_id']);
        }

        if (! empty($validated['priority'])) {
            $query->where('priority', $validated['priority']);
        }

        if (! empty($validated['search'])) {
            $searchTerm = $validated['search'];
            $query->where(function ($q) use ($searchTerm) {
                $q->where('title', 'like', "%{$searchTerm}%")
                    ->orWhere('ticket_number', 'like', "%{$searchTerm}%")
                    ->orWhere('description', 'like', "%{$searchTerm}%")
                    ->orWhereHas('client', function ($clientQuery) use ($searchTerm) {
                        $clientQuery->where('name', 'like', "%{$searchTerm}%");
                    });
            });
        }

        $tickets = $query
            ->orderBy('created_at')
            ->orderBy('id')
            ->get();

        $statusCounts = collect($validated['statuses'])
            ->mapWithKeys(fn (string $status): array => [
                $status => $tickets->where('status', $status)->count(),
            ]);
        $priorityCounts = collect(['low', 'medium', 'high', 'critical'])
            ->mapWithKeys(fn (string $priority): array => [
                $priority => $tickets->where('priority', $priority)->count(),
            ]);
        $summary = [
            'total_tickets' => $tickets->count(),
            'unique_clients' => $tickets->pluck('client_id')->filter()->unique()->count(),
            'assigned_tickets' => $tickets->whereNotNull('assigned_to')->count(),
            'unassigned_tickets' => $tickets->whereNull('assigned_to')->count(),
        ];

        $columnDefinitions = [
            'ticket_number' => ['Ticket Number', fn (Ticket $ticket): string => $ticket->ticket_number],
            'title' => ['Title', fn (Ticket $ticket): string => $ticket->title],
            'client' => ['Client', fn (Ticket $ticket): string => $ticket->client?->name ?? 'Unknown'],
            'description' => ['Description', fn (Ticket $ticket): string => $ticket->description ?? ''],
            'category' => ['Category', fn (Ticket $ticket): string => Str::headline($ticket->category ?? '')],
            'priority' => ['Priority', fn (Ticket $ticket): string => Str::headline($ticket->priority)],
            'status' => ['Status', fn (Ticket $ticket): string => Str::headline($ticket->status)],
            'assigned_to' => ['Assigned To', fn (Ticket $ticket): string => $ticket->assignedTo?->name ?? 'Unassigned'],
            'created_by' => ['Created By', fn (Ticket $ticket): string => $ticket->createdBy?->name ?? 'Unknown'],
            'created_at' => ['Created At', fn (Ticket $ticket): string => $ticket->created_at?->toDateTimeString() ?? ''],
            'tasks_count' => ['Tasks Count', fn (Ticket $ticket): int => $ticket->tasks_count],
            'comments_count' => ['Comments Count', fn (Ticket $ticket): int => $ticket->comments_count],
            'attachments_count' => ['Attachments Count', fn (Ticket $ticket): int => $ticket->attachments_count],
        ];
        $selectedColumns = collect($validated['columns'])
            ->mapWithKeys(fn (string $column): array => [$column => $columnDefinitions[$column]]);

        $filename = sprintf('consolidated_tickets_%s_to_%s.csv', $validated['start_date'], $validated['end_date']);

        $headers = [
            'Content-type' => 'text/csv',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
            'Pragma' => 'no-cache',
            'Cache-Control' => 'must-revalidate, post-check=0, pre-check=0',
            'Expires' => '0',
        ];

        $callback = function () use ($tickets, $validated, $summary, $statusCounts, $priorityCounts, $selectedColumns): void {
            $file = fopen('php://output', 'w');

            fputcsv($file, ['Consolidated Tickets Report']);
            fputcsv($file, ['Start Date', $validated['start_date']]);
            fputcsv($file, ['End Date', $validated['end_date']]);
            fputcsv($file, ['Selected Statuses', collect($validated['statuses'])->map(fn (string $status): string => Str::headline($status))->implode(', ')]);
            fputcsv($file, ['Total Tickets', $summary['total_tickets']]);
            fputcsv($file, ['Unique Clients', $summary['unique_clients']]);
            fputcsv($file, ['Assigned Tickets', $summary['assigned_tickets']]);
            fputcsv($file, ['Unassigned Tickets', $summary['unassigned_tickets']]);
            fputcsv($file, []);

            fputcsv($file, ['Tickets by Status']);
            fputcsv($file, ['Status', 'Count']);
            foreach ($statusCounts as $status => $count) {
                fputcsv($file, [Str::headline($status), $count]);
            }

            fputcsv($file, []);
            fputcsv($file, ['Tickets by Priority']);
            fputcsv($file, ['Priority', 'Count']);
            foreach ($priorityCounts as $priority => $count) {
                fputcsv($file, [Str::headline($priority), $count]);
            }

            fputcsv($file, []);
            fputcsv($file, ['Ticket Details']);
            fputcsv($file, $selectedColumns->pluck(0)->all());

            foreach ($tickets as $ticket) {
                $row = $selectedColumns
                    ->map(fn (array $definition) => $definition[1]($ticket))
                    ->map(fn (mixed $value): mixed => is_string($value) ? $this->sanitizeCsvValue($value) : $value)
                    ->all();

                fputcsv($file, $row);
            }

            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }

    private function sanitizeCsvValue(string $value): string
    {
        if (preg_match('/^[=+\-@]/', ltrim($value)) === 1) {
            return "'".$value;
        }

        return $value;
    }

    /**
     * Send notifications for ticket approval and task creation.
     */
    private function sendApprovalNotifications($ticket, $approver)
    {
        // Notify superadmin about ticket approval
        $superAdmins = User::whereHas('roles', function ($query) {
            $query->where('slug', 'super-admin');
        })->get();

        foreach ($superAdmins as $admin) {
            Notification::createWorkflowNotification(
                $admin->id,
                'ticket_approved',
                'Ticket Approved',
                "Ticket #{$ticket->ticket_number} has been approved by {$approver->name}.",
                [
                    'ticket_id' => $ticket->id,
                    'approved_by' => $approver->id,
                ]
            );
        }
    }

    /**
     * Assign ticket to a user
     *
     * @return JsonResponse
     */
    public function assignTicket(Request $request, Ticket $ticket)
    {
        $currentUser = User::find(Auth::user()->id);

        // Check permissions
        if (! $currentUser->hasPermission('ticket.assign')) {
            return response()->json(['message' => 'Insufficient permissions to assign ticket'], 403);
        }

        // Validate request
        $validated = $request->validate([
            'assignedTo' => 'required|integer|exists:users,id',
            'task' => 'nullable|array',
            'task.title' => 'nullable|string|max:255',
            'task.description' => 'nullable|string',
            'task.start_at' => 'nullable|date',
            'task.due_at' => 'nullable|date|after_or_equal:task.start_at',
            'task.estimate_hours' => 'nullable|numeric|min:0',
            'task.assignment_notes' => 'nullable|string|max:1000',
            'task.sla_policy_id' => 'nullable|integer|exists:sla_policies,id',
        ]);

        $assignedUserId = $validated['assignedTo'];
        $assignedUser = User::find($assignedUserId);
        $taskInput = $validated['task'] ?? [];

        // Check if ticket can be assigned based on status
        if (! in_array($ticket->status, ['open', 'approved', 'in-progress'])) {
            return response()->json([
                'message' => 'Ticket cannot be assigned in current status',
                'current_status' => $ticket->status,
            ], 422);
        }

        // Check if the user being assigned is active (assuming users have status field)
        if ($assignedUser && isset($assignedUser->status) && $assignedUser->status !== 'active') {
            return response()->json(['message' => 'Cannot assign ticket to inactive user'], 422);
        }

        // Prevent self-assignment if not allowed
        if ($assignedUserId == $currentUser->id) {
            return response()->json(['message' => 'Cannot assign ticket to yourself'], 422);
        }

        try {
            DB::beginTransaction();

            $ticketPriorityToSlaPriority = [
                'critical' => 'P1',
                'high' => 'P2',
                'medium' => 'P3',
                'low' => 'P4',
            ];

            $mappedSlaPriority = $ticketPriorityToSlaPriority[$ticket->priority] ?? 'P4';
            $mappedSlaPriorityRank = match ($mappedSlaPriority) {
                'P1' => 1,
                'P2' => 2,
                'P3' => 3,
                default => 4,
            };

            $matchedSlaPolicy = SlaPolicy::where('is_active', true)
                ->orderByRaw(
                    "ABS((CASE priority WHEN 'P1' THEN 1 WHEN 'P2' THEN 2 WHEN 'P3' THEN 3 WHEN 'P4' THEN 4 ELSE 5 END) - ?)",
                    [$mappedSlaPriorityRank]
                )
                ->orderByRaw("CASE priority WHEN 'P1' THEN 1 WHEN 'P2' THEN 2 WHEN 'P3' THEN 3 WHEN 'P4' THEN 4 ELSE 5 END")
                ->first();

            $taskTitle = trim((string) ($taskInput['title'] ?? ''));
            if ($taskTitle === '') {
                $taskTitle = $ticket->title;
            }

            $taskDescription = $taskInput['description'] ?? $ticket->description;

            $hasStartAt = array_key_exists('start_at', $taskInput);
            $hasDueAt = array_key_exists('due_at', $taskInput);
            $hasEstimateHours = array_key_exists('estimate_hours', $taskInput);

            $taskStartAt = $hasStartAt ? $taskInput['start_at'] : null;
            $taskDueAt = $hasDueAt ? $taskInput['due_at'] : null;
            $taskEstimateHours = $hasEstimateHours ? $taskInput['estimate_hours'] : null;
            $taskSlaPolicyId = $taskInput['sla_policy_id'] ?? $matchedSlaPolicy?->id;
            $assignmentNotes = trim((string) ($taskInput['assignment_notes'] ?? ''));
            if ($assignmentNotes === '') {
                $assignmentNotes = 'Auto-assigned from Ticket';
            }

            // Store previous assigned user for history
            $previousAssignedTo = $ticket->assigned_to;
            $previousStatus = $ticket->status;

            // Determine new status - change from 'open' to 'in-progress' when assigned
            $newStatus = $ticket->status;
            if ($ticket->status === 'open') {
                $newStatus = 'in-progress';
            }

            // Update ticket assignment
            $ticket->update([
                'assigned_to' => $assignedUserId,
                'assigned_at' => now(),
                'status' => $newStatus,
            ]);

            if ($previousStatus !== $newStatus) {
                $this->recordTicketStatusHistory($ticket, $previousStatus, $newStatus, $currentUser->id);
            }

            $terminalStates = ['Done', 'Cancelled', 'Rejected'];

            $task = null;

            if ($previousAssignedTo) {
                $task = Task::query()
                    ->where('ticket_id', $ticket->id)
                    ->whereNotIn('state', $terminalStates)
                    ->latest('id')
                    ->first();
            }

            if (! $task) {
                // Create a Task for this ticket assignment
                $task = Task::create([
                    'ticket_id' => $ticket->id,
                    'title' => $taskTitle,
                    'description' => $taskDescription,
                    'sla_policy_id' => $taskSlaPolicyId,
                    'state' => 'Assigned',
                    'created_by' => $currentUser->id,
                    'task_code' => 'TSK-'.$ticket->ticket_number.'-'.Str::random(4),
                    'current_owner_id' => $assignedUserId,
                    'current_owner_kind' => 'USER',
                    'start_at' => $taskStartAt ?? now(),
                    'due_at' => $taskDueAt,
                    'estimate_hours' => $taskEstimateHours,
                ]);
            } else {
                $taskUpdatePayload = [
                    'current_owner_id' => $assignedUserId,
                    'current_owner_kind' => 'USER',
                    'sla_policy_id' => $taskSlaPolicyId ?? $task->sla_policy_id,
                    'title' => $taskTitle ?: $task->title,
                    'description' => $taskDescription ?? $task->description,
                ];

                if ($hasStartAt) {
                    $taskUpdatePayload['start_at'] = $taskStartAt;
                }

                if ($hasDueAt) {
                    $taskUpdatePayload['due_at'] = $taskDueAt;
                }

                if ($hasEstimateHours) {
                    $taskUpdatePayload['estimate_hours'] = $taskEstimateHours;
                }

                $task->update($taskUpdatePayload);

                $task->taskAssignments()->where('is_active', true)->update(['is_active' => false]);
            }

            // Assign user to task using the helper method in Task model
            $task->assignUser($assignedUserId, $currentUser->id, $assignmentNotes);

            // Create ticket history record
            TicketHistory::create([
                'ticket_id' => $ticket->id,
                'old_status' => 'Removed user: '.$previousAssignedTo,
                'new_status' => 'Ticket assigned to '.$assignedUser->name,
                'changed_by' => $currentUser->id,
                'created_at' => Carbon::now(),
            ]);

            Notification::createWorkflowNotification(
                $assignedUserId,
                'ticket_assigned',
                'New Ticket Assignment',
                "You have been assigned ticket #{$ticket->ticket_number}: {$ticket->title}",
                [
                    'ticket_id' => $ticket->id,
                    'ticket_number' => $ticket->ticket_number,
                    'assigned_by' => $currentUser->id,
                    'assigned_by_name' => $currentUser->name,
                ]
            );

            $this->notificationService->sendTicketAssignmentExternalNotification(
                $ticket->id,
                $ticket->title,
                $assignedUserId,
                $currentUser->id
            );

            DB::commit();

            if ($previousStatus !== $newStatus) {
                $this->notificationService->sendTicketStatusChangeExternalNotification(
                    $ticket->id,
                    $ticket->title,
                    $newStatus,
                    $currentUser->id
                );
            }

            return response()->json([
                'message' => 'Ticket assigned successfully',
                'ticket' => $ticket->load(['assignedTo']),
                'task' => [
                    'id' => $task->id,
                    'task_code' => $task->task_code,
                    'title' => $task->title,
                    'state' => $task->state,
                ],
                'assigned_user' => [
                    'id' => $assignedUser->id,
                    'name' => $assignedUser->name,
                    'email' => $assignedUser->email,
                ],
            ], 200);

        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'message' => 'Failed to assign ticket',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get ticket history for a specific ticket
     */
    public function getTicketHistory($ticket_id)
    {
        $ticket = Ticket::find($ticket_id);
        if (! $ticket) {
            return response()->json(['message' => 'Ticket not found'], 404);
        }

        $history = TicketHistory::where('ticket_id', $ticket_id)
            ->with([
                'changedBy' => function ($query) {
                    $query->select('id', 'name', 'email');
                },
            ])
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'ticket_id' => $ticket_id,
            'history' => $history,
        ], 200);
    }

    /**
     * Get the next ticket number for a specific client.
     */
    public function getNextTicketNumber($client_id)
    {
        $client = Client::find($client_id);
        if (! $client) {
            return response()->json(['message' => 'Client not found'], 404);
        }

        $clientName = strtolower(str_replace(' ', '', $client->name));
        $date = now()->format('Y-m-d'); // year-month-date
        $time = now()->format('H:i');  // hour-minute

        $baseCode = $clientName.'-'.$date.'-'.$time.'-';

        $latest = Ticket::where('ticket_number', 'LIKE', $baseCode.'%')
            ->orderBy('ticket_number', 'DESC')
            ->first();

        if ($latest) {
            $lastNum = intval(substr($latest->ticket_number, -3));
            $nextNum = str_pad($lastNum + 1, 3, '0', STR_PAD_LEFT);
        } else {
            $nextNum = '001';
        }

        $ticketNumber = $baseCode.$nextNum;

        return response()->json([
            'ticket_number' => $ticketNumber,
        ]);
    }
}
