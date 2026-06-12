<?php

namespace App\Http\Controllers;

use App\Http\Requests\UpdateEmployeeRequest;
use App\Models\Department;
use App\Models\Employee;
use App\Models\EmployeeCategory;
use App\Models\Office;
use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class EmployeeController extends Controller
{
    /**
     * Check if user has permission or is super admin
     */
    private function checkPermission($permission)
    {
        $user = User::find(Auth::user()->id);

        if ($user->isSuperAdmin()) {
            return true;
        }

        return $user->hasPermission($permission);
    }

    /**
     * Display a listing of employees
     */
    public function index(Request $request)
    {
        $user = User::find(Auth::user()->id);

        if (! $this->checkPermission('employee.read')) {
            abort(403, 'Insufficient permissions to view employees.');
        }

        if ($request->expectsJson()) {
            $query = Employee::query()
                ->select(['id', 'name', 'email', 'code', 'phone', 'department_id', 'status'])
                ->with(['department:id,name,description']);

            if ($request->has('department_id') && $request->department_id !== 'all') {
                $query->where('department_id', $request->department_id);
            }

            if ($request->has('search')) {
                $query->where(function ($q) use ($request) {
                    $q->where('name', 'like', '%'.$request->search.'%')
                        ->orWhere('email', 'like', '%'.$request->search.'%');
                });
            }

            if (in_array($request->input('status'), Employee::STATUSES, true)) {
                $query->where('status', $request->input('status'));
            }

            return response()->json(
                $query->orderBy('name')
                    ->paginate(15)
                    ->withQueryString(),
                200
            );
        }

        $departments = Department::select('id', 'name')->get();

        return Inertia::render('admin/employees/Index', [
            'departments' => $departments,
            'filters' => $request->only(['department_id', 'search', 'status']),
            'userPermissions' => $user->getAllPermissions()->pluck('slug'),
            'isSuperAdmin' => $user->isSuperAdmin(),
        ]);
    }

    public function getList(Request $request)
    {
        $query = Employee::query()
            ->assignable()
            ->with([
                'department',
                'user' => function ($q) {
                    $q->withoutGlobalScope('exclude_inactive');
                },
            ]);

        $employees = $query->orderBy('name')->get();

        return response()->json($employees, 200);
    }

    /**
     * Show the form for creating a new employee
     */
    public function create()
    {
        if (! $this->checkPermission('employee.create')) {
            abort(403, 'Insufficient permissions to create employees.');
        }

        $departments = Department::select('id', 'name')->get();
        $roles = Role::select('id', 'name', 'slug')->get();
        $permissions = Permission::select('id', 'name', 'slug', 'module')->get();
        $categories = EmployeeCategory::select('id', 'name')->get();

        $rolesWithPermissions = $roles->map(function ($role) {
            $rolePermissions = $role->permissions()
                ->select('permissions.id', 'permissions.name', 'permissions.slug', 'permissions.module')
                ->get();

            return [
                'id' => $role->id,
                'name' => $role->name,
                'slug' => $role->slug,
                'permissions' => $rolePermissions->toArray(),
            ];
        })->toArray();

        return Inertia::render('admin/employees/Create', [
            'departments' => $departments,
            'roles' => $roles,
            'roles_with_permissions' => $rolesWithPermissions,
            'permissions' => $permissions,
            'categories' => $categories,
            'offices' => Office::where('is_active', true)->get(),
        ]);
    }

    /**
     * Store a newly created employee
     */
    public function store(Request $request)
    {
        if (! $this->checkPermission('employee.create')) {
            abort(403, 'Insufficient permissions to create employees.');
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users,email|unique:employees',
            'password' => 'required|string|min:8|confirmed',
            'role_id' => 'required',
            'permissions' => 'nullable|array',
            'permissions.*' => 'string|exists:permissions,slug',
            'denied_permissions' => 'nullable|array',
            'denied_permissions.*' => 'string|exists:permissions,slug',
            'phone' => 'nullable|string|max:20',
            'code' => 'nullable|string|max:50|unique:employees,code',
            'department_id' => 'required|exists:departments,id',
            'category_id' => 'nullable|exists:employee_categories,id',
            'office_ids' => 'required|array|min:1',
            'office_ids.*' => 'exists:offices,id',
            'active_office_id' => 'required|exists:offices,id',
        ]);

        DB::beginTransaction();

        try {
            // Check if email already exists in users table
            if (User::where('email', $validated['email'])->exists()) {
                return back()
                    ->withErrors(['email' => 'A user with this email already exists.'])
                    ->withInput();
            }

            // Create user
            $user = User::create([
                'name' => $validated['name'],
                'email' => $validated['email'],
                'password' => Hash::make($validated['password']),
            ]);

            // Assign role
            $role = Role::find($validated['role_id']);
            if ($role) {
                $user->assignRole($role);
            } else {
                throw new \Exception('Role not found with ID: '.$validated['role_id']);
            }

            // Grant additional permissions
            if (! empty($validated['permissions'])) {
                foreach ($validated['permissions'] as $permissionSlug) {
                    $user->giveUserPermission($permissionSlug);
                }
            }

            // Deny permissions
            if (! empty($validated['denied_permissions'])) {
                foreach ($validated['denied_permissions'] as $permissionSlug) {
                    $user->denyUserPermission($permissionSlug);
                }
            }

            // Create department user assignment
            $user->departmentUsers()->create([
                'department_id' => $validated['department_id'],
                'assigned_by' => Auth::id(),
            ]);

            // Create employee record
            $employee = Employee::create([
                'name' => $validated['name'],
                'email' => $validated['email'],
                'code' => $validated['code'],
                'phone' => $validated['phone'],
                'department_id' => $validated['department_id'],
                'user_id' => $user->id,
                'category_id' => $validated['category_id'] ?? 1,
            ]);

            // Sync offices
            $officeData = [];
            foreach ($validated['office_ids'] as $officeId) {
                $officeData[$officeId] = [
                    'is_active' => $officeId == $validated['active_office_id'],
                ];
            }
            $employee->offices()->sync($officeData);

            DB::commit();

            return redirect()->route('admin.employees.index')
                ->with('success', 'Employee created successfully with user account.');
        } catch (\Exception $e) {
            DB::rollBack();

            // Log the detailed error for debugging
            Log::error('Employee creation failed', [
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString(),
                'validated_data' => $validated,
                'user_id' => Auth::id(),
            ]);

            return back()
                ->withErrors(['general' => 'Failed to create employee. Please try again. Error: '.$e->getMessage()])
                ->withInput();
        }
    }

    /**
     * Display the specified employee
     */
    public function show(Request $request, Employee $employee)
    {
        if (! $this->checkPermission('employee.read')) {
            abort(403, 'Insufficient permissions to view employee.');
        }

        $employee->load([
            'department',
            'category',
            'termination.createdBy:id,name',
            'user' => function ($q) {
                $q->withoutGlobalScope('exclude_inactive');
            },
        ]);

        if ($request->expectsJson()) {
            return response()->json([
                'employee' => [
                    'id' => $employee->id,
                    'name' => $employee->name,
                    'email' => $employee->email,
                    'code' => $employee->code,
                    'phone' => $employee->phone,
                    'department_id' => $employee->department_id,
                    'user_id' => $employee->user_id,
                    'category_id' => $employee->category_id,
                    'status' => $employee->status,
                    'created_at' => $employee->created_at,
                    'updated_at' => $employee->updated_at,
                    'department' => $employee->department,
                    'category' => $employee->category,
                    'termination' => $employee->termination,
                    'user' => $employee->user,
                ],
            ], 200);
        }

        return Inertia::render('admin/employees/Show', [
            'employee' => $employee,
        ]);
    }

    /**
     * Show the form for editing the specified employee
     */
    public function edit(Employee $employee)
    {
        if (! $this->checkPermission('employee.update')) {
            abort(403, 'Insufficient permissions to edit employee.');
        }

        $employee->load(['department', 'termination.createdBy:id,name', 'user' => function ($q) {
            $q->withoutGlobalScope('exclude_inactive');
        }, 'offices']);
        $departments = Department::select('id', 'name')->get();
        $users = User::select('id', 'name', 'email')->get();
        $roles = Role::select('id', 'name', 'slug')->get();
        $permissions = Permission::select('id', 'name', 'slug', 'module')->get();
        $offices = Office::where('is_active', true)->get();

        $rolesWithPermissions = $roles->map(function ($role) {
            $rolePermissions = $role->permissions()
                ->select('permissions.id', 'permissions.name', 'permissions.slug', 'permissions.module')
                ->get();

            return [
                'id' => $role->id,
                'name' => $role->name,
                'slug' => $role->slug,
                'permissions' => $rolePermissions->toArray(),
            ];
        })->toArray();

        // Get current user's permission overrides
        $user = $employee->user;
        $userGrantedPermissions = $user->permissions()->get()->pluck('slug')->toArray();
        $userDeniedPermissions = $user->deniedPermissions()->get()->pluck('slug')->toArray();

        // Get user's effective permissions (for display)
        $userEffectivePermissions = $user->getAllPermissions()->pluck('slug')->toArray();

        // Get user's current roles (as array, but we'll use first role for single role assignment)
        $userCurrentRoles = $user->roles()->pluck('roles.id')->toArray();

        return Inertia::render('admin/employees/Edit', [
            'employee' => $employee,
            'departments' => $departments,
            'users' => $users,
            'roles' => $roles,
            'roles_with_permissions' => $rolesWithPermissions,
            'permissions' => $permissions,
            'offices' => $offices,
            'employee_permissions' => [
                'granted' => $userGrantedPermissions,
                'denied' => $userDeniedPermissions,
                'effective' => $userEffectivePermissions,
            ],
            'employee_roles' => $userCurrentRoles,
        ]);
    }

    /**
     * Update the specified employee basic information
     */
    public function update(UpdateEmployeeRequest $request, Employee $employee)
    {
        if (! $this->checkPermission('employee.update')) {
            abort(403, 'Insufficient permissions to update employee.');
        }

        $validated = $request->validated();
        $previousStatus = $employee->status;

        DB::transaction(function () use ($employee, $previousStatus, $request, $validated): void {
            $linkedUser = $employee->user()
                ->withoutGlobalScope('exclude_inactive')
                ->first();

            $employee->update([
                'name' => $validated['name'],
                'email' => $validated['email'],
                'code' => $validated['code'],
                'phone' => $validated['phone'],
                'department_id' => $validated['department_id'],
                'status' => $validated['status'],
            ]);

            $isUnavailable = in_array($validated['status'], [
                Employee::STATUS_INACTIVE,
                Employee::STATUS_TERMINATED,
            ], true);

            $officeData = [];
            foreach ($validated['office_ids'] as $officeId) {
                $officeData[$officeId] = [
                    'is_active' => ! $isUnavailable && (int) $officeId === (int) $validated['active_office_id'],
                ];
            }
            $employee->offices()->sync($officeData);

            if ($isUnavailable) {
                $linkedUser?->forceFill([
                    'status' => 'inactive',
                    'session_id' => null,
                ])->save();

                if ($previousStatus !== $validated['status']) {
                    $employee->terminations()->create([
                        'status' => $validated['status'],
                        'termination_type' => $validated['termination_type'],
                        'effective_date' => $validated['effective_date'],
                        'reason' => $validated['reason'],
                        'notes' => $validated['notes'] ?? null,
                        'created_by_user_id' => $request->user()?->id,
                    ]);
                }

                $employee->shiftAssignments()
                    ->where('is_active', true)
                    ->update([
                        'effective_to' => $validated['effective_date'],
                        'is_active' => false,
                    ]);
            } elseif ($validated['status'] === Employee::STATUS_ACTIVE) {
                $linkedUser?->forceFill(['status' => 'active'])->save();
            }
        });

        return back()->with('success', 'Employee information updated successfully.');
    }

    /**
     * Update user roles and permissions for an employee
     */
    public function updateRoles(Request $request, Employee $employee)
    {
        if (! $this->checkPermission('employee.update')) {
            abort(403, 'Insufficient permissions to update employee.');
        }

        $validated = $request->validate([
            'role_id' => 'required|exists:roles,id',
            'permissions' => 'nullable|array',
            'permissions.*' => 'string|exists:permissions,slug',
            'denied_permissions' => 'nullable|array',
            'denied_permissions.*' => 'string|exists:permissions,slug',
        ]);

        $user = $employee->user;

        // Update role (using single role for now)
        $role = Role::find($validated['role_id']);
        if ($role) {
            // Clear existing roles
            $user->roles()->detach();
            $user->assignRole($role);
        }

        // Clear all existing user-level permission overrides
        $user->permissions()->detach();
        $user->deniedPermissions()->detach();

        // Grant additional permissions
        if (! empty($validated['permissions'])) {
            foreach ($validated['permissions'] as $permissionSlug) {
                $user->giveUserPermission($permissionSlug);
            }
        }

        // Deny role permissions (blacklist)
        if (! empty($validated['denied_permissions'])) {
            foreach ($validated['denied_permissions'] as $permissionSlug) {
                $user->denyUserPermission($permissionSlug);
            }
        }

        return back()->with('success', 'Roles and permissions updated successfully.');
    }

    /**
     * Remove the specified employee
     */
    public function destroy(Employee $employee)
    {
        if (! $this->checkPermission('employee.delete')) {
            abort(403, 'Insufficient permissions to delete employee.');
        }

        $employee->delete();

        return redirect()->route('admin.employees.index')
            ->with('success', 'Employee deleted successfully.');
    }
}
