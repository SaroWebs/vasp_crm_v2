<?php

namespace App\Services;

use App\Models\TaskTimeEntry;
use DateTime;
use DateTimeZone;
use Illuminate\Support\Facades\Log;

/**
 * Service to automatically manage time entries outside working hours.
 * 
 * This service handles:
 * - Pausing entries started outside working hours
 * - Pausing entries that run past working hours end
 * - Splitting entries that span multiple working days
 */
class TimeEntryAutoPauseService
{
    protected WorkingHoursService $workingHoursService;
    protected TimeCalculatorService $timeCalculatorService;

    public function __construct(
        WorkingHoursService $workingHoursService,
        TimeCalculatorService $timeCalculatorService
    ) {
        $this->workingHoursService = $workingHoursService;
        $this->timeCalculatorService = $timeCalculatorService;
    }

    /**
     * Process all active time entries and auto-pause those outside working hours.
     * 
     * @return array Array containing counts of processed, paused, and split entries
     */
    public function processActiveTimeEntries(): array
    {
        $activeEntries = TaskTimeEntry::active()->get();
        
        $stats = [
            'processed' => 0,
            'paused' => 0,
            'skipped' => 0,
            'split' => 0,
        ];

        foreach ($activeEntries as $entry) {
            $stats['processed']++;
            
            $result = $this->processTimeEntry($entry);
            
            if ($result === 'paused') {
                $stats['paused']++;
            } elseif ($result === 'split') {
                $stats['split']++;
            } elseif ($result === 'skipped') {
                $stats['skipped']++;
            }
        }

        Log::info('TimeEntryAutoPauseService: Processed active time entries', $stats);
        
        return $stats;
    }

    /**
     * Process a single time entry.
     * 
     * @param TaskTimeEntry $entry
     * @return string Result: 'paused', 'split', 'skipped', or 'active'
     */
    public function processTimeEntry(TaskTimeEntry $entry): string
    {
        $now = now();
        $startTime = $entry->start_time instanceof DateTime 
            ? clone $entry->start_time 
            : new DateTime($entry->start_time);
        
        // Convert to configured timezone
        $timezone = new DateTimeZone($this->workingHoursService->getWorkingHoursConfig()['timezone']);
        $startTime->setTimezone($timezone);
        
        $nowInTz = clone $now;
        $nowInTz->setTimezone($timezone);

        // Check if the entry was started outside working hours
        if (!$this->workingHoursService->isWorkingDay($startTime)) {
            // Started on a non-working day (holiday or weekend)
            return $this->pauseEntry($entry, 'Started on non-working day');
        }

        if (!$this->workingHoursService->isWorkingTime($startTime)) {
            // Started outside working hours (evening, early morning)
            return $this->pauseEntry($entry, 'Started outside working hours');
        }

        // Check if the entry has run past today's working hours
        $workingHours = $this->workingHoursService->getWorkingHoursForDate($startTime);
        
        if ($workingHours['end'] && $nowInTz > $workingHours['end']) {
            // Current time is past the end of working hours for the day the entry started
            // Check if we're on the same day
            if ($startTime->format('Y-m-d') === $nowInTz->format('Y-m-d')) {
                return $this->pauseEntry($entry, 'Ran past end of working hours');
            }
            
            // Entry spans multiple days - split it
            return $this->splitEntryIfNeeded($entry);
        }

        // Check if the entry spans to a new working day (overnight)
        $nextDayStart = clone $startTime;
        $nextDayStart->modify('+1 day');
        $nextDayStart->setTime(0, 0, 0);
        
        if ($nowInTz >= $nextDayStart && $this->workingHoursService->isWorkingDay($nextDayStart)) {
            // We're on a new working day and the entry is still running
            return $this->splitEntryIfNeeded($entry);
        }

        // Entry is within valid working hours
        return 'active';
    }

    /**
     * Pause a time entry with a reason.
     * 
     * @param TaskTimeEntry $entry
     * @param string $reason
     * @return string
     */
    protected function pauseEntry(TaskTimeEntry $entry, string $reason): string
    {
        Log::info("TimeEntryAutoPauseService: Pausing entry #{$entry->id} - {$reason}");
        
        $entry->end();
        
        return 'paused';
    }

    /**
     * Split an entry if it spans multiple working days.
     * 
     * @param TaskTimeEntry $entry
     * @return string
     */
    protected function splitEntryIfNeeded(TaskTimeEntry $entry): string
    {
        $now = now();
        $startTime = $entry->start_time instanceof DateTime 
            ? clone $entry->start_time 
            : new DateTime($entry->start_time);
        
        $timezone = new DateTimeZone($this->workingHoursService->getWorkingHoursConfig()['timezone']);
        $startTime->setTimezone($timezone);
        
        $nowInTz = clone $now;
        $nowInTz->setTimezone($timezone);

        // Check if entry spans multiple working days
        $startDate = clone $startTime;
        $startDate->setTime(0, 0, 0);
        
        $endDate = clone $nowInTz;
        $endDate->setTime(0, 0, 0);

        if ($startDate == $endDate) {
            // Same day, just pause it
            return $this->pauseEntry($entry, 'Ran past end of working hours');
        }

        // Entry spans multiple days - split into separate entries
        Log::info("TimeEntryAutoPauseService: Splitting entry #{$entry->id} spanning multiple days");

        $currentDate = clone $startDate;
        $createdEntries = 0;

        while ($currentDate < $endDate) {
            $workingHours = $this->workingHoursService->getWorkingHoursForDate($currentDate);
            
            if (!$workingHours['start'] || !$workingHours['end']) {
                // Non-working day, skip
                $currentDate->modify('+1 day');
                continue;
            }

            // Calculate segment start and end
            $segmentStart = $currentDate == $startDate ? $startTime : $workingHours['start'];
            
            // For the last day, use current time as end
            if ($currentDate == $endDate) {
                $segmentEnd = $nowInTz;
            } else {
                $segmentEnd = $workingHours['end'];
            }

            // Skip if segment is outside working hours
            if ($segmentStart >= $workingHours['start'] && $segmentEnd <= $workingHours['end']) {
                // Create a new time entry for this segment
                if ($createdEntries === 0) {
                    // Update the original entry
                    $entry->end_time = $segmentEnd;
                    $entry->is_active = false;
                    $entry->save();
                    $createdEntries++;
                } else {
                    // Create additional entries for subsequent days
                    TaskTimeEntry::create([
                        'task_id' => $entry->task_id,
                        'user_id' => $entry->user_id,
                        'start_time' => $workingHours['start'],
                        'end_time' => $segmentEnd,
                        'description' => $entry->description,
                        'is_active' => false,
                        'metadata' => $entry->metadata,
                    ]);
                    $createdEntries++;
                }
            }

            $currentDate->modify('+1 day');
        }

        // If entry wasn't closed above, close it now
        if ($entry->is_active) {
            $entry->end_time = $now;
            $entry->is_active = false;
            $entry->save();
        }

        return 'split';
    }

    /**
     * Check if a time entry should be allowed to start.
     * 
     * @param DateTime $startTime
     * @return bool
     */
    public function canStartTimeEntry(DateTime $startTime): bool
    {
        return $this->workingHoursService->isWorkingDay($startTime) 
            && $this->workingHoursService->isWorkingTime($startTime);
    }

    /**
     * Get the recommended end time for an active entry.
     * 
     * @param TaskTimeEntry $entry
     * @return DateTime|null
     */
    public function getRecommendedEndTime(TaskTimeEntry $entry): ?DateTime
    {
        $startTime = $entry->start_time instanceof DateTime 
            ? clone $entry->start_time 
            : new DateTime($entry->start_time);
        
        $timezone = new DateTimeZone($this->workingHoursService->getWorkingHoursConfig()['timezone']);
        $startTime->setTimezone($timezone);

        // Get working hours for the start day
        $workingHours = $this->workingHoursService->getWorkingHoursForDate($startTime);
        
        if ($workingHours['end']) {
            return $workingHours['end'];
        }

        return null;
    }

    /**
     * Forcefully stop all active time entries.
     * 
     * @return int Number of entries stopped
     */
    public function forceStopAllActiveEntries(): int
    {
        $activeEntries = TaskTimeEntry::active()->get();
        $count = 0;

        foreach ($activeEntries as $entry) {
            $entry->end();
            $count++;
            Log::info("TimeEntryAutoPauseService: Force stopped entry #{$entry->id}");
        }

        return $count;
    }

    /**
     * Stop entries that have been running too long (configurable threshold).
     * 
     * @param int $maxHours Maximum hours allowed for a single entry
     * @return int Number of entries stopped
     */
    public function stopEntriesExceedingMaxDuration(int $maxHours = 12): int
    {
        $activeEntries = TaskTimeEntry::active()->get();
        $count = 0;
        $now = now();

        foreach ($activeEntries as $entry) {
            $startTime = $entry->start_time instanceof DateTime 
                ? clone $entry->start_time 
                : new DateTime($entry->start_time);
            
            $hoursRunning = ($now->timestamp - $startTime->timestamp) / 3600;
            
            if ($hoursRunning > $maxHours) {
                $entry->end();
                $count++;
                Log::info("TimeEntryAutoPauseService: Stopped entry #{$entry->id} - ran for {$hoursRunning} hours (max: {$maxHours})");
            }
        }

        return $count;
    }
}
