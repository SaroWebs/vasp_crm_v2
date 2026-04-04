<?php

namespace App\Http\Controllers;

use App\Models\Department;
use App\Models\Project;
use App\Models\ProjectPhase;
use App\Models\SlaPolicy;
use App\Models\Task;
use App\Models\TaskAttachment;
use App\Models\TaskAuditEvent;
use App\Models\TaskHistory;
use App\Models\TaskType;
use App\Models\Ticket;
use App\Models\User;
use App\Services\NotificationService;
use Carbon\Carbon;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;

class AdminTaskController extends Controller
{
    /**
     * Create a new controller instance.
     */
    public function __construct(
        protected NotificationService $notificationService
    ) {}

    /**
     * Display a listing of all tasks (Admin view).
     */
    public function index(Request $request)
    {
        $users = User::select('id', 'name')->where('status', 'active')->get();
        $departments = Department::select('id', 'name')->where('status', 'active')->get();

        return Inertia::render('admin/tasks/Index', [
            'filters' => $request->only(['state', 'priority', 'assigned_department_id', 'search', 'assigned_to']),
            'users' => $users,
            'departments' => $departments,
        ]);
    }

    public function getData(Request $request)
    {
        $perPage = $request->get('per_page', 5);
        $query = Task::withTrashed()
            ->with([
                'createdBy:id,name',
                'assignedDepartment:id,name',
                'assignedUsers:id,name',
                'ticket:id,ticket_number,title,client_id',
                'ticket.client:id,name',
                'taskType:id,name,code',
                'slaPolicy:id,name,priority',
                'parentTask:id,title,task_code',
                'childTasks:id,title,task_code',
                'auditEvents:id,task_id,action,actor_user_id,occurred_at',
            ]);

        if ($request->has('state') && $request->state !== 'all') {
            $query->where('state', $request->state);
        }

        if ($request->has('priority') && $request->priority !== 'all') {
            $query->whereHas('slaPolicy', function ($q) use ($request) {
                $q->where('priority', $request->priority);
            });
        }

        if ($request->has('assigned_department_id') && $request->assigned_department_id !== 'all') {
            $query->where('assigned_department_id', $request->assigned_department_id);
        }

        if ($request->has('assigned_to') && $request->assigned_to !== 'all') {
            $query->whereHas('assignedUsers', function ($q) use ($request) {
                $q->where('user_id', $request->assigned_to);
            });
        }

        if ($request->has('search') && ! empty($request->search)) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                    ->orWhere('task_code', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%")
                    ->orWhereHas('createdBy', function ($q) use ($search) {
                        $q->where('name', 'like', "%{$search}%");
                    })
                    ->orWhereHas('ticket', function ($q) use ($search) {
                        $q->where('title', 'like', "%{$search}%")
                            ->orWhere('ticket_number', 'like', "%{$search}%");
                    })
                    ->orWhereHas('taskType', function ($q) use ($search) {
                        $q->where('name', 'like', "%{$search}%")
                            ->orWhere('code', 'like', "%{$search}%");
                    });
            });
        }

        $tasks = $query->latest('created_at')->paginate($perPage);
        $stateCounts = Task::withTrashed()
            ->selectRaw('state, COUNT(*) as total')
            ->groupBy('state')
            ->pluck('total', 'state');

        $stats = [
            'total' => (int) $stateCounts->sum(),
            'draft' => (int) ($stateCounts->get('Draft') ?? 0),
            'assigned' => (int) ($stateCounts->get('Assigned') ?? 0),
            'in_progress' => (int) ($stateCounts->get('InProgress') ?? 0),
            'blocked' => (int) ($stateCounts->get('Blocked') ?? 0),
            'in_review' => (int) ($stateCounts->get('InReview') ?? 0),
            'done' => (int) ($stateCounts->get('Done') ?? 0),
            'cancelled' => (int) ($stateCounts->get('Cancelled') ?? 0),
            'rejected' => (int) ($stateCounts->get('Rejected') ?? 0),
        ];

        return response()->json([
            'tasks' => $tasks,
            'stats' => $stats,
        ]);
    }

    /**
     * Display the specified task (Admin view).
     */
    public function show($task)
    {
        $tsk = Task::withTrashed()
            ->with([
                'createdBy:id,name,email',
                'assignedDepartment:id,name',
                'assignedUsers:id,name,email',
                'taskType:id,name,code',
                'slaPolicy:id,name,priority',
                'parentTask:id,title,task_code',
                'childTasks:id,title,task_code',
                'ticket:id,ticket_number,title,client_id',
                'ticket.client:id,name',
                'comments',
                'comments.user:id,name',
                'attachments',
                'forwardings:id,from_user_id,to_user_id,to_department_id,remarks,status,forwarded_at,is_end_user,created_at',
                'forwardings.fromUser:id,name',
                'forwardings.toUser:id,name',
                'forwardings.toDepartment:id,name',
                'history:id,old_status,new_status,changed_by,created_at',
                'auditEvents.actorUser',
                'timeEntries',
                'taskAssignments',
                'dependencies',
                'timelineEvents',
            ])
            ->find($task);

        if (! $tsk) {
            abort(404, 'Task not found');
        }

        // Get current user with roles to check permissions
        $currentUser = User::with('roles')->find(Auth::user()->id);
        $isSuperAdmin = $currentUser && $currentUser->roles->contains('slug', 'super-admin');

        return Inertia::render('admin/tasks/Show', [
            'task' => $tsk,
            'authUser' => [
                'id' => Auth::user()->id,
                'is_super_admin' => $isSuperAdmin,
            ],
        ]);
    }

    /**
     * Get SLA policies filtered by task type.
     */
    public function getSlaPoliciesByTaskType(Request $request, $taskTypeId)
    {
        $user = User::find(Auth::user()->id);

        if (! $user->hasPermission('task.read')) {
            return response()->json(['message' => 'Insufficient permissions'], 403);
        }

        $taskType = TaskType::find($taskTypeId);
        if (! $taskType) {
            return response()->json(['message' => 'Task type not found'], 404);
        }

        $slaPolicies = SlaPolicy::where('is_active', true)
            ->where('task_type_id', $taskTypeId)
            ->orWhereNull('task_type_id') // General SLA policies (no specific task type)
            ->get();

        return response()->json([
            'sla_policies' => $slaPolicies,
        ]);
    }

    /**
     * Show a new task. the form for creating
     */
    public function create()
    {
        $user = User::find(Auth::id());
        if (! $user || ! $user->hasPermission('task.create')) {
            abort(403, 'Insufficient permissions to create tasks.');
        }

        $tickets = Ticket::with(['client:id,name', 'organizationUser:id,name'])
            ->select('id', 'ticket_number', 'title', 'client_id', 'organization_user_id')
            ->whereIn('status', ['approved', 'in-progress'])
            ->get();

        $parentTasks = Task::select('id', 'task_code', 'title')
            ->where('state', '!=', 'Done')
            ->get();

        $taskTypes = TaskType::where('is_active', true)->get();
        $slaPolicies = SlaPolicy::where('is_active', true)->get();
        $projects = Project::where('status', 'active')->get();

        $departments = Department::where('status', 'active')->get();

        $managers = User::whereHas('roles', function ($q) {
            $q->whereIn('slug', ['admin', 'manager', 'team-lead']);
        })->get();

        return Inertia::render('admin/tasks/Create', [
            'tickets' => $tickets,
            'parentTasks' => $parentTasks,
            'taskTypes' => $taskTypes,
            'slaPolicies' => $slaPolicies,
            'projects' => $projects,
            'departments' => $departments,
            'managers' => $managers,
        ]);
    }

    /**
     * Generate a unique task code
     */
    private function generateTaskCode(): string
    {
        $prefix = 'TASK';
        $timestamp = now()->format('YmdHis');
        $random = Str::upper(Str::random(4));

        return "{$prefix}-{$timestamp}-{$random}";
    }

    /**
     * Store a newly created task in storage.
     */
    public function store(Request $request)
    {
        $user = User::find(Auth::id());
        if (! $user || ! $user->hasPermission('task.create')) {
            return response()->json(['message' => 'Insufficient permissions'], 403);
        }

        // Parse JSON strings from FormData before validation
        $requestData = $request->all();

        // Parse tags if it's a JSON string
        if ($request->has('tags') && is_string($request->input('tags'))) {
            $tagsValue = $request->input('tags');
            if (! empty($tagsValue)) {
                $decodedTags = json_decode($tagsValue, true);
                if (json_last_error() === JSON_ERROR_NONE) {
                    $requestData['tags'] = $decodedTags;
                } else {
                    $requestData['tags'] = [];
                }
            } else {
                $requestData['tags'] = [];
            }
        }

        // Parse metadata if it's a JSON string
        if ($request->has('metadata') && is_string($request->input('metadata'))) {
            $metadataValue = $request->input('metadata');
            if (! empty($metadataValue)) {
                $decodedMetadata = json_decode($metadataValue, true);
                if (json_last_error() === JSON_ERROR_NONE) {
                    $requestData['metadata'] = $decodedMetadata;
                } else {
                    $requestData['metadata'] = [];
                }
            } else {
                $requestData['metadata'] = [];
            }
        }

        // Merge parsed data back into request
        $request->merge($requestData);

        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'task_code' => ['nullable', 'string', 'unique:tasks,task_code'],
            'ticket_id' => ['nullable', 'exists:tickets,id'],
            'parent_task_id' => ['nullable', 'exists:tasks,id'],
            'department_id' => ['nullable', 'exists:departments,id'],
            'task_type_id' => ['nullable', 'exists:task_types,id'],
            'sla_policy_id' => ['nullable', 'exists:sla_policies,id'],
            'project_id' => ['nullable', 'exists:projects,id'],
            'phase_id' => ['nullable', 'exists:project_phases,id'],
            'start_at' => ['nullable', 'date'],
            'due_at' => ['nullable', 'date'],
            'completed_at' => ['nullable', 'date'],
            'estimate_hours' => ['nullable', 'numeric'],
            'tags' => ['nullable', 'array'],
            'version' => ['nullable', 'integer'],
            'metadata' => ['nullable', 'array'],
            'completion_notes' => ['nullable', 'string'],
            'attachments' => ['nullable', 'array'],
            'attachments.*' => ['file', 'max:10240'], // 10MB max per file
            'assignments' => ['nullable', 'array'],
            'assignments.*.user_id' => ['required', 'exists:users,id'],
            'assignments.*.assignment_notes' => ['nullable', 'string'],
            'assignments.*.estimated_time' => ['nullable', 'numeric', 'min:0'],
            'assignments' => ['nullable', 'array'],
            'assignments.*.user_id' => ['required', 'exists:users,id'],
            'assignments.*.assignment_notes' => ['nullable', 'string'],
            'assignments.*.estimated_time' => ['nullable', 'numeric', 'min:0'],
        ]);

        // Set default assignment values since we're managing assignments separately
        $validated['current_owner_kind'] = 'UNASSIGNED';
        $validated['current_owner_id'] = null;
        $validated['assigned_department_id'] = null;

        try {
            if (empty($validated['task_code'])) {
                $validated['task_code'] = $this->generateTaskCode();
            }

            $validated['version'] = $validated['version'] ?? 1;

            $validated['state'] = ! empty($validated['assignments'] ?? []) ? 'Assigned' : 'Draft';

            $validated['current_owner_kind'] = $validated['current_owner_kind'] ?? 'UNASSIGNED';

            $validated['tags'] = $validated['tags'] ?? [];
            $validated['metadata'] = $validated['metadata'] ?? [];

            // Keep phase and project aligned for project-task creation workflows.
            if (! empty($validated['phase_id'])) {
                $phase = ProjectPhase::find($validated['phase_id']);

                if ($phase && ! empty($validated['project_id']) && (int) $phase->project_id !== (int) $validated['project_id']) {
                    return response()->json([
                        'message' => 'Selected phase does not belong to the selected project.',
                    ], 422);
                }

                if ($phase && empty($validated['project_id'])) {
                    $validated['project_id'] = $phase->project_id;
                }
            }

            if (empty($validated['sla_policy_id']) && ! empty($validated['task_type_id'])) {
                $taskType = TaskType::find($validated['task_type_id']);
                if ($taskType) {
                    // Find the highest priority SLA policy for this task type
                    $slaPolicy = SlaPolicy::where('task_type_id', $taskType->id)
                        ->where('is_active', true)
                        ->orderByRaw("CASE priority WHEN 'P1' THEN 1 WHEN 'P2' THEN 2 WHEN 'P3' THEN 3 WHEN 'P4' THEN 4 ELSE 5 END")
                        ->first();

                    if ($slaPolicy) {
                        $validated['sla_policy_id'] = $slaPolicy->id;
                    }
                }
            }

            // Auto-assign project based on task type if required
            if (empty($validated['project_id']) && ! empty($validated['task_type_id'])) {
                $taskType = TaskType::find($validated['task_type_id']);
                if ($taskType && $taskType->requires_project) {
                    // Find a default project for this task type
                    // This could be enhanced with more sophisticated logic
                    $defaultProject = Project::where('status', 'active')
                        ->where('department_id', $validated['department_id'] ?? null)
                        ->first();

                    if ($defaultProject) {
                        $validated['project_id'] = $defaultProject->id;
                    }
                }
            }

            // Set created_by to current user
            $validated['created_by'] = Auth::user()->id;

            // Start database transaction
            DB::beginTransaction();

            // Unset attachments and assignments before storing task data
            // Unset attachments and assignments before storing task data
            $attachmentsData = [];
            if ($request->hasFile('attachments')) {
                $attachmentsData = $request->file('attachments');
            }

            $assignmentsData = $validated['assignments'] ?? [];
            unset($validated['attachments']);

            $task = Task::create($validated);

            // Handle task assignments if provided
            if (! empty($assignmentsData)) {
                foreach ($assignmentsData as $assignment) {
                    $task->assignUser(
                        $assignment['user_id'],
                        Auth::user()->id,
                        $assignment['assignment_notes'] ?? 'Assigned during task creation',
                        $assignment['metadata'] ?? [],
                        $assignment['estimated_time'] ?? null
                    );

                    // Send external notification (SMS/Email) to the assigned user
                    $this->notificationService->sendTaskAssignmentExternalNotification(
                        $task->id,
                        $task->title,
                        $assignment['user_id'],
                        Auth::user()->id
                    );
                }
            }

            // Handle task attachments using Storage facade
            if (! empty($attachmentsData)) {
                foreach ($attachmentsData as $idx => $attachment) {
                    $originalName = $attachment->getClientOriginalName();
                    $fileExtension = $attachment->getClientOriginalExtension();
                    $timestamp = now()->format('Ymd_His');
                    $index = $idx + 1;
                    $taskCode = $task->task_code ?? 'TASK';

                    $baseName = "{$taskCode}_{$timestamp}_{$index}";
                    $uniqueName = $baseName.($fileExtension ? '.'.$fileExtension : '');

                    $filePath = Storage::disk('public')->putFileAs('task_attachments', $attachment, $uniqueName);

                    TaskAttachment::create([
                        'task_id' => $task->id,
                        'file_path' => $filePath,
                        'file_type' => $attachment->getClientMimeType(),
                        'uploaded_by' => Auth::user()->id,
                    ]);
                }
            }

            // Create initial task history record
            TaskHistory::create([
                'task_id' => $task->id,
                'old_status' => null,
                'new_status' => $task->state,
                'changed_by' => Auth::user()->id,
                'created_at' => Carbon::now(),
            ]);

            // Create initial audit event
            TaskAuditEvent::createEvent(
                $task->id,
                'TASK_CREATED',
                null,
                null,
                null,
                null,
                $task->current_owner_kind,
                $task->current_owner_id,
                null,
                'Task created by '.Auth::user()->name,
                null,
                Auth::user()->id
            );

            // Commit the transaction
            DB::commit();

            return response()->json([
                'message' => 'Task created successfully',
                'task' => $task->load([
                    'createdBy:id,name',
                    'assignedDepartment:id,name',
                    'ticket:id,ticket_number,title',
                    'taskType:id,name,code',
                    'slaPolicy:id,name,priority',
                    'attachments:id,task_id,file_path,file_type,uploaded_by,created_at',
                ]),
            ], 201);

        } catch (\Exception $e) {
            // Rollback the transaction on error
            DB::rollBack();

            // load create with err
            return response()->json([
                'message' => 'Something went wrong',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Show the form for editing the specified task.
     */
    public function edit(Request $request, $task_id)
    {
        $task = Task::with([
            'ticket:id,ticket_number,title,client_id',
            'ticket.client:id,name',
        ])->find($task_id);

        if (! $task) {
            abort(404, 'Task not found');
        }

        $tickets = Ticket::with(['client:id,name', 'organizationUser:id,name'])
            ->select('id', 'ticket_number', 'title', 'client_id', 'organization_user_id')
            ->whereIn('status', ['approved', 'in-progress'])
            ->get();

        $parentTasks = Task::select('id', 'task_code', 'title')
            ->where('id', '!=', $task_id) // Can't be parent of itself
            ->where('state', '!=', 'Done')
            ->get();

        $taskTypes = TaskType::where('is_active', true)->get();
        $slaPolicies = SlaPolicy::where('is_active', true)->get();
        $projects = Project::where('status', 'active')->get();

        return Inertia::render('admin/tasks/Edit', [
            'task' => $task,
            'tickets' => $tickets,
            'parentTasks' => $parentTasks,
            'taskTypes' => $taskTypes,
            'slaPolicies' => $slaPolicies,
            'projects' => $projects,
        ]);
    }

    /**
     * Update the specified task in storage.
     */
    public function update(Request $request, $task_id)
    {
        $task = Task::find($task_id);
        if (! $task) {
            return response()->json(['message' => 'Task not found'], 404);
        }

        // Parse JSON strings from FormData before validation
        $requestData = $request->all();

        // Parse tags if it's a JSON string
        if ($request->has('tags') && is_string($request->input('tags'))) {
            $tagsValue = $request->input('tags');
            if (! empty($tagsValue)) {
                $decodedTags = json_decode($tagsValue, true);
                if (json_last_error() === JSON_ERROR_NONE) {
                    $requestData['tags'] = $decodedTags;
                } else {
                    $requestData['tags'] = [];
                }
            } else {
                $requestData['tags'] = [];
            }
        }

        // Parse metadata if it's a JSON string
        if ($request->has('metadata') && is_string($request->input('metadata'))) {
            $metadataValue = $request->input('metadata');
            if (! empty($metadataValue)) {
                $decodedMetadata = json_decode($metadataValue, true);
                if (json_last_error() === JSON_ERROR_NONE) {
                    $requestData['metadata'] = $decodedMetadata;
                } else {
                    $requestData['metadata'] = [];
                }
            } else {
                $requestData['metadata'] = [];
            }
        }

        // Merge parsed data back into request
        $request->merge($requestData);

        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'task_code' => ['required', 'string', 'unique:tasks,task_code,'.$task_id],
            'ticket_id' => ['nullable', 'exists:tickets,id'],
            'parent_task_id' => ['nullable', 'exists:tasks,id'],
            'department_id' => ['nullable', 'exists:departments,id'],
            'current_owner_kind' => ['nullable', 'in:USER,DEPARTMENT,UNASSIGNED'],
            'current_owner_id' => ['nullable', 'integer'],
            'task_type_id' => ['nullable', 'exists:task_types,id'],
            'sla_policy_id' => ['nullable', 'exists:sla_policies,id'],
            'project_id' => ['nullable', 'exists:projects,id'],
            'phase_id' => ['nullable', 'exists:project_phases,id'],
            'due_at' => ['nullable', 'date'],
            'completed_at' => ['nullable', 'date'],
            'estimate_hours' => ['nullable', 'numeric'],
            'tags' => ['nullable', 'array'],
            'version' => ['nullable', 'integer'],
            'metadata' => ['nullable', 'array'],
            'completion_notes' => ['nullable', 'string'],
            'attachments' => ['nullable', 'array'],
            'attachments.*' => ['file', 'max:10240'],
        ]);

        // Prevent circular reference in parent task
        if ($validated['parent_task_id'] == $task_id) {
            return response()->json([
                'message' => 'Task cannot be parent of itself',
            ], 422);
        }

        if (! empty($validated['phase_id'])) {
            $phase = ProjectPhase::find($validated['phase_id']);

            if ($phase && ! empty($validated['project_id']) && (int) $phase->project_id !== (int) $validated['project_id']) {
                return response()->json([
                    'message' => 'Selected phase does not belong to the selected project.',
                ], 422);
            }

            if ($phase && empty($validated['project_id'])) {
                $validated['project_id'] = $phase->project_id;
            }
        }

        // Increment version for updates
        $validated['version'] = ($task->version ?? 0) + 1;

        $task->update($validated);

        // Handle task attachments using Storage facade
        $attachmentsData = [];
        if ($request->hasFile('attachments')) {
            $attachmentsData = $request->file('attachments');
        }

        if (! empty($attachmentsData)) {
            foreach ($attachmentsData as $idx => $attachment) {
                $originalName = $attachment->getClientOriginalName();
                $fileExtension = $attachment->getClientOriginalExtension();
                $timestamp = now()->format('Ymd_His');
                $index = $idx + 1;
                $taskCode = $task->task_code ?? 'TASK';

                $baseName = "{$taskCode}_{$timestamp}_{$index}";
                $uniqueName = $baseName.($fileExtension ? '.'.$fileExtension : '');

                $filePath = Storage::disk('public')->putFileAs('task_attachments', $attachment, $uniqueName);

                TaskAttachment::create([
                    'task_id' => $task->id,
                    'file_path' => $filePath,
                    'file_type' => $attachment->getClientMimeType(),
                    'uploaded_by' => Auth::user()->id,
                ]);
            }
        }

        return response()->json([
            'message' => 'Task updated successfully',
            'task' => $task->load([
                'createdBy:id,name',
                'assignedDepartment:id,name',
                'ticket:id,ticket_number,title',
                'taskType:id,name,code',
                'slaPolicy:id,name,priority',
                'auditEvents:id,task_id,action,actor_user_id,occurred_at',
            ]),
        ], 200);
    }

    /**
     * Update only task dates (start_at and due_at) for Gantt interactions.
     */
    public function updateDates(Request $request, $task_id)
    {
        $task = Task::find($task_id);
        if (! $task) {
            return response()->json(['message' => 'Task not found'], 404);
        }

        $validated = $request->validate([
            'start_at' => ['nullable', 'date'],
            'due_at' => ['nullable', 'date'],
        ]);

        // Update only the provided date fields
        if ($request->has('start_at')) {
            $task->start_at = $validated['start_at'];
        }
        if ($request->has('due_at')) {
            $task->due_at = $validated['due_at'];
        }

        $task->save();

        return response()->json([
            'message' => 'Task dates updated successfully',
            'task' => $task,
        ], 200);
    }

    /**
     * Remove the specified task from storage (soft delete).
     */
    public function destroy(Request $request, $task_id)
    {
        $task = Task::with('childTasks')->find($task_id);
        if (! $task) {
            return response()->json(['message' => 'Task not found'], 404);
        }

        // Check if task has child tasks that are not deleted
        if ($task->childTasks()->whereNull('deleted_at')->count() > 0) {
            return response()->json([
                'message' => 'Cannot delete task with active child tasks. Please delete or reassign child tasks first.',
            ], 422);
        }

        $task->delete();

        return response()->json([
            'message' => 'Task permanently deleted successfully',
        ]);
    }

    /**
     * Restore soft-deleted task.
     */
    public function restore(Request $request, $task_id)
    {
        $task = Task::onlyTrashed()->find($task_id);
        if (! $task) {
            return response()->json(['message' => 'Task not found'], 404);
        }
        $task->restore();

        return $this->show($task->id);
    }

    /**
     * Force delete soft-deleted task.
     */
    public function forceDelete(Request $request, $task_id)
    {
        $task = Task::onlyTrashed()->find($task_id);
        if (! $task) {
            return response()->json(['message' => 'Task not found'], 404);
        }

        // Check if task has child tasks
        if ($task->childTasks()->count() > 0) {
            return response()->json([
                'message' => 'Cannot force delete task with child tasks. Please delete or reassign child tasks first.',
            ], 422);
        }

        $task->forceDelete();

        return response()->json([
            'message' => 'Task permanently deleted successfully',
        ]);
    }

    /**
     * Update task status (Admin only).
     */
    public function updateStatus(Request $request, $task_id)
    {
        $user = User::find(Auth::user()->id);

        if (! $user->hasPermission('task.update')) {
            return response()->json(['message' => 'Insufficient permissions'], 403);
        }

        $task = Task::find($task_id);
        if (! $task) {
            return response()->json(['message' => 'Task not found'], 404);
        }

        $validated = $request->validate([
            'state' => 'required|in:Draft,Assigned,InProgress,Blocked,InReview,Done,Cancelled,Rejected',
        ]);

        $oldState = $task->state;
        $task->update([
            'state' => $validated['state'],
        ]);

        // Create task history record
        TaskHistory::create([
            'task_id' => $task->id,
            'old_status' => $oldState,
            'new_status' => $validated['state'],
            'changed_by' => $user->id,
            'created_at' => Carbon::now(),
        ]);

        // Create audit event
        TaskAuditEvent::createEvent(
            $task->id,
            'STATE_CHANGE',
            $oldState,
            $validated['state'],
            $task->current_owner_kind,
            $task->current_owner_id,
            $task->current_owner_kind,
            $task->current_owner_id,
            null,
            'Status changed from '.$oldState.' to '.$validated['state'],
            null,
            $user->id
        );

        if (in_array($validated['state'], ['Done', 'Cancelled', 'Rejected'], true)) {
            $this->notificationService->sendTaskCompletionExternalNotification(
                $task->id,
                $task->title,
                $validated['state'],
                $user->id
            );
        }

        return response()->json([
            'message' => 'Task status updated successfully',
            'task' => $task->load(['createdBy:id,name']),
        ]);
    }

    /**
     * Get task history for a specific task.
     */
    public function getTaskHistory($task_id)
    {
        $task = Task::find($task_id);
        if (! $task) {
            return response()->json(['message' => 'Task not found'], 404);
        }

        $history = TaskHistory::where('task_id', $task_id)
            ->with([
                'changedBy' => function ($query) {
                    $query->select('id', 'name', 'email');
                },
            ])
            ->orderBy('created_at', 'desc')
            ->get();

        $auditEvents = TaskAuditEvent::where('task_id', $task_id)
            ->with([
                'actorUser' => function ($query) {
                    $query->select('id', 'name', 'email');
                },
            ])
            ->orderBy('occurred_at', 'desc')
            ->get();

        return response()->json([
            'task_id' => $task_id,
            'history' => $history,
            'audit_events' => $auditEvents,
        ], 200);
    }

    /**
     * Get my tasks (tasks assigned to current user).
     */
    public function getMyTasks(Request $request)
    {
        $user = User::find(Auth::user()->id);

        if (! $user->hasPermission('task.read')) {
            return response()->json(['message' => 'Insufficient permissions'], 403);
        }

        $tasks = Task::whereHas('assignedUsers', function ($query) {
            $query->where('user_id', Auth::id());
        })
            ->with([
                'createdBy:id,name',
                'assignedDepartment:id,name',
                'assignedUsers:id,name',
                'collaborators:id,name',
                'ticket:id,ticket_number,title',
                'taskType:id,name,code',
                'slaPolicy:id,name,priority',
                'auditEvents:id,task_id,action,actor_user_id,occurred_at',
            ])
            ->latest()
            ->paginate(10);

        return response()->json([
            'tasks' => $tasks,
        ]);
    }

    /**
     * Display my tasks page (tasks assigned to current user).
     */
    public function myTasks(Request $request)
    {
        $user = User::find(Auth::user()->id);

        if (! $user->hasPermission('task.read')) {
            abort(403, 'Insufficient permissions');
        }

        $tasks = Task::whereHas('assignedUsers', function ($query) {
            $query->where('user_id', Auth::id());
        })
            ->with([
                'createdBy:id,name',
                'assignedDepartment:id,name',
                'assignedUsers:id,name',
                'collaborators:id,name',
                'ticket:id,ticket_number,title',
                'taskType:id,name,code',
                'slaPolicy:id,name,priority',
                'auditEvents:id,task_id,action,actor_user_id,occurred_at',
            ])
            ->latest()
            ->paginate(5);

        return Inertia::render('tasks/MyTasks', [
            'tasks' => $tasks,
        ]);
    }

    /**
     * Get tasks by status.
     */
    public function getTasksByStatus(Request $request, $status)
    {
        $user = User::find(Auth::user()->id);

        if (! $user->hasPermission('task.read')) {
            return response()->json(['message' => 'Insufficient permissions'], 403);
        }

        $validStatuses = ['Draft', 'Assigned', 'InProgress', 'Blocked', 'InReview', 'Done', 'Cancelled', 'Rejected'];

        if (! in_array($status, $validStatuses)) {
            return response()->json(['message' => 'Invalid status'], 422);
        }

        $tasks = Task::where('state', $status)
            ->with([
                'createdBy:id,name',
                'assignedDepartment:id,name',
                'taskType:id,name,code',
                'slaPolicy:id,name,priority',
                'auditEvents:id,task_id,action,actor_user_id,occurred_at',
            ])
            ->latest('created_at')
            ->paginate(15);

        return response()->json([
            'tasks' => $tasks,
        ]);
    }

    /**
     * Get tasks by department.
     *
     * @param  int  $departmentId
     * @return JsonResponse
     *
     * @throws AuthorizationException
     */
    public function getTasksByDepartment(Request $request, $departmentId)
    {
        $user = User::find(Auth::user()->id);

        if (! $user->hasPermission('task.read')) {
            return response()->json(['message' => 'Insufficient permissions'], 403);
        }

        $tasks = Task::where('department_id', $departmentId)
            ->with([
                'createdBy:id,name',
                'assignedDepartment:id,name',
                'taskType:id,name,code',
                'slaPolicy:id,name,priority',
                'auditEvents:id,task_id,action,actor_user_id,occurred_at',
            ])
            ->latest('created_at')
            ->paginate(15);

        return response()->json([
            'tasks' => $tasks,
        ]);
    }

    /**
     * Get tasks by task type.
     *
     * @param  int  $taskTypeId
     * @return JsonResponse
     *
     * @throws AuthorizationException
     */
    public function getTasksByTaskType(Request $request, $taskTypeId)
    {
        $user = User::find(Auth::user()->id);

        if (! $user->hasPermission('task.read')) {
            return response()->json(['message' => 'Insufficient permissions'], 403);
        }

        $tasks = Task::where('task_type_id', $taskTypeId)
            ->with([
                'createdBy:id,name',
                'assignedDepartment:id,name',
                'taskType:id,name,code',
                'slaPolicy:id,name,priority',
                'auditEvents:id,task_id,action,actor_user_id,occurred_at',
            ])
            ->latest('created_at')
            ->paginate(15);

        return response()->json([
            'tasks' => $tasks,
        ]);
    }

    /**
     * Get tasks by SLA policy.
     *
     * @param  int  $slaPolicyId
     * @return JsonResponse
     *
     * @throws AuthorizationException
     */
    public function getTasksBySlaPolicy(Request $request, $slaPolicyId)
    {
        $user = User::find(Auth::user()->id);

        if (! $user->hasPermission('task.read')) {
            return response()->json(['message' => 'Insufficient permissions'], 403);
        }

        $tasks = Task::where('sla_policy_id', $slaPolicyId)
            ->with([
                'createdBy:id,name',
                'assignedDepartment:id,name',
                'taskType:id,name,code',
                'slaPolicy:id,name,priority',
                'auditEvents:id,task_id,action,actor_user_id,occurred_at',
            ])
            ->latest('created_at')
            ->paginate(15);

        return response()->json([
            'tasks' => $tasks,
        ]);
    }

    /**
     * Get overdue tasks.
     *
     * @return JsonResponse
     *
     * @throws AuthorizationException
     */
    public function getOverdueTasks(Request $request)
    {
        $user = User::find(Auth::user()->id);

        if (! $user->hasPermission('task.read')) {
            return response()->json(['message' => 'Insufficient permissions'], 403);
        }

        $tasks = Task::where('due_at', '<', now())
            ->where('state', '!=', 'Done')
            ->where('state', '!=', 'Cancelled')
            ->where('state', '!=', 'Rejected')
            ->with([
                'createdBy:id,name',
                'assignedDepartment:id,name',
                'taskType:id,name,code',
                'slaPolicy:id,name,priority',
                'auditEvents:id,task_id,action,actor_user_id,occurred_at',
            ])
            ->latest('created_at')
            ->paginate(15);

        return response()->json([
            'tasks' => $tasks,
        ]);
    }

    /**
     * Get tasks due today.
     *
     * @return JsonResponse
     *
     * @throws AuthorizationException
     */
    public function getTasksDueToday(Request $request)
    {
        $user = User::find(Auth::user()->id);

        if (! $user->hasPermission('task.read')) {
            return response()->json(['message' => 'Insufficient permissions'], 403);
        }

        $tasks = Task::whereDate('due_at', today())
            ->where('state', '!=', 'Done')
            ->where('state', '!=', 'Cancelled')
            ->where('state', '!=', 'Rejected')
            ->with([
                'createdBy:id,name',
                'assignedDepartment:id,name',
                'taskType:id,name,code',
                'slaPolicy:id,name,priority',
                'auditEvents:id,task_id,action,actor_user_id,occurred_at',
            ])
            ->latest('created_at')
            ->paginate(15);

        return response()->json([
            'tasks' => $tasks,
        ]);
    }

    /**
     * Get tasks due this week.
     *
     * @return JsonResponse
     *
     * @throws AuthorizationException
     */
    public function getTasksDueThisWeek(Request $request)
    {
        $user = User::find(Auth::user()->id);

        if (! $user->hasPermission('task.read')) {
            return response()->json(['message' => 'Insufficient permissions'], 403);
        }

        $tasks = Task::whereBetween('due_at', [now(), now()->addWeek()])
            ->where('state', '!=', 'Done')
            ->where('state', '!=', 'Cancelled')
            ->where('state', '!=', 'Rejected')
            ->with([
                'createdBy:id,name',
                'assignedDepartment:id,name',
                'taskType:id,name,code',
                'slaPolicy:id,name,priority',
                'auditEvents:id,task_id,action,actor_user_id,occurred_at',
            ])
            ->latest('created_at')
            ->paginate(15);

        return response()->json([
            'tasks' => $tasks,
        ]);
    }

    /**
     * Get high priority overdue tasks.
     *
     * @return JsonResponse
     *
     * @throws AuthorizationException
     */
    public function getHighPriorityOverdueTasks(Request $request)
    {
        $user = User::find(Auth::user()->id);

        if (! $user->hasPermission('task.read')) {
            return response()->json(['message' => 'Insufficient permissions'], 403);
        }

        $query = Task::query();
        // priority should be calculated by sla_policy
        $tasks = $query->limit(20)->get();

        return response()->json([
            'tasks' => $tasks,
        ]);
    }

    /**
     * Get task summary.
     *
     * @return JsonResponse
     *
     * @throws AuthorizationException
     */
    public function getTaskSummary(Task $task)
    {
        $user = User::find(Auth::user()->id);

        if (! $user->hasPermission('task.read')) {
            return response()->json(['message' => 'Insufficient permissions'], 403);
        }

        return response()->json([
            'data' => $task->getSummary(),
        ]);
    }

    /**
     * Get task SLA status.
     *
     * @return JsonResponse
     *
     * @throws AuthorizationException
     */
    public function getTaskSlaStatus(Task $task)
    {
        $user = User::find(Auth::user()->id);

        if (! $user->hasPermission('task.read')) {
            return response()->json(['message' => 'Insufficient permissions'], 403);
        }

        return response()->json([
            'sla_status' => $task->sla_status,
            'is_overdue' => $task->isOverdue(),
            'completion_percentage' => $task->getCompletionPercentage(),
            'time_remaining' => $task->getTimeRemaining(),
            'urgency_score' => $task->getUrgencyScore(),
        ]);
    }

    /**
     * Get task user skills.
     *
     * @return JsonResponse
     *
     * @throws AuthorizationException
     */
    public function getTaskUserSkills(Task $task)
    {
        $user = User::find(Auth::user()->id);

        if (! $user->hasPermission('task.read')) {
            return response()->json(['message' => 'Insufficient permissions'], 403);
        }

        $skills = $task->userSkills()->with('user:id,name')->get();

        return response()->json([
            'skills' => $skills,
        ]);
    }
}
