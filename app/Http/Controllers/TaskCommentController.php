<?php

namespace App\Http\Controllers;

use App\Models\Task;
use App\Models\TaskComment;
use App\Models\TaskCommentAttachment;
use App\Models\TaskAssignment;
use App\Models\User;
use App\Models\OrganizationUser;
use App\Services\NotificationService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;

class TaskCommentController extends Controller
{
    /**
     * Create a new controller instance.
     */
    public function __construct(
        protected NotificationService $notificationService
    ) {}

    /**
     * Display a listing of comments for a task.
     */
    public function index(Task $task): JsonResponse
    {
        // Check if user is authenticated
        if (!Auth::guard('web')->check() && !Auth::guard('admin')->check()) {
            return response()->json([
                'success' => false,
                'message' => 'Authentication required',
            ], 401);
        }

        $comments = $task->comments()
            ->with(['user:id,name,email', 'organizationUser:id,name,email', 'deletedByUser:id,name,email', 'attachments'])
            ->withTrashed() // Include soft deleted comments
            ->orderBy('created_at', 'asc')
            ->get()
            ->map(function ($comment) {
                return [
                    'id' => $comment->id,
                    'task_id' => $comment->task_id,
                    'comment_text' => $comment->comment_text,
                    'commented_by_type' => $comment->commented_by_type,
                    'commented_by' => $comment->commented_by_id,
                    'is_internal' => $comment->is_internal,
                    'created_at' => $comment->created_at,
                    'updated_at' => $comment->updated_at,
                    'deleted_at' => $comment->deleted_at, // Include deletion info
                    'deleted_by' => $comment->deleted_by,
                    'commenter' => $comment->commented_by_type === 'user'
                        ? $comment->user
                        : $comment->organizationUser,
                    'deleted_by_user' => $comment->deletedByUser,
                    'attachments' => $comment->attachments,
                ];
            });

        return response()->json([
            'success' => true,
            'data' => $comments,
        ]);
    }

    /**
     * Store a newly created comment.
     */
    public function store(Request $request, Task $task): JsonResponse
    {

        $validated = $request->validate([
            'comment_text' => 'nullable|string|max:5000',
            'is_internal' => 'sometimes|boolean',
            'attachments.*' => 'nullable|file|max:10240', // 10MB max per file
        ]);

        // Ensure either text or attachments are present
        if (empty($validated['comment_text']) && !$request->hasFile('attachments')) {
            return response()->json([
                'success' => false,
                'message' => 'Comment text or attachments are required',
                'errors' => ['comment_text' => ['Comment text or attachments are required']]
            ], 422);
        }

        // Determine commenter type and ID based on auth guard
        $commentedByType = 'user';
        $commentedBy = null;

        if (Auth::guard('web')->check()) {
            $commentedByType = 'user';
            $commentedBy = Auth::guard('web')->id();
        } elseif (Auth::guard('admin')->check()) {
            $commentedByType = 'user';
            $commentedBy = Auth::guard('admin')->id();
        } else {
            return response()->json([
                'success' => false,
                'message' => 'Authentication required',
            ], 401);
        }

        $comment = $task->comments()->create([
            'comment_text' => $validated['comment_text'],
            'commented_by_type' => $commentedByType,
            'commented_by_id' => $commentedBy,
            'is_internal' => $validated['is_internal'] ?? false,
        ]);

        // Handle File Attachments
        if ($request->hasFile('attachments')) {
            foreach ($request->file('attachments') as $file) {
                $this->storeCommentAttachment($comment, $file, $request, $commentedByType, $commentedBy);
            }
        }

        // Load the commenter relationship
        if ($commentedByType === 'user') {
            $comment->load('user:id,name,email');
        } else {
            $comment->load('organizationUser:id,name,email');
        }
        $comment->load('attachments');

        $commentData = [
            'id' => $comment->id,
            'task_id' => $comment->task_id,
            'comment_text' => $comment->comment_text,
            'commented_by_type' => $comment->commented_by_type,
            'commented_by' => $comment->commented_by_id,
            'is_internal' => $comment->is_internal,
            'created_at' => $comment->created_at,
            'updated_at' => $comment->updated_at,
            'commenter' => $commentedByType === 'user'
                ? $comment->user
                : $comment->organizationUser,
            'attachments' => $comment->attachments,
        ];

        // Send notification to all assigned users in the task hierarchy
        $this->sendCommentNotifications($task, $comment, $commentedBy);

        return response()->json([
            'success' => true,
            'message' => 'Comment added successfully',
            'data' => $commentData,
        ], 201);
    }

    /**
     * Update the specified comment.
     */
    public function update(Request $request, Task $task, TaskComment $comment): JsonResponse
    {
        // Ensure comment belongs to the task
        if ($comment->task_id !== $task->id) {
            return response()->json([
                'success' => false,
                'message' => 'Comment not found for this task',
            ], 404);
        }

        // Check if user can edit this comment (only the commenter can edit)
        $canEdit = false;
        if (Auth::guard('web')->check() && $comment->commented_by_type === 'user' && $comment->commented_by_id === Auth::guard('web')->id()) {
            $canEdit = true;
        } elseif (Auth::guard('admin')->check() && $comment->commented_by_type === 'user' && $comment->commented_by_id === Auth::guard('admin')->id()) {
            $canEdit = true;
        }

        if (!$canEdit) {
            return response()->json([
                'success' => false,
                'message' => 'You are not authorized to edit this comment',
            ], 403);
        }

        // Check if comment is deleted
        if ($comment->trashed()) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot edit a deleted comment',
            ], 422);
        }

        $validated = $request->validate([
            'comment_text' => 'required|string|max:5000',
        ]);

        $comment->update([
            'comment_text' => $validated['comment_text'],
        ]);

        $commentData = [
            'id' => $comment->id,
            'task_id' => $comment->task_id,
            'comment_text' => $comment->comment_text,
            'commented_by_type' => $comment->commented_by_type,
            'commented_by' => $comment->commented_by_id,
            'is_internal' => $comment->is_internal,
            'created_at' => $comment->created_at,
            'updated_at' => $comment->updated_at,
            'commenter' => $comment->commented_by_type === 'user'
                ? $comment->user
                : $comment->organizationUser,
        ];

        return response()->json([
            'success' => true,
            'message' => 'Comment updated successfully',
            'data' => $commentData,
        ]);
    }

    /**
     * Remove the specified comment (soft delete).
     */
    public function destroy(Task $task, TaskComment $comment): JsonResponse
    {
        // Ensure comment belongs to the task
        if ($comment->task_id !== $task->id) {
            return response()->json([
                'success' => false,
                'message' => 'Comment not found for this task',
            ], 404);
        }

        // Check if user can delete this comment (only the commenter or admin can delete)
        $canDelete = false;
        if (Auth::guard('web')->check() && $comment->commented_by_type === 'user' && $comment->commented_by_id === Auth::guard('web')->id()) {
            $canDelete = true;
        } elseif (Auth::guard('admin')->check()) {
            // Admin can delete any comment, or user can delete their own
            if ($comment->commented_by_type === 'user' && $comment->commented_by_id === Auth::guard('admin')->id()) {
                $canDelete = true;
            }
            // TODO: Add admin role check to allow admins to delete any comment 
        }

        if (!$canDelete) {
            return response()->json([
                'success' => false,
                'message' => 'You are not authorized to delete this comment',
            ], 403);
        }

        // Check if comment is already deleted
        if ($comment->trashed()) {
            return response()->json([
                'success' => false,
                'message' => 'Comment is already deleted',
            ], 422);
        }

        $taskId = $comment->task_id;
        $commentId = $comment->id;

        // Update comment text to show placeholder before soft deleting
        $comment->update(['comment_text' => 'Message has been deleted']);

        // Soft delete with tracking who deleted it
        $deletedBy = null;
        if (Auth::guard('admin')->check()) {
            $deletedBy = Auth::guard('admin')->id();
        } elseif (Auth::guard('web')->check()) {
            $deletedBy = Auth::guard('web')->id();
        }

        $comment->update(['deleted_by' => $deletedBy]);
        $comment->delete();

        return response()->json([
            'success' => true,
            'message' => 'Comment deleted successfully',
        ]);
    }

    /**
     * Get deleted comments for a task (admin only).
     */
    public function getDeletedComments(Task $task): JsonResponse
    {
        // Check if user is admin
        if (!Auth::guard('admin')->check()) {
            return response()->json([
                'success' => false,
                'message' => 'Admin access required',
            ], 403);
        }

        $deletedComments = $task->comments()
            ->onlyTrashed()
            ->with(['user:id,name,email', 'organizationUser:id,name,email', 'deletedByUser:id,name,email'])
            ->orderBy('deleted_at', 'desc')
            ->get()
            ->map(function ($comment) {
                return [
                    'id' => $comment->id,
                    'task_id' => $comment->task_id,
                    'comment_text' => $comment->comment_text,
                    'commented_by_type' => $comment->commented_by_type,
                    'commented_by' => $comment->commented_by_id,
                    'is_internal' => $comment->is_internal,
                    'created_at' => $comment->created_at,
                    'updated_at' => $comment->updated_at,
                    'deleted_at' => $comment->deleted_at,
                    'deleted_by' => $comment->deleted_by,
                    'commenter' => $comment->commented_by_type === 'user'
                        ? $comment->user
                        : $comment->organizationUser,
                    'deleted_by_user' => $comment->deletedByUser,
                ];
            });

        return response()->json([
            'success' => true,
            'data' => $deletedComments,
        ]);
    }

    /**
     * Restore a deleted comment (admin only).
     */
    public function restoreComment(Task $task, TaskComment $comment): JsonResponse
    {
        // Check if user is admin
        if (!Auth::guard('admin')->check()) {
            return response()->json([
                'success' => false,
                'message' => 'Admin access required',
            ], 403);
        }

        // Ensure comment belongs to the task and is deleted
        if ($comment->task_id !== $task->id) {
            return response()->json([
                'success' => false,
                'message' => 'Comment not found for this task',
            ], 404);
        }

        if (!$comment->trashed()) {
            return response()->json([
                'success' => false,
                'message' => 'Comment is not deleted',
            ], 400);
        }

        $comment->restore();

        // Load relationships for response
        $comment->load(['user:id,name,email', 'organizationUser:id,name,email']);

        $commentData = [
            'id' => $comment->id,
            'task_id' => $comment->task_id,
            'comment_text' => $comment->comment_text,
            'commented_by_type' => $comment->commented_by_type,
            'commented_by' => $comment->commented_by_id,
            'is_internal' => $comment->is_internal,
            'created_at' => $comment->created_at,
            'updated_at' => $comment->updated_at,
            'commenter' => $comment->commented_by_type === 'user'
                ? $comment->user
                : $comment->organizationUser,
        ];

        return response()->json([
            'success' => true,
            'message' => 'Comment restored successfully',
            'data' => $commentData,
        ]);
    }

    /**
     * Permanently delete a comment (admin only).
     */
    public function forceDeleteComment(Task $task, TaskComment $comment): JsonResponse
    {
        // Check if user is admin
        if (!Auth::guard('admin')->check()) {
            return response()->json([
                'success' => false,
                'message' => 'Admin access required',
            ], 403);
        }

        // Ensure comment belongs to the task and is deleted
        if ($comment->task_id !== $task->id) {
            return response()->json([
                'success' => false,
                'message' => 'Comment not found for this task',
            ], 404);
        }

        if (!$comment->trashed()) {
            return response()->json([
                'success' => false,
                'message' => 'Comment is not deleted',
            ], 400);
        }

        $taskId = $comment->task_id;
        $commentId = $comment->id;

        $comment->forceDelete();

        return response()->json([
            'success' => true,
            'message' => 'Comment permanently deleted',
        ]);
    }

    /**
     * Get comments by user.
     */
    public function getCommentsByUser(Task $task, $userId): JsonResponse
    {
        $user = User::find($userId);
        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'User not found',
            ], 404);
        }

        $comments = $task->comments()
            ->where('commented_by_id', $userId)
            ->where('commented_by_type', 'user')
            ->with(['user:id,name,email'])
            ->orderBy('created_at', 'asc')
            ->get()
            ->map(function ($comment) {
                return [
                    'id' => $comment->id,
                    'task_id' => $comment->task_id,
                    'comment_text' => $comment->comment_text,
                    'commented_by_type' => $comment->commented_by_type,
                    'commented_by' => $comment->commented_by_id,
                    'is_internal' => $comment->is_internal,
                    'created_at' => $comment->created_at,
                    'updated_at' => $comment->updated_at,
                    'deleted_at' => $comment->deleted_at,
                    'deleted_by' => $comment->deleted_by,
                    'commenter' => $comment->user,
                    'deleted_by_user' => $comment->deletedByUser,
                ];
            });

        return response()->json([
            'success' => true,
            'data' => $comments,
        ]);
    }

    /**
     * Get comments by client.
     */
    public function getCommentsByClient(Task $task, $clientId): JsonResponse
    {
        $organizationUser = OrganizationUser::find($clientId);
        if (!$organizationUser) {
            return response()->json([
                'success' => false,
                'message' => 'Organization user not found',
            ], 404);
        }

        $comments = $task->comments()
            ->where('commented_by_id', $clientId)
            ->where('commented_by_type', 'organization_user')
            ->with(['organizationUser:id,name,email'])
            ->orderBy('created_at', 'asc')
            ->get()
            ->map(function ($comment) {
                return [
                    'id' => $comment->id,
                    'task_id' => $comment->task_id,
                    'comment_text' => $comment->comment_text,
                    'commented_by_type' => $comment->commented_by_type,
                    'commented_by' => $comment->commented_by_id,
                    'is_internal' => $comment->is_internal,
                    'created_at' => $comment->created_at,
                    'updated_at' => $comment->updated_at,
                    'deleted_at' => $comment->deleted_at,
                    'deleted_by' => $comment->deleted_by,
                    'commenter' => $comment->organizationUser,
                    'deleted_by_user' => $comment->deletedByUser,
                ];
            });

        return response()->json([
            'success' => true,
            'data' => $comments,
        ]);
    }

    /**
     * Get internal comments only.
     */
    public function getInternalComments(Task $task): JsonResponse
    {
        $comments = $task->comments()
            ->where('is_internal', true)
            ->with(['user:id,name,email'])
            ->orderBy('created_at', 'asc')
            ->get()
            ->map(function ($comment) {
                return [
                    'id' => $comment->id,
                    'task_id' => $comment->task_id,
                    'comment_text' => $comment->comment_text,
                    'commented_by_type' => $comment->commented_by_type,
                    'commented_by' => $comment->commented_by_id,
                    'is_internal' => $comment->is_internal,
                    'created_at' => $comment->created_at,
                    'updated_at' => $comment->updated_at,
                    'deleted_at' => $comment->deleted_at,
                    'deleted_by' => $comment->deleted_by,
                    'commenter' => $comment->user,
                    'deleted_by_user' => $comment->deletedByUser,
                ];
            });

        return response()->json([
            'success' => true,
            'data' => $comments,
        ]);
    }

    /**
     * Get external comments only.
     */
    public function getExternalComments(Task $task): JsonResponse
    {
        $comments = $task->comments()
            ->where('is_internal', false)
            ->with(['organizationUser:id,name,email'])
            ->orderBy('created_at', 'asc')
            ->get()
            ->map(function ($comment) {
                return [
                    'id' => $comment->id,
                    'task_id' => $comment->task_id,
                    'comment_text' => $comment->comment_text,
                    'commented_by_type' => $comment->commented_by_type,
                    'commented_by' => $comment->commented_by_id,
                    'is_internal' => $comment->is_internal,
                    'created_at' => $comment->created_at,
                    'updated_at' => $comment->updated_at,
                    'deleted_at' => $comment->deleted_at,
                    'deleted_by' => $comment->deleted_by,
                    'commenter' => $comment->organizationUser,
                    'deleted_by_user' => $comment->deletedByUser,
                ];
            });

        return response()->json([
            'success' => true,
            'data' => $comments,
        ]);
    }
    /**
     * Store a comment attachment.
     */
    protected function storeCommentAttachment(TaskComment $comment, $file, Request $request, string $commentedByType, $commentedBy): TaskCommentAttachment
    {
        $originalFilename = $file->getClientOriginalName();
        $fileSize = $file->getSize();
        $fileType = $file->getMimeType();

        // Generate a unique filename
        $filename = uniqid() . '_' . time() . '.' . $file->getClientOriginalExtension();

        // Store the file in the 'task-attachments' directory within 'public' disk
        $path = $file->storeAs('task-attachments', $filename, 'public');

        // Create the attachment record
        return $comment->attachments()->create([
            'file_path' => $path,
            'file_type' => $fileType,
            'original_filename' => $originalFilename,
            'file_size' => $fileSize,
            'uploaded_by_type' => $commentedByType,
            'uploaded_by' => $commentedBy,
        ]);
    }

    /**
     * Send notifications to all users assigned to the task when a comment is added.
     *
     * @param Task $task
     * @param TaskComment $comment
     * @param int $commentedBy
     * @return void
     */
    protected function sendCommentNotifications(Task $task, TaskComment $comment, int $commentedBy): void
    {
        // Get all active task assignments for this task
        $assignments = TaskAssignment::where('task_id', $task->id)
            ->where('is_active', true)
            ->get();

        // Get the commenter name
        $commenter = User::find($commentedBy);
        $commenterName = $commenter ? $commenter->name : 'Unknown User';

        // Notify all assigned users except the commenter themselves
        foreach ($assignments as $assignment) {
            // Skip notifying the person who made the comment
            if ($assignment->user_id === $commentedBy) {
                continue;
            }

            $this->notificationService->sendToUser(
                $assignment->user_id,
                'App\Notifications\TaskCommentNotification',
                'New Comment on Task',
                "{$commenterName} commented on task '{$task->title}'",
                [
                    'task_id' => $task->id,
                    'task_title' => $task->title,
                    'comment_id' => $comment->id,
                    'comment_text' => $comment->comment_text,
                    'commented_by_id' => $commentedBy,
                    'commented_by_name' => $commenterName,
                ]
            );
        }
    }
}
