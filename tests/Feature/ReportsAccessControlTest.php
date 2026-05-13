<?php

namespace Tests\Feature;

use App\Http\Middleware\AdminMiddleware;
use App\Http\Middleware\ValidateUserSession;
use App\Models\Report;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ReportsAccessControlTest extends TestCase
{
    use RefreshDatabase;

    /** @test */
    public function it_blocks_non_admin_users_from_all_reports_and_employee_list_endpoints(): void
    {
        $employee = User::factory()->create();

        Report::query()->create([
            'user_id' => $employee->id,
            'report_date' => now()->toDateString(),
            'title' => 'Daily report',
            'description' => 'Work summary',
            'status' => 'submitted',
            'total_hours' => 1,
        ]);

        $this->withoutMiddleware([
            ValidateUserSession::class,
            AdminMiddleware::class,
        ]);

        $this->actingAs($employee, 'web')
            ->getJson('/admin/api/reports/all')
            ->assertForbidden();

        $this->actingAs($employee, 'web')
            ->getJson('/admin/api/reports/employees')
            ->assertForbidden();
    }

    /** @test */
    public function it_allows_admin_users_to_access_all_reports_and_employee_list_endpoints(): void
    {
        $admin = User::factory()->create();
        $employee = User::factory()->create();

        $adminRole = Role::query()->create([
            'name' => 'Admin',
            'slug' => 'admin',
            'guard_name' => 'web',
            'description' => 'Admin role for tests',
            'is_default' => false,
            'level' => 10,
        ]);

        $admin->roles()->attach($adminRole->id);

        Report::query()->create([
            'user_id' => $employee->id,
            'report_date' => now()->toDateString(),
            'title' => 'Daily report',
            'description' => 'Work summary',
            'status' => 'submitted',
            'total_hours' => 1,
        ]);

        $this->withoutMiddleware([
            ValidateUserSession::class,
            AdminMiddleware::class,
        ]);

        $this->actingAs($admin, 'web')
            ->getJson('/admin/api/reports/employees')
            ->assertOk()
            ->assertJsonFragment(['id' => $employee->id]);

        $this->actingAs($admin, 'web')
            ->getJson('/admin/api/reports/all')
            ->assertOk()
            ->assertJsonPath('total', 1);
    }
}
