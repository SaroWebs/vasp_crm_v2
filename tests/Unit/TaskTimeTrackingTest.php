<?php

namespace Tests\Unit;

use Tests\TestCase;
use App\Models\Task;
use App\Models\TaskTimeEntry;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Auth;
use App\Services\WorkingHoursService;

class TaskTimeTrackingTest extends TestCase
{
    use RefreshDatabase;

    protected $user;
    protected $task;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->create();
        $this->task = Task::factory()->create(['estimate_hours' => 8]);
        $this->task->assignedUsers()->attach($this->user->id);
        Auth::login($this->user);
    }

    public function test_start_task_outside_working_hours_sets_correct_start_time()
    {
        // Create a task
        $task = Task::factory()->create();
        $task->assignedUsers()->attach($this->user->id);

        // Get working hours service
        $workingHoursService = new WorkingHoursService();
        
        // Get a time outside working hours (e.g., 8 AM)
        $outsideWorkingHours = now()->setTime(8, 0, 0);
        $this->travelTo($outsideWorkingHours);

        // Start task time tracking
        $response = $this->post("/my/tasks/{$task->id}/start");
        $response->assertStatus(200);

        // Get latest time entry
        $timeEntry = TaskTimeEntry::latest()->first();
        
        // Verify start time is working time
        $this->assertTrue($workingHoursService->isWorkingTime($timeEntry->start_time));
    }

    public function test_start_task_during_working_hours_sets_current_time()
    {
        // Create a task
        $task = Task::factory()->create();
        $task->assignedUsers()->attach($this->user->id);

        // Get a time during working hours (e.g., 10 AM)
        $duringWorkingHours = now()->setTime(10, 0, 0);
        $this->travelTo($duringWorkingHours);

        // Start task time tracking
        $response = $this->post("/my/tasks/{$task->id}/start");
        $response->assertStatus(200);

        // Get latest time entry
        $timeEntry = TaskTimeEntry::latest()->first();
        
        // Verify start time is current time
        $this->assertEquals($duringWorkingHours->format('Y-m-d H:i:00'), $timeEntry->start_time->format('Y-m-d H:i:00'));
    }

    public function test_calculate_working_time_spent()
    {
        // Create a time entry with working time
        $startTime = now()->setTime(9, 0, 0); // 9 AM
        $endTime = now()->setTime(12, 0, 0); // 12 PM
        TaskTimeEntry::create([
            'task_id' => $this->task->id,
            'user_id' => $this->user->id,
            'start_time' => $startTime,
            'end_time' => $endTime,
            'is_active' => false,
            'description' => 'Test time entry',
        ]);

        // Get working time spent
        $response = $this->get("/my/tasks/{$this->task->id}/working-time-spent");
        $response->assertStatus(200);
        $data = $response->json()['data'];

        // Should calculate 2 working hours (9-12 with 1 hour break)
        $this->assertEqualsWithDelta(2, $data['total_working_time_spent_hours'], 0.01);
    }
}
