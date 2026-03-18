<?php

namespace App\Models;

use Illuminate\Support\Facades\Auth;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class TaskAuditEvent extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'task_id',
        'occurred_at',
        'actor_user_id',
        'action',
        'from_state',
        'to_state',
        'from_owner_kind',
        'from_owner_id',
        'to_owner_kind',
        'to_owner_id',
        'sla_snapshot',
        'reason',
        'metadata',
    ];

    protected $casts = [
        'occurred_at' => 'datetime',
        'sla_snapshot' => 'array',
        'metadata' => 'array',
    ];

    /**
     * Get the task that owns the audit event.
     */
    public function task()
    {
        return $this->belongsTo(Task::class);
    }

    /**
     * Get the user who performed the action.
     */
    public function actorUser()
    {
        return $this->belongsTo(User::class, 'actor_user_id');
    }

    /**
     * Scope to filter by action.
     */
    public function scopeAction($query, $action)
    {
        return $query->where('action', $action);
    }

    /**
     * Scope to filter by actor user.
     */
    public function scopeActorUser($query, $userId)
    {
        return $query->where('actor_user_id', $userId);
    }

    /**
     * Scope to filter by date range.
     */
    public function scopeDateRange($query, $startDate, $endDate)
    {
        return $query->whereBetween('occurred_at', [$startDate, $endDate]);
    }

    /**
     * Create a new audit event.
     */
    public static function createEvent($taskId, $action, $fromState = null, $toState = null, $fromOwnerKind = null, $fromOwnerId = null, $toOwnerKind = null, $toOwnerId = null, $slaSnapshot = null, $reason = null, $metadata = null, $actorUserId = null)
    {
        if(!$actorUserId){
            $actorUserId = Auth::id();
        }
        
        return self::create([
            'task_id' => $taskId,
            'occurred_at' => now(),
            'actor_user_id' => $actorUserId,
            'action' => $action,
            'from_state' => $fromState,
            'to_state' => $toState,
            'from_owner_kind' => $fromOwnerKind,
            'from_owner_id' => $fromOwnerId,
            'to_owner_kind' => $toOwnerKind,
            'to_owner_id' => $toOwnerId,
            'sla_snapshot' => $slaSnapshot,
            'reason' => $reason,
            'metadata' => $metadata,
        ]);
    }

    /**
     * Get human-readable event description.
     */
    public function getDescriptionAttribute()
    {
        $descriptions = [
            'ASSIGN' => 'Task assigned',
            'REASSIGN' => 'Task reassigned',
            'STATE_CHANGE' => 'State changed',
            'PRIORITY_CHANGE' => 'Priority changed',
            'DUE_DATE_CHANGE' => 'Due date changed',
            'COMPLETE' => 'Task completed',
            'REOPEN' => 'Task reopened',
            'CANCEL' => 'Task cancelled',
            'DELETE' => 'Task deleted',
            'RESTORE' => 'Task restored',
            'COMMENT_ADD' => 'Comment added',
            'COMMENT_DELETE' => 'Comment deleted',
            'ATTACHMENT_ADD' => 'Attachment added',
            'ATTACHMENT_DELETE' => 'Attachment deleted',
            'FORWARD' => 'Task forwarded',
            'PROGRESS_UPDATE' => 'Progress updated',
        ];

        return $descriptions[$this->action] ?? ucfirst(str_replace('_', ' ', $this->action));
    }
}
