<?php

namespace App\Http\Controllers;

use App\Models\Task;
use App\Models\TaskHistory;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;

class TaskHistoryController extends Controller
{
    /**
     * Display a listing of task history records for a specific task.
     */
    public function index(Task $task): JsonResponse
    {
        $user = User::find(Auth::user()->id);
        
        if (!$user->hasPermission('task.read')) {
            return response()->json(['message' => 'Insufficient permissions'], 403);
        }

        $history = TaskHistory::where('task_id', $task->id)
            ->with(['changedBy' => function($query) {
                $query->select('id', 'name', 'email');
            }])
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $history,
        ]);
    }

    /**
     * Store a newly created history record in storage.
     */
    public function store(Request $request, Task $task): JsonResponse
    {
        $user = User::find(Auth::user()->id);
        
        if (!$user->hasPermission('task.update')) {
            return response()->json(['message' => 'Insufficient permissions'], 403);
        }

        $validated = $request->validate([
            'old_status' => 'required|string',
            'new_status' => 'required|string',
            'change_reason' => 'nullable|string|max:1000',
            'metadata' => 'nullable|array',
        ]);

        $history = TaskHistory::create([
            'task_id' => $task->id,
            'old_status' => $validated['old_status'],
            'new_status' => $validated['new_status'],
            'changed_by' => Auth::id(),
            'change_reason' => $validated['change_reason'] ?? null,
            'metadata' => $validated['metadata'] ?? null,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Task history recorded successfully',
            'data' => $history->load('changedBy'),
        ], 201);
    }

    /**
     * Display the specified history record.
     */
    public function show(Task $task, TaskHistory $taskHistory): JsonResponse
    {
        $user = User::find(Auth::user()->id);
        
        if (!$user->hasPermission('task.read')) {
            return response()->json(['message' => 'Insufficient permissions'], 403);
        }

        // Ensure history record belongs to the task
        if ($taskHistory->task_id !== $task->id) {
            return response()->json([
                'success' => false,
                'message' => 'History record not found for this task',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $taskHistory->load('changedBy'),
        ]);
    }

    /**
     * Update the specified history record in storage.
     */
    public function update(Request $request, Task $task, TaskHistory $taskHistory): JsonResponse
    {
        $user = User::find(Auth::user()->id);
        
        if (!$user->hasPermission('task.update')) {
            return response()->json(['message' => 'Insufficient permissions'], 403);
        }

        // Ensure history record belongs to the task
        if ($taskHistory->task_id !== $task->id) {
            return response()->json([
                'success' => false,
                'message' => 'History record not found for this task',
            ], 404);
        }

        // Only the user who created the record can update it
        if ($taskHistory->changed_by !== Auth::id() && !$user->hasRole('admin')) {
            return response()->json([
                'success' => false,
                'message' => 'You are not authorized to update this history record',
            ], 403);
        }

        $validated = $request->validate([
            'old_status' => 'sometimes|string',
            'new_status' => 'sometimes|string',
            'change_reason' => 'nullable|string|max:1000',
            'metadata' => 'nullable|array',
        ]);

        $taskHistory->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Task history updated successfully',
            'data' => $taskHistory->load('changedBy'),
        ]);
    }

    /**
     * Remove the specified history record from storage.
     */
    public function destroy(Task $task, TaskHistory $taskHistory): JsonResponse
    {
        $user = User::find(Auth::user()->id);
        
        if (!$user->hasPermission('task.update')) {
            return response()->json(['message' => 'Insufficient permissions'], 403);
        }

        // Ensure history record belongs to the task
        if ($taskHistory->task_id !== $task->id) {
            return response()->json([
                'success' => false,
                'message' => 'History record not found for this task',
            ], 404);
        }

        // Only the user who created the record or admin can delete it
        if ($taskHistory->changed_by !== Auth::id() && !$user->hasRole('admin')) {
            return response()->json([
                'success' => false,
                'message' => 'You are not authorized to delete this history record',
            ], 403);
        }

        $taskHistory->delete();

        return response()->json([
            'success' => true,
            'message' => 'Task history deleted successfully',
        ]);
    }

    /**
     * Get history by user.
     */
    public function getByUser(Task $task, $userId): JsonResponse
    {
        $user = User::find(Auth::user()->id);
        
        if (!$user->hasPermission('task.read')) {
            return response()->json(['message' => 'Insufficient permissions'], 403);
        }

        $history = TaskHistory::where('task_id', $task->id)
            ->where('changed_by', $userId)
            ->with(['changedBy' => function($query) {
                $query->select('id', 'name', 'email');
            }])
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $history,
        ]);
    }

    /**
     * Get history by status change.
     */
    public function getByStatusChange(Task $task, $oldStatus, $newStatus): JsonResponse
    {
        $user = User::find(Auth::user()->id);
        
        if (!$user->hasPermission('task.read')) {
            return response()->json(['message' => 'Insufficient permissions'], 403);
        }

        $history = TaskHistory::where('task_id', $task->id)
            ->where('old_status', $oldStatus)
            ->where('new_status', $newStatus)
            ->with(['changedBy' => function($query) {
                $query->select('id', 'name', 'email');
            }])
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $history,
        ]);
    }

    /**
     * Get history statistics for a task.
     */
    public function getStatistics(Task $task): JsonResponse
    {
        $user = User::find(Auth::user()->id);
        
        if (!$user->hasPermission('task.read')) {
            return response()->json(['message' => 'Insufficient permissions'], 403);
        }

        $stats = [
            'total_changes' => TaskHistory::where('task_id', $task->id)->count(),
            'status_changes' => TaskHistory::where('task_id', $task->id)
                ->whereNotNull('old_status')
                ->whereNotNull('new_status')
                ->count(),
            'by_status' => TaskHistory::where('task_id', $task->id)
                ->selectRaw('old_status, new_status, count(*) as count')
                ->groupBy('old_status', 'new_status')
                ->get(),
            'by_user' => TaskHistory::where('task_id', $task->id)
                ->selectRaw('changed_by, count(*) as count')
                ->groupBy('changed_by')
                ->with(['changedBy' => function($query) {
                    $query->select('id', 'name');
                }])
                ->get(),
        ];

        return response()->json([
            'success' => true,
            'data' => $stats,
        ]);
    }

    /**
     * Get recent history changes.
     */
    public function getRecentChanges(Request $request): JsonResponse
    {
        $user = User::find(Auth::user()->id);
        
        if (!$user->hasPermission('task.read')) {
            return response()->json(['message' => 'Insufficient permissions'], 403);
        }

        $limit = $request->query('limit', 50);

        $history = TaskHistory::with([
            'task' => function($query) {
                $query->select('id', 'title', 'task_code');
            },
            'changedBy' => function($query) {
                $query->select('id', 'name', 'email');
            }
        ])
        ->orderBy('created_at', 'desc')
        ->limit($limit)
        ->get();

        return response()->json([
            'success' => true,
            'data' => $history,
        ]);
    }
}
