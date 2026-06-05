<?php

namespace Tests\Feature;

use App\Models\Employee;
use App\Models\EmployeeCategory;
use App\Models\EmployeeShiftAssignment;
use App\Models\Role;
use App\Models\Shift;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Tests\TestCase;

class EmployeeIndexLazyLoadingTest extends TestCase
{
    use RefreshDatabase;

    public function test_employee_index_json_returns_lightweight_employee_rows(): void
    {
        $this->actingAsSuperAdmin();

        $employee = Employee::factory()->create([
            'category_id' => EmployeeCategory::factory()->create()->id,
        ]);

        $shift = Shift::create([
            'name' => 'Morning Shift',
            'start_time' => '09:00:00',
            'end_time' => '17:00:00',
            'grace_minutes' => 10,
            'is_active' => true,
        ]);

        EmployeeShiftAssignment::create([
            'employee_id' => $employee->id,
            'shift_id' => $shift->id,
            'effective_from' => Carbon::today()->toDateString(),
            'effective_to' => null,
            'is_active' => true,
        ]);

        $response = $this->getJson('/admin/employees');

        $response->assertOk();

        $row = $response->json('data.0');

        $this->assertSame($employee->id, $row['id']);
        $this->assertArrayHasKey('department', $row);
        $this->assertArrayNotHasKey('user', $row);
        $this->assertArrayNotHasKey('category', $row);
        $this->assertArrayNotHasKey('currentShiftAssignment', $row);
        $this->assertArrayNotHasKey('permission_counts', $row);
    }

    public function test_employee_show_json_defers_shift_history_payload(): void
    {
        $this->actingAsSuperAdmin();

        $employee = Employee::factory()->create([
            'category_id' => EmployeeCategory::factory()->create()->id,
        ]);

        $shift = Shift::create([
            'name' => 'Morning Shift',
            'start_time' => '09:00:00',
            'end_time' => '17:00:00',
            'grace_minutes' => 10,
            'is_active' => true,
        ]);

        EmployeeShiftAssignment::create([
            'employee_id' => $employee->id,
            'shift_id' => $shift->id,
            'effective_from' => Carbon::today()->toDateString(),
            'effective_to' => null,
            'is_active' => true,
        ]);

        $response = $this->getJson("/admin/employees/{$employee->id}");

        $response->assertOk()
            ->assertJsonPath('employee.id', $employee->id)
            ->assertJsonPath('employee.category.id', $employee->category_id)
            ->assertJsonPath('employee.user.id', $employee->user_id);

        $payload = $response->json('employee');

        $this->assertArrayNotHasKey('currentShiftAssignment', $payload);
        $this->assertArrayNotHasKey('shiftAssignmentHistory', $payload);
    }

    private function actingAsSuperAdmin(): User
    {
        $role = Role::create([
            'name' => 'Super Admin',
            'slug' => 'super-admin',
            'guard_name' => 'web',
        ]);

        $user = User::factory()->create([
            'status' => 'active',
        ]);
        $user->assignRole($role);
        $this->actingAs($user, 'web');

        return $user;
    }
}
