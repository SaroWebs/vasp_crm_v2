<?php

namespace App\Services;

use DateTime;
use DateTimeZone;
use Illuminate\Support\Facades\File;

class WorkingHoursService
{
    protected array $workingHoursConfig;
    protected array $holidaysConfig;

    public function __construct()
    {
        $this->workingHoursConfig = $this->loadWorkingHoursConfig();
        $this->holidaysConfig = $this->loadHolidaysConfig();
    }

    /**
     * Load working hours configuration from JSON file
     */
    protected function loadWorkingHoursConfig(): array
    {
        $configPath = config_path('working-hours.json');
        
        if (!File::exists($configPath)) {
            return $this->getDefaultWorkingHoursConfig();
        }

        $content = File::get($configPath);
        $config = json_decode($content, true);
        
        return $config ?: $this->getDefaultWorkingHoursConfig();
    }

    /**
     * Load holidays configuration from JSON file
     */
    protected function loadHolidaysConfig(): array
    {
        $configPath = config_path('holidays.json');
        
        if (!File::exists($configPath)) {
            return ['holidays' => [], 'year' => date('Y')];
        }

        $content = File::get($configPath);
        $config = json_decode($content, true);
        
        return $config ?: ['holidays' => [], 'year' => date('Y')];
    }

    /**
     * Get default working hours configuration
     */
    protected function getDefaultWorkingHoursConfig(): array
    {
        return [
            'workdays' => [
                ['day' => 'monday', 'start' => '09:00', 'end' => '18:00', 'break_start' => '13:00', 'break_end' => '14:00'],
                ['day' => 'tuesday', 'start' => '09:00', 'end' => '18:00', 'break_start' => '13:00', 'break_end' => '14:00'],
                ['day' => 'wednesday', 'start' => '09:00', 'end' => '18:00', 'break_start' => '13:00', 'break_end' => '14:00'],
                ['day' => 'thursday', 'start' => '09:00', 'end' => '18:00', 'break_start' => '13:00', 'break_end' => '14:00'],
                ['day' => 'friday', 'start' => '09:00', 'end' => '17:00', 'break_start' => '13:00', 'break_end' => '14:00'],
                ['day' => 'saturday', 'start' => '', 'end' => '', 'break_start' => '', 'break_end' => ''],
                ['day' => 'sunday', 'start' => '', 'end' => '', 'break_start' => '', 'break_end' => '']
            ],
            'timezone' => 'Asia/Calcutta'
        ];
    }

    /**
     * Check if a given date is a working day
     */
    public function isWorkingDay(DateTime $date): bool
    {
        // Check if it's a holiday
        if ($this->isHoliday($date)) {
            return false;
        }

        // Check if it's a working day (has working hours configured)
        $dayName = strtolower($date->format('l'));
        $workdayConfig = $this->getWorkdayConfig($dayName);
        
        return !empty($workdayConfig['start']) && !empty($workdayConfig['end']);
    }

    /**
     * Check if a given date is a holiday
     */
    public function isHoliday(DateTime $date): bool
    {
        $dateStr = $date->format('Y-m-d');
        
        foreach ($this->holidaysConfig['holidays'] as $holiday) {
            if ($holiday['date'] === $dateStr) {
                return true;
            }
        }
        
        return false;
    }

    /**
     * Get working hours configuration for a specific date
     */
    public function getWorkingHoursForDate(DateTime $date): array
    {
        $dayName = strtolower($date->format('l'));
        $workdayConfig = $this->getWorkdayConfig($dayName);
        
        if (empty($workdayConfig['start']) || empty($workdayConfig['end'])) {
            return ['start' => null, 'end' => null, 'break_start' => null, 'break_end' => null];
        }

        // Create DateTime objects for working hours
        $timezone = new DateTimeZone($this->workingHoursConfig['timezone']);
        $dateStr = $date->format('Y-m-d');
        
        return [
            'start' => new DateTime($dateStr . ' ' . $workdayConfig['start'], $timezone),
            'end' => new DateTime($dateStr . ' ' . $workdayConfig['end'], $timezone),
            'break_start' => !empty($workdayConfig['break_start']) ? new DateTime($dateStr . ' ' . $workdayConfig['break_start'], $timezone) : null,
            'break_end' => !empty($workdayConfig['break_end']) ? new DateTime($dateStr . ' ' . $workdayConfig['break_end'], $timezone) : null
        ];
    }

    /**
     * Get workday configuration by day name
     */
    protected function getWorkdayConfig(string $dayName): array
    {
        foreach ($this->workingHoursConfig['workdays'] as $workday) {
            if ($workday['day'] === $dayName) {
                return $workday;
            }
        }
        
        return [];
    }

    /**
     * Get next working time from given time
     */
    public function getNextWorkingTime(DateTime $currentTime): DateTime
    {
        $originalTimezone = $currentTime->getTimezone();
        $timezone = new DateTimeZone($this->workingHoursConfig['timezone']);
        
        $currentTime = clone $currentTime;
        $currentTime->setTimezone($timezone);
        
        $nextTime = clone $currentTime;
        $nextTime->modify('+1 minute');
        
        while (! $this->isWorkingTime($nextTime)) {
            $nextTime->modify('+1 minute');
            
            // Prevent infinite loop
            if ($nextTime > (new DateTime())->setTimezone($timezone)->modify('+1 year')) {
                throw new \Exception('Could not find next working time within reasonable timeframe');
            }
        }
        
        // Convert back to original timezone
        $nextTime->setTimezone($originalTimezone);
        return $nextTime;
    }

    /**
     * Get the end time of the current working period
     */
    public function getCurrentWorkingPeriodEnd(DateTime $currentTime): ?DateTime
    {
        $originalTimezone = $currentTime->getTimezone();
        $timezone = new DateTimeZone($this->workingHoursConfig['timezone']);
        
        $currentTime = clone $currentTime;
        $currentTime->setTimezone($timezone);
        
        if (! $this->isWorkingTime($currentTime)) {
            return null;
        }
        
        $workingHours = $this->getWorkingHoursForDate($currentTime);
        
        // Check if we're in a break period (though isWorkingTime should have returned false)
        if ($workingHours['break_start'] && $workingHours['break_end']) {
            if ($currentTime >= $workingHours['break_start'] && $currentTime <= $workingHours['break_end']) {
                return $workingHours['break_end'];
            } elseif ($currentTime < $workingHours['break_start']) {
                return $workingHours['break_start'];
            }
        }
        
        return $workingHours['end'];
    }

    /**
     * Check if a specific time is within working hours
     */
    public function isWorkingTime(DateTime $time): bool
    {
        if (! $this->isWorkingDay($time)) {
            return false;
        }

        $workingHours = $this->getWorkingHoursForDate($time);
        
        // Convert time to configured timezone for comparison
        $timezone = new DateTimeZone($this->workingHoursConfig['timezone']);
        $time = clone $time;
        $time->setTimezone($timezone);
        
        // Check if time is within working hours
        if ($time < $workingHours['start'] || $time > $workingHours['end']) {
            return false;
        }

        // Check if time is during break
        if ($workingHours['break_start'] && $workingHours['break_end']) {
            if ($time >= $workingHours['break_start'] && $time <= $workingHours['break_end']) {
                return false;
            }
        }

        return true;
    }

    /**
     * Get total working hours per day for a specific date
     */
    public function getDailyWorkingHours(DateTime $date): float
    {
        if (! $this->isWorkingDay($date)) {
            return 0;
        }

        $workingHours = $this->getWorkingHoursForDate($date);
        
        $diff = $workingHours['start']->diff($workingHours['end']);
        $totalDuration = ($diff->days * 24 * 3600 + $diff->h * 3600 + $diff->i * 60 + $diff->s) / 3600;
        
        if ($workingHours['break_start'] && $workingHours['break_end']) {
            $breakDiff = $workingHours['break_start']->diff($workingHours['break_end']);
            $breakDuration = ($breakDiff->days * 24 * 3600 + $breakDiff->h * 3600 + $breakDiff->i * 60 + $breakDiff->s) / 3600;
            $totalDuration -= $breakDuration;
        }
        
        return $totalDuration;
    }

    /**
     * Get all holidays for a specific year
     */
    public function getHolidaysForYear(int $year): array
    {
        $holidays = [];
        
        foreach ($this->holidaysConfig['holidays'] as $holiday) {
            $holidayDate = new DateTime($holiday['date']);
            if ($holidayDate->format('Y') === (string) $year) {
                $holidays[] = $holiday;
            }
        }
        
        return $holidays;
    }

    /**
     * Get working hours configuration
     */
    public function getWorkingHoursConfig(): array
    {
        return $this->workingHoursConfig;
    }

    /**
     * Get holidays configuration
     */
    public function getHolidaysConfig(): array
    {
        return $this->holidaysConfig;
    }
}
