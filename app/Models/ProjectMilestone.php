<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class ProjectMilestone extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'project_id',
        'name',
        'description',
        'target_date',
        'completed_date',
        'status',
        'type',
        'progress',
        'sort_order',
        'metadata',
    ];

    protected $casts = [
        'target_date' => 'date',
        'completed_date' => 'date',
        'metadata' => 'array',
    ];

    // Status constants
    const STATUS_PENDING = 'pending';
    const STATUS_IN_PROGRESS = 'in_progress';
    const STATUS_COMPLETED = 'completed';
    const STATUS_OVERDUE = 'overdue';

    // Type constants
    const TYPE_START = 'start';
    const TYPE_CHECKPOINT = 'checkpoint';
    const TYPE_DELIVERY = 'delivery';
    const TYPE_COMPLETION = 'completion';
    const TYPE_CUSTOM = 'custom';

    /**
     * Get the project that owns the milestone.
     */
    public function project()
    {
        return $this->belongsTo(Project::class);
    }

    // Scopes

    /**
     * Scope for pending milestones.
     */
    public function scopePending($query)
    {
        return $query->where('status', self::STATUS_PENDING);
    }

    /**
     * Scope for in-progress milestones.
     */
    public function scopeInProgress($query)
    {
        return $query->where('status', self::STATUS_IN_PROGRESS);
    }

    /**
     * Scope for completed milestones.
     */
    public function scopeCompleted($query)
    {
        return $query->where('status', self::STATUS_COMPLETED);
    }

    /**
     * Scope for overdue milestones.
     */
    public function scopeOverdue($query)
    {
        return $query->where('target_date', '<', now())
            ->where('status', '!=', self::STATUS_COMPLETED);
    }

    // Methods

    /**
     * Check if the milestone is overdue.
     */
    public function isOverdue(): bool
    {
        return $this->target_date->isPast() 
            && $this->status !== self::STATUS_COMPLETED;
    }

    /**
     * Mark the milestone as completed.
     */
    public function markAsCompleted(): void
    {
        $this->update([
            'status' => self::STATUS_COMPLETED,
            'completed_date' => now(),
            'progress' => 100,
        ]);
    }

    /**
     * Update status based on target date.
     */
    public function updateStatus(): void
    {
        if ($this->status === self::STATUS_COMPLETED) {
            return;
        }

        if ($this->isOverdue()) {
            $this->update(['status' => self::STATUS_OVERDUE]);
        }
    }

    /**
     * Get status options for forms.
     */
    public static function getStatusOptions(): array
    {
        return [
            self::STATUS_PENDING => 'Pending',
            self::STATUS_IN_PROGRESS => 'In Progress',
            self::STATUS_COMPLETED => 'Completed',
            self::STATUS_OVERDUE => 'Overdue',
        ];
    }

    /**
     * Get type options for forms.
     */
    public static function getTypeOptions(): array
    {
        return [
            self::TYPE_START => 'Start',
            self::TYPE_CHECKPOINT => 'Checkpoint',
            self::TYPE_DELIVERY => 'Delivery',
            self::TYPE_COMPLETION => 'Completion',
            self::TYPE_CUSTOM => 'Custom',
        ];
    }
}
