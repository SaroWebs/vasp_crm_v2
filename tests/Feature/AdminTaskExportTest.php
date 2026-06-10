<?php

namespace Tests\Feature;

use App\Http\Middleware\ValidateUserSession;
use App\Models\Permission;
use App\Models\Role;
use App\Models\SlaPolicy;
use App\Models\Task;
use App\Models\TaskType;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminTaskExportTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutMiddleware(ValidateUserSession::class);
    }

    public function test_authorized_admin_can_export_a_consolidated_task_report(): void
    {
        $admin = $this->createInternalUser();
        $assignee = User::factory()->create(['name' => 'Assigned Engineer']);
        $this->grantExportPermission($admin);
        $taskType = TaskType::create([
            'code' => 'Support',
            'name' => 'Support Request',
            'default_priority' => 'P2',
            'requires_sla' => true,
            'requires_project' => false,
            'requires_department' => false,
            'is_active' => true,
        ]);
        $slaPolicy = SlaPolicy::create([
            'name' => 'Support P2',
            'task_type_id' => $taskType->id,
            'priority' => 'P2',
            'response_time_minutes' => 60,
            'resolution_time_minutes' => 480,
            'review_time_minutes' => 120,
            'is_active' => true,
        ]);

        $draftTask = $this->createTask($admin, [
            'task_code' => 'TASK-DRAFT',
            'title' => 'Draft task',
            'task_type_id' => $taskType->id,
            'sla_policy_id' => $slaPolicy->id,
            'state' => 'Draft',
            'estimate_hours' => 2.5,
            'created_at' => Carbon::parse('2026-06-07 23:45:00'),
        ]);
        $draftTask->assignUser($assignee->id, $admin->id);
        $doneTask = $this->createTask($admin, [
            'task_code' => 'TASK-DONE',
            'title' => 'Done task',
            'task_type_id' => $taskType->id,
            'sla_policy_id' => $slaPolicy->id,
            'state' => 'Done',
            'estimate_hours' => 1.5,
            'created_at' => Carbon::parse('2026-06-03 10:00:00'),
        ]);
        $this->createTask($admin, [
            'task_code' => 'TASK-BLOCKED',
            'title' => 'Excluded blocked task',
            'state' => 'Blocked',
            'created_at' => Carbon::parse('2026-06-04 10:00:00'),
        ]);
        $this->createTask($admin, [
            'task_code' => 'TASK-OLD',
            'title' => 'Excluded old task',
            'state' => 'Draft',
            'created_at' => Carbon::parse('2026-06-01 10:00:00'),
        ]);

        $response = $this->actingAs($admin)->get('/admin/tasks/export?'.http_build_query([
            'start_date' => '2026-06-02',
            'end_date' => '2026-06-07',
            'states' => ['Draft', 'Done'],
            'columns' => ['task_code', 'title', 'state'],
        ]));

        $response->assertOk();
        $response->assertHeader('content-type', 'text/csv; charset=UTF-8');
        $response->assertHeader('content-disposition', 'attachment; filename="consolidated_tasks_2026-06-02_to_2026-06-07.csv"');

        $csv = $response->streamedContent();

        $this->assertStringContainsString('Consolidated Tasks Report', $csv);
        $this->assertStringContainsString('"Total Tasks",2', $csv);
        $this->assertStringContainsString('"Total Estimated Hours",4', $csv);
        $this->assertStringContainsString('"Selected States","Draft, Done"', $csv);
        $this->assertStringContainsString('"Task Code",Title,State', $csv);
        $this->assertStringContainsString($draftTask->task_code, $csv);
        $this->assertStringContainsString($doneTask->task_code, $csv);
        $this->assertStringNotContainsString('TASK-BLOCKED', $csv);
        $this->assertStringNotContainsString('TASK-OLD', $csv);
        $this->assertStringNotContainsString('Assigned To,Department', $csv);
    }

    public function test_task_export_can_filter_by_assignee(): void
    {
        $admin = $this->createInternalUser();
        $selectedAssignee = User::factory()->create();
        $otherAssignee = User::factory()->create();
        $this->grantExportPermission($admin);

        $selectedTask = $this->createTask($admin, ['task_code' => 'TASK-SELECTED']);
        $selectedTask->assignUser($selectedAssignee->id, $admin->id);
        $otherTask = $this->createTask($admin, ['task_code' => 'TASK-OTHER']);
        $otherTask->assignUser($otherAssignee->id, $admin->id);

        $response = $this->actingAs($admin)->get('/admin/tasks/export?'.http_build_query([
            'start_date' => now()->subDay()->toDateString(),
            'end_date' => now()->toDateString(),
            'states' => ['Draft'],
            'assigned_to' => $selectedAssignee->id,
            'columns' => ['task_code'],
        ]));

        $response->assertOk();
        $csv = $response->streamedContent();

        $this->assertStringContainsString('TASK-SELECTED', $csv);
        $this->assertStringNotContainsString('TASK-OTHER', $csv);
    }

    public function test_user_without_task_export_permission_is_forbidden(): void
    {
        $user = $this->createInternalUser();

        $response = $this->actingAs($user)->get('/admin/tasks/export?'.http_build_query([
            'start_date' => '2026-06-02',
            'end_date' => '2026-06-07',
            'states' => ['Draft'],
            'columns' => ['task_code'],
        ]));

        $response->assertForbidden();
    }

    public function test_task_export_requires_states_and_columns(): void
    {
        $admin = $this->createInternalUser();
        $this->grantExportPermission($admin);

        $response = $this->actingAs($admin)
            ->from('/admin/tasks')
            ->get('/admin/tasks/export?'.http_build_query([
                'start_date' => '2026-06-02',
                'end_date' => '2026-06-07',
                'states' => [],
                'columns' => [],
            ]));

        $response->assertRedirect('/admin/tasks');
        $response->assertSessionHasErrors(['states', 'columns']);
    }

    private function createInternalUser(): User
    {
        $user = User::factory()->create();
        $role = Role::firstOrCreate(
            ['slug' => 'manager'],
            [
                'name' => 'Manager',
                'guard_name' => 'web',
                'level' => 2,
            ]
        );
        $user->roles()->attach($role);
        $user->load('roles');

        return $user;
    }

    private function grantExportPermission(User $user): void
    {
        $permission = Permission::firstOrCreate(
            ['slug' => 'task.export'],
            [
                'name' => 'Export Task Reports',
                'module' => 'task',
                'action' => 'export',
            ]
        );
        $user->permissions()->attach($permission, ['granted' => 'granted']);
    }

    /**
     * @param  array<string, mixed>  $overrides
     */
    private function createTask(User $creator, array $overrides = []): Task
    {
        $attributes = array_merge([
            'task_code' => fake()->unique()->bothify('TASK-####'),
            'title' => fake()->sentence(),
            'description' => fake()->sentence(),
            'current_owner_kind' => 'UNASSIGNED',
            'state' => 'Draft',
            'estimate_hours' => 1,
            'created_by' => $creator->id,
        ], $overrides);
        $createdAt = $attributes['created_at'] ?? null;
        unset($attributes['created_at']);

        $task = Task::create($attributes);

        if ($createdAt !== null) {
            $task->forceFill([
                'created_at' => $createdAt,
                'updated_at' => $createdAt,
            ])->saveQuietly();
        }

        return $task;
    }
}
