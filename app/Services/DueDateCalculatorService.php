<?php

namespace App\Services;

use DateTime;
use DateTimeZone;
use App\Services\WorkingHoursService;

class DueDateCalculatorService
{
    protected WorkingHoursService $workingHoursService;

    public function __construct(WorkingHoursService $workingHoursService)
    {
        $this->workingHoursService = $workingHoursService;
    }

    /**
     * Calculate due date based on start date and estimated working hours
     */
    public function calculateDueDate(DateTime $startDate, float $estimateHours): DateTime
    {
        $remainingHours = $estimateHours;
        $timezone = new DateTimeZone($this->workingHoursService->getWorkingHoursConfig()['timezone']);
        
        // Work with the start date in the configured timezone
        $currentDate = clone $startDate;
        $currentDate->setTimezone($timezone);

        // If start time is not within working hours, move to next working time
        if (! $this->workingHoursService->isWorkingTime($currentDate)) {
            $currentDate = $this->workingHoursService->getNextWorkingTime($currentDate);
        }

        while ($remainingHours > 0) {
            $workingHours = $this->workingHoursService->getWorkingHoursForDate($currentDate);
            
            // If no working hours for this day, skip to next day
            if ($workingHours['start'] === null || $workingHours['end'] === null) {
                $currentDate->modify('+1 day');
                $currentDate->setTime(0, 0, 0);
                continue;
            }
            
            $dayStart = $workingHours['start'];
            $dayEnd = $workingHours['end'];

            // Calculate hours from current time to end of working day
            $diff = $dayEnd->diff($currentDate);
            $secondsToEnd = $diff->days * 86400 + $diff->h * 3600 + $diff->i * 60 + $diff->s;
            $availableHours = $secondsToEnd / 3600;

            // Ensure available hours is not negative
            if ($availableHours <= 0) {
                $currentDate->modify('+1 day');
                $currentDate->setTime(0, 0, 0);
                continue;
            }

            if ($remainingHours <= $availableHours) {
                // Can complete remaining hours within current day
                $hoursToAdd = (int)$remainingHours;
                $minutesToAdd = round(($remainingHours - $hoursToAdd) * 60);
                $dueTime = clone $currentDate;
                $dueTime->modify("+{$hoursToAdd} hours {$minutesToAdd} minutes");
                return $dueTime;
            } else {
                // Use all available hours and move to next working day
                $remainingHours -= $availableHours;
                $currentDate->modify('+1 day');
                $currentDate->setTime(0, 0, 0);
                
                // Find next working day
                while (! $this->workingHoursService->isWorkingDay($currentDate)) {
                    $currentDate->modify('+1 day');
                }
                
                // Set time to start of working hours for the new day
                $dayName = strtolower($currentDate->format('l'));
                $workdayConfig = $this->getWorkdayConfig($dayName);
                if (!empty($workdayConfig['start'])) {
                    $currentDate->setTime(
                        (int)explode(':', $workdayConfig['start'])[0],
                        (int)explode(':', $workdayConfig['start'])[1],
                        0
                    );
                }
            }
        }

        return $currentDate;
    }
    
    /**
     * Get workday configuration by day name
     */
    protected function getWorkdayConfig(string $dayName): array
    {
        $config = $this->workingHoursService->getWorkingHoursConfig();
        foreach ($config['workdays'] as $workday) {
            if ($workday['day'] === $dayName) {
                return $workday;
            }
        }
        return [];
    }

    /**
     * Calculate working hours remaining based on start date, current date, and estimate
     */
    public function calculateRemainingHours(DateTime $startDate, DateTime $currentDate, float $estimateHours): float
    {
        $timeCalculator = app(TimeCalculatorService::class);
        $workedSeconds = $timeCalculator->calculateWorkingDuration($startDate, $currentDate);
        $workedHours = $workedSeconds / 3600;
        
        return max(0, $estimateHours - $workedHours);
    }

    /**
     * Calculate progress percentage based on estimate and actual working time
     */
    public function calculateProgressPercentage(float $estimateHours, float $actualWorkingSeconds): float
    {
        if ($estimateHours <= 0) {
            return 0;
        }
        
        $actualHours = $actualWorkingSeconds / 3600;
        return min(100, ($actualHours / $estimateHours) * 100);
    }

    /**
     * Calculate days required to complete remaining work
     */
    public function calculateDaysRequired(float $remainingHours): float
    {
        if ($remainingHours <= 0) {
            return 0;
        }

        $totalDays = 0;
        $remaining = $remainingHours;
        $currentDate = new DateTime();
        $timezone = new DateTimeZone($this->workingHoursService->getWorkingHoursConfig()['timezone']);
        $currentDate->setTimezone($timezone);

        // Skip to next working day if current time is not working time
        if (! $this->workingHoursService->isWorkingTime($currentDate)) {
            $currentDate = $this->workingHoursService->getNextWorkingTime($currentDate);
        }

        $maxDate = clone $currentDate;
        $maxDate->modify('+1 year');

        while ($remaining > 0 && $currentDate < $maxDate) {
            $dailyHours = $this->workingHoursService->getDailyWorkingHours($currentDate);
            
            if ($dailyHours > 0) {
                if ($remaining <= $dailyHours) {
                    $totalDays += $remaining / $dailyHours;
                    $remaining = 0;
                } else {
                    $totalDays += 1;
                    $remaining -= $dailyHours;
                }
            }

            $currentDate->modify('+1 day');
            $currentDate->setTime(0, 0, 0);

            // Find next working day
            while ($remaining > 0 && ! $this->workingHoursService->isWorkingDay($currentDate) && $currentDate < $maxDate) {
                $currentDate->modify('+1 day');
            }
        }

        return $totalDays;
    }
}
