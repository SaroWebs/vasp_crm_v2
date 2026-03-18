<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DepartmentUser extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'department_id',
        'assigned_by',
        'assigned_at',
    ];

    protected $casts = [
        'assigned_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * The user that belongs to the department.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * The department the user belongs to.
     */
    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class);
    }

    /**
     * The user who assigned this user to the department.
     */
    public function assignedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_by');
    }

    /**
     * Scope to filter by assignment date.
     */
    public function scopeAssignedAfter($query, $date)
    {
        return $query->where('assigned_at', '>=', $date);
    }

    /**
     * Scope to filter by assignment date.
     */
    public function scopeAssignedBefore($query, $date)
    {
        return $query->where('assigned_at', '<=', $date);
    }

    /**
     * Get the user's roles in this department.
     */
    public function getUserRoles()
    {
        return $this->user->roles;
    }

    /**
     * Check if user has specific role in department.
     */
    public function userHasRole($roleSlug)
    {
        return $this->user->hasRole($roleSlug);
    }

    /**
     * Get assignment duration.
     */
    public function getAssignmentDurationAttribute()
    {
        return $this->assigned_at ? $this->assigned_at->diffForHumans() : null;
    }

    /**
     * Check if assignment is recent (within 30 days).
     */
    public function isRecentAssignment()
    {
        return $this->assigned_at && $this->assigned_at->greaterThan(now()->subDays(30));
    }

    /**
     * Scope for recent assignments.
     */
    public function scopeRecent($query, $days = 30)
    {
        return $query->where('assigned_at', '>=', now()->subDays($days));
    }

    /**
     * Scope for active assignments.
     */
    public function scopeActive($query)
    {
        return $query->whereHas('user', function ($query) {
            $query->where('status', 'active');
        })->whereHas('department', function ($query) {
            $query->where('status', 'active');
        });
    }

    /**
     * Get user permissions through department roles.
     */
    public function getUserPermissions()
    {
        return $this->user->getAllPermissions();
    }

    /**
     * Check if user has specific permission through department roles.
     */
    public function userHasPermission($permission)
    {
        return $this->user->hasPermission($permission);
    }

    /**
     * Get department name for this assignment.
     */
    public function getDepartmentNameAttribute()
    {
        return $this->department ? $this->department->name : null;
    }

    /**
     * Get assigned user name.
     */
    public function getUserNameAttribute()
    {
        return $this->user ? $this->user->name : null;
    }

    /**
     * Get assigned by user name.
     */
    public function getAssignedByNameAttribute()
    {
        return $this->assignedBy ? $this->assignedBy->name : null;
    }

    /**
     * Get assignment status.
     */
    public function getAssignmentStatusAttribute()
    {
        if (!$this->user || !$this->department) {
            return 'invalid';
        }

        if ($this->user->status !== 'active') {
            return 'user_inactive';
        }

        if ($this->department->status !== 'active') {
            return 'department_inactive';
        }

        return 'active';
    }

    /**
     * Scope for managers in department.
     */
    public function scopeManagers($query)
    {
        return $query->whereHas('user.roles', function ($query) {
            $query->whereIn('slug', [
                'department-manager', 
                'manager', 
                'admin'
            ]);
        });
    }

    /**
     * Scope for team leads in department.
     */
    public function scopeTeamLeads($query)
    {
        return $query->whereHas('user.roles', function ($query) {
            $query->whereIn('slug', [
                'team-lead', 
                'department-lead', 
                'lead'
            ]);
        });
    }

    /**
     * Scope for regular staff in department.
     */
    public function scopeStaff($query)
    {
        return $query->whereDoesntHave('user.roles', function ($query) {
            $query->whereIn('slug', [
                'department-manager', 
                'manager', 
                'admin',
                'team-lead', 
                'department-lead', 
                'lead'
            ]);
        });
    }

    /**
     * Boot method to handle model events.
     */
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($assignment) {
            // Auto-set assigned_at if not provided
            if (!$assignment->assigned_at) {
                $assignment->assigned_at = now();
            }
        });

        static::created(function ($assignment) {
            // Log assignment creation
            if ($assignment->user && $assignment->department) {
                // You can implement notification or activity logging here
                $assignment->createActivityLog('assigned_to_department');
            }
        });

        static::deleted(function ($assignment) {
            // Log assignment removal
            if ($assignment->user && $assignment->department) {
                // You can implement notification or activity logging here
                $assignment->createActivityLog('removed_from_department');
            }
        });
    }

    /**
     * Create activity log for this assignment.
     */
    public function createActivityLog($action, $properties = [])
    {
        // Create activity log entry using the correct column names
        \App\Models\ActivityLog::create([
            'causer_id' => $this->assigned_by,
            'causer_type' => 'App\\Models\\User',
            'log_name' => 'DepartmentUser',
            'description' => ucfirst(str_replace('_', ' ', $action)),
            'subject_type' => self::class,
            'subject_id' => $this->id,
            'properties' => $properties,
        ]);
    }

    /**
     * Get assignment details for API responses.
     */
    public function toArray()
    {
        return array_merge(parent::toArray(), [
            'department_name' => $this->department_name,
            'user_name' => $this->user_name,
            'assigned_by_name' => $this->assigned_by_name,
            'assignment_duration' => $this->assignment_duration,
            'assignment_status' => $this->assignment_status,
            'user_roles' => $this->getUserRoles(),
            'user_permissions' => $this->getUserPermissions()->pluck('slug')->toArray(),
        ]);
    }

    /**
     * Get all assignments for a specific department with user details.
     */
    public static function getAssignmentsForDepartment($departmentId)
    {
        return self::where('department_id', $departmentId)
            ->with(['user', 'department', 'assignedBy'])
            ->get();
    }

    /**
     * Get all assignments for a specific user.
     */
    public static function getAssignmentsForUser($userId)
    {
        return self::where('user_id', $userId)
            ->with(['user', 'department', 'assignedBy'])
            ->get();
    }

    /**
     * Check if user is currently assigned to any active department.
     */
    public static function userIsAssigned($userId, $departmentId = null)
    {
        $query = self::where('user_id', $userId);
        
        if ($departmentId) {
            $query->where('department_id', $departmentId);
        }

        return $query->whereHas('department', function ($query) {
            $query->where('status', 'active');
        })->exists();
    }

    /**
     * Get current assignment for user.
     */
    public static function getCurrentAssignment($userId, $departmentId = null)
    {
        $query = self::where('user_id', $userId);
        
        if ($departmentId) {
            $query->where('department_id', $departmentId);
        }

        return $query->whereHas('department', function ($query) {
            $query->where('status', 'active');
        })->first();
    }

    /**
     * Update assignment with new roles.
     */
    public function updateRoles($roleIds)
    {
        // Remove existing roles
        $this->user->roles()->detach();
        
        // Add new roles
        foreach ($roleIds as $roleId) {
            $this->user->roles()->attach($roleId);
        }

        // Log role update
        $this->createActivityLog('roles_updated', [
            'old_roles' => $this->getUserRoles()->pluck('id')->toArray(),
            'new_roles' => $roleIds
        ]);
    }

    /**
     * Get department-specific statistics for this assignment.
     */
    public function getDepartmentStats()
    {
        if (!$this->department) {
            return null;
        }

        return [
            'total_department_users' => $this->department->users()->count(),
            'department_active_tasks' => $this->department->assignedTasks()->where('status', '!=', 'completed')->count(),
            'user_tasks_in_department' => $this->department->assignedTasks()->where('assigned_to', $this->user_id)->count(),
        ];
    }
}
