<?php

namespace App\Events;

use App\Models\Notification;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class TaskForwardedNotificationEvent implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $notification;

    public $userId;

    /**
     * Create a new event instance.
     */
    public function __construct(Notification $notification, int $userId)
    {
        $this->notification = $notification;
        $this->userId = $userId;
    }

    /**
     * Get the channels the event should broadcast on.
     *
     * @return array<int, Channel>
     */
    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('user.'.$this->userId),
            new PrivateChannel('notifications.'.$this->userId),
        ];
    }

    /**
     * Get the data to broadcast.
     */
    public function broadcastWith(): array
    {
        $payload = is_array($this->notification->data['data'] ?? null)
            ? array_merge($this->notification->data, $this->notification->data['data'])
            : $this->notification->data;

        return [
            'id' => $this->notification->id,
            'type' => $this->notification->type,
            'data' => $this->notification->data,
            'read_at' => $this->notification->read_at,
            'created_at' => $this->notification->created_at,
            'task_forwarded' => [
                'task_id' => $payload['task_id'] ?? null,
                'task_title' => $payload['task_title'] ?? '',
                'from_department_id' => $payload['from_department_id'] ?? null,
                'from_department_name' => $payload['from_department_name'] ?? '',
                'to_department_id' => $payload['to_department_id'] ?? null,
                'to_department_name' => $payload['to_department_name'] ?? '',
                'reason' => $payload['reason'] ?? '',
                'forwarded_by_id' => $payload['forwarded_by_id'] ?? null,
                'forwarded_by_name' => $payload['forwarded_by_name'] ?? '',
            ],
            'notification' => [
                'title' => $payload['title'] ?? 'Task Forwarded',
                'message' => $payload['message'] ?? '',
                'icon' => $this->notification->icon,
                'color' => $this->notification->color,
                'is_read' => $this->notification->read_at !== null,
            ],
        ];
    }

    /**
     * Get the broadcast event name.
     */
    public function broadcastAs(): string
    {
        return 'task.forwarded';
    }
}
