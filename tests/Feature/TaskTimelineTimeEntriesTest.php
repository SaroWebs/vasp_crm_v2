<?php

namespace Tests\Feature;

use App\Models\Permission;
use App\Models\Role;
use App\Models\Task;
use App\Models\TaskTimeEntry;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TaskTimelineTimeEntriesTest extends TestCase
{
    use RefreshDatabase;

    public function test_it_includes_tasks_with_time_entries_in_range(): void
    {
        $user = $this->createUserWithTaskReadPermission();

        $task = Task::create([
            'title' => 'Completed task with time entry',
            'task_code' => 'TASK-TIMELINE-1',
            'description' => null,
            'task_type_id' => null,
            'created_by' => $user->id,
            'sla_policy_id' => null,
            'project_id' => null,
            'phase_id' => null,
            'department_id' => null,
            'current_owner_kind' => 'UNASSIGNED',
            'current_owner_id' => null,
            'state' => 'Done',
            'start_at' => now()->subDays(10),
            'due_at' => now()->subDays(9),
            'completed_at' => now()->subDays(9),
            'estimate_hours' => null,
            'tags' => [],
            'version' => 1,
            'metadata' => [],
            'parent_task_id' => null,
            'ticket_id' => null,
            'completion_notes' => null,
        ]);

        $task->assignUser($user->id, $user->id);

        TaskTimeEntry::create([
            'task_id' => $task->id,
            'user_id' => $user->id,
            'start_time' => now()->subDay()->setTime(10, 0),
            'end_time' => now()->subDay()->setTime(11, 0),
            'description' => null,
            'is_active' => false,
            'metadata' => [],
        ]);

        $fromDate = now()->subDays(2)->toDateString();
        $toDate = now()->toDateString();

        $this->actingAs($user);

        $response = $this->getJson("/data/all/tasks?from_date={$fromDate}&to_date={$toDate}");

        $response->assertOk()
            ->assertJsonPath('data.0.task_code', 'TASK-TIMELINE-1');
    }

    public function test_it_includes_tasks_when_date_range_intersects_task_schedule(): void
    {
        $user = $this->createUserWithTaskReadPermission();

        $task = Task::create([
            'title' => 'Future scheduled task',
            'task_code' => 'TASK-TIMELINE-2',
            'description' => null,
            'task_type_id' => null,
            'created_by' => $user->id,
            'sla_policy_id' => null,
            'project_id' => null,
            'phase_id' => null,
            'department_id' => null,
            'current_owner_kind' => 'UNASSIGNED',
            'current_owner_id' => null,
            'state' => 'Assigned',
            'start_at' => now()->addDays(2),
            'due_at' => now()->addDays(5),
            'completed_at' => null,
            'estimate_hours' => null,
            'tags' => [],
            'version' => 1,
            'metadata' => [],
            'parent_task_id' => null,
            'ticket_id' => null,
            'completion_notes' => null,
        ]);

        $task->assignUser($user->id, $user->id);

        $fromDate = now()->addDay()->toDateString();
        $toDate = now()->addDays(3)->toDateString();

        $this->actingAs($user);

        $response = $this->getJson("/data/all/tasks?from_date={$fromDate}&to_date={$toDate}");

        $response->assertOk()
            ->assertJsonPath('data.0.task_code', 'TASK-TIMELINE-2');
    }

    public function test_it_includes_pending_tasks_without_time_entries_when_schedule_intersects(): void
    {
        $user = $this->createUserWithTaskReadPermission();

        $task = Task::create([
            'title' => 'Pending task with schedule',
            'task_code' => 'TASK-TIMELINE-3',
            'description' => null,
            'task_type_id' => null,
            'created_by' => $user->id,
            'sla_policy_id' => null,
            'project_id' => null,
            'phase_id' => null,
            'department_id' => null,
            'current_owner_kind' => 'UNASSIGNED',
            'current_owner_id' => null,
            'state' => 'Assigned',
            'start_at' => now()->addDays(4),
            'due_at' => now()->addDays(7),
            'completed_at' => null,
            'estimate_hours' => null,
            'tags' => [],
            'version' => 1,
            'metadata' => [],
            'parent_task_id' => null,
            'ticket_id' => null,
            'completion_notes' => null,
        ]);

        $task->assignUser($user->id, $user->id);

        $fromDate = now()->addDays(3)->toDateString();
        $toDate = now()->addDays(5)->toDateString();

        $this->actingAs($user);

        $response = $this->getJson("/data/all/tasks?from_date={$fromDate}&to_date={$toDate}");

        $response->assertOk()
            ->assertJsonPath('data.0.task_code', 'TASK-TIMELINE-3');
    }

    private function createUserWithTaskReadPermission(): User
    {
        $permission = Permission::create([
            'name' => 'Task Read',
            'slug' => 'task.read',
            'module' => 'task',
            'action' => 'read',
            'description' => 'Read tasks',
        ]);

        $role = Role::create([
            'name' => 'Admin',
            'slug' => 'admin',
            'guard_name' => 'web',
            'description' => 'Admin role',
            'is_default' => false,
            'level' => 10,
        ]);

        $role->permissions()->attach($permission->id);

        $user = User::factory()->create();
        $user->assignRole($role);

        return $user;
    }
}
