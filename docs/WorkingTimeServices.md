# Working Time Services Documentation

This documentation describes the working time services available in the VASP Ticket system, which are used to calculate working hours, manage holidays, and determine working time intervals.

## Services Overview

### 1. WorkingHoursService

The `WorkingHoursService` is the core service that manages working hours configuration and holiday information. It provides methods to check if a date is a working day, if a specific time is within working hours, and other related functionality.

**File:** `app/Services/WorkingHoursService.php`

### 2. TimeCalculatorService

The `TimeCalculatorService` depends on `WorkingHoursService` and provides methods to calculate working durations between two dates, determine end times based on working durations, and split time periods into working segments.

**File:** `app/Services/TimeCalculatorService.php`

## Configuration Files

Both services rely on JSON configuration files located in the `config` directory:

### working-hours.json

Defines the working hours per day:

```json
{
  "workdays": [
    { "day": "monday", "start": "09:00", "end": "18:00", "break_start": "13:00", "break_end": "14:00" },
    { "day": "tuesday", "start": "09:00", "end": "18:00", "break_start": "13:00", "break_end": "14:00" },
    { "day": "wednesday", "start": "09:00", "end": "18:00", "break_start": "13:00", "break_end": "14:00" },
    { "day": "thursday", "start": "09:00", "end": "18:00", "break_start": "13:00", "break_end": "14:00" },
    { "day": "friday", "start": "09:00", "end": "17:00", "break_start": "13:00", "break_end": "14:00" },
    { "day": "saturday", "start": "09:00", "end": "13:30", "break_start": "", "break_end": "" },
    { "day": "sunday", "start": "", "end": "", "break_start": "", "break_end": "" }
  ],
  "timezone": "Asia/Calcutta"
}
```

### holidays.json

Defines the list of holidays for the year:

```json
{
  "holidays": [
    { "date": "2026-01-26", "name": "Republic Day", "type": "gazetted" },
    { "date": "2026-03-04", "name": "Holi", "type": "gazetted" },
    { "date": "2026-03-21", "name": "Id-ul-Fitr (Eid)", "type": "gazetted" },
    // ... more holidays
  ],
  "year": 2026
}
```

## WorkingHoursService Methods

### `__construct()`

Loads the configuration from `working-hours.json` and `holidays.json`.

### `isWorkingDay(DateTime $date)`

Checks if a given date is a working day. Returns `true` if:
- The date is not a holiday
- The day has working hours configured

```php
$service = new WorkingHoursService();
$date = new DateTime('2026-01-27');
$isWorkingDay = $service->isWorkingDay($date); // true (Wednesday)
```

### `isHoliday(DateTime $date)`

Checks if a given date is a holiday. Returns `true` if the date exists in the holidays configuration.

```php
$service = new WorkingHoursService();
$date = new DateTime('2026-01-26');
$isHoliday = $service->isHoliday($date); // true (Republic Day)
```

### `getWorkingHoursForDate(DateTime $date)`

Returns the working hours configuration for a specific date, including break times. Returns an array with `start`, `end`, `break_start`, and `break_end` as DateTime objects.

```php
$service = new WorkingHoursService();
$date = new DateTime('2026-01-27');
$workingHours = $service->getWorkingHoursForDate($date);

// Output:
// [
//   'start' => DateTime('2026-01-27 09:00:00'),
//   'end' => DateTime('2026-01-27 18:00:00'),
//   'break_start' => DateTime('2026-01-27 13:00:00'),
//   'break_end' => DateTime('2026-01-27 14:00:00')
// ]
```

### `isWorkingTime(DateTime $time)`

Checks if a specific time is within working hours. Returns `true` if:
- The date is a working day
- The time is within working hours (not before start time, after end time, or during break)

```php
$service = new WorkingHoursService();
$time = new DateTime('2026-01-27 10:00:00');
$isWorkingTime = $service->isWorkingTime($time); // true

$time = new DateTime('2026-01-27 13:30:00'); // During break
$isWorkingTime = $service->isWorkingTime($time); // false
```

### `getDailyWorkingHours(DateTime $date)`

Calculates the total working hours for a specific date (excluding break time).

```php
$service = new WorkingHoursService();
$date = new DateTime('2026-01-27'); // Wednesday
$dailyHours = $service->getDailyWorkingHours($date); // 8 hours

$date = new DateTime('2026-01-30'); // Friday (ends at 17:00)
$dailyHours = $service->getDailyWorkingHours($date); // 7 hours
```

### `getHolidaysForYear(int $year)`

Returns all holidays for a specific year.

```php
$service = new WorkingHoursService();
$holidays2026 = $service->getHolidaysForYear(2026);
// Returns array of all holidays in 2026
```

### `getNextWorkingTime(DateTime $currentTime)`

Finds the next available working time from the given time. Returns a DateTime object representing the next working time.

```php
$service = new WorkingHoursService();
$currentTime = new DateTime('2026-01-27 19:00:00'); // After working hours
$nextTime = $service->getNextWorkingTime($currentTime); // DateTime('2026-01-28 09:00:00')
```

### `getWorkingHoursConfig()` and `getHolidaysConfig()`

Returns the raw configuration arrays for working hours and holidays respectively.

## TimeCalculatorService Methods

### `__construct(WorkingHoursService $workingHoursService)`

Injects the WorkingHoursService dependency.

### `calculateWorkingDuration(DateTime $start, DateTime $end)`

Calculates the total working duration between two dates in seconds, excluding non-working time (weekends, holidays, breaks).

```php
$workingHoursService = new WorkingHoursService();
$timeCalculatorService = new TimeCalculatorService($workingHoursService);

$start = new DateTime('2026-01-27 10:00:00');
$end = new DateTime('2026-01-27 12:00:00');
$duration = $timeCalculatorService->calculateWorkingDuration($start, $end); // 7200 seconds (2 hours)

// Across two working days
$start = new DateTime('2026-01-27 17:00:00'); // Wednesday 5 PM
$end = new DateTime('2026-01-28 10:00:00'); // Thursday 10 AM
$duration = $timeCalculatorService->calculateWorkingDuration($start, $end); // 7200 seconds (2 hours)
```

### `calculateEndTime(DateTime $start, int $durationSeconds)`

Calculates the end time after adding a specified working duration (in seconds) to a start time, taking into account working hours and holidays.

```php
$workingHoursService = new WorkingHoursService();
$timeCalculatorService = new TimeCalculatorService($workingHoursService);

$start = new DateTime('2026-01-27 10:00:00');
$endTime = $timeCalculatorService->calculateEndTime($start, 7200); // 2026-01-27 12:00:00

// Across multiple days
$start = new DateTime('2026-01-27 17:00:00');
$endTime = $timeCalculatorService->calculateEndTime($start, 32400); // 9 hours in seconds - 2026-01-29 09:00:00
```

### `splitIntoWorkingSegments(DateTime $start, DateTime $end)`

Splits a time period into working segments per day. Returns an array of segments with `date`, `start`, and `end` properties.

```php
$workingHoursService = new WorkingHoursService();
$timeCalculatorService = new TimeCalculatorService($workingHoursService);

$start = new DateTime('2026-01-27 17:00:00');
$end = new DateTime('2026-01-28 10:00:00');
$segments = $timeCalculatorService->splitIntoWorkingSegments($start, $end);

// Output:
// [
//   [
//     'date' => '2026-01-27',
//     'start' => DateTime('2026-01-27 17:00:00'),
//     'end' => DateTime('2026-01-27 18:00:00')
//   ],
//   [
//     'date' => '2026-01-28',
//     'start' => DateTime('2026-01-28 09:00:00'),
//     'end' => DateTime('2026-01-28 10:00:00')
//   ]
// ]
```

### `getWorkingDayEnd(DateTime $date)`

Returns the working day end time for a specific date.

```php
$workingHoursService = new WorkingHoursService();
$timeCalculatorService = new TimeCalculatorService($workingHoursService);

$date = new DateTime('2026-01-27');
$endTime = $timeCalculatorService->getWorkingDayEnd($date); // 18:00:00
```

## Usage Examples

### Example 1: Calculate SLA Due Date

```php
// Calculate due date for a ticket created on Wednesday at 5 PM with 8 working hours SLA
$workingHoursService = new WorkingHoursService();
$timeCalculatorService = new TimeCalculatorService($workingHoursService);

$createdAt = new DateTime('2026-01-27 17:00:00');
$dueDate = $timeCalculatorService->calculateEndTime($createdAt, 8 * 3600); // 8 hours in seconds

echo $dueDate->format('Y-m-d H:i:s'); // 2026-01-28 16:00:00 (Thursday 4 PM)
```

### Example 2: Check if Current Time is Working Time

```php
$service = new WorkingHoursService();
$currentTime = new DateTime();

if ($service->isWorkingTime($currentTime)) {
    echo "Current time is within working hours";
} else {
    echo "Current time is outside working hours";
    $nextTime = $service->getNextWorkingTime($currentTime);
    echo "Next working time is: " . $nextTime->format('Y-m-d H:i:s');
}
```

### Example 3: Calculate Total Working Hours in a Week

```php
$service = new WorkingHoursService();
$startDate = new DateTime('2026-01-27'); // Wednesday
$endDate = new DateTime('2026-02-02'); // Tuesday (next week)
$totalHours = 0;

$currentDate = clone $startDate;
while ($currentDate <= $endDate) {
    $totalHours += $service->getDailyWorkingHours($currentDate);
    $currentDate->modify('+1 day');
}

echo "Total working hours: " . $totalHours; // 40.5 hours (Mon-Fri: 8+8+8+8+7, Sat: 4.5)
```

## Testing

Comprehensive tests for both services are available in the `tests/Unit/Services` directory:

- `WorkingHoursServiceTest.php`: 9 test methods covering all WorkingHoursService functionality
- `TimeCalculatorServiceTest.php`: 4 test methods covering TimeCalculatorService functionality

To run the tests:

```bash
php artisan test tests/Unit/Services/WorkingHoursServiceTest.php
php artisan test tests/Unit/Services/TimeCalculatorServiceTest.php
```

Both services have 100% test coverage (13 tests, 117 assertions) as of the latest version.
