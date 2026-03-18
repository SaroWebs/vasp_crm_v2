<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Models\User;
use App\Models\ProjectTimelineEvent;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ProjectTimelineController extends Controller
{
    private function checkPermission(string $permission): bool
    {
        $user = User::find(Auth::id());

        return $user ? $user->hasPermission($permission) : false;
    }

    /**
     * Display a listing of project timeline events.
     */
    public function index(Project $project)
    {
        if (!$this->checkPermission('project.read')) {
            abort(403, 'Insufficient permissions to view project timeline.');
        }

        $events = $project->timelineEvents()
            ->with(['user', 'phase'])
            ->orderBy('event_date', 'desc')
            ->get();

        return response()->json($events);
    }

    /**
     * Store a newly created timeline event.
     */
    public function store(Request $request, Project $project)
    {
        if (!$this->checkPermission('project.manage_timeline')) {
            abort(403, 'Insufficient permissions to manage project timeline.');
        }

        $validated = $request->validate([
            'event_type' => ['required', 'string', 'max:100'],
            'event_name' => ['required', 'string', 'max:255'],
            'event_description' => ['nullable', 'string'],
            'event_date' => ['required', 'date'],
            'phase_id' => ['nullable', 'exists:project_phases,id'],
            'is_milestone' => ['boolean'],
            'milestone_type' => ['nullable', 'string', 'max:100'],
            'target_date' => ['nullable', 'date'],
            'metadata' => ['nullable', 'array'],
        ]);

        $event = $project->timelineEvents()->create([
            'event_type' => $validated['event_type'],
            'event_name' => $validated['event_name'],
            'event_description' => $validated['event_description'] ?? null,
            'event_date' => $validated['event_date'],
            'phase_id' => $validated['phase_id'] ?? null,
            'user_id' => auth()->id(),
            'is_milestone' => $validated['is_milestone'] ?? false,
            'milestone_type' => $validated['milestone_type'] ?? null,
            'target_date' => $validated['target_date'] ?? null,
            'metadata' => $validated['metadata'] ?? null,
        ]);

        return response()->json([
            'message' => 'Timeline event created successfully.',
            'event' => $event->load(['user', 'phase']),
        ], 201);
    }

    /**
     * Display the specified timeline event.
     */
    public function show(Project $project, ProjectTimelineEvent $timelineEvent)
    {
        if (!$this->checkPermission('project.read')) {
            abort(403, 'Insufficient permissions to view project timeline.');
        }

        if ($timelineEvent->project_id !== $project->id) {
            return response()->json(['message' => 'Event not found in this project.'], 404);
        }

        return response()->json($timelineEvent->load(['user', 'phase']));
    }

    /**
     * Update the specified timeline event.
     */
    public function update(Request $request, Project $project, ProjectTimelineEvent $timelineEvent)
    {
        if (!$this->checkPermission('project.manage_timeline')) {
            abort(403, 'Insufficient permissions to manage project timeline.');
        }

        if ($timelineEvent->project_id !== $project->id) {
            return response()->json(['message' => 'Event not found in this project.'], 404);
        }

        $validated = $request->validate([
            'event_type' => ['sometimes', 'required', 'string', 'max:100'],
            'event_name' => ['sometimes', 'required', 'string', 'max:255'],
            'event_description' => ['nullable', 'string'],
            'event_date' => ['sometimes', 'required', 'date'],
            'phase_id' => ['nullable', 'exists:project_phases,id'],
            'is_milestone' => ['boolean'],
            'milestone_type' => ['nullable', 'string', 'max:100'],
            'target_date' => ['nullable', 'date'],
            'is_completed' => ['boolean'],
            'progress_percentage' => ['nullable', 'integer', 'min:0', 'max:100'],
            'metadata' => ['nullable', 'array'],
        ]);

        $timelineEvent->update($validated);

        return response()->json([
            'message' => 'Timeline event updated successfully.',
            'event' => $timelineEvent->fresh(['user', 'phase']),
        ]);
    }

    /**
     * Remove the specified timeline event.
     */
    public function destroy(Project $project, ProjectTimelineEvent $timelineEvent)
    {
        if (!$this->checkPermission('project.manage_timeline')) {
            abort(403, 'Insufficient permissions to manage project timeline.');
        }

        if ($timelineEvent->project_id !== $project->id) {
            return response()->json(['message' => 'Event not found in this project.'], 404);
        }

        $timelineEvent->delete();

        return response()->json([
            'message' => 'Timeline event deleted successfully.',
        ]);
    }

    /**
     * Mark a timeline event as completed.
     */
    public function complete(Project $project, ProjectTimelineEvent $timelineEvent)
    {
        if (!$this->checkPermission('project.manage_timeline')) {
            abort(403, 'Insufficient permissions to manage project timeline.');
        }

        if ($timelineEvent->project_id !== $project->id) {
            return response()->json(['message' => 'Event not found in this project.'], 404);
        }

        $timelineEvent->markAsCompleted();

        return response()->json([
            'message' => 'Event marked as completed.',
            'event' => $timelineEvent->fresh(['user', 'phase']),
        ]);
    }

    /**
     * Get milestone events only.
     */
    public function milestones(Project $project)
    {
        if (!$this->checkPermission('project.read')) {
            abort(403, 'Insufficient permissions to view project timeline.');
        }

        $milestones = $project->timelineEvents()
            ->milestones()
            ->with(['user', 'phase'])
            ->orderBy('event_date')
            ->get();

        return response()->json($milestones);
    }

    /**
     * Get events by type.
     */
    public function byType(Project $project, string $type)
    {
        if (!$this->checkPermission('project.read')) {
            abort(403, 'Insufficient permissions to view project timeline.');
        }

        $events = $project->timelineEvents()
            ->byType($type)
            ->with(['user', 'phase'])
            ->orderBy('event_date', 'desc')
            ->get();

        return response()->json($events);
    }
}
