<?php

namespace Tests\Feature;

use App\Http\Middleware\AdminMiddleware;
use App\Http\Middleware\ValidateUserSession;
use App\Models\Task;
use App\Models\TaskAssignment;
use App\Models\TaskTimeEntry;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;
use Tests\TestCase;

class UserTaskTimeEntriesTest extends TestCase
{
    use RefreshDatabase;

    public function test_it_includes_time_entries_overlapping_the_selected_date_and_clips_duration(): void
    {
        $this->withoutMiddleware(AdminMiddleware::class);
        $this->withoutMiddleware(ValidateUserSession::class);

        Carbon::setTestNow(Carbon::parse('2026-04-13 10:00:00'));

        $user = User::factory()->create();
        $task = Task::query()->create([
            'task_code' => 'TASK-'.Str::upper(Str::random(8)),
            'title' => 'Test task',
            'created_by' => $user->id,
        ]);

        TaskAssignment::query()->create([
            'task_id' => $task->id,
            'user_id' => $user->id,
            'is_active' => true,
        ]);

        TaskTimeEntry::query()->create([
            'task_id' => $task->id,
            'user_id' => $user->id,
            'start_time' => Carbon::parse('2026-04-13 00:01:00'),
            'end_time' => Carbon::parse('2026-04-13 10:00:00'),
            'is_active' => false,
        ]);

        $response = $this->actingAs($user, 'web')
            ->getJson('/my/tasks/time-entries?date=2026-04-13');

        $response->assertOk();
        $response->assertJsonCount(1, 'tasks');

        $this->assertSame($task->id, $response->json('tasks.0.id'));
        $this->assertSame(3600, $response->json('tasks.0.time_entries.0.duration_seconds_for_date'));
        $this->assertEquals(1.0, $response->json('tasks.0.total_hours_for_date'));
    }

    public function test_it_includes_active_time_entries_only_for_today_and_treats_end_time_as_now(): void
    {
        $this->withoutMiddleware(AdminMiddleware::class);
        $this->withoutMiddleware(ValidateUserSession::class);

        Carbon::setTestNow(Carbon::parse('2026-04-13 10:00:00'));

        $user = User::factory()->create();
        $task = Task::query()->create([
            'task_code' => 'TASK-'.Str::upper(Str::random(8)),
            'title' => 'Test task',
            'created_by' => $user->id,
        ]);

        TaskAssignment::query()->create([
            'task_id' => $task->id,
            'user_id' => $user->id,
            'is_active' => true,
        ]);

        TaskTimeEntry::query()->create([
            'task_id' => $task->id,
            'user_id' => $user->id,
            'start_time' => Carbon::parse('2026-04-13 09:00:00'),
            'end_time' => null,
            'is_active' => true,
        ]);

        $todayResponse = $this->actingAs($user, 'web')
            ->getJson('/my/tasks/time-entries?date=2026-04-13');

        $todayResponse->assertOk();
        $todayResponse->assertJsonCount(1, 'tasks');
        $this->assertSame(3600, $todayResponse->json('tasks.0.time_entries.0.duration_seconds_for_date'));
        $this->assertEquals(1.0, $todayResponse->json('tasks.0.total_hours_for_date'));

        $yesterdayResponse = $this->actingAs($user, 'web')
            ->getJson('/my/tasks/time-entries?date=2026-04-12');

        $yesterdayResponse->assertOk();
        $yesterdayResponse->assertJsonCount(0, 'tasks');
    }
}
