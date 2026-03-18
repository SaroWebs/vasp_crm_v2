<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Report extends Model
{
    protected $fillable = [
        'user_id',
        'report_date',
        'title',
        'description',
        'total_hours',
        'status',
        'metadata'
    ];
    
    protected $casts = [
        'report_date' => 'date',
        'total_hours' => 'decimal:2',
        'metadata' => 'array'
    ];
    
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
    
    public function tasks(): BelongsToMany
    {
        return $this->belongsToMany(Task::class, 'report_tasks')
                    ->withPivot('remarks')
                    ->withTimestamps();
    }
    
    public function attachments(): HasMany
    {
        return $this->hasMany(ReportAttachment::class);
    }
    
    public function calculateTotalHours(): float
    {
        $totalSeconds = $this->tasks()->with(['timeEntries' => function($query) {
            $query->where('is_active', false)
                  ->where(function($q) {
                      $q->whereDate('start_time', $this->report_date)
                        ->orWhereDate('end_time', $this->report_date);
                  });
        }])->get()->flatMap(function($task) {
            return $task->timeEntries;
        })->reduce(function($sum, $timeEntry) {
            return $sum + $timeEntry->calculateDuration();
        }, 0);
        
        $this->total_hours = $totalSeconds / 3600;
        $this->save();
        
        return $this->total_hours;
    }
    
    public function getTasksWithDailyTimeAttribute()
    {
        return $this->tasks()->with(['timeEntries' => function($query) {
            $query->where('is_active', false)
                  ->where(function($q) {
                      $q->whereDate('start_time', $this->report_date)
                        ->orWhereDate('end_time', $this->report_date);
                  });
        }])->get()->map(function($task) {
            $dailySeconds = $task->timeEntries->reduce(function($sum, $timeEntry) {
                return $sum + $timeEntry->calculateDuration();
            }, 0);
            
            return [
                'task' => $task,
                'daily_time' => $dailySeconds / 3600
            ];
        });
    }
}
