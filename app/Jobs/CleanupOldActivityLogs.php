<?php

namespace App\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use App\Models\ActivityLog;
use App\Models\Notification;
use Illuminate\Support\Facades\Log;

class CleanupOldActivityLogs implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * The number of days to keep logs.
     *
     * @var int
     */
    protected $daysToKeep;

    /**
     * Create a new job instance.
     *
     * @param  int  $daysToKeep
     * @return void
     */
    public function __construct($daysToKeep = 90)
    {
        $this->daysToKeep = $daysToKeep;
    }

    /**
     * Execute the job.
     *
     * @return void
     */
    public function handle()
    {
        try {
            $cutoffDate = now()->subDays($this->daysToKeep);

            // Delete old activity logs
            $deletedActivityLogs = ActivityLog::where('created_at', '<', $cutoffDate)->delete();

            // Delete old read notifications (keep unread notifications longer)
            $readCutoffDate = now()->subDays($this->daysToKeep * 2);
            $deletedNotifications = Notification::where('read_at', '<', $readCutoffDate)->delete();

            Log::info("CleanupOldActivityLogs completed", [
                'deleted_activity_logs' => $deletedActivityLogs,
                'deleted_notifications' => $deletedNotifications,
                'days_to_keep' => $this->daysToKeep,
                'read_days_to_keep' => $this->daysToKeep * 2
            ]);

        } catch (\Exception $e) {
            Log::error("CleanupOldActivityLogs failed", [
                'error' => $e->getMessage(),
                'days_to_keep' => $this->daysToKeep
            ]);
        }
    }
}