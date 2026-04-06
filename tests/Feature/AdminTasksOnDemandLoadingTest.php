<?php

namespace Tests\Feature;

use App\Http\Middleware\ValidateUserSession;
use App\Models\Client;
use App\Models\OrganizationUser;
use App\Models\Role;
use App\Models\SlaPolicy;
use App\Models\Task;
use App\Models\Ticket;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class AdminTasksOnDemandLoadingTest extends TestCase
{
    use RefreshDatabase;

    public function test_tasks_index_does_not_include_server_rendered_tasks_payload(): void
    {
        $this->withoutMiddleware(ValidateUserSession::class);
        $admin = $this->createAdminUser();

        $this->actingAs($admin, 'web')
            ->get('/admin/tasks')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('admin/tasks/Index')
                ->missing('tasks')
                ->has('filters')
                ->has('users')
                ->has('departments')
            );
    }

    public function test_tasks_data_endpoint_returns_paginated_task_data_on_demand(): void
    {
        $this->withoutMiddleware(ValidateUserSession::class);
        $admin = $this->createAdminUser();

        $highPriorityPolicy = SlaPolicy::query()->create([
            'name' => 'High Priority',
            'description' => 'High priority SLA policy',
            'priority' => 'P1',
            'response_time_minutes' => 30,
            'resolution_time_minutes' => 120,
            'review_time_minutes' => 60,
            'escalation_steps' => [],
            'is_active' => true,
        ]);

        $lowPriorityPolicy = SlaPolicy::query()->create([
            'name' => 'Low Priority',
            'description' => 'Low priority SLA policy',
            'priority' => 'P4',
            'response_time_minutes' => 120,
            'resolution_time_minutes' => 480,
            'review_time_minutes' => 240,
            'escalation_steps' => [],
            'is_active' => true,
        ]);

        Task::query()->create([
            'title' => 'Lower priority task',
            'task_code' => 'TASK-OD-002',
            'state' => 'Draft',
            'sla_policy_id' => $lowPriorityPolicy->id,
            'created_by' => $admin->id,
        ]);

        Task::query()->create([
            'title' => 'Higher priority task',
            'task_code' => 'TASK-OD-001',
            'state' => 'Draft',
            'sla_policy_id' => $highPriorityPolicy->id,
            'created_by' => $admin->id,
        ]);

        $this->actingAs($admin, 'web')
            ->getJson('/admin/data/tasks?per_page=5&sort_by=priority&sort_order=asc')
            ->assertOk()
            ->assertJsonStructure([
                'tasks' => [
                    'data',
                    'current_page',
                    'last_page',
                    'per_page',
                    'total',
                    'from',
                    'to',
                    'links',
                ],
                'stats' => [
                    'total',
                    'draft',
                    'assigned',
                    'in_progress',
                    'blocked',
                    'in_review',
                    'done',
                    'cancelled',
                    'rejected',
                ],
            ])
            ->assertJsonPath('tasks.total', 2)
            ->assertJsonPath('tasks.per_page', 5)
            ->assertJsonPath('tasks.from', 1)
            ->assertJsonPath('tasks.to', 2)
            ->assertJsonPath('tasks.data.0.task_code', 'TASK-OD-001')
            ->assertJsonPath('stats.total', 2)
            ->assertJsonPath('stats.draft', 2);
    }

    public function test_tasks_data_endpoint_includes_ticket_client_relation(): void
    {
        $this->withoutMiddleware(ValidateUserSession::class);
        $admin = $this->createAdminUser();

        $client = Client::query()->create([
            'name' => 'Acme Client',
            'email' => 'acme-client@example.com',
            'status' => 'active',
        ]);

        $organizationUser = OrganizationUser::query()->create([
            'client_id' => $client->id,
            'name' => 'Acme Org User',
            'email' => 'acme-org@example.com',
            'status' => 'active',
        ]);

        $ticket = Ticket::query()->create([
            'client_id' => $client->id,
            'organization_user_id' => $organizationUser->id,
            'ticket_number' => 'TKT-CLIENT-001',
            'title' => 'Client linked ticket',
            'status' => 'approved',
        ]);

        Task::query()->create([
            'title' => 'Task with ticket client',
            'task_code' => 'TASK-CLIENT-001',
            'state' => 'Draft',
            'created_by' => $admin->id,
            'ticket_id' => $ticket->id,
        ]);

        $this->actingAs($admin, 'web')
            ->getJson('/admin/data/tasks?per_page=5')
            ->assertOk()
            ->assertJsonPath('tasks.data.0.ticket.ticket_number', 'TKT-CLIENT-001')
            ->assertJsonPath('tasks.data.0.ticket.client.name', 'Acme Client');
    }

    public function test_tasks_data_endpoint_sorts_by_due_date(): void
    {
        $this->withoutMiddleware(ValidateUserSession::class);
        $admin = $this->createAdminUser();

        Task::query()->create([
            'title' => 'Later due task',
            'task_code' => 'TASK-DUE-002',
            'state' => 'Draft',
            'due_at' => now()->addDays(5),
            'created_by' => $admin->id,
        ]);

        Task::query()->create([
            'title' => 'Earlier due task',
            'task_code' => 'TASK-DUE-001',
            'state' => 'Draft',
            'due_at' => now()->addDay(),
            'created_by' => $admin->id,
        ]);

        $this->actingAs($admin, 'web')
            ->getJson('/admin/data/tasks?per_page=10&sort_by=due_at&sort_order=asc')
            ->assertOk()
            ->assertJsonPath('tasks.data.0.task_code', 'TASK-DUE-001')
            ->assertJsonPath('tasks.data.1.task_code', 'TASK-DUE-002');
    }

    private function createAdminUser(): User
    {
        $role = Role::create([
            'name' => 'Admin',
            'slug' => 'admin',
            'guard_name' => 'web',
            'description' => 'Admin role',
            'is_default' => false,
            'level' => 1,
        ]);

        $user = User::factory()->create();
        $user->roles()->attach($role->id);

        return $user;
    }
}
