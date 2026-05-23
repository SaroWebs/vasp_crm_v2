<?php

namespace App\Console\Commands;

use App\Models\Attendance;
use Illuminate\Console\Command;

class BackfillAttendanceShiftMetrics extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'attendance:backfill-shift-metrics {--dry-run : Preview changes without writing}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Backfill shift, late, and early-out metrics for existing attendance rows';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $count = Attendance::query()->count();
        $this->info("No attendance table update required. Shift metrics are now computed from shift assignment tables at runtime. Attendance rows scanned: {$count}.");

        return self::SUCCESS;
    }
}
