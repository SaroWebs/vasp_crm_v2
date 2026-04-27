<?php

namespace Tests\Feature;

use App\Http\Middleware\AdminMiddleware;
use App\Http\Middleware\ValidateUserSession;
use App\Models\Role;
use App\Models\Task;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Tests\TestCase;

class TaskForwardingStoreTest extends TestCase
{
    use RefreshDatabase;

    private Role $superAdminRole;

    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutMiddleware(AdminMiddleware::class);
        $this->withoutMiddleware(ValidateUserSession::class);

        $this->superAdminRole = Role::query()->firstOrCreate(
            ['slug' => 'super-admin'],
            [
                'name' => 'Super Admin',
                'guard_name' => 'web',
                'description' => 'Super admin role for forwarding tests',
                'is_default' => false,
                'level' => 1,
            ]
        );
    }

    public function test_task_forwarding_store_forwards_to_employee_and_creates_assignment(): void
    {
        $forwarder = $this->createInternalUser('Forwarder');
        $targetUser = $this->createInternalUser('Target Employee');

        $fromDepartment = $this->createDepartment('Operations');
        $toDepartment = $this->createDepartment('Engineering');

        DB::table('department_users')->insert([
            'department_id' => $fromDepartment['id'],
            'user_id' => $forwarder->id,
            'assigned_by' => $forwarder->id,
            'assigned_at' => now(),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        DB::table('department_users')->insert([
            'department_id' => $toDepartment['id'],
            'user_id' => $targetUser->id,
            'assigned_by' => $forwarder->id,
            'assigned_at' => now(),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $task = Task::query()->create([
            'task_code' => 'TASK-'.Str::upper(Str::random(10)),
            'title' => 'Forward to employee test task',
            'state' => 'Assigned',
            'created_by' => $forwarder->id,
            'assigned_department_id' => $fromDepartment['id'],
            'due_at' => now()->addDay(),
            'estimate_hours' => 3,
        ]);

        $response = $this->actingAs($forwarder, 'web')
            ->postJson("/data/tasks/{$task->id}/forwardings", [
                'to_user_id' => $targetUser->id,
                'reason' => 'Needs implementation support',
                'notes' => 'Please handle this task',
            ]);

        $response
            ->assertCreated()
            ->assertJsonPath('message', 'Task forwarded successfully')
            ->assertJsonPath('data.to_user_id', $targetUser->id)
            ->assertJsonPath('data.from_user_id', $forwarder->id)
            ->assertJsonPath('data.to_department_id', $toDepartment['id']);

        $this->assertDatabaseHas('task_forwardings', [
            'task_id' => $task->id,
            'from_user_id' => $forwarder->id,
            'to_user_id' => $targetUser->id,
            'to_department_id' => $toDepartment['id'],
            'status' => 'pending',
        ]);

        $this->assertDatabaseHas('task_assignments', [
            'task_id' => $task->id,
            'user_id' => $targetUser->id,
            'assigned_by' => $forwarder->id,
            'is_active' => true,
        ]);

        $this->assertDatabaseHas('tasks', [
            'id' => $task->id,
            'current_owner_kind' => 'USER',
            'current_owner_id' => $targetUser->id,
        ]);
    }

    private function createInternalUser(string $name): User
    {
        $user = User::factory()->create([
            'name' => $name,
        ]);
        $user->roles()->syncWithoutDetaching([$this->superAdminRole->id]);

        return $user;
    }

    /**
     * @return array{id:int,name:string}
     */
    private function createDepartment(string $name): array
    {
        $departmentId = DB::table('departments')->insertGetId([
            'name' => $name,
            'slug' => Str::slug($name).'-'.Str::lower(Str::random(4)),
            'color' => '#3B82F6',
            'sort_order' => 0,
            'status' => 'active',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return [
            'id' => $departmentId,
            'name' => $name,
        ];
    }
}
