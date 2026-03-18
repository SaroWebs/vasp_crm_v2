<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class ProjectPhase extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'project_id',
        'name',
        'description',
        'sort_order',
        'start_date',
        'end_date',
        'status',
        'progress',
        'color',
        'settings',
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
        'settings' => 'array',
    ];

    // Status constants
    const STATUS_PENDING = 'pending';
    const STATUS_ACTIVE = 'active';
    const STATUS_COMPLETED = 'completed';
    const STATUS_ON_HOLD = 'on_hold';

    /**
     * Get the project that owns the phase.
     */
    public function project()
    {
        return $this->belongsTo(Project::class);
    }

    /**
     * Get the tasks in this phase.
     */
    public function tasks()
    {
        return $this->hasMany(Task::class, 'phase_id');
    }

    /**
     * Get the timeline events for this phase.
     */
    public function timelineEvents()
    {
        return $this->hasMany(ProjectTimelineEvent::class, 'phase_id');
    }

    // Scopes

    /**
     * Scope for pending phases.
     */
    public function scopePending($query)
    {
        return $query->where('status', self::STATUS_PENDING);
    }

    /**
     * Scope for active phases.
     */
    public function scopeActive($query)
    {
        return $query->where('status', self::STATUS_ACTIVE);
    }

    /**
     * Scope for completed phases.
     */
    public function scopeCompleted($query)
    {
        return $query->where('status', self::STATUS_COMPLETED);
    }

    // Methods

    /**
     * Calculate the progress of the phase based on tasks.
     */
    public function calculateProgress(): int
    {
        $tasks = $this->tasks;
        
        if ($tasks->isEmpty()) {
            return $this->progress ?? 0;
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
     * Update the progress based on tasks.
     */
    public function updateProgress(): void
    {
        $this->update(['progress' => $this->calculateProgress()]);
    }

    /**
     * Check if the phase is overdue.
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
            self::STATUS_PENDING => 'Pending',
            self::STATUS_ACTIVE => 'Active',
            self::STATUS_COMPLETED => 'Completed',
            self::STATUS_ON_HOLD => 'On Hold',
        ];
    }
}
