<?php

namespace Tests\Feature;

use App\Http\Middleware\ValidateWebhookPassword;
use App\Http\Middleware\VerifyCsrfToken;
use App\Models\Employee;
use App\Models\LeaveBalance;
use App\Models\LeaveRequest;
use App\Models\LeaveType;
use App\Models\RemoteWorkRequest;
use App\Models\Role;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MyAttendanceApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutMiddleware(VerifyCsrfToken::class);
        $this->withoutMiddleware(ValidateWebhookPassword::class);
    }

    private function signInAsEmployee(): Employee
    {
        $employee = Employee::factory()->create([
            'code' => 'EMP001',
        ]);

        $employee->user->assignRole(Role::firstOrCreate(['slug' => 'employee'], ['name' => 'Employee', 'guard_name' => 'web']));

        $this->actingAs($employee->user, 'web');

        return $employee;
    }

    public function test_get_todays_attendance_returns_success(): void
    {
        $employee = $this->signInAsEmployee();

        $response = $this->getJson('/api/my/attendance/today');

        $response->assertOk()
            ->assertJsonStructure([
                'status',
                'data' => [
                    'attendance_date',
                    'punch_in',
                    'punch_out',
                    'mode',
                    'status',
                    'shift' => [
                        'shift_id',
                        'start_time',
                        'end_time',
                        'grace_minutes',
                        'is_half_day',
                        'is_leave_day',
                        'is_holiday',
                        'is_field_work',
                        'is_remote_work',
                    ],
                ],
            ]);
    }

    public function test_get_todays_attendance_requires_employee_code(): void
    {
        $employee = Employee::factory()->create([
            'code' => null,
        ]);

        $employee->user->assignRole(Role::firstOrCreate(['slug' => 'employee'], ['name' => 'Employee', 'guard_name' => 'web']));

        $this->actingAs($employee->user, 'web');

        $response = $this->getJson('/api/my/attendance/today');

        $response->assertStatus(404)
            ->assertJson([
                'status' => 'error',
                'message' => 'Employee code is required for attendance entry. Please contact admin to generate biometric employee ID.',
            ]);
    }

    public function test_get_leave_requests_returns_employee_leaves(): void
    {
        $employee = $this->signInAsEmployee();

        $leaveType = LeaveType::create(['name' => 'Casual Leave', 'is_active' => true]);

        LeaveRequest::create([
            'employee_id' => $employee->id,
            'leave_type_id' => $leaveType->id,
            'start_date' => '2026-05-20',
            'end_date' => '2026-05-20',
            'reason' => 'Testing',
            'status' => 'approved',
            'requested_by_user_id' => $employee->user->id,
        ]);

        $response = $this->getJson('/api/my/leaves');

        $response->assertOk()
            ->assertJsonStructure([
                'status',
                'data',
                'month',
                'year',
            ]);
    }

    public function test_store_leave_request_creates_request(): void
    {
        $employee = $this->signInAsEmployee();

        $leaveType = LeaveType::create([
            'name' => 'Casual Leave',
            'is_active' => true,
        ]);

        $response = $this->postJson('/api/my/leaves', [
            'leave_type_id' => $leaveType->id,
            'start_date' => '2026-06-01',
            'end_date' => '2026-06-02',
            'reason' => 'Family emergency',
        ]);

        $response->assertStatus(201)
            ->assertJson([
                'status' => 'success',
                'message' => 'Leave request submitted successfully.',
            ]);

        $this->assertDatabaseHas('leave_requests', [
            'employee_id' => $employee->id,
            'status' => 'pending',
        ]);
    }

    public function test_get_remote_work_requests_returns_employee_requests(): void
    {
        $employee = $this->signInAsEmployee();

        RemoteWorkRequest::create([
            'employee_id' => $employee->id,
            'start_date' => '2026-05-25',
            'end_date' => '2026-05-26',
            'reason' => 'Work from home',
            'status' => 'approved',
            'requested_by_user_id' => $employee->user->id,
        ]);

        $response = $this->getJson('/api/my/remote-work');

        $response->assertOk()
            ->assertJsonStructure([
                'status',
                'data',
                'month',
                'year',
            ]);
    }

    public function test_store_remote_work_request_creates_request(): void
    {
        $employee = $this->signInAsEmployee();

        $response = $this->postJson('/api/my/remote-work', [
            'start_date' => '2026-06-01',
            'end_date' => '2026-06-02',
            'reason' => 'Working from home',
        ]);

        $response->assertStatus(201)
            ->assertJson([
                'status' => 'success',
                'message' => 'Remote work request submitted successfully.',
            ]);

        $this->assertDatabaseHas('remote_work_requests', [
            'employee_id' => $employee->id,
            'status' => 'pending',
        ]);
    }

    public function test_get_leave_balances_returns_employee_balances(): void
    {
        $employee = $this->signInAsEmployee();

        $leaveType = LeaveType::create([
            'name' => 'Casual Leave',
            'is_active' => true,
        ]);

        LeaveBalance::create([
            'employee_id' => $employee->id,
            'leave_type_id' => $leaveType->id,
            'year' => 2026,
            'opening_leaves' => 12,
            'assigned_leaves' => 12,
            'consumed_leaves' => 2,
            'remaining_leaves' => 10,
        ]);

        $response = $this->getJson('/api/my/leave-balances?year=2026');

        $response->assertOk()
            ->assertJsonStructure([
                'status',
                'data',
                'year',
            ]);
    }
}
