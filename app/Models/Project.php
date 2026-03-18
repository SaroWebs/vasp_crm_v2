<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Project extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'name',
        'code',
        'description',
        'department_id',
        'manager_id',
        'status',
        'priority',
        'start_date',
        'end_date',
        'budget',
        'progress',
        'color',
        'settings',
        'created_by',
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
        'settings' => 'array',
        'budget' => 'decimal:2',
    ];

    // Status constants
    const STATUS_PLANNING = 'planning';
    const STATUS_ACTIVE = 'active';
    const STATUS_ON_HOLD = 'on_hold';
    const STATUS_COMPLETED = 'completed';
    const STATUS_CANCELLED = 'cancelled';

    // Priority constants
    const PRIORITY_LOW = 'low';
    const PRIORITY_MEDIUM = 'medium';
    const PRIORITY_HIGH = 'high';
    const PRIORITY_CRITICAL = 'critical';

    // Default color
    const DEFAULT_COLOR = '#3b82f6';

    /**
     * Get the department that owns the project.
     */
    public function department()
    {
        return $this->belongsTo(Department::class);
    }

    /**
     * Get the manager of the project.
     */
    public function manager()
    {
        return $this->belongsTo(User::class, 'manager_id');
    }

    /**
     * Get the creator of the project.
     */
    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Get the tasks for this project.
     */
    public function tasks()
    {
        return $this->hasMany(Task::class);
    }

    /**
     * Get the project team members.
     */
    public function team()
    {
        return $this->hasMany(ProjectTeam::class);
    }

    /**
     * Get the project milestones.
     */
    public function milestones()
    {
        return $this->hasMany(ProjectMilestone::class)->orderBy('sort_order');
    }

    /**
     * Get the project phases.
     */
    public function phases()
    {
        return $this->hasMany(ProjectPhase::class)->orderBy('sort_order');
    }

    /**
     * Get the project timeline events.
     */
    public function timelineEvents()
    {
        return $this->hasMany(ProjectTimelineEvent::class)->orderBy('event_date', 'desc');
    }

    /**
     * Get the project attachments.
     */
    public function attachments()
    {
        return $this->hasMany(ProjectAttachment::class)->latest();
    }

    // Scopes

    /**
     * Scope for active projects.
     */
    public function scopeActive($query)
    {
        return $query->where('status', self::STATUS_ACTIVE);
    }

    /**
     * Scope for projects by status.
     */
    public function scopeByStatus($query, $status)
    {
        return $query->where('status', $status);
    }

    /**
     * Scope for projects by priority.
     */
    public function scopeByPriority($query, $priority)
    {
        return $query->where('priority', $priority);
    }

    // Methods

    /**
     * Calculate the overall progress of the project based on tasks.
     */
    public function calculateProgress(): int
    {
        $tasks = $this->tasks;
        
        if ($tasks->isEmpty()) {
            return 0;
        }

        $totalProgress = $tasks->sum(function (Task $task) {
            if (array_key_exists('progress', $task->getAttributes()) && is_numeric($task->getAttribute('progress'))) {
                return (int) $task->getAttribute('progress');
            }

            return match ($task->state) {
                'Done', 'Cancelled', 'Rejected' => 100,
                'InReview' => 80,
                'InProgress' => 50,
                'Blocked' => 25,
                'Assigned' => 10,
                default => 0,
            };
        });

        return (int) round($totalProgress / max(1, $tasks->count()));
    }

    /**
     * Get overdue milestones.
     */
    public function getOverdueMilestones()
    {
        return $this->milestones()
            ->where('target_date', '<', now())
            ->where('status', '!=', 'completed')
            ->get();
    }

    /**
     * Get upcoming milestones.
     */
    public function getUpcomingMilestones($days = 7)
    {
        return $this->milestones()
            ->whereBetween('target_date', [now(), now()->addDays($days)])
            ->where('status', '!=', 'completed')
            ->get();
    }

    /**
     * Check if project is overdue.
     */
    public function isOverdue(): bool
    {
        return $this->end_date 
            && $this->end_date->isPast() 
            && $this->status !== self::STATUS_COMPLETED;
    }

    /**
     * Get status options for forms.
     */
    public static function getStatusOptions(): array
    {
        return [
            self::STATUS_PLANNING => 'Planning',
            self::STATUS_ACTIVE => 'Active',
            self::STATUS_ON_HOLD => 'On Hold',
            self::STATUS_COMPLETED => 'Completed',
            self::STATUS_CANCELLED => 'Cancelled',
        ];
    }

    /**
     * Get priority options for forms.
     */
    public static function getPriorityOptions(): array
    {
        return [
            self::PRIORITY_LOW => 'Low',
            self::PRIORITY_MEDIUM => 'Medium',
            self::PRIORITY_HIGH => 'High',
            self::PRIORITY_CRITICAL => 'Critical',
        ];
    }
}
