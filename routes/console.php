<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Console\Scheduling\Schedule;

// Display an inspiring quote
Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Configure scheduler
Artisan::command('schedule:list', function () {
    $schedule = app(Schedule::class);
    
    // Run the pause active time entries command every minute
    $schedule->command('time-entries:pause')->everyMinute();
    
    // Cleanup old activity logs daily at midnight
    $schedule->command('activity-logs:cleanup')->daily();
    
    $events = $schedule->events();
    $this->info("Number of scheduled tasks: " . count($events));
    
    foreach ($events as $event) {
        $this->info("Task command: " . $event->command);
        $this->info("Task expression: " . $event->expression);
        $this->info("---");
    }
})->purpose('List scheduled tasks');
