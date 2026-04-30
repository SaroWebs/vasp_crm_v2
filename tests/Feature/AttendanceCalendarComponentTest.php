<?php

namespace Tests\Feature;

use App\Models\Attendance;
use App\Models\Employee;
use App\Models\Role;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AttendanceCalendarComponentTest extends TestCase
{
    use RefreshDatabase;

    protected Employee $employee;
    protected Employee $otherEmployee;
    protected User $employeeUser;
    protected User $managerUser;
    protected User $unauthorizedUser;
    protected Role $adminRole;
    protected Role $managerRole;
    protected Role $employeeRole;

    protected function setUp(): void
    {
        parent::setUp();

        // Create roles
        $this->adminRole = Role::create(['name' => 'Admin', 'slug' => 'admin']);
        $this->managerRole = Role::create(['name' => 'Manager', 'slug' => 'manager']);
        $this->employeeRole = Role::create(['name' => 'Employee', 'slug' => 'employee']);

        // Create users
        $this->employeeUser = User::factory()->create(['name' => 'Employee User']);
        $this->managerUser = User::factory()->create(['name' => 'Manager User']);
        $this->unauthorizedUser = User::factory()->create(['name' => 'Unauthorized User']);

        // Assign roles
        $this->employeeUser->assignRole($this->employeeRole);
        $this->managerUser->assignRole($this->managerRole);
        $this->unauthorizedUser->assignRole($this->employeeRole);

        // Create employees with codes
        $this->employee = Employee::factory()->create([
            'code' => 'EMP001',
            'user_id' => $this->employeeUser->id,
        ]);

        $this->otherEmployee = Employee::factory()->create([
            'code' => 'EMP002',
            'user_id' => $this->unauthorizedUser->id,
        ]);

        // Create sample attendance records
        $month = now()->month;
        $year = now()->year;

        for ($day = 1; $day <= 5; $day++) {
            $date = Carbon::create($year, $month, $day);
            Attendance::factory()->create([
                'employee_id' => $this->employee->code,
                'attendance_date' => $date,
                'punch_in' => $date->copy()->setTime(9, 0),
                'punch_out' => $date->copy()->setTime(17, 0),
                'mode' => 'office',
            ]);
        }
    }

    public function test_employee_can_view_own_attendance(): void
    {
        $response = $this->actingAs($this->employeeUser)->getJson(
            '/api/attendance/'.$this->employee->id.'?month='.now()->month.'&year='.now()->year
        );

        $response->assertStatus(200);
        $response->assertJson([
            'status' => 'success',
        ]);
        $this->assertCount(5, $response->json('data'));
    }

    public function test_employee_can_view_attendance_by_code(): void
    {
        $response = $this->actingAs($this->employeeUser)->getJson(
            '/api/attendance/'.$this->employee->code.'?month='.now()->month.'&year='.now()->year
        );

        $response->assertStatus(200);
        $response->assertJson([
            'status' => 'success',
        ]);
    }

    public function test_manager_can_view_other_employee_attendance(): void
    {
        $response = $this->actingAs($this->managerUser)->getJson(
            '/api/attendance/'.$this->employee->id.'?month='.now()->month.'&year='.now()->year
        );

        $response->assertStatus(200);
        $response->assertJson([
            'status' => 'success',
        ]);
        $this->assertCount(5, $response->json('data'));
    }

    public function test_employee_cannot_view_other_employee_attendance(): void
    {
        $response = $this->actingAs($this->employeeUser)->getJson(
            '/api/attendance/'.$this->otherEmployee->id.'?month='.now()->month.'&year='.now()->year
        );

        $response->assertStatus(403);
        $response->assertJson([
            'status' => 'error',
            'message' => 'You do not have permission to view this attendance record.',
        ]);
    }

    public function test_unauthenticated_user_cannot_view_attendance(): void
    {
        $response = $this->getJson(
            '/api/attendance/'.$this->employee->id.'?month='.now()->month.'&year='.now()->year
        );

        $response->assertStatus(401);
    }

    public function test_attendance_not_found_returns_404(): void
    {
        $response = $this->actingAs($this->employeeUser)->getJson(
            '/api/attendance/99999?month='.now()->month.'&year='.now()->year
        );

        $response->assertStatus(404);
        $response->assertJson([
            'status' => 'error',
            'message' => 'Employee not found.',
        ]);
    }

    public function test_response_includes_calendar_meta(): void
    {
        $response = $this->actingAs($this->employeeUser)->getJson(
            '/api/attendance/'.$this->employee->id.'?month='.now()->month.'&year='.now()->year
        );

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'status',
            'message',
            'data',
            'summary' => [
                'total_days',
                'present_days',
                'absent_days',
                'late_days',
                'total_hours',
            ],
            'calendar' => [
                'working_hours',
                'holidays',
            ],
            'month',
            'year',
        ]);
    }

    public function test_attendance_summary_is_calculated(): void
    {
        $response = $this->actingAs($this->employeeUser)->getJson(
            '/api/attendance/'.$this->employee->id.'?month='.now()->month.'&year='.now()->year
        );

        $summary = $response->json('summary');
        $this->assertGreaterThan(0, $summary['total_days']);
        $this->assertGreaterThan(0, $summary['present_days']);
        $this->assertGreaterThanOrEqual(0, $summary['absent_days']);
    }

    public function test_filters_by_month_and_year(): void
    {
        // Create attendance for a different month
        $lastMonth = now()->subMonth();
        Attendance::factory()->create([
            'employee_id' => $this->employee->code,
            'attendance_date' => $lastMonth->copy()->setDay(15),
            'punch_in' => $lastMonth->copy()->setTime(9, 0),
            'punch_out' => $lastMonth->copy()->setTime(17, 0),
        ]);

        $response = $this->actingAs($this->employeeUser)->getJson(
            '/api/attendance/'.$this->employee->id.'?month='.now()->month.'&year='.now()->year
        );

        $this->assertCount(5, $response->json('data'));
    }

    public function test_admin_role_can_view_any_attendance(): void
    {
        $adminUser = User::factory()->create();
        $adminUser->assignRole($this->adminRole);

        $response = $this->actingAs($adminUser)->getJson(
            '/api/attendance/'.$this->employee->id.'?month='.now()->month.'&year='.now()->year
        );

        $response->assertStatus(200);
    }
}
