<?php

namespace App\Models;

use App\Models\ActivityLog;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Department extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'description',
        'status',
        'color',
        'sort_order',
        'slug',
    ];

    protected $casts = [
        'status' => 'string',
        'sort_order' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * The users that belong to the department.
     */
    public function users()
    {
        return $this->belongsToMany(User::class, 'department_users')
                    ->withPivot('assigned_at', 'assigned_by')
                    ->withTimestamps();
    }

    /**
     * Get the department users assignments.
     */
    public function departmentUsers()
    {
        return $this->hasMany(DepartmentUser::class);
    }

    /**
     * The tasks assigned to this department.
     */
    public function assignedTasks()
    {
        return $this->hasMany(Task::class, 'assigned_department_id');
    }

    /**
     * Scope to filter by status.
     */
    public function scopeStatus($query, $status)
    {
        return $query->where('status', $status);
    }

    /**
     * Scope to get active departments.
     */
    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    /**
     * Get the count of active users in the department.
     */
    public function getActiveUsersCountAttribute()
    {
        return $this->users()->whereHas('roles')->count();
    }

    /**
     * Get the count of pending tasks for the department.
     */
    public function getPendingTasksCountAttribute()
    {
        return $this->assignedTasks()->where('state', '!=', 'completed')->count();
    }

    /**
     * Get the count of completed tasks this month.
     */
    public function getCompletedTasksThisMonthAttribute()
    {
        return $this->assignedTasks()
            ->whereMonth('created_at', now()->month)
            ->where('state', 'completed')
            ->count();
    }

    /**
     * Check if department is active.
     */
    public function isActive()
    {
        return $this->status === 'active';
    }

    /**
     * Get departments with their user counts.
     */
    public function scopeWithUserCounts($query)
    {
        return $query->withCount(['users']);
    }

    /**
     * Get departments with their task counts.
     */
    public function scopeWithTaskCounts($query)
    {
        return $query->withCount(['assignedTasks as pending_tasks_count' => function($query) {
            $query->where('state', '!=', 'completed');
        }]);
    }

    /**
     * Get department statistics.
     */
    public function getStatistics()
    {
        return [
            'total_users' => $this->users()->count(),
            'active_users' => $this->users()->whereHas('roles')->count(),
            'pending_tasks' => $this->assignedTasks()->where('state', '!=', 'completed')->count(),
            'completed_tasks_this_month' => $this->completed_tasks_this_month,
            'tasks_by_status' => [
                'pending' => $this->assignedTasks()->where('state', 'pending')->count(),
                'in_progress' => $this->assignedTasks()->where('state', 'in-progress')->count(),
                'waiting' => $this->assignedTasks()->where('state', 'waiting')->count(),
                'completed' => $this->assignedTasks()->where('state', 'completed')->count(),
            ]
        ];
    }

    /**
     * The "boot" method of the model.
     */
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($department) {
            // Auto-generate slug if not provided
            if (!$department->slug) {
                $department->slug = \Illuminate\Support\Str::slug($department->name);
            }
        });

        static::updating(function ($department) {
            // Update slug when name changes
            if ($department->isDirty('name')) {
                $department->slug = \Illuminate\Support\Str::slug($department->name);
            }
        });

        static::deleting(function ($department) {
            // Prevent deletion if department has active tasks
            if ($department->assignedTasks()->where('state', '!=', 'completed')->count() > 0) {
                throw new \Exception('Cannot delete department with active tasks.');
            }
        });
    }

    /**
     * Get the route key for the model.
     */
    public function getRouteKeyName()
    {
        return 'id';
    }

    /**
     * Get the department's display name.
     */
    public function getDisplayNameAttribute()
    {
        return $this->name;
    }

    /**
     * Check if user is assigned to this department.
     */
    public function hasUser($userId)
    {
        return $this->users()->where('user_id', $userId)->exists();
    }

    /**
     * Get department's managers (users with management roles).
     */
    public function getManagers()
    {
        return $this->users()->whereHas('roles', function ($query) {
            $query->whereIn('slug', [
                'department-manager', 
                'department-lead', 
                'manager', 
                'lead'
            ]);
        });
    }

    /**
     * Get department's team leads.
     */
    public function getTeamLeads()
    {
        return $this->users()->whereHas('roles', function ($query) {
            $query->whereIn('slug', [
                'team-lead', 
                'department-lead', 
                'lead'
            ]);
        });
    }

    /**
     * Get active users by role.
     */
    public function getUsersByRole($roleSlug)
    {
        return $this->users()->whereHas('roles', function ($query) use ($roleSlug) {
            $query->where('slug', $roleSlug);
        });
    }

    /**
     * Check if department can be deleted.
     */
    public function canBeDeleted()
    {
        return $this->users()->count() === 0 && 
               $this->assignedTasks()->where('state', '!=', 'completed')->count() === 0;
    }

    /**
     * Get department color for UI.
     */
    public function getColorClassAttribute()
    {
        $colorMap = [
            '#3B82F6' => 'bg-blue-500',
            '#10B981' => 'bg-green-500',
            '#F59E0B' => 'bg-yellow-500',
            '#EF4444' => 'bg-red-500',
            '#8B5CF6' => 'bg-purple-500',
            '#EC4899' => 'bg-pink-500',
            '#06B6D4' => 'bg-cyan-500',
            '#84CC16' => 'bg-lime-500',
        ];

        return $colorMap[$this->color] ?? 'bg-gray-500';
    }

    /**
     * Get recent activity for this department.
     */
    public function getRecentActivity($limit = 10)
    {
        return ActivityLog::where('subject_type', self::class)
            ->where('subject_id', $this->id)
            ->latest()
            ->limit($limit)
            ->get();
    }

    /**
     * Get the log name for this model.
     */
    public function getLogName()
    {
        return 'Department';
    }
}
