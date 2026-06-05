<?php

namespace Tests\Feature;

use App\Models\Department;
use App\Models\Employee;
use App\Models\LeaveBalance;
use App\Models\LeaveType;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class LeaveBalanceBulkAssignTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    private LeaveType $leaveType;

    private Department $department;

    protected function setUp(): void
    {
        parent::setUp();

        // Create admin user
        $adminEmployee = Employee::factory()->create();
        $role = Role::firstOrCreate(['slug' => 'admin'], [
            'name' => 'Administrator',
            'guard_name' => 'web',
        ]);
        $adminEmployee->user->assignRole($role);
        $this->admin = $adminEmployee->user;

        // Create leave type
        $this->leaveType = LeaveType::factory()->create([
            'name' => 'Casual Leave',
            'is_active' => true,
        ]);

        // Create department
        $this->department = Department::factory()->create();
    }

    public function test_bulk_assign_creates_leave_balances_for_all_employees(): void
    {
        $employees = Employee::factory()
            ->count(3)
            ->create(['department_id' => $this->department->id]);

        $response = $this->actingAs($this->admin)
            ->postJson('/api/leave-balances/bulk-assign', [
                'leave_type_id' => $this->leaveType->id,
                'employee_ids' => $employees->pluck('id')->toArray(),
                'number_of_leaves' => 8,
                'year' => 2026,
            ]);

        $response->assertStatus(201);
        $response->assertJsonPath('results.created', 3);
        $response->assertJsonPath('results.updated', 0);
        $response->assertJsonPath('results.failed', 0);

        // Verify leave balances were created
        foreach ($employees as $employee) {
            $this->assertDatabaseHas('leave_balances', [
                'employee_id' => $employee->id,
                'leave_type_id' => $this->leaveType->id,
                'year' => 2026,
                'assigned_leaves' => 8,
            ]);
        }
    }

    public function test_bulk_assign_updates_existing_leave_balances(): void
    {
        $employee = Employee::factory()->create(['department_id' => $this->department->id]);

        // Create existing leave balance
        LeaveBalance::create([
            'employee_id' => $employee->id,
            'leave_type_id' => $this->leaveType->id,
            'year' => 2026,
            'opening_leaves' => 0,
            'assigned_leaves' => 5,
            'consumed_leaves' => 0,
            'remaining_leaves' => 5,
        ]);

        $response = $this->actingAs($this->admin)
            ->postJson('/api/leave-balances/bulk-assign', [
                'leave_type_id' => $this->leaveType->id,
                'employee_ids' => [$employee->id],
                'number_of_leaves' => 8,
                'year' => 2026,
            ]);

        $response->assertStatus(201);
        $response->assertJsonPath('results.created', 0);
        $response->assertJsonPath('results.updated', 1);
        $response->assertJsonPath('results.failed', 0);

        // Verify balance was updated
        $this->assertDatabaseHas('leave_balances', [
            'employee_id' => $employee->id,
            'leave_type_id' => $this->leaveType->id,
            'year' => 2026,
            'assigned_leaves' => 8,
            'remaining_leaves' => 8,
        ]);
    }

    public function test_index_returns_leave_balances_grouped_by_employee(): void
    {
        $employee = Employee::factory()->create([
            'name' => 'Mr XYZ',
            'department_id' => $this->department->id,
        ]);
        $sickLeaveType = LeaveType::factory()->create([
            'name' => 'Sick Leave',
            'is_active' => true,
        ]);

        LeaveBalance::create([
            'employee_id' => $employee->id,
            'leave_type_id' => $this->leaveType->id,
            'year' => 2026,
            'opening_leaves' => 2,
            'assigned_leaves' => 18,
            'consumed_leaves' => 11,
            'remaining_leaves' => 9,
        ]);

        LeaveBalance::create([
            'employee_id' => $employee->id,
            'leave_type_id' => $sickLeaveType->id,
            'year' => 2026,
            'opening_leaves' => 0,
            'assigned_leaves' => 6,
            'consumed_leaves' => 2,
            'remaining_leaves' => 4,
        ]);

        $response = $this->actingAs($this->admin)
            ->getJson('/api/leave-balances?year=2026');

        $response->assertOk();
        $response->assertJsonPath("employees.{$employee->id}.employee.name", 'Mr XYZ');
        $response->assertJsonPath("employees.{$employee->id}.leaves.casual_leave.assigned", 18);
        $response->assertJsonPath("employees.{$employee->id}.leaves.casual_leave.used", 11);
        $response->assertJsonPath("employees.{$employee->id}.leaves.casual_leave.remaining", 9);
        $response->assertJsonPath("employees.{$employee->id}.leaves.casual_leave.carry_over", 2);
        $response->assertJsonPath("employees.{$employee->id}.leaves.sick_leave.assigned", 6);
        $response->assertJsonPath("employees.{$employee->id}.leaves.sick_leave.used", 2);
        $response->assertJsonCount(2, "employees.{$employee->id}.leaves");
    }

    public function test_bulk_assign_validates_required_fields(): void
    {
        $response = $this->actingAs($this->admin)
            ->postJson('/api/leave-balances/bulk-assign', []);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['leave_type_id', 'employee_ids', 'number_of_leaves', 'year']);
    }

    public function test_bulk_assign_validates_leave_type_exists(): void
    {
        $employee = Employee::factory()->create();

        $response = $this->actingAs($this->admin)
            ->postJson('/api/leave-balances/bulk-assign', [
                'leave_type_id' => 9999,
                'employee_ids' => [$employee->id],
                'number_of_leaves' => 8,
                'year' => 2026,
            ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors('leave_type_id');
    }

    public function test_bulk_assign_validates_number_of_leaves_positive(): void
    {
        $employee = Employee::factory()->create();

        $response = $this->actingAs($this->admin)
            ->postJson('/api/leave-balances/bulk-assign', [
                'leave_type_id' => $this->leaveType->id,
                'employee_ids' => [$employee->id],
                'number_of_leaves' => -5,
                'year' => 2026,
            ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors('number_of_leaves');
    }

    public function test_bulk_assign_validates_year_is_numeric(): void
    {
        $employee = Employee::factory()->create();

        $response = $this->actingAs($this->admin)
            ->postJson('/api/leave-balances/bulk-assign', [
                'leave_type_id' => $this->leaveType->id,
                'employee_ids' => [$employee->id],
                'number_of_leaves' => 8,
                'year' => 'invalid',
            ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors('year');
    }

    public function test_bulk_assign_requires_authentication(): void
    {
        $response = $this->postJson('/api/leave-balances/bulk-assign', [
            'leave_type_id' => $this->leaveType->id,
            'employee_ids' => [1],
            'number_of_leaves' => 8,
            'year' => 2026,
        ]);

        $response->assertStatus(401);
    }

    public function test_leave_balance_calculates_closing_balance(): void
    {
        $employee = Employee::factory()->create(['department_id' => $this->department->id]);

        $this->actingAs($this->admin)
            ->postJson('/api/leave-balances/bulk-assign', [
                'leave_type_id' => $this->leaveType->id,
                'employee_ids' => [$employee->id],
                'number_of_leaves' => 8,
                'year' => 2026,
            ]);

        $leaveBalance = LeaveBalance::where('employee_id', $employee->id)
            ->where('leave_type_id', $this->leaveType->id)
            ->where('year', 2026)
            ->first();

        // remaining_leaves = opening_leaves + assigned_leaves - consumed_leaves
        $expectedRemainingLeaves = 0 + 8 - 0;
        $this->assertEquals($expectedRemainingLeaves, $leaveBalance->remaining_leaves);
    }
}
