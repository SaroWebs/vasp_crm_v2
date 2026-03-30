<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\HasMany;

class TaskComment extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'task_id',
        'comment_text',
        'commented_by_type',
        'commented_by_id',
        'is_internal',
        'deleted_by',
    ];

    protected $casts = [
        'is_internal' => 'boolean',
    ];

    // public function attachments(): HasMany
    // {
    //     return $this->hasMany(TaskCommentAttachment::class, 'comment_id');
    // }
    public function attachments()
    {
        return $this->morphMany(TaskCommentAttachment::class, 'comment');
    }

    /**
     * Get the task that owns the comment.
     */
    public function task()
    {
        return $this->belongsTo(Task::class);
    }

    /**
     * Get the user who made the comment (if commented_by_type is 'user').
     */
    public function user()
    {
        return $this->belongsTo(User::class, 'commented_by_id');
    }

    /**
     * Get the organization user who made the comment (if commented_by_type is 'organization_user').
     */
    public function organizationUser()
    {
        return $this->belongsTo(OrganizationUser::class, 'commented_by_id');
    }

    /**
     * Get the commenter (user or organization user) based on commented_by_type.
     */
    public function getCommenterAttribute()
    {
        if ($this->commented_by_type === 'user') {
            return $this->user;
        }
        return $this->organizationUser;
    }

    /**
     * Get the user who deleted this comment.
     */
    public function deletedByUser()
    {
        return $this->belongsTo(User::class, 'deleted_by');
    }
}
