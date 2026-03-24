<?php

namespace Tests\Feature;

use App\Models\Client;
use App\Models\Department;
use App\Models\Notification;
use App\Models\OrganizationUser;
use App\Models\Ticket;
use App\Models\User;
use App\Services\NotificationService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TicketDepartmentNotificationTest extends TestCase
{
    use RefreshDatabase;

    public function test_support_department_users_receive_notification_when_support_ticket_is_created(): void
    {
        config()->set('tickets.notify_department_by_category', ['support' => 'support']);

        $notificationService = new class extends NotificationService
        {
            public function notifyEmployee(int $userId, string $subject, string $message, int $assignedByUserId): void {}
        };

        $this->app->instance(NotificationService::class, $notificationService);

        $department = Department::create([
            'name' => 'Support',
            'slug' => 'support',
            'status' => 'active',
        ]);

        $employee = User::factory()->create();
        $department->users()->attach($employee->id, [
            'assigned_at' => now(),
            'assigned_by' => null,
        ]);

        $client = Client::create([
            'name' => 'Test Client',
            'email' => 'client@example.com',
            'status' => 'active',
        ]);

        $organizationUser = OrganizationUser::create([
            'client_id' => $client->id,
            'email' => 'org@example.com',
            'name' => 'Org User',
            'status' => 'active',
        ]);

        $ticket = Ticket::create([
            'client_id' => $client->id,
            'organization_user_id' => $organizationUser->id,
            'ticket_number' => 'test-support-001',
            'title' => 'Need help',
            'description' => 'Support needed',
            'category' => 'support',
            'priority' => 'low',
            'status' => 'open',
        ]);

        $notification = Notification::query()
            ->where('type', 'App\Notifications\TicketCreatedNotification')
            ->where('notifiable_type', User::class)
            ->where('notifiable_id', $employee->id)
            ->latest('created_at')
            ->first();

        $this->assertNotNull($notification);
        $this->assertSame($ticket->id, $notification->data['ticket_id']);
        $this->assertSame('support', $notification->data['department_slug'] ?? 'support');
    }

    public function test_support_department_users_receive_external_notification_when_support_ticket_is_created(): void
    {
        config()->set('tickets.notify_department_by_category', ['support' => 'support']);

        $notificationService = new class extends NotificationService
        {
            /** @var array<int, array<string, mixed>> */
            public array $sendToUserCalls = [];

            /** @var array<int, array<string, mixed>> */
            public array $notifyEmployeeCalls = [];

            public function sendToUser(int $userId, string $type, string $title, string $message, array $data = []): Notification
            {
                $this->sendToUserCalls[] = [
                    'user_id' => $userId,
                    'type' => $type,
                    'title' => $title,
                    'message' => $message,
                    'data' => $data,
                ];

                return new Notification;
            }

            public function notifyEmployee(int $userId, string $subject, string $message, int $assignedByUserId): void
            {
                $this->notifyEmployeeCalls[] = [
                    'user_id' => $userId,
                    'subject' => $subject,
                    'message' => $message,
                    'assigned_by_user_id' => $assignedByUserId,
                ];
            }
        };

        $this->app->instance(NotificationService::class, $notificationService);

        $department = Department::create([
            'name' => 'Support',
            'slug' => 'support',
            'status' => 'active',
        ]);

        $employee = User::factory()->create();
        $department->users()->attach($employee->id, [
            'assigned_at' => now(),
            'assigned_by' => null,
        ]);

        $client = Client::create([
            'name' => 'Test Client',
            'email' => 'client@example.com',
            'status' => 'active',
        ]);

        $organizationUser = OrganizationUser::create([
            'client_id' => $client->id,
            'email' => 'org@example.com',
            'name' => 'Org User',
            'status' => 'active',
        ]);

        Ticket::create([
            'client_id' => $client->id,
            'organization_user_id' => $organizationUser->id,
            'ticket_number' => 'test-support-002',
            'title' => 'Need support help',
            'description' => 'Support needed',
            'category' => 'support',
            'priority' => 'low',
            'status' => 'open',
        ]);

        $this->assertCount(1, $notificationService->sendToUserCalls);
        $this->assertCount(1, $notificationService->notifyEmployeeCalls);
        $this->assertSame($employee->id, $notificationService->notifyEmployeeCalls[0]['user_id']);
        $this->assertSame('New Ticket', $notificationService->notifyEmployeeCalls[0]['subject']);
    }
}
