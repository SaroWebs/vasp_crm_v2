<?php

namespace Tests\Feature;

use App\Http\Middleware\AdminMiddleware;
use App\Http\Middleware\ValidateUserSession;
use App\Models\Role;
use App\Models\Task;
use App\Models\TaskAssignment;
use App\Models\TaskTimeEntry;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;
use Tests\TestCase;

class SharedTaskTimeTrackingTest extends TestCase
{
    use RefreshDatabase;

    private Role $superAdminRole;

    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutMiddleware(AdminMiddleware::class);
        $this->withoutMiddleware(ValidateUserSession::class);
        Carbon::setTestNow(Carbon::parse('2026-04-13 10:00:00'));

        $this->superAdminRole = Role::query()->firstOrCreate(
            ['slug' => 'super-admin'],
            [
                'name' => 'Super Admin',
                'guard_name' => 'web',
                'description' => 'Super admin role for tests',
                'is_default' => false,
                'level' => 1,
            ]
        );
    }

    public function test_one_users_shared_task_timer_does_not_block_other_users_from_starting_their_task(): void
    {
        $userA = $this->createInternalUser();
        $userB = $this->createInternalUser();

        $sharedTask = $this->createTask($userA->id, 'Shared task');
        $otherTaskForB = $this->createTask($userB->id, 'Independent task for B');

        $this->assignTaskToUser($sharedTask->id, $userA->id);
        $this->assignTaskToUser($sharedTask->id, $userB->id);
        $this->assignTaskToUser($otherTaskForB->id, $userB->id);

        $this->actingAs($userA, 'web')
            ->postJson("/my/tasks/{$sharedTask->id}/start")
            ->assertOk();

        $this->actingAs($userB, 'web')
            ->postJson("/my/tasks/{$otherTaskForB->id}/start")
            ->assertOk();

        $this->assertDatabaseHas('task_time_entries', [
            'task_id' => $sharedTask->id,
            'user_id' => $userA->id,
            'is_active' => 1,
        ]);

        $this->assertDatabaseHas('task_time_entries', [
            'task_id' => $otherTaskForB->id,
            'user_id' => $userB->id,
            'is_active' => 1,
        ]);
    }

    public function test_ending_one_assignees_entry_does_not_complete_shared_task_for_all(): void
    {
        $userA = $this->createInternalUser();
        $userB = $this->createInternalUser();

        $sharedTask = $this->createTask($userA->id, 'Shared task');

        $this->assignTaskToUser($sharedTask->id, $userA->id);
        $this->assignTaskToUser($sharedTask->id, $userB->id);

        $this->actingAs($userA, 'web')
            ->postJson("/my/tasks/{$sharedTask->id}/start")
            ->assertOk();

        $this->actingAs($userA, 'web')
            ->postJson("/my/tasks/{$sharedTask->id}/end")
            ->assertOk();

        $sharedTask->refresh();

        $this->assertNotSame('Done', $sharedTask->state);

        $this->actingAs($userB, 'web')
            ->postJson("/my/tasks/{$sharedTask->id}/start")
            ->assertOk();

        $this->assertDatabaseHas('task_time_entries', [
            'task_id' => $sharedTask->id,
            'user_id' => $userB->id,
            'is_active' => 1,
        ]);
    }

    public function test_start_is_idempotent_for_same_user_and_task(): void
    {
        $user = $this->createInternalUser();
        $task = $this->createTask($user->id, 'Idempotent task');

        $this->assignTaskToUser($task->id, $user->id);

        $this->actingAs($user, 'web')
            ->postJson("/my/tasks/{$task->id}/start")
            ->assertOk();

        $this->actingAs($user, 'web')
            ->postJson("/my/tasks/{$task->id}/start")
            ->assertOk()
            ->assertJsonPath('message', 'Task is already being tracked by this user');

        $activeEntriesCount = TaskTimeEntry::query()
            ->where('task_id', $task->id)
            ->where('user_id', $user->id)
            ->where('is_active', true)
            ->count();

        $this->assertSame(1, $activeEntriesCount);
    }

    public function test_task_show_includes_user_scoped_tracking_fields_for_shared_tasks(): void
    {
        $userA = $this->createInternalUser();
        $userB = $this->createInternalUser();

        $sharedTask = $this->createTask($userA->id, 'Shared visibility task');
        $this->assignTaskToUser($sharedTask->id, $userA->id);
        $this->assignTaskToUser($sharedTask->id, $userB->id);

        $this->actingAs($userA, 'web')
            ->postJson("/my/tasks/{$sharedTask->id}/start")
            ->assertOk();

        $this->actingAs($userB, 'web')
            ->getJson("/data/tasks/{$sharedTask->id}")
            ->assertOk()
            ->assertJsonPath('data.my_is_tracking', false)
            ->assertJsonPath('data.other_active_users_count', 1);
    }

    private function createTask(int $creatorUserId, string $title): Task
    {
        return Task::query()->create([
            'task_code' => 'TASK-'.Str::upper(Str::random(10)),
            'title' => $title,
            'state' => 'Assigned',
            'created_by' => $creatorUserId,
            'due_at' => now()->addDays(3),
            'estimate_hours' => 6,
        ]);
    }

    private function assignTaskToUser(int $taskId, int $userId): void
    {
        TaskAssignment::query()->create([
            'task_id' => $taskId,
            'user_id' => $userId,
            'is_active' => true,
            'state' => 'pending',
            'assigned_at' => now(),
        ]);
    }

    private function createInternalUser(): User
    {
        $user = User::factory()->create();
        $user->roles()->syncWithoutDetaching([$this->superAdminRole->id]);

        return $user;
    }
}
