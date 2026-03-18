<?php

namespace App\Models;

use App\Models\Task;
use App\Models\User;
use App\Models\Department;
use Illuminate\Database\Eloquent\Model;

class TaskForwarding extends Model
{
    protected $fillable = [
        'task_id',
        'from_user_id',
        'from_department_id',
        'to_user_id',
        'to_department_id',
        'forwarded_by',
        'accepted_by',
        'rejected_by',
        'remarks',
        'reason',
        'notes',
        'rejection_reason',
        'status',
        'forwarded_at',
        'accepted_at',
        'rejected_at',
        'is_end_user',
    ];

    protected $casts = [
        'is_end_user' => 'boolean',
        'forwarded_at' => 'date',
        'accepted_at' => 'datetime',
        'rejected_at' => 'datetime',
    ];

    /**
     * Get the task that owns the forwarding.
     */
    public function task()
    {
        return $this->belongsTo(Task::class);
    }

    /**
     * Get the user who forwarded the task.
     */
    public function fromUser()
    {
        return $this->belongsTo(User::class, 'from_user_id');
    }

    /**
     * Get the user to whom the task was forwarded.
     */
    public function toUser()
    {
        return $this->belongsTo(User::class, 'to_user_id');
    }

    /**
     * Get the department to which the task was forwarded.
     */
    public function toDepartment()
    {
        return $this->belongsTo(Department::class, 'to_department_id');
    }

    /**
     * Get the department from which the task was forwarded.
     */
    public function fromDepartment()
    {
        return $this->belongsTo(Department::class, 'from_department_id');
    }

    /**
     * Get the user who forwarded the task.
     */
    public function forwardedBy()
    {
        return $this->belongsTo(User::class, 'forwarded_by');
    }

    /**
     * Get the user who accepted the forwarding.
     */
    public function acceptedBy()
    {
        return $this->belongsTo(User::class, 'accepted_by');
    }

    /**
     * Get the user who rejected the forwarding.
     */
    public function rejectedBy()
    {
        return $this->belongsTo(User::class, 'rejected_by');
    }
}
