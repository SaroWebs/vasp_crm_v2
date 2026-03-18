<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Models\User;
use App\Models\ProjectAttachment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Auth;

class ProjectAttachmentController extends Controller
{
    private function checkPermission(string $permission): bool
    {
        $user = User::find(Auth::id());

        return $user ? $user->hasPermission($permission) : false;
    }

    /**
     * Display a listing of project attachments.
     */
    public function index(Project $project)
    {
        if (!$this->checkPermission('project.read')) {
            abort(403, 'Insufficient permissions to view project attachments.');
        }

        $attachments = $project->attachments()
            ->with('uploader')
            ->latest()
            ->get();

        return response()->json($attachments);
    }

    /**
     * Store a newly created attachment.
     */
    public function store(Request $request, Project $project)
    {
        if (!$this->checkPermission('project.manage_attachments')) {
            abort(403, 'Insufficient permissions to manage project attachments.');
        }

        $validated = $request->validate([
            'file' => ['required', 'file', 'max:10240'], // 10MB max
            'description' => ['nullable', 'string', 'max:500'],
        ]);

        $file = $request->file('file');
        $filename = uniqid() . '_' . $file->getClientOriginalName();
        $path = $file->storeAs("projects/{$project->id}/attachments", $filename, 'public');

        $attachment = $project->attachments()->create([
            'uploaded_by' => auth()->id(),
            'filename' => $filename,
            'original_filename' => $file->getClientOriginalName(),
            'mime_type' => $file->getMimeType(),
            'size' => $file->getSize(),
            'path' => $path,
            'description' => $validated['description'] ?? null,
        ]);

        return response()->json([
            'message' => 'Attachment uploaded successfully.',
            'attachment' => $attachment->load('uploader'),
        ], 201);
    }

    /**
     * Display the specified attachment.
     */
    public function show(Project $project, ProjectAttachment $attachment)
    {
        if (!$this->checkPermission('project.read')) {
            abort(403, 'Insufficient permissions to view project attachments.');
        }

        if ($attachment->project_id !== $project->id) {
            return response()->json(['message' => 'Attachment not found in this project.'], 404);
        }

        return response()->json($attachment->load('uploader'));
    }

    /**
     * Download the specified attachment.
     */
    public function download(Project $project, ProjectAttachment $attachment)
    {
        if (!$this->checkPermission('project.read')) {
            abort(403, 'Insufficient permissions to view project attachments.');
        }

        if ($attachment->project_id !== $project->id) {
            return response()->json(['message' => 'Attachment not found in this project.'], 404);
        }

        if (!Storage::disk('public')->exists($attachment->path)) {
            return response()->json(['message' => 'File not found.'], 404);
        }

        return Storage::disk('public')->download($attachment->path, $attachment->original_filename);
    }

    /**
     * Update the specified attachment.
     */
    public function update(Request $request, Project $project, ProjectAttachment $attachment)
    {
        if (!$this->checkPermission('project.manage_attachments')) {
            abort(403, 'Insufficient permissions to manage project attachments.');
        }

        if ($attachment->project_id !== $project->id) {
            return response()->json(['message' => 'Attachment not found in this project.'], 404);
        }

        $validated = $request->validate([
            'description' => ['nullable', 'string', 'max:500'],
        ]);

        $attachment->update([
            'description' => $validated['description'] ?? null,
        ]);

        return response()->json([
            'message' => 'Attachment updated successfully.',
            'attachment' => $attachment->fresh('uploader'),
        ]);
    }

    /**
     * Remove the specified attachment.
     */
    public function destroy(Project $project, ProjectAttachment $attachment)
    {
        if (!$this->checkPermission('project.manage_attachments')) {
            abort(403, 'Insufficient permissions to manage project attachments.');
        }

        if ($attachment->project_id !== $project->id) {
            return response()->json(['message' => 'Attachment not found in this project.'], 404);
        }

        // Delete file from storage
        if (Storage::disk('public')->exists($attachment->path)) {
            Storage::disk('public')->delete($attachment->path);
        }

        $attachment->delete();

        return response()->json([
            'message' => 'Attachment deleted successfully.',
        ]);
    }

    /**
     * Get attachment preview URL (for images).
     */
    public function preview(Project $project, ProjectAttachment $attachment)
    {
        if (!$this->checkPermission('project.read')) {
            abort(403, 'Insufficient permissions to view project attachments.');
        }

        if ($attachment->project_id !== $project->id) {
            return response()->json(['message' => 'Attachment not found in this project.'], 404);
        }

        if (!$attachment->isImage()) {
            return response()->json(['message' => 'Preview only available for images.'], 400);
        }

        return response()->json([
            'url' => $attachment->getUrl(),
        ]);
    }
}
