<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class ProjectTimelineEvent extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'project_id',
        'phase_id',
        'user_id',
        'event_type',
        'event_name',
        'event_description',
        'event_date',
        'is_milestone',
        'milestone_type',
        'target_date',
        'is_completed',
        'completed_at',
        'progress_percentage',
        'metadata',
    ];

    protected $casts = [
        'event_date' => 'datetime',
        'completed_at' => 'datetime',
        'target_date' => 'date',
        'is_milestone' => 'boolean',
        'is_completed' => 'boolean',
        'metadata' => 'array',
    ];

    // Event type constants
    const TYPE_PROJECT_CREATED = 'project_created';
    const TYPE_PROJECT_UPDATED = 'project_updated';
    const TYPE_STATUS_CHANGED = 'status_changed';
    const TYPE_PHASE_STARTED = 'phase_started';
    const TYPE_PHASE_COMPLETED = 'phase_completed';
    const TYPE_MILESTONE_REACHED = 'milestone_reached';
    const TYPE_TASK_ADDED = 'task_added';
    const TYPE_TASK_COMPLETED = 'task_completed';
    const TYPE_MEMBER_ADDED = 'member_added';
    const TYPE_MEMBER_REMOVED = 'member_removed';
    const TYPE_NOTE = 'note';
    const TYPE_CUSTOM = 'custom';

    /**
     * Get the project that owns the timeline event.
     */
    public function project()
    {
        return $this->belongsTo(Project::class);
    }

    /**
     * Get the phase associated with the event.
     */
    public function phase()
    {
        return $this->belongsTo(ProjectPhase::class, 'phase_id');
    }

    /**
     * Get the user who created the event.
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    // Scopes

    /**
     * Scope for milestone events.
     */
    public function scopeMilestones($query)
    {
        return $query->where('is_milestone', true);
    }

    /**
     * Scope for completed events.
     */
    public function scopeCompleted($query)
    {
        return $query->where('is_completed', true);
    }

    /**
     * Scope for events by type.
     */
    public function scopeByType($query, $type)
    {
        return $query->where('event_type', $type);
    }

    // Methods

    /**
     * Mark the event as completed.
     */
    public function markAsCompleted(): void
    {
        $this->update([
            'is_completed' => true,
            'completed_at' => now(),
            'progress_percentage' => 100,
        ]);
    }

    /**
     * Get event type options for forms.
     */
    public static function getEventTypeOptions(): array
    {
        return [
            self::TYPE_PROJECT_CREATED => 'Project Created',
            self::TYPE_PROJECT_UPDATED => 'Project Updated',
            self::TYPE_STATUS_CHANGED => 'Status Changed',
            self::TYPE_PHASE_STARTED => 'Phase Started',
            self::TYPE_PHASE_COMPLETED => 'Phase Completed',
            self::TYPE_MILESTONE_REACHED => 'Milestone Reached',
            self::TYPE_TASK_ADDED => 'Task Added',
            self::TYPE_TASK_COMPLETED => 'Task Completed',
            self::TYPE_MEMBER_ADDED => 'Member Added',
            self::TYPE_MEMBER_REMOVED => 'Member Removed',
            self::TYPE_NOTE => 'Note',
            self::TYPE_CUSTOM => 'Custom',
        ];
    }
}
