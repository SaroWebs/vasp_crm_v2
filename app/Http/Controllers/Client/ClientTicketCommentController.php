<?php

namespace App\Http\Controllers\Client;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreClientTicketCommentRequest;
use App\Http\Requests\UpdateClientTicketCommentRequest;
use App\Models\Client;
use App\Models\CommentAttachment;
use App\Models\Ticket;
use App\Models\TicketComment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ClientTicketCommentController extends Controller
{
    public function index(Client $client, Ticket $ticket): JsonResponse
    {
        $this->ensureCanAccessTicket($client, $ticket);

        $comments = $ticket->comments()
            ->where('is_internal', false)
            ->with(['organizationUser:id,name,email', 'attachments'])
            ->orderBy('created_at', 'asc')
            ->get()
            ->map(function (TicketComment $comment): array {
                return [
                    'id' => $comment->id,
                    'ticket_id' => $comment->ticket_id,
                    'comment_text' => $comment->comment_text,
                    'commented_by_type' => $comment->commented_by_type,
                    'commented_by' => $comment->commented_by,
                    'is_internal' => false,
                    'created_at' => $comment->created_at,
                    'updated_at' => $comment->updated_at,
                    'commenter' => $comment->organizationUser,
                    'attachments' => $comment->attachments->map(function (CommentAttachment $attachment): array {
                        return [
                            'id' => $attachment->id,
                            'file_url' => $attachment->file_url,
                            'file_type' => $attachment->file_type,
                            'original_filename' => $attachment->original_filename,
                            'file_size' => $attachment->file_size,
                            'is_image' => $attachment->isImage(),
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

    public function store(StoreClientTicketCommentRequest $request, Client $client, Ticket $ticket): JsonResponse
    {
        $this->ensureCanAccessTicket($client, $ticket);

        $validated = $request->validated();

        if (! $request->hasFile('attachments') && empty($validated['comment_text'])) {
            return response()->json([
                'success' => false,
                'message' => 'Comment text or attachments are required',
            ], 422);
        }

        $organizationUser = Auth::guard('organization')->user();

        $comment = $ticket->comments()->create([
            'comment_text' => $validated['comment_text'] ?? null,
            'commented_by_type' => 'organization_user',
            'commented_by' => $organizationUser->id,
            'is_internal' => false,
            'updated_at' => null,
        ]);

        if ($request->hasFile('attachments')) {
            foreach ($request->file('attachments') as $file) {
                $this->storeCommentAttachment($comment, $file, $organizationUser->id);
            }
        }

        $comment->load(['organizationUser:id,name,email', 'attachments']);

        return response()->json([
            'success' => true,
            'data' => [
                'id' => $comment->id,
                'ticket_id' => $comment->ticket_id,
                'comment_text' => $comment->comment_text,
                'commented_by_type' => $comment->commented_by_type,
                'commented_by' => $comment->commented_by,
                'is_internal' => false,
                'created_at' => $comment->created_at,
                'updated_at' => $comment->updated_at,
                'commenter' => $comment->organizationUser,
                'attachments' => $comment->attachments->map(function (CommentAttachment $attachment): array {
                    return [
                        'id' => $attachment->id,
                        'file_url' => $attachment->file_url,
                        'file_type' => $attachment->file_type,
                        'original_filename' => $attachment->original_filename,
                        'file_size' => $attachment->file_size,
                        'is_image' => $attachment->isImage(),
                        'created_at' => $attachment->created_at,
                    ];
                }),
            ],
        ], 201);
    }

    public function update(UpdateClientTicketCommentRequest $request, Client $client, Ticket $ticket, TicketComment $comment): JsonResponse
    {
        $this->ensureCanAccessTicket($client, $ticket);
        $this->ensureCanMutateComment($ticket, $comment);

        $comment->update([
            'comment_text' => $request->validated('comment_text'),
        ]);

        $comment->load(['organizationUser:id,name,email', 'attachments']);

        return response()->json([
            'success' => true,
            'data' => [
                'id' => $comment->id,
                'ticket_id' => $comment->ticket_id,
                'comment_text' => $comment->comment_text,
                'commented_by_type' => $comment->commented_by_type,
                'commented_by' => $comment->commented_by,
                'is_internal' => false,
                'created_at' => $comment->created_at,
                'updated_at' => $comment->updated_at,
                'commenter' => $comment->organizationUser,
                'attachments' => $comment->attachments->map(function (CommentAttachment $attachment): array {
                    return [
                        'id' => $attachment->id,
                        'file_url' => $attachment->file_url,
                        'file_type' => $attachment->file_type,
                        'original_filename' => $attachment->original_filename,
                        'file_size' => $attachment->file_size,
                        'is_image' => $attachment->isImage(),
                        'created_at' => $attachment->created_at,
                    ];
                }),
            ],
        ]);
    }

    public function destroy(Request $request, Client $client, Ticket $ticket, TicketComment $comment): JsonResponse
    {
        $this->ensureCanAccessTicket($client, $ticket);
        $this->ensureCanMutateComment($ticket, $comment);

        $comment->delete();

        return response()->json([
            'success' => true,
            'message' => 'Comment deleted successfully',
        ]);
    }

    private function ensureCanAccessTicket(Client $client, Ticket $ticket): void
    {
        $organizationUser = Auth::guard('organization')->user();

        if ((int) $ticket->client_id !== (int) $client->id) {
            abort(404);
        }

        if ((int) $ticket->organization_user_id !== (int) $organizationUser->id) {
            abort(404);
        }
    }

    private function ensureCanMutateComment(Ticket $ticket, TicketComment $comment): void
    {
        $organizationUser = Auth::guard('organization')->user();

        if ((int) $comment->ticket_id !== (int) $ticket->id) {
            abort(404);
        }

        if ($comment->commented_by_type !== 'organization_user') {
            abort(403);
        }

        if ((int) $comment->commented_by !== (int) $organizationUser->id) {
            abort(403);
        }

        if ($comment->is_internal) {
            abort(404);
        }
    }

    protected function storeCommentAttachment(TicketComment $comment, $file, int $organizationUserId): CommentAttachment
    {
        $originalName = $file->getClientOriginalName();
        $extension = $file->getClientOriginalExtension();
        $safeFilename = uniqid('comment_', true).'.'.$extension;

        $path = $file->storeAs('comment-files/'.$comment->ticket_id, $safeFilename, 'public');

        return $comment->attachments()->create([
            'file_path' => $path,
            'file_type' => $file->getClientMimeType(),
            'original_filename' => $originalName,
            'file_size' => $file->getSize(),
            'uploaded_by_type' => 'organization_user',
            'uploaded_by' => $organizationUserId,
        ]);
    }
}
