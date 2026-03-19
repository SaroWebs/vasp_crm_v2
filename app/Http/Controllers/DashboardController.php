<?php

namespace App\Http\Controllers;

use App\Models\Department;
use App\Models\User;
use App\Services\DashboardService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function __construct(
        protected DashboardService $dashboardService
    ) {}

    /**
     * Display the dashboard based on user role.
     */
    public function index(Request $request)
    {
        $user = User::find(Auth::user()->id);
        
        // Get role-specific dashboard data
        $dashboardData = $this->dashboardService->getDashboardData($user);
        
        // Always include user permissions
        $dashboardData['userPermissions'] = $user->getAllPermissions()->pluck('slug');
        
        return Inertia::render('dashboard', $dashboardData);
    }

    /**
     * Get department performance metrics.
     */
    public function getDepartmentMetrics(Request $request)
    {
        $user = User::find(Auth::user()->id);

        if (!$user->hasPermission('department.read')) {
            abort(403, 'Insufficient permissions');
        }

        $departments = Department::active()
            ->with([
                'users.roles',
                'assignedTasks' => function ($query) {
                    $query->where('status', '!=', 'completed');
                }
            ])
            ->get()
            ->map(function ($department) {
                $completedTasks = $department->assignedTasks()
                    ->where('status', 'completed')
                    ->whereMonth('updated_at', now()->month)
                    ->get();

                $avgCompletionTime = $completedTasks->count() > 0
                    ? $completedTasks->avg(function ($task) {
                        return $task->updated_at->diffInHours($task->created_at);
                    })
                    : 0;

                return [
                    'id' => $department->id,
                    'name' => $department->name,
                    'total_users' => $department->users->count(),
                    'active_users' => $department->users->whereHas('roles')->count(),
                    'pending_tasks' => $department->assignedTasks->count(),
                    'completed_this_month' => $completedTasks->count(),
                    'avg_completion_time' => round($avgCompletionTime, 2),
                    'efficiency_score' => $this->calculateEfficiencyScore($department),
                ];
            });

        return response()->json(['departments' => $departments]);
    }

    /**
     * Calculate department efficiency score.
     */
    private function calculateEfficiencyScore($department)
    {
        $totalTasks = $department->assignedTasks()->count();
        $completedTasks = $department->assignedTasks()
            ->where('status', 'completed')
            ->whereMonth('updated_at', now()->month)
            ->count();

        if ($totalTasks === 0)
            return 0;

        $completionRate = ($completedTasks / $totalTasks) * 100;

        // Bonus for low average completion time (assuming < 24 hours is good)
        $avgTime = $this->calculateAverageCompletionTime($department);
        $timeBonus = $avgTime > 0 && $avgTime < 24 ? 20 : 0;

        return min(100, $completionRate + $timeBonus);
    }

    /**
     * Calculate average task completion time for department.
     */
    private function calculateAverageCompletionTime($department)
    {
        $completedTasks = $department->assignedTasks()
            ->where('status', 'completed')
            ->whereNotNull('updated_at')
            ->get();

        if ($completedTasks->isEmpty()) {
            return 0;
        }

        return $completedTasks->avg(function ($task) {
            return $task->updated_at->diffInHours($task->created_at);
        });
    }
}
