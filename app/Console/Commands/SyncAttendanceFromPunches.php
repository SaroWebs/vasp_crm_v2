<?php

namespace App\Console\Commands;

use App\Models\Attendance;
use App\Models\Punch;
use App\Services\AttendanceService;
use Carbon\Carbon;
use Illuminate\Console\Command;

class SyncAttendanceFromPunches extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'attendance:sync-from-punches {--clear : Clear attendances table before syncing}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Sync all attendance records from punches data';

    /**
     * Execute the console command.
     */
    public function handle(AttendanceService $attendanceService): int
    {
        if ($this->option('clear')) {
            $this->info('Clearing attendances table...');
            Attendance::truncate();
            $this->line('<info>✓</info> Attendances table cleared.');
        }

        $this->info('Fetching unique employee/date combinations from punches...');

        $punchGroups = Punch::selectRaw('EmployeeId, DATE(PunchTime) as punch_date')
            ->distinct()
            ->orderBy('EmployeeId')
            ->orderBy('punch_date')
            ->get();

        $total = $punchGroups->count();
        $this->line("Found <info>{$total}</info> unique employee/date combinations.");

        $bar = $this->output->createProgressBar($total);
        $bar->start();

        foreach ($punchGroups as $group) {
            try {
                $attendanceService->syncAttendanceFromPunches(
                    (string) $group->EmployeeId,
                    Carbon::parse($group->punch_date),
                    'office'
                );
                $bar->advance();
            } catch (\Exception $e) {
                $bar->finish();
                $this->error("Error syncing employee {$group->EmployeeId} for date {$group->punch_date}: {$e->getMessage()}");
                $bar = $this->output->createProgressBar($total);
                $bar->start();
            }
        }

        $bar->finish();
        $this->line('');
        $this->info('✓ Attendance sync completed successfully!');

        return self::SUCCESS;
    }
}
