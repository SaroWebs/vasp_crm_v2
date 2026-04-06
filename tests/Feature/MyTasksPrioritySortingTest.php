<?php

namespace Tests\Feature;

use App\Models\Permission;
use App\Models\Role;
use App\Models\SlaPolicy;
use App\Models\Task;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MyTasksPrioritySortingTest extends TestCase
{
    use RefreshDatabase;

    public function test_it_sorts_my_tasks_by_sla_priority_from_p1_to_p4(): void
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

        $slaPolicies = collect(['P4', 'P3', 'P2', 'P1'])->mapWithKeys(function (string $priority) {
            return [
                $priority => SlaPolicy::create([
                    'name' => "{$priority} Policy",
                    'description' => null,
                    'task_type_id' => null,
                    'priority' => $priority,
                    'response_time_minutes' => 60,
                    'resolution_time_minutes' => 120,
                    'review_time_minutes' => 30,
                    'escalation_steps' => null,
                    'is_active' => true,
                ]),
            ];
        });

        $priorityCreationOffsets = [
            'P1' => 4,
            'P2' => 3,
            'P3' => 2,
            'P4' => 1,
        ];

        foreach (['P4', 'P3', 'P2', 'P1'] as $priority) {
            $task = Task::create([
                'title' => "{$priority} Task",
                'task_code' => "TASK-{$priority}",
                'description' => null,
                'task_type_id' => null,
                'created_by' => $user->id,
                'sla_policy_id' => $slaPolicies[$priority]->id,
                'project_id' => null,
                'phase_id' => null,
                'department_id' => null,
                'current_owner_kind' => 'UNASSIGNED',
                'current_owner_id' => null,
                'state' => 'Draft',
                'start_at' => null,
                'due_at' => null,
                'completed_at' => null,
                'estimate_hours' => null,
                'tags' => [],
                'version' => 1,
                'metadata' => [],
                'parent_task_id' => null,
                'ticket_id' => null,
                'completion_notes' => null,
            ]);

            $createdAt = now()->subDays($priorityCreationOffsets[$priority]);

            Task::withoutTimestamps(function () use ($task, $createdAt): void {
                $task->forceFill([
                    'created_at' => $createdAt,
                    'updated_at' => $createdAt,
                ])->save();
            });

            $task->assignUser($user->id, $user->id);
        }

        Task::create([
            'title' => 'P4 Task Extra 1',
            'task_code' => 'TASK-P4-EXTRA-1',
            'description' => null,
            'task_type_id' => null,
            'created_by' => $user->id,
            'sla_policy_id' => $slaPolicies['P4']->id,
            'project_id' => null,
            'phase_id' => null,
            'department_id' => null,
            'current_owner_kind' => 'UNASSIGNED',
            'current_owner_id' => null,
            'state' => 'Draft',
            'start_at' => null,
            'due_at' => null,
            'completed_at' => null,
            'estimate_hours' => null,
            'tags' => [],
            'version' => 1,
            'metadata' => [],
            'parent_task_id' => null,
            'ticket_id' => null,
            'completion_notes' => null,
        ])->assignUser($user->id, $user->id);

        Task::create([
            'title' => 'P4 Task Extra 2',
            'task_code' => 'TASK-P4-EXTRA-2',
            'description' => null,
            'task_type_id' => null,
            'created_by' => $user->id,
            'sla_policy_id' => $slaPolicies['P4']->id,
            'project_id' => null,
            'phase_id' => null,
            'department_id' => null,
            'current_owner_kind' => 'UNASSIGNED',
            'current_owner_id' => null,
            'state' => 'Draft',
            'start_at' => null,
            'due_at' => null,
            'completed_at' => null,
            'estimate_hours' => null,
            'tags' => [],
            'version' => 1,
            'metadata' => [],
            'parent_task_id' => null,
            'ticket_id' => null,
            'completion_notes' => null,
        ])->assignUser($user->id, $user->id);

        $this->actingAs($user);

        $response = $this->getJson('/data/my/tasks?per_page=5');

        $response->assertOk()
            ->assertJsonPath('data.0.sla_policy.priority', 'P1')
            ->assertJsonPath('data.1.sla_policy.priority', 'P2')
            ->assertJsonPath('data.2.sla_policy.priority', 'P3')
            ->assertJsonPath('data.3.sla_policy.priority', 'P4')
            ->assertJsonPath('per_page', 5)
            ->assertJsonPath('from', 1)
            ->assertJsonPath('to', 5);
    }

    public function test_it_sorts_my_tasks_by_due_date_when_requested(): void
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

        $priority = SlaPolicy::create([
            'name' => 'P4 Policy',
            'description' => null,
            'task_type_id' => null,
            'priority' => 'P4',
            'response_time_minutes' => 60,
            'resolution_time_minutes' => 120,
            'review_time_minutes' => 30,
            'escalation_steps' => null,
            'is_active' => true,
        ]);

        Task::create([
            'title' => 'Later due task',
            'task_code' => 'TASK-DUE-LATE',
            'description' => null,
            'task_type_id' => null,
            'created_by' => $user->id,
            'sla_policy_id' => $priority->id,
            'project_id' => null,
            'phase_id' => null,
            'department_id' => null,
            'current_owner_kind' => 'UNASSIGNED',
            'current_owner_id' => null,
            'state' => 'Draft',
            'start_at' => null,
            'due_at' => now()->addDays(5),
            'completed_at' => null,
            'estimate_hours' => null,
            'tags' => [],
            'version' => 1,
            'metadata' => [],
            'parent_task_id' => null,
            'ticket_id' => null,
            'completion_notes' => null,
        ])->assignUser($user->id, $user->id);

        Task::create([
            'title' => 'Earlier due task',
            'task_code' => 'TASK-DUE-EARLY',
            'description' => null,
            'task_type_id' => null,
            'created_by' => $user->id,
            'sla_policy_id' => $priority->id,
            'project_id' => null,
            'phase_id' => null,
            'department_id' => null,
            'current_owner_kind' => 'UNASSIGNED',
            'current_owner_id' => null,
            'state' => 'Draft',
            'start_at' => null,
            'due_at' => now()->addDay(),
            'completed_at' => null,
            'estimate_hours' => null,
            'tags' => [],
            'version' => 1,
            'metadata' => [],
            'parent_task_id' => null,
            'ticket_id' => null,
            'completion_notes' => null,
        ])->assignUser($user->id, $user->id);

        $this->actingAs($user);

        $response = $this->getJson('/data/my/tasks?sort_by=due_at&sort_order=asc');

        $response->assertOk()
            ->assertJsonPath('data.0.task_code', 'TASK-DUE-EARLY')
            ->assertJsonPath('data.1.task_code', 'TASK-DUE-LATE');
    }
}
