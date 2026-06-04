<?php

namespace Tests\Feature;

use App\Models\Employee;
use App\Models\LeaveBalance;
use App\Models\LeaveRequest;
use App\Models\LeaveType;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class LeaveApprovalBalanceDeductionTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    protected function setUp(): void
    {
        parent::setUp();

        $adminEmployee = Employee::factory()->create();
        $role = Role::firstOrCreate(['slug' => 'admin'], [
            'name' => 'Administrator',
            'guard_name' => 'web',
        ]);

        $adminEmployee->user->assignRole($role);
        $this->admin = $adminEmployee->user;
    }

    public function test_full_day_leave_approval_deducts_number_of_leave_days_from_balance(): void
    {
        $employee = Employee::factory()->create(['code' => 'LV001']);
        $leaveType = LeaveType::create([
            'name' => 'Casual Leave',
            'duration_type' => 'full_day',
            'default_hours' => 8,
            'requires_approval' => true,
            'is_paid' => true,
            'carry_over_allowed' => false,
            'is_active' => true,
        ]);

        LeaveBalance::create([
            'employee_id' => $employee->id,
            'leave_type_id' => $leaveType->id,
            'year' => 2026,
            'opening_leaves' => 0,
            'assigned_leaves' => 2,
            'consumed_leaves' => 0,
            'remaining_leaves' => 2,
        ]);

        $leaveRequest = LeaveRequest::create([
            'employee_id' => $employee->id,
            'leave_type_id' => $leaveType->id,
            'start_date' => '2026-06-01',
            'end_date' => '2026-06-02',
            'reason' => 'Family commitment',
            'status' => 'pending',
            'requested_by_user_id' => $employee->user_id,
        ]);

        $response = $this->actingAs($this->admin)
            ->postJson("/api/leave-requests/{$leaveRequest->id}/approve", [
                'notes' => 'Approved.',
            ]);

        $response->assertOk();
        $response->assertJsonPath('message', 'Leave request approved successfully.');

        $this->assertDatabaseHas('leave_requests', [
            'id' => $leaveRequest->id,
            'status' => 'approved',
        ]);

        $this->assertDatabaseHas('leave_approvals', [
            'leave_request_id' => $leaveRequest->id,
            'approved_by_user_id' => $this->admin->id,
            'decision' => 'approved',
        ]);

        $this->assertDatabaseHas('leave_balances', [
            'employee_id' => $employee->id,
            'leave_type_id' => $leaveType->id,
            'year' => 2026,
            'consumed_leaves' => 2,
            'remaining_leaves' => 0,
        ]);

        $this->assertDatabaseHas('attendances', [
            'employee_id' => 'LV001',
            'attendance_date' => '2026-06-01 00:00:00',
            'punch_in' => null,
            'punch_out' => null,
        ]);
    }

    public function test_half_day_leave_approval_still_deducts_one_leave_from_balance(): void
    {
        $employee = Employee::factory()->create(['code' => 'LV002']);
        $leaveType = LeaveType::create([
            'name' => 'Half Day Leave',
            'duration_type' => 'half_day',
            'default_hours' => 8,
            'requires_approval' => true,
            'is_paid' => true,
            'carry_over_allowed' => false,
            'is_active' => true,
        ]);

        LeaveBalance::create([
            'employee_id' => $employee->id,
            'leave_type_id' => $leaveType->id,
            'year' => 2026,
            'opening_leaves' => 0,
            'assigned_leaves' => 1,
            'consumed_leaves' => 0,
            'remaining_leaves' => 1,
        ]);

        $leaveRequest = LeaveRequest::create([
            'employee_id' => $employee->id,
            'leave_type_id' => $leaveType->id,
            'start_date' => '2026-06-03',
            'end_date' => '2026-06-03',
            'reason' => 'Personal work',
            'status' => 'pending',
            'requested_by_user_id' => $employee->user_id,
        ]);

        $response = $this->actingAs($this->admin)
            ->postJson("/api/leave-requests/{$leaveRequest->id}/approve", [
                'notes' => 'Approved.',
            ]);

        $response->assertOk();

        $this->assertDatabaseHas('leave_balances', [
            'employee_id' => $employee->id,
            'leave_type_id' => $leaveType->id,
            'year' => 2026,
            'consumed_leaves' => 1,
            'remaining_leaves' => 0,
        ]);
    }
}
