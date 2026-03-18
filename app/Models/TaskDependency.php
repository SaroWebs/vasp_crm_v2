<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class TaskDependency extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'task_id',
        'depends_on_task_id',
        'dependency_type',
        'description',
        'metadata',
    ];

    protected $casts = [
        'metadata' => 'array',
    ];

    /**
     * Get the task that owns the dependency.
     */
    public function task()
    {
        return $this->belongsTo(Task::class);
    }

    /**
     * Get the task that this task depends on.
     */
    public function dependsOnTask()
    {
        return $this->belongsTo(Task::class, 'depends_on_task_id');
    }

    /**
     * Scope to filter by dependency type.
     */
    public function scopeDependencyType($query, $dependencyType)
    {
        return $query->where('dependency_type', $dependencyType);
    }
}