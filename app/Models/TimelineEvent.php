<?php

namespace App\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class TimelineEvent extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'task_id',
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
        'target_date' => 'datetime',
        'completed_at' => 'datetime',
        'is_milestone' => 'boolean',
        'is_completed' => 'boolean',
        'progress_percentage' => 'integer',
        'metadata' => 'array',
    ];

    /**
     * Get the task that owns the timeline event.
     */
    public function task()
    {
        return $this->belongsTo(Task::class);
    }

    /**
     * Valid milestone types.
     */
    public const MILESTONE_TYPES = [
        'start' => 'Start',
        'checkpoint' => 'Checkpoint',
        'completion' => 'Completion',
        'deadline' => 'Deadline',
    ];

    /**
     * Scope to filter by event type.
     */
    public function scopeEventType($query, $eventType)
    {
        return $query->where('event_type', $eventType);
    }

    /**
     * Scope to filter by date range.
     */
    public function scopeDateRange($query, $startDate, $endDate)
    {
        return $query->whereBetween('event_date', [$startDate, $endDate]);
    }

    /**
     * Scope to filter by milestone.
     */
    public function scopeMilestone($query, $isMilestone = true)
    {
        return $query->where('is_milestone', $isMilestone);
    }

    /**
     * Scope to filter by milestone type.
     */
    public function scopeMilestoneType($query, string $type)
    {
        return $query->where('milestone_type', $type);
    }

    /**
     * Scope to get completed milestones.
     */
    public function scopeCompleted($query)
    {
        return $query->where('is_completed', true);
    }

    /**
     * Scope to get pending milestones.
     */
    public function scopePending($query)
    {
        return $query->where('is_completed', false);
    }

    /**
     * Check if milestone is overdue.
     */
    public function isOverdue(): bool
    {
        if (!$this->is_milestone || $this->is_completed) {
            return false;
        }

        return $this->target_date && $this->target_date->isPast();
    }

    /**
     * Mark the milestone as completed.
     */
    public function markAsCompleted(): bool
    {
        $this->is_completed = true;
        $this->completed_at = now();
        return $this->save();
    }

    /**
     * Update progress percentage.
     */
    public function updateProgress(int $percentage): bool
    {
        $this->progress_percentage = max(0, min(100, $percentage));
        return $this->save();
    }

    /**
     * Get the attachments for the timeline event.
     */
    public function attachments()
    {
        return $this->hasMany(TimelineEventAttachment::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}