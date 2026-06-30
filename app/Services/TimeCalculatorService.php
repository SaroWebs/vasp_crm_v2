<?php

namespace App\Services;

use App\Models\Employee;
use Carbon\Carbon;
use DateTime;

class TimeCalculatorService
{
    public function __construct(
        protected WorkingHoursService $workingHoursService,
        private AttendanceDayPolicyService $dayPolicyService
    ) {}

    /**
     * Calculate working duration between two dates
     */
    public function calculateWorkingDuration(DateTime $startTime, DateTime $endTime, ?Employee $employee = null): float
    {
        // Ensure start time is before end time
        if ($startTime > $endTime) {
            $temp = $startTime;
            $startTime = $endTime;
            $endTime = $temp;
        }

        if ($employee) {
            return $this->calculateShiftWorkingDuration($startTime, $endTime, $employee);
        }

        // Convert to configured timezone for calculations
        $timezone = new \DateTimeZone($this->workingHoursService->getWorkingHoursConfig()['timezone']);
        $originalTimezone = $startTime->getTimezone();

        $start = clone $startTime;
        $start->setTimezone($timezone);
        $end = clone $endTime;
        $end->setTimezone($timezone);

        $totalSeconds = 0;
        $currentDate = clone $start;

        while ($currentDate <= $end) {
            // Skip if current date is not a working day
            if (! $this->workingHoursService->isWorkingDay($currentDate)) {
                $currentDate->modify('+1 day');
                $currentDate->setTime(0, 0, 0);

                continue;
            }

            $workingHours = $this->workingHoursService->getWorkingHoursForDate($currentDate);

            // Calculate time range for current day
            $dayStart = max($start, $workingHours['start']);
            $dayEnd = min($end, $workingHours['end']);

            // Skip if no overlapping time on this day
            if ($dayStart > $dayEnd) {
                $currentDate->modify('+1 day');
                $currentDate->setTime(0, 0, 0);

                continue;
            }

            // Calculate duration for this day
            $dayDuration = $this->calculateDayDuration($dayStart, $dayEnd, $workingHours);
            $totalSeconds += $dayDuration;

            $currentDate->modify('+1 day');
            $currentDate->setTime(0, 0, 0);
        }

        return $totalSeconds;
    }

    /**
     * Calculate working duration for a single day
     */
    protected function calculateDayDuration(DateTime $startTime, DateTime $endTime, array $workingHours): float
    {
        $diff = $startTime->diff($endTime);
        $totalSeconds = ($diff->days * 24 * 3600) + ($diff->h * 3600) + ($diff->i * 60) + $diff->s;

        // Subtract break time if applicable
        if ($workingHours['break_start'] && $workingHours['break_end']) {
            // Calculate overlap between working time and break time
            $breakStart = max($startTime, $workingHours['break_start']);
            $breakEnd = min($endTime, $workingHours['break_end']);

            if ($breakStart <= $breakEnd) {
                $breakDiff = $breakStart->diff($breakEnd);
                $breakSeconds = ($breakDiff->days * 24 * 3600) + ($breakDiff->h * 3600) + ($breakDiff->i * 60) + $breakDiff->s;
                $totalSeconds -= $breakSeconds;
            }
        }

        return $totalSeconds;
    }

    /**
     * Calculate end time based on start time and duration in seconds
     */
    public function calculateEndTime(DateTime $startTime, float $durationSeconds): DateTime
    {
        $currentTime = clone $startTime;
        $remainingSeconds = $durationSeconds;

        while ($remainingSeconds > 0) {
            // Skip if current time is not in working hours
            if (! $this->workingHoursService->isWorkingTime($currentTime)) {
                $currentTime = $this->workingHoursService->getNextWorkingTime($currentTime);

                continue;
            }

            $workingHours = $this->workingHoursService->getWorkingHoursForDate($currentTime);

            // Calculate available time for current day
            $dayEnd = $workingHours['end'];

            // Check break time
            $nextBreak = null;
            if ($workingHours['break_start'] && $workingHours['break_end']) {
                if ($currentTime < $workingHours['break_start']) {
                    $nextBreak = $workingHours['break_start'];
                } elseif ($currentTime >= $workingHours['break_start'] && $currentTime <= $workingHours['break_end']) {
                    $currentTime = $workingHours['break_end'];

                    continue;
                }
            }

            $availableEnd = $nextBreak ?? $dayEnd;

            $diff = $currentTime->diff($availableEnd);
            $availableSeconds = ($diff->days * 24 * 3600) + ($diff->h * 3600) + ($diff->i * 60) + $diff->s;

            if ($availableSeconds >= $remainingSeconds) {
                // Can complete duration within current available time
                $currentTime->modify("+{$remainingSeconds} seconds");
                $remainingSeconds = 0;
            } else {
                // Use all available time and move to next working time
                $remainingSeconds -= $availableSeconds;
                $currentTime = $this->workingHoursService->getNextWorkingTime($availableEnd);
            }
        }

        return $currentTime;
    }

    /**
     * Get the end of working hours for a specific date
     */
    public function getWorkingDayEnd(DateTime $date): DateTime
    {
        $workingHours = $this->workingHoursService->getWorkingHoursForDate($date);

        return $workingHours['end'] ?? $date;
    }

    /**
     * Split a time entry into working day segments
     */
    public function splitIntoWorkingSegments(DateTime $startTime, DateTime $endTime): array
    {
        $segments = [];
        $currentDate = clone $startTime;

        while ($currentDate <= $endTime) {
            if ($this->workingHoursService->isWorkingDay($currentDate)) {
                $workingHours = $this->workingHoursService->getWorkingHoursForDate($currentDate);

                $dayStart = max($startTime, $workingHours['start']);
                $dayEnd = min($endTime, $workingHours['end']);

                if ($dayStart <= $dayEnd) {
                    $segments[] = [
                        'date' => $currentDate->format('Y-m-d'),
                        'start' => $dayStart,
                        'end' => $dayEnd,
                        'duration' => $this->calculateDayDuration($dayStart, $dayEnd, $workingHours),
                    ];
                }
            }

            $currentDate->modify('+1 day');
            $currentDate->setTime(0, 0, 0);
        }

        return $segments;
    }

    private function calculateShiftWorkingDuration(DateTime $startTime, DateTime $endTime, Employee $employee): float
    {
        $timezone = new \DateTimeZone($this->workingHoursService->getWorkingHoursConfig()['timezone']);

        $start = Carbon::instance((clone $startTime)->setTimezone($timezone));
        $end = Carbon::instance((clone $endTime)->setTimezone($timezone));

        $totalSeconds = 0.0;
        $cursor = $start->copy()->subDay()->startOfDay();
        $lastDate = $end->copy()->startOfDay();

        while ($cursor->lessThanOrEqualTo($lastDate)) {
            $schedule = $this->dayPolicyService->resolveForEmployeeDate($employee, $cursor);

            if ($schedule['start_time'] && $schedule['end_time']) {
                [$shiftStart, $shiftEnd] = $this->resolveShiftWindow(
                    $cursor->toDateString(),
                    $schedule['start_time'],
                    $schedule['end_time'],
                    $timezone,
                );

                $overlapStart = $start->greaterThan($shiftStart) ? $start : $shiftStart;
                $overlapEnd = $end->lessThan($shiftEnd) ? $end : $shiftEnd;

                if ($overlapStart->lessThan($overlapEnd)) {
                    $totalSeconds += $overlapStart->diffInSeconds($overlapEnd);
                }
            }

            $cursor->addDay();
        }

        return $totalSeconds;
    }

    /**
     * @return array{0: Carbon, 1: Carbon}
     */
    private function resolveShiftWindow(string $date, string $startTime, string $endTime, \DateTimeZone $timezone): array
    {
        $start = Carbon::parse($date.' '.$startTime, $timezone);
        $end = Carbon::parse($date.' '.$endTime, $timezone);

        if ($end->lessThanOrEqualTo($start)) {
            $end->addDay();
        }

        return [$start, $end];
    }
}
