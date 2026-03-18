<?php

namespace App\Services;

use App\Models\ActivityLog;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Auth;

class ActivityLogService
{
    /**
     * Log a model creation.
     */
    public function logCreate(Model $model, array $properties = []): ActivityLog
    {
        return ActivityLog::logCreate($model, Auth::user(), $properties);
    }

    /**
     * Log a model update.
     */
    public function logUpdate(Model $model, array $oldData = [], array $newData = []): ActivityLog
    {
        $properties = [
            'old_data' => $oldData,
            'new_data' => $newData
        ];

        return ActivityLog::logUpdate($model, Auth::user(), $properties);
    }

    /**
     * Log a model deletion.
     */
    public function logDelete(Model $model, array $properties = []): ActivityLog
    {
        return ActivityLog::logDelete($model, Auth::user(), $properties);
    }

    /**
     * Log a custom action.
     */
    public function logAction(string $description, Model $subject = null, array $properties = [], string $logName = 'default'): ActivityLog
    {
        return ActivityLog::logAction($description, $subject, Auth::user(), $properties, $logName);
    }

    /**
     * Log user assignment to department.
     */
    public function logUserAssignment(Model $department, Model $user, array $roleIds = []): ActivityLog
    {
        return $this->logAction(
            'User assigned to department',
            $department,
            [
                'action' => 'assign_user',
                'user_id' => $user->id,
                'user_name' => $user->name,
                'role_ids' => $roleIds
            ],
            'department'
        );
    }

    /**
     * Log user removal from department.
     */
    public function logUserRemoval(Model $department, Model $user): ActivityLog
    {
        return $this->logAction(
            'User removed from department',
            $department,
            [
                'action' => 'remove_user',
                'user_id' => $user->id,
                'user_name' => $user->name
            ],
            'department'
        );
    }

    /**
     * Log task assignment.
     */
    public function logTaskAssignment(Model $task, Model $user = null, Model $department = null): ActivityLog
    {
        $description = 'Task assigned';
        $properties = ['action' => 'assign_task'];

        if ($user) {
            $description .= ' to user';
            $properties['assigned_to_user_id'] = $user->id;
            $properties['assigned_to_user_name'] = $user->name;
        }

        if ($department) {
            $description .= ' to department';
            $properties['assigned_to_department_id'] = $department->id;
            $properties['assigned_to_department_name'] = $department->name;
        }

        return $this->logAction($description, $task, $properties, 'task');
    }

    /**
     * Log task status change.
     */
    public function logTaskStatusChange(Model $task, string $oldStatus, string $newStatus): ActivityLog
    {
        return $this->logAction(
            "Task status changed from {$oldStatus} to {$newStatus}",
            $task,
            [
                'action' => 'status_change',
                'old_status' => $oldStatus,
                'new_status' => $newStatus
            ],
            'task'
        );
    }

    /**
     * Log task forwarding.
     */
    public function logTaskForwarding(Model $task, Model $fromDepartment, Model $toDepartment): ActivityLog
    {
        return $this->logAction(
            'Task forwarded from department to department',
            $task,
            [
                'action' => 'forward_task',
                'from_department_id' => $fromDepartment->id,
                'from_department_name' => $fromDepartment->name,
                'to_department_id' => $toDepartment->id,
                'to_department_name' => $toDepartment->name
            ],
            'task'
        );
    }

    /**
     * Log task forwarding acceptance.
     */
    public function logTaskForwardingAcceptance(Model $task, Model $department, Model $user): ActivityLog
    {
        return $this->logAction(
            'Task forwarding accepted',
            $task,
            [
                'action' => 'accept_forwarding',
                'department_id' => $department->id,
                'department_name' => $department->name,
                'accepted_by_user_id' => $user->id,
                'accepted_by_user_name' => $user->name
            ],
            'task'
        );
    }

    /**
     * Log task forwarding rejection.
     */
    public function logTaskForwardingRejection(Model $task, Model $department, Model $user, string $reason): ActivityLog
    {
        return $this->logAction(
            'Task forwarding rejected',
            $task,
            [
                'action' => 'reject_forwarding',
                'department_id' => $department->id,
                'department_name' => $department->name,
                'rejected_by_user_id' => $user->id,
                'rejected_by_user_name' => $user->name,
                'rejection_reason' => $reason
            ],
            'task'
        );
    }

    /**
     * Log comment creation.
     */
    public function logCommentCreation(Model $comment): ActivityLog
    {
        return $this->logAction(
            'Comment created',
            $comment->task,
            [
                'action' => 'create_comment',
                'comment_id' => $comment->id,
                'comment_text' => substr($comment->comment_text, 0, 100) . '...',
                'commented_by_type' => $comment->commented_by_type,
                'commented_by_id' => $comment->commented_by
            ],
            'comment'
        );
    }

    /**
     * Log comment deletion.
     */
    public function logCommentDeletion(Model $comment): ActivityLog
    {
        return $this->logAction(
            'Comment deleted',
            $comment->task,
            [
                'action' => 'delete_comment',
                'comment_id' => $comment->id,
                'comment_text' => substr($comment->comment_text, 0, 100) . '...',
                'commented_by_type' => $comment->commented_by_type,
                'commented_by_id' => $comment->commented_by
            ],
            'comment'
        );
    }

    /**
     * Get activity logs for a specific model.
     */
    public function getModelActivity(Model $model, int $limit = 50)
    {
        return ActivityLog::forModel($model)
            ->latest()
            ->limit($limit)
            ->get();
    }

    /**
     * Get activity logs for a specific user.
     */
    public function getUserActivity(int $userId, int $limit = 50)
    {
        return ActivityLog::forUser($userId)
            ->latest()
            ->limit($limit)
            ->get();
    }

    /**
     * Get activity logs by log name.
     */
    public function getActivityByLogName(string $logName, int $limit = 50)
    {
        return ActivityLog::logName($logName)
            ->latest()
            ->limit($limit)
            ->get();
    }

    /**
     * Get activity logs by date range.
     */
    public function getActivityByDateRange(\DateTime $startDate, \DateTime $endDate, int $limit = 50)
    {
        return ActivityLog::dateRange($startDate, $endDate)
            ->latest()
            ->limit($limit)
            ->get();
    }

    /**
     * Get activity statistics.
     */
    public function getActivityStatistics()
    {
        return [
            'total_logs' => ActivityLog::count(),
            'today_logs' => ActivityLog::whereDate('created_at', today())->count(),
            'this_week_logs' => ActivityLog::whereBetween('created_at', [now()->startOfWeek(), now()->endOfWeek()])->count(),
            'this_month_logs' => ActivityLog::whereMonth('created_at', now()->month)->count(),
            'logs_by_type' => ActivityLog::selectRaw('activity_type, count(*) as count')
                ->groupBy('activity_type')
                ->get()
                ->pluck('count', 'activity_type')
                ->toArray(),
            'logs_by_log_name' => ActivityLog::selectRaw('log_name, count(*) as count')
                ->groupBy('log_name')
                ->get()
                ->pluck('count', 'log_name')
                ->toArray()
        ];
    }
}