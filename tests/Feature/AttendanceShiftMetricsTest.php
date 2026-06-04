<?php

namespace Tests\Feature;

use App\Http\Controllers\AttendanceController;
use App\Models\Attendance;
use App\Models\Employee;
use App\Models\EmployeeShiftAssignment;
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
            'attendance_date' => '2026-05-16',
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

    public function test_shift_metrics_fallback_to_working_hours_when_no_shift_is_assigned(): void
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
        $this->assertEquals(20, $decorated['late_minutes']);
        $this->assertEquals(0, $decorated['early_in_minutes']);
        $this->assertEquals(20, $decorated['early_out_minutes']);
        $this->assertEquals(0, $decorated['late_out_minutes']);
        $this->assertTrue($decorated['is_late']);
        $this->assertFalse($decorated['is_early_in']);
        $this->assertTrue($decorated['is_early_out']);
        $this->assertFalse($decorated['is_late_out']);
    }

    public function test_shift_metrics_do_not_apply_on_holidays_without_shift(): void
    {
        $employee = Employee::factory()->create(['code' => '9021']);

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

    public function test_shift_metrics_apply_a_minimum_one_minute_grace_for_late_entry(): void
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
            'attendance_date' => '2026-05-16',
            'punch_in' => '09:00:30',
            'punch_out' => '18:00:00',
            'employee_name' => $employee->name,
            'mode' => 'office',
        ]);

        $controller = new AttendanceController;
        $ref = new \ReflectionMethod(AttendanceController::class, 'decorateAttendanceWithShiftMetrics');
        $ref->setAccessible(true);
        $decorated = $ref->invoke($controller, $attendance);

        $this->assertSame($shift->id, $decorated['shift_id']);
        $this->assertSame(0, $decorated['late_minutes']);
        $this->assertFalse($decorated['is_late']);
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
            'attendance_date' => '2026-05-16',
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
            'attendance_date' => '2026-05-16',
            'punch_in' => '09:12:00',
            'punch_out' => '18:00:00',
            'employee_name' => $employee->name,
            'mode' => 'office',
        ]);

        Attendance::create([
            'employee_id' => $employee->code,
            'attendance_date' => '2026-05-17',
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
            Attendance::query()->where('employee_id', $employee->code)->get(),
            5,
            2026
        );

        $this->assertSame(1, $summary['late_days']);
        $this->assertSame(0, $summary['early_out_days']);
        $this->assertSame(2, $summary['total_late_minutes']);
        $this->assertSame(0, $summary['total_early_out_minutes']);
    }
}
