<?php

namespace App\Services;

use App\Events\NotificationEvent;
use App\Events\TaskAssignedNotificationEvent;
use App\Events\TaskForwardedNotificationEvent;
use App\Events\TaskStatusChangedNotificationEvent;
use App\Models\Notification;
use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Broadcast;
use Illuminate\Support\Facades\Log;

class NotificationService
{
    /**
     * Send a notification to a specific user.
     */
    public function sendToUser(int $userId, string $type, string $title, string $message, array $data = []): Notification
    {
        $notification = Notification::createWorkflowNotification($userId, $type, $title, $message, $data);
        
        // Broadcast the notification using Reverb
        $this->broadcastNotification($notification, $userId);
        
        return $notification;
    }

    /**
     * Broadcast notification using Reverb.
     */
    protected function broadcastNotification(Notification $notification, int $userId): void
    {
        // Use the base notification event for general notifications
        broadcast(new NotificationEvent($notification, $userId))->toOthers();
    }

    /**
     * Send notifications to multiple users.
     */
    public function sendToUsers(array $userIds, string $type, string $title, string $message, array $data = []): array
    {
        return Notification::notifyUsers($userIds, $type, $title, $message, $data);
    }

    /**
     * Send notification to department users.
     */
    public function sendToDepartment(int $departmentId, string $type, string $title, string $message, array $data = []): array
    {
        return Notification::notifyUsers(
            \App\Models\Department::find($departmentId)->users()->pluck('id')->toArray(),
            $type,
            $title,
            $message,
            $data
        );
    }

    /**
     * Send notification to department managers.
     */
    public function sendToDepartmentManagers(int $departmentId, string $type, string $title, string $message, array $data = []): array
    {
        return Notification::notifyUsers(
            \App\Models\Department::find($departmentId)->getManagers()->pluck('id')->toArray(),
            $type,
            $title,
            $message,
            $data
        );
    }

    /**
     * Send task assignment notification.
     */
    public function sendTaskAssignmentNotification(int $taskId, int $assignedUserId, string $taskTitle, int $assignedByUserId): Notification
    {
        $assignedUser = User::find($assignedUserId);
        $assignedByUser = User::find($assignedByUserId);

        $notification = $this->sendToUser(
            $assignedUserId,
            'App\Notifications\TaskAssignedNotification',
            'Task Assigned',
            "You have been assigned to task: {$taskTitle}",
            [
                'task_id' => $taskId,
                'task_title' => $taskTitle,
                'assigned_by_id' => $assignedByUserId,
                'assigned_by_name' => $assignedByUser->name ?? 'System'
            ]
        );

        // Broadcast using specific task assignment event
        broadcast(new TaskAssignedNotificationEvent($notification, $assignedUserId))->toOthers();

        return $notification;
    }

    /**
     * Send task status change notification.
     */
    public function sendTaskStatusChangeNotification(int $taskId, string $taskTitle, string $newStatus, int $changedByUserId): Notification
    {
        $task = \App\Models\Task::find($taskId);
        $changedByUser = User::find($changedByUserId);

        // Notify task assignee
        $notifications = [];
        if ($task->assigned_to) {
            $notification = $this->sendToUser(
                $task->assigned_to,
                'App\Notifications\TaskStatusChangedNotification',
                'Task Status Updated',
                "Task '{$taskTitle}' status changed to: {$newStatus}",
                [
                    'task_id' => $taskId,
                    'task_title' => $taskTitle,
                    'new_status' => $newStatus,
                    'changed_by_id' => $changedByUserId,
                    'changed_by_name' => $changedByUser->name ?? 'System'
                ]
            );

            // Broadcast using specific task status change event
            broadcast(new TaskStatusChangedNotificationEvent($notification, $task->assigned_to))->toOthers();

            $notifications[] = $notification;
        }

        // Notify department users if assigned to department
        if ($task->assigned_department_id) {
            $departmentNotifications = $this->sendToDepartment(
                $task->assigned_department_id,
                'App\Notifications\TaskStatusChangedNotification',
                'Task Status Updated',
                "Task '{$taskTitle}' status changed to: {$newStatus}",
                [
                    'task_id' => $taskId,
                    'task_title' => $taskTitle,
                    'new_status' => $newStatus,
                    'changed_by_id' => $changedByUserId,
                    'changed_by_name' => $changedByUser->name ?? 'System'
                ]
            );

            // Broadcast to department users
            $departmentUserIds = \App\Models\Department::find($task->assigned_department_id)->users()->pluck('id')->toArray();
            foreach ($departmentUserIds as $userId) {
                broadcast(new TaskStatusChangedNotificationEvent($departmentNotifications[0], $userId))->toOthers();
            }

            $notifications = array_merge($notifications, $departmentNotifications);
        }

        return $notifications[0] ?? null;
    }

    /**
     * Send task forwarding notification.
     */
    public function sendTaskForwardingNotification(int $taskId, int $fromDepartmentId, int $toDepartmentId, string $reason, int $forwardedByUserId): array
    {
        $task = \App\Models\Task::find($taskId);
        $forwardedByUser = User::find($forwardedByUserId);
        $fromDepartment = \App\Models\Department::find($fromDepartmentId);
        $toDepartment = \App\Models\Department::find($toDepartmentId);

        $notifications = [];

        // Notify target department users
        $departmentNotifications = $this->sendToDepartment(
            $toDepartmentId,
            'App\Notifications\TaskForwardedNotification',
            'Task Forwarded to Your Department',
            "Task '{$task->title}' has been forwarded from {$fromDepartment->name} to {$toDepartment->name}",
            [
                'task_id' => $taskId,
                'task_title' => $task->title,
                'from_department_id' => $fromDepartmentId,
                'from_department_name' => $fromDepartment->name,
                'to_department_id' => $toDepartmentId,
                'to_department_name' => $toDepartment->name,
                'reason' => $reason,
                'forwarded_by_id' => $forwardedByUserId,
                'forwarded_by_name' => $forwardedByUser->name ?? 'System'
            ]
        );

        // Broadcast to department users
        $departmentUserIds = \App\Models\Department::find($toDepartmentId)->users()->pluck('id')->toArray();
        foreach ($departmentUserIds as $userId) {
            broadcast(new TaskForwardedNotificationEvent($departmentNotifications[0], $userId))->toOthers();
        }

        $notifications = array_merge($notifications, $departmentNotifications);

        // Notify department managers
        $managerNotifications = $this->sendToDepartmentManagers(
            $toDepartmentId,
            'App\Notifications\TaskForwardedManagerNotification',
            'Task Forwarded - Manager Notification',
            "Task '{$task->title}' has been forwarded to your department by {$forwardedByUser->name}",
            [
                'task_id' => $taskId,
                'task_title' => $task->title,
                'requires_approval' => true,
                'forwarded_by_id' => $forwardedByUserId,
                'forwarded_by_name' => $forwardedByUser->name ?? 'System'
            ]
        );

        // Broadcast to department managers
        $managerUserIds = \App\Models\Department::find($toDepartmentId)->getManagers()->pluck('id')->toArray();
        foreach ($managerUserIds as $userId) {
            broadcast(new TaskForwardedNotificationEvent($managerNotifications[0], $userId))->toOthers();
        }

        $notifications = array_merge($notifications, $managerNotifications);

        return $notifications;
    }

    /**
     * Send task forwarding acceptance notification.
     */
    public function sendTaskForwardingAcceptanceNotification(int $taskId, int $acceptedByUserId, int $forwardedUserId): Notification
    {
        $task = \App\Models\Task::find($taskId);
        $acceptedByUser = User::find($acceptedByUserId);
        $forwardedUser = User::find($forwardedUserId);

        return $this->sendToUser(
            $forwardedUserId,
            'App\Notifications\TaskForwardAcceptedNotification',
            'Task Forward Accepted',
            "Your forwarded task '{$task->title}' has been accepted by {$acceptedByUser->name}",
            [
                'task_id' => $taskId,
                'task_title' => $task->title,
                'accepted_by_id' => $acceptedByUserId,
                'accepted_by_name' => $acceptedByUser->name
            ]
        );
    }

    /**
     * Send task forwarding rejection notification.
     */
    public function sendTaskForwardingRejectionNotification(int $taskId, int $rejectedByUserId, int $forwardedUserId, string $reason): Notification
    {
        $task = \App\Models\Task::find($taskId);
        $rejectedByUser = User::find($rejectedByUserId);
        $forwardedUser = User::find($forwardedUserId);

        return $this->sendToUser(
            $forwardedUserId,
            'App\Notifications\TaskForwardRejectedNotification',
            'Task Forward Rejected',
            "Your forwarded task '{$task->title}' has been rejected. Reason: {$reason}",
            [
                'task_id' => $taskId,
                'task_title' => $task->title,
                'rejected_by_id' => $rejectedByUserId,
                'rejected_by_name' => $rejectedByUser->name,
                'rejection_reason' => $reason
            ]
        );
    }

    /**
     * Send ticket creation notification.
     */
    public function sendTicketCreationNotification(int $ticketId, string $ticketTitle, int $createdByUserId): Notification
    {
        $ticket = \App\Models\Ticket::find($ticketId);
        $createdByUser = User::find($createdByUserId);

        return $this->sendToUser(
            $createdByUserId,
            'App\Notifications\TicketCreatedNotification',
            'Ticket Created',
            "Your ticket '{$ticketTitle}' has been successfully created",
            [
                'ticket_id' => $ticketId,
                'ticket_title' => $ticketTitle,
                'created_by_id' => $createdByUserId,
                'created_by_name' => $createdByUser->name ?? 'System'
            ]
        );
    }

    /**
     * Send ticket status change notification.
     */
    public function sendTicketStatusChangeNotification(int $ticketId, string $ticketTitle, string $newStatus, int $changedByUserId): Notification
    {
        $ticket = \App\Models\Ticket::find($ticketId);
        $changedByUser = User::find($changedByUserId);

        return $this->sendToUser(
            $ticket->created_by,
            'App\Notifications\TicketStatusChangedNotification',
            'Ticket Status Updated',
            "Your ticket '{$ticketTitle}' status changed to: {$newStatus}",
            [
                'ticket_id' => $ticketId,
                'ticket_title' => $ticketTitle,
                'new_status' => $newStatus,
                'changed_by_id' => $changedByUserId,
                'changed_by_name' => $changedByUser->name ?? 'System'
            ]
        );
    }

    /**
     * Send department assignment notification.
     */
    public function sendDepartmentAssignmentNotification(int $departmentId, int $assignedUserId, int $assignedByUserId): Notification
    {
        $department = \App\Models\Department::find($departmentId);
        $assignedUser = User::find($assignedUserId);
        $assignedByUser = User::find($assignedByUserId);

        return $this->sendToUser(
            $assignedUserId,
            'App\Notifications\DepartmentAssignedNotification',
            'Assigned to Department',
            "You have been assigned to the {$department->name} department",
            [
                'department_id' => $departmentId,
                'department_name' => $department->name,
                'assigned_by_id' => $assignedByUserId,
                'assigned_by_name' => $assignedByUser->name ?? 'System'
            ]
        );
    }

    /**
     * Send overdue task notification.
     */
    public function sendOverdueTaskNotification(int $taskId, string $taskTitle, int $assignedUserId): Notification
    {
        $task = \App\Models\Task::find($taskId);

        return $this->sendToUser(
            $assignedUserId,
            'App\Notifications\TaskOverdueNotification',
            'Task Overdue',
            "Your task '{$taskTitle}' is overdue. Due date: {$task->due_date}",
            [
                'task_id' => $taskId,
                'task_title' => $taskTitle,
                'due_date' => $task->due_date
            ]
        );
    }

    /**
     * Send due today task notification.
     */
    public function sendDueTodayTaskNotification(int $taskId, string $taskTitle, int $assignedUserId): Notification
    {
        $task = \App\Models\Task::find($taskId);

        return $this->sendToUser(
            $assignedUserId,
            'App\Notifications\TaskDueTodayNotification',
            'Task Due Today',
            "Your task '{$taskTitle}' is due today",
            [
                'task_id' => $taskId,
                'task_title' => $taskTitle,
                'due_date' => $task->due_date
            ]
        );
    }

    /**
     * Send comment notification.
     */
    public function sendCommentNotification(int $commentId, int $commentedUserId): Notification
    {
        $comment = \App\Models\TaskComment::find($commentId);
        $task = $comment->task;

        return $this->sendToUser(
            $commentedUserId,
            'App\Notifications\CommentNotification',
            'New Comment',
            "New comment on task '{$task->title}': {$comment->comment_text}",
            [
                'comment_id' => $commentId,
                'task_id' => $task->id,
                'task_title' => $task->title,
                'comment_text' => $comment->comment_text
            ]
        );
    }

    /**
     * Mark notification as read.
     */
    public function markAsRead(Notification $notification): void
    {
        $notification->markAsRead();
    }

    /**
     * Mark all notifications as read for a user.
     */
    public function markAllAsRead(int $userId): void
    {
        Notification::whereHas('users', function ($query) use ($userId) {
                $query->where('user_id', $userId)
                      ->where('read', false);
            })
            ->get()
            ->each(function ($notification) use ($userId) {
                $notification->markAsReadForUser($userId);
            });
    }

    /**
     * Get unread count for a user.
     */
    public function getUnreadCount(int $userId): int
    {
        return Notification::getUnreadCountForUser($userId);
    }

    /**
     * Get recent notifications for a user.
     */
    public function getRecentNotifications(int $userId, int $limit = 10)
    {
        return Notification::getRecentNotificationsForUser($userId, $limit);
    }

    /**
     * Get all notifications for a user.
     */
    public function getUserNotifications(int $userId, int $perPage = 15)
    {
        return Notification::getUserNotifications($userId, $perPage);
    }

    /**
     * Send WhatsApp message to a phone number.
     *
     * @param string $phone Phone number to send WhatsApp message to
     * @param string $message Message content
     * @return bool True if WhatsApp message was sent successfully, false otherwise
     */
    public function sendWhatsApp(string $phone, string $message): bool
    {
        // phone number should be in international format without +, e.g. 919876543210
        // mostly we have 9876543210 but if we have country code then it should be like 919876543210
        // if length is 10, we can assume it's a local number and prepend country code
        if (strlen($phone) === 10) {
            $phone = '91' . $phone; // Assuming country code 91 for India, adjust as needed
        }
        // check if phone number is valid (basic check for digits and length)
        if (!preg_match('/^\d{10,15}$/', $phone)) {
            Log::warning('Invalid phone number format for WhatsApp notification', ['phone' => $phone]);
            return false;
        }


        $apiToken = config('services.whatsapp.api_token');
        $url = config('services.whatsapp.url', 'https://social.ednect.com/api/UWAPGet/send');
        $isGroup = config('services.whatsapp.is_group', 'false');

        if (!$apiToken) {
            Log::warning('WhatsApp API token not configured');
            return false;
        }

        // Build the URL with query parameters
        $fullUrl = $url . '?apitoken=' . $apiToken . '&phoneno=' . urlencode($phone) . '&sms=' . urlencode($message) . '&isgroup=' . $isGroup;

        $ch = curl_init($fullUrl);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Content-Type: application/json',
            'Accept: application/json',
        ]);

        $result = curl_exec($ch);

        if ($result === false) {
            Log::error('WhatsApp cURL error: ' . curl_error($ch));
            curl_close($ch);
            return false;
        }

        curl_close($ch);

        $response = json_decode($result, true);

        if (is_array($response) && isset($response[0])) {
            $firstResponse = $response[0];
            if (isset($firstResponse['status']) && $firstResponse['status'] === 'Success') {
                Log::info('WhatsApp message sent successfully', [
                    'phone' => $phone,
                    'response' => $firstResponse
                ]);
                return true;
            } else {
                Log::warning('WhatsApp message failed', [
                    'phone' => $phone,
                    'response' => $firstResponse
                ]);
            }
        }

        return false;
    }

    /**
     * Send SMS to a phone number.
     */
    public function sendSms(string $phone, string $message): bool
    {
        $apiKey = config('services.sms.api_key', 'pROzzgHpqZjQauAI');
        $senderId = config('services.sms.sender_id', 'VASPTK');

        $payload = [
            'apikey' => $apiKey,
            'senderid' => $senderId,
            'number' => $phone,
            'message' => $message,
            'format' => 'json'
        ];

        $url = config('services.sms.url', 'https://msgn.mtalkz.com/api');

        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Content-Type: application/json',
            'Accept: application/json',
        ]);

        $result = curl_exec($ch);

        if ($result === false) {
            curl_close($ch);
            return false;
        }

        curl_close($ch);

        $response = json_decode($result, true);

        if (isset($response['status']) && $response['status'] === 'OK') {
            return true;
        }

        return false;
    }

    /**
     * Send email to a user.
     */
    public function sendEmail(string $to, string $subject, string $message): bool
    {
        $fromEmail = config('mail.from.address', 'no-reply@yourdomain.com');
        $fromName = config('mail.from.name', 'VASP Ticket');

        $headers = "From: {$fromName} <{$fromEmail}>\r\n";
        $headers .= "Content-Type: text/html; charset=UTF-8\r\n";

        return mail($to, $subject, $message, $headers);
    }

    /**
     * Send notification to employee via WhatsApp, SMS, or Email.
     * First tries WhatsApp, then falls back to SMS, then email, then logs error if all fail.
     *
     * @param int $userId The user to notify
     * @param string $subject The notification subject/title
     * @param string $message The notification message
     * @param int $assignedByUserId The user who triggered the notification (to check if it's not self-action)
     */
    public function notifyEmployee(int $userId, string $subject, string $message, int $assignedByUserId): void
    {
        // Don't notify if user is doing action on their own task
        if ($userId === $assignedByUserId) {
            return;
        }

        $user = User::find($userId);
        if (!$user) {
            return;
        }

        // Get phone number from employee profile
        $phone = null;
        if ($user->employee) {
            $phone = $user->employee->phone;
            $email = $user->employee->email;
        }

        // Try WhatsApp first
        if ($phone) {
            $whatsappSent = $this->sendWhatsApp($phone, $message);
            if ($whatsappSent) {
                return; // Success via WhatsApp, no need for SMS or email
            }
        }

        // WhatsApp failed or no phone, try SMS
        if ($phone) {
            $smsSent = $this->sendSms($phone, $message);
            if ($smsSent) {
                return; // Success via SMS, no need for email
            }
        }

        // SMS failed or no phone, try employee email
        if ($email) {
            $emailSent = $this->sendEmail($email, $subject, $message);
            if ($emailSent) {
                return; // Success
            }
        }

        // Employee email failed or not available, try user email
        if ($user->email) {
            $emailSent = $this->sendEmail($user->email, $subject, $message);
            if ($emailSent) {
                return; // Success
            }
        }

        // WhatsApp, SMS, and email failed, log the error
        $this->logNotificationFailure($userId, $subject, $message, $phone, $user->email ?? null);
    }

    /**
     * Log notification failure for further investigation.
     */
    protected function logNotificationFailure(int $userId, string $subject, string $message, ?string $phone, ?string $email): void
    {
        Log::error('Notification delivery failed', [
            'user_id' => $userId,
            'subject' => $subject,
            'message' => $message,
            'phone' => $phone,
            'email' => $email,
            'reason' => $phone ? 'WhatsApp, SMS, and email failed' : 'No phone number and email failed'
        ]);
    }

    /**
     * Send task assignment notification via SMS/Email to the assigned user.
     *
     * @param int $taskId The task ID
     * @param string $taskTitle The task title
     * @param int $assignedUserId The user being assigned
     * @param int $assignedByUserId The user who assigned the task
     */
    public function sendTaskAssignmentExternalNotification(int $taskId, string $taskTitle, int $assignedUserId, int $assignedByUserId): void
    {
        $assignedByUser = User::find($assignedByUserId);
        $assignedByName = $assignedByUser->name ?? 'System';

        $subject = 'New Task Assigned';
        $taskUrl = config('app.url') . '/my/tasks/' . $taskId;
        $message = "You have been assigned to task: {$taskTitle}. Assigned by: {$assignedByName}. View: {$taskUrl}";

        $this->notifyEmployee($assignedUserId, $subject, $message, $assignedByUserId);
    }

    /**
     * Send task status change notification via SMS/Email.
     *
     * @param int $taskId The task ID
     * @param string $taskTitle The task title
     * @param string $newStatus The new status
     * @param int $changedByUserId The user who changed the status
     * @param int $notifyUserId The user to notify
     */
    public function sendTaskStatusChangeExternalNotification(int $taskId, string $taskTitle, string $newStatus, int $changedByUserId, int $notifyUserId): void
    {
        $changedByUser = User::find($changedByUserId);
        $changedByName = $changedByUser->name ?? 'System';

        $subject = 'Task Status Updated';
        $taskUrl = config('app.url') . '/my/tasks/' . $taskId;
        $message = "Task '{$taskTitle}' status changed to: {$newStatus}. Changed by: {$changedByName}. View: {$taskUrl}";

        $this->notifyEmployee($notifyUserId, $subject, $message, $changedByUserId);
    }

    /**
     * Send task forwarding notification via SMS/Email.
     *
     * @param int $taskId The task ID
     * @param string $taskTitle The task title
     * @param string $fromDepartmentName Source department
     * @param string $toDepartmentName Target department
     * @param int $forwardedByUserId The user who forwarded the task
     * @param int $notifyUserId The user to notify
     */
    public function sendTaskForwardExternalNotification(int $taskId, string $taskTitle, string $fromDepartmentName, string $toDepartmentName, int $forwardedByUserId, int $notifyUserId): void
    {
        $forwardedByUser = User::find($forwardedByUserId);
        $forwardedByName = $forwardedByUser->name ?? 'System';

        $subject = 'Task Forwarded to Your Department';
        $taskUrl = config('app.url') . '/my/tasks/' . $taskId;
        $message = "Task '{$taskTitle}' has been forwarded from {$fromDepartmentName} to {$toDepartmentName}. Forwarded by: {$forwardedByName}. View: {$taskUrl}";

        $this->notifyEmployee($notifyUserId, $subject, $message, $forwardedByUserId);
    }

    /**
     * Send ticket assignment notification via SMS/Email.
     *
     * @param int $ticketId The ticket ID
     * @param string $ticketTitle The ticket title
     * @param int $assignedUserId The user being assigned
     * @param int $assignedByUserId The user who assigned the ticket
     */
    public function sendTicketAssignmentExternalNotification(int $ticketId, string $ticketTitle, int $assignedUserId, int $assignedByUserId): void
    {
        $assignedByUser = User::find($assignedByUserId);
        $assignedByName = $assignedByUser->name ?? 'System';

        $subject = 'New Ticket Assigned';
        $ticketUrl = config('app.url') . '/tickets/' . $ticketId;
        $message = "You have been assigned to ticket: {$ticketTitle}. Assigned by: {$assignedByName}. View: {$ticketUrl}";

        $this->notifyEmployee($assignedUserId, $subject, $message, $assignedByUserId);
    }
}
