<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class TicketComment extends Model
{
    use SoftDeletes;
    protected $fillable = [
        'ticket_id',
        'comment_text',
        'commented_by_type',
        'commented_by',
        'is_internal',
        'deleted_by',
    ];

    protected $casts = [
        'is_internal' => 'boolean',
    ];

    /**
     * Get the attachments for the comment.
     */
    public function attachments(): HasMany
    {
        return $this->hasMany(CommentAttachment::class, 'comment_id');
    }

    /**
     * Get the ticket that owns the comment.
     */
    public function ticket(): BelongsTo
    {
        return $this->belongsTo(Ticket::class);
    }

    /**
     * Get the user who made the comment (if commented_by_type is 'user').
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'commented_by');
    }

    /**
     * Get the organization user who made the comment (if commented_by_type is 'organization_user').
     */
    public function organizationUser(): BelongsTo
    {
        return $this->belongsTo(OrganizationUser::class, 'commented_by');
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
    public function deletedByUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'deleted_by');
    }
}
