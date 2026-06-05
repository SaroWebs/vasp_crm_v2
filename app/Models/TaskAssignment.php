<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class TaskAssignment extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'task_id',
        'user_id',
        'assigned_at',
        'assigned_by',
        'parent_assignment_id',
        'assignment_notes',
        'is_active',
        'accepted_at',
        'completed_at',
        'unassigned_by',
        'unassigned_at',
        'metadata',
        'estimated_time',
        'state',
    ];

    /**
     * The attributes that should be cast.
     */
    protected function casts(): array
    {
        return [
            'assigned_at' => 'datetime',
            'accepted_at' => 'datetime',
            'completed_at' => 'datetime',
            'unassigned_at' => 'datetime',
            'metadata' => 'array',
            'is_active' => 'boolean',
            'estimated_time' => 'decimal:2',
        ];
    }

    /**
     * Get the task that this assignment belongs to.
     */
    public function task(): BelongsTo
    {
        return $this->belongsTo(Task::class);
    }

    /**
     * Get the user who is assigned to this task.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the user who assigned this task.
     */
    public function assignedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_by');
    }

    /**
     * Get the assignment that delegated this assignment.
     */
    public function parentAssignment(): BelongsTo
    {
        return $this->belongsTo(TaskAssignment::class, 'parent_assignment_id');
    }

    /**
     * Get assignments delegated from this assignment.
     */
    public function childAssignments(): HasMany
    {
        return $this->hasMany(TaskAssignment::class, 'parent_assignment_id');
    }

    /**
     * Get active assignments delegated from this assignment.
     */
    public function activeChildAssignments(): HasMany
    {
        return $this->hasMany(TaskAssignment::class, 'parent_assignment_id')
            ->where('is_active', true);
    }

    /**
     * Get the user who removed this assignment.
     */
    public function unassignedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'unassigned_by');
    }

    /**
     * Collect every active descendant assignment under this assignment.
     */
    public function collectActiveDescendants(): Collection
    {
        $descendants = new Collection;

        $this->loadMissing('activeChildAssignments');

        foreach ($this->activeChildAssignments as $childAssignment) {
            $descendants->push($childAssignment);
            $descendants = $descendants->merge($childAssignment->collectActiveDescendants());
        }

        return $descendants;
    }

    /**
     * Scope to filter by active assignments.
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope to filter by task.
     */
    public function scopeByTask($query, $taskId)
    {
        return $query->where('task_id', $taskId);
    }

    /**
     * Scope to filter by user.
     */
    public function scopeByUser($query, $userId)
    {
        return $query->where('user_id', $userId);
    }

    /**
     * Scope to filter by assignment type.
     */
    public function scopeByType($query, $type)
    {
        return $query->where('assignment_type', $type);
    }

    /**
     * Mark assignment as accepted.
     */
    public function markAsAccepted()
    {
        $this->update([
            'accepted_at' => now(),
            'is_active' => true,
        ]);
    }

    /**
     * Mark assignment as completed.
     */
    public function markAsCompleted()
    {
        $this->update([
            'completed_at' => now(),
            'is_active' => false,
        ]);
    }

    /**
     * Deactivate assignment.
     */
    public function deactivate()
    {
        $this->update([
            'is_active' => false,
            'unassigned_at' => now(),
        ]);
    }

    /**
     * Reactivate assignment.
     */
    public function reactivate()
    {
        $this->update([
            'is_active' => true,
            'unassigned_by' => null,
            'unassigned_at' => null,
        ]);
    }
}
