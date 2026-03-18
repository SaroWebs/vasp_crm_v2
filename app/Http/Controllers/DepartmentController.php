<?php

namespace App\Http\Controllers;

use App\Models\User;
use Inertia\Inertia;
use App\Models\Department;
use App\Models\Notification;
use Illuminate\Http\Request;
use App\Models\DepartmentUser;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;

class DepartmentController extends Controller
{
  
    /**
     * Check if user has permission or is super admin
     */
    private function checkPermission($permission)
    {
        $user = User::find(Auth::user()->id);
        return $user->hasPermission($permission);
    }


    public function getData(Request $request) {
        // url params for pagination and filtering
        $per_page = $request->query('per_page', 10);
        
        $query = Department::query();
        // filter query
        if ($request->has('search')) {
            $query->where(function ($q) use ($request) {
                $q->where('name', 'like', '%' . $request->search . '%')
                    ->orWhere('description', 'like', '%' . $request->search . '%');
            });
        }

        $departments = $query->with(['users:id,name,email', 'users.roles:id,name,slug'])
            ->orderBy('name')
            ->paginate($per_page)
            ->withQueryString();

        return response()->json($departments, 200);
    }

    /**
     * Display a listing of departments
     */
    public function index(Request $request)
    {
        $user = User::find(Auth::user()->id);
        if (!$this->checkPermission('department.read')) {
            abort(403, 'Insufficient permissions to view departments.');
        }

        return Inertia::render('departments/Index', [
            'userPermissions' => $user->getAllPermissions()->pluck('slug'),
            'isSuperAdmin' => $user->isSuperAdmin(),
        ]);
    }

    /**
     * Show the form for creating a new department
     */
    public function create()
    {

        if (!$this->checkPermission('department.create')) {
            abort(403, 'Insufficient permissions to create departments.');
        }

        return Inertia::render('departments/Create');
    }

    /**
     * Store a newly created department
     */
    public function store(Request $request)
    {

        if (!$this->checkPermission('department.create')) {
            abort(403, 'Insufficient permissions to create departments.');
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:departments',
            'description' => 'nullable|string|max:1000',
            'status' => 'required|in:active,inactive',
            'color' => 'nullable|string|regex:/^#[0-9A-F]{6}$/i',
        ]);

        $department = Department::create([
            'name' => $validated['name'],
            'description' => $validated['description'] ?? null,
            'status' => $validated['status'],
            'color' => $validated['color'] ?? '#3B82F6',
        ]);

        if ($request->expectsJson() || $request->ajax()) {
            return response()->json([
                'success' => true,
                'message' => 'Department created successfully.',
                'department' => $department
            ]);
        }

        return redirect()->route('departments.index')
            ->with('success', 'Department created successfully.');
    }

    /**
     * Display the specified department
     */
    public function show(Department $department)
    {

        if (!$this->checkPermission('department.read')) {
            abort(403, 'Insufficient permissions to view department.');
        }

        $department->load(['users.roles', 'users.assignedTasks' => function ($query) {
            $query->where('status', '!=', 'completed')
                ->with(['createdBy:id,name']);
        }]);

        return Inertia::render('departments/Show', [
            'department' => $department
        ]);
    }

    /**
     * Show the form for editing the specified department
     */
    public function edit(Department $department)
    {

        if (!$this->checkPermission('department.update')) {
            abort(403, 'Insufficient permissions to edit department.');
        }

        $department->load(['users.roles']);

        return Inertia::render('departments/Edit', [
            'department' => $department
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Department $department)
    {

        if (!$this->checkPermission('department.update')) {
            abort(403, 'Insufficient permissions to update department.');
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:departments,name,' . $department->id,
            'description' => 'nullable|string|max:1000',
            'status' => 'required|in:active,inactive',
            'color' => 'nullable|string|regex:/^#[0-9A-F]{6}$/i',
        ]);

        $department->update([
            'name' => $validated['name'],
            'description' => $validated['description'] ?? null,
            'status' => $validated['status'],
            'color' => $validated['color'] ?? '#3B82F6',
        ]);

        // Log activity using ActivityLog model
        \App\Models\ActivityLog::log(
            'Department updated',
            $department,
            \Illuminate\Support\Facades\Auth::user(),
            [
                'action' => 'update',
                'old_data' => $department->getOriginal(),
                'new_data' => $department->getAttributes()
            ],
            'department'
        );

        // Check if this is an AJAX request
        if ($request->expectsJson() || $request->ajax()) {
            return response()->json([
                'success' => true,
                'message' => 'Department updated successfully.',
                'department' => $department->fresh()
            ]);
        }

        return redirect()->route('departments.index')
            ->with('success', 'Department updated successfully.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Department $department)
    {

        if (!$this->checkPermission('department.delete')) {
            abort(403, 'Insufficient permissions to delete department.');
        }

        // Check if department has users assigned
        if ($department->users()->count() > 0) {
            $message = 'Cannot delete department with assigned users. Please reassign users first.';
            if (request()->expectsJson() || request()->ajax()) {
                return response()->json(['message' => $message], 422);
            }
            return back()->with('error', $message);
        }

        // Check if department has active tasks
        if ($department->assignedTasks()->count() > 0) {
            $message = 'Cannot delete department with active tasks. Please reassign tasks first.';
            if (request()->expectsJson() || request()->ajax()) {
                return response()->json(['message' => $message], 422);
            }
            return back()->with('error', $message);
        }

        $department->delete();

        // Log activity using ActivityLog model
        \App\Models\ActivityLog::log(
            'Department deleted',
            $department,
            \Illuminate\Support\Facades\Auth::user(),
            [
                'action' => 'delete',
                'deleted_data' => $department->getAttributes()
            ],
            'department'
        );

        // Check if this is an AJAX request
        if (request()->expectsJson() || request()->ajax()) {
            return response()->json([
                'success' => true,
                'message' => 'Department deleted successfully.'
            ]);
        }

        return redirect()->route('departments.index')
            ->with('success', 'Department deleted successfully.');
    }

    /**
     * Assign user to department
     */
    public function assignUser(Request $request, Department $department)
    {
        $user = Auth::user();

        if (!$this->checkPermission('department.update')) {
            abort(403, 'Insufficient permissions to assign users to departments.');
        }

        $validated = $request->validate([
            'user_id' => 'required|exists:users,id',
            'role_ids' => 'required|array',
            'role_ids.*' => 'exists:roles,id'
        ]);

        // Check if user is already assigned to this department
        $existingAssignment = DepartmentUser::where('user_id', $validated['user_id'])
            ->where('department_id', $department->id)
            ->first();

        if ($existingAssignment) {
            return back()->with('error', 'User is already assigned to this department.');
        }

        try {
            DB::beginTransaction();

            // Create department user assignment
            DepartmentUser::create([
                'user_id' => $validated['user_id'],
                'department_id' => $department->id,
                'assigned_by' => $user->id,
                'assigned_at' => now()
            ]);

            // Assign roles to user
            $userToAssign = User::find($validated['user_id']);
            foreach ($validated['role_ids'] as $roleId) {
                if (!$userToAssign->roles()->where('role_id', $roleId)->exists()) {
                    $userToAssign->roles()->attach($roleId);
                }
            }

            // Log activity using ActivityLog model
            \App\Models\ActivityLog::log(
                'User assigned to department',
                $department,
                $user,
                [
                    'action' => 'assign_user',
                    'user_id' => $validated['user_id'],
                    'user_name' => $userToAssign->name,
                    'role_ids' => $validated['role_ids']
                ],
                'department'
            );

            // Send notification to assigned user
            Notification::createWorkflowNotification(
                $validated['user_id'],
                'department_assigned',
                'Assigned to Department',
                "You have been assigned to the {$department->name} department.",
                [
                    'department_id' => $department->id,
                    'department_name' => $department->name,
                    'assigned_by' => $user->id,
                    'assigned_by_name' => $user->name
                ]
            );

            DB::commit();

            return back()->with('success', 'User assigned to department successfully.');
        } catch (\Exception $e) {
            DB::rollback();
            return back()->with('error', 'Failed to assign user to department: ' . $e->getMessage());
        }
    }

    /**
     * Remove user from department
     */
    public function removeUser(Department $department, User $user)
    {

        if (!$this->checkPermission('department.update')) {
            abort(403, 'Insufficient permissions to remove users from departments.');
        }

        try {
            DB::beginTransaction();

            // Remove department assignment
            $assignment = DepartmentUser::where('user_id', $user->id)
                ->where('department_id', $department->id)
                ->first();

            if (!$assignment) {
                throw new \Exception('User is not assigned to this department.');
            }

            $assignment->delete();

            // Log activity using ActivityLog model
            \App\Models\ActivityLog::log(
                'User removed from department',
                $department,
                \Illuminate\Support\Facades\Auth::user(),
                [
                    'action' => 'remove_user',
                    'user_id' => $user->id,
                    'user_name' => $user->name
                ],
                'department'
            );

            DB::commit();

            // Check if this is an AJAX request
            if (request()->expectsJson() || request()->ajax()) {
                return response()->json([
                    'success' => true,
                    'message' => 'User removed from department successfully.'
                ]);
            }

            return back()->with('success', 'User removed from department successfully.');
        } catch (\Exception $e) {
            DB::rollback();

            // Check if this is an AJAX request
            if (request()->expectsJson() || request()->ajax()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to remove user from department: ' . $e->getMessage()
                ], 422);
            }

            return back()->with('error', 'Failed to remove user from department: ' . $e->getMessage());
        }
    }

    /**
     * Get department statistics
     */
    public function getStatistics(Department $department)
    {

        if (!$this->checkPermission('department.read')) {
            abort(403, 'Insufficient permissions to view department statistics.');
        }

        $stats = [
            'total_users' => $department->users()->count(),
            'active_users' => $department->users()->whereHas('roles')->count(),
            'pending_tasks' => $department->assignedTasks()->where('status', '!=', 'completed')->count(),
            'completed_tasks_this_month' => $department->assignedTasks()
                ->whereMonth('created_at', now()->month)
                ->where('status', 'completed')
                ->count(),
            'average_task_completion_time' => $this->calculateAverageTaskCompletion($department),
            'tasks_by_status' => [
                'pending' => $department->assignedTasks()->where('status', 'pending')->count(),
                'in_progress' => $department->assignedTasks()->where('status', 'in-progress')->count(),
                'waiting' => $department->assignedTasks()->where('status', 'waiting')->count(),
                'completed' => $department->assignedTasks()->where('status', 'completed')->count(),
            ]
        ];

        return response()->json($stats);
    }

    /**
     * Calculate average task completion time
     */
    private function calculateAverageTaskCompletion($department)
    {
        $completedTasks = $department->assignedTasks()
            ->where('status', 'completed')
            ->whereNotNull('updated_at')
            ->get();

        if ($completedTasks->isEmpty()) {
            return 0;
        }

        $totalTime = $completedTasks->sum(function ($task) {
            return $task->updated_at->diffInHours($task->created_at);
        });

        return round($totalTime / $completedTasks->count(), 2);
    }

    /**
     * Get all available users for assignment
     */
    public function getAvailableUsers()
    {
        $users = User::select(['id', 'name', 'email'])
            ->whereDoesntHave('roles', function ($query) {
                $query->where('slug', 'super-admin');
            })
            ->whereDoesntHave('departmentUsers')
            ->get();

        return response()->json($users);
    }

    /**
     * Bulk assign users to department
     */
    public function bulkAssignUsers(Request $request, Department $department)
    {
        $user = Auth::user();

        if (!$this->checkPermission('department.update')) {
            abort(403, 'Insufficient permissions to bulk assign users.');
        }

        $validated = $request->validate([
            'user_ids' => 'required|array',
            'user_ids.*' => 'exists:users,id',
        ]);

        try {
            DB::beginTransaction();

            $assignedUsers = [];
            foreach ($validated['user_ids'] as $userId) {
                // Check if user is already assigned
                if (!DepartmentUser::where('user_id', $userId)->where('department_id', $department->id)->exists()) {
                    DepartmentUser::create([
                        'user_id' => $userId,
                        'department_id' => $department->id,
                        'assigned_by' => $user->id,
                        'assigned_at' => now()
                    ]);

                    $assignedUsers[] = $userId;
                }
            }

            DB::commit();

            // Check if this is an AJAX request
            if (request()->expectsJson() || request()->ajax()) {
                return response()->json([
                    'success' => true,
                    'message' => count($assignedUsers) . ' users assigned to department successfully.',
                    'assigned_users' => $assignedUsers
                ]);
            }

            return back()->with('success', count($assignedUsers) . ' users assigned to department successfully.');
        } catch (\Exception $e) {
            DB::rollback();

            // Check if this is an AJAX request
            if (request()->expectsJson() || request()->ajax()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to assign users: ' . $e->getMessage()
                ], 422);
            }

            return back()->with('error', 'Failed to assign users: ' . $e->getMessage());
        }
    }

}
