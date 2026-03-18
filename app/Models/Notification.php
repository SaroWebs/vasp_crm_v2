<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Notifications\DatabaseNotification;
use Illuminate\Support\Carbon;
use Illuminate\Support\Arr;
use Illuminate\Support\Str;

class Notification extends DatabaseNotification
{
    /**
     * The user that owns the notification.
     */
    /**
     * The users that belong to the notification.
     */
    public function users()
    {
        return $this->belongsToMany(User::class, 'users_notifications')
            ->withPivot('read', 'read_at')
            ->withTimestamps();
    }

    /**
     * Scope notifications for a specific user and eager load their pivot row.
     */
    public function scopeForUser(Builder $query, int $userId): Builder
    {
        return $query
            ->whereHas('users', function ($q) use ($userId) {
                $q->where('users.id', $userId);
            })
            ->with([
                'users' => function ($q) use ($userId) {
                    $q->where('users.id', $userId);
                }
            ]);
    }

    /**
     * Check if notification belongs to user.
     */
    public function isOwnedByUser(int $userId): bool
    {
        return $this->users()->where('users.id', $userId)->exists();
    }
    
    /**
     * Get the read status for a specific user.
     */
    public function isReadByUser($userId)
    {
        return $this->users()
            ->where('user_id', $userId)
            ->whereNotNull('users_notifications.read_at')
            ->exists();
    }
    
    /**
     * Mark notification as read for a specific user.
     */
    public function markAsReadForUser($userId)
    {
        $this->users()->updateExistingPivot($userId, [
            'read' => true,
            'read_at' => now(),
        ]);

        if (!$this->users()->wherePivot('read', false)->exists()) {
            $this->forceFill(['read_at' => now()])->save();
        }
    }
    
    /**
     * Mark notification as unread for a specific user.
     */
    public function markAsUnreadForUser($userId)
    {
        $this->users()->updateExistingPivot($userId, [
            'read' => false,
            'read_at' => null,
        ]);

        $this->forceFill(['read_at' => null])->save();
    }

    /**
     * Scope to get unread notifications.
     */
    public function scopeUnread($query)
    {
        return $query->whereNull('read_at');
    }

    /**
     * Scope to get read notifications.
     */
    public function scopeRead($query)
    {
        return $query->whereNotNull('read_at');
    }

    /**
     * Scope to filter by type.
     */
    public function scopeType($query, $type)
    {
        return $query->where('type', $type);
    }

    /**
     * Mark notification as read.
     */
    public function markAsRead()
    {
        $this->update(['read_at' => now()]);
    }

    /**
     * Mark notification as unread.
     */
    public function markAsUnread()
    {
        $this->update(['read_at' => null]);
    }

    /**
     * Check if notification is read.
     */
    public function isRead()
    {
        return $this->read_at !== null;
    }

    /**
     * Get notification icon based on type.
     */
    public function getIconAttribute()
    {
        $icons = [
            'App\Notifications\TicketCreatedNotification' => 'ticket',
            'App\Notifications\TicketApprovedNotification' => 'check-circle',
            'App\Notifications\TicketRejectedNotification' => 'x-circle',
            'App\Notifications\TaskAssignedNotification' => 'user-plus',
            'App\Notifications\TaskCompletedNotification' => 'check',
            'App\Notifications\DepartmentAssignedNotification' => 'users',
            'App\Notifications\SystemNotification' => 'info',
        ];

        return $icons[$this->type] ?? 'bell';
    }

    /**
     * Get notification color based on type.
     */
    public function getColorAttribute()
    {
        $colors = [
            'App\Notifications\TicketCreatedNotification' => 'blue',
            'App\Notifications\TicketApprovedNotification' => 'green',
            'App\Notifications\TicketRejectedNotification' => 'red',
            'App\Notifications\TaskAssignedNotification' => 'purple',
            'App\Notifications\TaskCompletedNotification' => 'green',
            'App\Notifications\DepartmentAssignedNotification' => 'indigo',
            'App\Notifications\SystemNotification' => 'gray',
        ];

        return $colors[$this->type] ?? 'gray';
    }

    /**
     * Create a notification for workflow events.
     */
    public static function createWorkflowNotification($userId, $type, $title, $message, $data = [])
    {
        $notification = self::create([
            'id' => (string) \Illuminate\Support\Str::uuid(),
            'type' => $type,
            'notifiable_type' => 'App\Models\User',
            'notifiable_id' => $userId,
            'data' => array_merge([
                'title' => $title,
                'message' => $message,
            ], $data),
        ]);
        
        // Associate the notification with the user through the pivot table
        $notification->users()->attach($userId, [
            'read' => false,
            'read_at' => null
        ]);
        
        return $notification;
    }

    /**
     * Send notification to multiple users.
     */
    public static function notifyUsers($userIds, $type, $title, $message, $data = [])
    {
        $notifications = [];
        foreach ($userIds as $userId) {
            $notifications[] = self::createWorkflowNotification($userId, $type, $title, $message, $data);
        }
        return $notifications;
    }
    
    /**
     * Create a notification for multiple users at once.
     */
    public static function createWorkflowNotificationForUsers($userIds, $type, $title, $message, $data = [])
    {
        $notification = self::create([
            'id' => (string) \Illuminate\Support\Str::uuid(),
            'type' => $type,
            'notifiable_type' => 'App\Models\User',
            'notifiable_id' => $userIds[0], // Use first user as notifiable
            'data' => array_merge([
                'title' => $title,
                'message' => $message,
            ], $data),
        ]);
        
        // Associate the notification with all users through the pivot table
        $pivotData = [];
        foreach ($userIds as $userId) {
            $pivotData[$userId] = [
                'read' => false,
                'read_at' => null
            ];
        }
        $notification->users()->attach($pivotData);
        
        return $notification;
    }

    /**
     * Get notifications for a user with pagination.
     */
    public static function getUserNotifications($userId, $perPage = 15)
    {
        return self::forUser($userId)
            ->orderBy('created_at', 'desc')
            ->paginate($perPage);
    }
    
    /**
     * Get unread count for a specific user.
     */
    public static function getUnreadCountForUser($userId)
    {
        return self::whereHas('users', function ($query) use ($userId) {
                $query->where('user_id', $userId)
                      ->where('users_notifications.read', false);
            })
            ->count();
    }
    
    /**
     * Get recent notifications for a specific user.
     */
    public static function getRecentNotificationsForUser($userId, $limit = 10)
    {
        return self::forUser($userId)
            ->orderBy('created_at', 'desc')
            ->limit($limit)
            ->get();
    }

    /**
     * Transform notification for frontend consumption.
     */
    public function toFrontend(int $userId): array
    {
        $user = $this->relationLoaded('users')
            ? $this->users->firstWhere('id', $userId)
            : $this->users()->where('users.id', $userId)->first();

        $pivotReadAt = $user?->pivot?->read_at;
        $isRead = !is_null($pivotReadAt);
        $readAt = $pivotReadAt ? Carbon::parse($pivotReadAt)->toISOString() : null;
        $payload = is_array($this->data) ? $this->data : [];
        $legacyData = is_array($payload['data'] ?? null) ? $payload['data'] : [];
        $mergedData = array_merge($legacyData, $payload);
        $targetUrl = $this->resolveTargetUrl($mergedData);
        $targetType = $this->resolveTargetType($mergedData, $targetUrl);

        return [
            'id' => (string) $this->id,
            'type' => $this->type,
            'type_key' => Str::of(class_basename($this->type))
                ->snake()
                ->replace('_notification', '')
                ->value(),
            'title' => $payload['title'] ?? 'Notification',
            'message' => $payload['message'] ?? '',
            'status' => $isRead ? 'read' : 'unread',
            'read_at' => $readAt,
            'created_at' => optional($this->created_at)->toISOString(),
            'updated_at' => optional($this->updated_at)->toISOString(),
            'icon' => $this->icon,
            'color' => $this->color,
            'target_url' => $targetUrl,
            'target_type' => $targetType,
            'data' => $mergedData,
        ];
    }

    protected function resolveTargetUrl(array $data): ?string
    {
        if (! $this->hasValidTargetResource($data)) {
            return null;
        }

        $explicitUrl = Arr::first([
            $data['target_url'] ?? null,
            $data['url'] ?? null,
            $data['link'] ?? null,
        ], fn ($value) => is_string($value) && $value !== '');

        if ($explicitUrl) {
            return $explicitUrl;
        }

        foreach ($this->targetResourceMap() as $key => [, $pattern]) {
            $value = $data[$key] ?? null;

            if (filled($value)) {
                return sprintf($pattern, $value);
            }
        }

        return null;
    }

    protected function hasValidTargetResource(array $data): bool
    {
        foreach ($this->targetResourceMap() as $key => [$modelClass]) {
            $value = $data[$key] ?? null;

            if (! filled($value)) {
                continue;
            }

            return $this->targetResourceExists($modelClass, $value);
        }

        return true;
    }

    protected function targetResourceExists(string $modelClass, mixed $value): bool
    {
        if (! is_a($modelClass, Model::class, true)) {
            return false;
        }

        return $modelClass::query()->whereKey($value)->exists();
    }

    protected function targetResourceMap(): array
    {
        return [
            'task_id' => [Task::class, '/admin/tasks/%s', 'task'],
            'ticket_id' => [Ticket::class, '/admin/tickets/%s', 'ticket'],
            'department_id' => [Department::class, '/admin/departments/%s', 'department'],
            'project_id' => [Project::class, '/admin/projects/%s', 'project'],
            'report_id' => [Report::class, '/admin/reports/%s', 'report'],
            'user_id' => [User::class, '/admin/users/%s', 'user'],
            'employee_id' => [Employee::class, '/admin/employees/%s', 'employee'],
        ];
    }

    protected function resolveTargetType(array $data, ?string $targetUrl): ?string
    {
        if (!$targetUrl) {
            return null;
        }

        foreach ($this->targetResourceMap() as $key => [, , $type]) {
            if (filled($data[$key] ?? null)) {
                return $type;
            }
        }

        return 'link';
    }
}
