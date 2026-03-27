<?php

namespace App\Http\Controllers;

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
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Inertia\Inertia;

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
    public function index(Request $request)
    {
        $query = Ticket::withTrashed()
            ->with(['client', 'organizationUser', 'assignedTo', 'approvedBy', 'tasks']);

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

        $tickets = $query->latest('created_at')->paginate(15);

        // Compute work status for each ticket
        $tickets->getCollection()->transform(function ($ticket) {
            $ticket->work_status = self::computeWorkStatus($ticket);

            return $ticket;
        });

        // Get clients for filter dropdown
        $clients = Client::select('id', 'name')->where('status', 'active')->get();

        return Inertia::render('admin/tickets/Index', [
            'tickets' => $tickets,
            'filters' => $request->only(['status', 'priority', 'client_id', 'search']),
            'clients' => $clients,
        ]);
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

        return Inertia::render('admin/tickets/Show', [
            'ticket' => $ticket,
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
    public function store(Request $request, TicketNumberGenerator $ticketNumberGenerator)
    {
        $validated = $request->validate([
            'client_id' => ['required', 'integer', 'exists:clients,id'],
            'organization_user_id' => ['required', 'integer', 'exists:organization_users,id'],
            'ticket_number' => ['nullable'],
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'priority' => ['required', 'in:low,medium,high,critical'],
            'status' => ['required', 'in:open,approved,in-progress,closed,cancelled'],
            'assigned_to' => ['nullable', 'integer', 'exists:users,id'],
            'approved_by' => ['nullable', 'integer', 'exists:users,id'],
        ]);

        // Validate that assigned users are active and valid
        if ($validated['assigned_to'] ?? null) {
            $assignedUser = User::find($validated['assigned_to']);
            if (! $assignedUser) {
                return back()->withErrors(['assigned_to' => 'Assigned user does not exist']);
            }
        }

        if ($validated['approved_by'] ?? null) {
            $approvedUser = User::find($validated['approved_by']);
            if (! $approvedUser) {
                return back()->withErrors(['approved_by' => 'Approving user does not exist']);
            }
        }

        try {
            $organizationUser = OrganizationUser::where('id', $validated['organization_user_id'])
                ->where('client_id', $validated['client_id'])
                ->first();

            if (! $organizationUser) {
                return back()->withErrors(['organization_user_id' => 'Organization user does not belong to the specified organization']);
            }
            $client = Client::find($validated['client_id']);
            if (! $client) {
                return back()->withErrors(['client_id' => 'Client not found']);
            }
            $TicketNum = $ticketNumberGenerator->generateForClient($client);

            $newTicket = Ticket::create([
                'client_id' => $validated['client_id'],
                'organization_user_id' => $validated['organization_user_id'],
                'ticket_number' => $TicketNum,
                'title' => $validated['title'],
                'description' => $validated['description'],
                'priority' => $validated['priority'],
                'status' => $validated['status'],
                'assigned_to' => $validated['assigned_to'] ?? null,
                'approved_by' => $validated['approved_by'] ?? null,
                'created_by' => Auth::user()->id,
            ]);

            // Handle Attachments
            if ($request->hasFile('attachments')) {
                foreach ($request->file('attachments') as $file) {
                    $path = $file->store('ticket-attachments', 'public');

                    TicketAttachment::create([
                        'ticket_id' => $newTicket->id,
                        'file_path' => $path,
                        'file_type' => $file->getClientMimeType(),
                    ]);
                }
            }

            return redirect()->route('admin.tickets.show', $newTicket->id)
                ->with('success', 'Ticket created successfully');

        } catch (\Exception $e) {
            return back()->withErrors(['error' => 'Something went wrong: '.$e->getMessage()]);
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
            'organization_user_id' => 'required|integer|exists:organization_users,id',
            'ticket_number' => 'required|string|unique:tickets,ticket_number,'.$ticket_id,
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'priority' => 'required|in:low,medium,high,critical',
            'status' => 'required|in:open,approved,in-progress,closed,cancelled',
            'assigned_to' => 'nullable|integer|exists:users,id',
            'approved_by' => 'nullable|integer|exists:users,id',
        ]);

        $validated['client_id'] = (int) $validated['client_id'];
        $validated['organization_user_id'] = (int) $validated['organization_user_id'];
        $validated['assigned_to'] = filled($validated['assigned_to'] ?? null) ? (int) $validated['assigned_to'] : null;
        $validated['approved_by'] = filled($validated['approved_by'] ?? null) ? (int) $validated['approved_by'] : null;

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

            if ($previousAssignedTo !== $validated['assigned_to']) {
                $this->syncTicketAssignmentFromEdit(
                    $ticket->fresh(['tasks.taskAssignments']),
                    $assignedUser ?? null,
                    $previousAssignedTo,
                    $currentUser
                );
            }

            DB::commit();
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
            $ticket->update([
                'status' => 'approved',
                'approved_by' => $user->id,
                'approved_at' => now(),
            ]);

            // Send notifications
            $this->sendApprovalNotifications($ticket, $user);

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

        $validated = $request->validate([
            'rejection_reason' => 'required|string|max:1000',
        ]);

        $ticket->update([
            'status' => 'rejected',
            'rejection_reason' => $validated['rejection_reason'],
            'rejected_by' => $user->id,
            'rejected_at' => now(),
        ]);

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

        $validated = $request->validate([
            'status' => 'required|in:open,approved,in-progress,closed,cancelled,rejected',
        ]);

        $ticket->update([
            'status' => $validated['status'],
        ]);

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
        $ticket = Ticket::with(['tasks.assignedUsers', 'tasks.assignedDepartment'])->find($ticket_id);

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
            ];
        });

        $canClose = $incompleteTasks->isEmpty();

        return response()->json([
            'can_close' => $canClose,
            'total_tasks' => $tasks->count(),
            'completed_tasks' => $tasks->filter(function ($task) use ($terminalStates) {
                return in_array($task->state, $terminalStates);
            })->count(),
            'incomplete_tasks' => $incompleteTasks->count(),
            'tasks' => $taskDetails,
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
            $taskStartAt = $taskInput['start_at'] ?? now();
            $taskDueAt = $taskInput['due_at'] ?? null;
            $taskEstimateHours = $taskInput['estimate_hours'] ?? null;
            $taskSlaPolicyId = $taskInput['sla_policy_id'] ?? $matchedSlaPolicy?->id;
            $assignmentNotes = trim((string) ($taskInput['assignment_notes'] ?? ''));
            if ($assignmentNotes === '') {
                $assignmentNotes = 'Auto-assigned from Ticket';
            }

            // Store previous assigned user for history
            $previousAssignedTo = $ticket->assigned_to;

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
                'start_at' => $taskStartAt,
                'due_at' => $taskDueAt,
                'estimate_hours' => $taskEstimateHours,
            ]);

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
