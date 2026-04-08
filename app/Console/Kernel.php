<?php

namespace App\Console;

use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Foundation\Console\Kernel as ConsoleKernel;

class Kernel extends ConsoleKernel
{
    /**
     * Define the application's command schedule.
     */
    protected function schedule(Schedule $schedule): void
    {
        // Run the pause active time entries command every minute
        // This handles entries that run past working hours
        $schedule->command('time-entries:pause')->everyMinute();

        // Cleanup old activity logs daily at midnight
        $schedule->command('activity-logs:cleanup')->daily();

        // Force stop all entries at end of each workday (7:30 PM)
        // Monday to Friday
        $schedule->command('time-entries:pause --force')
            ->weekdays()
            ->dailyAt('19:30')
            ->withoutOverlapping()
            ->appendOutputTo(storage_path('logs/time-entry-autopause.log'));

        // Force stop all entries on Saturday (2:00 PM)
        $schedule->command('time-entries:pause --force')
            ->saturdays()
            ->dailyAt('14:30')
            ->withoutOverlapping()
            ->appendOutputTo(storage_path('logs/time-entry-autopause.log'));

        // Stop entries exceeding 10 hours (runs every hour as a safety net)
        $schedule->command('time-entries:pause --max-hours=10')->hourly();
    }

    /**
     * Register the commands for the application.
     */
    protected function commands(): void
    {
        $this->load(__DIR__.'/Commands');

        require base_path('routes/console.php');
    }
}
