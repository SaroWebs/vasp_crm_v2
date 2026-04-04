<?php

namespace App\Http\Controllers;

use App\Models\Task;
use App\Models\TaskAttachment;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;

class TaskAttachmentController extends Controller
{
    /**
     * Display a listing of attachments for a task.
     */
    public function index(Task $task): JsonResponse
    {
        $user = User::find(Auth::user()->id);

        if (!$user->hasPermission('task.read')) {
            return response()->json(['message' => 'Insufficient permissions'], 403);
        }

        $taskAttachments = $task->attachments()
            ->with(['uploadedByUser:id,name,email'])
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($attachment) {
                return [
                    'id' => $attachment->id,
                    'task_id' => $attachment->task_id,
                    'file_path' => $attachment->file_path,
                    'file_name' => basename($attachment->file_path),
                    'file_type' => $attachment->file_type,
                    'file_size' => Storage::disk('public')->exists($attachment->file_path) ? Storage::disk('public')->size($attachment->file_path) : 0,
                    'uploaded_by' => $attachment->uploaded_by,
                    'uploaded_by_user' => $attachment->uploadedByUser,
                    'created_at' => $attachment->created_at,
                    'updated_at' => $attachment->updated_at,
                    'source' => 'task',
                ];
            });

        $ticketAttachments = collect([]);
        if ($task->ticket_id) {
            $ticketAttachments = \App\Models\TicketAttachment::where('ticket_id', $task->ticket_id)
                ->orderBy('created_at', 'desc')
                ->get()
                ->map(function ($attachment) {
                    return [
                        'id' => $attachment->id,
                        'ticket_id' => $attachment->ticket_id,
                        'file_path' => $attachment->file_path,
                        'file_name' => basename($attachment->file_path),
                        'file_type' => $attachment->file_type,
                        'file_size' => Storage::exists('public/' . $attachment->file_path) ? Storage::size('public/' . $attachment->file_path) : (Storage::exists($attachment->file_path) ? Storage::size($attachment->file_path) : 0),
                        // Note: TicketController stores in 'ticket-attachments' (public disk), so path might be relative
                        'uploaded_by' => null, // TicketAttachment model does not have uploaded_by in the snippet seen, check DB if needed
                        'uploaded_by_user' => null,
                        'created_at' => $attachment->created_at,
                        'updated_at' => $attachment->updated_at,
                        'source' => 'ticket',
                    ];
                });
        }

        $attachments = $taskAttachments->concat($ticketAttachments)->sortByDesc('created_at')->values();

        return response()->json([
            'success' => true,
            'data' => $attachments,
        ]);
    }

    /**
     * Store a newly created attachment.
     */
    public function store(Request $request, Task $task): JsonResponse
    {
        $user = User::find(Auth::user()->id);

        if (!$user->hasPermission('task.update')) {
            return response()->json(['message' => 'Insufficient permissions'], 403);
        }

        $validated = $request->validate([
            'file' => 'required|file|max:10240', // 10MB max
            'file_type' => 'nullable|string|max:255',
        ]);

        try {
            $file = $request->file('file');
            $filePath = $file->store('task-attachments', 'public');
            $fileType = $validated['file_type'] ?? $file->getMimeType();

            $attachment = $task->attachments()->create([
                'file_path' => $filePath,
                'file_type' => $fileType,
                'uploaded_by' => $user->id,
            ]);

            $attachment->load('uploadedByUser:id,name,email');

            return response()->json([
                'success' => true,
                'message' => 'Attachment uploaded successfully',
                'data' => [
                    'id' => $attachment->id,
                    'task_id' => $attachment->task_id,
                    'file_path' => $attachment->file_path,
                    'file_name' => basename($attachment->file_path),
                    'file_type' => $attachment->file_type,
                    'file_size' => Storage::disk('public')->size($attachment->file_path),
                    'uploaded_by' => $attachment->uploaded_by,
                    'uploaded_by_user' => $attachment->uploadedByUser,
                    'created_at' => $attachment->created_at,
                ],
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to upload attachment',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Remove the specified attachment.
     */
    public function destroy(Task $task, TaskAttachment $attachment): JsonResponse
    {
        $user = User::find(Auth::user()->id);

        if (!$user->hasPermission('task.update')) {
            return response()->json(['message' => 'Insufficient permissions'], 403);
        }

        // Verify attachment belongs to task
        if ($attachment->task_id !== $task->id) {
            return response()->json(['message' => 'Attachment does not belong to this task'], 404);
        }

        try {
            // Delete file from storage
            if (Storage::disk('public')->exists($attachment->file_path)) {
                Storage::disk('public')->delete($attachment->file_path);
            }

            // Delete record
            $attachment->delete();

            return response()->json([
                'success' => true,
                'message' => 'Attachment deleted successfully',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete attachment',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
