<?php

namespace Tests\Feature;

use App\Models\Report;
use App\Models\Task;
use App\Models\TaskTimeEntry;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ReportIndexTimeEntriesTest extends TestCase
{
    use RefreshDatabase;

    public function test_index_reports_include_daily_working_durations(): void
    {
        $user = User::factory()->create();
        $task = Task::create([
            'task_code' => 'TASK-TEST-01',
            'title' => 'Report Task',
            'created_by' => $user->id,
        ]);

        $report = Report::create([
            'user_id' => $user->id,
            'report_date' => '2026-04-10',
            'title' => 'Daily Report',
            'description' => 'Summary',
            'status' => 'submitted',
            'total_hours' => 0,
        ]);

        $report->tasks()->attach($task->id, ['remarks' => 'Notes']);

        TaskTimeEntry::create([
            'task_id' => $task->id,
            'user_id' => $user->id,
            'start_time' => '2026-04-09 23:00:00',
            'end_time' => '2026-04-10 01:00:00',
            'description' => 'Late work',
            'is_active' => false,
        ]);

        TaskTimeEntry::create([
            'task_id' => $task->id,
            'user_id' => $user->id,
            'start_time' => '2026-04-10 10:00:00',
            'end_time' => '2026-04-10 12:00:00',
            'description' => 'Morning work',
            'is_active' => false,
        ]);

        TaskTimeEntry::create([
            'task_id' => $task->id,
            'user_id' => $user->id,
            'start_time' => '2026-04-11 09:00:00',
            'end_time' => '2026-04-11 10:00:00',
            'description' => 'Next day work',
            'is_active' => false,
        ]);

        $response = $this->actingAs($user)
            ->withoutMiddleware()
            ->getJson('/admin/api/reports/all');

        $response->assertOk();

        $reportPayload = collect($response->json('data'))->firstWhere('id', $report->id);

        $this->assertNotNull($reportPayload);

        $taskPayload = collect($reportPayload['tasks'])->firstWhere('id', $task->id);

        $this->assertSame(10800, $taskPayload['total_working_seconds']);
        $this->assertCount(2, $taskPayload['time_entries']);

        $workingDurations = collect($taskPayload['time_entries'])
            ->pluck('working_duration')
            ->sort()
            ->values()
            ->all();

        $this->assertSame([3600, 7200], $workingDurations);
    }
}
