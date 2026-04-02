<?php

namespace Tests\Feature;

use App\Models\User;
use App\Services\NotificationService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class NotificationPreferencesAlwaysOnTest extends TestCase
{
    use RefreshDatabase;

    public function test_unified_notifications_attempt_whatsapp_without_preferences(): void
    {
        $user = User::factory()->create([
            'phone' => '9876543210',
        ]);

        $service = new class extends NotificationService
        {
            public array $whatsappPhones = [];

            public function sendWhatsApp(string $phone, string $message): bool
            {
                $this->whatsappPhones[] = $phone;

                return true;
            }
        };

        $results = $service->sendUnifiedNotification(
            $user->id,
            'App\\Notifications\\TaskAssignedNotification',
            'Task Assigned',
            'Task assigned message'
        );

        $this->assertSame(['9876543210'], $service->whatsappPhones);
        $this->assertTrue($results['whatsapp']['success']);
    }
}
