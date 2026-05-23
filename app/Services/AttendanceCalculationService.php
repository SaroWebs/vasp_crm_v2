<?php

namespace App\Services;

use App\Models\Employee;
use App\Models\EmployeeShiftAssignment;
use Carbon\Carbon;
use Illuminate\Support\Facades\Schema;

class AttendanceCalculationService
{
    public function __construct(
        private WorkingHoursService $workingHoursService
    ) {}

    /**
     * Resolve the effective attendance schedule for an employee and date.
     * Uses shift assignment if available, otherwise falls back to configured working hours.
     * Holidays and non-working days return a null schedule.
     *
     * @return array{shift_id: ?int, start_time: ?string, end_time: ?string, grace_minutes: int, is_half_day: bool}
     */
    public function resolveEffectiveShiftForEmployeeDate(string $employeeCode, string $attendanceDate): array
    {
        // First, try to get shift assignment
        $shiftMeta = $this->resolveShiftForEmployeeDate($employeeCode, $attendanceDate);

        if ($shiftMeta['start_time'] && $shiftMeta['end_time']) {
            return $shiftMeta;
        }

        // Fall back to working hours
        $date = Carbon::parse($attendanceDate);

        // Check if it's a holiday
        if ($this->workingHoursService->isHoliday($date)) {
            return [
                'shift_id' => null,
                'start_time' => null,
                'end_time' => null,
                'grace_minutes' => 0,
                'is_half_day' => false,
            ];
        }

        // Get working hours for the day (including Saturday half-day)
        $workingHours = $this->workingHoursService->getWorkingHoursForDate($date);

        if (! $workingHours['start'] || ! $workingHours['end']) {
            return [
                'shift_id' => null,
                'start_time' => null,
                'end_time' => null,
                'grace_minutes' => 0,
                'is_half_day' => false,
            ];
        }

        // Check if it's Saturday (half day)
        $dayName = strtolower($date->format('l'));
        $isHalfDay = $dayName === 'saturday';

        return [
            'shift_id' => null,
            'start_time' => $workingHours['start']->format('H:i:s'),
            'end_time' => $workingHours['end']->format('H:i:s'),
            'grace_minutes' => 0,
            'is_half_day' => $isHalfDay,
        ];
    }

    /**
     * Resolve shift assignment for an employee on a specific date.
     *
     * @return array{shift_id: ?int, start_time: ?string, end_time: ?string, grace_minutes: int, is_half_day: bool}
     */
    private function resolveShiftForEmployeeDate(string $employeeCode, string $attendanceDate): array
    {
        if (! Schema::hasTable('employee_shift_assignments') || ! Schema::hasTable('shifts')) {
            return ['shift_id' => null, 'start_time' => null, 'end_time' => null, 'grace_minutes' => 0, 'is_half_day' => false];
        }

        $employee = Employee::query()->where('code', $employeeCode)->first();

        if (! $employee) {
            return ['shift_id' => null, 'start_time' => null, 'end_time' => null, 'grace_minutes' => 0, 'is_half_day' => false];
        }

        $assignment = EmployeeShiftAssignment::query()
            ->with('shift')
            ->where('employee_id', $employee->id)
            ->where('is_active', true)
            ->where('effective_from', '<=', $attendanceDate)
            ->where(function ($query) use ($attendanceDate) {
                $query->whereNull('effective_to')
                    ->orWhere('effective_to', '>=', $attendanceDate);
            })
            ->orderByDesc('effective_from')
            ->first();

        if (! $assignment || ! $assignment->shift || ! $assignment->shift->is_active) {
            return ['shift_id' => null, 'start_time' => null, 'end_time' => null, 'grace_minutes' => 0, 'is_half_day' => false];
        }

        return [
            'shift_id' => $assignment->shift->id,
            'start_time' => $assignment->shift->start_time,
            'end_time' => $assignment->shift->end_time,
            'grace_minutes' => (int) $assignment->shift->grace_minutes,
            'is_half_day' => false, // Shifts don't have half day concept by default
        ];
    }

    /**
     * Build comprehensive shift metrics for attendance calculation.
     * Handles: early_in, late_in, early_out, late_out, overtime
     *
     * @param  array{shift_id: ?int, start_time: ?string, end_time: ?string, grace_minutes: int, is_half_day: bool}  $shiftMeta
     * @return array{
     *   shift_id: ?int,
     *   start_time: ?string,
     *   end_time: ?string,
     *   is_half_day: bool,
     *   scheduled_hours: float,
     *   punch_in: ?string,
     *   punch_out: ?string,
     *   early_in_minutes: int,
     *   late_in_minutes: int,
     *   early_out_minutes: int,
     *   late_out_minutes: int,
     *   is_early_in: bool,
     *   is_late_in: bool,
     *   is_early_out: bool,
     *   is_late_out: bool,
     *   overtime_minutes: int,
     *   total_work_minutes: ?int
     * }
     */
    public function buildShiftMetrics(string $attendanceDate, ?string $punchIn, ?string $punchOut, array $shiftMeta): array
    {
        $result = [
            'shift_id' => $shiftMeta['shift_id'],
            'start_time' => $shiftMeta['start_time'],
            'end_time' => $shiftMeta['end_time'],
            'is_half_day' => $shiftMeta['is_half_day'] ?? false,
            'scheduled_hours' => 0.0,
            'punch_in' => $punchIn,
            'punch_out' => $punchOut,
            'early_in_minutes' => 0,
            'late_in_minutes' => 0,
            'early_out_minutes' => 0,
            'late_out_minutes' => 0,
            'is_early_in' => false,
            'is_late_in' => false,
            'is_early_out' => false,
            'is_late_out' => false,
            'overtime_minutes' => 0,
            'total_work_minutes' => null,
        ];

        // No shift schedule configured
        if (! $shiftMeta['start_time'] || ! $shiftMeta['end_time']) {
            return $result;
        }

        // Calculate scheduled hours
        $scheduledStart = Carbon::parse($attendanceDate.' '.$shiftMeta['start_time']);
        $scheduledEnd = Carbon::parse($attendanceDate.' '.$shiftMeta['end_time']);
        $result['scheduled_hours'] = round($scheduledStart->diffInMinutes($scheduledEnd) / 60, 2);

        // Handle punch_in
        if ($punchIn) {
            $actualIn = Carbon::parse($attendanceDate.' '.$punchIn);
            $graceStart = $scheduledStart->copy()->addMinutes((int) $shiftMeta['grace_minutes']);

            if ($actualIn->lt($scheduledStart)) {
                // Early in: came before scheduled start time
                $result['early_in_minutes'] = abs($actualIn->diffInMinutes($scheduledStart));
                $result['is_early_in'] = true;
            } elseif ($actualIn->gt($graceStart)) {
                // Late in: came after grace period
                $result['late_in_minutes'] = abs($actualIn->diffInMinutes($graceStart));
                $result['is_late_in'] = true;
            }
        }

        // Handle punch_out
        if ($punchOut) {
            $actualOut = Carbon::parse($attendanceDate.' '.$punchOut);

            if ($actualOut->lt($scheduledEnd)) {
                // Early out: left before scheduled end time
                $result['early_out_minutes'] = abs($actualOut->diffInMinutes($scheduledEnd));
                $result['is_early_out'] = true;
            } elseif ($actualOut->gt($scheduledEnd)) {
                // Late out / Overtime: left after scheduled end time
                $result['late_out_minutes'] = abs($actualOut->diffInMinutes($scheduledEnd));
                $result['is_late_out'] = true;
                $result['overtime_minutes'] = $result['late_out_minutes'];
            }
        }

        // Calculate total work minutes if both punch_in and punch_out exist
        if ($punchIn && $punchOut) {
            $actualIn = Carbon::parse($attendanceDate.' '.$punchIn);
            $actualOut = Carbon::parse($attendanceDate.' '.$punchOut);
            $result['total_work_minutes'] = $actualIn->diffInMinutes($actualOut);
        }

        return $result;
    }

    /**
     * Get attendance summary for a date (used in daily summary).
     * This consolidates all attendance records for a given date.
     *
     * @return array{
     *   attendance_date: string,
     *   punch_in: ?string,
     *   punch_out: ?string,
     *   shift_meta: array,
     *   metrics: array,
     *   status: string
     * }
     */
    public function getAttendanceSummaryForDate(string $employeeCode, string $attendanceDate): array
    {
        $date = Carbon::parse($attendanceDate);
        $shiftMeta = $this->resolveEffectiveShiftForEmployeeDate($employeeCode, $attendanceDate);

        // Check if it's a holiday or non-working day
        if (! $shiftMeta['start_time']) {
            return [
                'attendance_date' => $attendanceDate,
                'punch_in' => null,
                'punch_out' => null,
                'shift_meta' => $shiftMeta,
                'metrics' => [],
                'status' => $this->workingHoursService->isHoliday($date) ? 'holiday' : 'non_working_day',
            ];
        }

        // This would typically get punches from the database
        // For now, we return the structure
        return [
            'attendance_date' => $attendanceDate,
            'punch_in' => null,
            'punch_out' => null,
            'shift_meta' => $shiftMeta,
            'metrics' => [],
            'status' => 'pending_punch_data',
        ];
    }

    /**
     * Determine attendance status based on shift metrics.
     *
     * @param  array  $metrics  Result from buildShiftMetrics
     * @return string One of: 'present', 'early_in', 'late_in', 'early_out', 'late_out', 'absent', 'incomplete'
     */
    public function determineAttendanceStatus(array $metrics): string
    {
        // No punch in means absent
        if (! $metrics['punch_in']) {
            return 'absent';
        }

        // Incomplete punch (no punch out)
        if (! $metrics['punch_out']) {
            return 'incomplete';
        }

        $statuses = [];

        if ($metrics['is_early_in']) {
            $statuses[] = 'early_in';
        }

        if ($metrics['is_late_in']) {
            $statuses[] = 'late_in';
        }

        if ($metrics['is_early_out']) {
            $statuses[] = 'early_out';
        }

        if ($metrics['is_late_out']) {
            $statuses[] = 'late_out';
        }

        if (empty($statuses)) {
            return 'present';
        }

        // Prioritize status based on significance
        if (in_array('late_in', $statuses, true)) {
            return 'late_in';
        }

        if (in_array('early_out', $statuses, true)) {
            return 'early_out';
        }

        if (in_array('early_in', $statuses, true) && in_array('late_out', $statuses, true)) {
            return 'present'; // Overtime compensates early arrival
        }

        return 'present';
    }

    /**
     * Validate if attendance meets minimum requirements for a half-day.
     * Saturday has 5.5 hours (09:00 to 14:30)
     *
     * @param  array  $metrics  Result from buildShiftMetrics
     * @param  float  $minimumHoursForFullDay  Minimum hours for full day (default 8.5 for 09:00-19:00 with breaks)
     * @return array{is_full_day: bool, is_half_day: bool, hours_worked: float, hours_required: float}
     */
    public function calculateDayStatus(array $metrics, float $minimumHoursForFullDay = 8.5): array
    {
        $hoursWorked = $metrics['total_work_minutes'] ? $metrics['total_work_minutes'] / 60 : 0;
        $scheduledHours = $metrics['scheduled_hours'];

        // For half-day, typically 50% of full day hours
        $minimumHoursForHalfDay = $scheduledHours / 2;

        return [
            'is_full_day' => $hoursWorked >= $scheduledHours,
            'is_half_day' => $hoursWorked >= $minimumHoursForHalfDay && $hoursWorked < $scheduledHours,
            'hours_worked' => round($hoursWorked, 2),
            'hours_required' => round($scheduledHours, 2),
        ];
    }
}
