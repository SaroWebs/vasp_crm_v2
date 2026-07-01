<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Services\DashboardService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class AdminDashboardController extends Controller
{
    protected DashboardService $dashboardService;

    public function __construct(DashboardService $dashboardService)
    {
        $this->dashboardService = $dashboardService;
    }

    /**
     * Display the dashboard based on user role.
     */
    public function index(Request $request)
    {
        $user = User::with(['roles', 'employee'])->find(Auth::user()->id);
        $dashboardType = 'employee';
        if ($user->hasRole(['super-admin', 'admin', 'manager'])) {
            $dashboardType = 'admin';
        }

        $dashboardData = [
            'dashboard_type' => $dashboardType,
            'userPermissions' => $user->getAllPermissions()->pluck('slug')->toArray(),
        ];

        return Inertia::render('dashboard', $dashboardData);
    }

    public function getStats(Request $request)
    {
        $user = User::with(['roles', 'employee'])->find(Auth::user()->id);

        if ($user->hasRole(['super-admin', 'admin', 'manager'])) {
            $stats = $this->dashboardService->getAdminStats();
        } elseif ($user->hasRole(['manager', 'team-lead', 'hr'])) {
            $stats = $this->dashboardService->getManagerStats($user, $this->dashboardService->getUserDepartmentIds($user));
        } else {
            $stats = $this->dashboardService->getEmployeeStats($user);
        }

        return response()->json(['stats' => $stats]);
    }

    public function getTickets(Request $request)
    {
        return response()->json(['tickets' => $this->dashboardService->getRecentTickets()]);
    }

    public function getTasks(Request $request)
    {
        $user = User::with(['roles', 'employee'])->find(Auth::user()->id);

        if ($user->hasRole(['super-admin', 'admin', 'manager'])) {
            $tasks = $this->dashboardService->getRecentTasks();
        } elseif ($user->hasRole(['manager', 'team-lead', 'hr'])) {
            $tasks = $this->dashboardService->getDepartmentTasks($this->dashboardService->getUserDepartmentIds($user));
        } else {
            $tasks = $this->dashboardService->getMyTasks($user);
        }

        return response()
            ->json(['tasks' => $tasks])
            ->header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
            ->header('Pragma', 'no-cache');
    }

    public function getActivities(Request $request)
    {
        $user = User::with(['roles', 'employee'])->find(Auth::user()->id);

        return response()->json([
            'activities' => $this->dashboardService->getRecentActivities($user),
        ]);
    }

    public function getChartData(Request $request)
    {
        $user = User::with(['roles', 'employee'])->find(Auth::user()->id);
        $range = $request->query('range', 'weekly');
        $offset = (int) $request->query('offset', 0);

        return response()->json([
            'chartData' => $this->dashboardService->getPaginatedChartData($user, $range, $offset),
        ]);
    }

    public function getRecentReports(Request $request)
    {
        $user = User::with(['roles', 'employee'])->find(Auth::user()->id);

        return response()->json([
            'reports' => $this->dashboardService->getRecentReports($user),
        ]);
    }
}
