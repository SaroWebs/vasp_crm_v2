<?php

use App\Models\Client;
use App\Models\OrganizationUser;
use App\Models\Ticket;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ClientPortalTicketTest extends TestCase
{
    use RefreshDatabase;

    public function test_org_user_cannot_access_other_clients_portal(): void
    {
        $clientA = Client::create([
            'name' => 'A',
            'code' => 'a1',
            'status' => 'active',
            'sso_enabled' => true,
            'sso_secret' => base64_encode(random_bytes(32)),
        ]);

        $clientB = Client::create([
            'name' => 'B',
            'code' => 'b1',
            'status' => 'active',
            'sso_enabled' => true,
            'sso_secret' => base64_encode(random_bytes(32)),
        ]);

        $orgUser = OrganizationUser::create([
            'client_id' => $clientA->id,
            'email' => 'person@example.com',
            'name' => 'Person',
            'status' => 'active',
        ]);

        $this->actingAs($orgUser, 'organization')
            ->get("/c/{$clientB->code}/tickets")
            ->assertStatus(403);
    }

    public function test_ticket_crud_is_scoped_and_restricted(): void
    {
        $client = Client::create([
            'name' => 'A',
            'code' => 'a1',
            'status' => 'active',
            'sso_enabled' => true,
            'sso_secret' => base64_encode(random_bytes(32)),
        ]);

        $orgUser = OrganizationUser::create([
            'client_id' => $client->id,
            'email' => 'person@example.com',
            'name' => 'Person',
            'status' => 'active',
        ]);

        $createResponse = $this->actingAs($orgUser, 'organization')->post(
            "/c/{$client->code}/tickets",
            [
                'title' => 'My Ticket',
                'description' => 'Help',
                'category' => 'general',
                'priority' => 'low',
            ],
        );

        $createResponse->assertRedirect();

        $ticket = Ticket::query()->first();
        $this->assertNotNull($ticket);

        $this->actingAs($orgUser, 'organization')
            ->patch(
                "/c/{$client->code}/tickets/{$ticket->id}",
                [
                    'title' => 'Updated',
                    'description' => 'Updated desc',
                    'category' => 'support',
                    'priority' => 'medium',
                ],
            )
            ->assertRedirect("/c/{$client->code}/tickets/{$ticket->id}");

        $ticket->refresh();
        $this->assertSame('Updated', $ticket->title);

        $this->actingAs($orgUser, 'organization')
            ->delete("/c/{$client->code}/tickets/{$ticket->id}")
            ->assertRedirect("/c/{$client->code}/tickets");

        $this->assertSoftDeleted('tickets', ['id' => $ticket->id]);
    }

    public function test_ticket_cannot_be_updated_or_deleted_once_assigned_or_not_open(): void
    {
        $client = Client::create([
            'name' => 'A',
            'code' => 'a1',
            'status' => 'active',
            'sso_enabled' => true,
            'sso_secret' => base64_encode(random_bytes(32)),
        ]);

        $orgUser = OrganizationUser::create([
            'client_id' => $client->id,
            'email' => 'person@example.com',
            'name' => 'Person',
            'status' => 'active',
        ]);

        $admin = User::factory()->create();

        $ticket = Ticket::create([
            'client_id' => $client->id,
            'organization_user_id' => $orgUser->id,
            'ticket_number' => 't-1',
            'title' => 'My Ticket',
            'description' => 'Help',
            'category' => 'general',
            'priority' => 'low',
            'status' => 'open',
            'assigned_to' => $admin->id,
        ]);

        $this->actingAs($orgUser, 'organization')
            ->patch(
                "/c/{$client->code}/tickets/{$ticket->id}",
                [
                    'title' => 'Updated',
                    'description' => 'Updated desc',
                    'category' => 'support',
                    'priority' => 'medium',
                ],
            )
            ->assertStatus(403);

        $this->actingAs($orgUser, 'organization')
            ->delete("/c/{$client->code}/tickets/{$ticket->id}")
            ->assertStatus(403);

        $ticket->update([
            'assigned_to' => null,
            'status' => 'approved',
        ]);

        $this->actingAs($orgUser, 'organization')
            ->patch(
                "/c/{$client->code}/tickets/{$ticket->id}",
                [
                    'title' => 'Updated',
                    'description' => 'Updated desc',
                    'category' => 'support',
                    'priority' => 'medium',
                ],
            )
            ->assertStatus(403);
    }
}
