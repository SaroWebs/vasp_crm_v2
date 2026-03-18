<?php

namespace App\Http\Controllers;

use App\Models\CommentAttachment;
use App\Models\TicketComment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;

class CommentAttachmentController extends Controller
{
    /**
     * Remove the specified attachment.
     */
    public function destroy(string $ticket, string $comment, CommentAttachment $attachment): JsonResponse
    {
        $ticketComment = $attachment->comment;

        if (! $ticketComment instanceof TicketComment) {
            return response()->json([
                'success' => false,
                'message' => 'Comment not found for this attachment',
            ], 404);
        }

        if ((int) $ticketComment->ticket_id !== (int) $ticket) {
            return response()->json([
                'success' => false,
                'message' => 'Comment not found for this ticket',
            ], 404);
        }

        if ((int) $ticketComment->id !== (int) $comment) {
            return response()->json([
                'success' => false,
                'message' => 'Attachment not found for this comment',
            ], 404);
        }

        $canDelete = false;

        if (Auth::guard('web')->check()
            && $ticketComment->commented_by_type === 'user'
            && $ticketComment->commented_by === Auth::guard('web')->id()) {
            $canDelete = true;
        } elseif (Auth::guard('admin')->check()) {
            $canDelete = true;
        } elseif (Auth::guard('organization')->check()
            && $ticketComment->commented_by_type === 'organization_user'
            && $ticketComment->commented_by === Auth::guard('organization')->id()) {
            $canDelete = true;
        }

        if (! $canDelete) {
            return response()->json([
                'success' => false,
                'message' => 'You are not authorized to delete this attachment',
            ], 403);
        }

        $commentDeleted = false;
        $totalAttachments = $ticketComment->attachments()->count();

        if (Storage::disk('public')->exists($attachment->file_path)) {
            Storage::disk('public')->delete($attachment->file_path);
        }

        $attachment->delete();

        $remainingAttachments = $totalAttachments - 1;

        if (is_null($ticketComment->comment_text) && $remainingAttachments < 1) {
            $ticketComment->comment_text = 'Message has been deleted';
            $ticketComment->save();
            $ticketComment->delete();
            $commentDeleted = true;
        }

        $message = $commentDeleted
            ? 'Attachment and empty comment deleted successfully'
            : 'Attachment deleted successfully';

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
