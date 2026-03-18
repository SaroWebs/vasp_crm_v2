<?php

namespace Tests\Feature;

use App\Models\Task;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TaskTimeTrackingTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Test task time tracking operations.
     */
    public function test_task_time_tracking_operations()
    {
        // Create a user with task permissions
        $user = User::factory()->create();
        $user->assignRole('admin'); // Assuming admin role has task permissions

        // Create a task
        $task = Task::factory()->create([
            'assigned_to' => $user->id,
            'estimate_hours' => 8.00,
        ]);

        $this->actingAs($user);

        // Test start task
        $response = $this->postJson("/tasks/{$task->id}/start");
        $response->assertStatus(200);
        
        $task->refresh();
        $this->assertEquals('InProgress', $task->state);
        
        // Check that a time entry was created
        $timeEntry = $task->timeEntries()->where('user_id', $user->id)->first();
        $this->assertNotNull($timeEntry);
        $this->assertTrue($timeEntry->is_active);
        $this->assertNotNull($timeEntry->start_time);

        // Test pause task
        $response = $this->postJson("/tasks/{$task->id}/pause");
        $response->assertStatus(200);
        
        $timeEntry->refresh();
        $this->assertFalse($timeEntry->is_active);
        $this->assertNotNull($timeEntry->end_time);

        // Test resume task
        $response = $this->postJson("/tasks/{$task->id}/resume");
        $response->assertStatus(200);
        
        $newTimeEntry = $task->timeEntries()->where('user_id', $user->id)->latest()->first();
        $this->assertTrue($newTimeEntry->is_active);
        $this->assertNotNull($newTimeEntry->start_time);

        // Test calculate time spent
        $response = $this->getJson("/tasks/{$task->id}/time-spent");
        $response->assertStatus(200);
        $response->assertJsonStructure([
            'data' => [
                'time_spent',
                'total_time_spent',
                'remaining_time'
            ]
        ]);

        // Test calculate remaining time
        $response = $this->getJson("/tasks/{$task->id}/remaining-time");
        $response->assertStatus(200);
        $response->assertJsonStructure([
            'data' => [
                'remaining_time',
                'days_required',
                'office_hours',
                'break_hours'
            ]
        ]);

        // Test end task
        $response = $this->postJson("/tasks/{$task->id}/end");
        $response->assertStatus(200);
        
        $newTimeEntry->refresh();
        $this->assertFalse($newTimeEntry->is_active);
        $this->assertNotNull($newTimeEntry->end_time);
        $this->assertGreaterThan(0, $newTimeEntry->duration_hours);
    }

    /**
     * Test task status update.
     */
    public function test_task_status_update()
    {
        $user = User::factory()->create();
        $user->assignRole('admin');

        $task = Task::factory()->create([
            'assigned_to' => $user->id,
            'state' => 'Assigned',
        ]);

        $this->actingAs($user);

        // Test update status
        $response = $this->patchJson("/tasks/{$task->id}/status", [
            'state' => 'InProgress'
        ]);
        $response->assertStatus(200);
        
        $task->refresh();
        $this->assertEquals('InProgress', $task->state);
    }

    /**
     * Test self-assigned task creation.
     */
    public function test_self_assigned_task_creation()
    {
        $user = User::factory()->create();
        $user->assignRole('admin');

        // Create a department and assign user to it
        $department = \App\Models\Department::factory()->create();
        $user->departmentUsers()->create([
            'department_id' => $department->id,
            'assigned_by' => $user->id,
        ]);

        $this->actingAs($user);

        $taskData = [
            'title' => 'Test Self-Assigned Task',
            'description' => 'This is a test task created by the user for themselves',
            'task_code' => 'TASK-' . time(),
            'state' => 'Draft',
            'due_at' => now()->addDays(7),
            'estimate_hours' => 4.0,
        ];

        $response = $this->postJson('/self/tasks', $taskData);
        $response->assertStatus(201);

        $response->assertJsonStructure([
            'data' => [
                'id',
                'title',
                'description',
                'task_code',
                'state',
                'assigned_to',
                'assigned_department_id',
                'created_by',
                'current_owner_id',
                'current_owner_kind',
                'estimate_hours',
                'due_at',
            ]
        ]);

        $responseData = $response->json('data');
        
        // Verify task was assigned to the user who created it
        $this->assertEquals($user->id, $responseData['assigned_to']);
        $this->assertEquals($user->id, $responseData['created_by']);
        $this->assertEquals($user->id, $responseData['current_owner_id']);
        $this->assertEquals('USER', $responseData['current_owner_kind']);
        $this->assertEquals($department->id, $responseData['assigned_department_id']);
        
        // Verify task data
        $this->assertEquals($taskData['title'], $responseData['title']);
        $this->assertEquals($taskData['description'], $responseData['description']);
        $this->assertEquals($taskData['task_code'], $responseData['task_code']);
        $this->assertEquals($taskData['state'], $responseData['state']);
        $this->assertEquals($taskData['estimate_hours'], $responseData['estimate_hours']);

        // Verify task exists in database
        $this->assertDatabaseHas('tasks', [
            'title' => $taskData['title'],
            'assigned_to' => $user->id,
            'created_by' => $user->id,
            'current_owner_id' => $user->id,
            'current_owner_kind' => 'USER',
        ]);
    }

    /**
     * Test self-assigned task creation without department assignment.
     */
    public function test_self_assigned_task_creation_without_department()
    {
        $user = User::factory()->create();
        $user->assignRole('admin');

        $this->actingAs($user);

        $taskData = [
            'title' => 'Test Self-Assigned Task No Department',
            'description' => 'This is a test task created by the user for themselves without department',
            'task_code' => 'TASK-' . time(),
            'state' => 'Draft',
            'due_at' => now()->addDays(7),
            'estimate_hours' => 2.0,
        ];

        $response = $this->postJson('/self/tasks', $taskData);
        $response->assertStatus(201);

        $responseData = $response->json('data');
        
        // Verify task was assigned to the user who created it
        $this->assertEquals($user->id, $responseData['assigned_to']);
        $this->assertEquals($user->id, $responseData['created_by']);
        $this->assertEquals($user->id, $responseData['current_owner_id']);
        $this->assertEquals('USER', $responseData['current_owner_kind']);
        $this->assertNull($responseData['assigned_department_id']); // No department assigned
        
        // Verify task data
        $this->assertEquals($taskData['title'], $responseData['title']);
        $this->assertEquals($taskData['description'], $responseData['description']);
        $this->assertEquals($taskData['task_code'], $responseData['task_code']);
        $this->assertEquals($taskData['state'], $responseData['state']);
        $this->assertEquals($taskData['estimate_hours'], $responseData['estimate_hours']);
    }
}