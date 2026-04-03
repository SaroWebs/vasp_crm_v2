<?php

namespace Tests\Feature;

use App\Http\Middleware\ValidateUserSession;
use App\Models\Client;
use App\Models\Department;
use App\Models\Employee;
use App\Models\OrganizationUser;
use App\Models\Role;
use App\Models\Ticket;
use App\Models\User;
use App\Services\NotificationService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TicketStatusChangeExternalNotificationTest extends TestCase
{
    use RefreshDatabase;

    public function test_ticket_status_change_sends_whatsapp_to_support_users(): void
    {
        $supportRole = Role::create([
            'name' => 'Support',
            'slug' => 'support',
            'guard_name' => 'web',
            'description' => 'Support role',
            'is_default' => false,
            'level' => 5,
        ]);

        $supportUser = User::factory()->create([
            'phone' => '9876543210',
        ]);
        $supportUser->roles()->attach($supportRole->id);

        $otherUser = User::factory()->create([
            'phone' => '9876543211',
        ]);

        $department = Department::create([
            'name' => 'Support',
            'slug' => 'support',
            'status' => 'active',
        ]);

        Employee::create([
            'name' => $supportUser->name,
            'email' => 'support@example.com',
            'phone' => '9123456780',
            'department_id' => $department->id,
            'user_id' => $supportUser->id,
        ]);

        $service = new class extends NotificationService
        {
            /** @var array<int, array<string, string>> */
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

        $service->sendTicketStatusChangeExternalNotification(44, 'Login issue', 'closed', $otherUser->id);

        $this->assertCount(1, $service->whatsappMessages);
        $this->assertSame('9123456780', $service->whatsappMessages[0]['phone']);
        $this->assertStringContainsString('Ticket Status Updated', $service->whatsappMessages[0]['message']);
        $this->assertStringContainsString("Ticket 'Login issue' status changed to: closed", $service->whatsappMessages[0]['message']);
        $this->assertStringContainsString(config('app.url').'/admin/tickets/44', $service->whatsappMessages[0]['message']);
        $this->assertStringNotContainsString('/my/tickets/44', $service->whatsappMessages[0]['message']);
    }

    public function test_admin_ticket_status_update_invokes_ticket_status_notification_helper(): void
    {
        $this->withoutMiddleware(ValidateUserSession::class);

        $superAdminRole = Role::create([
            'name' => 'Super Admin',
            'slug' => 'super-admin',
            'guard_name' => 'web',
            'description' => 'Super admin role',
            'is_default' => false,
            'level' => 1,
        ]);

        $admin = User::factory()->create();
        $admin->roles()->attach($superAdminRole->id);

        $client = Client::create([
            'name' => 'Acme Client',
            'code' => 'acme-support-001',
            'status' => 'active',
        ]);

        $organizationUser = OrganizationUser::create([
            'client_id' => $client->id,
            'email' => 'client-user@example.com',
            'name' => 'Client User',
            'status' => 'active',
        ]);

        $ticket = Ticket::create([
            'client_id' => $client->id,
            'organization_user_id' => $organizationUser->id,
            'ticket_number' => 'TKT-STATUS-001',
            'title' => 'Cannot login',
            'description' => 'User cannot login to portal',
            'category' => 'support',
            'priority' => 'medium',
            'status' => 'open',
        ]);

        $service = new class extends NotificationService
        {
            /** @var array<int, array<string, mixed>> */
            public array $statusCalls = [];

            public function sendTicketStatusChangeExternalNotification(int $ticketId, string $ticketTitle, string $newStatus, int $changedByUserId): void
            {
                $this->statusCalls[] = [
                    'ticket_id' => $ticketId,
                    'ticket_title' => $ticketTitle,
                    'new_status' => $newStatus,
                    'changed_by_user_id' => $changedByUserId,
                ];
            }
        };

        $this->app->instance(NotificationService::class, $service);

        $response = $this->actingAs($admin, 'web')->patchJson("/admin/tickets/{$ticket->id}/status", [
            'status' => 'closed',
        ]);

        $response->assertOk();

        $this->assertCount(1, $service->statusCalls);
        $this->assertSame($ticket->id, $service->statusCalls[0]['ticket_id']);
        $this->assertSame('Cannot login', $service->statusCalls[0]['ticket_title']);
        $this->assertSame('closed', $service->statusCalls[0]['new_status']);
        $this->assertSame($admin->id, $service->statusCalls[0]['changed_by_user_id']);
    }
}
