<?php

namespace App\Http\Controllers;

use App\Models\ActivityLog;
use App\Services\ActivityLogService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ActivityLogController extends Controller
{
    protected $activityLogService;

    public function __construct(ActivityLogService $activityLogService)
    {
        $this->activityLogService = $activityLogService;
    }

    /**
     * Display a listing of activity logs.
     */
    public function index(Request $request)
    {
        /** @var \App\Models\User $user */
        $user = Auth::user();
        // Check permissions
        if (!$user->hasPermission('activity_log.read')) {
            return response()->json(['message' => 'Insufficient permissions'], 403);
        }

        $query = ActivityLog::query();

        // Apply filters
        if ($request->has('log_name')) {
            $query->logName($request->log_name);
        }

        if ($request->has('subject_type')) {
            $query->subjectType($request->subject_type);
        }

        if ($request->has('causer_id')) {
            $query->causerId($request->causer_id);
        }

        if ($request->has('causer_type')) {
            $query->causerType($request->causer_type);
        }

        if ($request->has('description')) {
            $query->description($request->description);
        }

        if ($request->has('start_date') && $request->has('end_date')) {
            $query->dateRange($request->start_date, $request->end_date);
        }

        // Apply user filter if not admin
        if (!$user->isSuperAdmin()) {
            $query->forUser($user->id);
        }

        $logs = $query->with(['user', 'subject'])
            ->latest()
            ->paginate($request->get('per_page', 20));

        return response()->json([
            'success' => true,
            'data' => $logs
        ]);
    }

    /**
     * Display the specified activity log.
     */
    public function show(ActivityLog $activityLog)
    {
        /** @var \App\Models\User $user */
        $user = Auth::user();
        
        // Check permissions
        if (!$user->hasPermission('activity_log.read')) {
            return response()->json(['message' => 'Insufficient permissions'], 403);
        }

        // Check if user can view this log (own logs or admin)
        if (!$user->isSuperAdmin() && $activityLog->causer_id !== $user->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        return response()->json([
            'success' => true,
            'data' => $activityLog->load(['user', 'subject'])
        ]);
    }

    /**
     * Get activity logs for a specific model.
     */
    public function getModelActivity(Request $request, $modelType, $modelId)
    {
        /** @var \App\Models\User $user */
        $user = Auth::user();
        
        // Check permissions
        if (!$user->hasPermission('activity_log.read')) {
            return response()->json(['message' => 'Insufficient permissions'], 403);
        }

        $modelClass = $this->getModelClass($modelType);
        if (!$modelClass) {
            return response()->json(['message' => 'Invalid model type'], 400);
        }

        $model = $modelClass::find($modelId);
        if (!$model) {
            return response()->json(['message' => 'Model not found'], 404);
        }

        $logs = $this->activityLogService->getModelActivity($model, $request->get('limit', 50));

        return response()->json([
            'success' => true,
            'data' => $logs
        ]);
    }

    /**
     * Get activity logs for a specific user.
     */
    public function getUserActivity(Request $request, $userId)
    {
        /** @var \App\Models\User $user */
        $user = Auth::user();
        
        // Check permissions
        if (!$user->hasPermission('activity_log.read')) {
            return response()->json(['message' => 'Insufficient permissions'], 403);
        }

        // Users can only view their own logs unless they're admin
        if (!$user->isSuperAdmin() && $user->id !== $userId) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $logs = $this->activityLogService->getUserActivity($userId, $request->get('limit', 50));

        return response()->json([
            'success' => true,
            'data' => $logs
        ]);
    }

    /**
     * Get activity statistics.
     */
    public function getStatistics(Request $request)
    {
        /** @var \App\Models\User $user */
        $user = Auth::user();
        
        // Check permissions
        if (!$user->hasPermission('activity_log.read')) {
            return response()->json(['message' => 'Insufficient permissions'], 403);
        }

        $statistics = $this->activityLogService->getActivityStatistics();

        return response()->json([
            'success' => true,
            'data' => $statistics
        ]);
    }

    /**
     * Get recent activity for the authenticated user.
     */
    public function getRecentActivity(Request $request)
    {
        /** @var \App\Models\User $user */
        $user = Auth::user();
        
        // Check permissions
        if (!$user->hasPermission('activity_log.read')) {
            return response()->json(['message' => 'Insufficient permissions'], 403);
        }

        $logs = $this->activityLogService->getUserActivity($user->id, $request->get('limit', 10));

        return response()->json([
            'success' => true,
            'data' => $logs
        ]);
    }

    /**
     * Clear old activity logs (admin only).
     */
    public function clearOldLogs(Request $request)
    {
        /** @var \App\Models\User $user */
        $user = Auth::user();
        
        // Check permissions
        if (!$user->hasPermission('activity_log.delete')) {
            return response()->json(['message' => 'Insufficient permissions'], 403);
        }

        $validated = $request->validate([
            'days' => 'required|integer|min:1|max:365'
        ]);

        $cutoffDate = now()->subDays($validated['days']);
        
        $deletedCount = ActivityLog::where('created_at', '<', $cutoffDate)->delete();

        return response()->json([
            'success' => true,
            'message' => "Deleted {$deletedCount} old activity logs",
            'deleted_count' => $deletedCount
        ]);
    }

    /**
     * Export activity logs (admin only).
     */
    public function export(Request $request)
    {
        /** @var \App\Models\User $user */
        $user = Auth::user();
        
        // Check permissions
        if (!$user->hasPermission('activity_log.read')) {
            return response()->json(['message' => 'Insufficient permissions'], 403);
        }

        $query = ActivityLog::query();

        // Apply filters
        if ($request->has('log_name')) {
            $query->logName($request->log_name);
        }

        if ($request->has('start_date') && $request->has('end_date')) {
            $query->dateRange($request->start_date, $request->end_date);
        }

        $logs = $query->with(['user', 'subject'])
            ->latest()
            ->get();

        // Convert to CSV or JSON based on request
        if ($request->get('format') === 'csv') {
            return $this->exportToCsv($logs);
        }

        return response()->json([
            'success' => true,
            'data' => $logs
        ]);
    }

    /**
     * Helper method to get model class from type string.
     */
    private function getModelClass($modelType)
    {
        $modelMap = [
            'user' => 'App\Models\User',
            'department' => 'App\Models\Department',
            'task' => 'App\Models\Task',
            'ticket' => 'App\Models\Ticket',
            'comment' => 'App\Models\TaskComment',
        ];

        return $modelMap[$modelType] ?? null;
    }

    /**
     * Export logs to CSV format.
     */
    private function exportToCsv($logs)
    {
        $headers = [
            'Content-type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="activity_logs.csv"',
            'Pragma' => 'no-cache',
            'Cache-Control' => 'must-revalidate, post-check=0, pre-check=0',
            'Expires' => '0'
        ];

        $callback = function() use ($logs) {
            $file = fopen('php://output', 'w');
            fputcsv($file, ['ID', 'Log Name', 'Description', 'Subject Type', 'Subject ID', 'Causer Type', 'Causer ID', 'Created At', 'Properties']);

            foreach ($logs as $log) {
                fputcsv($file, [
                    $log->id,
                    $log->log_name,
                    $log->description,
                    $log->subject_type,
                    $log->subject_id,
                    $log->causer_type,
                    $log->causer_id,
                    $log->created_at,
                    json_encode($log->properties)
                ]);
            }

            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }
}
