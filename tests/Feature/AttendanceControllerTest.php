<?php

namespace Tests\Feature;

use App\Http\Middleware\ValidateUserSession;
use App\Models\Attendance;
use App\Models\Employee;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AttendanceControllerTest extends TestCase
{
    use RefreshDatabase;

    protected User $admin;

    protected Employee $employee;

    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutMiddleware([ValidateUserSession::class]);

        $role = Role::create(['name' => 'Super Admin', 'slug' => 'super-admin']);
        $this->admin = User::factory()->create(['session_id' => session()->getId()]);
        $this->admin->roles()->attach($role->id);

        // Employee's user also gets the role so it passes AdminMiddleware
        $employeeUser = User::factory()->create();
        $employeeUser->roles()->attach($role->id);
        $this->employee = Employee::factory()->create([
            'code' => 'EMP-1001',
            'user_id' => $employeeUser->id,
        ]);
    }

    /**
     * Create a user that passes AdminMiddleware (has an internal role)
     * but has no employee relationship.
     */
    private function makeRoleUser(): User
    {
        $user = User::factory()->create();
        $user->roles()->attach(Role::where('slug', 'super-admin')->first()->id);

        return $user;
    }

    // -------------------------------------------------------------------------
    // punchEntry
    // -------------------------------------------------------------------------

    public function test_punch_entry_creates_punch_in_when_no_record_exists(): void
    {
        $user = $this->employee->user;

        $response = $this->actingAs($user, 'web')
            ->postJson('/api/my/attendance/punch', [
                'mode' => 'office',
                'punch_time' => '2026-04-29 09:00:00',
            ]);

        $response->assertStatus(200)
            ->assertJsonPath('status', 'success')
            ->assertJsonPath('data.punch_in', '09:00:00')
            ->assertJsonPath('data.punch_out', null);

        $this->assertDatabaseHas('attendances', [
            'employee_id' => 'EMP-1001',
            'attendance_date' => '2026-04-29',
            'punch_in' => '09:00:00',
            'punch_out' => null,
        ]);
    }

    public function test_punch_entry_sets_punch_out_on_second_call(): void
    {
        $user = $this->employee->user;

        // First punch → punch_in
        $this->actingAs($user, 'web')
            ->postJson('/api/my/attendance/punch', ['punch_time' => '2026-04-29 09:00:00']);

        // Second punch → punch_out
        $response = $this->actingAs($user, 'web')
            ->postJson('/api/my/attendance/punch', ['punch_time' => '2026-04-29 18:00:00']);

        $response->assertStatus(200)
            ->assertJsonPath('data.punch_in', '09:00:00')
            ->assertJsonPath('data.punch_out', '18:00:00');
    }

    public function test_punch_entry_returns_404_when_user_has_no_employee_record(): void
    {
        // $this->admin has a role (passes middleware) but has no employee relationship
        $response = $this->actingAs($this->admin, 'web')
            ->postJson('/api/my/attendance/punch');

        $response->assertStatus(404)
            ->assertJsonPath('status', 'error');
    }

    public function test_punch_entry_returns_404_when_employee_has_no_code(): void
    {
        $userWithRole = $this->makeRoleUser();
        Employee::factory()->create(['code' => null, 'user_id' => $userWithRole->id]);

        $response = $this->actingAs($userWithRole, 'web')
            ->postJson('/api/my/attendance/punch');

        $response->assertStatus(404)
            ->assertJsonPath('status', 'error');
    }

    // -------------------------------------------------------------------------
    // getEmployeeAttendance
    // -------------------------------------------------------------------------

    public function test_get_employee_attendance_returns_correct_month_records(): void
    {
        $user = $this->employee->user;

        Attendance::factory()->create([
            'employee_id' => 'EMP-1001',
            'attendance_date' => '2026-04-10',
        ]);
        Attendance::factory()->create([
            'employee_id' => 'EMP-1001',
            'attendance_date' => '2026-03-15', // different month — should be excluded
        ]);

        $response = $this->actingAs($user, 'web')
            ->getJson('/api/my/attendance?month=4&year=2026');

        $response->assertStatus(200)
            ->assertJsonPath('status', 'success')
            ->assertJsonCount(1, 'data')
            ->assertJsonStructure([
                'calendar' => ['working_hours', 'holidays'],
                'month',
                'year',
            ]);
    }

    public function test_get_employee_attendance_returns_404_for_user_without_employee(): void
    {
        // $this->admin passes middleware but has no employee relationship
        $response = $this->actingAs($this->admin, 'web')
            ->getJson('/api/my/attendance');

        $response->assertStatus(404);
    }

    // -------------------------------------------------------------------------
    // adminGetEmployeeAttendance
    // -------------------------------------------------------------------------

    public function test_admin_can_fetch_employee_attendance_with_summary(): void
    {
        Attendance::factory()->create([
            'employee_id' => 'EMP-1001',
            'attendance_date' => '2026-04-10',
            'punch_in' => '09:30:00',
            'punch_out' => '18:00:00',
        ]);

        $response = $this->actingAs($this->admin, 'web')
            ->getJson(route('admin.api.attendance.employee', $this->employee).'?month=4&year=2026');

        $response->assertStatus(200)
            ->assertJsonPath('status', 'success')
            ->assertJsonCount(1, 'data')
            ->assertJsonStructure([
                'summary' => [
                    'total_working_days',
                    'present_days',
                    'absent_days',
                    'late_days',
                    'total_hours',
                ],
                'calendar' => ['working_hours', 'holidays'],
                'month',
                'year',
            ]);
    }

    public function test_admin_attendance_summary_marks_late_when_punch_in_after_nine(): void
    {
        Attendance::factory()->create([
            'employee_id' => 'EMP-1001',
            'attendance_date' => '2026-04-10',
            'punch_in' => '09:30:00', // late
        ]);

        $response = $this->actingAs($this->admin, 'web')
            ->getJson(route('admin.api.attendance.employee', $this->employee).'?month=4&year=2026');

        $response->assertStatus(200)
            ->assertJsonPath('summary.late_days', 1);
    }

    // -------------------------------------------------------------------------
    // adminGetAllAttendanceSummary
    // -------------------------------------------------------------------------

    public function test_admin_can_fetch_all_employees_attendance_summary(): void
    {
        Employee::factory()->count(2)->create();

        $response = $this->actingAs($this->admin, 'web')
            ->getJson(route('admin.api.attendance.summary').'?month=4&year=2026');

        $response->assertStatus(200)
            ->assertJsonPath('status', 'success')
            ->assertJsonStructure([
                'data' => [
                    '*' => ['id', 'name', 'code', 'department', 'summary'],
                ],
            ]);
    }

    // -------------------------------------------------------------------------
    // adminOverrideAttendance
    // -------------------------------------------------------------------------

    public function test_admin_override_creates_punch_in_for_employee(): void
    {
        $response = $this->actingAs($this->admin, 'web')
            ->postJson(route('admin.api.attendance.override', $this->employee), [
                'attendance_date' => '2026-04-15',
                'punch_in' => '08:45',
                'mode' => 'office',
            ]);

        $response->assertStatus(200)
            ->assertJsonPath('status', 'success')
            ->assertJsonPath('data.punch_in', '08:45:00')
            ->assertJsonPath('data.punch_out', null);

        $this->assertDatabaseHas('attendances', [
            'employee_id' => 'EMP-1001',
            'attendance_date' => '2026-04-15',
            'punch_in' => '08:45:00',
        ]);
    }

    public function test_admin_override_updates_existing_record(): void
    {
        $this->actingAs($this->admin, 'web')
            ->postJson(route('admin.api.attendance.override', $this->employee), [
                'attendance_date' => '2026-04-15',
                'punch_in' => '09:00',
            ]);

        $response = $this->actingAs($this->admin, 'web')
            ->postJson(route('admin.api.attendance.override', $this->employee), [
                'attendance_date' => '2026-04-15',
                'punch_in' => '09:00',
                'punch_out' => '18:00',
            ]);

        $response->assertStatus(200)
            ->assertJsonPath('data.punch_in', '09:00:00')
            ->assertJsonPath('data.punch_out', '18:00:00');
    }

    public function test_admin_override_returns_422_for_employee_without_code(): void
    {
        $employeeWithoutCode = Employee::factory()->create(['code' => null]);

        $response = $this->actingAs($this->admin, 'web')
            ->postJson(route('admin.api.attendance.override', $employeeWithoutCode), [
                'attendance_date' => '2026-04-15',
                'punch_in' => '09:00',
            ]);

        $response->assertStatus(422)
            ->assertJsonPath('status', 'error');
    }

    public function test_admin_override_validates_required_fields(): void
    {
        $response = $this->actingAs($this->admin, 'web')
            ->postJson(route('admin.api.attendance.override', $this->employee), [
                'mode' => 'office',
                // attendance_date and punch_in intentionally omitted
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['attendance_date', 'punch_in']);
    }

    // -------------------------------------------------------------------------
    // adminDeleteAttendance
    // -------------------------------------------------------------------------

    public function test_admin_can_delete_attendance_record(): void
    {
        $attendance = Attendance::factory()->create(['employee_id' => 'EMP-1001']);

        $response = $this->actingAs($this->admin, 'web')
            ->deleteJson(route('admin.api.attendance.delete', $attendance));

        $response->assertStatus(200)
            ->assertJsonPath('status', 'success');

        $this->assertDatabaseMissing('attendances', ['id' => $attendance->id]);
    }

    public function test_admin_delete_returns_404_for_missing_record(): void
    {
        $response = $this->actingAs($this->admin, 'web')
            ->deleteJson(route('admin.api.attendance.delete', 9999));

        $response->assertStatus(404);
    }
}
