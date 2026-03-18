<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class WorkloadMetric extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'user_id',
        'metric_type',
        'metric_value',
        'metric_unit',
        'period_start',
        'period_end',
        'calculated_at',
        'metadata',
    ];

    protected $casts = [
        'metric_value' => 'float',
        'period_start' => 'datetime',
        'period_end' => 'datetime',
        'calculated_at' => 'datetime',
        'metadata' => 'array',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];

    /**
     * Get the user that owns the metric.
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }


    /**
     * Scope to filter by user.
     */
    public function scopeUser($query, $userId)
    {
        return $query->where('user_id', $userId);
    }

    /**
     * Scope to filter by metric type.
     */
    public function scopeMetricType($query, $metricType)
    {
        return $query->where('metric_type', $metricType);
    }

    /**
     * Scope to filter by period.
     */
    public function scopePeriod($query, $startDate, $endDate)
    {
        return $query->whereBetween('period_start', [$startDate, $endDate]);
    }

    /**
     * Create a new workload metric.
     */
    public static function createMetric($userId, $metricType, $metricValue, $metricUnit, $periodStart, $periodEnd, $metadata = [])
    {
        return self::create([
            'user_id' => $userId,
            'metric_type' => $metricType,
            'metric_value' => $metricValue,
            'metric_unit' => $metricUnit,
            'period_start' => $periodStart,
            'period_end' => $periodEnd,
            'calculated_at' => now(),
            'metadata' => $metadata,
        ]);
    }

    /**
     * Get workload metrics for a user.
     */
    public static function getUserMetrics($userId, $periodStart, $periodEnd)
    {
        return self::where('user_id', $userId)
            ->whereBetween('period_start', [$periodStart, $periodEnd])
            ->get();
    }

    /**
     * Calculate average workload for a user.
     */
    public static function calculateAverageWorkload($userId, $periodStart, $periodEnd)
    {
        return self::where('user_id', $userId)
            ->where('metric_type', 'workload')
            ->whereBetween('period_start', [$periodStart, $periodEnd])
            ->avg('metric_value');
    }

    /**
     * Calculate total tasks completed by a user.
     */
    public static function calculateTotalTasksCompleted($userId, $periodStart, $periodEnd)
    {
        return self::where('user_id', $userId)
            ->where('metric_type', 'tasks_completed')
            ->whereBetween('period_start', [$periodStart, $periodEnd])
            ->sum('metric_value');
    }

    /**
     * Calculate average task completion time for a user.
     */
    public static function calculateAverageCompletionTime($userId, $periodStart, $periodEnd)
    {
        return self::where('user_id', $userId)
            ->where('metric_type', 'avg_completion_time')
            ->whereBetween('period_start', [$periodStart, $periodEnd])
            ->avg('metric_value');
    }

    /**
     * Calculate productivity score for a user.
     */
    public static function calculateProductivityScore($userId, $periodStart, $periodEnd)
    {
        $workload = self::calculateAverageWorkload($userId, $periodStart, $periodEnd) ?? 0;
        $tasksCompleted = self::calculateTotalTasksCompleted($userId, $periodStart, $periodEnd) ?? 0;
        $avgCompletionTime = self::calculateAverageCompletionTime($userId, $periodStart, $periodEnd) ?? 0;

        // Simple productivity calculation
        $productivity = ($tasksCompleted * 10) - ($avgCompletionTime / 60); // Adjust as needed
        
        return max(0, min(100, $productivity)); // Clamp between 0-100
    }
}
