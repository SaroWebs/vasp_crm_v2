<?php

namespace Tests\Feature;

use App\Models\Employee;
use App\Models\EmployeeShiftAssignment;
use App\Models\Holiday;
use App\Models\LeaveType;
use App\Models\Shift;
use App\Models\User;
use App\Services\AttendanceCalculationService;
use App\Services\WorkingHoursService;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AttendanceCalculationTest extends TestCase
{
    use RefreshDatabase;

    private AttendanceCalculationService $service;

    private WorkingHoursService $workingHours;

    protected function setUp(): void
    {
        parent::setUp();
        $this->workingHours = app(WorkingHoursService::class);
        $this->service = app(AttendanceCalculationService::class);
    }

    /**
     * Test early arrival: employee comes before scheduled start time.
     */
    public function test_early_in_calculation(): void
    {
        $shiftMeta = [
            'shift_id' => null,
            'start_time' => '09:00:00',
            'end_time' => '19:00:00',
            'grace_minutes' => 0,
            'is_half_day' => false,
            'is_leave_day' => false,
            'is_holiday' => false,
            'is_field_work' => false,
            'is_remote_work' => false,
        ];

        $attendanceDate = '2026-05-25'; // Monday
        $punchIn = '08:30:00'; // 30 minutes early
        $punchOut = '19:00:00';

        $metrics = $this->service->buildShiftMetrics($attendanceDate, $punchIn, $punchOut, $shiftMeta);

        $this->assertTrue($metrics['is_early_in']);
        $this->assertFalse($metrics['is_late_in']);
        $this->assertEquals(30, $metrics['early_in_minutes']);
        $this->assertEquals(0, $metrics['late_in_minutes']);
        $this->assertEquals(30, $metrics['overtime_minutes']);
    }

    /**
     * Test late arrival: employee comes after grace period.
     */
    public function test_late_in_calculation(): void
    {
        $shiftMeta = [
            'shift_id' => null,
            'start_time' => '09:00:00',
            'end_time' => '19:00:00',
            'grace_minutes' => 5, // 5 minutes grace
            'is_half_day' => false,
            'is_leave_day' => false,
            'is_holiday' => false,
            'is_field_work' => false,
            'is_remote_work' => false,
        ];

        $attendanceDate = '2026-05-25'; // Monday
        $punchIn = '09:15:00'; // 10 minutes late (after grace)
        $punchOut = '19:00:00';

        $metrics = $this->service->buildShiftMetrics($attendanceDate, $punchIn, $punchOut, $shiftMeta);

        $this->assertFalse($metrics['is_early_in']);
        $this->assertTrue($metrics['is_late_in']);
        $this->assertEquals(0, $metrics['early_in_minutes']);
        $this->assertEquals(10, $metrics['late_in_minutes']);
    }

    /**
     * Test early out: employee leaves before scheduled end time.
     */
    public function test_early_out_calculation(): void
    {
        $shiftMeta = [
            'shift_id' => null,
            'start_time' => '09:00:00',
            'end_time' => '19:00:00',
            'grace_minutes' => 0,
            'is_half_day' => false,
            'is_leave_day' => false,
            'is_holiday' => false,
            'is_field_work' => false,
            'is_remote_work' => false,
        ];

        $attendanceDate = '2026-05-25'; // Monday
        $punchIn = '09:00:00';
        $punchOut = '18:30:00'; // 30 minutes early

        $metrics = $this->service->buildShiftMetrics($attendanceDate, $punchIn, $punchOut, $shiftMeta);

        $this->assertTrue($metrics['is_early_out']);
        $this->assertFalse($metrics['is_late_out']);
        $this->assertEquals(30, $metrics['early_out_minutes']);
        $this->assertEquals(0, $metrics['late_out_minutes']);
    }

    /**
     * Test overtime: employee stays late after scheduled end time.
     */
    public function test_late_out_overtime_calculation(): void
    {
        $shiftMeta = [
            'shift_id' => null,
            'start_time' => '09:00:00',
            'end_time' => '19:00:00',
            'grace_minutes' => 0,
            'is_half_day' => false,
            'is_leave_day' => false,
            'is_holiday' => false,
            'is_field_work' => false,
            'is_remote_work' => false,
        ];

        $attendanceDate = '2026-05-25'; // Monday
        $punchIn = '09:00:00';
        $punchOut = '19:45:00'; // 45 minutes overtime

        $metrics = $this->service->buildShiftMetrics($attendanceDate, $punchIn, $punchOut, $shiftMeta);

        $this->assertFalse($metrics['is_early_out']);
        $this->assertTrue($metrics['is_late_out']);
        $this->assertEquals(0, $metrics['early_out_minutes']);
        $this->assertEquals(45, $metrics['late_out_minutes']);
        $this->assertEquals(45, $metrics['overtime_minutes']);
    }

    /**
     * Test perfect attendance: punch in/out at exact times.
     */
    public function test_perfect_attendance(): void
    {
        $shiftMeta = [
            'shift_id' => null,
            'start_time' => '09:00:00',
            'end_time' => '19:00:00',
            'grace_minutes' => 0,
            'is_half_day' => false,
            'is_leave_day' => false,
            'is_holiday' => false,
            'is_field_work' => false,
            'is_remote_work' => false,
        ];

        $attendanceDate = '2026-05-25'; // Monday
        $punchIn = '09:00:00';
        $punchOut = '19:00:00';

        $metrics = $this->service->buildShiftMetrics($attendanceDate, $punchIn, $punchOut, $shiftMeta);

        $this->assertFalse($metrics['is_early_in']);
        $this->assertFalse($metrics['is_late_in']);
        $this->assertFalse($metrics['is_early_out']);
        $this->assertFalse($metrics['is_late_out']);
        $this->assertEquals(0, $metrics['early_in_minutes']);
        $this->assertEquals(0, $metrics['late_in_minutes']);
        $this->assertEquals(0, $metrics['early_out_minutes']);
        $this->assertEquals(0, $metrics['late_out_minutes']);
    }

    /**
     * Test total work minutes calculation.
     */
    public function test_total_work_minutes_calculation(): void
    {
        $shiftMeta = [
            'shift_id' => null,
            'start_time' => '09:00:00',
            'end_time' => '19:00:00',
            'grace_minutes' => 0,
            'is_half_day' => false,
            'is_leave_day' => false,
            'is_holiday' => false,
            'is_field_work' => false,
            'is_remote_work' => false,
        ];

        $attendanceDate = '2026-05-25'; // Monday
        $punchIn = '09:00:00';
        $punchOut = '17:30:00'; // 8.5 hours = 510 minutes

        $metrics = $this->service->buildShiftMetrics($attendanceDate, $punchIn, $punchOut, $shiftMeta);

        $this->assertEquals(510, $metrics['total_work_minutes']);
    }

    /**
     * Test Saturday half-day detection.
     */
    public function test_saturday_half_day_detection(): void
    {
        $saturdayDate = '2026-05-30'; // Saturday

        $shiftMeta = $this->service->resolveEffectiveShiftForEmployeeDate('test_code', $saturdayDate);

        $this->assertTrue($shiftMeta['is_half_day']);
        $this->assertEquals('09:00:00', $shiftMeta['start_time']);
        $this->assertEquals('14:00:00', $shiftMeta['end_time']);
    }

    /**
     * Test Saturday working hours (5 hours).
     */
    public function test_saturday_scheduled_hours(): void
    {
        $saturdayDate = '2026-05-30'; // Saturday

        $shiftMeta = $this->service->resolveEffectiveShiftForEmployeeDate('test_code', $saturdayDate);
        $punchIn = '09:00:00';
        $punchOut = '14:00:00';

        $metrics = $this->service->buildShiftMetrics($saturdayDate, $punchIn, $punchOut, $shiftMeta);

        $this->assertEquals(5.0, $metrics['scheduled_hours']);
        $this->assertFalse($metrics['is_late_in']);
        $this->assertFalse($metrics['is_early_out']);
    }

    public function test_saturday_half_day_uses_assigned_shift_start_time(): void
    {
        $employee = Employee::factory()->create(['code' => 'WEEKEND01']);
        $shift = Shift::create([
            'name' => 'Every Day Shift',
            'start_time' => '08:00:00',
            'end_time' => '17:00:00',
            'grace_minutes' => 10,
            'is_active' => true,
        ]);

        EmployeeShiftAssignment::create([
            'employee_id' => $employee->id,
            'shift_id' => $shift->id,
            'effective_from' => '2026-05-01',
            'effective_to' => null,
            'is_active' => true,
        ]);

        $saturday = $this->service->resolveEffectiveShiftForEmployeeDate(
            $employee->code,
            '2026-05-30'
        );
        $sunday = $this->service->resolveEffectiveShiftForEmployeeDate(
            $employee->code,
            '2026-05-31'
        );
        $monday = $this->service->resolveEffectiveShiftForEmployeeDate(
            $employee->code,
            '2026-06-01'
        );

        $this->assertSame($shift->id, $saturday['shift_id']);
        $this->assertSame('08:00:00', $saturday['start_time']);
        $this->assertSame('13:00:00', $saturday['end_time']);
        $this->assertTrue($saturday['is_half_day']);

        $this->assertNull($sunday['shift_id']);
        $this->assertNull($sunday['start_time']);
        $this->assertNull($sunday['end_time']);
        $this->assertFalse($sunday['is_half_day']);

        $this->assertSame($shift->id, $monday['shift_id']);
        $this->assertSame('08:00:00', $monday['start_time']);
        $this->assertSame('17:00:00', $monday['end_time']);
        $this->assertFalse($monday['is_half_day']);
    }

    /**
     * Test leave day detection.
     */
    public function test_leave_day_returns_no_working_hours(): void
    {
        $leaveType = LeaveType::factory()->create();
        $user = User::factory()->create();
        $employee = Employee::factory()->create(['user_id' => $user->id]);

        // Create leave request using raw query to avoid factory issues
        \DB::table('leave_requests')->insert([
            'employee_id' => $employee->id,
            'leave_type_id' => $leaveType->id,
            'start_date' => '2026-05-25',
            'end_date' => '2026-05-25',
            'status' => 'approved',
            'requested_by_user_id' => $user->id,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Test the isEmployeeOnLeave method directly
        $isOnLeave = $this->service->isEmployeeOnLeave($employee, Carbon::parse('2026-05-25'));
        $this->assertTrue($isOnLeave);
    }

    /**
     * Test holiday status detection.
     */
    public function test_holiday_returns_no_working_hours(): void
    {
        Holiday::create([
            'date' => '2026-01-26',
            'name' => 'Republic Day',
            'type' => 'national',
        ]);

        $shiftMeta = $this->service->resolveEffectiveShiftForEmployeeDate('test_code', '2026-01-26');

        $this->assertTrue($shiftMeta['is_holiday']);
        $this->assertNull($shiftMeta['start_time']);
        $this->assertNull($shiftMeta['end_time']);
    }

    /**
     * Test attendance status determination.
     */
    public function test_attendance_status_determination(): void
    {
        $metrics = [
            'punch_in' => '09:00:00',
            'punch_out' => '19:00:00',
            'is_early_in' => false,
            'is_late_in' => false,
            'is_early_out' => false,
            'is_late_out' => false,
            'is_leave_day' => false,
            'is_holiday' => false,
            'is_field_work' => false,
            'is_remote_work' => false,
        ];

        $status = $this->service->determineAttendanceStatus($metrics);
        $this->assertEquals('present', $status);

        // Late arrival
        $metrics['is_late_in'] = true;
        $status = $this->service->determineAttendanceStatus($metrics);
        $this->assertEquals('late_in', $status);

        // Reset and test early out
        $metrics['is_late_in'] = false;
        $metrics['is_early_out'] = true;
        $status = $this->service->determineAttendanceStatus($metrics);
        $this->assertEquals('early_out', $status);

        // Test absent
        $metrics = ['punch_in' => null, 'punch_out' => null];
        $status = $this->service->determineAttendanceStatus($metrics);
        $this->assertEquals('absent', $status);
    }

    /**
     * Test day status calculation (full day vs half day).
     */
    public function test_day_status_calculation(): void
    {
        // Full day on Monday (9 hours scheduled)
        $metricsFullDay = [
            'total_work_minutes' => 540, // 9 hours
            'scheduled_hours' => 9.0,
        ];

        $dayStatus = $this->service->calculateDayStatus($metricsFullDay);

        $this->assertTrue($dayStatus['is_full_day']);
        $this->assertFalse($dayStatus['is_half_day']);
        $this->assertEquals(9.0, $dayStatus['hours_worked']);

        // Half day on Saturday (5 hours scheduled, 2.5 hours worked)
        $metricsHalfDay = [
            'total_work_minutes' => 150, // 2.5 hours
            'scheduled_hours' => 5.0,
        ];

        $dayStatus = $this->service->calculateDayStatus($metricsHalfDay);

        $this->assertFalse($dayStatus['is_full_day']);
        $this->assertTrue($dayStatus['is_half_day']);
        $this->assertEquals(2.5, $dayStatus['hours_worked']);
    }

    /**
     * Test combined early in and late out (should show as present with overtime).
     */
    public function test_combined_early_in_and_late_out(): void
    {
        $shiftMeta = [
            'shift_id' => null,
            'start_time' => '09:00:00',
            'end_time' => '19:00:00',
            'grace_minutes' => 0,
            'is_half_day' => false,
            'is_leave_day' => false,
            'is_holiday' => false,
            'is_field_work' => false,
            'is_remote_work' => false,
        ];

        $attendanceDate = '2026-05-25'; // Monday
        $punchIn = '08:45:00'; // 15 minutes early
        $punchOut = '19:30:00'; // 30 minutes late

        $metrics = $this->service->buildShiftMetrics($attendanceDate, $punchIn, $punchOut, $shiftMeta);

        $this->assertTrue($metrics['is_early_in']);
        $this->assertTrue($metrics['is_late_out']);
        $this->assertEquals(15, $metrics['early_in_minutes']);
        $this->assertEquals(30, $metrics['late_out_minutes']);
        $this->assertEquals(45, $metrics['overtime_minutes']);
    }

    /**
     * Test on_leave status determination.
     */
    public function test_on_leave_status_determination(): void
    {
        $metrics = [
            'punch_in' => null,
            'punch_out' => null,
            'is_leave_day' => true,
            'is_holiday' => false,
            'is_field_work' => false,
            'is_remote_work' => false,
        ];

        $status = $this->service->determineAttendanceStatus($metrics);
        $this->assertEquals('on_leave', $status);
    }

    /**
     * Test field_work status determination.
     */
    public function test_field_work_status_determination(): void
    {
        $metrics = [
            'punch_in' => null,
            'punch_out' => null,
            'is_leave_day' => false,
            'is_holiday' => false,
            'is_field_work' => true,
            'is_remote_work' => false,
        ];

        $status = $this->service->determineAttendanceStatus($metrics);
        $this->assertEquals('field_work', $status);
    }

    /**
     * Test remote_work status determination.
     */
    public function test_remote_work_status_determination(): void
    {
        $metrics = [
            'punch_in' => null,
            'punch_out' => null,
            'is_leave_day' => false,
            'is_holiday' => false,
            'is_field_work' => false,
            'is_remote_work' => true,
        ];

        $status = $this->service->determineAttendanceStatus($metrics);
        $this->assertEquals('remote_work', $status);
    }

    /**
     * Test field work assignment detection.
     */
    public function test_field_work_assignment_detection(): void
    {
        $user = User::factory()->create();
        $employee = Employee::factory()->create(['user_id' => $user->id]);

        \DB::table('field_work_assignments')->insert([
            'employee_id' => $employee->id,
            'start_date' => '2026-05-25',
            'end_date' => '2026-05-25',
            'location' => 'Client Site',
            'status' => 'approved',
            'assigned_by_user_id' => $user->id,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $isOnFieldWork = $this->service->isEmployeeOnFieldWork($employee, Carbon::parse('2026-05-25'));
        $this->assertTrue($isOnFieldWork);
    }

    /**
     * Test remote work assignment detection.
     */
    public function test_remote_work_assignment_detection(): void
    {
        $user = User::factory()->create();
        $employee = Employee::factory()->create(['user_id' => $user->id]);

        \DB::table('remote_work_assignments')->insert([
            'employee_id' => $employee->id,
            'start_date' => '2026-05-26',
            'end_date' => '2026-05-26',
            'notes' => 'Working from home',
            'assigned_by_user_id' => $user->id,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $isOnRemoteWork = $this->service->isEmployeeOnRemoteWork($employee, Carbon::parse('2026-05-26'));
        $this->assertTrue($isOnRemoteWork);
    }
}
