<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreTaskAssignmentRequest;
use App\Http\Requests\UnassignTaskAssignmentRequest;
use App\Models\Task;
use App\Models\TaskAssignment;
use App\Models\User;
use App\Services\NotificationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class TaskAssignmentController extends Controller
{
    /**
     * Create a new controller instance.
     */
    public function __construct(
        protected NotificationService $notificationService
    ) {}

    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $user = User::find(Auth::user()->id);

        if (! $user->hasPermission('task.read')) {
            return response()->json(['message' => 'Insufficient permissions'], 403);
        }

        $query = TaskAssignment::with(['task:id,task_code,title', 'user:id,name,email', 'assignedBy:id,name'])
            ->orderBy('created_at', 'desc');

        // Apply filters if provided
        if ($request->has('task_id')) {
            $query->where('task_id', $request->task_id);
        }

        if ($request->has('user_id')) {
            $query->where('user_id', $request->user_id);
        }

        if ($request->has('is_active')) {
            $query->where('is_active', filter_var($request->is_active, FILTER_VALIDATE_BOOLEAN));
        }

        if ($request->has('state')) {
            $query->where('state', $request->state);
        }

        $assignments = $query->paginate(15);

        return response()->json([
            'success' => true,
            'data' => $assignments,
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreTaskAssignmentRequest $request)
    {
        $user = User::find(Auth::user()->id);

        if (! $user->hasPermission('task.assign')) {
            return response()->json(['message' => 'Insufficient permissions'], 403);
        }

        $validated = $request->validated();

        // Check if assignment already exists
        $existingAssignment = TaskAssignment::where('task_id', $validated['task_id'])
            ->where('user_id', $validated['user_id'])
            ->where('is_active', true)
            ->first();

        if ($existingAssignment) {
            return response()->json([
                'success' => false,
                'message' => 'User is already assigned to this task',
                'data' => $existingAssignment,
            ], 422);
        }

        // Check if user has permission to assign this task
        $task = Task::find($validated['task_id']);
        if (! $task) {
            return response()->json(['message' => 'Task not found'], 404);
        }

        $parentAssignment = $this->resolveParentAssignmentFor($task, $user);
        if ($parentAssignment === false) {
            return response()->json(['message' => 'You can only delegate tasks assigned to you'], 403);
        }

        $assignment = DB::transaction(function () use ($task, $validated, $parentAssignment) {
            return $task->assignUser(
                $validated['user_id'],
                Auth::user()->id,
                $validated['assignment_notes'] ?? null,
                $validated['metadata'] ?? [],
                $validated['estimated_time'] ?? null,
                $parentAssignment?->id
            );
        });

        // Send external notification (SMS/Email) to the assigned user
        $this->notificationService->sendTaskAssignmentExternalNotification(
            $task->id,
            $task->title,
            $validated['user_id'],
            Auth::user()->id
        );

        return response()->json([
            'success' => true,
            'message' => 'Task assignment created successfully',
            'data' => $assignment->load(['task:id,task_code,title', 'user:id,name,email', 'assignedBy:id,name', 'parentAssignment.user:id,name,email']),
        ], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show($id)
    {
        $user = User::find(Auth::user()->id);

        if (! $user->hasPermission('task.read')) {
            return response()->json(['message' => 'Insufficient permissions'], 403);
        }

        $assignment = TaskAssignment::with(['task:id,task_code,title', 'user:id,name,email', 'assignedBy:id,name'])
            ->find($id);

        if (! $assignment) {
            return response()->json(['message' => 'Task assignment not found'], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $assignment,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, $id)
    {
        $user = User::find(Auth::user()->id);

        if (! $user->hasPermission('task.assign')) {
            return response()->json(['message' => 'Insufficient permissions'], 403);
        }

        $assignment = TaskAssignment::find($id);
        if (! $assignment) {
            return response()->json(['message' => 'Task assignment not found'], 404);
        }

        $validated = $request->validate([
            'assignment_notes' => ['nullable', 'string'],
            'estimated_time' => ['nullable', 'numeric', 'min:0'],
            'metadata' => ['nullable', 'array'],
            'state' => ['nullable', 'in:pending,accepted,in_progress,completed,rejected'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        $assignment->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Task assignment updated successfully',
            'data' => $assignment->load(['task:id,task_code,title', 'user:id,name,email', 'assignedBy:id,name']),
        ]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy($id)
    {
        $user = User::find(Auth::user()->id);

        if (! $user->hasPermission('task.assign')) {
            return response()->json(['message' => 'Insufficient permissions'], 403);
        }

        $assignment = TaskAssignment::find($id);
        if (! $assignment) {
            return response()->json(['message' => 'Task assignment not found'], 404);
        }

        $assignment->delete();

        return response()->json([
            'success' => true,
            'message' => 'Task assignment deleted successfully',
        ]);
    }

    /**
     * Get all assignments for a specific task.
     */
    public function getTaskAssignments($task_id)
    {
        $user = User::find(Auth::user()->id);

        if (! $user->hasPermission('task.read')) {
            return response()->json(['message' => 'Insufficient permissions'], 403);
        }

        $task = Task::find($task_id);
        if (! $task) {
            return response()->json(['message' => 'Task not found'], 404);
        }

        $assignments = TaskAssignment::where('task_id', $task_id)
            ->where('is_active', true)
            ->with(['user:id,name,email', 'assignedBy:id,name', 'parentAssignment.user:id,name,email', 'activeChildAssignments'])
            ->orderBy('created_at', 'desc')
            ->get();

        $assignments->each(function (TaskAssignment $assignment) use ($task, $user): void {
            $assignment->setAttribute('can_remove_assignment', $this->canRemoveAssignment($task, $user, $assignment));
            $assignment->setAttribute('active_descendants_count', $assignment->collectActiveDescendants()->count());
        });

        return response()->json([
            'success' => true,
            'data' => $assignments,
        ]);
    }

    /**
     * Assign a user to a task.
     */
    public function assignUserToTask(StoreTaskAssignmentRequest $request, $task_id)
    {
        $user = User::find(Auth::user()->id);

        if (! $user->hasPermission('task.assign')) {
            return response()->json(['message' => 'Insufficient permissions'], 403);
        }

        $task = Task::find($task_id);
        if (! $task) {
            return response()->json(['message' => 'Task not found'], 404);
        }

        $validated = $request->validated();

        // Check if assignment already exists
        $existingAssignment = TaskAssignment::where('task_id', $task_id)
            ->where('user_id', $validated['user_id'])
            ->where('is_active', true)
            ->first();

        if ($existingAssignment) {
            return response()->json([
                'success' => false,
                'message' => 'User is already assigned to this task',
                'data' => $existingAssignment,
            ], 422);
        }

        $parentAssignment = $this->resolveParentAssignmentFor($task, $user);
        if ($parentAssignment === false) {
            return response()->json(['message' => 'You can only delegate tasks assigned to you'], 403);
        }

        $assignment = DB::transaction(function () use ($task, $validated, $parentAssignment) {
            return $task->assignUser(
                $validated['user_id'],
                Auth::user()->id,
                $validated['assignment_notes'] ?? null,
                $validated['metadata'] ?? [],
                $validated['estimated_time'] ?? null,
                $parentAssignment?->id
            );
        });

        // Send external notification (SMS/Email) to the assigned user
        $this->notificationService->sendTaskAssignmentExternalNotification(
            $task->id,
            $task->title,
            $validated['user_id'],
            Auth::user()->id
        );

        return response()->json([
            'success' => true,
            'message' => 'User assigned to task successfully',
            'data' => $assignment->load(['user:id,name,email', 'assignedBy:id,name', 'parentAssignment.user:id,name,email']),
        ], 201);
    }

    /**
     * Unassign a user from a task.
     */
    public function unassignUserFromTask(UnassignTaskAssignmentRequest $request, $task_id)
    {
        $user = User::find(Auth::user()->id);

        if (! $user->hasPermission('task.assign')) {
            return response()->json(['message' => 'Insufficient permissions'], 403);
        }

        $task = Task::find($task_id);
        if (! $task) {
            return response()->json(['message' => 'Task not found'], 404);
        }

        $validated = $request->validated();

        $assignment = TaskAssignment::query()
            ->where('task_id', $task_id)
            ->where('user_id', $validated['user_id'])
            ->where('is_active', true)
            ->first();

        if (! $assignment) {
            return response()->json([
                'success' => false,
                'message' => 'User is not assigned to this task',
            ], 422);
        }

        if (! $this->canRemoveAssignment($task, $user, $assignment)) {
            return response()->json([
                'success' => false,
                'message' => 'You can only remove assignees you delegated directly',
            ], 403);
        }

        $removedAssignmentCount = DB::transaction(function () use ($assignment, $user) {
            $assignmentsToRemove = $assignment->collectActiveDescendants()
                ->push($assignment)
                ->unique('id');

            TaskAssignment::query()
                ->whereIn('id', $assignmentsToRemove->pluck('id'))
                ->update([
                    'is_active' => false,
                    'unassigned_by' => $user->id,
                    'unassigned_at' => now(),
                    'updated_at' => now(),
                ]);

            return $assignmentsToRemove->count();
        });

        return response()->json([
            'success' => true,
            'message' => 'User unassigned from task successfully',
            'removed_assignments_count' => $removedAssignmentCount,
        ]);
    }

    /**
     * Get assignments for the current user.
     */
    public function getMyAssignments(Request $request)
    {
        $user = User::find(Auth::user()->id);

        if (! $user->hasPermission('task.read')) {
            return response()->json(['message' => 'Insufficient permissions'], 403);
        }

        $query = TaskAssignment::where('user_id', Auth::user()->id)
            ->with(['task:id,task_code,title,state', 'assignedBy:id,name'])
            ->orderBy('created_at', 'desc');

        if ($request->has('state')) {
            $query->where('state', $request->state);
        }

        if ($request->has('is_active')) {
            $query->where('is_active', filter_var($request->is_active, FILTER_VALIDATE_BOOLEAN));
        }

        $assignments = $query->paginate(15);

        return response()->json([
            'success' => true,
            'data' => $assignments,
        ]);
    }

    /**
     * Accept a task assignment.
     */
    public function acceptAssignment($assignment_id)
    {
        $user = User::find(Auth::user()->id);

        if (! $user->hasPermission('task.update')) {
            return response()->json(['message' => 'Insufficient permissions'], 403);
        }

        $assignment = TaskAssignment::where('id', $assignment_id)
            ->where('user_id', Auth::user()->id)
            ->first();

        if (! $assignment) {
            return response()->json(['message' => 'Assignment not found or not assigned to you'], 404);
        }

        if ($assignment->state !== 'pending') {
            return response()->json([
                'success' => false,
                'message' => 'Assignment is not in pending state',
            ], 422);
        }

        $assignment->markAsAccepted();

        return response()->json([
            'success' => true,
            'message' => 'Task assignment accepted successfully',
            'data' => $assignment->load(['task:id,task_code,title', 'assignedBy:id,name']),
        ]);
    }

    /**
     * Mark a task assignment as completed.
     */
    public function completeAssignment($assignment_id)
    {
        $user = User::find(Auth::user()->id);

        if (! $user->hasPermission('task.update')) {
            return response()->json(['message' => 'Insufficient permissions'], 403);
        }

        $assignment = TaskAssignment::where('id', $assignment_id)
            ->where('user_id', Auth::user()->id)
            ->first();

        if (! $assignment) {
            return response()->json(['message' => 'Assignment not found or not assigned to you'], 404);
        }

        if ($assignment->state === 'completed') {
            return response()->json([
                'success' => false,
                'message' => 'Assignment is already completed',
            ], 422);
        }

        $assignment->markAsCompleted();

        return response()->json([
            'success' => true,
            'message' => 'Task assignment marked as completed successfully',
            'data' => $assignment->load(['task:id,task_code,title', 'assignedBy:id,name']),
        ]);
    }

    /**
     * Get active assignments for a task.
     */
    public function getActiveTaskAssignments($task_id)
    {
        $user = User::find(Auth::user()->id);

        if (! $user->hasPermission('task.read')) {
            return response()->json(['message' => 'Insufficient permissions'], 403);
        }

        $task = Task::find($task_id);
        if (! $task) {
            return response()->json(['message' => 'Task not found'], 404);
        }

        $assignments = TaskAssignment::where('task_id', $task_id)
            ->where('is_active', true)
            ->with(['user:id,name,email', 'assignedBy:id,name'])
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $assignments,
        ]);
    }

    /**
     * Get assignment statistics for a task.
     */
    public function getTaskAssignmentStats($task_id)
    {
        $user = User::find(Auth::user()->id);

        if (! $user->hasPermission('task.read')) {
            return response()->json(['message' => 'Insufficient permissions'], 403);
        }

        $task = Task::find($task_id);
        if (! $task) {
            return response()->json(['message' => 'Task not found'], 404);
        }

        $stats = [
            'total_assignments' => TaskAssignment::where('task_id', $task_id)->count(),
            'active_assignments' => TaskAssignment::where('task_id', $task_id)->where('is_active', true)->count(),
            'completed_assignments' => TaskAssignment::where('task_id', $task_id)->where('state', 'completed')->count(),
            'pending_assignments' => TaskAssignment::where('task_id', $task_id)->where('state', 'pending')->count(),
            'in_progress_assignments' => TaskAssignment::where('task_id', $task_id)->where('state', 'in_progress')->count(),
        ];

        return response()->json([
            'success' => true,
            'data' => $stats,
        ]);
    }

    /**
     * Get available users that can be assigned to a task.
     */
    public function getAvailableUsers($task_id)
    {
        $user = User::find(Auth::user()->id);

        if (! $user->hasPermission('task.read')) {
            return response()->json(['message' => 'Insufficient permissions'], 403);
        }

        $task = Task::find($task_id);
        if (! $task) {
            return response()->json(['message' => 'Task not found'], 404);
        }

        // Get users already assigned to this task
        $assignedUserIds = TaskAssignment::where('task_id', $task_id)
            ->where('is_active', true)
            ->pluck('user_id')
            ->toArray();

        // Get all users except already assigned ones
        $availableUsers = User::whereNotIn('id', $assignedUserIds)
            ->where('status', 'active')
            ->select('id', 'name', 'email')
            ->orderBy('name')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $availableUsers,
        ]);
    }

    /**
     * Resolve the parent assignment for a user delegating a task.
     */
    private function resolveParentAssignmentFor(Task $task, User $user): TaskAssignment|false|null
    {
        if ($this->canManageAssignmentTree($task, $user)) {
            return null;
        }

        return TaskAssignment::query()
            ->where('task_id', $task->id)
            ->where('user_id', $user->id)
            ->where('is_active', true)
            ->first() ?: false;
    }

    /**
     * Determine whether a user can remove the assignment.
     */
    private function canRemoveAssignment(Task $task, User $user, TaskAssignment $assignment): bool
    {
        if ($this->canManageAssignmentTree($task, $user)) {
            return true;
        }

        $currentUserAssignment = TaskAssignment::query()
            ->where('task_id', $task->id)
            ->where('user_id', $user->id)
            ->where('is_active', true)
            ->first();

        if (! $currentUserAssignment) {
            return false;
        }

        return (int) $assignment->parent_assignment_id === (int) $currentUserAssignment->id;
    }

    /**
     * Determine whether a user can manage any branch on the task.
     */
    private function canManageAssignmentTree(Task $task, User $user): bool
    {
        return $user->hasRole(['super-admin', 'manager'])
            || (int) $task->created_by === (int) $user->id;
    }
}
