<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Models\SlaPolicy;
use App\Models\Task;
use App\Models\TaskAssignment;
use App\Models\TaskForwarding;
use App\Models\TaskTimeEntry;
use App\Models\TaskType;
use App\Models\User;
use App\Models\WorkloadMetric;
use App\Services\DueDateCalculatorService;
use App\Services\NotificationService;
use App\Services\TaskActionAuthorizationService;
use App\Services\TimeCalculatorService;
use App\Services\WorkingHoursService;
use Carbon\Carbon;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Task Controller for managing tasks with permission checks.
 *
 * @method User user() Returns the authenticated user
 */
class TaskController extends Controller
{
    public function __construct(
        protected TaskActionAuthorizationService $taskActionAuthorizationService
    ) {
        // $this->middleware('auth');
    }

    /**
     * Display a listing of the resource.
     *
     * @return JsonResponse
     *
     * @throws AuthorizationException
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
            'forwardings:id,task_id,from_user_id,to_user_id,from_department_id,to_department_id,forwarded_by,status,created_at,forwarded_at',
            'forwardings.fromUser:id,name',
            'forwardings.toUser:id,name',
            'forwardings.fromDepartment:id,name',
            'forwardings.toDepartment:id,name',
            'history:id,task_id,old_status,new_status,changed_by,created_at',
            'auditEvents',
            'timeEntries:id,task_id,user_id,start_time,end_time,is_active',
        ])->withCount('comments')->get();

        $tasks->each(function (Task $task): void {
            $this->appendForwardingMeta($task);
        });

        return response()->json([
            'data' => $tasks,
        ]);
    }

    /**
     * Store a newly created resource in storage.
     *
     * @return JsonResponse
     *
     * @throws AuthorizationException
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

        $validatedData = $this->prepareScheduleForCreation($validatedData);

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
     * @return JsonResponse
     *
     * @throws AuthorizationException
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
            'forwardings:id,task_id,from_user_id,to_user_id,from_department_id,to_department_id,forwarded_by,remarks,status,forwarded_at,is_end_user,created_at',
            'forwardings.fromUser:id,name',
            'forwardings.toUser:id,name',
            'forwardings.fromDepartment:id,name',
            'forwardings.toDepartment:id,name',
            'forwardings.forwardedBy:id,name',
            'history:id,old_status,new_status,changed_by,created_at',
            'auditEvents:id,task_id,action,actor_user_id,occurred_at,reason',
            'auditEvents.actorUser:id,name',
            'workloadMetrics',
            'timeEntries:id,task_id,user_id,start_time,end_time,is_active',
            'timelineEvents',
        ]);

        $authUserId = (int) Auth::user()->id;
        $activeTaskEntries = $task->timeEntries->where('is_active', true);
        $myActiveEntry = $activeTaskEntries->firstWhere('user_id', $authUserId);

        $task->setAttribute('my_active_entry', $myActiveEntry);
        $task->setAttribute('my_is_tracking', $myActiveEntry !== null);
        $task->setAttribute(
            'other_active_users_count',
            $activeTaskEntries
                ->where('user_id', '!=', $authUserId)
                ->pluck('user_id')
                ->unique()
                ->count()
        );

        // Add working time spent data
        $task->setAttribute('total_working_time_spent', $task->total_working_time_spent);
        $task->setAttribute('total_working_time_spent_seconds', $task->total_working_time_spent_seconds);

        // Add overdue time data
        $task->setAttribute('overdue_time', $task->getOverdueTime());
        $task->setAttribute('is_overdue', $task->isOverdue());

        // Get current user info for milestone access control
        $currentUser = User::with('roles')->find(Auth::user()->id);
        $isSuperAdmin = $currentUser && $currentUser->roles->contains('slug', 'super-admin');
        $canManageTask = $currentUser
            ? $this->taskActionAuthorizationService->canManageTask($currentUser, $task)
            : false;
        $canManageAnyTask = $currentUser
            ? $this->taskActionAuthorizationService->canManageAnyTask($currentUser)
            : false;
        $task->setAttribute('can_manage_task', $canManageTask);
        $this->appendForwardingMeta($task);

        return response()->json([
            'data' => $task,
            'authUser' => [
                'id' => $authUserId,
                'is_super_admin' => $isSuperAdmin,
                'can_manage_any_tasks' => $canManageAnyTask,
                'can_manage_task' => $canManageTask,
            ],
        ]);
    }

    /**
     * Store a newly created self-assigned task in storage.
     *
     * @return JsonResponse
     *
     * @throws AuthorizationException
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
        $validatedData = $this->prepareScheduleForCreation($validatedData);

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
     * @return JsonResponse
     *
     * @throws AuthorizationException
     */
    public function update(Request $request, Task $task)
    {
        /** @var User $user */
        $user = User::find(Auth::user()->id);

        if (! $user->hasPermission('task.update')) {
            return response()->json(['message' => 'Insufficient permissions'], 403);
        }

        if (! $this->taskActionAuthorizationService->canManageTask($user, $task)) {
            return response()->json(['message' => 'You are not authorized to manage this task'], 403);
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
     * @return JsonResponse
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
     * @return JsonResponse
     *
     * @throws AuthorizationException
     */
    public function destroy(Task $task)
    {
        /** @var User $user */
        $user = User::find(Auth::user()->id);

        if (! $user->hasPermission('task.delete')) {
            return response()->json(['message' => 'Insufficient permissions'], 403);
        }

        if (! $this->taskActionAuthorizationService->canManageTask($user, $task)) {
            return response()->json(['message' => 'You are not authorized to manage this task'], 403);
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
     * @return JsonResponse
     *
     * @throws AuthorizationException
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
            $taskQuery->where(function ($query) use ($fromDate, $toDate) {
                $query->where(function ($query) use ($fromDate, $toDate) {
                    $query
                        ->whereRaw('COALESCE(start_at, created_at) <= ?', [$toDate])
                        ->whereRaw('COALESCE(completed_at, due_at, start_at, created_at) >= ?', [$fromDate]);
                })->orWhereHas('timeEntries', function ($timeQuery) use ($fromDate, $toDate) {
                    $timeQuery->whereBetween('start_time', [$fromDate, $toDate]);
                });
            });
        } elseif ($request->query('from_date')) {
            $fromDate = Carbon::parse($request->query('from_date'))->startOfDay();
            $taskQuery->where(function ($query) use ($fromDate) {
                $query
                    ->whereRaw('COALESCE(completed_at, due_at, start_at, created_at) >= ?', [$fromDate])
                    ->orWhereHas('timeEntries', function ($timeQuery) use ($fromDate) {
                        $timeQuery->where('start_time', '>=', $fromDate);
                    });
            });
        } elseif ($request->query('to_date')) {
            $toDate = Carbon::parse($request->query('to_date'))->endOfDay();
            $taskQuery->where(function ($query) use ($toDate) {
                $query
                    ->whereRaw('COALESCE(start_at, created_at) <= ?', [$toDate])
                    ->orWhereHas('timeEntries', function ($timeQuery) use ($toDate) {
                        $timeQuery->where('start_time', '<=', $toDate);
                    });
            });
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
            'forwardings:id,task_id,from_user_id,to_user_id,from_department_id,to_department_id,forwarded_by,status,created_at,forwarded_at',
            'forwardings.fromUser:id,name',
            'forwardings.toUser:id,name',
            'forwardings.fromDepartment:id,name',
            'forwardings.toDepartment:id,name',
            'forwardings.forwardedBy:id,name',
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

        $tasks->each(function (Task $task): void {
            $this->appendForwardingMeta($task);
        });

        return response()->json([
            'data' => $tasks,
        ]);
    }

    /**
     * Get user's tasks (tasks assigned to the current user).
     *
     * @return JsonResponse
     *
     * @throws AuthorizationException
     */
    public function getMyTasks(Request $request)
    {
        /** @var User $user */
        $user = User::find(Auth::user()->id);

        if (! $user->hasPermission('task.read')) {
            return response()->json(['message' => 'Insufficient permissions'], 403);
        }

        $validated = $request->validate([
            'recent' => ['nullable', 'in:true,false'],
            'page' => ['nullable', 'integer', 'min:1'],
            'per_page' => ['nullable', 'integer', 'in:5,10,25,50,100'],
            'sort_by' => ['nullable', 'string', 'in:priority,state,due_at,title,task_code,created_at'],
            'sort_order' => ['nullable', 'string', 'in:asc,desc'],
        ]);

        $showRecentOnly = ($validated['recent'] ?? 'false') === 'true';
        $perPage = (int) ($validated['per_page'] ?? 5);
        $page = (int) ($validated['page'] ?? 1);
        $sortBy = $validated['sort_by'] ?? 'priority';
        $sortOrder = $validated['sort_order'] ?? 'asc';

        $query = Task::query()
            ->select('tasks.*')
            ->whereHas('assignedUsers', function ($query) use ($user) {
                $query->where('user_id', $user->id);
            })
            ->with([
                'createdBy:id,name',
                'assignedDepartment:id,name',
                'assignedUsers:id,name',
                'ticket:id,ticket_number,title',
                'taskType:id,name,code',
                'slaPolicy:id,name,priority',
                'forwardings:id,task_id,from_user_id,to_user_id,from_department_id,to_department_id,forwarded_by,status,created_at,forwarded_at',
                'forwardings.fromUser:id,name',
                'forwardings.toUser:id,name',
                'forwardings.fromDepartment:id,name',
                'forwardings.toDepartment:id,name',
                'forwardings.forwardedBy:id,name',
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
            ])
            ->withCount('comments');

        // If recent=true is passed, only return tasks completed in the last 2 days
        if ($showRecentOnly) {
            $query->where('state', 'Done')
                ->whereNotNull('completed_at')
                ->where('completed_at', '>=', now()->subDays(2));
        }

        $this->applyMyTaskSorting($query, $sortBy, $sortOrder);

        $tasks = $query
            ->paginate($perPage, ['*'], 'page', $page)
            ->withQueryString();

        $tasks->getCollection()->transform(function (Task $task): Task {
            return $this->appendForwardingMeta($task);
        });

        return response()->json($tasks);
    }

    /**
     * Get tasks by status.
     *
     * @param  string  $status
     * @return JsonResponse
     *
     * @throws AuthorizationException
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
     * @return JsonResponse
     *
     * @throws AuthorizationException
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

        if (in_array($validatedData['state'], ['Done', 'Cancelled', 'Rejected'], true)) {
            app(NotificationService::class)->sendTaskCompletionExternalNotification(
                $task->id,
                $task->title,
                $validatedData['state'],
                $user->id
            );
        }

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
     * @return JsonResponse
     *
     * @throws AuthorizationException
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
        $workingHoursService = app(WorkingHoursService::class);
        $now = now();
        if (! $workingHoursService->isWorkingTime($now)) {
            return response()->json([
                'error' => 'Task actions are not available outside working hours',
                'message' => 'Please resume your work during working hours',
            ], 403);
        }

        $result = DB::transaction(function () use ($task, $user) {
            $activeEntries = TaskTimeEntry::query()
                ->where('user_id', $user->id)
                ->where('is_active', true)
                ->lockForUpdate()
                ->get();

            $activeOnCurrentTask = $activeEntries->firstWhere('task_id', $task->id);

            if ($activeOnCurrentTask) {
                $this->markAssignmentInProgress($task, $user->id);
                $this->syncTaskStateFromAssignments($task);

                return [
                    'created' => false,
                ];
            }

            foreach ($activeEntries as $entry) {
                if ((int) $entry->task_id !== (int) $task->id) {
                    $entry->end();
                }
            }

            TaskTimeEntry::start($task, $user->id);
            $this->markAssignmentInProgress($task, $user->id);
            $this->syncTaskStateFromAssignments($task);

            return [
                'created' => true,
            ];
        });

        return response()->json([
            'success' => true,
            'message' => $result['created']
                ? 'Task time tracking started successfully'
                : 'Task is already being tracked by this user',
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
     * @return JsonResponse
     *
     * @throws AuthorizationException
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

        $paused = DB::transaction(function () use ($task, $user) {
            $activeEntry = TaskTimeEntry::query()
                ->where('task_id', $task->id)
                ->where('user_id', $user->id)
                ->where('is_active', true)
                ->lockForUpdate()
                ->first();

            if (! $activeEntry) {
                return false;
            }

            $activeEntry->end();
            $this->markAssignmentAccepted($task, $user->id);
            $this->syncTaskStateFromAssignments($task);

            return true;
        });

        if (! $paused) {
            return response()->json(['message' => 'No active time tracking for this task'], 422);
        }

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
     * @return JsonResponse
     *
     * @throws AuthorizationException
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
        $workingHoursService = app(WorkingHoursService::class);
        $now = now();
        if (! $workingHoursService->isWorkingTime($now)) {
            return response()->json([
                'error' => 'Task actions are not available outside working hours',
                'message' => 'Please resume your work during working hours',
            ], 403);
        }

        $result = DB::transaction(function () use ($task, $user) {
            $activeEntries = TaskTimeEntry::query()
                ->where('user_id', $user->id)
                ->where('is_active', true)
                ->lockForUpdate()
                ->get();

            $activeOnCurrentTask = $activeEntries->firstWhere('task_id', $task->id);

            if ($activeOnCurrentTask) {
                $this->markAssignmentInProgress($task, $user->id);
                $this->syncTaskStateFromAssignments($task);

                return [
                    'created' => false,
                ];
            }

            foreach ($activeEntries as $entry) {
                if ((int) $entry->task_id !== (int) $task->id) {
                    $entry->end();
                }
            }

            TaskTimeEntry::start($task, $user->id);
            $this->markAssignmentInProgress($task, $user->id);
            $this->syncTaskStateFromAssignments($task);

            return [
                'created' => true,
            ];
        });

        return response()->json([
            'success' => true,
            'message' => $result['created']
                ? 'Task time tracking resumed successfully'
                : 'Task is already being tracked by this user',
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
     * @return JsonResponse
     *
     * @throws AuthorizationException
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

        $markedDone = DB::transaction(function () use ($task, $user) {
            $activeEntry = TaskTimeEntry::query()
                ->where('task_id', $task->id)
                ->where('user_id', $user->id)
                ->where('is_active', true)
                ->lockForUpdate()
                ->first();

            if (! $activeEntry) {
                return null;
            }

            $activeEntry->end();
            $this->markAssignmentCompleted($task, $user->id);

            $previousState = $task->state;
            $this->syncTaskStateFromAssignments($task);
            $task->refresh();

            return $previousState !== 'Done' && $task->state === 'Done';
        });

        if ($markedDone === null) {
            return response()->json(['message' => 'No active time tracking for this task'], 422);
        }

        if ($markedDone) {
            app(NotificationService::class)->sendTaskCompletionExternalNotification(
                $task->id,
                $task->title,
                'Done',
                $user->id
            );
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
     * @return JsonResponse
     *
     * @throws AuthorizationException
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
     * @return JsonResponse
     *
     * @throws AuthorizationException
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
        $workingHoursService = app(WorkingHoursService::class);
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
     * @return JsonResponse
     *
     * @throws AuthorizationException
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
     * @return JsonResponse
     *
     * @throws AuthorizationException
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
     * @return JsonResponse
     *
     * @throws AuthorizationException
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
     * @return JsonResponse
     *
     * @throws AuthorizationException
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
     * @return JsonResponse
     *
     * @throws AuthorizationException
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
     * @return JsonResponse
     *
     * @throws AuthorizationException
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
     * @return JsonResponse
     *
     * @throws AuthorizationException
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
     * @return JsonResponse
     *
     * @throws AuthorizationException
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
     * @return Response
     *
     * @throws AuthorizationException
     */
    public function myTasks(Request $request)
    {
        /** @var User $user */
        $user = User::find(Auth::user()->id);

        if (! $user->hasPermission('task.read')) {
            abort(403, 'Insufficient permissions');
        }

        $query = Task::query()
            ->select('tasks.*')
            ->whereHas('assignedUsers', function ($query) {
                $query->where('user_id', Auth::id());
            })
            ->with([
                'createdBy:id,name',
                'assignedDepartment:id,name',
                'assignedUsers:id,name',
                'ticket:id,ticket_number,title',
                'taskType:id,name,code',
                'slaPolicy:id,name,priority',
                'forwardings:id,task_id,from_user_id,to_user_id,from_department_id,to_department_id,forwarded_by,status,created_at,forwarded_at',
                'forwardings.fromUser:id,name',
                'forwardings.toUser:id,name',
                'forwardings.fromDepartment:id,name',
                'forwardings.toDepartment:id,name',
                'forwardings.forwardedBy:id,name',
                'auditEvents:id,task_id,action,actor_user_id,occurred_at',
                'timeEntries',
            ])
            ->withCount('comments');

        $this->applyMyTaskSorting(
            $query,
            $request->query('sort_by'),
            $request->query('sort_order', 'asc'),
        );

        $perPage = (int) $request->query('per_page', 5);
        $page = (int) $request->query('page', 1);
        $tasks = $query
            ->paginate($perPage, ['*'], 'page', $page)
            ->withQueryString();

        $tasks->getCollection()->transform(function (Task $task): Task {
            return $this->appendForwardingMeta($task);
        });

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
            $metrics = WorkloadMetric::whereIn('user_id', $assignedUsers)
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

    /**
     * Mark the current user's assignment on this task as in progress.
     */
    private function markAssignmentInProgress(Task $task, int $userId): void
    {
        $assignment = $this->getActiveAssignment($task, $userId);

        if (! $assignment) {
            return;
        }

        $updates = [
            'state' => 'in_progress',
        ];

        if (! $assignment->accepted_at) {
            $updates['accepted_at'] = now();
        }

        $assignment->update($updates);
    }

    /**
     * Mark the current user's assignment as accepted while paused.
     */
    private function markAssignmentAccepted(Task $task, int $userId): void
    {
        $assignment = $this->getActiveAssignment($task, $userId);

        if (! $assignment) {
            return;
        }

        if ($assignment->state === 'completed' || $assignment->state === 'rejected') {
            return;
        }

        $updates = [
            'state' => 'accepted',
        ];

        if (! $assignment->accepted_at) {
            $updates['accepted_at'] = now();
        }

        $assignment->update($updates);
    }

    /**
     * Mark the current user's assignment as completed.
     */
    private function markAssignmentCompleted(Task $task, int $userId): void
    {
        $assignment = $this->getActiveAssignment($task, $userId);

        if (! $assignment) {
            return;
        }

        $assignment->update([
            'state' => 'completed',
            'completed_at' => now(),
        ]);
    }

    /**
     * Synchronize global task state from active assignment states.
     */
    private function syncTaskStateFromAssignments(Task $task): void
    {
        $assignments = $task->taskAssignments()
            ->where('is_active', true)
            ->get(['id', 'state']);

        if ($assignments->isEmpty()) {
            return;
        }

        $hasInProgress = $assignments->contains(function (TaskAssignment $assignment) {
            return $assignment->state === 'in_progress';
        });

        if ($hasInProgress) {
            $this->updateTaskStateIfValid($task, 'InProgress');

            return;
        }

        $allTerminal = $assignments->every(function (TaskAssignment $assignment) {
            return in_array($assignment->state, ['completed', 'rejected'], true);
        });

        if ($allTerminal) {
            $this->updateTaskStateIfValid($task, 'Done');
        }
    }

    /**
     * Update task state only if the transition is allowed.
     */
    private function updateTaskStateIfValid(Task $task, string $state): void
    {
        $task->refresh();

        if ($task->state === $state) {
            return;
        }

        if (! $task->isValidStateTransition($state)) {
            return;
        }

        $payload = [
            'state' => $state,
        ];

        if ($state !== 'Done') {
            $payload['completed_at'] = null;
        }

        $task->update($payload);
    }

    /**
     * Resolve an active task assignment for a user.
     */
    private function getActiveAssignment(Task $task, int $userId): ?TaskAssignment
    {
        return $task->taskAssignments()
            ->where('user_id', $userId)
            ->where('is_active', true)
            ->first();
    }

    /**
     * Normalize task schedule fields for create flows.
     *
     * @param  array<string, mixed>  $validatedData
     * @return array<string, mixed>
     */
    private function prepareScheduleForCreation(array $validatedData): array
    {
        $workingHoursService = app(WorkingHoursService::class);
        $dueDateCalculator = app(DueDateCalculatorService::class);
        $timeCalculator = app(TimeCalculatorService::class);

        $rawEstimate = isset($validatedData['estimate_hours'])
            ? (float) $validatedData['estimate_hours']
            : 0.0;
        $durationMissingOrZero = $rawEstimate <= 0;

        $startAt = ! empty($validatedData['start_at'])
            ? Carbon::parse((string) $validatedData['start_at'])
            : now();

        if ($durationMissingOrZero && ! $workingHoursService->isWorkingTime($startAt->toDateTime())) {
            $startAt = Carbon::instance($workingHoursService->getNextWorkingTime($startAt->toDateTime()));
        }

        $validatedData['start_at'] = $startAt->toDateTimeString();

        if ($durationMissingOrZero) {
            $derivedEstimateHours = 0.0;

            if (! empty($validatedData['due_at'])) {
                $dueAt = Carbon::parse((string) $validatedData['due_at']);
                if ($dueAt->greaterThan($startAt)) {
                    $workingSeconds = $timeCalculator->calculateWorkingDuration(
                        $startAt->toDateTime(),
                        $dueAt->toDateTime()
                    );
                    $derivedEstimateHours = round($workingSeconds / 3600, 2);
                }
            }

            if ($derivedEstimateHours <= 0) {
                $resolutionMinutes = $this->getSlaResolutionMinutes($validatedData);
                if ($resolutionMinutes > 0) {
                    $derivedEstimateHours = round($resolutionMinutes / 60, 2);
                }
            }

            if ($derivedEstimateHours > 0) {
                $validatedData['estimate_hours'] = $derivedEstimateHours;
            }
        }

        $finalEstimateHours = isset($validatedData['estimate_hours'])
            ? (float) $validatedData['estimate_hours']
            : 0.0;

        if ($finalEstimateHours > 0) {
            $shouldCalculateDueAt = empty($validatedData['due_at'])
                || Carbon::parse((string) $validatedData['due_at'])->lessThanOrEqualTo($startAt);

            if ($shouldCalculateDueAt) {
                $validatedData['due_at'] = Carbon::instance(
                    $dueDateCalculator->calculateDueDate($startAt->toDateTime(), $finalEstimateHours)
                )->toDateTimeString();
            }
        } elseif (empty($validatedData['due_at'])) {
            $validatedData['due_at'] = $startAt->toDateTimeString();
        }

        return $validatedData;
    }

    /**
     * Resolve SLA resolution minutes from request payload.
     *
     * @param  array<string, mixed>  $validatedData
     */
    private function getSlaResolutionMinutes(array $validatedData): int
    {
        $slaPolicyId = $validatedData['sla_policy_id'] ?? null;
        if (! $slaPolicyId) {
            return 0;
        }

        $slaPolicy = SlaPolicy::query()
            ->select('id', 'resolution_time_minutes')
            ->find($slaPolicyId);

        return (int) ($slaPolicy?->resolution_time_minutes ?? 0);
    }

    /**
     * Append forwarding metadata used by list cards, gantt bars, and task details.
     */
    private function appendForwardingMeta(Task $task): Task
    {
        $forwardings = $task->relationLoaded('forwardings')
            ? $task->forwardings
            : $task->forwardings()
                ->with(['fromUser:id,name', 'toUser:id,name', 'fromDepartment:id,name', 'toDepartment:id,name', 'forwardedBy:id,name'])
                ->get();

        $sortedForwardings = $forwardings
            ->sortBy(function (TaskForwarding $forwarding): string {
                return (string) ($forwarding->forwarded_at ?? $forwarding->created_at);
            })
            ->values();

        $waterfall = $sortedForwardings->map(function (TaskForwarding $forwarding): array {
            $fromUserName = $forwarding->fromUser?->name ?? $forwarding->forwardedBy?->name;
            $toUserName = $forwarding->toUser?->name;
            $fromDepartmentName = $forwarding->fromDepartment?->name;
            $toDepartmentName = $forwarding->toDepartment?->name;

            $fromLabel = $fromUserName
                ?? $fromDepartmentName
                ?? 'Unknown source';
            $toLabel = $toUserName
                ?? $toDepartmentName
                ?? 'Unknown target';

            return [
                'id' => $forwarding->id,
                'from_label' => $fromLabel,
                'to_label' => $toLabel,
                'from_user' => $fromUserName,
                'to_user' => $toUserName,
                'from_department' => $fromDepartmentName,
                'to_department' => $toDepartmentName,
                'status' => $forwarding->status,
                'forwarded_at' => optional($forwarding->forwarded_at)->toDateTimeString() ?? optional($forwarding->created_at)->toDateTimeString(),
            ];
        })->all();

        $task->setAttribute('has_forwardings', count($waterfall) > 0);
        $task->setAttribute('forwardings_count', count($waterfall));
        $task->setAttribute('forwarding_waterfall', $waterfall);

        return $task;
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
     * @return JsonResponse
     */
    public function calculateMinDueDate(Request $request)
    {
        $estimateHours = $request->query('estimate_hours');
        $startAt = $request->query('start_at');

        // Use provided start_at or default to now
        $startDate = $startAt ? Carbon::parse($startAt) : now();

        if (! $estimateHours || $estimateHours <= 0) {
            return response()->json([
                'success' => true,
                'data' => [
                    'min_due_date' => $startDate->toISOString(),
                ],
            ]);
        }

        $dueDateCalculator = app(DueDateCalculatorService::class);
        $dueDate = $dueDateCalculator->calculateDueDate($startDate, (float) $estimateHours);

        return response()->json([
            'success' => true,
            'data' => [
                'min_due_date' => $dueDate->format('Y-m-d\TH:i:sP'),
            ],
        ]);
    }

    /**
     * Apply SLA priority ordering to a task query.
     */
    private function applySlaPriorityOrdering(Builder $query): Builder
    {
        return $query
            ->leftJoin('sla_policies as sla_policy_order', 'tasks.sla_policy_id', '=', 'sla_policy_order.id')
            ->orderByRaw("CASE sla_policy_order.priority WHEN 'P1' THEN 1 WHEN 'P2' THEN 2 WHEN 'P3' THEN 3 WHEN 'P4' THEN 4 ELSE 5 END")
            ->orderByDesc('tasks.created_at');
    }

    /**
     * Apply ordering for my tasks list.
     */
    private function applyMyTaskSorting(Builder $query, ?string $sortBy, string $sortOrder): Builder
    {
        $sortBy = $sortBy ?: 'priority';
        $sortOrder = $sortOrder === 'desc' ? 'desc' : 'asc';

        if ($sortBy === 'priority') {
            return $query
                ->leftJoin('sla_policies as sla_policy_order', 'tasks.sla_policy_id', '=', 'sla_policy_order.id')
                ->select('tasks.*')
                ->orderByRaw("CASE sla_policy_order.priority WHEN 'P1' THEN 1 WHEN 'P2' THEN 2 WHEN 'P3' THEN 3 WHEN 'P4' THEN 4 ELSE 5 END {$sortOrder}")
                ->orderByDesc('tasks.created_at');
        }

        if ($sortBy === 'state') {
            return $query
                ->orderBy('tasks.state', $sortOrder)
                ->orderByDesc('tasks.created_at');
        }

        if ($sortBy === 'due_at') {
            return $query
                ->orderBy('tasks.due_at', $sortOrder)
                ->orderByDesc('tasks.created_at');
        }

        if ($sortBy === 'title') {
            return $query
                ->orderBy('tasks.title', $sortOrder)
                ->orderByDesc('tasks.created_at');
        }

        if ($sortBy === 'task_code') {
            return $query
                ->orderBy('tasks.task_code', $sortOrder)
                ->orderByDesc('tasks.created_at');
        }

        return $query
            ->orderBy('tasks.created_at', $sortOrder)
            ->orderByDesc('tasks.id');
    }
}
