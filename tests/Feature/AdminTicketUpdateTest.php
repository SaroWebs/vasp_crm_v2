<?php

namespace Tests\Feature;

use App\Http\Controllers\AdminTicketController;
use App\Models\Client;
use App\Models\Role;
use App\Models\Ticket;
use App\Models\TicketHistory;
use App\Models\User;
use App\Services\NotificationService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Request;
use Tests\TestCase;

class AdminTicketUpdateTest extends TestCase
{
    use RefreshDatabase;

    public function test_ticket_update_allows_missing_organization_user_id(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user);

        $client = Client::create([
            'name' => 'Acme Corporation',
            'status' => 'active',
        ]);

        $ticket = Ticket::create([
            'client_id' => $client->id,
            'organization_user_id' => null,
            'created_by' => $user->id,
            'ticket_number' => 'ACME-001',
            'title' => 'Original issue title',
            'description' => 'Original issue description',
            'category' => 'technical',
            'priority' => 'low',
            'status' => 'open',
        ]);

        $request = Request::create(
            "/admin/tickets/{$ticket->id}",
            'PATCH',
            [
                'client_id' => $client->id,
                'ticket_number' => 'ACME-001',
                'title' => 'Updated issue title',
                'description' => 'Updated issue description',
                'priority' => 'medium',
                'status' => 'open',
            ]
        );

        $controller = new AdminTicketController(new NotificationService);

        $response = $controller->update($request, $ticket->id);

        $this->assertSame(302, $response->getStatusCode());
        $this->assertDatabaseHas('tickets', [
            'id' => $ticket->id,
            'organization_user_id' => null,
            'title' => 'Updated issue title',
            'priority' => 'medium',
        ]);
    }

    public function test_ticket_update_creates_status_history_when_status_changes(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user);

        $client = Client::create([
            'name' => 'Acme Corporation',
            'status' => 'active',
        ]);

        $ticket = Ticket::create([
            'client_id' => $client->id,
            'organization_user_id' => null,
            'created_by' => $user->id,
            'ticket_number' => 'ACME-002',
            'title' => 'Original issue title',
            'description' => 'Original issue description',
            'category' => 'technical',
            'priority' => 'low',
            'status' => 'open',
        ]);

        $notificationService = $this->createMock(NotificationService::class);
        $notificationService
            ->expects($this->once())
            ->method('sendTicketStatusChangeExternalNotification')
            ->with($ticket->id, 'Updated issue title', 'closed', $user->id);

        $request = Request::create(
            "/admin/tickets/{$ticket->id}",
            'PATCH',
            [
                'client_id' => $client->id,
                'ticket_number' => 'ACME-002',
                'title' => 'Updated issue title',
                'description' => 'Updated issue description',
                'priority' => 'medium',
                'status' => 'closed',
            ]
        );

        $controller = new AdminTicketController($notificationService);

        $response = $controller->update($request, $ticket->id);

        $this->assertSame(302, $response->getStatusCode());
        $this->assertDatabaseHas('ticket_histories', [
            'ticket_id' => $ticket->id,
            'old_status' => 'open',
            'new_status' => 'closed',
            'action_type' => 'closed',
            'changed_by' => $user->id,
        ]);
    }

    public function test_ticket_status_endpoint_creates_status_history_when_status_changes(): void
    {
        $user = User::factory()->create();
        $role = Role::create([
            'name' => 'Super Admin',
            'slug' => 'super-admin',
            'guard_name' => 'web',
        ]);
        $user->roles()->attach($role);
        $user->load('roles');
        $this->actingAs($user);

        $client = Client::create([
            'name' => 'Acme Corporation',
            'status' => 'active',
        ]);

        $ticket = Ticket::create([
            'client_id' => $client->id,
            'organization_user_id' => null,
            'created_by' => $user->id,
            'ticket_number' => 'ACME-003',
            'title' => 'Status endpoint issue',
            'description' => 'Original issue description',
            'category' => 'technical',
            'priority' => 'low',
            'status' => 'open',
        ]);

        $notificationService = $this->createMock(NotificationService::class);
        $notificationService
            ->expects($this->once())
            ->method('sendTicketStatusChangeExternalNotification')
            ->with($ticket->id, 'Status endpoint issue', 'closed', $user->id);

        $request = Request::create(
            "/admin/tickets/{$ticket->id}/status",
            'PATCH',
            ['status' => 'closed']
        );

        $controller = new AdminTicketController($notificationService);

        $response = $controller->updateStatus($request, $ticket->id);

        $this->assertSame(200, $response->getStatusCode());
        $this->assertDatabaseHas('ticket_histories', [
            'ticket_id' => $ticket->id,
            'old_status' => 'open',
            'new_status' => 'closed',
            'action_type' => 'closed',
            'changed_by' => $user->id,
        ]);
    }

    public function test_ticket_status_endpoint_does_not_create_status_history_when_status_is_unchanged(): void
    {
        $user = User::factory()->create();
        $role = Role::create([
            'name' => 'Super Admin',
            'slug' => 'super-admin',
            'guard_name' => 'web',
        ]);
        $user->roles()->attach($role);
        $user->load('roles');
        $this->actingAs($user);

        $client = Client::create([
            'name' => 'Acme Corporation',
            'status' => 'active',
        ]);

        $ticket = Ticket::create([
            'client_id' => $client->id,
            'organization_user_id' => null,
            'created_by' => $user->id,
            'ticket_number' => 'ACME-004',
            'title' => 'Unchanged status issue',
            'description' => 'Original issue description',
            'category' => 'technical',
            'priority' => 'low',
            'status' => 'closed',
        ]);

        $notificationService = $this->createMock(NotificationService::class);
        $notificationService
            ->expects($this->never())
            ->method('sendTicketStatusChangeExternalNotification');

        $request = Request::create(
            "/admin/tickets/{$ticket->id}/status",
            'PATCH',
            ['status' => 'closed']
        );

        $controller = new AdminTicketController($notificationService);

        $response = $controller->updateStatus($request, $ticket->id);

        $this->assertSame(200, $response->getStatusCode());
        $this->assertSame(0, TicketHistory::where('ticket_id', $ticket->id)->count());
    }

    public function test_latest_closed_history_returns_the_most_recent_closed_event(): void
    {
        $user = User::factory()->create();
        $client = Client::create([
            'name' => 'Acme Corporation',
            'status' => 'active',
        ]);

        $ticket = Ticket::create([
            'client_id' => $client->id,
            'organization_user_id' => null,
            'created_by' => $user->id,
            'ticket_number' => 'ACME-005',
            'title' => 'Repeated closure issue',
            'description' => 'Original issue description',
            'category' => 'technical',
            'priority' => 'low',
            'status' => 'closed',
        ]);

        TicketHistory::create([
            'ticket_id' => $ticket->id,
            'old_status' => 'in-progress',
            'new_status' => 'closed',
            'action_type' => 'closed',
            'changed_by' => $user->id,
            'created_at' => now()->subHour(),
        ]);

        $latestClosedHistory = TicketHistory::create([
            'ticket_id' => $ticket->id,
            'old_status' => 'in-progress',
            'new_status' => 'closed',
            'action_type' => 'closed',
            'changed_by' => $user->id,
            'created_at' => now(),
        ]);

        $ticket->load('latestClosedHistory');

        $this->assertTrue($ticket->latestClosedHistory->is($latestClosedHistory));
    }
}
