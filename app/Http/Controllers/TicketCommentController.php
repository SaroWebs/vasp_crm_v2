<?php

namespace App\Http\Controllers;

use App\Models\Ticket;
use Illuminate\Http\Request;
use App\Models\TicketComment;
use App\Models\CommentAttachment;
use Illuminate\Http\JsonResponse;
use App\Events\TicketCommentCreated;
use App\Events\TicketCommentDeleted;
use App\Events\TicketCommentUpdated;
use Illuminate\Support\Facades\Auth;

class TicketCommentController extends Controller
{
    /**
     * Display a listing of comments for a ticket.
     */
    public function index(Ticket $ticket): JsonResponse
    {
        // Check if user is authenticated
        if (!Auth::guard('web')->check() && !Auth::guard('admin')->check()) {
            return response()->json([
                'success' => false,
                'message' => 'Authentication required',
            ], 401);
        }

        $comments = $ticket->comments()
            ->with(['user:id,name,email', 'organizationUser:id,name,email', 'attachments'])
            ->withTrashed() // Include soft deleted comments
            ->orderBy('created_at', 'asc')
            ->get()
            ->map(function ($comment) {
                return [
                    'id' => $comment->id,
                    'ticket_id' => $comment->ticket_id,
                    'comment_text' => $comment->comment_text,
                    'commented_by_type' => $comment->commented_by_type,
                    'commented_by' => $comment->commented_by,
                    'is_internal' => $comment->is_internal,
                    'created_at' => $comment->created_at,
                    'updated_at' => $comment->updated_at,
                    'deleted_at' => $comment->deleted_at, // Include deletion info
                    'commenter' => $comment->commented_by_type === 'user'
                        ? $comment->user
                        : $comment->organizationUser,
                    'attachments' => $comment->attachments->map(function ($attachment) {
                        return [
                            'id' => $attachment->id,
                            'file_url' => $attachment->file_url,
                            'file_type' => $attachment->file_type,
                            'original_filename' => $attachment->original_filename,
                            'file_size' => $attachment->file_size,
                            'is_image' => $attachment->is_image,
                            'created_at' => $attachment->created_at,
                        ];
                    }),
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
    public function store(Request $request, Ticket $ticket): JsonResponse
    {
        $validated = $request->validate([
            'comment_text' => 'nullable|string|max:5000',
            'is_internal' => 'sometimes|boolean',
            'attachments' => 'nullable|array|max:5',
            'attachments.*' => 'file|max:10240|mimes:jpg,jpeg,png,gif,pdf,doc,docx,xls,xlsx,txt',
        ]);

        // Ensure either comment text or attachments are provided
        if (!$request->hasFile('attachments') && empty($validated['comment_text'])) {
            return response()->json([
                'success' => false,
                'message' => 'Comment text or attachments are required',
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

        $comment = $ticket->comments()->create([
            'comment_text' => $validated['comment_text'],
            'commented_by_type' => $commentedByType,
            'commented_by' => $commentedBy,
            'is_internal' => $validated['is_internal'] ?? false,
            'updated_at'=>null,
        ]);

        // Handle file uploads
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

        $commentData = [
            'id' => $comment->id,
            'ticket_id' => $comment->ticket_id,
            'comment_text' => $comment->comment_text,
            'commented_by_type' => $comment->commented_by_type,
            'commented_by' => $comment->commented_by,
            'is_internal' => $comment->is_internal,
            'created_at' => $comment->created_at,
            'updated_at' => $comment->updated_at,
            'commenter' => $commentedByType === 'user'
                ? $comment->user
                : $comment->organizationUser,
            'attachments' => $comment->attachments()->get()->map(function ($attachment) {
                return [
                    'id' => $attachment->id,
                    'file_url' => $attachment->file_url,
                    'file_type' => $attachment->file_type,
                    'original_filename' => $attachment->original_filename,
                    'file_size' => $attachment->file_size,
                    'is_image' => $attachment->is_image,
                    'created_at' => $attachment->created_at,
                ];
            }),
        ];

        // Broadcast the new comment to all listeners
        broadcast(new TicketCommentCreated($commentData))->toOthers();

        return response()->json([
            'success' => true,
            'message' => 'Comment added successfully',
            'data' => $commentData,
        ], 201);
    }

    /**
     * Update the specified comment.
     */
    public function update(Request $request, Ticket $ticket, TicketComment $comment): JsonResponse
    {
        // Check if user can edit this comment (only the commenter can edit)
        $canEdit = false;
        if (Auth::guard('web')->check() && $comment->commented_by_type === 'user' && $comment->commented_by === Auth::guard('web')->id()) {
            $canEdit = true;
        } elseif (Auth::guard('admin')->check() && $comment->commented_by_type === 'user' && $comment->commented_by === Auth::guard('admin')->id()) {
            $canEdit = true;
        }

        if (!$canEdit) {
            return response()->json([
                'success' => false,
                'message' => 'You are not authorized to edit this comment',
            ], 403);
        }

        $validated = $request->validate([
            'comment_text' => 'required|string|max:5000',
        ]);

        $comment->update([
            'comment_text' => $validated['comment_text'],
        ]);

        $commentData = [
            'id' => $comment->id,
            'ticket_id' => $comment->ticket_id,
            'comment_text' => $comment->comment_text,
            'commented_by_type' => $comment->commented_by_type,
            'commented_by' => $comment->commented_by,
            'is_internal' => $comment->is_internal,
            'created_at' => $comment->created_at,
            'updated_at' => $comment->updated_at,
            'commenter' => $comment->commented_by_type === 'user'
                ? $comment->user
                : $comment->organizationUser,
        ];

        // Broadcast the updated comment to all listeners
        broadcast(new TicketCommentUpdated($commentData))->toOthers();

        return response()->json([
            'success' => true,
            'message' => 'Comment updated successfully',
            'data' => $commentData,
        ]);
    }

    /**
     * Remove the specified comment (soft delete).
     */
    public function destroy(Ticket $ticket, TicketComment $comment): JsonResponse
    {
        // Check if user can delete this comment (only the commenter or admin can delete)
        $canDelete = false;
        if (Auth::guard('web')->check() && $comment->commented_by_type === 'user' && $comment->commented_by === Auth::guard('web')->id()) {
            $canDelete = true;
        } elseif (Auth::guard('admin')->check()) {
            // Admin can delete any comment, or user can delete their own
            if ($comment->commented_by_type === 'user' && $comment->commented_by === Auth::guard('admin')->id()) {
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

        $ticketId = $comment->ticket_id;
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

        // Broadcast the deleted comment to all listeners
        broadcast(new TicketCommentDeleted($ticketId, $commentId))->toOthers();

        return response()->json([
            'success' => true,
            'message' => 'Comment deleted successfully',
        ]);
    }

    /**
     * Get deleted comments for a ticket (superadmin only).
     */
    public function getDeletedComments(Ticket $ticket): JsonResponse
    {
        // Check if user is superadmin
        if (!Auth::guard('admin')->check()) {
            return response()->json([
                'success' => false,
                'message' => 'Superadmin access required',
            ], 403);
        }

        $deletedComments = $ticket->comments()
            ->onlyTrashed()
            ->with(['user:id,name,email', 'organizationUser:id,name,email', 'deletedByUser:id,name,email'])
            ->orderBy('deleted_at', 'desc')
            ->get()
            ->map(function ($comment) {
                return [
                    'id' => $comment->id,
                    'ticket_id' => $comment->ticket_id,
                    'comment_text' => $comment->comment_text,
                    'commented_by_type' => $comment->commented_by_type,
                    'commented_by' => $comment->commented_by,
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
     * Restore a deleted comment (superadmin only).
     */
    public function restoreComment(Ticket $ticket, TicketComment $comment): JsonResponse
    {
        // Check if user is superadmin
        if (!Auth::guard('admin')->check()) {
            return response()->json([
                'success' => false,
                'message' => 'Superadmin access required',
            ], 403);
        }

        // Ensure comment belongs to the ticket and is deleted
        if ($comment->ticket_id !== $ticket->id) {
            return response()->json([
                'success' => false,
                'message' => 'Comment not found for this ticket',
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
            'ticket_id' => $comment->ticket_id,
            'comment_text' => $comment->comment_text,
            'commented_by_type' => $comment->commented_by_type,
            'commented_by' => $comment->commented_by,
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
     * Permanently delete a comment (superadmin only).
     */
    public function forceDeleteComment(Ticket $ticket, TicketComment $comment): JsonResponse
    {
        // Check if user is superadmin
        if (!Auth::guard('admin')->check()) {
            return response()->json([
                'success' => false,
                'message' => 'Superadmin access required',
            ], 403);
        }

        // Ensure comment belongs to the ticket and is deleted
        if ($comment->ticket_id !== $ticket->id) {
            return response()->json([
                'success' => false,
                'message' => 'Comment not found for this ticket',
            ], 404);
        }

        if (!$comment->trashed()) {
            return response()->json([
                'success' => false,
                'message' => 'Comment is not deleted',
            ], 400);
        }

        $ticketId = $comment->ticket_id;
        $commentId = $comment->id;

        $comment->forceDelete();

        // Broadcast the permanently deleted comment to all listeners
        broadcast(new TicketCommentDeleted($ticketId, $commentId))->toOthers();

        return response()->json([
            'success' => true,
            'message' => 'Comment permanently deleted',
        ]);
    }

    /**
     * Store a comment attachment.
     */
    protected function storeCommentAttachment(TicketComment $comment, $file, Request $request, string $commentedByType, $commentedBy): CommentAttachment
    {
        // Generate a safe filename to prevent directory traversal
        $originalName = $file->getClientOriginalName();
        $extension = $file->getClientOriginalExtension();
        $safeFilename = uniqid('comment_', true) . '.' . $extension;

        // Store file with safe filename
        $path = $file->storeAs('comment-files/' . $comment->ticket_id, $safeFilename, 'public');

        return CommentAttachment::create([
            'comment_id' => $comment->id,
            'file_path' => $path,
            'file_type' => $file->getClientMimeType(),
            'original_filename' => $originalName,
            'file_size' => $file->getSize(),
            'uploaded_by_type' => $commentedByType,
            'uploaded_by' => $commentedBy,
        ]);
    }
}
