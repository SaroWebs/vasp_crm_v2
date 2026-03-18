<?php

namespace App\Http\Controllers;

use App\Models\TicketComment;
use App\Models\CommentAttachment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Http\JsonResponse;

class CommentAttachmentController extends Controller
{
    /**
     * Remove the specified attachment.
     */
    public function destroy(string $ticket, string $comment, CommentAttachment $attachment): JsonResponse
    {
        $ticketComment = TicketComment::find($attachment->comment_id);
        
        if (!$ticketComment) {
            return response()->json([
                'success' => false,
                'message' => 'Comment not found for this ticket',
            ], 404);
        }
        
        // Ensure attachment belongs to the comment
        if ($attachment->comment_id !== $ticketComment->id) {
            return response()->json([
                'success' => false,
                'message' => 'Attachment not found for this comment',
            ], 404);
        }

        // Check if user can delete this attachment (only the commenter or admin can delete)
        $canDelete = false;
        if (Auth::guard('web')->check() && $ticketComment->commented_by_type === 'user' && $ticketComment->commented_by === Auth::guard('web')->id()) {
            $canDelete = true;
        } elseif (Auth::guard('admin')->check()) {
            // Admin can delete any attachment
            $canDelete = true;
        }

        if (!$canDelete) {
            return response()->json([
                'success' => false,
                'message' => 'You are not authorized to delete this attachment',
            ], 403);
        }

        // Check if comment should also be deleted (before deleting attachment)
        $commentDeleted = false;
        $totalAttachments = $ticketComment->attachments()->count();
        
        // Delete file from storage
        if (Storage::disk('public')->exists($attachment->file_path)) {
            Storage::disk('public')->delete($attachment->file_path);
        }

        // Delete database record
        $attachment->delete();

        $remainingAttachments = $totalAttachments - 1; // This was the last attachment to be deleted
        
        // If comment has no text and this was the last attachment, soft delete the comment
        if (is_null($ticketComment->comment_text) && $remainingAttachments < 1) {
            // Soft delete the comment and show placeholder
            $ticketComment->comment_text = 'Message has been deleted';
            $ticketComment->save();
            $ticketComment->delete();
            $commentDeleted = true;
        }

        $message = $commentDeleted ? 'Attachment and empty comment deleted successfully' : 'Attachment deleted successfully';
        
        return response()->json([
            'success' => true,
            'message' => $message,
            'data' => [
                'attachment_id' => $attachment->id,
                'comment_id' => $ticketComment->id,
                'comment_deleted' => $commentDeleted,
                'remaining_attachments' => $remainingAttachments,
            ],
        ]);
    }
}
