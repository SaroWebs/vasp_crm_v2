<?php

namespace Tests\Feature;

use App\Http\Controllers\AdminTicketController;
use App\Models\Client;
use App\Models\Ticket;
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
}
