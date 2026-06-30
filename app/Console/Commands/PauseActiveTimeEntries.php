<?php

namespace App\Console\Commands;

use App\Services\TimeEntryAutoPauseService;
use Illuminate\Console\Command;

class PauseActiveTimeEntries extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'time-entries:pause 
                            {--force : Force stop all active entries regardless of working hours}
                            {--max-hours= : Maximum hours an entry can run before being stopped}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Manages active time entries for explicit force-stop and max-duration safeguards';

    /**
     * Execute the console command.
     */
    public function handle(TimeEntryAutoPauseService $autoPauseService)
    {
        // Check for --force option
        if ($this->option('force')) {
            $count = $autoPauseService->forceStopAllActiveEntries();
            $this->info("Forcefully stopped {$count} active time entries.");

            return Command::SUCCESS;
        }

        // Check for --max-hours option
        $maxHours = $this->option('max-hours');
        if ($maxHours !== null) {
            $maxHours = (int) $maxHours;
            if ($maxHours <= 0) {
                $this->error('Max hours must be a positive integer');

                return Command::FAILURE;
            }
            $count = $autoPauseService->stopEntriesExceedingMaxDuration($maxHours);
            $this->info("Stopped {$count} entries exceeding {$maxHours} hours.");

            return Command::SUCCESS;
        }

        $stats = $autoPauseService->processActiveTimeEntries();

        $this->info("Processed {$stats['processed']} active time entries:");
        $this->info("  - Paused: {$stats['paused']}");
        $this->info("  - Skipped (still active): {$stats['skipped']}");

        return Command::SUCCESS;
    }
}
