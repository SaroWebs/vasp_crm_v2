<?php

namespace Tests\Feature;

use App\Http\Controllers\AttendanceController;
use App\Models\Attendance;
use App\Models\Employee;
use App\Models\EmployeeShiftAssignment;
use App\Models\Holiday;
use App\Models\Punch;
use App\Models\Shift;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AttendanceShiftMetricsTest extends TestCase
{
    use RefreshDatabase;

    public function test_shift_metrics_are_computed_from_shift_assignment_tables(): void
    {
        $employee = Employee::factory()->create(['code' => '9001']);
        $shift = Shift::create([
            'name' => 'General Shift',
            'start_time' => '09:00:00',
            'end_time' => '18:00:00',
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

        $attendance = Attendance::create([
            'employee_id' => $employee->code,
            'attendance_date' => '2026-05-18',
            'punch_in' => '09:25:00',
            'punch_out' => '17:40:00',
            'employee_name' => $employee->name,
            'mode' => 'office',
        ]);

        $controller = new AttendanceController;
        $ref = new \ReflectionMethod(AttendanceController::class, 'decorateAttendanceWithShiftMetrics');
        $ref->setAccessible(true);
        $decorated = $ref->invoke($controller, $attendance);

        $this->assertSame($shift->id, $decorated['shift_id']);
        $this->assertEquals(15, $decorated['late_minutes']);
        $this->assertEquals(0, $decorated['early_in_minutes']);
        $this->assertEquals(20, $decorated['early_out_minutes']);
        $this->assertEquals(0, $decorated['late_out_minutes']);
        $this->assertTrue($decorated['is_late']);
        $this->assertFalse($decorated['is_early_in']);
        $this->assertTrue($decorated['is_early_out']);
        $this->assertFalse($decorated['is_late_out']);
    }

    public function test_decorated_attendance_uses_date_only_and_local_clock_values(): void
    {
        $employee = Employee::factory()->create(['code' => 'DATE001']);
        $attendance = Attendance::create([
            'employee_id' => $employee->code,
            'attendance_date' => '2026-05-16',
            'punch_in' => '09:05:00',
            'punch_out' => '18:10:00',
            'employee_name' => $employee->name,
            'mode' => 'office',
        ]);

        $method = new \ReflectionMethod(AttendanceController::class, 'decorateAttendanceWithShiftMetrics');
        $method->setAccessible(true);
        $decorated = $method->invoke(new AttendanceController, $attendance);

        $this->assertSame('2026-05-16', $decorated['attendance_date']);
        $this->assertSame('09:05:00', $decorated['punch_in']);
        $this->assertSame('18:10:00', $decorated['punch_out']);
    }

    public function test_calendar_distinguishes_absent_pending_and_upcoming_days(): void
    {
        Carbon::setTestNow('2026-06-10 10:00:00');

        $employee = Employee::factory()->create(['code' => 'CAL001']);
        $shift = Shift::create([
            'name' => 'Calendar Shift',
            'start_time' => '09:00:00',
            'end_time' => '18:00:00',
            'grace_minutes' => 0,
            'is_active' => true,
        ]);

        EmployeeShiftAssignment::create([
            'employee_id' => $employee->id,
            'shift_id' => $shift->id,
            'effective_from' => '2026-06-01',
            'effective_to' => null,
            'is_active' => true,
        ]);

        $method = new \ReflectionMethod(AttendanceController::class, 'buildAttendanceCalendarDays');
        $method->setAccessible(true);

        $days = collect($method->invoke(
            new AttendanceController,
            $employee,
            collect(),
            Carbon::parse('2026-06-01'),
            Carbon::parse('2026-06-30')
        ))->keyBy('date');

        $this->assertSame('absent', $days['2026-06-09']['status']);
        $this->assertSame('pending', $days['2026-06-10']['status']);
        $this->assertSame('upcoming', $days['2026-06-11']['status']);
        $this->assertSame('weekend', $days['2026-06-14']['status']);
    }

    public function test_calendar_record_uses_first_punch_in_and_last_punch_out_for_split_attendance(): void
    {
        $employee = Employee::factory()->create(['code' => '85']);
        $method = new \ReflectionMethod(AttendanceController::class, 'buildAttendanceCalendarDays');
        $method->setAccessible(true);

        $records = collect([
            [
                'id' => 3724,
                'employee_id' => '85',
                'attendance_date' => '2026-06-01',
                'punch_in' => '09:00:48',
                'punch_out' => '11:25:37',
                'status' => 'present',
            ],
            [
                'id' => 3725,
                'employee_id' => '85',
                'attendance_date' => '2026-06-01',
                'punch_in' => '11:38:42',
                'punch_out' => '13:47:25',
                'status' => 'present',
            ],
            [
                'id' => 3726,
                'employee_id' => '85',
                'attendance_date' => '2026-06-01',
                'punch_in' => '14:20:18',
                'punch_out' => '18:21:17',
                'status' => 'present',
            ],
        ]);

        $days = collect($method->invoke(
            new AttendanceController,
            $employee,
            $records,
            Carbon::parse('2026-06-01'),
            Carbon::parse('2026-06-30')
        ))->keyBy('date');

        $this->assertSame('09:00:48', $days['2026-06-01']['record']['punch_in']);
        $this->assertSame('18:21:17', $days['2026-06-01']['record']['punch_out']);
    }

    public function test_shift_metrics_do_not_use_fixed_working_hours_when_no_shift_is_assigned(): void
    {
        $employee = Employee::factory()->create(['code' => '9020']);

        $attendance = Attendance::create([
            'employee_id' => $employee->code,
            'attendance_date' => '2026-05-14',
            'punch_in' => '09:20:00',
            'punch_out' => '17:40:00',
            'employee_name' => $employee->name,
            'mode' => 'office',
        ]);

        $controller = new AttendanceController;
        $ref = new \ReflectionMethod(AttendanceController::class, 'decorateAttendanceWithShiftMetrics');
        $ref->setAccessible(true);
        $decorated = $ref->invoke($controller, $attendance);

        $this->assertNull($decorated['shift_id']);
        $this->assertEquals(0, $decorated['late_minutes']);
        $this->assertEquals(0, $decorated['early_in_minutes']);
        $this->assertEquals(0, $decorated['early_out_minutes']);
        $this->assertEquals(0, $decorated['late_out_minutes']);
        $this->assertFalse($decorated['is_late']);
        $this->assertFalse($decorated['is_early_in']);
        $this->assertFalse($decorated['is_early_out']);
        $this->assertFalse($decorated['is_late_out']);
    }

    public function test_shift_metrics_do_not_apply_on_holidays_without_shift(): void
    {
        $employee = Employee::factory()->create(['code' => '9021']);
        Holiday::create([
            'date' => '2026-05-27',
            'name' => 'Test Holiday',
            'type' => 'state',
        ]);

        $attendance = Attendance::create([
            'employee_id' => $employee->code,
            'attendance_date' => '2026-05-27',
            'punch_in' => '09:20:00',
            'punch_out' => '17:40:00',
            'employee_name' => $employee->name,
            'mode' => 'office',
        ]);

        $controller = new AttendanceController;
        $ref = new \ReflectionMethod(AttendanceController::class, 'decorateAttendanceWithShiftMetrics');
        $ref->setAccessible(true);
        $decorated = $ref->invoke($controller, $attendance);

        $this->assertNull($decorated['shift_id']);
        $this->assertSame(0, $decorated['late_minutes']);
        $this->assertSame(0, $decorated['early_in_minutes']);
        $this->assertSame(0, $decorated['early_out_minutes']);
        $this->assertSame(0, $decorated['late_out_minutes']);
        $this->assertFalse($decorated['is_late']);
        $this->assertFalse($decorated['is_early_in']);
        $this->assertFalse($decorated['is_early_out']);
        $this->assertFalse($decorated['is_late_out']);
    }

    public function test_shift_metrics_respect_zero_grace_for_late_entry(): void
    {
        $employee = Employee::factory()->create(['code' => '9011']);
        $shift = Shift::create([
            'name' => 'Zero Grace Shift',
            'start_time' => '09:00:00',
            'end_time' => '18:00:00',
            'grace_minutes' => 0,
            'is_active' => true,
        ]);

        EmployeeShiftAssignment::create([
            'employee_id' => $employee->id,
            'shift_id' => $shift->id,
            'effective_from' => '2026-05-01',
            'effective_to' => null,
            'is_active' => true,
        ]);

        $attendance = Attendance::create([
            'employee_id' => $employee->code,
            'attendance_date' => '2026-05-18',
            'punch_in' => '09:01:00',
            'punch_out' => '18:00:00',
            'employee_name' => $employee->name,
            'mode' => 'office',
        ]);

        $controller = new AttendanceController;
        $ref = new \ReflectionMethod(AttendanceController::class, 'decorateAttendanceWithShiftMetrics');
        $ref->setAccessible(true);
        $decorated = $ref->invoke($controller, $attendance);

        $this->assertSame($shift->id, $decorated['shift_id']);
        $this->assertEquals(1, $decorated['late_minutes']);
        $this->assertTrue($decorated['is_late']);
    }

    public function test_shift_metrics_calculates_early_in_and_late_out(): void
    {
        $employee = Employee::factory()->create(['code' => '9003']);
        $shift = Shift::create([
            'name' => 'Flexible Shift',
            'start_time' => '09:00:00',
            'end_time' => '18:00:00',
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

        $attendance = Attendance::create([
            'employee_id' => $employee->code,
            'attendance_date' => '2026-05-18',
            'punch_in' => '08:45:00',
            'punch_out' => '18:20:00',
            'employee_name' => $employee->name,
            'mode' => 'office',
        ]);

        $controller = new AttendanceController;
        $ref = new \ReflectionMethod(AttendanceController::class, 'decorateAttendanceWithShiftMetrics');
        $ref->setAccessible(true);
        $decorated = $ref->invoke($controller, $attendance);

        $this->assertSame($shift->id, $decorated['shift_id']);
        $this->assertEquals(0, $decorated['late_minutes']);
        $this->assertEquals(15, $decorated['early_in_minutes']);
        $this->assertEquals(0, $decorated['early_out_minutes']);
        $this->assertEquals(20, $decorated['late_out_minutes']);
        $this->assertFalse($decorated['is_late']);
        $this->assertTrue($decorated['is_early_in']);
        $this->assertFalse($decorated['is_early_out']);
        $this->assertTrue($decorated['is_late_out']);
    }

    public function test_sync_still_writes_attendance_without_shift_columns(): void
    {
        $employee = Employee::factory()->create(['code' => '9002']);
        $date = Carbon::parse('2026-05-16');

        Punch::create([
            'EmployeeId' => $employee->code,
            'MachineId' => 3,
            'PunchTime' => $date->copy()->setTime(9, 0)->toDateTimeString(),
            'EmployeeName' => $employee->name,
            'Islive' => false,
        ]);

        Punch::create([
            'EmployeeId' => $employee->code,
            'MachineId' => 1,
            'PunchTime' => $date->copy()->setTime(18, 0)->toDateTimeString(),
            'EmployeeName' => $employee->name,
            'Islive' => false,
        ]);

        $ref = new \ReflectionMethod(AttendanceController::class, 'syncAttendanceFromPunches');
        $ref->setAccessible(true);
        $ref->invoke(new AttendanceController, (string) $employee->code, $date, 'office');

        $this->assertDatabaseHas('attendances', [
            'employee_id' => $employee->code,
            'attendance_date' => '2026-05-16',
            'punch_in' => '09:00:00',
            'punch_out' => '18:00:00',
        ]);
    }

    public function test_monthly_late_days_summary_uses_shift_assignment_grace(): void
    {
        $employee = Employee::factory()->create(['code' => '9010']);
        $shift = Shift::create([
            'name' => 'General Shift',
            'start_time' => '09:00:00',
            'end_time' => '18:00:00',
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

        Attendance::create([
            'employee_id' => $employee->code,
            'attendance_date' => '2026-05-18',
            'punch_in' => '09:12:00',
            'punch_out' => '18:00:00',
            'employee_name' => $employee->name,
            'mode' => 'office',
        ]);

        Attendance::create([
            'employee_id' => $employee->code,
            'attendance_date' => '2026-05-19',
            'punch_in' => '09:09:00',
            'punch_out' => '18:00:00',
            'employee_name' => $employee->name,
            'mode' => 'office',
        ]);

        $controller = new AttendanceController;
        $summaryMethod = new \ReflectionMethod(AttendanceController::class, 'computeSummary');
        $summaryMethod->setAccessible(true);

        $summary = $summaryMethod->invoke(
            $controller,
            $employee,
            Attendance::query()->where('employee_id', $employee->code)->get(),
            Carbon::parse('2026-05-01'),
            Carbon::parse('2026-05-31')
        );

        $this->assertSame(1, $summary['late_days']);
        $this->assertSame(0, $summary['early_out_days']);
        $this->assertSame(2, $summary['total_late_minutes']);
        $this->assertSame(0, $summary['total_early_out_minutes']);
    }

    public function test_monthly_summary_counts_early_arrival_and_late_departure_as_overtime_not_late(): void
    {
        $employee = Employee::factory()->create(['code' => 'OT001']);
        $shift = Shift::create([
            'name' => 'Overtime Shift',
            'start_time' => '09:00:00',
            'end_time' => '19:00:00',
            'grace_minutes' => 0,
            'is_active' => true,
        ]);

        EmployeeShiftAssignment::create([
            'employee_id' => $employee->id,
            'shift_id' => $shift->id,
            'effective_from' => '2026-05-01',
            'effective_to' => null,
            'is_active' => true,
        ]);

        Attendance::create([
            'employee_id' => $employee->code,
            'attendance_date' => '2026-05-18',
            'punch_in' => '08:54:00',
            'punch_out' => '19:05:00',
            'employee_name' => $employee->name,
            'mode' => 'office',
        ]);

        $controller = new AttendanceController;
        $summaryMethod = new \ReflectionMethod(AttendanceController::class, 'computeSummary');
        $summaryMethod->setAccessible(true);

        $summary = $summaryMethod->invoke(
            $controller,
            $employee,
            Attendance::query()->where('employee_id', $employee->code)->get(),
            Carbon::parse('2026-05-01'),
            Carbon::parse('2026-05-31')
        );

        $this->assertSame(0, $summary['late_days']);
        $this->assertSame(0, $summary['total_late_minutes']);
        $this->assertSame(6, $summary['total_early_in_minutes']);
        $this->assertSame(5, $summary['total_late_out_minutes']);
        $this->assertSame(11, $summary['total_overtime_minutes']);
        $this->assertSame(10.18, $summary['total_hours']);
    }

    public function test_sandwiched_holiday_counts_as_absent_in_summary(): void
    {
        Carbon::setTestNow('2026-06-05 10:00:00');

        $employee = Employee::factory()->create(['code' => 'SAND001']);
        $shift = Shift::create([
            'name' => 'Sandwich Shift',
            'start_time' => '09:00:00',
            'end_time' => '18:00:00',
            'grace_minutes' => 0,
            'is_active' => true,
        ]);

        EmployeeShiftAssignment::create([
            'employee_id' => $employee->id,
            'shift_id' => $shift->id,
            'effective_from' => '2026-06-01',
            'effective_to' => null,
            'is_active' => true,
        ]);

        Holiday::create([
            'date' => '2026-06-03',
            'name' => 'Midweek Holiday',
            'type' => 'state',
        ]);

        $controller = new AttendanceController;
        $summaryMethod = new \ReflectionMethod(AttendanceController::class, 'computeSummary');
        $summaryMethod->setAccessible(true);

        $summary = $summaryMethod->invoke(
            $controller,
            $employee,
            collect(),
            Carbon::parse('2026-06-02'),
            Carbon::parse('2026-06-04')
        );

        $this->assertSame(3, $summary['absent_days']);
        $this->assertSame(3, $summary['total_working_days']);
        $this->assertSame(0, $summary['holiday_days']);

        Carbon::setTestNow();
    }
}
