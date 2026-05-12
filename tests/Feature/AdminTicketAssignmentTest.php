<?php

namespace Tests\Feature;

use App\Http\Middleware\AdminMiddleware;
use App\Http\Middleware\ValidateUserSession;
use App\Models\Client;
use App\Models\OrganizationUser;
use App\Models\Role;
use App\Models\Task;
use App\Models\TaskHistory;
use App\Models\Ticket;
use App\Models\User;
use App\Services\NotificationService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminTicketAssignmentTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    protected function setUp(): void
    {
        parent::setUp();

        $this->admin = User::factory()->create();

        $superAdminRole = Role::create([
            'name' => 'Super Admin',
            'slug' => 'super-admin',
            'guard_name' => 'web',
            'level' => 999,
        ]);

        $this->admin->roles()->attach($superAdminRole->id);

        $this->mock(NotificationService::class, function ($mock) {
            $mock->shouldReceive('sendTicketAssignmentExternalNotification')->andReturnNull();
            $mock->shouldReceive('sendTicketStatusChangeExternalNotification')->andReturnNull();
        });

        $this->withoutMiddleware([
            ValidateUserSession::class,
            AdminMiddleware::class,
        ]);
    }

    /** @test */
    public function ticket_reassignment_reuses_existing_task_instead_of_creating_a_new_one(): void
    {
        $client = Client::factory()->active()->create();

        $organizationUser = OrganizationUser::create([
            'client_id' => $client->id,
            'name' => 'Acme User',
            'email' => 'acme@example.com',
            'status' => 'active',
        ]);

        $ticket = Ticket::create([
            'client_id' => $client->id,
            'organization_user_id' => $organizationUser->id,
            'ticket_number' => 'TKT-0001',
            'title' => 'Ticket A',
            'description' => 'Ticket description',
            'category' => 'technical',
            'priority' => 'low',
            'status' => 'open',
        ]);

        $assigneeOne = User::factory()->create();
        $assigneeTwo = User::factory()->create();

        $this->actingAs($this->admin, 'web')
            ->postJson("/admin/ticket/{$ticket->id}/assign", [
                'assignedTo' => $assigneeOne->id,
                'task' => [
                    'assignment_notes' => 'First assignment',
                ],
            ])
            ->assertOk();

        $this->assertDatabaseCount('tasks', 1);
        $taskId = Task::query()->where('ticket_id', $ticket->id)->value('id');
        $this->assertNotNull($taskId);

        $this->actingAs($this->admin, 'web')
            ->postJson("/admin/ticket/{$ticket->id}/assign", [
                'assignedTo' => $assigneeTwo->id,
                'task' => [
                    'assignment_notes' => 'Reassigned',
                ],
            ])
            ->assertOk();

        $this->assertDatabaseCount('tasks', 1);
        $this->assertDatabaseHas('tasks', [
            'id' => $taskId,
            'ticket_id' => $ticket->id,
            'current_owner_id' => $assigneeTwo->id,
            'current_owner_kind' => 'USER',
        ]);

        $this->assertEquals(1, (int) Task::find($taskId)->taskAssignments()->where('is_active', true)->count());
        $this->assertEquals(2, (int) Task::find($taskId)->taskAssignments()->count());
    }

    /** @test */
    public function check_task_status_indicates_task_activity_when_present(): void
    {
        $client = Client::factory()->active()->create();

        $organizationUser = OrganizationUser::create([
            'client_id' => $client->id,
            'name' => 'Acme User',
            'email' => 'acme2@example.com',
            'status' => 'active',
        ]);

        $ticket = Ticket::create([
            'client_id' => $client->id,
            'organization_user_id' => $organizationUser->id,
            'ticket_number' => 'TKT-0002',
            'title' => 'Ticket B',
            'description' => 'Ticket description',
            'category' => 'technical',
            'priority' => 'low',
            'status' => 'in-progress',
        ]);

        $task = Task::create([
            'task_code' => 'TSK-TKT-0002-TEST',
            'title' => 'Task for Ticket B',
            'description' => 'Task description',
            'ticket_id' => $ticket->id,
            'created_by' => $this->admin->id,
            'state' => 'Assigned',
            'current_owner_kind' => 'USER',
            'current_owner_id' => User::factory()->create()->id,
            'start_at' => now(),
        ]);

        TaskHistory::create([
            'task_id' => $task->id,
            'old_status' => 'Assigned',
            'new_status' => 'InProgress',
            'changed_by' => $this->admin->id,
        ]);

        $response = $this->actingAs($this->admin, 'web')
            ->getJson("/admin/tickets/{$ticket->id}/check-tasks")
            ->assertOk();

        $response->assertJson([
            'has_task_activity' => true,
            'task_activity_task_count' => 1,
        ]);
    }
}
