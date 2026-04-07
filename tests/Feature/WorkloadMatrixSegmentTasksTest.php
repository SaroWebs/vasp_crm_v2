<?php

namespace Tests\Feature;

use App\Http\Middleware\ValidateUserSession;
use App\Models\Department;
use App\Models\Employee;
use App\Models\Permission;
use App\Models\Role;
use App\Models\Task;
use App\Models\TaskAssignment;
use App\Models\TaskTimeEntry;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class WorkloadMatrixSegmentTasksTest extends TestCase
{
    use RefreshDatabase;

    public function test_segment_tasks_endpoint_filters_by_segment_and_excludes_terminal_tasks(): void
    {
        $this->withoutMiddleware(ValidateUserSession::class);

        $role = Role::create([
            'name' => 'Admin',
            'slug' => 'admin',
            'description' => 'Admin role',
            'guard_name' => 'web',
            'is_default' => false,
            'level' => 1,
        ]);

        $permission = Permission::create([
            'name' => 'Read Task',
            'slug' => 'task.read',
            'module' => 'task',
            'action' => 'read',
        ]);

        $role->permissions()->attach($permission->id);

        $user = User::factory()->create();
        $user->roles()->attach($role->id);

        $department = Department::create([
            'name' => 'Operations',
        ]);

        Employee::create([
            'name' => $user->name,
            'email' => $user->email,
            'user_id' => $user->id,
            'department_id' => $department->id,
        ]);

        $pendingTask = Task::create([
            'task_code' => Str::upper(Str::random(10)),
            'title' => 'Pending task',
            'state' => 'Assigned',
            'created_by' => $user->id,
        ]);

        $inProgressTask = Task::create([
            'task_code' => Str::upper(Str::random(10)),
            'title' => 'In progress task',
            'state' => 'InProgress',
            'created_by' => $user->id,
        ]);

        $doneTask = Task::create([
            'task_code' => Str::upper(Str::random(10)),
            'title' => 'Done task',
            'state' => 'Done',
            'created_by' => $user->id,
        ]);

        TaskAssignment::create([
            'task_id' => $pendingTask->id,
            'user_id' => $user->id,
            'state' => 'pending',
            'is_active' => true,
        ]);

        $activeEntry = TaskTimeEntry::create([
            'task_id' => $pendingTask->id,
            'user_id' => $user->id,
            'start_time' => now()->subMinutes(15),
            'end_time' => null,
            'is_active' => true,
        ]);

        TaskAssignment::create([
            'task_id' => $inProgressTask->id,
            'user_id' => $user->id,
            'state' => 'in_progress',
            'is_active' => true,
        ]);

        TaskAssignment::create([
            'task_id' => $doneTask->id,
            'user_id' => $user->id,
            'state' => 'pending',
            'is_active' => true,
        ]);

        $this->actingAs($user, 'web')
            ->getJson("/admin/api/workload-matrix/tasks?user_id={$user->id}&segment=pending")
            ->assertOk()
            ->assertJsonPath('tasks.total', 1)
            ->assertJsonPath('tasks.data.0.id', $pendingTask->id)
            ->assertJsonPath('tasks.data.0.active_time_entry.id', $activeEntry->id);

        $this->actingAs($user, 'web')
            ->getJson("/admin/api/workload-matrix/tasks?user_id={$user->id}&segment=in_progress")
            ->assertOk()
            ->assertJsonPath('tasks.total', 1)
            ->assertJsonPath('tasks.data.0.id', $inProgressTask->id);
    }
}
