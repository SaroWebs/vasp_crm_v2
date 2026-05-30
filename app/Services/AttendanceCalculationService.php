<?php

namespace App\Services;

use App\Models\Employee;
use App\Models\EmployeeShiftAssignment;
use App\Models\FieldWorkAssignment;
use App\Models\FieldWorkRequest;
use App\Models\LeaveRequest;
use App\Models\RemoteWorkAssignment;
use App\Models\RemoteWorkRequest;
use Carbon\Carbon;
use Illuminate\Support\Facades\Schema;

class AttendanceCalculationService
{
    public function __construct(
        private WorkingHoursService $workingHoursService
    ) {}

    /**
     * Check if employee is on approved leave for a given date.
     */
    public function isEmployeeOnLeave(Employee $employee, Carbon $date): bool
    {
        return LeaveRequest::query()
            ->where('employee_id', $employee->id)
            ->where('status', 'approved')
            ->where('start_date', '<=', $date->toDateString())
            ->where('end_date', '>=', $date->toDateString())
            ->exists();
    }

    /**
     * Check if employee has approved remote work for a given date.
     * Checks both direct assignments (admin) and approved requests (employee).
     */
    public function isEmployeeOnRemoteWork(Employee $employee, Carbon $date): bool
    {
        // Check for direct remote work assignments (admin assigned)
        $hasDirectAssignment = RemoteWorkAssignment::query()
            ->where('employee_id', $employee->id)
            ->where('start_date', '<=', $date->toDateString())
            ->where('end_date', '>=', $date->toDateString())
            ->exists();

        if ($hasDirectAssignment) {
            return true;
        }

        // Check for approved remote work requests (employee requested)
        return RemoteWorkRequest::query()
            ->where('employee_id', $employee->id)
            ->where('status', 'approved')
            ->where('start_date', '<=', $date->toDateString())
            ->where('end_date', '>=', $date->toDateString())
            ->exists();
    }

    /**
     * Check if employee is on field work for a given date.
     * Checks both approved field work assignments and approved field work requests.
     */
    public function isEmployeeOnFieldWork(Employee $employee, Carbon $date): bool
    {
        // Check for approved field work assignments (admin assigned)
        $hasApprovedAssignment = FieldWorkAssignment::query()
            ->where('employee_id', $employee->id)
            ->where('start_date', '<=', $date->toDateString())
            ->where('end_date', '>=', $date->toDateString())
            ->where('status', 'approved')
            ->exists();

        if ($hasApprovedAssignment) {
            return true;
        }

        // Check for approved field work requests (employee requested)
        return FieldWorkRequest::query()
            ->where('employee_id', $employee->id)
            ->where('start_date', '<=', $date->toDateString())
            ->where('end_date', '>=', $date->toDateString())
            ->where('status', 'approved')
            ->exists();
    }

    /**
     * Resolve the effective attendance schedule for an employee and date.
     * Uses shift assignment if available, otherwise falls back to configured working hours.
     * Holidays and non-working days return a null schedule.
     * Approved leave days return leave context.
     *
     * @return array{shift_id: ?int, start_time: ?string, end_time: ?string, grace_minutes: int, is_half_day: bool, is_leave_day: bool, is_holiday: bool, is_field_work: bool, is_remote_work: bool}
     */
    public function resolveEffectiveShiftForEmployeeDate(string $employeeCode, string $attendanceDate): array
    {
        $employee = Employee::query()->where('code', $employeeCode)->first();
        $date = Carbon::parse($attendanceDate);

        // Check if on approved leave
        if ($employee && $this->isEmployeeOnLeave($employee, $date)) {
            return [
                'shift_id' => null,
                'start_time' => null,
                'end_time' => null,
                'grace_minutes' => 0,
                'is_half_day' => false,
                'is_leave_day' => true,
                'is_holiday' => false,
                'is_field_work' => false,
                'is_remote_work' => false,
            ];
        }

        // Check if on approved remote work
        if ($employee && $this->isEmployeeOnRemoteWork($employee, $date)) {
            return [
                'shift_id' => null,
                'start_time' => null,
                'end_time' => null,
                'grace_minutes' => 0,
                'is_half_day' => false,
                'is_leave_day' => false,
                'is_holiday' => false,
                'is_field_work' => false,
                'is_remote_work' => true,
            ];
        }

        // Check for field work (both approved assignments and requests)
        if ($employee && $this->isEmployeeOnFieldWork($employee, $date)) {
            $fieldWork = FieldWorkAssignment::query()
                ->where('employee_id', $employee->id)
                ->where('start_date', '<=', $date->toDateString())
                ->where('end_date', '>=', $date->toDateString())
                ->where('status', 'approved')
                ->first();

            // If no approved assignment, check for approved request
            if (! $fieldWork) {
                $fieldWorkRequest = FieldWorkRequest::query()
                    ->where('employee_id', $employee->id)
                    ->where('start_date', '<=', $date->toDateString())
                    ->where('end_date', '>=', $date->toDateString())
                    ->where('status', 'approved')
                    ->first();

                if ($fieldWorkRequest) {
                    $fieldWork = $fieldWorkRequest;
                }
            }

            $shiftMeta = $this->resolveShiftForEmployeeDate($employeeCode, $attendanceDate);

            return [
                'shift_id' => $shiftMeta['shift_id'],
                'start_time' => $fieldWork->custom_start_time ?? $fieldWork->custom_end_time ?? null
                    ? ($fieldWork->custom_start_time ? '09:00:00' : $shiftMeta['start_time'])
                    : $shiftMeta['start_time'],
                'end_time' => $fieldWork->custom_end_time ?? $fieldWork->custom_start_time ?? null
                    ? ($fieldWork->custom_end_time ? '18:00:00' : $shiftMeta['end_time'])
                    : $shiftMeta['end_time'],
                'grace_minutes' => (int) $shiftMeta['grace_minutes'],
                'is_half_day' => false,
                'is_leave_day' => false,
                'is_holiday' => false,
                'is_field_work' => true,
                'is_remote_work' => false,
            ];
        }

        // First, try to get shift assignment
        $shiftMeta = $this->resolveShiftForEmployeeDate($employeeCode, $attendanceDate);

        if ($shiftMeta['start_time'] && $shiftMeta['end_time']) {
            return array_merge($shiftMeta, [
                'is_leave_day' => false,
                'is_holiday' => false,
                'is_field_work' => false,
                'is_remote_work' => false,
            ]);
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
                'is_leave_day' => false,
                'is_holiday' => true,
                'is_field_work' => false,
                'is_remote_work' => false,
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
                'is_leave_day' => false,
                'is_holiday' => false,
                'is_field_work' => false,
                'is_remote_work' => false,
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
            'is_leave_day' => false,
            'is_holiday' => false,
            'is_field_work' => false,
            'is_remote_work' => false,
        ];
    }

    /**
     * Resolve shift assignment for an employee on a specific date.
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
            'is_half_day' => false,
        ];
    }

    /**
     * Build comprehensive shift metrics for attendance calculation.
     */
    public function buildShiftMetrics(string $attendanceDate, ?string $punchIn, ?string $punchOut, array $shiftMeta): array
    {
        $result = [
            'shift_id' => $shiftMeta['shift_id'],
            'start_time' => $shiftMeta['start_time'],
            'end_time' => $shiftMeta['end_time'],
            'is_half_day' => $shiftMeta['is_half_day'] ?? false,
            'is_leave_day' => $shiftMeta['is_leave_day'] ?? false,
            'is_holiday' => $shiftMeta['is_holiday'] ?? false,
            'is_field_work' => $shiftMeta['is_field_work'] ?? false,
            'is_remote_work' => $shiftMeta['is_remote_work'] ?? false,
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

        // No shift schedule configured - return with flags set
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
                $result['early_in_minutes'] = abs($actualIn->diffInMinutes($scheduledStart));
                $result['is_early_in'] = true;
            } elseif ($actualIn->gt($graceStart)) {
                $result['late_in_minutes'] = abs($actualIn->diffInMinutes($graceStart));
                $result['is_late_in'] = true;
            }
        }

        // Handle punch_out
        if ($punchOut) {
            $actualOut = Carbon::parse($attendanceDate.' '.$punchOut);

            if ($actualOut->lt($scheduledEnd)) {
                $result['early_out_minutes'] = abs($actualOut->diffInMinutes($scheduledEnd));
                $result['is_early_out'] = true;
            } elseif ($actualOut->gt($scheduledEnd)) {
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
     */
    public function getAttendanceSummaryForDate(string $employeeCode, string $attendanceDate): array
    {
        $date = Carbon::parse($attendanceDate);
        $shiftMeta = $this->resolveEffectiveShiftForEmployeeDate($employeeCode, $attendanceDate);

        // Determine status based on flags (for leave/holiday/field_work without punches)
        if ($shiftMeta['is_leave_day']) {
            return [
                'attendance_date' => $attendanceDate,
                'punch_in' => null,
                'punch_out' => null,
                'shift_meta' => $shiftMeta,
                'metrics' => [],
                'status' => 'on_leave',
            ];
        }

        if ($shiftMeta['is_holiday']) {
            return [
                'attendance_date' => $attendanceDate,
                'punch_in' => null,
                'punch_out' => null,
                'shift_meta' => $shiftMeta,
                'metrics' => [],
                'status' => 'holiday',
            ];
        }

        // Check if it's a holiday or non-working day
        if (! $shiftMeta['start_time']) {
            return [
                'attendance_date' => $attendanceDate,
                'punch_in' => null,
                'punch_out' => null,
                'shift_meta' => $shiftMeta,
                'metrics' => [],
                'status' => 'non_working_day',
            ];
        }

        // This would typically get punches from the database
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
     */
    public function determineAttendanceStatus(array $metrics): string
    {
        // Check special statuses first
        if ($metrics['is_leave_day'] ?? false) {
            return 'on_leave';
        }

        if ($metrics['is_holiday'] ?? false) {
            return 'holiday';
        }

        if ($metrics['is_field_work'] ?? false) {
            return 'field_work';
        }

        if ($metrics['is_remote_work'] ?? false) {
            return 'remote_work';
        }

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
