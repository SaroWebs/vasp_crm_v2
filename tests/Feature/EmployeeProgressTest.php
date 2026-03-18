<?php

namespace Tests\Feature;

use App\Models\Task;
use App\Models\TaskTimeEntry;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Tests\TestCase;

class EmployeeProgressTest extends TestCase
{
    use RefreshDatabase;
    use WithFaker;

    /**
     * Test employee progress data retrieval.
     */
    public function test_employee_progress_data_retrieval()
    {
        // Create test users
        $user1 = User::factory()->create();
        $user2 = User::factory()->create();

        // Create test tasks
        $task1 = Task::factory()->create();
        $task2 = Task::factory()->create();

        // Create time entries for users
        TaskTimeEntry::factory()->create([
            'task_id' => $task1->id,
            'user_id' => $user1->id,
            'start_time' => now()->subHours(2),
            'end_time' => now()->subHours(1),
            'duration_hours' => 1.0,
            'is_active' => false,
        ]);

        TaskTimeEntry::factory()->create([
            'task_id' => $task2->id,
            'user_id' => $user1->id,
            'start_time' => now()->subHours(3),
            'end_time' => now()->subHours(2),
            'duration_hours' => 1.5,
            'is_active' => false,
        ]);

        TaskTimeEntry::factory()->create([
            'task_id' => $task1->id,
            'user_id' => $user2->id,
            'start_time' => now()->subHours(4),
            'end_time' => now()->subHours(3),
            'duration_hours' => 2.0,
            'is_active' => false,
        ]);

        // Test the controller method
        $response = $this->actingAs($user1)->get('/api/employee-progress');

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'success',
            'data' => [
                '*' => [
                    'user_id',
                    'user_name',
                    'email',
                    'total_time',
                    'tasks_completed',
                    'task_details',
                ]
            ],
            'total_employees',
            'total_time',
            'total_tasks',
        ]);

        $data = $response->json();

        // Verify we have 2 employees
        $this->assertEquals(2, $data['total_employees']);

        // Verify total time is correct (1.0 + 1.5 + 2.0 = 4.5 hours)
        $this->assertEquals(4.5, $data['total_time']);

        // Verify total tasks is correct (3 unique task assignments)
        $this->assertEquals(3, $data['total_tasks']);
    }

    /**
     * Test employee progress with date filtering.
     */
    public function test_employee_progress_with_date_filter()
    {
        // Create test user
        $user = User::factory()->create();

        // Create test task
        $task = Task::factory()->create();

        // Create time entries on different dates
        TaskTimeEntry::factory()->create([
            'task_id' => $task->id,
            'user_id' => $user->id,
            'start_time' => now()->subDays(2),
            'end_time' => now()->subDays(2)->addHours(1),
            'duration_hours' => 1.0,
            'is_active' => false,
        ]);

        TaskTimeEntry::factory()->create([
            'task_id' => $task->id,
            'user_id' => $user->id,
            'start_time' => now()->subDays(1),
            'end_time' => now()->subDays(1)->addHours(2),
            'duration_hours' => 2.0,
            'is_active' => false,
        ]);

        // Test filtering by specific date (yesterday)
        $yesterday = now()->subDays(1)->toDateString();
        $response = $this->actingAs($user)->get("/api/employee-progress?date={$yesterday}");

        $response->assertStatus(200);
        $data = $response->json();

        // Should only include yesterday's time entry (2.0 hours)
        $this->assertEquals(2.0, $data['total_time']);
        $this->assertEquals(1, $data['total_tasks']);
    }

    /**
     * Test employee progress with date range filtering.
     */
    public function test_employee_progress_with_date_range_filter()
    {
        // Create test user
        $user = User::factory()->create();

        // Create test task
        $task = Task::factory()->create();

        // Create time entries on different dates
        TaskTimeEntry::factory()->create([
            'task_id' => $task->id,
            'user_id' => $user->id,
            'start_time' => now()->subDays(3),
            'end_time' => now()->subDays(3)->addHours(1),
            'duration_hours' => 1.0,
            'is_active' => false,
        ]);

        TaskTimeEntry::factory()->create([
            'task_id' => $task->id,
            'user_id' => $user->id,
            'start_time' => now()->subDays(2),
            'end_time' => now()->subDays(2)->addHours(2),
            'duration_hours' => 2.0,
            'is_active' => false,
        ]);

        TaskTimeEntry::factory()->create([
            'task_id' => $task->id,
            'user_id' => $user->id,
            'start_time' => now()->subDays(1),
            'end_time' => now()->subDays(1)->addHours(3),
            'duration_hours' => 3.0,
            'is_active' => false,
        ]);

        // Test filtering by date range (last 2 days)
        $fromDate = now()->subDays(2)->toDateString();
        $toDate = now()->subDays(1)->toDateString();
        $response = $this->actingAs($user)->get("/api/employee-progress?from_date={$fromDate}&to_date={$toDate}");

        $response->assertStatus(200);
        $data = $response->json();

        // Should include last 2 days' time entries (2.0 + 3.0 = 5.0 hours)
        $this->assertEquals(5.0, $data['total_time']);
        $this->assertEquals(2, $data['total_tasks']);
    }
}