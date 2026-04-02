<?php

namespace Tests\Feature;

use App\Http\Middleware\ValidateUserSession;
use App\Models\Role;
use App\Models\TaskAssignment;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminTaskCreationAssignmentTest extends TestCase
{
    use RefreshDatabase;

    public function test_task_creation_with_selected_employee_creates_assignment_and_sets_assigned_state(): void
    {
        $this->withoutMiddleware(ValidateUserSession::class);

        $creator = $this->createSuperAdminUser();
        $assignee = User::factory()->create();

        $response = $this->actingAs($creator, 'web')->postJson('/admin/tasks', [
            'title' => 'Assigned admin task',
            'description' => 'Created with a direct assignee',
            'task_code' => 'TASK-ASSIGN-001',
            'due_at' => now()->addDay()->format('Y-m-d H:i:s'),
            'estimate_hours' => '4',
            'assignments' => [
                [
                    'user_id' => $assignee->id,
                ],
            ],
        ]);

        $response->assertCreated();
        $response->assertJsonPath('task.state', 'Assigned');

        $taskId = $response->json('task.id');

        $this->assertDatabaseHas('tasks', [
            'id' => $taskId,
            'task_code' => 'TASK-ASSIGN-001',
            'state' => 'Assigned',
            'created_by' => $creator->id,
        ]);

        $this->assertDatabaseHas('task_assignments', [
            'task_id' => $taskId,
            'user_id' => $assignee->id,
            'assigned_by' => $creator->id,
            'is_active' => 1,
        ]);

        $this->assertSame(
            1,
            TaskAssignment::query()
                ->where('task_id', $taskId)
                ->where('user_id', $assignee->id)
                ->count()
        );
    }

    private function createSuperAdminUser(): User
    {
        $role = Role::query()->create([
            'name' => 'Super Admin',
            'slug' => 'super-admin',
            'guard_name' => 'web',
            'description' => 'Super admin role',
            'is_default' => false,
            'level' => 1,
        ]);

        $user = User::factory()->create();
        $user->roles()->attach($role->id);

        return $user;
    }
}
