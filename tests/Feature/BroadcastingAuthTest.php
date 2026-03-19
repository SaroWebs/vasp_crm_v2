<?php

namespace Tests\Feature;

use App\Models\Client;
use App\Models\OrganizationUser;
use App\Models\Ticket;
use Illuminate\Contracts\Broadcasting\Factory as BroadcastFactory;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BroadcastingAuthTest extends TestCase
{
    use RefreshDatabase;

    public function test_org_user_can_authorize_private_ticket_channel_for_own_ticket(): void
    {
        $client = Client::create([
            'name' => 'Client A',
            'code' => 'client-a',
            'status' => 'active',
            'sso_enabled' => true,
            'sso_secret' => base64_encode(random_bytes(32)),
        ]);

        $organizationUser = OrganizationUser::create([
            'client_id' => $client->id,
            'email' => 'person@example.com',
            'name' => 'Person',
            'status' => 'active',
        ]);

        $ticket = Ticket::create([
            'client_id' => $client->id,
            'organization_user_id' => $organizationUser->id,
            'ticket_number' => 'T-1',
            'title' => 'Ticket',
            'description' => 'Help',
            'category' => 'general',
            'priority' => 'low',
            'status' => 'open',
        ]);

        $callback = app(BroadcastFactory::class)
            ->driver()
            ->getChannels()
            ->get('ticket.{ticketId}');

        $this->assertIsCallable($callback);
        $this->assertTrue((bool) $callback($organizationUser, (string) $ticket->id));
    }

    public function test_org_user_cannot_authorize_private_ticket_channel_for_other_ticket(): void
    {
        $client = Client::create([
            'name' => 'Client A',
            'code' => 'client-a',
            'status' => 'active',
            'sso_enabled' => true,
            'sso_secret' => base64_encode(random_bytes(32)),
        ]);

        $owner = OrganizationUser::create([
            'client_id' => $client->id,
            'email' => 'owner@example.com',
            'name' => 'Owner',
            'status' => 'active',
        ]);

        $other = OrganizationUser::create([
            'client_id' => $client->id,
            'email' => 'other@example.com',
            'name' => 'Other',
            'status' => 'active',
        ]);

        $ticket = Ticket::create([
            'client_id' => $client->id,
            'organization_user_id' => $owner->id,
            'ticket_number' => 'T-2',
            'title' => 'Ticket',
            'description' => 'Help',
            'category' => 'general',
            'priority' => 'low',
            'status' => 'open',
        ]);

        $callback = app(BroadcastFactory::class)
            ->driver()
            ->getChannels()
            ->get('ticket.{ticketId}');

        $this->assertIsCallable($callback);
        $this->assertFalse((bool) $callback($other, (string) $ticket->id));
    }
}
