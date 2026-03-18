<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Employee;
use App\Models\Permission;
use App\Services\WorkloadMatrixService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class UserController extends Controller
{
    /**
     * Display a listing of users with their roles and permissions.
     */
    public function index()
    {
        $users = User::with(['roles', 'permissions'])
            ->select('id', 'name', 'email', 'created_at')
            ->get()
            ->map(function ($user) {
                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'created_at' => $user->created_at->format('Y-m-d H:i:s'),
                    'roles' => $user->roles->map(function ($role) {
                        return [
                            'id' => $role->id,
                            'name' => $role->name,
                            'slug' => $role->slug,
                        ];
                    }),
                    'permissions' => $user->getAllPermissions()->map(function ($permission) {
                        return [
                            'id' => $permission->id,
                            'name' => $permission->name,
                            'slug' => $permission->slug,
                            'module' => $permission->module,
                            'action' => $permission->action,
                        ];
                    }),
                    'user_permissions' => $user->permissions->map(function ($permission) {
                        return [
                            'id' => $permission->id,
                            'name' => $permission->name,
                            'slug' => $permission->slug,
                            'module' => $permission->module,
                            'action' => $permission->action,
                        ];
                    }),
                    'denied_permissions' => $user->deniedPermissions->map(function ($permission) {
                        return [
                            'id' => $permission->id,
                            'name' => $permission->name,
                            'slug' => $permission->slug,
                            'module' => $permission->module,
                            'action' => $permission->action,
                        ];
                    }),
                ];
            });

        return Inertia::render('admin/users/Index', [
            'users' => $users,
        ]);
    }

    /**
     * Get users list for assignment (JSON API).
     */
    public function getUsersForAssignment(WorkloadMatrixService $workloadMatrixService)
    {
        $matrix = collect($workloadMatrixService->build([])['rows'] ?? [])->keyBy('user_id');

        $employees = Employee::with('user')
            ->whereHas('user', function ($query) {
                $query->where('status', 'active');
            })
            ->get();

        $users = $employees->map(function ($employee) use ($matrix) {
            $workload = $matrix->get($employee->user->id, []);

            return [
                'id' => $employee->user->id,
                'name' => $employee->user->name,
                'email' => $employee->user->email,
                'department_name' => $workload['department']['name'] ?? null,
                'active_task_count' => (int) ($workload['active_task_count'] ?? 0),
                'in_progress_task_count' => (int) ($workload['in_progress_task_count'] ?? 0),
                'pending_task_count' => (int) ($workload['pending_task_count'] ?? 0),
                'planned_utilization_percent' => (float) ($workload['planned_utilization_percent'] ?? 0),
                'availability_status' => $workload['availability_status'] ?? 'available',
                'load_status' => (($workload['in_progress_task_count'] ?? 0) > 0) ? 'busy' : 'free',
            ];
        })->sortBy([
            ['in_progress_task_count', 'asc'],
            ['pending_task_count', 'asc'],
            ['active_task_count', 'asc'],
            ['name', 'asc'],
        ])->values();

        return response()->json([
            'users' => $users
        ]);
    }

    /**
     * Show the form for creating a new user.
     */
    public function create()
    {
        return Inertia::render('admin/users/Create');
    }

    /**
     * Show the form for editing the specified user.
     */
    public function edit(User $user)
    {
        $user->load(['roles', 'permissions', 'deniedPermissions']);
        
        return Inertia::render('admin/users/Edit', [
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'created_at' => $user->created_at->format('Y-m-d H:i:s'),
                'roles' => $user->roles->map(function ($role) {
                    return [
                        'id' => $role->id,
                        'name' => $role->name,
                        'slug' => $role->slug,
                        'permissions' => $role->permissions->map(function ($permission) {
                            return [
                                'id' => $permission->id,
                                'name' => $permission->name,
                                'slug' => $permission->slug,
                                'module' => $permission->module,
                                'action' => $permission->action,
                            ];
                        }),
                    ];
                }),
                'permissions' => $user->permissions->map(function ($permission) {
                    return [
                        'id' => $permission->id,
                        'name' => $permission->name,
                        'slug' => $permission->slug,
                        'module' => $permission->module,
                        'action' => $permission->action,
                    ];
                }),
                'denied_permissions' => $user->deniedPermissions->map(function ($permission) {
                    return [
                        'id' => $permission->id,
                        'name' => $permission->name,
                        'slug' => $permission->slug,
                        'module' => $permission->module,
                        'action' => $permission->action,
                    ];
                }),
            ],
            'all_permissions' => Permission::all()->groupBy('module'),
        ]);
    }

    /**
     * Store a newly created user.
     */
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users,email',
            'password' => 'required|string|min:8|confirmed',
            'role_ids' => 'array',
            'role_ids.*' => 'exists:roles,id',
        ]);

        DB::beginTransaction();

        try {
            $user = User::create([
                'name' => $request->name,
                'email' => $request->email,
                'password' => bcrypt($request->password),
            ]);

            // Assign roles and their permissions
            if ($request->role_ids) {
                foreach ($request->role_ids as $roleId) {
                    $user->assignRole($roleId);
                }
            }

            DB::commit();

            return response()->json(['message' => 'User created successfully', 'user' => $user]);
        } catch (\Exception $e) {
            DB::rollback();
            return response()->json(['message' => 'Failed to create user'], 500);
        }
    }

    /**
     * Update the specified user.
     */
    public function update(Request $request, User $user): JsonResponse
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users,email,' . $user->id,
            'password' => 'nullable|string|min:8|confirmed',
        ]);

        DB::beginTransaction();

        try {
            $user->update([
                'name' => $request->name,
                'email' => $request->email,
                'password' => $request->password ? bcrypt($request->password) : $user->password,
            ]);

            DB::commit();

            return response()->json(['message' => 'User updated successfully']);
        } catch (\Exception $e) {
            DB::rollback();
            return response()->json(['message' => 'Failed to update user'], 500);
        }
    }

    /**
     * Remove the specified user.
     */
    public function destroy(User $user): JsonResponse
    {
        $user->delete();

        return response()->json(['message' => 'User deleted successfully']);
    }

    /**
     * Assign roles to user.
     */
    public function assignRoles(Request $request, User $user): JsonResponse
    {
        $request->validate([
            'role_ids' => 'array',
            'role_ids.*' => 'exists:roles,id',
        ]);

        DB::beginTransaction();

        try {
            // Remove existing roles
            $user->roles()->detach();

            // Assign new roles
            if ($request->role_ids) {
                foreach ($request->role_ids as $roleId) {
                    $user->assignRole($roleId);
                }
            }

            DB::commit();

            return response()->json(['message' => 'Roles assigned successfully']);
        } catch (\Exception $e) {
            DB::rollback();
            return response()->json(['message' => 'Failed to assign roles'], 500);
        }
    }

    /**
     * Grant user permission.
     */
    public function grantPermission(Request $request, User $user): JsonResponse
    {
        $request->validate([
            'permission_id' => 'required|exists:permissions,id',
        ]);

        DB::beginTransaction();

        try {
            $permission = Permission::find($request->permission_id);
            $user->giveUserPermission($permission);

            DB::commit();

            return response()->json(['message' => 'Permission granted successfully']);
        } catch (\Exception $e) {
            DB::rollback();
            return response()->json(['message' => 'Failed to grant permission'], 500);
        }
    }

    /**
     * Deny user permission.
     */
    public function denyPermission(Request $request, User $user): JsonResponse
    {
        $request->validate([
            'permission_id' => 'required|exists:permissions,id',
        ]);

        DB::beginTransaction();

        try {
            $permission = Permission::find($request->permission_id);
            $user->denyUserPermission($permission);

            DB::commit();

            return response()->json(['message' => 'Permission denied successfully']);
        } catch (\Exception $e) {
            DB::rollback();
            return response()->json(['message' => 'Failed to deny permission'], 500);
        }
    }

    /**
     * Revoke user permission (remove any user-level override).
     */
    public function revokePermission(Request $request, User $user): JsonResponse
    {
        $request->validate([
            'permission_id' => 'required|exists:permissions,id',
        ]);

        DB::beginTransaction();

        try {
            $permission = Permission::find($request->permission_id);
            $user->revokeUserPermission($permission);

            DB::commit();

            return response()->json(['message' => 'Permission revoked successfully']);
        } catch (\Exception $e) {
            DB::rollback();
            return response()->json(['message' => 'Failed to revoke permission'], 500);
        }
    }

    /**
     * Bulk manage user permissions.
     */
    public function bulkManagePermissions(Request $request, User $user): JsonResponse
    {
        $request->validate([
            'permissions_to_grant' => 'array',
            'permissions_to_grant.*' => 'exists:permissions,id',
            'permissions_to_deny' => 'array',
            'permissions_to_deny.*' => 'exists:permissions,id',
            'permissions_to_revoke' => 'array',
            'permissions_to_revoke.*' => 'exists:permissions,id',
        ]);

        DB::beginTransaction();

        try {
            // Grant permissions
            if ($request->permissions_to_grant) {
                foreach ($request->permissions_to_grant as $permissionId) {
                    $permission = Permission::find($permissionId);
                    $user->giveUserPermission($permission);
                }
            }

            // Deny permissions
            if ($request->permissions_to_deny) {
                foreach ($request->permissions_to_deny as $permissionId) {
                    $permission = Permission::find($permissionId);
                    $user->denyUserPermission($permission);
                }
            }

            // Revoke permissions
            if ($request->permissions_to_revoke) {
                foreach ($request->permissions_to_revoke as $permissionId) {
                    $permission = Permission::find($permissionId);
                    $user->revokeUserPermission($permission);
                }
            }

            DB::commit();

            return response()->json(['message' => 'Permissions updated successfully']);
        } catch (\Exception $e) {
            DB::rollback();
            return response()->json(['message' => 'Failed to update permissions'], 500);
        }
    }
}
