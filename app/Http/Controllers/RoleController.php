<?php

namespace App\Http\Controllers;

use App\Models\Role;
use App\Models\Permission;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class RoleController extends Controller
{
    /**
     * Display a listing of roles and permissions.
     */
    public function index()
    {
        $roles = Role::with('permissions')->get();
        $permissions = Permission::all()->groupBy('module');
        return Inertia::render('admin/roles-permissions/Index', [
            'roles' => $roles,
            'permissions' => $permissions,
        ]);
    }

    /**
     * Show the form for creating a new role.
     */
    public function create()
    {
        $permissions = Permission::all()->groupBy('module');

        return Inertia::render('admin/roles-permissions/Create', [
            'permissions' => $permissions,
        ]);
    }

    /**
     * Show the form for editing the specified role.
     */
    public function edit(Role $role)
    {
        $role->load('permissions');
        $permissions = Permission::all()->groupBy('module');

        return Inertia::render('admin/roles-permissions/Edit', [
            'role' => $role,
            'permissions' => $permissions,
        ]);
    }

    /**
     * Store a newly created role.
     */
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'name' => 'required|string|max:255|unique:roles,name',
            'slug' => 'required|string|max:255|unique:roles,slug',
            'description' => 'nullable|string',
            'level' => 'required|integer|min:1',
            'permissions' => 'array',
            'permissions.*' => 'exists:permissions,id',
        ]);

        DB::transaction(function () use ($request) {
            $role = Role::create([
                'name' => $request->name,
                'slug' => $request->slug,
                'description' => $request->description,
                'level' => $request->level,
                'guard_name' => 'web',
            ]);

            if ($request->has('permissions')) {
                $role->permissions()->attach($request->permissions);
            }
        });

        return response()->json(['message' => 'Role created successfully']);
    }

    /**
     * Display the specified role.
     */
    public function show(Role $role)
    {
        $role->load('permissions');

        return Inertia::render('admin/roles-permissions/Show', [
            'role' => $role,
        ]);
    }

    /**
     * Update the specified role.
     */
    public function update(Request $request, Role $role): JsonResponse
    {
        $request->validate([
            'name' => 'required|string|max:255|unique:roles,name,' . $role->id,
            'slug' => 'required|string|max:255|unique:roles,slug,' . $role->id,
            'description' => 'nullable|string',
            'level' => 'required|integer|min:1',
            'permissions' => 'array',
            'permissions.*' => 'exists:permissions,id',
        ]);

        DB::transaction(function () use ($request, $role) {
            $role->update([
                'name' => $request->name,
                'slug' => $request->slug,
                'description' => $request->description,
                'level' => $request->level,
            ]);

            $role->permissions()->sync($request->permissions ?? []);
        });

        return response()->json(['message' => 'Role updated successfully']);
    }

    /**
     * Remove the specified role.
     */
    public function destroy(Role $role): JsonResponse
    {
        // Prevent deletion of default roles or roles with users
        if ($role->is_default || $role->users()->exists()) {
            return response()->json([
                'message' => 'Cannot delete role that is default or has assigned users'
            ], 422);
        }

        $role->delete();

        return response()->json(['message' => 'Role deleted successfully']);
    }

    /**
     * Add permissions to a role.
     */
    public function addPermissions(Request $request, Role $role): JsonResponse
    {
        $request->validate([
            'permission_ids' => 'required|array',
            'permission_ids.*' => 'exists:permissions,id',
        ]);

        // Only attach permissions that are not already assigned
        $existingPermissionIds = $role->permissions()->pluck('permissions.id')->toArray();
        $newPermissionIds = array_diff($request->permission_ids, $existingPermissionIds);

        if (empty($newPermissionIds)) {
            return response()->json(['message' => 'All selected permissions are already assigned to this role'], 422);
        }

        $role->permissions()->attach($newPermissionIds);

        return response()->json([
            'message' => 'Permissions added to role successfully',
            'added_count' => count($newPermissionIds)
        ]);
    }

    /**
     * Remove a permission from a role.
     */
    public function removePermission(Role $role, Permission $permission): JsonResponse
    {
        $role->permissions()->detach($permission->id);

        return response()->json(['message' => 'Permission removed from role successfully']);
    }
}
