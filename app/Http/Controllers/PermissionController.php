<?php

namespace App\Http\Controllers;

use App\Models\Permission;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Inertia\Inertia;

class PermissionController extends Controller
{
    /**
     * Display a listing of permissions.
     */
    public function index()
    {
        $permissions = Permission::all()->groupBy('module');

        return Inertia::render('admin/permissions/Index', [
            'permissions' => $permissions,
        ]);
    }

    /**
     * Show the form for creating a new permission.
     */
    public function create()
    {
        return Inertia::render('admin/permissions/Create');
    }

    /**
     * Show the form for editing the specified permission.
     */
    public function edit(Permission $permission)
    {
        return Inertia::render('admin/permissions/Edit', [
            'permission' => $permission,
        ]);
    }

    /**
     * Store a newly created permission.
     */
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'name' => 'required|string|max:255|unique:permissions,name',
            'slug' => 'required|string|max:255|unique:permissions,slug',
            'module' => 'required|string|max:255',
            'action' => 'required|string|max:255',
            'description' => 'nullable|string',
        ]);

        Permission::create($request->all());

        return response()->json(['message' => 'Permission created successfully']);
    }

    /**
     * Display the specified permission.
     */
    public function show(Permission $permission)
    {
        return Inertia::render('admin/permissions/Show', [
            'permission' => $permission,
        ]);
    }

    /**
     * Update the specified permission.
     */
    public function update(Request $request, Permission $permission): JsonResponse
    {
        $request->validate([
            'name' => 'required|string|max:255|unique:permissions,name,' . $permission->id,
            'slug' => 'required|string|max:255|unique:permissions,slug,' . $permission->id,
            'module' => 'required|string|max:255',
            'action' => 'required|string|max:255',
            'description' => 'nullable|string',
        ]);

        $permission->update($request->all());

        return response()->json(['message' => 'Permission updated successfully']);
    }

    /**
     * Remove the specified permission.
     */
    public function destroy(Permission $permission): JsonResponse
    {
        // Check if permission is assigned to any roles
        if ($permission->roles()->exists()) {
            return response()->json([
                'message' => 'Cannot delete permission that is assigned to roles'
            ], 422);
        }

        $permission->delete();

        return response()->json(['message' => 'Permission deleted successfully']);
    }
}