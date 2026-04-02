<?php

namespace Tests\Unit;

use App\Models\Task;
use Carbon\Carbon;
use Tests\TestCase;

class TaskOverdueTimeTest extends TestCase
{
    public function test_it_calculates_overdue_time_using_working_hours_only(): void
    {
        $task = new Task([
            'due_at' => Carbon::parse('2026-01-27 18:00:00', 'Asia/Calcutta'),
            'state' => 'InProgress',
        ]);

        $this->travelTo(Carbon::parse('2026-01-28 10:00:00', 'Asia/Calcutta'));

        $this->assertSame(7200, $task->getOverdueTimeSeconds());
        $this->assertSame('2 hours', $task->getOverdueTime());
        $this->assertTrue($task->isOverdue());
    }

    public function test_it_does_not_mark_a_task_overdue_when_only_after_hours_passed(): void
    {
        $task = new Task([
            'due_at' => Carbon::parse('2026-01-27 19:00:00', 'Asia/Calcutta'),
            'state' => 'InProgress',
        ]);

        $this->travelTo(Carbon::parse('2026-01-27 20:00:00', 'Asia/Calcutta'));

        $this->assertNull($task->getOverdueTimeSeconds());
        $this->assertNull($task->getOverdueTime());
        $this->assertFalse($task->isOverdue());
    }
}
