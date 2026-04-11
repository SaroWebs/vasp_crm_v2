<?php

namespace App\Models;

use App\Services\TimeCalculatorService;
use App\Services\WorkingHoursService;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Carbon;

class TaskTimeEntry extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'task_id',
        'user_id',
        'start_time',
        'end_time',
        'description',
        'is_active',
        'metadata',
    ];

    /**
     * The attributes that should be cast.
     */
    protected function casts(): array
    {
        return [
            'start_time' => 'datetime',
            'end_time' => 'datetime',
            'is_active' => 'boolean',
            'metadata' => 'array',
        ];
    }

    /**
     * The task this time entry belongs to.
     */
    public function task(): BelongsTo
    {
        return $this->belongsTo(Task::class);
    }

    /**
     * The user who created this time entry.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    /**
     * Query scope for active time entries.
     */
    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }

    /**
     * Query scope for time entries by user.
     */
    public function scopeForUser(Builder $query, int $userId): Builder
    {
        return $query->where('user_id', $userId);
    }

    /**
     * Query scope for time entries by task.
     */
    public function scopeForTask(Builder $query, int $taskId): Builder
    {
        return $query->where('task_id', $taskId);
    }

    /**
     * Query scope for time entries by date.
     */
    public function scopeForDate(Builder $query, string $date): Builder
    {
        return $query->whereDate('start_time', $date);
    }

    /**
     * Calculate the duration in seconds for this time entry.
     */
    public function calculateDuration(): float
    {
        if (! $this->start_time) {
            return 0;
        }

        $endTime = $this->end_time ?? now();

        // Use time calculator service to calculate working duration
        $timeCalculator = app(TimeCalculatorService::class);

        return $timeCalculator->calculateWorkingDuration($this->start_time, $endTime);
    }

    /**
     * Calculate duration in seconds that falls within a specific report date.
     * This clips the time entry to the report date boundaries (start/end of day),
     * and then calculates only the working-time duration for that clipped window.
     */
    public function calculateDurationForDate(string $reportDate, ?Carbon $effectiveEndTime = null): int
    {
        if (! $this->start_time) {
            return 0;
        }

        $start = Carbon::parse($this->start_time);
        $endTime = $this->end_time ?? $effectiveEndTime;

        if (! $endTime) {
            return 0;
        }

        $end = Carbon::parse($endTime);
        $reportDateObj = Carbon::parse($reportDate)->startOfDay();
        $reportDateEnd = Carbon::parse($reportDate)->endOfDay();

        $clippedStart = $start->lt($reportDateObj) ? $reportDateObj->copy() : $start;
        $clippedEnd = $end->gt($reportDateEnd) ? $reportDateEnd->copy() : $end;

        // Return 0 if start >= end after clipping
        if ($clippedStart->gte($clippedEnd)) {
            return 0;
        }

        $timeCalculator = app(TimeCalculatorService::class);
        $durationSeconds = $timeCalculator->calculateWorkingDuration($clippedStart, $clippedEnd);

        return (int) round($durationSeconds);
    }

    /**
     * Get duration in hours (for backward compatibility).
     */
    public function getDurationHoursAttribute(): float
    {
        return $this->calculateDuration() / 3600;
    }

    /**
     * Start a new time entry.
     *
     * @throws \Exception If trying to start outside working hours
     */
    public static function start(Task $task, int $userId, ?string $description = null): self
    {
        // Get working hours service to check if current time is working time
        $workingHoursService = app(WorkingHoursService::class);
        $now = now();

        if (! $workingHoursService->isWorkingTime($now)) {
            throw new \Exception('Cannot start time entry outside working hours');
        }

        return static::create([
            'task_id' => $task->id,
            'user_id' => $userId,
            'start_time' => $now,
            'end_time' => null,
            'description' => $description,
            'is_active' => true,
        ]);
    }

    /**
     * End an active time entry.
     */
    public function end(): bool
    {
        if (! $this->is_active) {
            return false;
        }
        $now = now();
        $this->end_time = $now;
        $this->is_active = false;

        return $this->save();
    }

    /**
     * Get the total time spent on a task.
     */
    public static function getTotalTimeForTask(Task $task): float
    {
        $timeEntries = static::forTask($task->id)
            ->where('is_active', false)
            ->get();

        $totalHours = 0;
        foreach ($timeEntries as $entry) {
            $totalHours += $entry->calculateDuration();
        }

        return $totalHours;
    }

    /**
     * Get the active time entry for a task and user.
     */
    public static function getActiveEntry(Task $task, int $userId): ?self
    {
        return static::forTask($task->id)
            ->forUser($userId)
            ->where('is_active', true)
            ->first();
    }

    /**
     * Get all time entries for a task.
     */
    public static function getTimeEntriesForTask(Task $task)
    {
        return static::forTask($task->id)
            ->with('user:id,name')
            ->orderBy('start_time', 'desc')
            ->get();
    }

    /**
     * Get time entries for employees with date filtering.
     */
    public static function getEmployeeTimeEntries($date = null, $fromDate = null, $toDate = null)
    {
        $query = static::query()
            ->with(['user', 'task'])
            ->where('is_active', false); // Only completed entries

        // Apply date filters
        if ($date) {
            $query->forDate($date);
        } elseif ($fromDate && $toDate) {
            $query->whereBetween('start_time', [$fromDate, $toDate]);
        }

        return $query->get();
    }

    /**
     * Calculate total time spent by an employee.
     */
    public static function getTotalTimeForEmployee($userId, $date = null, $fromDate = null, $toDate = null)
    {
        $query = static::forUser($userId)
            ->where('is_active', false);

        // Apply date filters
        if ($date) {
            $query->forDate($date);
        } elseif ($fromDate && $toDate) {
            $query->whereBetween('start_time', [$fromDate, $toDate]);
        }

        $timeEntries = $query->get();
        $totalSeconds = 0;

        foreach ($timeEntries as $entry) {
            $totalSeconds += $entry->calculateDuration();
        }

        return $totalSeconds;
    }

    /**
     * Get tasks completed by an employee.
     */
    public static function getTasksCompletedByEmployee($userId, $date = null, $fromDate = null, $toDate = null)
    {
        $query = static::forUser($userId)
            ->where('is_active', false)
            ->distinct('task_id');

        // Apply date filters
        if ($date) {
            $query->forDate($date);
        } elseif ($fromDate && $toDate) {
            $query->whereBetween('start_time', [$fromDate, $toDate]);
        }

        return $query->count();
    }

    /**
     * Get time entries for a specific task and date.
     */
    public static function getTaskTimeEntriesForDate($taskId, $date)
    {
        return static::forTask($taskId)
            ->where('is_active', false)
            ->forDate($date)
            ->get();
    }

    /**
     * Get total time spent on a task for a specific date.
     */
    public static function getTotalTimeForTaskOnDate($taskId, $date)
    {
        $timeEntries = static::forTask($taskId)
            ->where('is_active', false)
            ->forDate($date)
            ->get();

        $totalSeconds = 0;

        foreach ($timeEntries as $entry) {
            $totalSeconds += $entry->calculateDuration();
        }

        return $totalSeconds;
    }
}
