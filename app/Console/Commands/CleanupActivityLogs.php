<?php

namespace App\Console\Commands;

use App\Jobs\CleanupOldActivityLogs;
use Illuminate\Console\Command;

class CleanupActivityLogs extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'activity-logs:cleanup {--days=90 : Number of days to keep logs}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Clean up old activity logs and notifications';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $days = $this->option('days');

        $this->info("Starting cleanup of activity logs older than {$days} days...");

        // Dispatch the cleanup job
        CleanupOldActivityLogs::dispatch($days);

        $this->info('Cleanup job dispatched successfully.');
    }
}
