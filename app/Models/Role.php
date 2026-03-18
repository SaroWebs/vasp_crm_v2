<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Role extends Model
{
    protected $fillable = [
        'name',
        'slug',
        'guard_name',
        'description',
        'is_default',
        'level',
    ];

    /**
     * The users that belong to the role.
     */
    public function users()
    {
        return $this->belongsToMany(User::class, 'role_user');
    }

    /**
     * The permissions that belong to the role.
     */
    public function permissions()
    {
        return $this->belongsToMany(Permission::class, 'role_permissions');
    }

    /**
     * Give permission to the role.
     */
    public function givePermissionTo($permission)
    {
        if (is_string($permission)) {
            $permission = Permission::where('slug', $permission)->first();
        }

        if ($permission && !$this->permissions->contains($permission->id)) {
            $this->permissions()->attach($permission->id);
        }
    }

    /**
     * Revoke permission from the role.
     */
    public function revokePermissionTo($permission)
    {
        if (is_string($permission)) {
            $permission = Permission::where('slug', $permission)->first();
        }

        if ($permission) {
            $this->permissions()->detach($permission->id);
        }
    }

    /**
     * Check if role has permission.
     */
    public function hasPermissionTo($permission)
    {
        if (is_string($permission)) {
            $permission = Permission::where('slug', $permission)->first();
        }

        return $this->permissions->contains($permission->id);
    }

    /**
     * Scope to filter by level.
     */
    public function scopeLevel($query, $level)
    {
        return $query->where('level', $level);
    }
}
