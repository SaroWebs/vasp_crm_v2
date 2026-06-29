<?php

namespace Tests\Feature;

use App\Http\Middleware\ValidateUserSession;
use App\Models\Client;
use App\Models\Role;
use App\Models\Ticket;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class AdminTicketIndexLazyLoadingTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutMiddleware(ValidateUserSession::class);
    }

    public function test_ticket_index_renders_without_ticket_data_or_stats(): void
    {
        $response = $this->actingAs($this->createInternalUser())
            ->get('/admin/tickets?status=open&search=printer');

        $response->assertOk();
        $response->assertInertia(fn (Assert $page) => $page
            ->component('admin/tickets/Index')
            ->where('filters.status', 'open')
            ->where('filters.search', 'printer')
            ->missing('tickets')
            ->missing('clients')
            ->missing('stats'));
    }

    public function test_ticket_data_is_loaded_from_the_dedicated_endpoint(): void
    {
        $user = $this->createInternalUser();
        $client = Client::create(['name' => 'Acme', 'status' => 'active']);
        $matchingTicket = $this->createTicket($client, $user, 'Printer offline', 'open');
        $this->createTicket($client, $user, 'Closed request', 'closed');

        $response = $this->actingAs($user)
            ->getJson('/admin/data/tickets?status=open&search=printer');

        $response->assertOk()
            ->assertJsonPath('tickets.total', 1)
            ->assertJsonPath('tickets.data.0.id', $matchingTicket->id)
            ->assertJsonPath('clients.0.id', $client->id);
    }

    public function test_ticket_stats_are_loaded_from_the_dedicated_endpoint(): void
    {
        Carbon::setTestNow('2026-06-29 10:00:00');
        $user = $this->createInternalUser();
        $client = Client::create(['name' => 'Acme', 'status' => 'active']);
        $this->createTicket($client, $user, 'Opened today', 'open');
        $this->createTicket($client, $user, 'In progress', 'in-progress');
        $this->createTicket($client, $user, 'Completed', 'closed');

        $response = $this->actingAs($user)->getJson('/admin/data/tickets/stats');

        $response->assertOk()->assertExactJson([
            'stats' => [
                'total_open' => 1,
                'open_today' => 1,
                'in_progress' => 1,
                'completed' => 1,
            ],
        ]);

        Carbon::setTestNow();
    }

    private function createInternalUser(): User
    {
        $user = User::factory()->create();
        $role = Role::create([
            'name' => 'Manager',
            'slug' => 'manager',
            'guard_name' => 'web',
            'level' => 2,
        ]);
        $user->assignRole($role);

        return $user;
    }

    private function createTicket(Client $client, User $creator, string $title, string $status): Ticket
    {
        return Ticket::create([
            'client_id' => $client->id,
            'organization_user_id' => null,
            'created_by' => $creator->id,
            'ticket_number' => fake()->unique()->bothify('TKT-####'),
            'title' => $title,
            'description' => $title,
            'category' => 'technical',
            'priority' => 'medium',
            'status' => $status,
        ]);
    }
}
