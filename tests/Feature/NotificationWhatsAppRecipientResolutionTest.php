<?php

namespace Tests\Feature;

use App\Models\Department;
use App\Models\Employee;
use App\Models\User;
use App\Services\NotificationService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class NotificationWhatsAppRecipientResolutionTest extends TestCase
{
    use RefreshDatabase;

    public function test_whatsapp_uses_employee_phone_before_user_phone(): void
    {
        $user = User::factory()->create([
            'phone' => '9999999999',
        ]);

        $department = Department::create([
            'name' => 'Support',
            'slug' => 'support',
            'status' => 'active',
        ]);

        Employee::create([
            'name' => $user->name,
            'email' => 'employee@example.com',
            'phone' => '9876543210',
            'user_id' => $user->id,
            'department_id' => $department->id,
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

        $service->sendUnifiedNotification(
            $user->id,
            'App\\Notifications\\TaskAssignedNotification',
            'Task Assigned',
            'Task assigned message'
        );

        $this->assertSame(['9876543210'], $service->whatsappPhones);
    }

    public function test_whatsapp_falls_back_to_user_phone_when_employee_phone_is_missing(): void
    {
        $user = User::factory()->create([
            'phone' => '9999999999',
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

        $service->sendUnifiedNotification(
            $user->id,
            'App\\Notifications\\TaskAssignedNotification',
            'Task Assigned',
            'Task assigned message'
        );

        $this->assertSame(['9999999999'], $service->whatsappPhones);
    }
}
