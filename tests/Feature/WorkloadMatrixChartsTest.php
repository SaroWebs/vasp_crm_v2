<?php

namespace Tests\Feature;

use App\Models\Department;
use App\Models\Employee;
use App\Models\Task;
use App\Models\TaskAssignment;
use App\Models\User;
use App\Services\WorkloadMatrixService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;
use Tests\TestCase;

class WorkloadMatrixChartsTest extends TestCase
{
    use RefreshDatabase;

    public function test_terminal_tasks_are_excluded_from_workload_matrix_counts_and_charts(): void
    {
        $department = Department::create([
            'name' => 'Support',
        ]);

        $user = User::factory()->create();

        Employee::create([
            'name' => $user->name,
            'email' => $user->email,
            'user_id' => $user->id,
            'department_id' => $department->id,
        ]);

        $pendingTask = $this->createTask($user->id, 'Draft');
        $inProgressTask = $this->createTask($user->id, 'InProgress');
        $completedTask = $this->createTask($user->id, 'Done');
        $cancelledTask = $this->createTask($user->id, 'Cancelled');
        $rejectedTask = $this->createTask($user->id, 'Rejected');

        TaskAssignment::create([
            'task_id' => $pendingTask->id,
            'user_id' => $user->id,
            'state' => 'pending',
            'is_active' => true,
        ]);

        TaskAssignment::create([
            'task_id' => $inProgressTask->id,
            'user_id' => $user->id,
            'state' => 'in_progress',
            'is_active' => true,
        ]);

        TaskAssignment::create([
            'task_id' => $completedTask->id,
            'user_id' => $user->id,
            'state' => 'pending',
            'is_active' => true,
        ]);

        TaskAssignment::create([
            'task_id' => $cancelledTask->id,
            'user_id' => $user->id,
            'state' => 'pending',
            'is_active' => true,
        ]);

        TaskAssignment::create([
            'task_id' => $rejectedTask->id,
            'user_id' => $user->id,
            'state' => 'pending',
            'is_active' => true,
        ]);

        $result = app(WorkloadMatrixService::class)->build();
        $row = $result['rows'][0] ?? [];

        $this->assertSame(2, $result['summary']['total_active_tasks']);
        $this->assertSame(1, $result['summary']['total_in_progress_tasks']);
        $this->assertSame(2, $row['active_task_count'] ?? null);
        $this->assertSame(1, $row['pending_task_count'] ?? null);
        $this->assertSame(1, $row['in_progress_task_count'] ?? null);

        $workloadByEmployee = $result['charts']['workloadByEmployee'][0] ?? [];
        $this->assertSame(2, $workloadByEmployee['assigned'] ?? null);
        $this->assertSame(1, $workloadByEmployee['inProgress'] ?? null);
        $this->assertArrayNotHasKey('completed', $workloadByEmployee);
        $this->assertArrayNotHasKey('other', $workloadByEmployee);
    }

    public function test_filters_limit_tasks_by_due_date_range(): void
    {
        $department = Department::create([
            'name' => 'Engineering',
        ]);

        $user = User::factory()->create();

        Employee::create([
            'name' => $user->name,
            'email' => $user->email,
            'user_id' => $user->id,
            'department_id' => $department->id,
        ]);

        $rangeStart = Carbon::now()->subDays(2)->startOfDay();
        $rangeEnd = Carbon::now()->addDays(2)->endOfDay();

        $inRangeTask = $this->createTask($user->id, 'Assigned', [
            'due_at' => Carbon::now()->addDay(),
        ]);
        $outOfRangeTask = $this->createTask($user->id, 'Assigned', [
            'due_at' => Carbon::now()->addDays(10),
        ]);

        TaskAssignment::create([
            'task_id' => $inRangeTask->id,
            'user_id' => $user->id,
            'state' => 'pending',
            'is_active' => true,
        ]);

        TaskAssignment::create([
            'task_id' => $outOfRangeTask->id,
            'user_id' => $user->id,
            'state' => 'pending',
            'is_active' => true,
        ]);

        $result = app(WorkloadMatrixService::class)->build([
            'from_date' => $rangeStart->toDateString(),
            'to_date' => $rangeEnd->toDateString(),
        ]);

        $row = $result['rows'][0] ?? [];
        $this->assertSame(2, $row['active_task_count'] ?? null);
    }

    private function createTask(int $userId, string $state, array $overrides = []): Task
    {
        return Task::create(array_merge([
            'task_code' => Str::upper(Str::random(10)),
            'title' => 'Workload Matrix Task',
            'state' => $state,
            'created_by' => $userId,
        ], $overrides));
    }
}
