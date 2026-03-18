<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class TaskType extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'code',
        'name',
        'description',
        'default_priority',
        'requires_sla',
        'requires_project',
        'requires_department',
        'workflow_definition',
        'is_active',
    ];

    protected $casts = [
        'requires_sla' => 'boolean',
        'requires_project' => 'boolean',
        'requires_department' => 'boolean',
        'workflow_definition' => 'array',
        'is_active' => 'boolean',
    ];

    /**
     * Get the tasks for this task type.
     */
    public function tasks()
    {
        return $this->hasMany(Task::class, 'task_type_id');
    }
}
