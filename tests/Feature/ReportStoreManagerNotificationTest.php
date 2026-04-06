<?php

namespace Tests\Feature;

use App\Models\Role;
use App\Models\User;
use App\Services\NotificationService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ReportStoreManagerNotificationTest extends TestCase
{
    use RefreshDatabase;

    public function test_report_store_sends_whatsapp_to_manager_role_only(): void
    {
        $managerRole = Role::create([
            'name' => 'manager',
            'slug' => 'manager',
            'guard_name' => 'web',
            'description' => 'Manager role',
            'is_default' => false,
            'level' => 2,
        ]);

        $manager = User::factory()->create([
            'phone' => '9123456780',
        ]);
        $manager->roles()->attach($managerRole->id);

        $nonManager = User::factory()->create([
            'phone' => '9234567890',
        ]);

        $submitter = User::factory()->create([
            'phone' => '9345678901',
        ]);

        $notificationService = new class extends NotificationService
        {
            /** @var array<int, array{phone: string, message: string}> */
            public array $whatsappMessages = [];

            public function sendWhatsApp(string $phone, string $message): bool
            {
                $this->whatsappMessages[] = [
                    'phone' => $phone,
                    'message' => $message,
                ];

                return true;
            }
        };

        $this->app->instance(NotificationService::class, $notificationService);

        $this->actingAs($submitter)
            ->withoutMiddleware()
            ->postJson('/admin/api/reports', [
                'title' => 'Daily Report - 2026-04-03',
                'description' => 'Completed work for the day.',
                'report_date' => '2026-04-03',
                'selected_tasks' => [],
                'tasks_remarks' => [],
                'total_hours' => 4.5,
            ])
            ->assertOk();

        $this->assertDatabaseHas('reports', [
            'title' => 'Daily Report - 2026-04-03',
            'user_id' => $submitter->id,
            'status' => 'submitted',
        ]);

        $this->assertCount(1, $notificationService->whatsappMessages);
        $this->assertSame($manager->phone, $notificationService->whatsappMessages[0]['phone']);
        $this->assertStringContainsString('Daily Report Submitted', $notificationService->whatsappMessages[0]['message']);
        $this->assertStringContainsString('Daily Report - 2026-04-03', $notificationService->whatsappMessages[0]['message']);
        $this->assertStringContainsString('submitted by '.$submitter->name, $notificationService->whatsappMessages[0]['message']);
        $this->assertStringContainsString('/admin/reports/', $notificationService->whatsappMessages[0]['message']);
        $this->assertStringNotContainsString($nonManager->phone, $notificationService->whatsappMessages[0]['message']);
    }
}
