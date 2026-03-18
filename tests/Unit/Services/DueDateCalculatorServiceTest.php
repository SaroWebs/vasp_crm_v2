<?php

namespace Tests\Unit\Services;

use Tests\TestCase;
use App\Services\DueDateCalculatorService;
use App\Services\WorkingHoursService;
use DateTime;
use DateTimeZone;

class DueDateCalculatorServiceTest extends TestCase
{
    protected DueDateCalculatorService $dueDateCalculatorService;
    protected WorkingHoursService $workingHoursService;
    protected DateTimeZone $timezone;

    protected function setUp(): void
    {
        parent::setUp();
        $this->workingHoursService = new WorkingHoursService();
        $this->dueDateCalculatorService = new DueDateCalculatorService($this->workingHoursService);
        $this->timezone = new DateTimeZone($this->workingHoursService->getWorkingHoursConfig()['timezone']);
    }

    public function testCalculateDueDate()
    {
        // Test simple 8-hour task
        $start = new DateTime('2026-01-27 09:00:00', $this->timezone); // Wednesday
        $dueDate = $this->dueDateCalculatorService->calculateDueDate($start, 8);
        
        $this->assertEquals('2026-01-27 18:00:00', $dueDate->format('Y-m-d H:i:s'));

        // Test task that spans two days
        $start = new DateTime('2026-01-27 15:00:00', $this->timezone); // Wednesday
        $dueDate = $this->dueDateCalculatorService->calculateDueDate($start, 5);
        
        $this->assertEquals('2026-01-28 10:00:00', $dueDate->format('Y-m-d H:i:s')); // Thursday
    }

    public function testCalculateRemainingHours()
    {
        $start = new DateTime('2026-01-27 09:00:00', $this->timezone); // Wednesday
        $current = new DateTime('2026-01-27 12:00:00', $this->timezone); // Wednesday
        
        $remaining = $this->dueDateCalculatorService->calculateRemainingHours($start, $current, 8);
        
        $this->assertEquals(5, $remaining);
    }

    public function testCalculateProgressPercentage()
    {
        $progress = $this->dueDateCalculatorService->calculateProgressPercentage(8, 3600 * 4);
        
        $this->assertEquals(50, $progress);
    }

    public function testCalculateDaysRequired()
    {
        $daysRequired = $this->dueDateCalculatorService->calculateDaysRequired(9);
        
        $this->assertEquals(2, $daysRequired);
    }
}
