<?php

namespace Tests\Feature;

use App\Models\Employee;
use App\Models\EmployeeShiftAssignment;
use App\Models\Shift;
use App\Models\Task;
use App\Models\TaskTimeEntry;
use App\Services\TimeEntryAutoPauseService;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TaskTimeEntryShiftWorkingTimeTest extends TestCase
{
    use RefreshDatabase;

    protected function tearDown(): void
    {
        Carbon::setTestNow();

        parent::tearDown();
    }

    public function test_task_time_entry_can_start_without_assigned_shift(): void
    {
        Carbon::setTestNow('2026-06-29 22:30:00');

        $employee = Employee::factory()->create();
        $task = Task::factory()->create();

        $entry = TaskTimeEntry::start($task, $employee->user_id);

        $this->assertTrue($entry->is_active);
        $this->assertEquals('2026-06-29 22:30:00', $entry->start_time->format('Y-m-d H:i:s'));
        $this->assertDatabaseHas('task_time_entries', [
            'id' => $entry->id,
            'task_id' => $task->id,
            'user_id' => $employee->user_id,
            'is_active' => true,
        ]);
    }

    public function test_active_entries_are_not_auto_paused_for_shift_boundaries(): void
    {
        Carbon::setTestNow('2026-06-29 22:30:00');

        $employee = Employee::factory()->create();
        $task = Task::factory()->create();
        $entry = TaskTimeEntry::query()->create([
            'task_id' => $task->id,
            'user_id' => $employee->user_id,
            'start_time' => Carbon::parse('2026-06-29 20:00:00'),
            'end_time' => null,
            'is_active' => true,
        ]);

        $stats = app(TimeEntryAutoPauseService::class)->processActiveTimeEntries();

        $this->assertSame([
            'processed' => 1,
            'paused' => 0,
            'skipped' => 1,
            'split' => 0,
        ], $stats);
        $this->assertTrue($entry->fresh()->is_active);
        $this->assertNull($entry->fresh()->end_time);
    }

    public function test_working_duration_is_counted_only_inside_employee_day_shift(): void
    {
        $employee = Employee::factory()->create();
        $this->assignShift($employee, 'Day Shift', '09:00:00', '18:00:00');

        $entry = TaskTimeEntry::query()->create([
            'task_id' => Task::factory()->create()->id,
            'user_id' => $employee->user_id,
            'start_time' => Carbon::parse('2026-06-29 07:00:00'),
            'end_time' => Carbon::parse('2026-06-29 20:00:00'),
            'is_active' => false,
        ]);

        $this->assertSame(9 * 60 * 60, (int) $entry->calculateDuration());
    }

    public function test_working_duration_handles_overnight_shift_end_on_next_date(): void
    {
        $employee = Employee::factory()->create();
        $this->assignShift($employee, 'Night Shift', '19:00:00', '03:00:00');

        $entry = TaskTimeEntry::query()->create([
            'task_id' => Task::factory()->create()->id,
            'user_id' => $employee->user_id,
            'start_time' => Carbon::parse('2026-06-29 18:00:00'),
            'end_time' => Carbon::parse('2026-06-30 04:00:00'),
            'is_active' => false,
        ]);

        $this->assertSame(8 * 60 * 60, (int) $entry->calculateDuration());
    }

    public function test_working_duration_is_zero_without_shift_assignment(): void
    {
        $employee = Employee::factory()->create();

        $entry = TaskTimeEntry::query()->create([
            'task_id' => Task::factory()->create()->id,
            'user_id' => $employee->user_id,
            'start_time' => Carbon::parse('2026-06-29 09:00:00'),
            'end_time' => Carbon::parse('2026-06-29 18:00:00'),
            'is_active' => false,
        ]);

        $this->assertSame(0, (int) $entry->calculateDuration());
    }

    private function assignShift(Employee $employee, string $name, string $startTime, string $endTime): void
    {
        $shift = Shift::create([
            'name' => $name,
            'start_time' => $startTime,
            'end_time' => $endTime,
            'grace_minutes' => 0,
            'is_active' => true,
        ]);

        EmployeeShiftAssignment::create([
            'employee_id' => $employee->id,
            'shift_id' => $shift->id,
            'effective_from' => '2026-01-01',
            'effective_to' => null,
            'is_active' => true,
        ]);
    }
}
