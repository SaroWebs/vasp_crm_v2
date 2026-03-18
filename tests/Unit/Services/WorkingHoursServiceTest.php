<?php

namespace Tests\Unit\Services;

use Tests\TestCase;
use App\Services\WorkingHoursService;
use DateTime;
use DateTimeZone;

class WorkingHoursServiceTest extends TestCase
{
    protected WorkingHoursService $workingHoursService;

    protected function setUp(): void
    {
        parent::setUp();
        $this->workingHoursService = new WorkingHoursService();
    }

    public function testLoadWorkingHoursConfig()
    {
        $config = $this->workingHoursService->getWorkingHoursConfig();
        
        $this->assertIsArray($config);
        $this->assertArrayHasKey('workdays', $config);
        $this->assertArrayHasKey('timezone', $config);
        $this->assertEquals('Asia/Calcutta', $config['timezone']);
    }

    public function testLoadHolidaysConfig()
    {
        $config = $this->workingHoursService->getHolidaysConfig();
        
        $this->assertIsArray($config);
        $this->assertArrayHasKey('holidays', $config);
        $this->assertArrayHasKey('year', $config);
    }

    public function testIsWorkingDay()
    {
        // Test a Wednesday (should be working day)
        $wednesday = new DateTime('2026-01-27');
        $this->assertTrue($this->workingHoursService->isWorkingDay($wednesday));

        // Test a Saturday (should be working day - 9:00 AM - 1:30 PM)
        $saturday = new DateTime('2026-01-24');
        $this->assertTrue($this->workingHoursService->isWorkingDay($saturday));

        // Test a Sunday (should not be working day)
        $sunday = new DateTime('2026-01-25');
        $this->assertFalse($this->workingHoursService->isWorkingDay($sunday));
    }

    public function testIsHoliday()
    {
        // Test Republic Day (should be holiday)
        $republicDay = new DateTime('2026-01-26');
        $this->assertTrue($this->workingHoursService->isHoliday($republicDay));

        // Test a normal working day (should not be holiday)
        $normalDay = new DateTime('2026-01-27'); // Wednesday
        $this->assertFalse($this->workingHoursService->isHoliday($normalDay));
    }

    public function testGetWorkingHoursForDate()
    {
        $date = new DateTime('2026-01-27'); // Wednesday
        $workingHours = $this->workingHoursService->getWorkingHoursForDate($date);
        
        $this->assertIsArray($workingHours);
        $this->assertInstanceOf(DateTime::class, $workingHours['start']);
        $this->assertInstanceOf(DateTime::class, $workingHours['end']);
        $this->assertInstanceOf(DateTime::class, $workingHours['break_start']);
        $this->assertInstanceOf(DateTime::class, $workingHours['break_end']);
        
        $this->assertEquals('09:00:00', $workingHours['start']->format('H:i:s'));
        $this->assertEquals('18:00:00', $workingHours['end']->format('H:i:s'));
        $this->assertEquals('13:00:00', $workingHours['break_start']->format('H:i:s'));
        $this->assertEquals('14:00:00', $workingHours['break_end']->format('H:i:s'));
    }

    public function testIsWorkingTime()
    {
        // Test during working hours
        $workingTime = new DateTime('2026-01-27 10:00:00'); // Wednesday
        $this->assertTrue($this->workingHoursService->isWorkingTime($workingTime));

        // Test before working hours
        $beforeWorkingTime = new DateTime('2026-01-27 08:00:00'); // Wednesday
        $this->assertFalse($this->workingHoursService->isWorkingTime($beforeWorkingTime));

        // Test after working hours
        $afterWorkingTime = new DateTime('2026-01-27 19:00:00'); // Wednesday
        $this->assertFalse($this->workingHoursService->isWorkingTime($afterWorkingTime));

        // Test during break time
        $breakTime = new DateTime('2026-01-27 13:30:00'); // Wednesday
        $this->assertFalse($this->workingHoursService->isWorkingTime($breakTime));

        // Test on holiday
        $holidayTime = new DateTime('2026-01-26 10:00:00'); // Republic Day (holiday)
        $this->assertFalse($this->workingHoursService->isWorkingTime($holidayTime));
    }

    public function testGetDailyWorkingHours()
    {
        // Test a normal working day
        $workingDay = new DateTime('2026-01-27'); // Wednesday
        $dailyHours = $this->workingHoursService->getDailyWorkingHours($workingDay);
        $this->assertEquals(8, $dailyHours); // 9-6 with 1 hour break

        // Test Friday (ends at 5 PM)
        $friday = new DateTime('2026-01-30'); // This is a valid Friday that's not a holiday
        $dailyHours = $this->workingHoursService->getDailyWorkingHours($friday);
        $this->assertEquals(7, $dailyHours); // 9-5 with 1 hour break

        // Test Saturday (ends at 1:30 PM, no break)
        $saturday = new DateTime('2026-01-24');
        $dailyHours = $this->workingHoursService->getDailyWorkingHours($saturday);
        $this->assertEquals(4.5, $dailyHours); // 9-1:30 with no break

        // Test a holiday
        $holiday = new DateTime('2026-01-26'); // Republic Day (holiday)
        $dailyHours = $this->workingHoursService->getDailyWorkingHours($holiday);
        $this->assertEquals(0, $dailyHours);
    }

    public function testGetHolidaysForYear()
    {
        // Test getting holidays for 2026 (configured year)
        $holidays2026 = $this->workingHoursService->getHolidaysForYear(2026);
        $this->assertIsArray($holidays2026);
        $this->assertNotEmpty($holidays2026);
        
        // Verify all holidays are for 2026
        foreach ($holidays2026 as $holiday) {
            $this->assertArrayHasKey('date', $holiday);
            $this->assertArrayHasKey('name', $holiday);
            $this->assertArrayHasKey('type', $holiday);
            $this->assertStringStartsWith('2026-', $holiday['date']);
        }

        // Test getting holidays for a non-configured year (should return empty array)
        $holidays2025 = $this->workingHoursService->getHolidaysForYear(2025);
        $this->assertIsArray($holidays2025);
        $this->assertEmpty($holidays2025);
    }

    public function testGetNextWorkingTime()
    {
        $timezone = new DateTimeZone('Asia/Calcutta');
        
        // Test from within working hours
        $currentTime = new DateTime('2026-01-27 10:00:00', $timezone); // Wednesday 10:00 AM
        $nextTime = $this->workingHoursService->getNextWorkingTime($currentTime);
        $this->assertInstanceOf(DateTime::class, $nextTime);
        $this->assertEquals('2026-01-27 10:01:00', $nextTime->format('Y-m-d H:i:s'));

        // Test from before working hours
        $currentTime = new DateTime('2026-01-27 08:00:00', $timezone); // Wednesday 8:00 AM
        $nextTime = $this->workingHoursService->getNextWorkingTime($currentTime);
        $this->assertEquals('2026-01-27 09:00:00', $nextTime->format('Y-m-d H:i:s'));

        // Test from after working hours
        $currentTime = new DateTime('2026-01-27 19:00:00', $timezone); // Wednesday 7:00 PM
        $nextTime = $this->workingHoursService->getNextWorkingTime($currentTime);
        $this->assertEquals('2026-01-28 09:00:00', $nextTime->format('Y-m-d H:i:s'));

        // Test from break time
        $currentTime = new DateTime('2026-01-27 13:30:00', $timezone); // Wednesday 1:30 PM (break)
        $nextTime = $this->workingHoursService->getNextWorkingTime($currentTime);
        $this->assertEquals('2026-01-27 14:01:00', $nextTime->format('Y-m-d H:i:s'));

        // Test from holiday
        $currentTime = new DateTime('2026-01-26 10:00:00', $timezone); // Republic Day (holiday)
        $nextTime = $this->workingHoursService->getNextWorkingTime($currentTime);
        $this->assertEquals('2026-01-27 09:00:00', $nextTime->format('Y-m-d H:i:s'));
    }
}
