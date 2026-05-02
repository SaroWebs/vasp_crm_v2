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

        // Get role-specific dashboard data from service
        $dashboardData = $this->dashboardService->getDashboardData($user);

        // Always include user permissions
        $dashboardData['userPermissions'] = $user->getAllPermissions()->pluck('slug')->toArray();

        return Inertia::render('dashboard', $dashboardData);
    }
}
