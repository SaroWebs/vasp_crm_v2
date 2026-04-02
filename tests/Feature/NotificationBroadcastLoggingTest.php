<?php

namespace Tests\Feature;

use App\Events\NotificationEvent;
use App\Models\User;
use App\Services\NotificationService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Log;
use Mockery;
use Tests\TestCase;

class NotificationBroadcastLoggingTest extends TestCase
{
    use RefreshDatabase;

    public function test_send_to_user_logs_the_notification_broadcast_attempt(): void
    {
        $user = User::factory()->create();

        Log::shouldReceive('debug')
            ->once()
            ->with(
                'Broadcasting notification event',
                Mockery::on(function (array $context) use ($user): bool {
                    return ($context['context'] ?? null) === 'general_notification'
                        && ($context['event_class'] ?? null) === NotificationEvent::class
                        && ($context['user_id'] ?? null) === $user->id
                        && array_key_exists('notification_id', $context);
                })
            );

        Log::shouldReceive('error')->never();

        $notificationService = app(NotificationService::class);

        $notification = $notificationService->sendToUser(
            $user->id,
            'App\\Notifications\\SystemNotification',
            'Test notification',
            'Test message'
        );

        $this->assertSame($user->id, (int) $notification->notifiable_id);
        $this->assertSame('Test notification', $notification->data['title']);
        $this->assertSame('Test message', $notification->data['message']);
    }
}
