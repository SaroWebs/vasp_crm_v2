<?php

namespace App\Services;

use App\Models\Employee;
use App\Models\EmployeeShiftAssignment;
use App\Models\FieldWorkAssignment;
use App\Models\FieldWorkRequest;
use App\Models\Holiday;
use App\Models\LeaveRequest;
use App\Models\RemoteWorkAssignment;
use App\Models\RemoteWorkRequest;
use Carbon\Carbon;
use DateTimeInterface;
use Illuminate\Support\Facades\Schema;

class AttendanceDayPolicyService
{
    public function __construct(private WorkingHoursService $workingHoursService) {}

    /**
     * @return array{
     *     shift_id: ?int,
     *     start_time: ?string,
     *     end_time: ?string,
     *     grace_minutes: int,
     *     is_half_day: bool,
     *     is_leave_day: bool,
     *     is_holiday: bool,
     *     is_weekend: bool,
     *     is_field_work: bool,
     *     is_remote_work: bool,
     *     is_working_day: bool,
     *     scheduled_minutes: int,
     *     source: string
     * }
     */
    public function resolveForEmployeeDate(?Employee $employee, Carbon|string $date): array
    {
        $day = $date instanceof Carbon ? $date->copy() : Carbon::parse($date);
        $dateString = $day->toDateString();

        if ($this->isHoliday($day)) {
            return $this->emptySchedule([
                'is_holiday' => true,
                'source' => 'holiday',
            ]);
        }

        if ($day->isSunday()) {
            return $this->emptySchedule([
                'is_weekend' => true,
                'source' => 'weekly_off',
            ]);
        }

        if ($employee && $this->isEmployeeOnLeave($employee, $day)) {
            return $this->emptySchedule([
                'is_leave_day' => true,
                'source' => 'leave',
            ]);
        }

        if ($employee && $this->isEmployeeOnRemoteWork($employee, $day)) {
            return array_merge(
                $this->resolveBaseSchedule($employee, $dateString, $day),
                [
                    'is_remote_work' => true,
                    'source' => 'remote_work',
                ],
            );
        }

        if ($employee && $this->isEmployeeOnFieldWork($employee, $day)) {
            $fieldWorkSchedule = $this->applyFieldWorkOverrides(
                $this->resolveBaseSchedule($employee, $dateString, $day),
                $this->resolveFieldWorkRecord($employee, $day),
                $dateString,
            );

            return array_merge($fieldWorkSchedule, [
                'is_field_work' => true,
                'source' => 'field_work',
            ]);
        }

        return $this->resolveBaseSchedule($employee, $dateString, $day);
    }

    public function isHoliday(Carbon $date): bool
    {
        if (! Schema::hasTable('holidays')) {
            return false;
        }

        return Holiday::query()
            ->whereDate('date', $date->toDateString())
            ->exists();
    }

    public function isEmployeeOnLeave(Employee $employee, Carbon $date): bool
    {
        return LeaveRequest::query()
            ->where('employee_id', $employee->id)
            ->where('status', 'approved')
            ->whereDate('start_date', '<=', $date->toDateString())
            ->whereDate('end_date', '>=', $date->toDateString())
            ->exists();
    }

    public function isEmployeeOnRemoteWork(Employee $employee, Carbon $date): bool
    {
        $hasDirectAssignment = RemoteWorkAssignment::query()
            ->where('employee_id', $employee->id)
            ->whereDate('start_date', '<=', $date->toDateString())
            ->whereDate('end_date', '>=', $date->toDateString())
            ->exists();

        if ($hasDirectAssignment) {
            return true;
        }

        return RemoteWorkRequest::query()
            ->where('employee_id', $employee->id)
            ->where('status', 'approved')
            ->whereDate('start_date', '<=', $date->toDateString())
            ->whereDate('end_date', '>=', $date->toDateString())
            ->exists();
    }

    public function isEmployeeOnFieldWork(Employee $employee, Carbon $date): bool
    {
        $hasApprovedAssignment = FieldWorkAssignment::query()
            ->where('employee_id', $employee->id)
            ->whereDate('start_date', '<=', $date->toDateString())
            ->whereDate('end_date', '>=', $date->toDateString())
            ->where('status', 'approved')
            ->exists();

        if ($hasApprovedAssignment) {
            return true;
        }

        return FieldWorkRequest::query()
            ->where('employee_id', $employee->id)
            ->whereDate('start_date', '<=', $date->toDateString())
            ->whereDate('end_date', '>=', $date->toDateString())
            ->where('status', 'approved')
            ->exists();
    }

    public function isWithinWorkingWindow(?Employee $employee, DateTimeInterface $time): bool
    {
        if (! $employee) {
            return $this->workingHoursService->isWorkingTime(new \DateTime($time->format('Y-m-d H:i:s')));
        }

        $moment = Carbon::instance($time);
        $schedule = $this->resolveForEmployeeDate($employee, $moment);

        if (! $schedule['start_time'] || ! $schedule['end_time']) {
            return false;
        }

        [$start, $end] = $this->resolveScheduleWindow($moment->toDateString(), $schedule['start_time'], $schedule['end_time']);

        if ($moment->betweenIncluded($start, $end)) {
            return true;
        }

        $previousDay = $moment->copy()->subDay();
        $previousSchedule = $this->resolveForEmployeeDate($employee, $previousDay);

        if (! $previousSchedule['start_time'] || ! $previousSchedule['end_time']) {
            return false;
        }

        [$previousStart, $previousEnd] = $this->resolveScheduleWindow(
            $previousDay->toDateString(),
            $previousSchedule['start_time'],
            $previousSchedule['end_time'],
        );

        return $previousEnd->gt($previousStart->copy()->endOfDay())
            && $moment->betweenIncluded($previousStart, $previousEnd);
    }

    private function resolveFieldWorkRecord(Employee $employee, Carbon $date): FieldWorkAssignment|FieldWorkRequest|null
    {
        $fieldWork = FieldWorkAssignment::query()
            ->where('employee_id', $employee->id)
            ->whereDate('start_date', '<=', $date->toDateString())
            ->whereDate('end_date', '>=', $date->toDateString())
            ->where('status', 'approved')
            ->first();

        if ($fieldWork) {
            return $fieldWork;
        }

        return FieldWorkRequest::query()
            ->where('employee_id', $employee->id)
            ->whereDate('start_date', '<=', $date->toDateString())
            ->whereDate('end_date', '>=', $date->toDateString())
            ->where('status', 'approved')
            ->first();
    }

    /**
     * @return array{shift_id: ?int, start_time: ?string, end_time: ?string, grace_minutes: int}
     */
    private function resolveAssignedShift(?Employee $employee, string $date): array
    {
        if (! $employee || ! Schema::hasTable('employee_shift_assignments') || ! Schema::hasTable('shifts')) {
            return [
                'shift_id' => null,
                'start_time' => null,
                'end_time' => null,
                'grace_minutes' => 0,
            ];
        }

        $assignment = EmployeeShiftAssignment::query()
            ->with('shift')
            ->where('employee_id', $employee->id)
            ->where('is_active', true)
            ->where('effective_from', '<=', $date)
            ->where(function ($query) use ($date): void {
                $query->whereNull('effective_to')
                    ->orWhere('effective_to', '>=', $date);
            })
            ->orderByDesc('effective_from')
            ->first();

        if (! $assignment || ! $assignment->shift || ! $assignment->shift->is_active) {
            return [
                'shift_id' => null,
                'start_time' => null,
                'end_time' => null,
                'grace_minutes' => 0,
            ];
        }

        return [
            'shift_id' => $assignment->shift->id,
            'start_time' => $assignment->shift->start_time,
            'end_time' => $assignment->shift->end_time,
            'grace_minutes' => $this->resolveGraceMinutes((int) $assignment->shift->grace_minutes),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function resolveBaseSchedule(?Employee $employee, string $dateString, Carbon $date): array
    {
        $assignedShift = $this->resolveAssignedShift($employee, $dateString);

        if (! $assignedShift['start_time'] || ! $assignedShift['end_time']) {
            return $this->emptySchedule([
                'source' => 'unassigned_shift',
            ]);
        }

        $schedule = array_merge($assignedShift, ['source' => 'assigned_shift']);

        if ($date->isSaturday()) {
            $schedule['end_time'] = $this->resolveHalfDayEndTime($dateString, $schedule['start_time'], $schedule['end_time']);
            $schedule['is_half_day'] = true;
            $schedule['source'] = $schedule['source'].'_half_day';
        } else {
            $schedule['is_half_day'] = false;
        }

        $scheduledMinutes = $this->minutesBetween($dateString, $schedule['start_time'], $schedule['end_time']);

        return array_merge($this->emptySchedule(), [
            'shift_id' => $schedule['shift_id'],
            'start_time' => $this->formatTime($schedule['start_time']),
            'end_time' => $this->formatTime($schedule['end_time']),
            'grace_minutes' => (int) $schedule['grace_minutes'],
            'is_half_day' => (bool) $schedule['is_half_day'],
            'is_working_day' => true,
            'scheduled_minutes' => $scheduledMinutes,
            'source' => $schedule['source'],
        ]);
    }

    /**
     * @param  array<string, mixed>  $overrides
     * @return array<string, mixed>
     */
    private function emptySchedule(array $overrides = []): array
    {
        return array_merge([
            'shift_id' => null,
            'start_time' => null,
            'end_time' => null,
            'grace_minutes' => 0,
            'is_half_day' => false,
            'is_leave_day' => false,
            'is_holiday' => false,
            'is_weekend' => false,
            'is_field_work' => false,
            'is_remote_work' => false,
            'is_working_day' => false,
            'scheduled_minutes' => 0,
            'source' => 'none',
        ], $overrides);
    }

    private function resolveHalfDayEndTime(string $date, string $startTime, string $scheduledEndTime): string
    {
        $halfDayEnd = Carbon::parse($date.' '.$startTime)->addHours(5);
        [, $scheduledEnd] = $this->resolveScheduleWindow($date, $startTime, $scheduledEndTime);

        if ($scheduledEnd->lt($halfDayEnd)) {
            return $scheduledEnd->format('H:i:s');
        }

        return $halfDayEnd->format('H:i:s');
    }

    /**
     * @param  array<string, mixed>  $schedule
     * @return array<string, mixed>
     */
    private function applyFieldWorkOverrides(array $schedule, FieldWorkAssignment|FieldWorkRequest|null $fieldWork, string $date): array
    {
        if (! $fieldWork) {
            return $schedule;
        }

        if ($fieldWork->custom_start_time) {
            $schedule['start_time'] = $this->formatTime((string) $fieldWork->custom_start_time);
        }

        if ($fieldWork->custom_end_time) {
            $schedule['end_time'] = $this->formatTime((string) $fieldWork->custom_end_time);
        }

        if ($schedule['start_time'] && $schedule['end_time']) {
            $schedule['scheduled_minutes'] = $this->minutesBetween($date, $schedule['start_time'], $schedule['end_time']);
            $schedule['is_working_day'] = true;
        }

        return $schedule;
    }

    private function minutesBetween(string $date, string $startTime, string $endTime): int
    {
        [$start, $end] = $this->resolveScheduleWindow($date, $startTime, $endTime);

        return (int) $start->diffInMinutes($end);
    }

    private function formatTime(?string $time): ?string
    {
        if (! $time) {
            return null;
        }

        return Carbon::parse($time)->format('H:i:s');
    }

    private function resolveGraceMinutes(int $graceMinutes): int
    {
        return max(0, $graceMinutes);
    }

    /**
     * @return array{0: Carbon, 1: Carbon}
     */
    private function resolveScheduleWindow(string $date, string $startTime, string $endTime): array
    {
        $start = Carbon::parse($date.' '.$startTime);
        $end = Carbon::parse($date.' '.$endTime);

        if ($end->lessThanOrEqualTo($start)) {
            $end->addDay();
        }

        return [$start, $end];
    }
}
