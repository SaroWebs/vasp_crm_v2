<?php

namespace App\Http\Controllers;

use App\Models\Client;
use App\Models\Department;
use App\Models\Notification;
use App\Models\Product;
use App\Models\Task;
use App\Models\Ticket;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class AdminDashboardController extends Controller
{
    // Web routes handled by middleware defined in routes

    /**
     * Display the admin dashboard (Web UI).
     */
    public function index(Request $request)
    {
        $user = User::find(Auth::user()->id);

        // Get dashboard statistics
        $stats = $this->getAdminStats();

        // Get recent activities
        $recentTickets = Ticket::with(['client', 'organizationUser'])
            ->latest('created_at')
            ->limit(5)
            ->get();

        $recentTasks = Task::with(['ticket.client', 'assignedDepartment'])
            ->latest('created_at')
            ->limit(5)
            ->get();

        // Get recent clients
        $recentClients = Client::latest('created_at')
            ->limit(5)
            ->get();

        // Get system health metrics
        $systemMetrics = $this->getSystemMetrics();

        // Get employee progress data
        $employeeProgressController = new EmployeeProgressController;
        $employeeProgressResponse = $employeeProgressController->getEmployeeProgressData($request);
        $employeeProgressData = $employeeProgressResponse->getData();

        return Inertia::render('dashboard', [
            'stats' => $stats,
            'recentTickets' => $recentTickets,
            'recentTasks' => $recentTasks,
            'recentClients' => $recentClients,
            'systemMetrics' => $systemMetrics,
            'employeeProgress' => $employeeProgressData,
            'employees' => User::query()
                ->whereHas('employee')
                ->select('id', 'name')
                ->orderBy('name')
                ->get(),
            'userPermissions' => $user->getAllPermissions()->pluck('slug')->toArray(),
            'unreadNotifications' => Notification::whereNull('read_at')->count(),
            'ticketStats' => [
                'open' => Ticket::where('status', 'open')->count(),
                'approved' => Ticket::where('status', 'approved')->count(),
                'in_progress' => Ticket::where('status', 'in-progress')->count(),
                'closed' => Ticket::where('status', 'closed')->count(),
                'cancelled' => Ticket::where('status', 'cancelled')->count(),
            ],
            'taskStats' => [
                'pending' => Task::where('state', 'Draft')->count(),
                'in_progress' => Task::where('state', 'InProgress')->count(),
                'waiting' => Task::where('state', 'InReview')->count(),
                'completed' => Task::where('state', 'Done')->count(),
            ],
        ]);
    }

    /**
     * Get admin dashboard data (API).
     */
    public function getDashboardData(Request $request)
    {
        $stats = $this->getAdminStats();
        $recentTickets = Ticket::with(['client', 'organizationUser'])
            ->latest('created_at')
            ->limit(10)
            ->get();

        $recentTasks = Task::with(['ticket.client', 'assignedDepartment'])
            ->latest('created_at')
            ->limit(10)
            ->get();

        $recentClients = Client::latest('created_at')
            ->limit(5)
            ->get();

        $systemMetrics = $this->getSystemMetrics();

        return response()->json([
            'stats' => $stats,
            'recentTickets' => $recentTickets,
            'recentTasks' => $recentTasks,
            'recentClients' => $recentClients,
            'systemMetrics' => $systemMetrics,
        ]);
    }

    /**
     * Get comprehensive admin statistics.
     */
    private function getAdminStats()
    {
        return [
            'total_departments' => Department::active()->count(),
            'total_users' => User::count(),
            'total_clients' => Client::where('status', 'active')->count(),
            'total_products' => Product::where('status', 'active')->count(),
            'total_client_instances' => 0,
            'total_tickets' => Ticket::count(),
            'total_tasks' => Task::count(),
            'open_tickets' => Ticket::where('status', 'open')->count(),
            'pending_tasks' => Task::where('state', 'pending')->count(),
            'completed_tasks_this_month' => Task::where('state', 'completed')
                ->whereMonth('updated_at', now()->month)
                ->count(),
            'active_users_today' => User::where('last_login_at', '>=', today())->count(),
            'tickets_created_today' => Ticket::whereDate('created_at', today())->count(),
            'tasks_completed_today' => Task::where('state', 'completed')
                ->whereDate('updated_at', today())
                ->count(),
            'new_clients_this_month' => Client::whereMonth('created_at', now()->month)->count(),
            'active_client_instances' => 0,
        ];
    }

    /**
     * Get system health metrics.
     */
    private function getSystemMetrics()
    {
        return [
            'ticket_resolution_rate' => $this->calculateTicketResolutionRate(),
            'task_completion_rate' => $this->calculateTaskCompletionRate(),
            'client_satisfaction_score' => $this->calculateClientSatisfactionScore(),
            'average_ticket_resolution_time' => $this->getAverageTicketResolutionTime(),
            'system_uptime' => '99.9%', // This would come from monitoring system
            'active_users_this_week' => User::where('last_login_at', '>=', now()->startOfWeek())->count(),
        ];
    }

    /**
     * Calculate ticket resolution rate.
     */
    private function calculateTicketResolutionRate()
    {
        $totalTickets = Ticket::count();
        if ($totalTickets === 0) {
            return 0;
        }

        $resolvedTickets = Ticket::whereIn('status', ['resolved', 'closed'])->count();

        return round(($resolvedTickets / $totalTickets) * 100, 2);
    }

    /**
     * Calculate task completion rate.
     */
    private function calculateTaskCompletionRate()
    {
        $totalTasks = Task::count();
        if ($totalTasks === 0) {
            return 0;
        }

        $completedTasks = Task::where('state', 'completed')->count();

        return round(($completedTasks / $totalTasks) * 100, 2);
    }

    /**
     * Calculate client satisfaction score (based on resolved tickets).
     */
    private function calculateClientSatisfactionScore()
    {
        $resolvedTickets = Ticket::whereIn('status', ['resolved', 'closed'])->count();
        $totalTickets = Ticket::count();

        if ($totalTickets === 0) {
            return 0;
        }

        // Simplified satisfaction calculation
        return round(($resolvedTickets / $totalTickets) * 100, 2);
    }

    /**
     * Get average ticket resolution time in hours.
     */
    private function getAverageTicketResolutionTime()
    {
        $resolvedTickets = Ticket::whereIn('status', ['resolved', 'closed'])
            ->whereNotNull('updated_at')
            ->get();

        if ($resolvedTickets->isEmpty()) {
            return 0;
        }

        $totalTime = $resolvedTickets->sum(function ($ticket) {
            return $ticket->updated_at->diffInHours($ticket->created_at);
        });

        return round($totalTime / $resolvedTickets->count(), 2);
    }

    /**
     * Get client management statistics for admin.
     */
    public function getClientManagementStats(Request $request)
    {
        $stats = [
            'total_clients' => Client::count(),
            'active_clients' => Client::where('status', 'active')->count(),
            'inactive_clients' => Client::where('status', 'inactive')->count(),
            'clients_with_active_products' => Client::whereHas('productInstances', function ($query) {
                $query->where('deployment_status', 'active');
            })->count(),
            'clients_created_this_month' => Client::whereMonth('created_at', now()->month)->count(),
            'clients_with_open_tickets' => Client::whereHas('tickets', function ($query) {
                $query->whereIn('state', ['Draft', 'open', 'InProgress']);
            })->count(),
        ];

        return response()->json($stats);
    }

    /**
     * Get system overview for admin.
     */
    public function getSystemOverview(Request $request)
    {
        $overview = [
            'recent_activities' => [
                'new_tickets' => Ticket::whereDate('created_at', today())->count(),
                'completed_tasks' => Task::where('state', 'completed')
                    ->whereDate('updated_at', today())->count(),
                'new_clients' => Client::whereDate('created_at', today())->count(),
            ],
            'performance_metrics' => [
                'avg_ticket_response_time' => $this->getAverageTicketResolutionTime(),
                'ticket_resolution_rate' => $this->calculateTicketResolutionRate(),
                'task_completion_rate' => $this->calculateTaskCompletionRate(),
            ],
            'resource_utilization' => [
                'department_utilization' => $this->getDepartmentUtilization(),
                'product_instance_distribution' => [],
            ],
        ];

        return response()->json($overview);
    }

    /**
     * Get department utilization statistics.
     */
    private function getDepartmentUtilization()
    {
        return Department::active()
            ->withCount(['users', 'assignedTasks'])
            ->get()
            ->map(function ($department) {
                $totalUsers = $department->users_count;
                $totalTasks = $department->assigned_tasks_count;

                return [
                    'department' => $department->name,
                    'users' => $totalUsers,
                    'tasks' => $totalTasks,
                    'utilization_rate' => $totalUsers > 0 ? round(($totalTasks / $totalUsers) * 100, 2) : 0,
                ];
            });
    }

    /**
     * Get product instance distribution.
     */
    private function getProductInstanceDistribution()
    {
        return [];
    }
}
