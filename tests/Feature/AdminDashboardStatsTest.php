<?php

namespace Tests\Feature;

use App\Models\Client;
use App\Models\Task;
use App\Models\Ticket;
use App\Models\User;
use App\Services\DashboardService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Tests\TestCase;

class AdminDashboardStatsTest extends TestCase
{
    use RefreshDatabase;

    protected function tearDown(): void
    {
        Carbon::setTestNow();

        parent::tearDown();
    }

    public function test_admin_dashboard_stats_are_aggregated_with_status_distributions(): void
    {
        Carbon::setTestNow(Carbon::parse('2026-06-27 10:00:00'));

        User::factory()->create(['last_login_at' => now()]);
        User::factory()->create(['last_login_at' => now()->subDay()]);

        $client = Client::create([
            'name' => 'Acme Corporation',
            'status' => 'active',
        ]);

        $this->createTicket($client, 'TCK-001', 'open', now());
        $this->createTicket($client, 'TCK-002', 'approved', now()->subDay());
        $this->createTicket($client, 'TCK-003', 'in-progress', now()->subDay());
        $this->createTicket($client, 'TCK-004', 'closed', now());
        $this->createTicket($client, 'TCK-005', 'cancelled', now()->subDay());

        Task::factory()->create(['state' => 'Draft']);
        Task::factory()->create(['state' => 'Assigned']);
        Task::factory()->create(['state' => 'Blocked']);
        Task::factory()->create(['state' => 'InProgress']);
        Task::factory()->create(['state' => 'InReview']);
        Task::factory()->create(['state' => 'Done', 'updated_at' => now()]);
        Task::factory()->create(['state' => 'Rejected', 'updated_at' => now()->subDay()]);
        $softDeletedCompletedTask = Task::factory()->create(['state' => 'Cancelled', 'updated_at' => now()]);
        $softDeletedCompletedTask->delete();

        $stats = app(DashboardService::class)->getAdminStats();

        $this->assertSame(5, $stats['total_tickets']);
        $this->assertSame(8, $stats['total_tasks']);
        $this->assertSame(1, $stats['open_tickets']);
        $this->assertSame(1, $stats['tickets_closed_today']);
        $this->assertSame(3, $stats['pending_tasks']);
        $this->assertSame(2, $stats['tasks_completed_today']);
        $this->assertSame(1, $stats['active_users_today']);
        $this->assertSame(2, $stats['tickets_created_today']);
        $this->assertSame([
            'open' => 1,
            'approved' => 1,
            'in_progress' => 1,
            'closed' => 1,
            'cancelled' => 1,
        ], $stats['ticket_status_distribution']);
        $this->assertSame([
            'pending' => 3,
            'in_progress' => 2,
            'waiting' => 1,
            'completed' => 2,
        ], $stats['task_status_distribution']);
    }

    private function createTicket(Client $client, string $ticketNumber, string $status, Carbon $createdAt): Ticket
    {
        return Ticket::unguarded(fn () => Ticket::create([
            'client_id' => $client->id,
            'organization_user_id' => null,
            'ticket_number' => $ticketNumber,
            'title' => $ticketNumber,
            'description' => 'Dashboard stats fixture.',
            'category' => 'technical',
            'priority' => 'medium',
            'status' => $status,
            'created_at' => $createdAt,
            'updated_at' => $createdAt,
        ]));
    }
}
