<?php

namespace Tests\Feature;

use App\Http\Middleware\ValidateUserSession;
use App\Models\Permission;
use App\Models\Role;
use App\Models\Task;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class TaskActionPermissionTest extends TestCase
{
    use RefreshDatabase;

    public function test_manager_can_edit_and_delete_own_and_other_tasks_on_admin_routes(): void
    {
        $this->withoutMiddleware(ValidateUserSession::class);

        $manager = $this->createUserWithRole('manager');
        $developer = $this->createUserWithRole('developer');

        $ownTask = $this->createTask($manager, 'Manager owned task');
        $otherTask = $this->createTask($developer, 'Developer owned task');

        $this->actingAs($manager, 'web')
            ->patchJson("/admin/tasks/{$ownTask->id}", $this->adminUpdatePayload($ownTask, 'Updated own task'))
            ->assertOk();

        $this->actingAs($manager, 'web')
            ->patchJson("/admin/tasks/{$otherTask->id}", $this->adminUpdatePayload($otherTask, 'Updated other task'))
            ->assertOk();

        $deleteOwnTask = $this->createTask($manager, 'Manager delete own');
        $deleteOtherTask = $this->createTask($developer, 'Manager delete other');

        $this->actingAs($manager, 'web')
            ->deleteJson("/admin/tasks/{$deleteOwnTask->id}")
            ->assertOk();

        $this->actingAs($manager, 'web')
            ->deleteJson("/admin/tasks/{$deleteOtherTask->id}")
            ->assertOk();
    }

    public function test_developer_cannot_edit_or_delete_other_users_tasks_on_admin_routes(): void
    {
        $this->assertCannotManageOthersTask('developer');
    }

    public function test_hr_cannot_edit_or_delete_other_users_tasks_on_admin_routes(): void
    {
        $this->assertCannotManageOthersTask('hr');
    }

    public function test_support_agent_cannot_edit_or_delete_other_users_tasks_on_admin_routes(): void
    {
        $this->assertCannotManageOthersTask('support-agent');
    }

    public function test_developer_hr_and_support_agent_can_edit_and_delete_own_tasks_on_admin_routes(): void
    {
        $this->withoutMiddleware(ValidateUserSession::class);

        foreach (['developer', 'hr', 'support-agent'] as $roleSlug) {
            $user = $this->createUserWithRole($roleSlug);
            $task = $this->createTask($user, "{$roleSlug} own task");

            $this->actingAs($user, 'web')
                ->patchJson("/admin/tasks/{$task->id}", $this->adminUpdatePayload($task, "Updated {$roleSlug} own task"))
                ->assertOk();

            $deleteTask = $this->createTask($user, "{$roleSlug} own delete task");

            $this->actingAs($user, 'web')
                ->deleteJson("/admin/tasks/{$deleteTask->id}")
                ->assertOk();
        }
    }

    public function test_unauthorized_admin_task_manage_routes_return_403(): void
    {
        $this->withoutMiddleware(ValidateUserSession::class);

        $developer = $this->createUserWithRole('developer');
        $owner = $this->createUserWithRole('manager');
        $task = $this->createTask($owner, 'Protected task');

        $this->actingAs($developer, 'web')
            ->get("/admin/tasks/{$task->id}/edit")
            ->assertForbidden();

        $this->actingAs($developer, 'web')
            ->patchJson("/admin/tasks/{$task->id}", $this->adminUpdatePayload($task, 'Should fail update'))
            ->assertForbidden();

        $this->actingAs($developer, 'web')
            ->patchJson("/admin/tasks/{$task->id}/dates", [
                'start_at' => now()->addDay()->toDateTimeString(),
                'due_at' => now()->addDays(2)->toDateTimeString(),
            ])
            ->assertForbidden();

        $this->actingAs($developer, 'web')
            ->deleteJson("/admin/tasks/{$task->id}")
            ->assertForbidden();

        $deletedTask = $this->createTask($owner, 'Deleted protected task');
        $deletedTask->delete();

        $this->actingAs($developer, 'web')
            ->postJson("/admin/tasks/{$deletedTask->id}/restore")
            ->assertForbidden();

        $this->actingAs($developer, 'web')
            ->deleteJson("/admin/tasks/{$deletedTask->id}/force-delete")
            ->assertForbidden();
    }

    public function test_manager_can_manage_other_users_tasks_on_data_routes(): void
    {
        $this->withoutMiddleware(ValidateUserSession::class);

        $manager = $this->createUserWithRole('manager');
        $developer = $this->createUserWithRole('developer');
        $task = $this->createTask($developer, 'Developer task for manager');

        $this->actingAs($manager, 'web')
            ->patchJson("/data/tasks/{$task->id}", [
                'title' => 'Manager updated through data route',
            ])
            ->assertOk();

        $deleteTask = $this->createTask($developer, 'Developer task to delete');

        $this->actingAs($manager, 'web')
            ->deleteJson("/data/tasks/{$deleteTask->id}")
            ->assertOk();
    }

    public function test_admin_task_data_marks_can_manage_task_consistently(): void
    {
        $this->withoutMiddleware(ValidateUserSession::class);

        $developer = $this->createUserWithRole('developer');
        $manager = $this->createUserWithRole('manager');

        $ownTask = $this->createTask($developer, 'Own task');
        $otherTask = $this->createTask($manager, 'Other task');

        $response = $this->actingAs($developer, 'web')
            ->getJson('/admin/data/tasks');

        $response->assertOk();

        $tasks = collect($response->json('tasks.data'));
        $ownTaskPayload = $tasks->firstWhere('id', $ownTask->id);
        $otherTaskPayload = $tasks->firstWhere('id', $otherTask->id);

        $this->assertNotNull($ownTaskPayload);
        $this->assertNotNull($otherTaskPayload);
        $this->assertTrue((bool) ($ownTaskPayload['can_manage_task'] ?? false));
        $this->assertFalse((bool) ($otherTaskPayload['can_manage_task'] ?? true));
    }

    private function assertCannotManageOthersTask(string $roleSlug): void
    {
        $this->withoutMiddleware(ValidateUserSession::class);

        $actor = $this->createUserWithRole($roleSlug);
        $owner = $this->createUserWithRole('manager');
        $task = $this->createTask($owner, "{$roleSlug} target task");

        $this->actingAs($actor, 'web')
            ->patchJson("/admin/tasks/{$task->id}", $this->adminUpdatePayload($task, "Updated {$roleSlug} forbidden"))
            ->assertForbidden()
            ->assertJsonPath('message', 'You are not authorized to manage this task');

        $this->actingAs($actor, 'web')
            ->deleteJson("/admin/tasks/{$task->id}")
            ->assertForbidden()
            ->assertJsonPath('message', 'You are not authorized to manage this task');
    }

    private function adminUpdatePayload(Task $task, string $title): array
    {
        return [
            'title' => $title,
            'task_code' => $task->task_code,
            'parent_task_id' => null,
        ];
    }

    private function createTask(User $creator, string $title): Task
    {
        return Task::query()->create([
            'task_code' => 'TASK-'.Str::upper(Str::random(10)),
            'title' => $title,
            'state' => 'Draft',
            'created_by' => $creator->id,
        ]);
    }

    private function createUserWithRole(string $roleSlug): User
    {
        $roleNameBySlug = [
            'super-admin' => 'Super Admin',
            'manager' => 'Manager',
            'developer' => 'Developer',
            'hr' => 'HR',
            'support-agent' => 'Support Agent',
        ];

        $role = Role::query()->firstOrCreate(
            ['slug' => $roleSlug],
            [
                'name' => $roleNameBySlug[$roleSlug] ?? Str::title(str_replace('-', ' ', $roleSlug)),
                'guard_name' => 'web',
                'description' => "{$roleSlug} role",
                'is_default' => false,
                'level' => 1,
            ]
        );

        foreach ([
            ['name' => 'Read Task', 'slug' => 'task.read', 'module' => 'task', 'action' => 'read'],
            ['name' => 'Update Task', 'slug' => 'task.update', 'module' => 'task', 'action' => 'update'],
            ['name' => 'Delete Task', 'slug' => 'task.delete', 'module' => 'task', 'action' => 'delete'],
        ] as $permissionData) {
            $permission = Permission::query()->firstOrCreate(
                ['slug' => $permissionData['slug']],
                $permissionData
            );

            $role->permissions()->syncWithoutDetaching([$permission->id]);
        }

        $user = User::factory()->create();
        $user->roles()->syncWithoutDetaching([$role->id]);

        return $user;
    }
}
