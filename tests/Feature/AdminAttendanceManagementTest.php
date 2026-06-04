<?php

namespace Tests\Feature;

use App\Http\Middleware\VerifyCsrfToken;
use App\Models\Employee;
use App\Models\LeaveBalance;
use App\Models\LeaveType;
use App\Models\RemoteWorkAssignment;
use App\Models\Role;
use App\Services\AttendanceCalculationService;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminAttendanceManagementTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutMiddleware(VerifyCsrfToken::class);
    }

    private function signInAsAdmin(): Employee
    {
        $employee = Employee::factory()->create();
        $role = Role::firstOrCreate(['slug' => 'admin'], [
            'name' => 'Administrator',
            'guard_name' => 'web',
        ]);

        $employee->user->assignRole($role);
        $this->actingAs($employee->user, 'web');

        return $employee;
    }

    public function test_admin_created_leave_is_immediately_approved(): void
    {
        $admin = $this->signInAsAdmin();
        $employee = Employee::factory()->create(['code' => 'ADM001']);
        $leaveType = LeaveType::create([
            'name' => 'Casual Leave',
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

        $response = $this->postJson('/api/leave-requests', [
            'employee_id' => $employee->id,
            'leave_type_id' => $leaveType->id,
            'start_date' => '2026-06-12',
            'end_date' => '2026-06-12',
            'reason' => 'Assigned by HR',
        ]);

        $response->assertCreated()
            ->assertJsonPath('status', 'approved');

        $this->assertDatabaseHas('leave_approvals', [
            'leave_request_id' => $response->json('id'),
            'approved_by_user_id' => $admin->user_id,
            'decision' => 'approved',
        ]);
        $this->assertDatabaseHas('attendances', [
            'employee_id' => 'ADM001',
            'attendance_date' => '2026-06-12 00:00:00',
            'punch_in' => null,
            'punch_out' => null,
        ]);
    }

    public function test_admin_can_update_remote_work_assignment_and_overlap_is_rejected(): void
    {
        $this->signInAsAdmin();
        $employee = Employee::factory()->create(['code' => 'RW001']);

        $assignment = RemoteWorkAssignment::create([
            'employee_id' => $employee->id,
            'start_date' => '2026-06-10',
            'end_date' => '2026-06-11',
            'notes' => 'Original',
            'assigned_by_user_id' => auth()->id(),
        ]);

        RemoteWorkAssignment::create([
            'employee_id' => $employee->id,
            'start_date' => '2026-06-20',
            'end_date' => '2026-06-21',
            'notes' => 'Existing',
            'assigned_by_user_id' => auth()->id(),
        ]);

        $this->putJson("/admin/remote-work-assignments/{$assignment->id}", [
            'start_date' => '2026-06-12',
            'end_date' => '2026-06-13',
            'notes' => 'Updated',
        ])
            ->assertOk()
            ->assertJsonPath('notes', 'Updated');

        $this->assertDatabaseMissing('attendances', [
            'employee_id' => 'RW001',
            'attendance_date' => '2026-06-10',
        ]);
        $this->assertDatabaseHas('attendances', [
            'employee_id' => 'RW001',
            'attendance_date' => '2026-06-12',
            'mode' => 'remote',
        ]);

        $this->putJson("/admin/remote-work-assignments/{$assignment->id}", [
            'start_date' => '2026-06-20',
            'end_date' => '2026-06-20',
        ])->assertUnprocessable();
    }

    public function test_admin_field_work_assignment_is_approved_and_affects_attendance_calculation(): void
    {
        $this->signInAsAdmin();
        $employee = Employee::factory()->create([
            'code' => 'FW001',
        ]);

        $response = $this->postJson('/admin/field-work-assignments', [
            'employee_id' => $employee->id,
            'start_date' => '2026-06-15',
            'end_date' => '2026-06-15',
            'location' => 'Client location',
            'description' => 'Installation visit',
        ]);

        $response->assertCreated()
            ->assertJsonPath('status', 'approved');

        $this->assertDatabaseHas('field_work_assignments', [
            'employee_id' => $employee->id,
            'location' => 'Client location',
            'status' => 'approved',
        ]);
        $this->assertDatabaseHas('attendances', [
            'employee_id' => 'FW001',
            'attendance_date' => '2026-06-15',
            'punch_in' => null,
            'punch_out' => null,
        ]);

        $service = app(AttendanceCalculationService::class);

        $this->assertTrue($service->isEmployeeOnFieldWork($employee, Carbon::parse('2026-06-15')));
    }
}
