<?php

namespace Tests\Feature;

use App\Models\Employee;
use App\Models\EmployeeShiftAssignment;
use App\Models\Shift;
use App\Services\AttendanceCalculationService;
use App\Services\WorkingHoursService;
use Carbon\Carbon;
use DateTime;
use DateTimeZone;
use Tests\TestCase;

class AttendanceCalculationTest extends TestCase
{
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
        ];

        $attendanceDate = '2026-05-25'; // Monday
        $punchIn = '08:30:00'; // 30 minutes early
        $punchOut = '19:00:00';

        $metrics = $this->service->buildShiftMetrics($attendanceDate, $punchIn, $punchOut, $shiftMeta);

        $this->assertTrue($metrics['is_early_in']);
        $this->assertFalse($metrics['is_late_in']);
        $this->assertEquals(30, $metrics['early_in_minutes']);
        $this->assertEquals(0, $metrics['late_in_minutes']);
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
        $this->assertEquals('14:30:00', $shiftMeta['end_time']);
    }

    /**
     * Test Saturday working hours (5.5 hours).
     */
    public function test_saturday_scheduled_hours(): void
    {
        $saturdayDate = '2026-05-30'; // Saturday

        $shiftMeta = $this->service->resolveEffectiveShiftForEmployeeDate('test_code', $saturdayDate);
        $punchIn = '09:00:00';
        $punchOut = '14:30:00';

        $metrics = $this->service->buildShiftMetrics($saturdayDate, $punchIn, $punchOut, $shiftMeta);

        $this->assertEquals(5.5, $metrics['scheduled_hours']);
        $this->assertFalse($metrics['is_late_in']);
        $this->assertFalse($metrics['is_early_out']);
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
        // Full day on Monday (10 hours scheduled)
        $metricsFullDay = [
            'total_work_minutes' => 600, // 10 hours
            'scheduled_hours' => 10.0,
        ];

        $dayStatus = $this->service->calculateDayStatus($metricsFullDay);

        $this->assertTrue($dayStatus['is_full_day']);
        $this->assertFalse($dayStatus['is_half_day']);
        $this->assertEquals(10.0, $dayStatus['hours_worked']);

        // Half day on Saturday (5.5 hours scheduled, 3 hours worked)
        $metricsHalfDay = [
            'total_work_minutes' => 180, // 3 hours
            'scheduled_hours' => 5.5,
        ];

        $dayStatus = $this->service->calculateDayStatus($metricsHalfDay);

        $this->assertFalse($dayStatus['is_full_day']);
        $this->assertTrue($dayStatus['is_half_day']);
        $this->assertEquals(3.0, $dayStatus['hours_worked']);
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
        ];

        $attendanceDate = '2026-05-25'; // Monday
        $punchIn = '08:45:00'; // 15 minutes early
        $punchOut = '19:30:00'; // 30 minutes late

        $metrics = $this->service->buildShiftMetrics($attendanceDate, $punchIn, $punchOut, $shiftMeta);

        $this->assertTrue($metrics['is_early_in']);
        $this->assertTrue($metrics['is_late_out']);
        $this->assertEquals(15, $metrics['early_in_minutes']);
        $this->assertEquals(30, $metrics['late_out_minutes']);
        $this->assertEquals(30, $metrics['overtime_minutes']);
    }
}
