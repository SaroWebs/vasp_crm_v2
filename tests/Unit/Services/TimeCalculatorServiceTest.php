<?php

namespace Tests\Unit\Services;

use Tests\TestCase;
use App\Services\TimeCalculatorService;
use App\Services\WorkingHoursService;
use DateTime;
use DateTimeZone;

class TimeCalculatorServiceTest extends TestCase
{
    protected TimeCalculatorService $timeCalculatorService;
    protected WorkingHoursService $workingHoursService;
    protected DateTimeZone $timezone;

    protected function setUp(): void
    {
        parent::setUp();
        $this->workingHoursService = new WorkingHoursService();
        $this->timeCalculatorService = new TimeCalculatorService($this->workingHoursService);
        $this->timezone = new DateTimeZone($this->workingHoursService->getWorkingHoursConfig()['timezone']);
    }

    public function testCalculateWorkingDuration()
    {
        // Test within same working day
        $start = new DateTime('2026-01-27 10:00:00', $this->timezone); // Wednesday
        $end = new DateTime('2026-01-27 12:00:00', $this->timezone); // Wednesday
        $duration = $this->timeCalculatorService->calculateWorkingDuration($start, $end);
        
        $this->assertEquals(7200, $duration); // 2 hours in seconds

        // Test across two working days
        $start = new DateTime('2026-01-27 17:00:00', $this->timezone); // Wednesday
        $end = new DateTime('2026-01-28 10:00:00', $this->timezone); // Thursday
        $duration = $this->timeCalculatorService->calculateWorkingDuration($start, $end);
        
        $expected = (1 * 3600) + (1 * 3600); // 1 hour on Wednesday + 1 hour on Thursday
        $this->assertEquals($expected, $duration);

        // Test including a break
        $start = new DateTime('2026-01-27 12:30:00', $this->timezone); // Wednesday
        $end = new DateTime('2026-01-27 14:30:00', $this->timezone); // Wednesday
        $duration = $this->timeCalculatorService->calculateWorkingDuration($start, $end);
        
        $expected = (30 * 60) + (30 * 60); // 30 min before break + 30 min after break
        $this->assertEquals($expected, $duration);
    }

    public function testCalculateEndTime()
    {
        // Test within same day
        $start = new DateTime('2026-01-27 10:00:00', $this->timezone); // Wednesday
        $endTime = $this->timeCalculatorService->calculateEndTime($start, 7200); // 2 hours
        
        $this->assertEquals('2026-01-27 12:00:00', $endTime->format('Y-m-d H:i:s'));

        // Test across multiple days
        $start = new DateTime('2026-01-27 17:00:00', $this->timezone); // Wednesday
        $endTime = $this->timeCalculatorService->calculateEndTime($start, 3600 * 9); // 9 hours
        
        $this->assertEquals('2026-01-29 09:01:00', $endTime->format('Y-m-d H:i:s')); // Friday
    }

    public function testSplitIntoWorkingSegments()
    {
        $start = new DateTime('2026-01-27 17:00:00', $this->timezone); // Wednesday
        $end = new DateTime('2026-01-28 10:00:00', $this->timezone); // Thursday
        
        $segments = $this->timeCalculatorService->splitIntoWorkingSegments($start, $end);
        
        $this->assertCount(2, $segments);
        $this->assertEquals('2026-01-27', $segments[0]['date']);
        $this->assertEquals('2026-01-28', $segments[1]['date']);
    }

    public function testWorkingDayEnd()
    {
        $date = new DateTime('2026-01-27', $this->timezone); // Wednesday
        $endTime = $this->timeCalculatorService->getWorkingDayEnd($date);
        
        $this->assertEquals('18:00:00', $endTime->format('H:i:s'));
    }
}
