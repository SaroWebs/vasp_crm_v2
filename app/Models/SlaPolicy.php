<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class SlaPolicy extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'name',
        'description',
        'task_type_id',
        'priority',
        'response_time_minutes',
        'resolution_time_minutes',
        'review_time_minutes',
        'escalation_steps',
        'is_active',
    ];

    protected $casts = [
        'response_time_minutes' => 'integer',
        'resolution_time_minutes' => 'integer',
        'review_time_minutes' => 'integer',
        'escalation_steps' => 'array',
        'is_active' => 'boolean',
    ];

    /**
     * Get the tasks for this SLA policy.
     */
    public function tasks()
    {
        return $this->hasMany(Task::class, 'sla_policy_id');
    }

    /**
     * Get the task type for this SLA policy.
     */
    public function taskType()
    {
        return $this->belongsTo(TaskType::class, 'task_type_id');
    }
}
