<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Models\User;
use App\Models\ProjectMilestone;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;

class ProjectMilestoneController extends Controller
{
    private function checkPermission(string $permission): bool
    {
        $user = User::find(Auth::id());

        return $user ? $user->hasPermission($permission) : false;
    }

    /**
     * Display a listing of project milestones.
     */
    public function index(Project $project)
    {
        if (!$this->checkPermission('project.read')) {
            abort(403, 'Insufficient permissions to view project milestones.');
        }

        $milestones = $project->milestones()
            ->orderBy('sort_order')
            ->orderBy('target_date')
            ->get();

        return response()->json($milestones);
    }

    /**
     * Store a newly created milestone.
     */
    public function store(Request $request, Project $project)
    {
        if (!$this->checkPermission('project.manage_milestones')) {
            abort(403, 'Insufficient permissions to manage project milestones.');
        }

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'target_date' => ['required', 'date'],
            'type' => ['required', 'in:start,checkpoint,delivery,completion,custom'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
            'metadata' => ['nullable', 'array'],
        ]);

        $milestone = $project->milestones()->create([
            'name' => $validated['name'],
            'description' => $validated['description'] ?? null,
            'target_date' => $validated['target_date'],
            'type' => $validated['type'],
            'sort_order' => $validated['sort_order'] ?? $project->milestones()->count(),
            'metadata' => $validated['metadata'] ?? null,
            'status' => ProjectMilestone::STATUS_PENDING,
        ]);

        return response()->json([
            'message' => 'Milestone created successfully.',
            'milestone' => $milestone,
        ], 201);
    }

    /**
     * Display the specified milestone.
     */
    public function show(Project $project, ProjectMilestone $milestone)
    {
        if (!$this->checkPermission('project.read')) {
            abort(403, 'Insufficient permissions to view project milestones.');
        }

        if ($milestone->project_id !== $project->id) {
            return response()->json(['message' => 'Milestone not found in this project.'], 404);
        }

        return response()->json($milestone);
    }

    /**
     * Update the specified milestone.
     */
    public function update(Request $request, Project $project, ProjectMilestone $milestone)
    {
        if (!$this->checkPermission('project.manage_milestones')) {
            abort(403, 'Insufficient permissions to manage project milestones.');
        }

        if ($milestone->project_id !== $project->id) {
            return response()->json(['message' => 'Milestone not found in this project.'], 404);
        }

        $validated = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'target_date' => ['sometimes', 'required', 'date'],
            'status' => ['sometimes', 'required', 'in:pending,in_progress,completed,overdue'],
            'type' => ['sometimes', 'required', 'in:start,checkpoint,delivery,completion,custom'],
            'progress' => ['nullable', 'integer', 'min:0', 'max:100'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
            'metadata' => ['nullable', 'array'],
        ]);

        $milestone->update($validated);

        return response()->json([
            'message' => 'Milestone updated successfully.',
            'milestone' => $milestone->fresh(),
        ]);
    }

    /**
     * Remove the specified milestone.
     */
    public function destroy(Project $project, ProjectMilestone $milestone)
    {
        if (!$this->checkPermission('project.manage_milestones')) {
            abort(403, 'Insufficient permissions to manage project milestones.');
        }

        if ($milestone->project_id !== $project->id) {
            return response()->json(['message' => 'Milestone not found in this project.'], 404);
        }

        $milestone->delete();

        return response()->json([
            'message' => 'Milestone deleted successfully.',
        ]);
    }

    /**
     * Mark a milestone as completed.
     */
    public function complete(Project $project, ProjectMilestone $milestone)
    {
        if (!$this->checkPermission('project.manage_milestones')) {
            abort(403, 'Insufficient permissions to manage project milestones.');
        }

        if ($milestone->project_id !== $project->id) {
            return response()->json(['message' => 'Milestone not found in this project.'], 404);
        }

        $milestone->markAsCompleted();

        return response()->json([
            'message' => 'Milestone marked as completed.',
            'milestone' => $milestone->fresh(),
        ]);
    }

    /**
     * Reorder milestones.
     */
    public function reorder(Request $request, Project $project)
    {
        if (!$this->checkPermission('project.manage_milestones')) {
            abort(403, 'Insufficient permissions to manage project milestones.');
        }

        $validated = $request->validate([
            'milestones' => ['required', 'array'],
            'milestones.*.id' => ['required', 'exists:project_milestones,id'],
            'milestones.*.sort_order' => ['required', 'integer', 'min:0'],
        ]);

        DB::transaction(function () use ($validated, $project) {
            foreach ($validated['milestones'] as $item) {
                ProjectMilestone::where('id', $item['id'])
                    ->where('project_id', $project->id)
                    ->update(['sort_order' => $item['sort_order']]);
            }
        });

        return response()->json([
            'message' => 'Milestones reordered successfully.',
        ]);
    }

    /**
     * Get overdue milestones.
     */
    public function overdue(Project $project)
    {
        if (!$this->checkPermission('project.read')) {
            abort(403, 'Insufficient permissions to view project milestones.');
        }

        $milestones = $project->getOverdueMilestones();

        return response()->json($milestones);
    }

    /**
     * Get upcoming milestones.
     */
    public function upcoming(Request $request, Project $project)
    {
        if (!$this->checkPermission('project.read')) {
            abort(403, 'Insufficient permissions to view project milestones.');
        }

        $days = $request->input('days', 7);
        $milestones = $project->getUpcomingMilestones($days);

        return response()->json($milestones);
    }
}
