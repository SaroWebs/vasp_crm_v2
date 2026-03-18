<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Fortify\TwoFactorAuthenticatable;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable, TwoFactorAuthenticatable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'two_factor_secret',
        'two_factor_recovery_codes',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'two_factor_confirmed_at' => 'datetime',
        ];
    }

    /**
     * The roles that belong to the user.
     */
    public function roles()
    {
        return $this->belongsToMany(Role::class, 'role_user');
    }

    /**
     * The permissions that belong to the user.
     */
    public function permissions()
    {
        return $this->belongsToMany(Permission::class, 'user_permissions')
            ->withPivot('granted')
            ->wherePivot('granted', 'granted');
    }

    /**
     * The denied permissions that belong to the user.
     */
    public function deniedPermissions()
    {
        return $this->belongsToMany(Permission::class, 'user_permissions')
            ->withPivot('granted')
            ->wherePivot('granted', 'denied');
    }

    /**
     * Check if user has role.
     *
     * @param string|Role|array<int, Role> $role
     * @return bool
     */
    public function hasRole($role): bool
    {
        if (is_string($role)) {
            return $this->roles->contains('slug', $role);
        }

        return !! $this->roles->intersect($role)->count();
    }

    /**
     * Assign role to user and apply role permissions to user permissions.
     *
     * @param string|Role $role
     * @return void
     */
    public function assignRole($role): void
    {
        if (is_string($role)) {
            $role = Role::where('slug', $role)->first();
        }

        if ($role && !$this->roles->contains($role->id)) {
            $this->roles()->attach($role->id);
            
            // Apply role permissions to user permissions
            $rolePermissions = $role->permissions()->get();
            foreach ($rolePermissions as $permission) {
                // Only grant if not already explicitly denied
                if (!$this->deniedPermissions()->where('permission_id', $permission->id)->exists()) {
                    $this->giveUserPermission($permission);
                }
            }
        }
    }

    /**
     * Remove role from user.
     *
     * @param string|Role $role
     * @return void
     */
    public function removeRole($role): void
    {
        if (is_string($role)) {
            $role = Role::where('slug', $role)->first();
        }

        if ($role) {
            $this->roles()->detach($role->id);
        }
    }

    /**
     * Give permission to the user.
     */
    public function giveUserPermission($permission)
    {
        if (is_string($permission)) {
            $permission = Permission::where('slug', $permission)->first();
        }

        if ($permission && !$this->permissions->contains($permission->id)) {
            // Remove any existing denied entry first
            $this->deniedPermissions()->detach($permission->id);
            // Add granted permission
            $this->permissions()->attach($permission->id, ['granted' => 'granted']);
        }
    }

    /**
     * Deny permission to the user.
     */
    public function denyUserPermission($permission)
    {
        if (is_string($permission)) {
            $permission = Permission::where('slug', $permission)->first();
        }

        if ($permission) {
            // Remove any existing granted entry first
            $this->permissions()->detach($permission->id);
            // Add denied permission
            $this->permissions()->attach($permission->id, ['granted' => 'denied']);
        }
    }

    /**
     * Revoke user permission (remove any user-level override).
     */
    public function revokeUserPermission($permission)
    {
        if (is_string($permission)) {
            $permission = Permission::where('slug', $permission)->first();
        }

        if ($permission) {
            // Remove both granted and denied permissions
            $this->permissions()->detach($permission->id);
        }
    }

    /**
     * Check if user has explicit user-level permission.
     */
    public function hasUserPermission($permission)
    {
        if (is_string($permission)) {
            $permission = Permission::where('slug', $permission)->first();
        }

        if (!$permission) {
            return false;
        }

        return $this->permissions()->get()->contains($permission->id);
    }

    /**
     * Check if user has explicit user-level denial.
     */
    public function isUserPermissionDenied($permission)
    {
        if (is_string($permission)) {
            $permission = Permission::where('slug', $permission)->first();
        }

        if (!$permission) {
            return false;
        }

        return $this->deniedPermissions()->get()->contains($permission->id);
    }

    /**
     * Check if user has permission.
     * User-level permissions take precedence over role permissions.
     *
     * @param string|Permission $permission
     * @return bool
     */
    public function hasPermission($permission): bool
    {

        if($this->hasRole('super-admin')){
            return true;
        }

        if (is_string($permission)) {
            $permissionModel = Permission::where('slug', $permission)->first();
            if (!$permissionModel) {
                return false;
            }
            $permission = $permissionModel;
        }

        // First check if permission is explicitly denied at user level
        if ($this->deniedPermissions()->get()->contains($permission->id)) {
            return false;
        }

        // Check if permission is explicitly granted at user level
        if ($this->permissions()->get()->contains($permission->id)) {
            return true;
        }

        // If no user-level override, check role permissions
        if (!$this->relationLoaded('roles')) {
            $this->load('roles');
        }

        foreach ($this->roles as $role) {
            // Use query builder to get permissions (more reliable than eager loading)
            $rolePermissions = $role->permissions()->get();
            if ($rolePermissions->contains($permission->id)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Check if user has any of the given permissions.
     *
     * @param array<int, string> $permissions
     * @return bool
     */
    public function hasAnyPermission($permissions): bool
    {
        foreach ($permissions as $permission) {
            if ($this->hasPermission($permission)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Check if user has all of the given permissions.
     *
     * @param array<int, string> $permissions
     * @return bool
     */
    public function hasAllPermissions($permissions): bool
    {
        foreach ($permissions as $permission) {
            if (!$this->hasPermission($permission)) {
                return false;
            }
        }

        return true;
    }

    /**
     * Get all permissions for the user (role + user-level).
     *
     * @return \Illuminate\Database\Eloquent\Collection<int, Permission>
     */
    public function getAllPermissions()
    {
        $permissions = collect();

        // Add user-level granted permissions
        $userPermissions = $this->permissions()->get();
        $permissions = $permissions->merge($userPermissions);

        // Add role permissions that are not explicitly overridden by denied user permissions
        if (!$this->relationLoaded('roles')) {
            $this->load('roles');
        }

        $deniedPermissionIds = $this->deniedPermissions()->get()->pluck('id')->toArray();

        foreach ($this->roles as $role) {
            $rolePermissions = $role->permissions()->get()
                ->whereNotIn('id', $deniedPermissionIds);
            $permissions = $permissions->merge($rolePermissions);
        }

        return $permissions->unique('id');
    }

    /**
     * The tasks assigned to the user.
     */
    public function assignedTasks()
    {
        return $this->belongsToMany(Task::class, 'task_assignments')
            ->withPivot('assigned_at', 'assigned_by', 'assignment_notes', 'is_active', 'accepted_at', 'completed_at', 'metadata')
            ->wherePivot('is_active', true)
            ->withTimestamps();
    }

    /**
     * Get the employee profile for this user.
     */
    public function employee()
    {
        return $this->hasOne(Employee::class, 'user_id');
    }

    /**
     * The department user assignments for this user.
     */
    public function departmentUsers()
    {
        return $this->hasMany(DepartmentUser::class);
    }

    /**
     * Check if user is super admin (has all permissions).
     *
     * @return bool
     */
    public function isSuperAdmin(): bool
    {
        return $this->hasRole('super-admin');
    }

    /**
     * Get the primary role for the user (first role).
     * Note: This is for convenience when using single role assignment,
     * but the system supports multiple roles.
     *
     * @return Role|null
     */
    public function getPrimaryRole()
    {
        return $this->roles()->first();
    }

    /**
     * Get the log name for this model.
     */
    public function getLogName()
    {
        return 'User';
    }
}
