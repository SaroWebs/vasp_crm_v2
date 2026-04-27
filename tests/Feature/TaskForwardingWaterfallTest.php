<?php

namespace Tests\Feature;

use App\Http\Middleware\AdminMiddleware;
use App\Http\Middleware\ValidateUserSession;
use App\Models\Role;
use App\Models\Task;
use App\Models\TaskForwarding;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Tests\TestCase;

class TaskForwardingWaterfallTest extends TestCase
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

    public function test_task_details_include_forwarding_waterfall_chain_for_multi_hop_forwarding(): void
    {
        Carbon::setTestNow(Carbon::parse('2026-04-27 10:00:00'));

        $viewer = $this->createInternalUser('Viewer');
        $employeeOne = $this->createInternalUser('E1');
        $employeeFive = $this->createInternalUser('E5');
        $employeeEight = $this->createInternalUser('E8');

        $departmentOne = $this->createDepartment('Ops');
        $departmentTwo = $this->createDepartment('QA');
        $departmentThree = $this->createDepartment('Security');

        $task = Task::query()->create([
            'task_code' => 'TASK-'.Str::upper(Str::random(10)),
            'title' => 'Forward chain task',
            'state' => 'Assigned',
            'created_by' => $viewer->id,
            'due_at' => now()->addDays(2),
            'estimate_hours' => 5,
        ]);

        TaskForwarding::query()->create([
            'task_id' => $task->id,
            'from_user_id' => $employeeOne->id,
            'to_user_id' => $employeeFive->id,
            'from_department_id' => $departmentOne['id'],
            'to_department_id' => $departmentTwo['id'],
            'forwarded_by' => $employeeOne->id,
            'status' => 'pending',
            'created_at' => now()->subHours(2),
            'updated_at' => now()->subHours(2),
        ]);

        TaskForwarding::query()->create([
            'task_id' => $task->id,
            'from_user_id' => $employeeFive->id,
            'to_user_id' => $employeeEight->id,
            'from_department_id' => $departmentTwo['id'],
            'to_department_id' => $departmentThree['id'],
            'forwarded_by' => $employeeFive->id,
            'status' => 'pending',
            'created_at' => now()->subHour(),
            'updated_at' => now()->subHour(),
        ]);

        $response = $this->actingAs($viewer, 'web')
            ->getJson("/data/tasks/{$task->id}")
            ->assertOk()
            ->assertJsonPath('data.has_forwardings', true)
            ->assertJsonPath('data.forwardings_count', 2);

        $waterfall = $response->json('data.forwarding_waterfall');

        $this->assertIsArray($waterfall);
        $this->assertCount(2, $waterfall);
        $this->assertSame('E1', $waterfall[0]['from_label']);
        $this->assertSame('E5', $waterfall[0]['to_label']);
        $this->assertSame('E5', $waterfall[1]['from_label']);
        $this->assertSame('E8', $waterfall[1]['to_label']);
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
