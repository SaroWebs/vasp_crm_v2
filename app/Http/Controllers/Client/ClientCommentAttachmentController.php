<?php

namespace App\Http\Controllers\Client;

use App\Http\Controllers\Controller;
use App\Models\Client;
use App\Models\CommentAttachment;
use App\Models\Ticket;
use App\Models\TicketComment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;

class ClientCommentAttachmentController extends Controller
{
    public function destroy(Client $client, Ticket $ticket, TicketComment $comment, CommentAttachment $attachment): JsonResponse
    {
        $organizationUser = Auth::guard('organization')->user();

        if ((int) $ticket->client_id !== (int) $client->id) {
            abort(404);
        }

        if ((int) $ticket->organization_user_id !== (int) $organizationUser->id) {
            abort(404);
        }

        if ((int) $comment->ticket_id !== (int) $ticket->id) {
            abort(404);
        }

        if ($comment->commented_by_type !== 'organization_user') {
            abort(403);
        }

        if ((int) $comment->commented_by !== (int) $organizationUser->id) {
            abort(403);
        }

        if ($attachment->comment_type !== TicketComment::class || (int) $attachment->comment_id !== (int) $comment->id) {
            abort(404);
        }

        if (Storage::disk('public')->exists($attachment->file_path)) {
            Storage::disk('public')->delete($attachment->file_path);
        }

        $attachment->delete();

        return response()->json([
            'success' => true,
            'message' => 'Attachment deleted successfully',
            'data' => [
                'attachment_id' => $attachment->id,
                'comment_id' => $comment->id,
            ],
        ]);
    }
}
