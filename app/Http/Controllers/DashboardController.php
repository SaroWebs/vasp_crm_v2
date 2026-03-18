<?php

namespace App\Http\Controllers;

use App\Models\Department;
use App\Models\Ticket;
use App\Models\Task;
use App\Models\User;
use App\Models\Client;
use App\Models\Product;
use App\Models\Notification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function __construct()
    {
        // $this->middleware(['auth', 'admin']);
    }

    /**
     * Display the admin dashboard.
     */
    public function index(Request $request)
    {
        $user = User::find(Auth::user()->id);

        // Get dashboard statistics
        $stats = $this->getDashboardStats();

        // Get recent activities
        $recentTickets = Ticket::with(['client', 'organizationUser'])
            ->latest('created_at')
            ->limit(5)
            ->get();

        $recentTasks = Task::with(['ticket.client', 'assignedDepartment', 'assignedUsers'])
            ->latest('created_at')
            ->limit(5)
            ->get();

        // Get department performance
        $departmentStats = Department::active()
            ->withCount([
                'users',
                'assignedTasks as pending_tasks_count' => function ($query) {
                    $query->where('status', '!=', 'completed');
                }
            ])
            ->get()
            ->map(function ($department) {
                return [
                    'id' => $department->id,
                    'name' => $department->name,
                    'user_count' => $department->users_count,
                    'pending_tasks' => $department->pending_tasks_count,
                    'completed_this_month' => $department->assignedTasks()
                        ->whereMonth('updated_at', now()->month)
                        ->where('status', 'completed')
                        ->count(),
                ];
            });

        // Get unread notifications count
        $unreadNotifications = Notification::where('user_id', $user->id)
            ->where('status', 'unread')
            ->count();

        // Get ticket status distribution
        $ticketStats = [
            'open' => Ticket::where('status', 'open')->count(),
            'approved' => Ticket::where('status', 'approved')->count(),
            'in_progress' => Ticket::where('status', 'in-progress')->count(),
            'closed' => Ticket::where('status', 'closed')->count(),
            'cancelled' => Ticket::where('status', 'cancelled')->count(),
        ];

        // Get task status distribution
        $taskStats = [
            'pending' => Task::where('status', 'pending')->count(),
            'in_progress' => Task::where('status', 'in-progress')->count(),
            'waiting' => Task::where('status', 'waiting')->count(),
            'completed' => Task::where('status', 'completed')->count(),
        ];

        return Inertia::render('dashboard', [
            'stats' => $stats,
            'recentTickets' => $recentTickets,
            'recentTasks' => $recentTasks,
            'departmentStats' => $departmentStats,
            'unreadNotifications' => $unreadNotifications,
            'ticketStats' => $ticketStats,
            'taskStats' => $taskStats,
            'userPermissions' => $user->getAllPermissions()->pluck('slug')
        ]);
    }

    /**
     * Get comprehensive dashboard statistics.
     */
    private function getDashboardStats()
    {
        return [
            'total_departments' => Department::active()->count(),
            'total_users' => User::count(),
            'total_clients' => Client::where('status', 'active')->count(),
            'total_products' => Product::where('status', 'active')->count(),
            'total_tickets' => Ticket::count(),
            'total_tasks' => Task::count(),
            'open_tickets' => Ticket::where('status', 'open')->count(),
            'pending_tasks' => Task::where('status', 'pending')->count(),
            'completed_tasks_this_month' => Task::where('status', 'completed')
                ->whereMonth('updated_at', now()->month)
                ->count(),
            'active_users_today' => User::where('last_login_at', '>=', today())->count(),
            'tickets_created_today' => Ticket::whereDate('created_at', today())->count(),
            'tasks_completed_today' => Task::where('status', 'completed')
                ->whereDate('updated_at', today())
                ->count(),
        ];
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
