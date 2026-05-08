<?php

namespace Tests\Feature;

use App\Http\Middleware\AdminMiddleware;
use App\Http\Middleware\ValidateUserSession;
use App\Models\Client;
use App\Models\Role;
use App\Models\Task;
use App\Models\Ticket;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class DashboardStatsEndpointTest extends TestCase
{
    use RefreshDatabase;

    /** @test */
    public function it_returns_admin_dashboard_stats_with_ticket_and_task_counts(): void
    {
        $admin = User::factory()->create();

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

        Ticket::withoutEvents(function () use ($admin, $client): void {
            Ticket::query()->create([
                'client_id' => $client->id,
                'organization_user_id' => null,
                'created_by' => $admin->id,
                'ticket_number' => 'TKT-'.Str::upper(Str::random(10)),
                'title' => 'Open ticket',
                'status' => 'open',
                'priority' => 'low',
                'category' => 'technical',
            ]);

            Ticket::query()->create([
                'client_id' => $client->id,
                'organization_user_id' => null,
                'created_by' => $admin->id,
                'ticket_number' => 'TKT-'.Str::upper(Str::random(10)),
                'title' => 'Closed ticket',
                'status' => 'closed',
                'priority' => 'low',
                'category' => 'technical',
            ]);
        });

        Task::withoutEvents(function () use ($admin): void {
            Task::query()->create([
                'task_code' => 'TASK-'.Str::upper(Str::random(10)),
                'title' => 'Draft task one',
                'state' => 'Draft',
                'created_by' => $admin->id,
            ]);

            Task::query()->create([
                'task_code' => 'TASK-'.Str::upper(Str::random(10)),
                'title' => 'Draft task two',
                'state' => 'Draft',
                'created_by' => $admin->id,
            ]);

            Task::query()->create([
                'task_code' => 'TASK-'.Str::upper(Str::random(10)),
                'title' => 'Done task',
                'state' => 'Done',
                'created_by' => $admin->id,
            ]);
        });

        $this->withoutMiddleware([
            ValidateUserSession::class,
            AdminMiddleware::class,
        ]);

        $response = $this->actingAs($admin, 'web')->getJson('/admin/api/dashboard/stats');

        $response->assertOk();
        $response->assertJsonPath('stats.open_tickets', 1);
        $response->assertJsonPath('stats.closed_tickets', 1);
        $response->assertJsonPath('stats.pending_tasks', 2);
        $response->assertJsonPath('stats.completed_tasks', 1);
    }
}
