# Working Hours Implementation

## Overview

This document describes the implementation of working hours functionality in the VASP Ticket system. The implementation ensures that task actions are only available during working hours and that time entries are automatically paused when a working period ends.

## Features

### 1. Task Actions Frozen Outside Working Hours

- **Purpose**: Prevent users from performing task actions outside of configured working hours
- **Implementation**:
  - Added working time check to all task time tracking methods in both `TimeTrackingController` and `TaskController`
  - Added working time check to the `TaskTimeEntry::start()` method
  - Returns a 403 Forbidden response with appropriate message when trying to perform actions outside working hours

### 2. Automatic Time Entry Pausing

- **Purpose**: Automatically pause active time entries when the working period ends
- **Implementation**:
  - Added `getCurrentWorkingPeriodEnd()` method to `WorkingHoursService`
  - Created `PauseActiveTimeEntries` Artisan command
  - Added scheduler to run the command every minute
  - The command checks all active time entries and pauses those that have passed their working period end time

## Files Modified

### Controllers
- `app/Http/Controllers/TimeTrackingController.php` - Added working time check to startTask and resumeTask methods
- `app/Http/Controllers/TaskController.php` - Added working time check to startTask and resumeTask methods

### Models
- `app/Models/TaskTimeEntry.php` - Added working time check to start() method

### Services
- `app/Services/WorkingHoursService.php` - Added getCurrentWorkingPeriodEnd() method

### Console
- `app/Console/Commands/PauseActiveTimeEntries.php` - New Artisan command
- `app/Console/Kernel.php` - Added scheduler configuration

### Middleware
- `app/Http/Middleware/CheckWorkingHours.php` - New middleware (not used directly in current implementation)

## Usage

### Automatic Pausing

The system automatically checks for active time entries that need to be paused every minute. This is configured in the scheduler:

```php
// app/Console/Kernel.php
protected function schedule(Schedule $schedule): void
{
    $schedule->command('time-entries:pause')->everyMinute();
}
```

### Manual Execution

You can also manually run the command to pause active time entries:

```bash
php artisan time-entries:pause
```

## Configuration

### Working Hours

Working hours are configured in `config/working-hours.json`:

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

### Holidays

Holidays are configured in `config/holidays.json`:

```json
{
  "year": 2024,
  "holidays": [
    { "date": "2024-01-01", "name": "New Year's Day" },
    { "date": "2024-01-26", "name": "Republic Day" },
    { "date": "2024-10-02", "name": "Gandhi Jayanti" }
  ]
}
```

## Testing

The implementation has been tested to ensure:
- Task actions are rejected outside working hours
- Time entries are automatically paused when working period ends
- The command runs correctly and handles edge cases

## Notes

- The middleware `CheckWorkingHours` is available but not currently used. It can be applied to routes if needed.
- The scheduler must be running for automatic pausing to work. Use `php artisan schedule:work` to run the scheduler locally.
- Time zone configuration is important. Make sure it's set correctly in `config/working-hours.json`.
