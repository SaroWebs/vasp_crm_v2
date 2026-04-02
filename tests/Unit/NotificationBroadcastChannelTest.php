<?php

namespace Tests\Unit;

use App\Events\NotificationEvent;
use App\Events\TaskAssignedNotificationEvent;
use App\Events\TaskForwardedNotificationEvent;
use App\Events\TaskStatusChangedNotificationEvent;
use App\Models\Notification;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

class NotificationBroadcastChannelTest extends TestCase
{
    #[DataProvider('notificationEventProvider')]
    public function test_notification_events_broadcast_to_user_and_notifications_channels(string $eventClass): void
    {
        $notification = new Notification;
        $notification->id = 'notification-test-id';
        $notification->data = [
            'title' => 'Test notification',
            'message' => 'Test message',
        ];

        $event = new $eventClass($notification, 42);

        $channels = array_map(
            static function ($channel): string {
                $name = $channel->name;

                if (str_starts_with($name, 'private-')) {
                    return substr($name, 8);
                }

                return $name;
            },
            $event->broadcastOn()
        );

        $this->assertContains('user.42', $channels);
        $this->assertContains('notifications.42', $channels);
    }

    public static function notificationEventProvider(): array
    {
        return [
            [NotificationEvent::class],
            [TaskAssignedNotificationEvent::class],
            [TaskStatusChangedNotificationEvent::class],
            [TaskForwardedNotificationEvent::class],
        ];
    }
}
