<?php

namespace Tests\Feature;

use App\Http\Middleware\ValidateUserSession;
use App\Models\Role;
use App\Models\SlaPolicy;
use App\Models\Task;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TaskCreationScheduleCalculationTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_task_creation_normalizes_start_and_calculates_due_date_when_duration_is_zero(): void
    {
        $this->withoutMiddleware(ValidateUserSession::class);

        $creator = $this->createSuperAdminUser();
        $slaPolicy = SlaPolicy::query()->create([
            'name' => 'Resolution 10h',
            'description' => 'Auto schedule duration source',
            'task_type_id' => null,
            'priority' => 'P2',
            'response_time_minutes' => 60,
            'resolution_time_minutes' => 600,
            'review_time_minutes' => 60,
            'escalation_steps' => [],
            'is_active' => true,
        ]);

        $response = $this->actingAs($creator, 'web')->postJson('/admin/tasks', [
            'title' => 'Holiday-start admin task',
            'task_code' => 'TASK-SCHEDULE-001',
            'start_at' => '2026-01-26 10:00:00',
            'estimate_hours' => 0,
            'sla_policy_id' => $slaPolicy->id,
        ]);

        $response->assertCreated();

        $taskId = (int) $response->json('task.id');
        $task = Task::query()->findOrFail($taskId);

        $this->assertSame('2026-01-27 09:00:00', $task->start_at?->format('Y-m-d H:i:s'));
        $this->assertSame('2026-01-27 19:00:00', $task->due_at?->format('Y-m-d H:i:s'));
        $this->assertSame(10.0, (float) $task->estimate_hours);
    }

    public function test_self_task_creation_derives_duration_from_working_hours_when_duration_is_zero(): void
    {
        $this->withoutMiddleware(ValidateUserSession::class);

        $creator = $this->createSuperAdminUser();

        $response = $this->actingAs($creator, 'web')->postJson('/self/tasks', [
            'title' => 'Derived duration self task',
            'task_code' => 'TASK-SCHEDULE-002',
            'start_at' => '2026-01-27 09:00:00',
            'due_at' => '2026-01-27 12:30:00',
            'estimate_hours' => 0,
            'state' => 'Draft',
        ]);

        $response->assertCreated();

        $taskId = (int) $response->json('data.id');
        $task = Task::query()->findOrFail($taskId);

        $this->assertSame('2026-01-27 09:00:00', $task->start_at?->format('Y-m-d H:i:s'));
        $this->assertSame('2026-01-27 12:30:00', $task->due_at?->format('Y-m-d H:i:s'));
        $this->assertSame(3.5, (float) $task->estimate_hours);
    }

    private function createSuperAdminUser(): User
    {
        $role = Role::query()->create([
            'name' => 'Super Admin',
            'slug' => 'super-admin',
            'guard_name' => 'web',
            'description' => 'Super admin role',
            'is_default' => false,
            'level' => 1,
        ]);

        $user = User::factory()->create();
        $user->roles()->attach($role->id);

        return $user;
    }
}
