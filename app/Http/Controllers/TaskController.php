<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Models\SlaPolicy;
use App\Models\Task;
use App\Models\TaskTimeEntry;
use App\Models\TaskType;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

/**
 * Task Controller for managing tasks with permission checks.
 *
 * @method User user() Returns the authenticated user
 */
class TaskController extends Controller
{
    public function __construct()
    {
        // $this->middleware('auth');
    }

    /**
     * Display a listing of the resource.
     *
     * @return \Illuminate\Http\JsonResponse
     *
     * @throws \Illuminate\Auth\Access\AuthorizationException
     */
    public function index()
    {
        /** @var User $user */
        $user = User::find(Auth::user()->id);

        if (! $user->hasPermission('task.read')) {
            return response()->json(['message' => 'Insufficient permissions'], 403);
        }
        $tasks = Task::with([
            'createdBy:id,name',
            'assignedDepartment:id,name',
            'taskType:id,name,code',
            'slaPolicy:id,name,priority',
            'parentTask:id,title,task_code',
            'childTasks:id,title,task_code',
            'comments:id,task_id,comment_text,created_at,commented_by,commented_by_type',
            'attachments:id,task_id,file_path,file_type,uploaded_by,created_at',
            'forwardings:id,task_id,from_department_id,to_department_id,forwarded_by,status,created_at',
            'history:id,task_id,old_status,new_status,changed_by,created_at',
            'auditEvents',
            'timeEntries:id,task_id,user_id,start_time,end_time,is_active',
        ])->withCount('comments')->get();

        return response()->json([
            'data' => $tasks,
        ]);
    }

    /**
     * Store a newly created resource in storage.
     *
     * @return \Illuminate\Http\JsonResponse
     *
     * @throws \Illuminate\Auth\Access\AuthorizationException
     */
    public function store(Request $request)
    {
        /** @var User $user */
        $user = User::find(Auth::user()->id);

        if (! $user->hasPermission('task.create')) {
            return response()->json(['message' => 'Insufficient permissions'], 403);
        }

        $validatedData = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'task_code' => 'required|string|unique:tasks,task_code',
            'ticket_id' => 'nullable|exists:tickets,id',
            'parent_task_id' => 'nullable|exists:tasks,id',
            'assigned_department_id' => 'nullable|exists:departments,id',
            'status' => 'in:pending,in-progress,waiting,completed',
            'priority' => 'in:low,medium,high,critical',
            'start_at' => 'nullable|date',
            'due_at' => 'nullable|date',
            'task_type_id' => 'nullable|exists:task_types,id',
            'sla_policy_id' => 'nullable|exists:sla_policies,id',
            'estimate_hours' => 'nullable|numeric',
            'actual_hours' => 'nullable|integer',
            'progress' => 'nullable|integer|min:0|max:100',
            'state' => 'nullable|string',
            'workflow_definition' => 'nullable|array',
            'metadata' => 'nullable|array',
        ]);

        $validatedData['created_by'] = Auth::id();

        // Set start date if not provided
        if (! isset($validatedData['start_at'])) {
            $validatedData['start_at'] = now();
        }

        // Calculate due date if not provided but estimate hours are given
        if (! isset($validatedData['due_at']) && isset($validatedData['estimate_hours'])) {
            $dueDateCalculator = app(\App\Services\DueDateCalculatorService::class);
            $validatedData['due_at'] = $dueDateCalculator->calculateDueDate(
                new \DateTime($validatedData['start_at']),
                $validatedData['estimate_hours']
            );
        }

        $task = Task::create($validatedData);

        return response()->json([
            'data' => $task->load([
                'createdBy:id,name',
                'assignedDepartment:id,name',
                'taskType:id,name,code',
                'slaPolicy:id,name,priority',
                'auditEvents:id,task_id,action,actor_user_id,occurred_at,created_at',
            ]),
        ], 201);
    }

    /**
     * Display the specified resource.
     *
     * @return \Illuminate\Http\JsonResponse
     *
     * @throws \Illuminate\Auth\Access\AuthorizationException
     */
    public function show(Task $task)
    {
        /** @var User $user */
        $user = User::find(Auth::user()->id);

        if (! $user->hasPermission('task.read')) {
            return response()->json(['message' => 'Insufficient permissions'], 403);
        }

        $task->load([
            'createdBy:id,name',
            'assignedUsers:id,name',
            'assignedDepartment:id,name',
            'taskType:id,name,code',
            'slaPolicy:id,name,priority',
            'ticket:id,ticket_number,title,client_id',
            'ticket.client:id,name',
            'parentTask:id,title,task_code',
            'childTasks:id,title,task_code',
            'comments',
            'comments.user:id,name',
            'attachments',
            'forwardings:id,from_user_id,to_user_id,to_department_id,remarks,status,forwarded_at,is_end_user,created_at',
            'forwardings.fromUser:id,name',
            'forwardings.toUser:id,name',
            'forwardings.toDepartment:id,name',
            'history:id,old_status,new_status,changed_by,created_at',
            'auditEvents:id,task_id,action,actor_user_id,occurred_at,reason',
            'auditEvents.actorUser:id,name',
            'workloadMetrics',
            'timeEntries:id,task_id,user_id,start_time,end_time,is_active',
            'timelineEvents',
        ]);

        // Add working time spent data
        $task->setAttribute('total_working_time_spent', $task->total_working_time_spent);
        $task->setAttribute('total_working_time_spent_seconds', $task->total_working_time_spent_seconds);

        // Add overdue time data
        $task->setAttribute('overdue_time', $task->getOverdueTime());
        $task->setAttribute('is_overdue', $task->isOverdue());

        // Get current user info for milestone access control
        $currentUser = User::with('roles')->find(Auth::user()->id);
        $isSuperAdmin = $currentUser && $currentUser->roles->contains('slug', 'super-admin');

        return response()->json([
            'data' => $task,
            'authUser' => [
                'id' => Auth::user()->id,
                'is_super_admin' => $isSuperAdmin,
            ],
        ]);
    }

    /**
     * Store a newly created self-assigned task in storage.
     *
     * @return \Illuminate\Http\JsonResponse
     *
     * @throws \Illuminate\Auth\Access\AuthorizationException
     */
    public function storeSelfAssigned(Request $request)
    {
        /** @var User $user */
        $user = User::find(Auth::user()->id);

        if (! $user->hasPermission('task.create')) {
            return response()->json(['message' => 'Insufficient permissions'], 403);
        }

        $validatedData = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'task_code' => 'required|string|unique:tasks,task_code',
            'ticket_id' => 'nullable|exists:tickets,id',
            'parent_task_id' => 'nullable|exists:tasks,id',
            'state' => 'in:Draft,Assigned,InProgress,Blocked,InReview,Done,Cancelled,Rejected',
            'start_at' => 'nullable|date',
            'due_at' => 'nullable|date',
            'task_type_id' => 'nullable|exists:task_types,id',
            'sla_policy_id' => 'nullable|exists:sla_policies,id',
            'estimate_hours' => 'nullable|numeric',
            'metadata' => 'nullable|array',
        ]);

        // Auto-assign to the logged-in user using task assignments
        $validatedData['created_by'] = Auth::id();
        $validatedData['current_owner_id'] = Auth::id();
        $validatedData['current_owner_kind'] = 'USER';
        $validatedData['state'] = $validatedData['state'] ?? 'Draft';

        $task = Task::create($validatedData);

        // Create self-assignment
        $task->selfAssign('Self-assigned task');

        return response()->json([
            'data' => $task->load([
                'createdBy:id,name',
                'assignedDepartment:id,name',
                'taskType:id,name,code',
                'slaPolicy:id,name,priority',
                'auditEvents:id,task_id,action,actor_user_id,occurred_at,created_at',
            ]),
        ], 201);
    }

    /**
     * Update the specified resource in storage.
     *
     * @return \Illuminate\Http\JsonResponse
     *
     * @throws \Illuminate\Auth\Access\AuthorizationException
     */
    public function update(Request $request, Task $task)
    {
        /** @var User $user */
        $user = User::find(Auth::user()->id);

        if (! $user->hasPermission('task.update')) {
            return response()->json(['message' => 'Insufficient permissions'], 403);
        }

        // Check if user is the task creator or super admin
        $isSuperAdmin = $user->roles->contains('slug', 'super-admin');
        $isTaskOwner = $task->created_by === Auth::id() || $task->createdBy?->id === Auth::id();

        if (! $isTaskOwner && ! $isSuperAdmin) {
            return response()->json(['message' => 'You can only edit your own tasks'], 403);
        }

        $validatedData = $request->validate([
            'title' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'task_code' => [
                'sometimes',
                'string',
                Rule::unique('tasks', 'task_code')->ignore($task->id),
            ],
            'ticket_id' => 'nullable|exists:tickets,id',
            'parent_task_id' => 'nullable|exists:tasks,id',
            'assigned_department_id' => 'nullable|exists:departments,id',
            'status' => 'in:pending,in-progress,waiting,completed',
            'priority' => 'in:low,medium,high,critical',
            'start_at' => 'nullable|date',
            'due_at' => 'nullable|date',
            'task_type_id' => 'nullable|exists:task_types,id',
            'sla_policy_id' => 'nullable|exists:sla_policies,id',
            'estimate_hours' => 'nullable|numeric',
            'actual_hours' => 'nullable|integer',
            'progress' => 'nullable|integer|min:0|max:100',
            'state' => 'nullable|string',
            'workflow_definition' => 'nullable|array',
            'metadata' => 'nullable|array',
        ]);

        $task->update($validatedData);

        return response()->json([
            'data' => $task->load([
                'createdBy:id,name',
                'assignedDepartment:id,name',
                'taskType:id,name,code',
                'slaPolicy:id,name,priority',
                'auditEvents:id,task_id,action,actor_user_id,occurred_at,created_at',
            ]),
        ]);
    }

    /**
     * Extend the due date for a task.
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function extendDueDate(Request $request, Task $task)
    {
        /** @var User $user */
        $user = User::find(Auth::user()->id);

        if (! $user->hasPermission('task.update')) {
            return response()->json(['message' => 'Insufficient permissions'], 403);
        }

        $validatedData = $request->validate([
            'due_at' => 'required|date|after:now',
        ]);

        $task->update($validatedData);

        return response()->json([
            'message' => 'Due date extended successfully',
            'data' => $task,
        ]);
    }

    /**
     * Remove the specified resource from storage.
     *
     * @return \Illuminate\Http\JsonResponse
     *
     * @throws \Illuminate\Auth\Access\AuthorizationException
     */
    public function destroy(Task $task)
    {
        /** @var User $user */
        $user = User::find(Auth::user()->id);

        if (! $user->hasPermission('task.delete')) {
            return response()->json(['message' => 'Insufficient permissions'], 403);
        }

        // Check if user is the task creator or super admin
        $isSuperAdmin = $user->roles->contains('slug', 'super-admin');
        $isTaskOwner = $task->created_by === Auth::id() || $task->createdBy?->id === Auth::id();

        if (! $isTaskOwner && ! $isSuperAdmin) {
            return response()->json(['message' => 'You can only delete your own tasks'], 403);
        }

        // Check if task has child tasks
        if ($task->childTasks()->count() > 0) {
            return response()->json([
                'message' => 'Cannot delete task with child tasks. Please delete or reassign child tasks first.',
            ], 422);
        }

        $task->delete();

        return response()->json([
            'message' => 'Task deleted successfully',
        ]);
    }

    /**
     * Get user's tasks (tasks assigned to the current user).
     *
     * @return \Illuminate\Http\JsonResponse
     *
     * @throws \Illuminate\Auth\Access\AuthorizationException
     */
    public function getAllTasks(Request $request)
    {
        /** @var User $user */
        $user = User::find(Auth::user()->id);

        if (! $user->hasPermission('task.read')) {
            return response()->json(['message' => 'Insufficient permissions'], 403);
        }

        $taskQuery = Task::query();

        if ($request->query('from_date') && $request->query('to_date')) {
            $fromDate = Carbon::parse($request->query('from_date'))->startOfDay();
            $toDate = Carbon::parse($request->query('to_date'))->endOfDay();
            $taskQuery->whereBetween('created_at', [$fromDate, $toDate]);
        } elseif ($request->query('from_date')) {
            $fromDate = Carbon::parse($request->query('from_date'))->startOfDay();
            $taskQuery->where('created_at', '>=', $fromDate);
        } elseif ($request->query('to_date')) {
            $toDate = Carbon::parse($request->query('to_date'))->endOfDay();
            $taskQuery->where('created_at', '<=', $toDate);
        }

        // Filter by employee if provided
        if ($request->query('employee_id')) {
            $employeeId = $request->query('employee_id');
            $taskQuery->whereHas('assignedUsers', function ($query) use ($employeeId) {
                $query->where('users.id', $employeeId);
            });
        }

        $tasks = $taskQuery->with([
            'createdBy:id,name',
            'assignedDepartment:id,name',
            'assignedUsers:id,name',
            'ticket:id,ticket_number,title',
            'taskType:id,name,code',
            'slaPolicy:id,name,priority',
            'auditEvents:id,task_id,action,actor_user_id,occurred_at',
            'timeEntries',
            'timelineEvents' => function ($query) {
                $query->select([
                    'id',
                    'task_id',
                    'event_type',
                    'event_name',
                    'event_description',
                    'event_date',
                    'target_date',
                    'is_milestone',
                    'milestone_type',
                    'is_completed',
                ])->orderBy('event_date', 'asc');
            },
        ])->with(['assignedUsers.employee'])
            ->withCount('comments')
            ->latest()
            ->limit(100)
            ->get();

        return response()->json([
            'data' => $tasks,
        ]);
    }

    /**
     * Get user's tasks (tasks assigned to the current user).
     *
     * @return \Illuminate\Http\JsonResponse
     *
     * @throws \Illuminate\Auth\Access\AuthorizationException
     */
    public function getMyTasks(Request $request)
    {
        /** @var User $user */
        $user = User::find(Auth::user()->id);

        if (! $user->hasPermission('task.read')) {
            return response()->json(['message' => 'Insufficient permissions'], 403);
        }

        $showRecentOnly = $request->query('recent') === 'true';

        $query = Task::whereHas('assignedUsers', function ($query) use ($user) {
            $query->where('user_id', $user->id);
        })
            ->with([
                'createdBy:id,name',
                'assignedDepartment:id,name',
                'assignedUsers:id,name',
                'ticket:id,ticket_number,title',
                'taskType:id,name,code',
                'slaPolicy:id,name,priority',
                'auditEvents:id,task_id,action,actor_user_id,occurred_at',
                'timeEntries',
                'timelineEvents' => function ($query) {
                    $query->select([
                        'id',
                        'task_id',
                        'event_type',
                        'event_name',
                        'event_description',
                        'event_date',
                        'target_date',
                        'is_milestone',
                        'milestone_type',
                        'is_completed',
                    ])->orderBy('event_date', 'asc');
                },
            ])->withCount('comments')
            ->orderByDesc('created_at')
            ->select(['tasks.*']);

        // If recent=true is passed, only return tasks completed in the last 2 days
        if ($showRecentOnly) {
            $query->where('state', 'Done')
                ->whereNotNull('completed_at')
                ->where('completed_at', '>=', now()->subDays(2));
        }

        $tasks = $query->paginate();

        return response()->json($tasks);
    }

    /**
     * Get tasks by status.
     *
     * @param  string  $status
     * @return \Illuminate\Http\JsonResponse
     *
     * @throws \Illuminate\Auth\Access\AuthorizationException
     */
    public function getTasksByStatus($status)
    {
        /** @var User $user */
        $user = User::find(Auth::user()->id);

        if (! $user->hasPermission('task.read')) {
            return response()->json(['message' => 'Insufficient permissions'], 403);
        }

        $validStatuses = ['pending', 'in-progress', 'waiting', 'completed'];

        if (! in_array($status, $validStatuses)) {
            return response()->json(['message' => 'Invalid status'], 422);
        }

        $tasks = Task::where('status', $status)
            ->with([
                'createdBy:id,name',
                'assignedDepartment:id,name',
                'taskType:id,name,code',
                'slaPolicy:id,name,priority',
                'auditEvents:id,task_id,action,actor_user_id,occurred_at,created_at',
                'timeEntries',
            ])
            ->get();

        return response()->json([
            'data' => $tasks,
        ]);
    }

    /**
     * Update task status.
     *
     * @return \Illuminate\Http\JsonResponse
     *
     * @throws \Illuminate\Auth\Access\AuthorizationException
     */
    public function updateStatus(Request $request, Task $task)
    {
        /** @var User $user */
        $user = User::find(Auth::user()->id);

        if (! $user->hasPermission('task.update')) {
            return response()->json(['message' => 'Insufficient permissions'], 403);
        }

        // Check if user is the task creator or super admin or assigned user
        $isSuperAdmin = $user->roles->contains('slug', 'super-admin');
        $isTaskOwner = $task->created_by === Auth::id() || $task->createdBy?->id === Auth::id();
        $isAssignedUser = $task->assignedUsers()->where('user_id', Auth::id())->exists();

        if (! $isTaskOwner && ! $isSuperAdmin && ! $isAssignedUser) {
            return response()->json(['message' => 'You can only update your own tasks or tasks assigned to you'], 403);
        }

        $validatedData = $request->validate([
            'state' => 'required',
        ]);

        $activeEntry = TaskTimeEntry::getActiveEntry($task, $user->id);
        if ($activeEntry) {
            $activeEntry->end();
        }

        // Set completed_at when transitioning to a terminal state
        $terminalStates = ['Done', 'Cancelled', 'Rejected'];
        if (in_array($validatedData['state'], $terminalStates)) {
            $validatedData['completed_at'] = now();
        } elseif (in_array($task->state, $terminalStates) && ! in_array($validatedData['state'], $terminalStates)) {
            // Clear completed_at if transitioning away from a terminal state
            $validatedData['completed_at'] = null;
        }

        $task->update($validatedData);

        return response()->json([
            'success' => true,
            'data' => $task->load([
                'createdBy:id,name',
                'assignedDepartment:id,name',
                'taskType:id,name,code',
                'slaPolicy:id,name,priority',
                'auditEvents:id,task_id,action,actor_user_id,occurred_at,created_at',
                'timeEntries:id,task_id,user_id,start_time,end_time,is_active',
            ]),
        ]);
    }

    /**
     * Start tracking time for a task.
     *
     * @return \Illuminate\Http\JsonResponse
     *
     * @throws \Illuminate\Auth\Access\AuthorizationException
     */
    public function startTask(Task $task)
    {
        /** @var User $user */
        $user = User::find(Auth::user()->id);

        if (! $user->hasPermission('task.update')) {
            return response()->json(['message' => 'Insufficient permissions'], 403);
        }

        // Check if user is assigned to this task via task_assignments
        $isAssigned = $task->assignedUsers()->where('user_id', $user->id)->exists();
        if (! $isAssigned) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        // Check if current time is working time
        $workingHoursService = app(\App\Services\WorkingHoursService::class);
        $now = now();
        if (! $workingHoursService->isWorkingTime($now)) {
            return response()->json([
                'error' => 'Task actions are not available outside working hours',
                'message' => 'Please resume your work during working hours',
            ], 403);
        }

        // Check if user already has an active time entry for this task
        $activeEntry = TaskTimeEntry::getActiveEntry($task, $user->id);
        if ($activeEntry) {
            return response()->json(['message' => 'Task is already being tracked by this user'], 422);
        }

        // Pause other active tasks for this user before starting the new task
        $this->pauseUserActiveTasks($user->id, $task->id);

        // Create new time entry
        $timeEntry = TaskTimeEntry::start($task, $user->id);

        // Update task status to InProgress
        $task->update(['state' => 'InProgress']);

        return response()->json([
            'success' => true,
            'message' => 'Task time tracking started successfully',
            'data' => $task->load([
                'createdBy:id,name',
                'assignedDepartment:id,name',
                'taskType:id,name,code',
                'slaPolicy:id,name,priority',
                'timeEntries:id,task_id,user_id,start_time,end_time,is_active',
                'auditEvents:id,task_id,action,actor_user_id,occurred_at,created_at',
            ]),
        ]);
    }

    /**
     * Pause tracking time for a task.
     *
     * @return \Illuminate\Http\JsonResponse
     *
     * @throws \Illuminate\Auth\Access\AuthorizationException
     */
    public function pauseTask(Task $task)
    {
        /** @var User $user */
        $user = User::find(Auth::user()->id);

        if (! $user->hasPermission('task.update')) {
            return response()->json(['message' => 'Insufficient permissions'], 403);
        }

        // Check if user is assigned to this task via task_assignments
        $isAssigned = $task->assignedUsers()->where('user_id', $user->id)->exists();
        if (! $isAssigned) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        // Find the active time entry for this user and task
        $activeEntry = TaskTimeEntry::getActiveEntry($task, $user->id);
        if (! $activeEntry) {
            return response()->json(['message' => 'No active time tracking for this task'], 422);
        }

        // End the time entry
        $activeEntry->end();

        return response()->json([
            'success' => true,
            'message' => 'Task time tracking paused successfully',
            'data' => $task->load([
                'createdBy:id,name',
                'assignedDepartment:id,name',
                'taskType:id,name,code',
                'slaPolicy:id,name,priority',
                'timeEntries:id,task_id,user_id,start_time,end_time,is_active',
                'auditEvents:id,task_id,action,actor_user_id,occurred_at,created_at',
            ]),
        ]);
    }

    /**
     * Resume tracking time for a task.
     *
     * @return \Illuminate\Http\JsonResponse
     *
     * @throws \Illuminate\Auth\Access\AuthorizationException
     */
    public function resumeTask(Task $task)
    {
        /** @var User $user */
        $user = User::find(Auth::user()->id);

        if (! $user->hasPermission('task.update')) {
            return response()->json(['message' => 'Insufficient permissions'], 403);
        }

        // Check if user is assigned to this task via task_assignments
        $isAssigned = $task->assignedUsers()->where('user_id', $user->id)->exists();
        if (! $isAssigned) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        // Check if current time is working time
        $workingHoursService = app(\App\Services\WorkingHoursService::class);
        $now = now();
        if (! $workingHoursService->isWorkingTime($now)) {
            return response()->json([
                'error' => 'Task actions are not available outside working hours',
                'message' => 'Please resume your work during working hours',
            ], 403);
        }

        // Check if user already has an active time entry for this task
        $activeEntry = TaskTimeEntry::getActiveEntry($task, $user->id);
        if ($activeEntry) {
            return response()->json(['message' => 'Task is already being tracked by this user'], 422);
        }

        // Pause other active tasks for this user before resuming this task
        $this->pauseUserActiveTasks($user->id, $task->id);

        // Create new time entry
        $timeEntry = TaskTimeEntry::start($task, $user->id);

        return response()->json([
            'success' => true,
            'message' => 'Task time tracking resumed successfully',
            'data' => $task->load([
                'createdBy:id,name',
                'assignedDepartment:id,name',
                'taskType:id,name,code',
                'slaPolicy:id,name,priority',
                'timeEntries:id,task_id,user_id,start_time,end_time,is_active',
                'auditEvents:id,task_id,action,actor_user_id,occurred_at,created_at',
            ]),
        ]);
    }

    /**
     * End tracking time for a task.
     *
     * @return \Illuminate\Http\JsonResponse
     *
     * @throws \Illuminate\Auth\Access\AuthorizationException
     */
    public function endTask(Task $task)
    {
        /** @var User $user */
        $user = User::find(Auth::user()->id);

        if (! $user->hasPermission('task.update')) {
            return response()->json(['message' => 'Insufficient permissions'], 403);
        }

        // Check if user is assigned to this task via task_assignments
        $isAssigned = $task->assignedUsers()->where('user_id', $user->id)->exists();
        if (! $isAssigned) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        // Find the active time entry for this user and task
        $activeEntry = TaskTimeEntry::getActiveEntry($task, $user->id);
        if (! $activeEntry) {
            return response()->json(['message' => 'No active time tracking for this task'], 422);
        }

        // End the time entry
        $activeEntry->end();

        // Update task status to completed if this was the last active entry
        $hasOtherActiveEntries = TaskTimeEntry::where('task_id', $task->id)
            ->where('is_active', true)
            ->exists();

        if (! $hasOtherActiveEntries) {
            $task->update([
                'state' => 'Done',
                'completed_at' => now(),
            ]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Task time tracking ended successfully',
            'data' => $task->load([
                'createdBy:id,name',
                'assignedDepartment:id,name',
                'taskType:id,name,code',
                'slaPolicy:id,name,priority',
                'timeEntries:id,task_id,user_id,start_time,end_time,is_active',
                'auditEvents:id,task_id,action,actor_user_id,occurred_at,created_at',
            ]),
        ]);
    }

    /**
     * Calculate time spent on a task.
     *
     * @return \Illuminate\Http\JsonResponse
     *
     * @throws \Illuminate\Auth\Access\AuthorizationException
     */
    public function calculateTimeSpent(Task $task)
    {
        /** @var User $user */
        $user = User::find(Auth::user()->id);

        if (! $user->hasPermission('task.read')) {
            return response()->json(['message' => 'Insufficient permissions'], 403);
        }

        // Get total time from completed entries (returns seconds)
        $totalTimeSpent = TaskTimeEntry::getTotalTimeForTask($task);

        // Get current active time entry duration (returns seconds)
        $activeEntry = TaskTimeEntry::getActiveEntry($task, $user->id);
        $timeSpent = 0;

        if ($activeEntry) {
            $timeSpent = $activeEntry->calculateDuration();
        }

        $totalTimeSpent += $timeSpent;

        $estimateHours = $task->estimate_hours ?? 0;
        $estimateSeconds = $estimateHours * 3600;
        $remainingTime = $estimateSeconds - $totalTimeSpent;

        return response()->json([
            'success' => true,
            'data' => [
                'time_spent' => $timeSpent, // Seconds
                'total_time_spent' => $totalTimeSpent, // Seconds
                'remaining_time' => $remainingTime, // Seconds
                'remaining_hours' => $remainingTime / 3600, // For backward compatibility
            ],
        ]);
    }

    /**
     * Calculate remaining time for a task based on working hours.
     *
     * @return \Illuminate\Http\JsonResponse
     *
     * @throws \Illuminate\Auth\Access\AuthorizationException
     */
    public function calculateRemainingTime(Task $task)
    {
        /** @var User $user */
        $user = User::find(Auth::user()->id);

        if (! $user->hasPermission('task.read')) {
            return response()->json(['message' => 'Insufficient permissions'], 403);
        }

        $remainingTime = $task->getTimeRemaining();
        $daysRequired = $task->calculateDaysRequired();

        // Get working hours configuration for response
        $workingHoursService = app(\App\Services\WorkingHoursService::class);
        $config = $workingHoursService->getWorkingHoursConfig();

        return response()->json([
            'success' => true,
            'data' => [
                'remaining_time' => $remainingTime, // In hours
                'days_required' => $daysRequired,
                'working_hours_config' => $config,
            ],
        ]);
    }

    /**
     * Get tasks by department.
     *
     * @param  int  $departmentId
     * @return \Illuminate\Http\JsonResponse
     *
     * @throws \Illuminate\Auth\Access\AuthorizationException
     */
    public function getTasksByDepartment($departmentId)
    {
        /** @var User $user */
        $user = User::find(Auth::user()->id);

        if (! $user->hasPermission('task.read')) {
            return response()->json(['message' => 'Insufficient permissions'], 403);
        }

        $tasks = Task::where('assigned_department_id', $departmentId)
            ->with([
                'createdBy:id,name',
                'assignedDepartment:id,name',
                'taskType:id,name,code',
                'slaPolicy:id,name,priority',
                'auditEvents:id,task_id,action,actor_user_id,occurred_at,created_at',
            ])
            ->get();

        return response()->json([
            'data' => $tasks,
        ]);
    }

    /**
     * Get tasks by task type.
     *
     * @param  int  $taskTypeId
     * @return \Illuminate\Http\JsonResponse
     *
     * @throws \Illuminate\Auth\Access\AuthorizationException
     */
    public function getTasksByTaskType($taskTypeId)
    {
        /** @var User $user */
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
                'auditEvents:id,task_id,action,actor_user_id,occurred_at,created_at',
            ])
            ->get();

        return response()->json([
            'data' => $tasks,
        ]);
    }

    /**
     * Get tasks by SLA policy.
     *
     * @param  int  $slaPolicyId
     * @return \Illuminate\Http\JsonResponse
     *
     * @throws \Illuminate\Auth\Access\AuthorizationException
     */
    public function getTasksBySlaPolicy($slaPolicyId)
    {
        /** @var User $user */
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
                'auditEvents:id,task_id,action,actor_user_id,occurred_at,created_at',
            ])
            ->get();

        return response()->json([
            'data' => $tasks,
        ]);
    }

    /**
     * Get overdue tasks.
     *
     * @return \Illuminate\Http\JsonResponse
     *
     * @throws \Illuminate\Auth\Access\AuthorizationException
     */
    public function getOverdueTasks()
    {
        /** @var User $user */
        $user = User::find(Auth::user()->id);

        if (! $user->hasPermission('task.read')) {
            return response()->json(['message' => 'Insufficient permissions'], 403);
        }

        $tasks = Task::overdue()
            ->with([
                'createdBy:id,name',
                'assignedDepartment:id,name',
                'taskType:id,name,code',
                'slaPolicy:id,name,priority',
                'auditEvents:id,task_id,action,actor_user_id,occurred_at,created_at',
            ])
            ->get();

        return response()->json([
            'data' => $tasks,
        ]);
    }

    /**
     * Get tasks due today.
     *
     * @return \Illuminate\Http\JsonResponse
     *
     * @throws \Illuminate\Auth\Access\AuthorizationException
     */
    public function getTasksDueToday()
    {
        /** @var User $user */
        $user = User::find(Auth::user()->id);

        if (! $user->hasPermission('task.read')) {
            return response()->json(['message' => 'Insufficient permissions'], 403);
        }

        $tasks = Task::dueToday()
            ->with([
                'createdBy:id,name',
                'assignedDepartment:id,name',
                'taskType:id,name,code',
                'slaPolicy:id,name,priority',
                'auditEvents:id,task_id,action,actor_user_id,occurred_at,created_at',
            ])
            ->get();

        return response()->json([
            'data' => $tasks,
        ]);
    }

    /**
     * Get tasks due this week.
     *
     * @return \Illuminate\Http\JsonResponse
     *
     * @throws \Illuminate\Auth\Access\AuthorizationException
     */
    public function getTasksDueThisWeek()
    {
        /** @var User $user */
        $user = User::find(Auth::user()->id);

        if (! $user->hasPermission('task.read')) {
            return response()->json(['message' => 'Insufficient permissions'], 403);
        }

        $tasks = Task::dueThisWeek()
            ->with([
                'createdBy:id,name',
                'assignedDepartment:id,name',
                'taskType:id,name,code',
                'slaPolicy:id,name,priority',
                'auditEvents:id,task_id,action,actor_user_id,occurred_at,created_at',
            ])
            ->get();

        return response()->json([
            'data' => $tasks,
        ]);
    }

    /**
     * Get high priority overdue tasks.
     *
     * @return \Illuminate\Http\JsonResponse
     *
     * @throws \Illuminate\Auth\Access\AuthorizationException
     */
    public function getHighPriorityOverdueTasks()
    {
        /** @var User $user */
        $user = User::find(Auth::user()->id);

        if (! $user->hasPermission('task.read')) {
            return response()->json(['message' => 'Insufficient permissions'], 403);
        }

        $tasks = Task::highPriorityOverdue()
            ->with([
                'createdBy:id,name',
                'assignedDepartment:id,name',
                'taskType:id,name,code',
                'slaPolicy:id,name,priority',
                'auditEvents:id,task_id,action,actor_user_id,occurred_at,created_at',
            ])
            ->get();

        return response()->json([
            'data' => $tasks,
        ]);
    }

    /**
     * Get task summary.
     *
     * @return \Illuminate\Http\JsonResponse
     *
     * @throws \Illuminate\Auth\Access\AuthorizationException
     */
    public function getTaskSummary(Task $task)
    {
        /** @var User $user */
        $user = User::find(Auth::user()->id);

        if (! $user->hasPermission('task.read')) {
            return response()->json(['message' => 'Insufficient permissions'], 403);
        }

        return response()->json([
            'data' => $task->getSummary(),
        ]);
    }

    /**
     * Display my tasks page (tasks assigned to current user).
     *
     * @return \Inertia\Response
     *
     * @throws \Illuminate\Auth\Access\AuthorizationException
     */
    public function myTasks(Request $request)
    {
        /** @var User $user */
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
                'ticket:id,ticket_number,title',
                'taskType:id,name,code',
                'slaPolicy:id,name,priority',
                'auditEvents:id,task_id,action,actor_user_id,occurred_at',
                'timeEntries',
            ])
            ->latest()
            ->paginate(5);

        return Inertia::render('tasks/MyTasks', [
            'tasks' => $tasks,
        ]);
    }

    /**
     * Get workload metrics for a task.
     */
    public function getWorkloadMetrics(Task $task)
    {
        /** @var User $user */
        $user = User::find(Auth::user()->id);

        if (! $user->hasPermission('task.read')) {
            return response()->json(['message' => 'Insufficient permissions'], 403);
        }

        // Get workload metrics for all assigned users
        $metrics = [];
        $assignedUsers = $task->assignedUsers()->pluck('user_id');
        if ($assignedUsers->isNotEmpty()) {
            $metrics = \App\Models\WorkloadMetric::whereIn('user_id', $assignedUsers)
                ->with('user:id,name,email')
                ->orderBy('calculated_at', 'desc')
                ->get();
        }

        return response()->json([
            'success' => true,
            'data' => $metrics,
        ]);
    }

    /**
     * Get audit events for a task.
     */
    public function getAuditEvents(Task $task)
    {
        /** @var User $user */
        $user = User::find(Auth::user()->id);

        if (! $user->hasPermission('task.read')) {
            return response()->json(['message' => 'Insufficient permissions'], 403);
        }

        $auditEvents = $task->auditEvents()
            ->with('actorUser:id,name,email')
            ->orderBy('occurred_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $auditEvents,
        ]);
    }

    /**
     * Get history for a task.
     */
    public function getHistory(Task $task)
    {
        /** @var User $user */
        $user = User::find(Auth::user()->id);

        if (! $user->hasPermission('task.read')) {
            return response()->json(['message' => 'Insufficient permissions'], 403);
        }

        $history = $task->history()
            ->with('changedByUser:id,name,email')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $history,
        ]);
    }

    /**
     * List active task types for creation forms.
     */
    public function getTaskTypes()
    {
        /** @var User $user */
        $user = User::find(Auth::user()->id);

        if (! $user->hasPermission('task.read')) {
            return response()->json(['message' => 'Insufficient permissions'], 403);
        }

        $taskTypes = TaskType::where('is_active', true)
            ->select('id', 'name', 'code', 'description')
            ->orderBy('name')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $taskTypes,
        ]);
    }

    /**
     * List SLA policies for a given task type (or general if none).
     */
    public function getSlaPoliciesByTaskType($taskTypeId = null)
    {
        /** @var User $user */
        $user = User::find(Auth::user()->id);

        if (! $user->hasPermission('task.read')) {
            return response()->json(['message' => 'Insufficient permissions'], 403);
        }

        $query = SlaPolicy::query()->select('id', 'name', 'priority', 'task_type_id');

        if ($taskTypeId) {
            $query->where(function ($q) use ($taskTypeId) {
                $q->where('task_type_id', $taskTypeId)
                    ->orWhereNull('task_type_id'); // general policies
            });
        }

        $policies = $query->orderBy('priority')->get();

        return response()->json([
            'success' => true,
            'data' => $policies,
        ]);
    }

    /**
     * Pause all active tasks for a user except the specified task.
     */
    private function pauseUserActiveTasks(int $userId, int $excludeTaskId): void
    {
        // Get all active time entries for this user (excluding the current task)
        $activeEntries = TaskTimeEntry::where('user_id', $userId)
            ->where('is_active', true)
            ->whereHas('task', function ($query) use ($excludeTaskId) {
                $query->where('id', '!=', $excludeTaskId);
            })
            ->get();

        foreach ($activeEntries as $entry) {
            $entry->end();
        }
    }

    public function projects(Request $request)
    {
        $projects = Project::with(['department:id,name', 'manager:id,name'])
            ->select('id', 'name', 'description', 'department_id', 'manager_id', 'status', 'start_date', 'end_date')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $projects,
        ]);
    }

    public function storeProject(Request $request)
    {
        $validatedData = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'department_id' => 'required|exists:departments,id',
            'manager_id' => 'nullable|exists:users,id',
            'status' => 'required|in:planning,active,on_hold,completed,cancelled',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
        ]);

        $project = Project::create($validatedData);

        return response()->json([
            'success' => true,
            'data' => $project->load(['department:id,name', 'manager:id,name']),
        ], 201);
    }

    /**
     * Calculate minimum due date based on estimated working hours.
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function calculateMinDueDate(Request $request)
    {
        $estimateHours = $request->query('estimate_hours');
        $startAt = $request->query('start_at');

        // Use provided start_at or default to now
        $startDate = $startAt ? \Carbon\Carbon::parse($startAt) : now();

        if (! $estimateHours || $estimateHours <= 0) {
            return response()->json([
                'success' => true,
                'data' => [
                    'min_due_date' => $startDate->toISOString(),
                ],
            ]);
        }

        $dueDateCalculator = app(\App\Services\DueDateCalculatorService::class);
        $dueDate = $dueDateCalculator->calculateDueDate($startDate, (float) $estimateHours);

        return response()->json([
            'success' => true,
            'data' => [
                'min_due_date' => $dueDate->format('Y-m-d\TH:i:sP'),
            ],
        ]);
    }
}
