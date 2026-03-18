<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TaskHistory extends Model
{
    protected $fillable = [
        'task_id',
        'old_status',
        'new_status',
        'changed_by',
    ];

    /**
     * Get the task that owns the history record.
     */
    public function task()
    {
        return $this->belongsTo(Task::class);
    }

    /**
     * Get the user who changed the status.
     */
    public function changedBy()
    {
        return $this->belongsTo(User::class, 'changed_by');
    }

    /**
     * Alias for changedBy for consistency with frontend.
     */
    public function changedByUser()
    {
        return $this->belongsTo(User::class, 'changed_by');
    }
}
