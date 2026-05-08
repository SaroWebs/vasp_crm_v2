<?php

namespace Tests\Feature;

use App\Http\Middleware\AdminMiddleware;
use App\Http\Middleware\ValidateUserSession;
use App\Models\Client;
use App\Models\Role;
use App\Models\Ticket;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class DashboardTicketsEndpointTest extends TestCase
{
    use RefreshDatabase;

    /** @test */
    public function it_returns_recent_tickets_with_assignment_details(): void
    {
        $admin = User::factory()->create();
        $assignee = User::factory()->create();

        $adminRole = Role::query()->create([
            'name' => 'Admin',
            'slug' => 'admin',
            'guard_name' => 'web',
            'description' => 'Admin role for tests',
            'is_default' => false,
            'level' => 10,
        ]);

        $admin->roles()->attach($adminRole->id);

        $client = Client::factory()->active()->create();

        Ticket::withoutEvents(function () use ($admin, $assignee, $client): void {
            Ticket::query()->create([
                'client_id' => $client->id,
                'organization_user_id' => null,
                'created_by' => $admin->id,
                'ticket_number' => 'TKT-'.Str::upper(Str::random(10)),
                'title' => 'Older ticket',
                'status' => 'open',
                'priority' => 'low',
                'category' => 'technical',
                'created_at' => now()->subMinutes(10),
            ]);

            Ticket::query()->create([
                'client_id' => $client->id,
                'organization_user_id' => null,
                'created_by' => $admin->id,
                'ticket_number' => 'TKT-'.Str::upper(Str::random(10)),
                'title' => 'Assigned ticket',
                'status' => 'open',
                'priority' => 'low',
                'category' => 'technical',
                'assigned_to' => $assignee->id,
                'created_at' => now()->subMinute(),
            ]);
        });

        $this->withoutMiddleware([
            ValidateUserSession::class,
            AdminMiddleware::class,
        ]);

        $response = $this->actingAs($admin, 'web')->getJson('/admin/api/dashboard/tickets');

        $response->assertOk();
        $response->assertJsonPath('tickets.0.subject', 'Assigned ticket');
        $response->assertJsonPath('tickets.0.assigned_to.name', $assignee->name);
    }
}
