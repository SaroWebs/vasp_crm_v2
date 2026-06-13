<?php

namespace App\Http\Controllers;

use App\Http\Requests\ReorderProjectPhasesRequest;
use App\Http\Requests\StoreProjectPhaseRequest;
use App\Http\Requests\UpdateProjectPhaseRequest;
use App\Models\Project;
use App\Models\ProjectPhase;
use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class ProjectPhaseController extends Controller
{
    private function checkPermission(string $permission): bool
    {
        $user = User::find(Auth::id());

        return $user ? $user->hasPermission($permission) : false;
    }

    /**
     * Display a listing of project phases.
     */
    public function index(Project $project)
    {
        if (! $this->checkPermission('project.read')) {
            abort(403, 'Insufficient permissions to view project phases.');
        }

        $phases = $project->phases()
            ->withCount('tasks')
            ->orderBy('sort_order')
            ->get();

        return response()->json($phases);
    }

    /**
     * Store a newly created phase.
     */
    public function store(StoreProjectPhaseRequest $request, Project $project)
    {
        if (! $this->checkPermission('project.manage_phases')) {
            abort(403, 'Insufficient permissions to manage project phases.');
        }

        $validated = $request->validated();

        $phase = $project->phases()->create([
            'name' => $validated['name'],
            'description' => $validated['description'] ?? null,
            'start_date' => $validated['start_date'] ?? null,
            'end_date' => $validated['end_date'] ?? null,
            'status' => $validated['status'],
            'progress' => $validated['progress'] ?? 0,
            'color' => $validated['color'] ?? null,
            'sort_order' => $validated['sort_order'] ?? $project->phases()->count(),
            'settings' => $validated['settings'] ?? null,
        ]);

        return response()->json([
            'message' => 'Phase created successfully.',
            'phase' => $phase,
        ], 201);
    }

    /**
     * Display the specified phase.
     */
    public function show(Project $project, ProjectPhase $phase)
    {
        if (! $this->checkPermission('project.read')) {
            abort(403, 'Insufficient permissions to view project phases.');
        }

        if ($phase->project_id !== $project->id) {
            return response()->json(['message' => 'Phase not found in this project.'], 404);
        }

        $phase->load(['tasks' => function ($query) {
            $query->orderBy('created_at', 'desc');
        }]);

        return response()->json($phase);
    }

    /**
     * Update the specified phase.
     */
    public function update(UpdateProjectPhaseRequest $request, Project $project, ProjectPhase $phase)
    {
        if (! $this->checkPermission('project.manage_phases')) {
            abort(403, 'Insufficient permissions to manage project phases.');
        }

        if ($phase->project_id !== $project->id) {
            return response()->json(['message' => 'Phase not found in this project.'], 404);
        }

        $validated = $request->validated();

        if (($validated['status'] ?? null) === ProjectPhase::STATUS_COMPLETED) {
            $validated['progress'] = 100;
        }

        $phase->update($validated);

        return response()->json([
            'message' => 'Phase updated successfully.',
            'phase' => $phase->fresh(),
        ]);
    }

    /**
     * Remove the specified phase.
     */
    public function destroy(Project $project, ProjectPhase $phase)
    {
        if (! $this->checkPermission('project.manage_phases')) {
            abort(403, 'Insufficient permissions to manage project phases.');
        }

        if ($phase->project_id !== $project->id) {
            return response()->json(['message' => 'Phase not found in this project.'], 404);
        }

        // Check if phase has tasks
        if ($phase->tasks()->exists()) {
            return response()->json([
                'message' => 'Cannot delete phase with tasks. Move or delete tasks first.',
            ], 422);
        }

        $phase->delete();

        return response()->json([
            'message' => 'Phase deleted successfully.',
        ]);
    }

    /**
     * Reorder phases.
     */
    public function reorder(ReorderProjectPhasesRequest $request, Project $project)
    {
        if (! $this->checkPermission('project.manage_phases')) {
            abort(403, 'Insufficient permissions to manage project phases.');
        }

        $validated = $request->validated();

        DB::transaction(function () use ($validated, $project) {
            foreach ($validated['phases'] as $item) {
                ProjectPhase::where('id', $item['id'])
                    ->where('project_id', $project->id)
                    ->update(['sort_order' => $item['sort_order']]);
            }
        });

        return response()->json([
            'message' => 'Phases reordered successfully.',
        ]);
    }

    public function complete(Project $project, ProjectPhase $phase)
    {
        if (! $this->checkPermission('project.manage_phases')) {
            abort(403, 'Insufficient permissions to manage project phases.');
        }

        if ($phase->project_id !== $project->id) {
            return response()->json(['message' => 'Phase not found in this project.'], 404);
        }

        $phase->update([
            'status' => ProjectPhase::STATUS_COMPLETED,
            'progress' => 100,
        ]);

        return response()->json([
            'message' => 'Planning milestone completed successfully.',
            'phase' => $phase->fresh(),
        ]);
    }

    /**
     * Get tasks for a specific phase.
     */
    public function getTasks(Project $project, ProjectPhase $phase)
    {
        if (! $this->checkPermission('project.read')) {
            abort(403, 'Insufficient permissions to view project phase tasks.');
        }

        if ($phase->project_id !== $project->id) {
            return response()->json(['message' => 'Phase not found in this project.'], 404);
        }

        $tasks = $phase->tasks()
            ->with(['currentOwner', 'taskType'])
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($tasks);
    }

    /**
     * Update phase progress based on tasks.
     */
    public function updateProgress(Project $project, ProjectPhase $phase)
    {
        if (! $this->checkPermission('project.manage_phases')) {
            abort(403, 'Insufficient permissions to manage project phases.');
        }

        if ($phase->project_id !== $project->id) {
            return response()->json(['message' => 'Phase not found in this project.'], 404);
        }

        $phase->updateProgress();

        return response()->json([
            'message' => 'Phase progress updated successfully.',
            'progress' => $phase->progress,
        ]);
    }
}
