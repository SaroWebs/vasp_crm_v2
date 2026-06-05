<?php

namespace Tests\Feature;

use App\Http\Middleware\ValidateUserSession;
use App\Models\Permission;
use App\Models\Role;
use App\Models\Task;
use App\Models\TaskAssignment;
use App\Models\User;
use App\Services\NotificationService;
use Illuminate\Foundation\Http\Middleware\VerifyCsrfToken;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TaskAssignmentDelegationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutMiddleware(VerifyCsrfToken::class);
        $this->withoutMiddleware(ValidateUserSession::class);
        $this->mock(NotificationService::class, function ($mock): void {
            $mock->shouldReceive('sendTaskAssignmentExternalNotification')->zeroOrMoreTimes();
        });

        Permission::create([
            'name' => 'Task Assign',
            'slug' => 'task.assign',
            'module' => 'task',
            'action' => 'assign',
        ]);
    }

    public function test_assignee_can_delegate_task_under_their_assignment(): void
    {
        [$creator, $assignee, $delegate] = User::factory()->count(3)->create();
        $task = Task::factory()->for($creator, 'createdBy')->create();

        $this->assignSuperAdminRole($creator);
        $this->giveTaskAssignPermission($assignee);

        $rootAssignment = $task->assignUser($assignee->id, $creator->id);

        $this->actingAs($assignee, 'web')
            ->postJson("/api/tasks/{$task->id}/assign", [
                'user_id' => $delegate->id,
            ])
            ->assertCreated()
            ->assertJsonPath('data.parent_assignment_id', $rootAssignment->id);

        $this->assertDatabaseHas('task_assignments', [
            'task_id' => $task->id,
            'user_id' => $delegate->id,
            'assigned_by' => $assignee->id,
            'parent_assignment_id' => $rootAssignment->id,
            'is_active' => true,
        ]);
    }

    public function test_assignee_can_remove_direct_delegate_and_all_descendants(): void
    {
        [$creator, $x2, $x6, $x9] = User::factory()->count(4)->create();
        $task = Task::factory()->for($creator, 'createdBy')->create();

        $this->assignSuperAdminRole($creator);
        $this->giveTaskAssignPermission($x2, $x6);

        $x2Assignment = $task->assignUser($x2->id, $creator->id);
        $x6Assignment = $task->assignUser($x6->id, $x2->id, parentAssignmentId: $x2Assignment->id);
        $task->assignUser($x9->id, $x6->id, parentAssignmentId: $x6Assignment->id);

        $this->actingAs($x2, 'web')
            ->postJson("/api/tasks/{$task->id}/unassign", [
                'user_id' => $x6->id,
            ])
            ->assertOk()
            ->assertJsonPath('removed_assignments_count', 2);

        $this->assertDatabaseHas('task_assignments', [
            'task_id' => $task->id,
            'user_id' => $x6->id,
            'is_active' => false,
            'unassigned_by' => $x2->id,
        ]);
        $this->assertDatabaseHas('task_assignments', [
            'task_id' => $task->id,
            'user_id' => $x9->id,
            'is_active' => false,
            'unassigned_by' => $x2->id,
        ]);
        $this->assertDatabaseHas('task_assignments', [
            'task_id' => $task->id,
            'user_id' => $x2->id,
            'is_active' => true,
        ]);
    }

    public function test_assignee_cannot_remove_indirect_descendant(): void
    {
        [$creator, $x2, $x6, $x9] = User::factory()->count(4)->create();
        $task = Task::factory()->for($creator, 'createdBy')->create();

        $this->assignSuperAdminRole($creator);
        $this->giveTaskAssignPermission($x2, $x6);

        $x2Assignment = $task->assignUser($x2->id, $creator->id);
        $x6Assignment = $task->assignUser($x6->id, $x2->id, parentAssignmentId: $x2Assignment->id);
        $task->assignUser($x9->id, $x6->id, parentAssignmentId: $x6Assignment->id);

        $this->actingAs($x2, 'web')
            ->postJson("/api/tasks/{$task->id}/unassign", [
                'user_id' => $x9->id,
            ])
            ->assertForbidden();

        $this->assertTrue(TaskAssignment::query()
            ->where('task_id', $task->id)
            ->where('user_id', $x9->id)
            ->where('is_active', true)
            ->exists());
    }

    private function assignSuperAdminRole(User $user): void
    {
        $role = Role::create([
            'name' => 'Super Admin',
            'slug' => 'super-admin',
            'guard_name' => 'web',
        ]);

        $user->assignRole($role);
    }

    private function giveTaskAssignPermission(User ...$users): void
    {
        $role = Role::firstOrCreate(
            ['slug' => 'developer'],
            ['name' => 'Developer', 'guard_name' => 'web']
        );

        foreach ($users as $user) {
            $user->assignRole($role);
            $user->giveUserPermission('task.assign');
        }
    }
}
