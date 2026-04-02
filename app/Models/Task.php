<?php

namespace App\Models;

use App\Services\DueDateCalculatorService;
use App\Services\TimeCalculatorService;
// Add WorkloadMetric import for the relationship
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Task extends Model
{
    use HasFactory, SoftDeletes;

    protected $appends = [
        'overdue_time',
        'is_overdue',
    ];

    protected $fillable = [
        'task_code',
        'title',
        'description',
        'task_type_id',
        'sla_policy_id',
        'project_id',
        'phase_id',
        'department_id',
        'current_owner_kind',
        'current_owner_id',
        'state',
        'start_at',
        'due_at',
        'completed_at',
        'estimate_hours',
        'tags',
        'version',
        'metadata',
        'parent_task_id',
        'ticket_id',
        'created_by',
        'completion_notes',
    ];

    /**
     * Valid state transitions for tasks.
     */
    protected static $validStateTransitions = [
        'Draft' => ['Assigned', 'InProgress', 'Cancelled'],
        'Assigned' => ['InProgress', 'Blocked', 'Cancelled', 'Rejected', 'Done'],
        'InProgress' => ['Blocked', 'InReview', 'Done', 'Cancelled'],
        'Blocked' => ['InProgress', 'Cancelled'],
        'InReview' => ['Done', 'InProgress', 'Rejected', 'Cancelled'],
        'Done' => [],
        'Cancelled' => [],
        'Rejected' => ['InProgress', 'Cancelled'],
    ];

    /**
     * The attributes that should be cast.
     */
    protected function casts(): array
    {
        return [
            'start_at' => 'datetime',
            'due_at' => 'datetime',
            'completed_at' => 'datetime',
            'estimate_hours' => 'decimal:2',
            'tags' => 'array',
            'metadata' => 'array',
        ];
    }

    /**
     * Validate state transition.
     */
    public function isValidStateTransition($newState): bool
    {
        if ($this->state === $newState) {
            return true;
        }

        return isset(static::$validStateTransitions[$this->state]) &&
               in_array($newState, static::$validStateTransitions[$this->state]);
    }

    /**
     * Boot method to add validation.
     */
    protected static function boot()
    {
        parent::boot();

        static::updating(function ($task) {
            if (isset($task->attributes['state']) && $task->attributes['state'] !== $task->getOriginal('state')) {
                $newState = $task->attributes['state'];
                if (! $task->isValidStateTransition($newState)) {
                    throw new \InvalidArgumentException(
                        "Invalid state transition from '{$task->getOriginal('state')}' to '{$newState}'"
                    );
                }

                // Set completed_at when transitioning to a terminal state
                $terminalStates = ['Done', 'Cancelled', 'Rejected'];
                if (in_array($newState, $terminalStates) && ! $task->getOriginal('completed_at')) {
                    $task->attributes['completed_at'] = now();
                }

                // Clear completed_at if transitioning away from a terminal state
                if (in_array($task->getOriginal('state'), $terminalStates) && ! in_array($newState, $terminalStates)) {
                    $task->attributes['completed_at'] = null;
                }

                // Auto-update ticket status when task state changes
                if ($task->ticket_id) {
                    $ticket = Ticket::find($task->ticket_id);
                    if ($ticket) {
                        // If any task goes to InProgress, update ticket to in-progress
                        if ($newState === 'InProgress' && ! in_array($ticket->status, ['closed', 'cancelled'])) {
                            $ticket->update(['status' => 'in-progress']);
                        }

                        // Check if all tasks are done/cancelled/rejected, then update ticket status
                        $allTasks = $ticket->tasks()->get();
                        $completedStates = ['Done', 'Cancelled', 'Rejected'];
                        $incompleteTasks = $allTasks->filter(function ($t) use ($completedStates, $newState, $task) {
                            // Exclude the current task being updated
                            if ($t->id === $task->id) {
                                return ! in_array($newState, $completedStates);
                            }

                            return ! in_array($t->state, $completedStates);
                        });
                    }
                }
            }
        });
    }

    /**
     * The user who created the task.
     */
    public function createdBy()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * The department assigned to the task.
     */
    public function assignedDepartment()
    {
        return $this->belongsTo(Department::class, 'assigned_department_id');
    }

    /**
     * The parent task.
     */
    public function parentTask()
    {
        return $this->belongsTo(Task::class, 'parent_task_id');
    }

    /**
     * The child tasks.
     */
    public function childTasks()
    {
        return $this->hasMany(Task::class, 'parent_task_id');
    }

    /**
     * The ticket associated with this task.
     */
    public function ticket()
    {
        return $this->belongsTo(Ticket::class, 'ticket_id');
    }

    /**
     * The project associated with this task.
     */
    public function project()
    {
        return $this->belongsTo(Project::class, 'project_id');
    }

    /**
     * The project phase associated with this task.
     */
    public function projectPhase()
    {
        return $this->belongsTo(ProjectPhase::class, 'phase_id');
    }

    /**
     * Get the task comments.
     */
    public function comments()
    {
        return $this->hasMany(TaskComment::class);
    }

    /**
     * Get the task attachments.
     */
    public function attachments()
    {
        return $this->hasMany(TaskAttachment::class);
    }

    /**
     * Get the task forwarding history.
     */
    public function forwardings()
    {
        return $this->hasMany(TaskForwarding::class);
    }

    /**
     * Get the task type.
     */
    public function taskType()
    {
        return $this->belongsTo(TaskType::class, 'task_type_id');
    }

    /**
     * Get the SLA policy.
     */
    public function slaPolicy()
    {
        return $this->belongsTo(SlaPolicy::class, 'sla_policy_id');
    }

    /**
     * Get the task history.
     */
    public function history()
    {
        return $this->hasMany(TaskHistory::class);
    }

    /**
     * Get the task audit events.
     */
    public function auditEvents()
    {
        return $this->hasMany(TaskAuditEvent::class);
    }

    /**
     * Get the task time entries.
     */
    public function timeEntries()
    {
        return $this->hasMany(TaskTimeEntry::class);
    }

    /**
     * Get workload metrics for the assigned user.
     */
    public function workloadMetrics()
    {
        return $this->hasManyThrough(
            WorkloadMetric::class,
            User::class,
            'id', // Foreign key on users table
            'user_id', // Foreign key on workload_metrics table
            'id' // Local key on users table
        );
    }

    /**
     * Get the user skills.
     */
    public function userSkills()
    {
        return $this->hasMany(UserSkill::class);
    }

    /**
     * Get all task assignments for this task.
     */
    public function taskAssignments()
    {
        return $this->hasMany(TaskAssignment::class);
    }

    /**
     * Get active task assignments for this task.
     */
    public function activeTaskAssignments()
    {
        return $this->hasMany(TaskAssignment::class)->where('is_active', true);
    }

    /**
     * Get all users assigned to this task.
     */
    public function assignedUsers()
    {
        return $this->belongsToMany(User::class, 'task_assignments', 'task_id', 'user_id')
            ->withPivot('assigned_at', 'assigned_by', 'assignment_notes', 'is_active', 'accepted_at', 'completed_at', 'metadata')
            ->wherePivot('is_active', true)
            ->withTimestamps();
    }

    /**
     * Get all employees assigned to this task.
     * Use this scope to get employees through assigned users.
     */
    public function scopeWithEmployees($query)
    {
        return $query->with(['assignedUsers.employee']);
    }

    /**
     * Assign a user to this task.
     *
     * @param  int  $userId
     * @param  int|null  $assignedBy
     * @param  string|null  $notes
     * @param  array|null  $metadata
     * @param  float|null  $estimatedTime
     * @return TaskAssignment
     */
    public function assignUser($userId, $assignedBy = null, $notes = null, $metadata = null, $estimatedTime = null)
    {
        $assignedById = $assignedBy ?? (app('auth')->check() ? app('auth')->user()->id : null);

        return $this->taskAssignments()->create([
            'user_id' => $userId,
            'assigned_by' => $assignedById,
            'assignment_notes' => $notes,
            'metadata' => $metadata ?? [],
            'estimated_time' => $estimatedTime,
            'assigned_at' => now(),
            'is_active' => true,
            'state' => 'pending',
        ]);
    }

    /**
     * Unassign a user from this task.
     *
     * @param  int  $userId
     * @return bool
     */
    public function unassignUser($userId)
    {
        return $this->taskAssignments()
            ->where('user_id', $userId)
            ->delete() > 0;
    }

    /**
     * Check if a user is assigned to this task.
     *
     * @param  int  $userId
     * @return bool
     */
    public function isAssignedToUser($userId)
    {
        return $this->taskAssignments()
            ->where('user_id', $userId)
            ->where('is_active', true)
            ->exists();
    }

    /**
     * Get the primary assignee (first active assignment).
     *
     * @return User|null
     */
    public function getPrimaryAssignee()
    {
        $assignment = $this->activeTaskAssignments()->oldest('created_at')->first();

        return $assignment ? $assignment->user : null;
    }

    /**
     * Get all active assignments for this task.
     *
     * @return Collection
     */
    public function getActiveAssignments()
    {
        return $this->activeTaskAssignments()->with(['user:id,name,email'])->get();
    }

    /**
     * Get assignment statistics for this task.
     *
     * @return array
     */
    public function getAssignmentStats()
    {
        return [
            'total' => $this->taskAssignments()->count(),
            'active' => $this->activeTaskAssignments()->count(),
            'completed' => $this->taskAssignments()->where('state', 'completed')->count(),
            'pending' => $this->taskAssignments()->where('state', 'pending')->count(),
            'in_progress' => $this->taskAssignments()->where('state', 'in_progress')->count(),
        ];
    }

    /**
     * Assign the current user to this task (self-assignment).
     *
     * @param  string|null  $notes
     * @param  array|null  $metadata
     * @param  float|null  $estimatedTime
     * @return TaskAssignment
     */
    public function selfAssign($notes = null, $metadata = null, $estimatedTime = null)
    {
        $userId = app('auth')->check() ? app('auth')->user()->id : null;

        return $this->assignUser($userId, $userId, $notes, $metadata, $estimatedTime);
    }

    /**
     * Get the timeline events for the task.
     */
    public function timelineEvents()
    {
        return $this->hasMany(TimelineEvent::class);
    }

    /**
     * Get the task dependencies.
     */
    public function dependencies()
    {
        return $this->hasMany(TaskDependency::class);
    }

    /**
     * Get the reports that include this task.
     */
    public function reports()
    {
        return $this->belongsToMany(Report::class, 'report_tasks')
            ->withTimestamps();
    }

    /**
     * Get the tasks that depend on this task.
     */
    public function dependentTasks()
    {
        return $this->hasMany(TaskDependency::class, 'depends_on_task_id');
    }

    /**
     * Scope to filter by status.
     */
    public function scopeStatus($query, $status)
    {
        return $query->where('state', $status);
    }

    /**
     * Scope to filter by department.
     */
    public function scopeDepartment($query, $departmentId)
    {
        return $query->where('assigned_department_id', $departmentId);
    }

    /**
     * Scope to filter by task type.
     */
    public function scopeTaskType($query, $taskTypeId)
    {
        return $query->where('task_type_id', $taskTypeId);
    }

    /**
     * Scope to filter by SLA policy.
     */
    public function scopeSlaPolicy($query, $slaPolicyId)
    {
        return $query->where('sla_policy_id', $slaPolicyId);
    }

    /**
     * Scope to filter by task type SLA policies.
     */
    public function scopeByTaskTypeSla($query, $taskTypeId)
    {
        return $query->whereHas('slaPolicy', function ($subquery) use ($taskTypeId) {
            $subquery->where('task_type_id', $taskTypeId);
        });
    }

    /**
     * Scope to filter by task type and priority SLA policies.
     */
    public function scopeByTaskTypeAndPrioritySla($query, $taskTypeId, $priority)
    {
        return $query->whereHas('slaPolicy', function ($subquery) use ($taskTypeId, $priority) {
            $subquery->where('task_type_id', $taskTypeId)
                ->where('priority', $priority);
        });
    }

    /**
     * Scope to filter by due date range.
     */
    public function scopeDueDateRange($query, $startDate, $endDate)
    {
        return $query->whereBetween('due_at', [$startDate, $endDate]);
    }

    /**
     * Get the task status (alias for state).
     */
    public function getStatusAttribute(): string
    {
        return $this->state;
    }

    /**
     * Scope to get overdue tasks.
     */
    public function scopeOverdue($query)
    {
        return $query->where('due_at', '<', now())
            ->where('state', '!=', 'Done');
    }

    /**
     * Scope to get tasks due today.
     */
    public function scopeDueToday($query)
    {
        return $query->whereDate('due_at', today())
            ->where('state', '!=', 'Done');
    }

    /**
     * Scope to get tasks due this week.
     */
    public function scopeDueThisWeek($query)
    {
        return $query->whereBetween('due_at', [now(), now()->addWeek()])
            ->where('state', '!=', 'Done');
    }

    /**
     * Scope to get tasks with high priority and overdue.
     */
    public function scopeHighPriorityOverdue($query)
    {
        return $query->whereHas('slaPolicy', function ($subquery) {
            $subquery->whereIn('priority', ['P1', 'P2']);
        })
            ->where('due_at', '<', now())
            ->where('state', '!=', 'Done');
    }

    /**
     * Get task's SLA status.
     */
    public function getSlaStatusAttribute()
    {
        if (! $this->due_at || in_array($this->state, ['Done', 'Cancelled', 'Rejected'])) {
            return 'not_applicable';
        }

        $daysUntilDue = now()->diffInDays($this->due_at, false);

        if ($this->due_at < now()) {
            return 'overdue';
        } elseif ($daysUntilDue <= 1) {
            return 'due_soon';
        } elseif ($daysUntilDue <= 3) {
            return 'due_within_3_days';
        } else {
            return 'on_track';
        }
    }

    /**
     * Check if task is overdue.
     */
    public function isOverdue(): bool
    {
        return $this->getOverdueTimeSeconds() !== null;
    }

    /**
     * Get the overdue time as a human-readable string.
     * Returns null if task is not overdue or has no due date.
     */
    public function getOverdueTime(): ?string
    {
        $overdueSeconds = $this->getOverdueTimeSeconds();

        if ($overdueSeconds === null || $overdueSeconds <= 0) {
            return null;
        }

        $days = intdiv($overdueSeconds, 86400);
        $hours = intdiv($overdueSeconds % 86400, 3600);
        $minutes = intdiv($overdueSeconds % 3600, 60);

        $parts = [];

        if ($days > 0) {
            $parts[] = $days.' day'.($days > 1 ? 's' : '');
        }
        if ($hours > 0) {
            $parts[] = $hours.' hour'.($hours > 1 ? 's' : '');
        }
        if ($minutes > 0 && $days === 0) {
            $parts[] = $minutes.' minute'.($minutes > 1 ? 's' : '');
        }

        return empty($parts) ? 'Just now' : implode(', ', $parts);
    }

    /**
     * Get the overdue time in seconds.
     * Returns null if task is not overdue or has no due date.
     */
    public function getOverdueTimeSeconds(): ?int
    {
        if (! $this->due_at || ! $this->due_at->isPast() || in_array($this->state, ['Done', 'Cancelled', 'Rejected'], true)) {
            return null;
        }

        $timeCalculator = app(TimeCalculatorService::class);
        $overdueSeconds = (int) round($timeCalculator->calculateWorkingDuration($this->due_at, now()));

        return $overdueSeconds > 0 ? $overdueSeconds : null;
    }

    /**
     * Accessor for the appended overdue_time attribute.
     */
    public function getOverdueTimeAttribute(): ?string
    {
        return $this->getOverdueTime();
    }

    /**
     * Accessor for the appended is_overdue attribute.
     */
    public function getIsOverdueAttribute(): bool
    {
        return $this->isOverdue();
    }

    /**
     * Get task completion percentage.
     */
    public function getCompletionPercentage()
    {
        if ($this->status === 'Done') {
            return 100;
        }

        return 0; // No progress field available
    }

    /**
     * Get estimated time remaining (in working hours).
     */
    public function getTimeRemaining()
    {
        if ($this->state === 'Done' || ! $this->estimate_hours) {
            return 0;
        }

        // Calculate total working time spent on task
        $totalWorkingSeconds = 0;
        foreach ($this->timeEntries as $entry) {
            if (! $entry->is_active) {
                $totalWorkingSeconds += $entry->calculateDuration();
            } elseif ($entry->start_time) {
                $timeCalculator = app(TimeCalculatorService::class);
                $totalWorkingSeconds += $timeCalculator->calculateWorkingDuration($entry->start_time, now());
            }
        }

        $totalWorkingHours = $totalWorkingSeconds / 3600;

        return max(0, $this->estimate_hours - $totalWorkingHours);
    }

    /**
     * Calculate due date based on estimate hours and start date
     */
    public function calculateDueDate(): ?\DateTime
    {
        if (! $this->estimate_hours || ! $this->start_at) {
            return null;
        }

        $dueDateCalculator = app(DueDateCalculatorService::class);

        return $dueDateCalculator->calculateDueDate($this->start_at, $this->estimate_hours);
    }

    /**
     * Calculate days required to complete the task
     */
    public function calculateDaysRequired(): float
    {
        $dueDateCalculator = app(DueDateCalculatorService::class);
        $remainingHours = $this->getTimeRemaining();

        return $dueDateCalculator->calculateDaysRequired($remainingHours);
    }

    /**
     * Get task urgency score based on SLA policy priority and due date.
     */
    public function getUrgencyScore()
    {
        $priorityScores = [
            'P1' => 4,
            'P2' => 3,
            'P3' => 2,
            'P4' => 1,
        ];

        $priorityScore = $priorityScores[$this->slaPolicy?->priority] ?? 1;

        if (! $this->due_at) {
            return $priorityScore;
        }

        $daysUntilDue = now()->diffInDays($this->due_at, false);

        if ($daysUntilDue < 0) {
            return $priorityScore + 5; // Overdue tasks get high urgency
        } elseif ($daysUntilDue === 0) {
            return $priorityScore + 3; // Due today
        } elseif ($daysUntilDue <= 2) {
            return $priorityScore + 2; // Due within 2 days
        } elseif ($daysUntilDue <= 5) {
            return $priorityScore + 1; // Due within 5 days
        }

        return $priorityScore;
    }

    /**
     * Get total working time spent on task (in hours).
     */
    public function getTotalWorkingTimeSpentAttribute()
    {
        $totalWorkingSeconds = 0;
        foreach ($this->timeEntries as $entry) {
            if (! $entry->is_active) {
                $totalWorkingSeconds += $entry->calculateDuration();
            } elseif ($entry->start_time) {
                $timeCalculator = app(TimeCalculatorService::class);
                $totalWorkingSeconds += $timeCalculator->calculateWorkingDuration($entry->start_time, now());
            }
        }

        return $totalWorkingSeconds / 3600;
    }

    /**
     * Get total working time spent on task in seconds.
     */
    public function getTotalWorkingTimeSpentSecondsAttribute()
    {
        $totalWorkingSeconds = 0;
        foreach ($this->timeEntries as $entry) {
            if (! $entry->is_active) {
                $totalWorkingSeconds += $entry->calculateDuration();
            } elseif ($entry->start_time) {
                $timeCalculator = app(TimeCalculatorService::class);
                $totalWorkingSeconds += $timeCalculator->calculateWorkingDuration($entry->start_time, now());
            }
        }

        return $totalWorkingSeconds;
    }

    /**
     * Get task summary for notifications.
     */
    public function getSummary()
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'task_code' => $this->task_code,
            'status' => $this->status,
            'task_type' => $this->taskType?->name,
            'priority' => $this->slaPolicy?->priority,
            'due_date' => $this->due_at,
            'assigned_department' => $this->assignedDepartment?->name,
            'sla_status' => $this->sla_status,
            'progress' => 0, // No progress field available
            'estimated_hours' => $this->estimate_hours,
            'actual_hours' => 0, // No actual_hours field available
            'urgency_score' => $this->getUrgencyScore(),
        ];
    }
}
