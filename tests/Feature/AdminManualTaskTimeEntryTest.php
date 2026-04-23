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

class AdminManualTaskTimeEntryTest extends TestCase
{
    use RefreshDatabase;

    public function test_super_admin_can_create_manual_task_time_entry(): void
    {
        $this->withoutMiddleware(ValidateUserSession::class);

        $user = $this->createSuperAdminUser();
        $task = Task::query()->create([
            'task_code' => 'TASK-MANUAL-'.uniqid(),
            'title' => 'Manual time entry task',
            'created_by' => $user->id,
        ]);

        $start = Carbon::now()->subHours(2);
        $end = Carbon::now()->subHour();

        $response = $this->actingAs($user, 'web')->postJson(
            "/admin/tasks/{$task->id}/time-entries/manual",
            [
                'start_time' => $start->toISOString(),
                'end_time' => $end->toISOString(),
                'description' => 'Missed time entry',
            ],
        );

        $response->assertCreated();
        $response->assertJsonPath('success', true);

        $entryId = $response->json('time_entry.id');

        $this->assertDatabaseHas('task_time_entries', [
            'id' => $entryId,
            'task_id' => $task->id,
            'user_id' => $user->id,
            'is_active' => 0,
            'description' => 'Missed time entry',
        ]);
    }

    public function test_manual_time_entry_rejects_future_times(): void
    {
        $this->withoutMiddleware(ValidateUserSession::class);

        Carbon::setTestNow(Carbon::parse('2026-04-23 12:00:00'));

        $user = $this->createSuperAdminUser();
        $task = Task::query()->create([
            'task_code' => 'TASK-MANUAL-'.uniqid(),
            'title' => 'Manual time entry task',
            'created_by' => $user->id,
        ]);

        $response = $this->actingAs($user, 'web')->postJson(
            "/admin/tasks/{$task->id}/time-entries/manual",
            [
                'start_time' => Carbon::now()->addHour()->toISOString(),
                'end_time' => Carbon::now()->addHours(2)->toISOString(),
                'description' => 'Future time entry',
            ],
        );

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['start_time', 'end_time']);

        Carbon::setTestNow();
    }

    public function test_manual_time_entry_rejects_overlapping_time_entries(): void
    {
        $this->withoutMiddleware(ValidateUserSession::class);

        Carbon::setTestNow(Carbon::parse('2026-04-23 12:00:00'));

        $user = $this->createSuperAdminUser();
        $task = Task::query()->create([
            'task_code' => 'TASK-MANUAL-'.uniqid(),
            'title' => 'Manual time entry task',
            'created_by' => $user->id,
        ]);

        TaskTimeEntry::query()->create([
            'task_id' => $task->id,
            'user_id' => $user->id,
            'start_time' => Carbon::now()->subHours(2),
            'end_time' => Carbon::now()->subHour(),
            'description' => null,
            'is_active' => false,
        ]);

        $response = $this->actingAs($user, 'web')->postJson(
            "/admin/tasks/{$task->id}/time-entries/manual",
            [
                'start_time' => Carbon::now()->subMinutes(90)->toISOString(),
                'end_time' => Carbon::now()->subMinutes(30)->toISOString(),
                'description' => 'Overlapping time entry',
            ],
        );

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['start_time']);

        Carbon::setTestNow();
    }

    public function test_super_admin_can_batch_update_completed_time_entries(): void
    {
        $this->withoutMiddleware(ValidateUserSession::class);

        $user = $this->createSuperAdminUser();
        $task = Task::query()->create([
            'task_code' => 'TASK-MANUAL-'.uniqid(),
            'title' => 'Manual batch update task',
            'created_by' => $user->id,
        ]);

        $entry = TaskTimeEntry::query()->create([
            'task_id' => $task->id,
            'user_id' => $user->id,
            'start_time' => Carbon::now()->subHours(3),
            'end_time' => Carbon::now()->subHours(2),
            'description' => null,
            'is_active' => false,
        ]);

        $newStart = Carbon::now()->subHours(4);
        $newEnd = Carbon::now()->subHours(3);

        $response = $this->actingAs($user, 'web')->patchJson(
            "/admin/tasks/{$task->id}/time-entries/batch",
            [
                'entries' => [
                    [
                        'id' => $entry->id,
                        'start_time' => $newStart->toISOString(),
                        'end_time' => $newEnd->toISOString(),
                    ],
                ],
            ],
        );

        $response->assertOk();
        $response->assertJsonPath('success', true);

        $entry->refresh();
        $this->assertSame($newStart->getTimestamp(), $entry->start_time->getTimestamp());
        $this->assertSame($newEnd->getTimestamp(), $entry->end_time->getTimestamp());
    }

    public function test_batch_update_rejects_active_time_entry(): void
    {
        $this->withoutMiddleware(ValidateUserSession::class);

        $user = $this->createSuperAdminUser();
        $task = Task::query()->create([
            'task_code' => 'TASK-MANUAL-'.uniqid(),
            'title' => 'Manual batch update task active',
            'created_by' => $user->id,
        ]);

        $entry = TaskTimeEntry::query()->create([
            'task_id' => $task->id,
            'user_id' => $user->id,
            'start_time' => Carbon::now()->subMinutes(10),
            'end_time' => null,
            'description' => null,
            'is_active' => true,
        ]);

        $response = $this->actingAs($user, 'web')->patchJson(
            "/admin/tasks/{$task->id}/time-entries/batch",
            [
                'entries' => [
                    [
                        'id' => $entry->id,
                        'start_time' => Carbon::now()->subMinutes(30)->toISOString(),
                        'end_time' => Carbon::now()->subMinutes(20)->toISOString(),
                    ],
                ],
            ],
        );

        $response->assertStatus(422);
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
