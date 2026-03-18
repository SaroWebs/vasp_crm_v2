<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Models\ProjectTeam;
use App\Models\User;
use App\Models\Department;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class ProjectController extends Controller
{
    private function checkPermission(string $permission): bool
    {
        $user = User::find(Auth::id());

        return $user ? $user->hasPermission($permission) : false;
    }

    private function getCurrentUserPermissions()
    {
        $user = User::find(Auth::id());

        return $user ? $user->getAllPermissions()->pluck('slug') : collect();
    }

    /**
     * Display a listing of projects.
     */
    public function index(Request $request)
    {
        if (!$this->checkPermission('project.read')) {
            abort(403, 'Insufficient permissions to view projects.');
        }

        $query = Project::with(['manager', 'department', 'team.user'])
            ->withCount(['tasks', 'milestones']);

        // Filter by status
        if ($request->filled('status')) {
            $query->byStatus($request->status);
        }

        // Filter by priority
        if ($request->filled('priority')) {
            $query->byPriority($request->priority);
        }

        // Filter by manager
        if ($request->filled('manager_id')) {
            $query->where('manager_id', $request->manager_id);
        }

        // Filter by department
        if ($request->filled('department_id')) {
            $query->where('department_id', $request->department_id);
        }

        // Filter by date range
        if ($request->filled('start_date_from')) {
            $query->whereDate('start_date', '>=', $request->start_date_from);
        }

        if ($request->filled('end_date_to')) {
            $query->whereDate('end_date', '<=', $request->end_date_to);
        }

        // Search by name or code
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('code', 'like', "%{$search}%");
            });
        }

        $projects = $query->latest()->paginate($request->per_page ?? 15);

        return Inertia::render('admin/projects/index', [
            'projects' => $projects,
            'filters' => $request->only(['status', 'priority', 'manager_id', 'department_id', 'start_date_from', 'end_date_to', 'search']),
            'statusOptions' => Project::getStatusOptions(),
            'priorityOptions' => Project::getPriorityOptions(),
            'managers' => User::select('id', 'name')->get(),
            'departments' => Department::select('id', 'name')->get(),
            'userPermissions' => $this->getCurrentUserPermissions(),
        ]);
    }

    /**
     * Show the form for creating a new project.
     */
    public function create()
    {
        if (!$this->checkPermission('project.create')) {
            abort(403, 'Insufficient permissions to create projects.');
        }

        return Inertia::render('admin/projects/create', [
            'statusOptions' => Project::getStatusOptions(),
            'priorityOptions' => Project::getPriorityOptions(),
            'managers' => User::select('id', 'name')->get(),
            'departments' => Department::select('id', 'name')->get(),
            'users' => User::select('id', 'name', 'email')->get(),
            'roleOptions' => ProjectTeam::getRoleOptions(),
            'userPermissions' => $this->getCurrentUserPermissions(),
        ]);
    }

    /**
     * Store a newly created project.
     */
    public function store(Request $request)
    {
        if (!$this->checkPermission('project.create')) {
            abort(403, 'Insufficient permissions to create projects.');
        }

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'code' => ['nullable', 'string', 'max:50', 'unique:projects,code'],
            'description' => ['nullable', 'string'],
            'department_id' => ['nullable', 'exists:departments,id'],
            'manager_id' => ['nullable', 'exists:users,id'],
            'status' => ['required', 'in:planning,active,on_hold,completed,cancelled'],
            'priority' => ['nullable', 'in:low,medium,high,critical'],
            'start_date' => ['nullable', 'date'],
            'end_date' => ['nullable', 'date', 'after_or_equal:start_date'],
            'budget' => ['nullable', 'numeric', 'min:0'],
            'color' => ['nullable', 'string', 'max:7'],
            'settings' => ['nullable', 'array'],
            'team_members' => ['nullable', 'array'],
            'team_members.*.user_id' => ['required', 'exists:users,id'],
            'team_members.*.role' => ['required', 'in:owner,manager,member,viewer'],
        ]);

        DB::transaction(function () use ($validated, $request) {
            $project = Project::create([
                'name' => $validated['name'],
                'code' => $validated['code'] ?? null,
                'description' => $validated['description'] ?? null,
                'department_id' => $validated['department_id'] ?? null,
                'manager_id' => $validated['manager_id'] ?? null,
                'status' => $validated['status'],
                'priority' => $validated['priority'] ?? Project::PRIORITY_MEDIUM,
                'start_date' => $validated['start_date'] ?? null,
                'end_date' => $validated['end_date'] ?? null,
                'budget' => $validated['budget'] ?? null,
                'color' => $validated['color'] ?? Project::DEFAULT_COLOR,
                'settings' => $validated['settings'] ?? null,
                'created_by' => auth()->id(),
            ]);

            // Add team members
            if (!empty($validated['team_members'])) {
                foreach ($validated['team_members'] as $member) {
                    ProjectTeam::create([
                        'project_id' => $project->id,
                        'user_id' => $member['user_id'],
                        'role' => $member['role'],
                    ]);
                }
            }
        });

        return redirect()->route('admin.projects.index')
            ->with('success', 'Project created successfully.');
    }

    /**
     * Display the specified project.
     */
    public function show(Project $project)
    {
        if (!$this->checkPermission('project.read')) {
            abort(403, 'Insufficient permissions to view projects.');
        }

        $project->load([
            'manager',
            'department',
            'creator',
            'team.user',
            'tasks.taskType',
            'tasks.assignedUsers:id,name',
            'tasks.projectPhase',
            'phases.tasks',
            'milestones',
            'timelineEvents.user',
            'attachments.uploader',
        ]);

        $project->loadCount(['tasks', 'tasks as completed_tasks_count' => function ($q) {
            $q->where('state', 'Done');
        }]);

        return Inertia::render('admin/projects/show', [
            'project' => $project,
            'statusOptions' => Project::getStatusOptions(),
            'priorityOptions' => Project::getPriorityOptions(),
            'roleOptions' => ProjectTeam::getRoleOptions(),
            'users' => User::select('id', 'name', 'email')->get(),
            'userPermissions' => $this->getCurrentUserPermissions(),
        ]);
    }

    /**
     * Show the form for editing the specified project.
     */
    public function edit(Project $project)
    {
        if (!$this->checkPermission('project.update')) {
            abort(403, 'Insufficient permissions to edit projects.');
        }

        $project->load(['team.user']);

        return Inertia::render('admin/projects/edit', [
            'project' => $project,
            'statusOptions' => Project::getStatusOptions(),
            'priorityOptions' => Project::getPriorityOptions(),
            'managers' => User::select('id', 'name')->get(),
            'departments' => Department::select('id', 'name')->get(),
            'users' => User::select('id', 'name', 'email')->get(),
            'roleOptions' => ProjectTeam::getRoleOptions(),
            'userPermissions' => $this->getCurrentUserPermissions(),
        ]);
    }

    /**
     * Update the specified project.
     */
    public function update(Request $request, Project $project)
    {
        if (!$this->checkPermission('project.update')) {
            abort(403, 'Insufficient permissions to update projects.');
        }

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'code' => ['nullable', 'string', 'max:50', 'unique:projects,code,' . $project->id],
            'description' => ['nullable', 'string'],
            'department_id' => ['nullable', 'exists:departments,id'],
            'manager_id' => ['nullable', 'exists:users,id'],
            'status' => ['required', 'in:planning,active,on_hold,completed,cancelled'],
            'priority' => ['required', 'in:low,medium,high,critical'],
            'start_date' => ['nullable', 'date'],
            'end_date' => ['nullable', 'date', 'after_or_equal:start_date'],
            'budget' => ['nullable', 'numeric', 'min:0'],
            'progress' => ['nullable', 'integer', 'min:0', 'max:100'],
            'color' => ['nullable', 'string', 'max:7'],
            'settings' => ['nullable', 'array'],
            'team_members' => ['nullable', 'array'],
            'team_members.*.user_id' => ['required', 'exists:users,id'],
            'team_members.*.role' => ['required', 'in:owner,manager,member,viewer'],
        ]);

        DB::transaction(function () use ($project, $validated) {
            $projectData = collect($validated)->except('team_members')->toArray();
            
            // Use default color if not provided
            if (!isset($projectData['color']) || empty($projectData['color'])) {
                $projectData['color'] = Project::DEFAULT_COLOR;
            }
            
            $project->update($projectData);

            if (array_key_exists('team_members', $validated)) {
                $project->team()->delete();
                foreach ($validated['team_members'] as $member) {
                    ProjectTeam::create([
                        'project_id' => $project->id,
                        'user_id' => $member['user_id'],
                        'role' => $member['role'],
                    ]);
                }
            }
        });

        return redirect()->route('admin.projects.show', $project)
            ->with('success', 'Project updated successfully.');
    }

    /**
     * Remove the specified project.
     */
    public function destroy(Project $project)
    {
        if (!$this->checkPermission('project.delete')) {
            abort(403, 'Insufficient permissions to delete projects.');
        }

        $project->delete();

        return redirect()->route('admin.projects.index')
            ->with('success', 'Project deleted successfully.');
    }

    /**
     * Restore a soft-deleted project.
     */
    public function restore($id)
    {
        if (!$this->checkPermission('project.restore')) {
            abort(403, 'Insufficient permissions to restore projects.');
        }

        $project = Project::withTrashed()->findOrFail($id);
        $project->restore();

        return redirect()->route('admin.projects.show', $project)
            ->with('success', 'Project restored successfully.');
    }

    /**
     * Get project statistics.
     */
    public function getStatistics(Project $project)
    {
        if (!$this->checkPermission('project.read')) {
            abort(403, 'Insufficient permissions to view project statistics.');
        }

        $statistics = [
            'total_tasks' => $project->tasks()->count(),
            'completed_tasks' => $project->tasks()->where('state', 'Done')->count(),
            'pending_tasks' => $project->tasks()->whereNotIn('state', ['Done', 'Cancelled'])->count(),
            'overdue_tasks' => $project->tasks()
                ->where('due_at', '<', now())
                ->whereNotIn('state', ['Done', 'Cancelled'])
                ->count(),
            'total_milestones' => $project->milestones()->count(),
            'completed_milestones' => $project->milestones()->where('status', 'completed')->count(),
            'overdue_milestones' => $project->milestones()
                ->where('target_date', '<', now())
                ->where('status', '!=', 'completed')
                ->count(),
            'team_size' => $project->team()->count(),
            'progress' => $project->calculateProgress(),
        ];

        return response()->json($statistics);
    }

    /**
     * Update project progress.
     */
    public function updateProgress(Project $project)
    {
        if (!$this->checkPermission('project.update')) {
            abort(403, 'Insufficient permissions to update project progress.');
        }

        $progress = $project->calculateProgress();
        $project->update(['progress' => $progress]);

        return response()->json([
            'message' => 'Progress updated successfully.',
            'progress' => $progress,
        ]);
    }

    /**
     * Get Gantt chart data.
     */
    public function getGanttData(Project $project)
    {
        if (!$this->checkPermission('project.read')) {
            abort(403, 'Insufficient permissions to view project gantt data.');
        }

        $phases = $project->phases()->with('tasks')->get();
        $tasks = $project->tasks()->with(['projectPhase'])->get();

        return response()->json([
            'project' => $project,
            'phases' => $phases,
            'tasks' => $tasks,
        ]);
    }

    /**
     * Get project team members.
     */
    public function getTeam(Project $project)
    {
        if (!$this->checkPermission('project.manage_team')) {
            abort(403, 'Insufficient permissions to manage project team.');
        }

        $team = $project->team()->with('user')->get();

        return response()->json($team);
    }

    /**
     * Add a team member to the project.
     */
    public function addTeamMember(Request $request, Project $project)
    {
        if (!$this->checkPermission('project.manage_team')) {
            abort(403, 'Insufficient permissions to manage project team.');
        }

        $validated = $request->validate([
            'user_id' => ['required', 'exists:users,id'],
            'role' => ['required', 'in:owner,manager,member,viewer'],
        ]);

        // Check if user is already a team member
        $existingMember = ProjectTeam::where('project_id', $project->id)
            ->where('user_id', $validated['user_id'])
            ->first();

        if ($existingMember) {
            return response()->json([
                'message' => 'User is already a team member.',
            ], 422);
        }

        $teamMember = ProjectTeam::create([
            'project_id' => $project->id,
            'user_id' => $validated['user_id'],
            'role' => $validated['role'],
        ]);

        return response()->json([
            'message' => 'Team member added successfully.',
            'member' => $teamMember->load('user'),
        ], 201);
    }

    /**
     * Remove a team member from the project.
     */
    public function removeTeamMember(Project $project, $userId)
    {
        if (!$this->checkPermission('project.manage_team')) {
            abort(403, 'Insufficient permissions to manage project team.');
        }

        ProjectTeam::where('project_id', $project->id)
            ->where('user_id', $userId)
            ->delete();

        return response()->json([
            'message' => 'Team member removed successfully.',
        ]);
    }

    /**
     * Update team member role.
     */
    public function updateTeamMemberRole(Request $request, Project $project, $userId)
    {
        if (!$this->checkPermission('project.manage_team')) {
            abort(403, 'Insufficient permissions to manage project team.');
        }

        $validated = $request->validate([
            'role' => ['required', 'in:owner,manager,member,viewer'],
        ]);

        $teamMember = ProjectTeam::where('project_id', $project->id)
            ->where('user_id', $userId)
            ->firstOrFail();

        $teamMember->update(['role' => $validated['role']]);

        return response()->json([
            'message' => 'Role updated successfully.',
            'member' => $teamMember->load('user'),
        ]);
    }
}
