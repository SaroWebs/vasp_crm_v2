<?php

namespace Tests\Feature;

use App\Models\Client;
use App\Models\OrganizationUser;
use App\Models\Permission;
use App\Models\Role;
use App\Models\Ticket;
use App\Models\User;
use App\Services\NotificationService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminTicketAssignmentExternalNotificationTest extends TestCase
{
    use RefreshDatabase;

    public function test_assign_ticket_sends_external_notification_to_assigned_user(): void
    {
        $admin = $this->createAdminUserWithTicketAssignPermission();
        $assignee = User::factory()->create();

        $client = Client::create([
            'name' => 'Acme Client',
            'code' => 'acme-001',
            'status' => 'active',
        ]);

        $organizationUser = OrganizationUser::create([
            'client_id' => $client->id,
            'email' => 'org-user@example.com',
            'name' => 'Org User',
            'status' => 'active',
        ]);

        $ticket = Ticket::create([
            'client_id' => $client->id,
            'organization_user_id' => $organizationUser->id,
            'ticket_number' => 'TKT-001',
            'title' => 'Printer is offline',
            'description' => 'Office printer not reachable.',
            'category' => 'support',
            'priority' => 'medium',
            'status' => 'open',
        ]);

        $notificationService = new class extends NotificationService
        {
            /** @var array<int, array<string, int|string>> */
            public array $externalTicketAssignmentCalls = [];

            public function sendTicketAssignmentExternalNotification(int $ticketId, string $ticketTitle, int $assignedUserId, int $assignedByUserId): void
            {
                $this->externalTicketAssignmentCalls[] = [
                    'ticket_id' => $ticketId,
                    'ticket_title' => $ticketTitle,
                    'assigned_user_id' => $assignedUserId,
                    'assigned_by_user_id' => $assignedByUserId,
                ];
            }
        };

        $this->app->instance(NotificationService::class, $notificationService);

        $response = $this->actingAs($admin, 'web')->postJson("/admin/ticket/{$ticket->id}/assign", [
            'assignedTo' => $assignee->id,
        ]);

        $response->assertOk()->assertJson([
            'message' => 'Ticket assigned successfully',
        ]);

        $this->assertCount(1, $notificationService->externalTicketAssignmentCalls);
        $this->assertSame($ticket->id, $notificationService->externalTicketAssignmentCalls[0]['ticket_id']);
        $this->assertSame($ticket->title, $notificationService->externalTicketAssignmentCalls[0]['ticket_title']);
        $this->assertSame($assignee->id, $notificationService->externalTicketAssignmentCalls[0]['assigned_user_id']);
        $this->assertSame($admin->id, $notificationService->externalTicketAssignmentCalls[0]['assigned_by_user_id']);
    }

    private function createAdminUserWithTicketAssignPermission(): User
    {
        $role = Role::create([
            'name' => 'Admin',
            'slug' => 'admin',
            'guard_name' => 'web',
            'description' => 'Admin role',
            'is_default' => false,
            'level' => 1,
        ]);

        $permission = Permission::create([
            'name' => 'Assign Ticket',
            'slug' => 'ticket.assign',
            'module' => 'ticket',
            'action' => 'assign',
            'description' => 'Assign tickets to users',
        ]);

        $role->permissions()->attach($permission->id);

        $user = User::factory()->create();
        $user->roles()->attach($role->id);

        return $user;
    }
}
