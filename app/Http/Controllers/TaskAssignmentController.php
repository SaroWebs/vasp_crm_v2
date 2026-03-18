<?php

namespace App\Http\Controllers;

use App\Models\Task;
use App\Models\User;
use App\Models\TaskAssignment;
use App\Services\NotificationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

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
        
        if (!$user->hasPermission('task.read')) {
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
            'data' => $assignments
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $user = User::find(Auth::user()->id);
        
        if (!$user->hasPermission('task.assign')) {
            return response()->json(['message' => 'Insufficient permissions'], 403);
        }

        $validated = $request->validate([
            'task_id' => ['required', 'exists:tasks,id'],
            'user_id' => ['required', 'exists:users,id'],
            'assignment_notes' => ['nullable', 'string'],
            'estimated_time' => ['nullable', 'numeric', 'min:0'],
            'metadata' => ['nullable', 'array'],
        ]);

        // Check if assignment already exists
        $existingAssignment = TaskAssignment::where('task_id', $validated['task_id'])
            ->where('user_id', $validated['user_id'])
            ->first();

        if ($existingAssignment) {
            return response()->json([
                'success' => false,
                'message' => 'User is already assigned to this task',
                'data' => $existingAssignment
            ], 422);
        }

        // Check if user has permission to assign this task
        $task = Task::find($validated['task_id']);
        if (!$task) {
            return response()->json(['message' => 'Task not found'], 404);
        }

        // Create the assignment
        $assignment = TaskAssignment::create([
            'task_id' => $validated['task_id'],
            'user_id' => $validated['user_id'],
            'assigned_by' => Auth::user()->id,
            'assignment_notes' => $validated['assignment_notes'] ?? null,
            'estimated_time' => $validated['estimated_time'] ?? null,
            'metadata' => $validated['metadata'] ?? [],
            'assigned_at' => now(),
            'is_active' => true,
            'state' => 'pending'
        ]);

        // Send external notification (SMS/Email) to the assigned user
        $task = Task::find($validated['task_id']);
        $this->notificationService->sendTaskAssignmentExternalNotification(
            $task->id,
            $task->title,
            $validated['user_id'],
            Auth::user()->id
        );

        return response()->json([
            'success' => true,
            'message' => 'Task assignment created successfully',
            'data' => $assignment->load(['task:id,task_code,title', 'user:id,name,email', 'assignedBy:id,name'])
        ], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show($id)
    {
        $user = User::find(Auth::user()->id);
        
        if (!$user->hasPermission('task.read')) {
            return response()->json(['message' => 'Insufficient permissions'], 403);
        }

        $assignment = TaskAssignment::with(['task:id,task_code,title', 'user:id,name,email', 'assignedBy:id,name'])
            ->find($id);

        if (!$assignment) {
            return response()->json(['message' => 'Task assignment not found'], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $assignment
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, $id)
    {
        $user = User::find(Auth::user()->id);
        
        if (!$user->hasPermission('task.assign')) {
            return response()->json(['message' => 'Insufficient permissions'], 403);
        }

        $assignment = TaskAssignment::find($id);
        if (!$assignment) {
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
            'data' => $assignment->load(['task:id,task_code,title', 'user:id,name,email', 'assignedBy:id,name'])
        ]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy($id)
    {
        $user = User::find(Auth::user()->id);
        
        if (!$user->hasPermission('task.assign')) {
            return response()->json(['message' => 'Insufficient permissions'], 403);
        }

        $assignment = TaskAssignment::find($id);
        if (!$assignment) {
            return response()->json(['message' => 'Task assignment not found'], 404);
        }

        $assignment->delete();

        return response()->json([
            'success' => true,
            'message' => 'Task assignment deleted successfully'
        ]);
    }

    /**
     * Get all assignments for a specific task.
     */
    public function getTaskAssignments($task_id)
    {
        $user = User::find(Auth::user()->id);
        
        if (!$user->hasPermission('task.read')) {
            return response()->json(['message' => 'Insufficient permissions'], 403);
        }

        $task = Task::find($task_id);
        if (!$task) {
            return response()->json(['message' => 'Task not found'], 404);
        }

        $assignments = TaskAssignment::where('task_id', $task_id)
            ->with(['user:id,name,email', 'assignedBy:id,name'])
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $assignments
        ]);
    }

    /**
     * Assign a user to a task.
     */
    public function assignUserToTask(Request $request, $task_id)
    {
        $user = User::find(Auth::user()->id);
        
        if (!$user->hasPermission('task.assign')) {
            return response()->json(['message' => 'Insufficient permissions'], 403);
        }

        $task = Task::find($task_id);
        if (!$task) {
            return response()->json(['message' => 'Task not found'], 404);
        }

        $validated = $request->validate([
            'user_id' => ['required', 'exists:users,id'],
            'assignment_notes' => ['nullable', 'string'],
            'estimated_time' => ['nullable', 'numeric', 'min:0'],
            'metadata' => ['nullable', 'array'],
        ]);

        // Check if assignment already exists
        $existingAssignment = TaskAssignment::where('task_id', $task_id)
            ->where('user_id', $validated['user_id'])
            ->first();

        if ($existingAssignment) {
            return response()->json([
                'success' => false,
                'message' => 'User is already assigned to this task',
                'data' => $existingAssignment
            ], 422);
        }

        // Create the assignment
        $assignment = TaskAssignment::create([
            'task_id' => $task_id,
            'user_id' => $validated['user_id'],
            'assigned_by' => Auth::user()->id,
            'assignment_notes' => $validated['assignment_notes'] ?? null,
            'estimated_time' => $validated['estimated_time'] ?? null,
            'metadata' => $validated['metadata'] ?? [],
            'assigned_at' => now(),
            'is_active' => true,
            'state' => 'pending'
        ]);

        // Send external notification (SMS/Email) to the assigned user
        $task = Task::find($task_id);
        $this->notificationService->sendTaskAssignmentExternalNotification(
            $task->id,
            $task->title,
            $validated['user_id'],
            Auth::user()->id
        );

        return response()->json([
            'success' => true,
            'message' => 'User assigned to task successfully',
            'data' => $assignment->load(['user:id,name,email', 'assignedBy:id,name'])
        ], 201);
    }

    /**
     * Unassign a user from a task.
     */
    public function unassignUserFromTask(Request $request, $task_id)
    {
        $user = User::find(Auth::user()->id);

        if (!$user->hasPermission('task.assign')) {
            return response()->json(['message' => 'Insufficient permissions'], 403);
        }

        $task = Task::find($task_id);
        if (!$task) {
            return response()->json(['message' => 'Task not found'], 404);
        }

        $validated = $request->validate([
            'user_id' => ['required', 'exists:users,id'],
        ]);

        $assignment = TaskAssignment::withTrashed()
            ->where('task_id', $task_id)
            ->where('user_id', $validated['user_id'])
            ->first();

        if (!$assignment) {
            return response()->json([
                'success' => false,
                'message' => 'User is not assigned to this task'
            ], 422);
        }

        $assignment->forceDelete();

        return response()->json([
            'success' => true,
            'message' => 'User unassigned from task successfully'
        ]);
    }

    /**
     * Get assignments for the current user.
     */
    public function getMyAssignments(Request $request)
    {
        $user = User::find(Auth::user()->id);
        
        if (!$user->hasPermission('task.read')) {
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
            'data' => $assignments
        ]);
    }

    /**
     * Accept a task assignment.
     */
    public function acceptAssignment($assignment_id)
    {
        $user = User::find(Auth::user()->id);
        
        if (!$user->hasPermission('task.update')) {
            return response()->json(['message' => 'Insufficient permissions'], 403);
        }

        $assignment = TaskAssignment::where('id', $assignment_id)
            ->where('user_id', Auth::user()->id)
            ->first();

        if (!$assignment) {
            return response()->json(['message' => 'Assignment not found or not assigned to you'], 404);
        }

        if ($assignment->state !== 'pending') {
            return response()->json([
                'success' => false,
                'message' => 'Assignment is not in pending state'
            ], 422);
        }

        $assignment->markAsAccepted();

        return response()->json([
            'success' => true,
            'message' => 'Task assignment accepted successfully',
            'data' => $assignment->load(['task:id,task_code,title', 'assignedBy:id,name'])
        ]);
    }

    /**
     * Mark a task assignment as completed.
     */
    public function completeAssignment($assignment_id)
    {
        $user = User::find(Auth::user()->id);
        
        if (!$user->hasPermission('task.update')) {
            return response()->json(['message' => 'Insufficient permissions'], 403);
        }

        $assignment = TaskAssignment::where('id', $assignment_id)
            ->where('user_id', Auth::user()->id)
            ->first();

        if (!$assignment) {
            return response()->json(['message' => 'Assignment not found or not assigned to you'], 404);
        }

        if ($assignment->state === 'completed') {
            return response()->json([
                'success' => false,
                'message' => 'Assignment is already completed'
            ], 422);
        }

        $assignment->markAsCompleted();

        return response()->json([
            'success' => true,
            'message' => 'Task assignment marked as completed successfully',
            'data' => $assignment->load(['task:id,task_code,title', 'assignedBy:id,name'])
        ]);
    }

    /**
     * Get active assignments for a task.
     */
    public function getActiveTaskAssignments($task_id)
    {
        $user = User::find(Auth::user()->id);
        
        if (!$user->hasPermission('task.read')) {
            return response()->json(['message' => 'Insufficient permissions'], 403);
        }

        $task = Task::find($task_id);
        if (!$task) {
            return response()->json(['message' => 'Task not found'], 404);
        }

        $assignments = TaskAssignment::where('task_id', $task_id)
            ->where('is_active', true)
            ->with(['user:id,name,email', 'assignedBy:id,name'])
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $assignments
        ]);
    }

    /**
     * Get assignment statistics for a task.
     */
    public function getTaskAssignmentStats($task_id)
    {
        $user = User::find(Auth::user()->id);
        
        if (!$user->hasPermission('task.read')) {
            return response()->json(['message' => 'Insufficient permissions'], 403);
        }

        $task = Task::find($task_id);
        if (!$task) {
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
            'data' => $stats
        ]);
    }

    /**
     * Get available users that can be assigned to a task.
     */
    public function getAvailableUsers($task_id)
    {
        $user = User::find(Auth::user()->id);
        
        if (!$user->hasPermission('task.read')) {
            return response()->json(['message' => 'Insufficient permissions'], 403);
        }

        $task = Task::find($task_id);
        if (!$task) {
            return response()->json(['message' => 'Task not found'], 404);
        }

        // Get users already assigned to this task
        $assignedUserIds = TaskAssignment::where('task_id', $task_id)
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
            'data' => $availableUsers
        ]);
    }
}