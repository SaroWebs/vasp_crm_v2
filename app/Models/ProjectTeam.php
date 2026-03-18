<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ProjectTeam extends Model
{
    protected $fillable = [
        'project_id',
        'user_id',
        'role',
    ];

    // Role constants
    const ROLE_OWNER = 'owner';
    const ROLE_MANAGER = 'manager';
    const ROLE_MEMBER = 'member';
    const ROLE_VIEWER = 'viewer';

    /**
     * Get the project that the team member belongs to.
     */
    public function project()
    {
        return $this->belongsTo(Project::class);
    }

    /**
     * Get the user (team member).
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    // Methods

    /**
     * Check if the member is an owner.
     */
    public function isOwner(): bool
    {
        return $this->role === self::ROLE_OWNER;
    }

    /**
     * Check if the member is a manager.
     */
    public function isManager(): bool
    {
        return $this->role === self::ROLE_MANAGER;
    }

    /**
     * Check if the member can manage the project.
     */
    public function canManage(): bool
    {
        return in_array($this->role, [self::ROLE_OWNER, self::ROLE_MANAGER]);
    }

    /**
     * Get role options for forms.
     */
    public static function getRoleOptions(): array
    {
        return [
            self::ROLE_OWNER => 'Owner',
            self::ROLE_MANAGER => 'Manager',
            self::ROLE_MEMBER => 'Member',
            self::ROLE_VIEWER => 'Viewer',
        ];
    }

    /**
     * Get role permissions.
     */
    public static function getRolePermissions(): array
    {
        return [
            self::ROLE_OWNER => [
                'edit_project',
                'delete_project',
                'manage_team',
                'manage_milestones',
                'manage_phases',
                'manage_tasks',
                'manage_attachments',
                'view_reports',
            ],
            self::ROLE_MANAGER => [
                'edit_project',
                'manage_team',
                'manage_milestones',
                'manage_phases',
                'manage_tasks',
                'manage_attachments',
                'view_reports',
            ],
            self::ROLE_MEMBER => [
                'manage_tasks',
                'manage_attachments',
                'view_reports',
            ],
            self::ROLE_VIEWER => [
                'view_reports',
            ],
        ];
    }
}
