<?php

namespace Tests\Feature;

use App\Http\Middleware\ValidateUserSession;
use App\Models\Role;
use App\Models\Task;
use App\Models\TaskTimeEntry;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Tests\TestCase;

class AdminTaskTimeEntryDeleteTest extends TestCase
{
    use RefreshDatabase;

    public function test_super_admin_can_delete_completed_time_entry(): void
    {
        $this->withoutMiddleware(ValidateUserSession::class);

        $user = $this->createSuperAdminUser();
        $task = Task::query()->create([
            'task_code' => 'TASK-DELETE-'.uniqid(),
            'title' => 'Delete time entry task',
            'created_by' => $user->id,
        ]);

        $entryA = TaskTimeEntry::query()->create([
            'task_id' => $task->id,
            'user_id' => $user->id,
            'start_time' => Carbon::now()->subHours(3),
            'end_time' => Carbon::now()->subHours(2),
            'description' => null,
            'is_active' => false,
        ]);

        $entryB = TaskTimeEntry::query()->create([
            'task_id' => $task->id,
            'user_id' => $user->id,
            'start_time' => Carbon::now()->subHours(2),
            'end_time' => Carbon::now()->subHour(),
            'description' => null,
            'is_active' => false,
        ]);

        $response = $this->actingAs($user, 'web')->deleteJson(
            "/admin/tasks/{$task->id}/time-entries/{$entryA->id}",
        );

        $response->assertOk();
        $response->assertJsonPath('success', true);
        $response->assertJsonCount(1, 'time_entries');
        $response->assertJsonPath('time_entries.0.id', $entryB->id);

        $this->assertSoftDeleted('task_time_entries', [
            'id' => $entryA->id,
            'task_id' => $task->id,
        ]);
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
