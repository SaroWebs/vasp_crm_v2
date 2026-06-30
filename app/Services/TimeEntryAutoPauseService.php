<?php

namespace App\Services;

use App\Models\TaskTimeEntry;
use DateTime;
use DateTimeZone;
use Illuminate\Support\Facades\Log;

/**
 * Service to manage exceptional task time entry cleanup.
 */
class TimeEntryAutoPauseService
{
    protected WorkingHoursService $workingHoursService;

    protected TimeCalculatorService $timeCalculatorService;

    public function __construct(
        WorkingHoursService $workingHoursService,
        TimeCalculatorService $timeCalculatorService,
        private AttendanceDayPolicyService $dayPolicyService
    ) {
        $this->workingHoursService = $workingHoursService;
        $this->timeCalculatorService = $timeCalculatorService;
    }

    /**
     * Process all active time entries without pausing them for shift boundaries.
     *
     * @return array Array containing counts of processed, paused, and split entries
     */
    public function processActiveTimeEntries(): array
    {
        $activeEntries = TaskTimeEntry::active()->with('user.employee')->get();

        $stats = [
            'processed' => 0,
            'paused' => 0,
            'skipped' => 0,
            'split' => 0,
        ];

        foreach ($activeEntries as $entry) {
            $stats['processed']++;

            $this->processTimeEntry($entry);
            $stats['skipped']++;
        }

        Log::info('TimeEntryAutoPauseService: Processed active time entries', $stats);

        return $stats;
    }

    /**
     * Process a single time entry.
     *
     * @return string Result: 'paused', 'split', 'skipped', or 'active'
     */
    public function processTimeEntry(TaskTimeEntry $entry): string
    {
        return 'skipped';
    }

    /**
     * Pause a time entry with a reason.
     */
    protected function pauseEntry(TaskTimeEntry $entry, string $reason): string
    {
        Log::info("TimeEntryAutoPauseService: Pausing entry #{$entry->id} - {$reason}");

        $entry->end();

        return 'paused';
    }

    /**
     * Split an entry if it spans multiple working days.
     */
    protected function splitEntryIfNeeded(TaskTimeEntry $entry): string
    {
        $entry->loadMissing('user.employee');

        $now = now();
        $startTime = $entry->start_time instanceof DateTime
            ? clone $entry->start_time
            : new DateTime($entry->start_time);
        $employee = $entry->user?->employee;

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
            // Same day, just pause it when this helper is called explicitly.
            return $this->pauseEntry($entry, 'Manually split same-day entry');
        }

        // Entry spans multiple days - split into separate entries
        Log::info("TimeEntryAutoPauseService: Splitting entry #{$entry->id} spanning multiple days");

        $currentDate = clone $startDate;
        $createdEntries = 0;

        while ($currentDate < $endDate) {
            $schedule = $this->dayPolicyService->resolveForEmployeeDate($employee, $currentDate->format('Y-m-d'));

            if (! $schedule['start_time'] || ! $schedule['end_time']) {
                // Day without an assigned shift, skip
                $currentDate->modify('+1 day');

                continue;
            }

            $workingStart = new DateTime($currentDate->format('Y-m-d').' '.$schedule['start_time'], $timezone);
            $workingEnd = new DateTime($currentDate->format('Y-m-d').' '.$schedule['end_time'], $timezone);

            // Calculate segment start and end
            $segmentStart = $currentDate == $startDate ? $startTime : $workingStart;

            // For the last day, use current time as end
            if ($currentDate == $endDate) {
                $segmentEnd = $nowInTz;
            } else {
                $segmentEnd = $workingEnd;
            }

            // Keep only segments that overlap the assigned shift.
            if ($segmentStart >= $workingStart && $segmentEnd <= $workingEnd) {
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
                        'start_time' => $workingStart,
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
     */
    public function canStartTimeEntry(DateTime $startTime): bool
    {
        return true;
    }

    /**
     * Get the recommended end time for an active entry.
     */
    public function getRecommendedEndTime(TaskTimeEntry $entry): ?DateTime
    {
        $startTime = $entry->start_time instanceof DateTime
            ? clone $entry->start_time
            : new DateTime($entry->start_time);

        $timezone = new DateTimeZone($this->workingHoursService->getWorkingHoursConfig()['timezone']);
        $startTime->setTimezone($timezone);

        // Get working hours for the start day
        $entry->loadMissing('user.employee');
        $schedule = $this->dayPolicyService->resolveForEmployeeDate($entry->user?->employee, $startTime->format('Y-m-d'));

        if ($schedule['end_time']) {
            return new DateTime($startTime->format('Y-m-d').' '.$schedule['end_time'], $timezone);
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
     * @param  int  $maxHours  Maximum hours allowed for a single entry
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
