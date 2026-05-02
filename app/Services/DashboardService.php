<?php

namespace App\Services;

use App\Models\Client;
use App\Models\Department;
use App\Models\Notification;
use App\Models\Product;
use App\Models\Task;
use App\Models\TaskForwarding;
use App\Models\TaskTimeEntry;
use App\Models\Ticket;
use App\Models\User;
use Illuminate\Support\Carbon;

class DashboardService
{
    /**
     * Get dashboard data based on user role.
     */
    public function getDashboardData(User $user): array
    {
        // Admin roles: full system access
        if ($user->hasRole(['super-admin', 'admin'])) {
            return $this->getAdminDashboard($user);
        }

        // Managerial roles: department/team oversight
        if ($user->hasRole(['manager', 'team-lead', 'hr'])) {
            return $this->getManagerDashboard($user);
        }

        // Employee roles: individual contributors
        if ($user->hasRole(['developer', 'support-agent', 'employee', 'sales'])) {
            return $this->getEmployeeDashboard($user);
        }

        // Default fallback to employee dashboard
        return $this->getEmployeeDashboard($user);
    }

    /**
     * Get admin dashboard data (system-wide overview).
     */
    public function getAdminDashboard(User $user): array
    {
        return [
            'dashboard_type' => 'admin',
            'stats' => $this->getAdminStats(),
            'recentTickets' => $this->getRecentTickets(),
            'recentTasks' => $this->getRecentTasks(),
            'departmentStats' => $this->getDepartmentStats(),
            'ticketStats' => $this->getTicketStats(),
            'taskStats' => $this->getTaskStats(),
            'employeeProgress' => $this->getEmployeeProgress(),
            'employees' => $this->getEmployees(),
            'unreadNotifications' => $this->getUnreadNotifications($user),
        ];
    }

    /**
     * Get manager/department head dashboard data.
     */
    public function getManagerDashboard(User $user): array
    {
        $departmentIds = $this->getUserDepartmentIds($user);

        return [
            'dashboard_type' => 'manager',
            'stats' => $this->getManagerStats($user, $departmentIds),
            'myDepartmentTasks' => $this->getDepartmentTasks($departmentIds),
            'teamWorkload' => $this->getTeamWorkload($departmentIds),
            'recentTasks' => $this->getRecentTasksForDepartments($departmentIds),
            'departmentStats' => $this->getDepartmentStatsForManager($departmentIds),
            'unreadNotifications' => $this->getUnreadNotifications($user),
            'unreadNotificationsList' => $this->getUnreadNotificationsList($user),
        ];
    }

    /**
     * Get employee dashboard data (personal tasks).
     */
    public function getEmployeeDashboard(User $user): array
    {
        return [
            'dashboard_type' => 'employee',
            'stats' => $this->getEmployeeStats($user),
            'myTasks' => $this->getMyTasks($user),
            'myTaskStats' => $this->getMyTaskStats($user),
            'forwardedTasks' => $this->getForwardedTasks($user),
            'upcomingDeadlines' => $this->getUpcomingDeadlines($user),
            'recentTimeEntries' => $this->getRecentTimeEntries($user),
            'timeSpentChartData' => $this->getTimeSpentChartData($user),
            'unreadNotifications' => $this->getUnreadNotifications($user),
            'unreadNotificationsList' => $this->getUnreadNotificationsList($user),
            'recentTickets' => $this->getRecentTickets(),
        ];
    }

    /**
     * Get admin-level statistics.
     */
    private function getAdminStats(): array
    {
        return [
            'total_departments' => Department::active()->count(),
            'total_users' => User::count(),
            'total_clients' => Client::where('status', 'active')->count(),
            'total_products' => Product::where('status', 'active')->count(),
            'total_tickets' => Ticket::count(),
            'total_tasks' => Task::count(),
            'open_tickets' => Ticket::where('status', 'open')->count(),
            'pending_tasks' => Task::where('state', 'Draft')->count(),
            'completed_tasks_this_month' => Task::where('state', 'Done')
                ->whereMonth('updated_at', now()->month)
                ->count(),
            'active_users_today' => User::where('last_login_at', '>=', today())->count(),
            'tickets_created_today' => Ticket::whereDate('created_at', today())->count(),
            'tasks_completed_today' => Task::where('state', 'Done')
                ->whereDate('updated_at', today())
                ->count(),
        ];
    }

    /**
     * Get employee progress data for admin dashboard.
     */
    private function getEmployeeProgress(): array
    {
        $users = User::with('employee')->get();
        $employeeData = [];
        $totalTime = 0;
        $totalTasks = 0;

        foreach ($users as $user) {
            if ($user->employee) {
                $taskIds = $user->assignedTasks()->pluck('tasks.id');
                $timeEntries = TaskTimeEntry::whereIn('task_id', $taskIds)
                    ->whereMonth('created_at', now()->month)
                    ->get();

                $hours = $timeEntries->sum('hours');
                $minutes = $timeEntries->sum('minutes');
                $totalHours = $hours + ($minutes / 60);

                $employeeData[] = [
                    'user_id' => $user->id,
                    'user_name' => $user->name,
                    'total_time' => round($totalHours, 2),
                    'total_tasks' => $user->assignedTasks()->count(),
                ];

                $totalTime += $totalHours;
                $totalTasks += $user->assignedTasks()->count();
            }
        }

        $avgTimePerEmployee = count($employeeData) > 0 ? $totalTime / count($employeeData) : 0;

        return [
            'data' => $employeeData,
            'total_employees' => count($employeeData),
            'total_time' => round($totalTime, 2),
            'total_tasks' => $totalTasks,
            'avg_time_per_employee' => round($avgTimePerEmployee, 2),
        ];
    }

    /**
     * Get employees list for admin dashboard.
     */
    private function getEmployees(): array
    {
        return User::whereHas('employee')
            ->select('id', 'name', 'email')
            ->get()
            ->toArray();
    }

    /**
     * Get manager-level statistics.
     */
    private function getManagerStats(User $user, array $departmentIds): array
    {
        $departmentTasks = Task::whereIn('assigned_department_id', $departmentIds);
        $userIds = Department::whereIn('id', $departmentIds)
            ->with('users')
            ->get()
            ->pluck('users.*.id')
            ->flatten()
            ->unique()
            ->toArray();

        return [
            'total_team_members' => count($userIds),
            'total_department_tasks' => $departmentTasks->count(),
            'pending_tasks' => $departmentTasks->where('state', 'Draft')->count(),
            'in_progress_tasks' => $departmentTasks->where('state', 'InProgress')->count(),
            'completed_tasks_this_month' => $departmentTasks->where('state', 'Done')
                ->whereMonth('updated_at', now()->month)
                ->count(),
            'tasks_due_today' => $departmentTasks->whereDate('due_at', today())->count(),
            'tasks_due_this_week' => $departmentTasks->whereBetween('due_at', [now(), now()->addDays(7)])->count(),
            'overdue_tasks' => $departmentTasks->where('state', '!=', 'Done')
                ->whereDate('due_at', '<', today())
                ->count(),
        ];
    }

    /**
     * Get employee-level statistics.
     */
    private function getEmployeeStats(User $user): array
    {
        $myTasks = Task::whereHas('assignedUsers', function ($query) use ($user) {
            $query->where('user_id', $user->id);
        });

        return [
            'total_my_tasks' => $myTasks->count(),
            'pending_tasks' => $myTasks->where('state', 'Draft')->count(),
            'in_progress_tasks' => $myTasks->where('state', 'InProgress')->count(),
            'waiting_tasks' => $myTasks->where('state', 'InReview')->count(),
            'completed_tasks' => $myTasks->where('state', 'Done')->count(),
            'completed_this_month' => $myTasks->where('state', 'Done')
                ->whereMonth('updated_at', now()->month)
                ->count(),
            'tasks_due_today' => $myTasks->whereDate('due_at', today())->count(),
            'tasks_due_this_week' => $myTasks->whereBetween('due_at', [now(), now()->addDays(7)])->count(),
            'overdue_tasks' => $myTasks->where('state', '!=', 'Done')
                ->whereDate('due_at', '<', today())
                ->count(),
            'forwarded_tasks_count' => TaskForwarding::where('to_user_id', $user->id)
                ->where('status', 'pending')
                ->count(),
        ];
    }

    /**
     * Get recent tickets (admin view).
     */
    private function getRecentTickets()
    {
        return Ticket::with(['client', 'organizationUser'])
            ->latest('created_at')
            ->limit(10)
            ->get()
            ->map(function ($ticket) {
                return [
                    'id' => $ticket->id,
                    'ticket_number' => $ticket->ticket_number,
                    'subject' => $ticket->subject,
                    'status' => $ticket->status,
                    'priority' => $ticket->priority,
                    'client' => $ticket->client?->name,
                    'created_at' => $ticket->created_at->toISOString(),
                ];
            });
    }

    /**
     * Get recent tasks (admin view).
     */
    private function getRecentTasks()
    {
        return Task::with(['ticket', 'assignedDepartment', 'assignedUsers'])
            ->latest('created_at')
            ->limit(10)
            ->get()
            ->map(function ($task) {
                return [
                    'id' => $task->id,
                    'title' => $task->title,
                    'status' => $task->state,
                    'priority' => $task->priority,
                    'department' => $task->assignedDepartment?->name,
                    'assigned_users' => $task->assignedUsers->pluck('name'),
                    'due_date' => $task->due_at?->toISOString(),
                    'created_at' => $task->created_at->toISOString(),
                ];
            });
    }

    /**
     * Get department statistics (admin view).
     */
    private function getDepartmentStats()
    {
        return Department::active()
            ->withCount([
                'users',
                'assignedTasks as pending_tasks_count' => function ($query) {
                    $query->where('state', '!=', 'Done');
                },
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
                        ->where('state', 'Done')
                        ->count(),
                ];
            });
    }

    /**
     * Get ticket status distribution.
     */
    private function getTicketStats(): array
    {
        return [
            'open' => Ticket::where('status', 'open')->count(),
            'approved' => Ticket::where('status', 'approved')->count(),
            'in_progress' => Ticket::where('status', 'in-progress')->count(),
            'closed' => Ticket::where('status', 'closed')->count(),
            'cancelled' => Ticket::where('status', 'cancelled')->count(),
        ];
    }

    /**
     * Get task status distribution.
     */
    private function getTaskStats(): array
    {
        return [
            'pending' => Task::where('state', 'Draft')->count(),
            'in_progress' => Task::where('state', 'InProgress')->count(),
            'waiting' => Task::where('state', 'InReview')->count(),
            'completed' => Task::where('state', 'Done')->count(),
        ];
    }

    /**
     * Get unread notifications count for a user.
     */
    private function getUnreadNotifications(User $user): int
    {
        return Notification::getUnreadCountForUser($user->id);
    }

    /**
     * Get unread notifications list for a user.
     */
    private function getUnreadNotificationsList(User $user)
    {
        return Notification::whereHas('users', function ($query) use ($user) {
            $query->where('user_id', $user->id)
                ->where('users_notifications.read', false);
        })
            ->with(['users' => function ($query) use ($user) {
                $query->where('user_id', $user->id);
            }])
            ->latest()
            ->limit(10)
            ->get()
            ->map(function ($notification) {
                return [
                    'id' => $notification->id,
                    'type' => $notification->type,
                    'title' => $notification->title,
                    'message' => $notification->message,
                    'created_at' => $notification->created_at->toISOString(),
                ];
            });
    }

    /**
     * Get user's department IDs.
     */
    private function getUserDepartmentIds(User $user): array
    {
        return $user->departmentUsers()
            ->pluck('department_id')
            ->toArray();
    }

    /**
     * Get tasks for specific departments.
     */
    private function getDepartmentTasks(array $departmentIds)
    {
        return Task::whereIn('assigned_department_id', $departmentIds)
            ->where('state', '!=', 'Done')
            ->with(['assignedDepartment', 'assignedUsers'])
            ->latest('created_at')
            ->limit(10)
            ->get()
            ->map(function ($task) {
                return [
                    'id' => $task->id,
                    'title' => $task->title,
                    'status' => $task->state,
                    'priority' => $task->priority,
                    'department' => $task->assignedDepartment?->name,
                    'assigned_users' => $task->assignedUsers->pluck('name'),
                    'due_date' => $task->due_at?->toISOString(),
                ];
            });
    }

    /**
     * Get team workload (tasks per user in departments).
     */
    private function getTeamWorkload(array $departmentIds)
    {
        $userIds = Department::whereIn('id', $departmentIds)
            ->with('users')
            ->get()
            ->pluck('users.*.id')
            ->flatten()
            ->unique()
            ->toArray();

        $tasksByUser = Task::whereIn('assigned_department_id', $departmentIds)
            ->where('state', '!=', 'Done')
            ->get()
            ->groupBy(function ($task) {
                return $task->assignedUsers->pluck('id')->first();
            });

        $workload = [];
        foreach ($userIds as $userId) {
            $user = User::find($userId);
            if ($user) {
                $taskCount = $tasksByUser->get($userId)?->count() ?? 0;
                $workload[] = [
                    'user_id' => $user->id,
                    'name' => $user->name,
                    'task_count' => $taskCount,
                    'status' => $taskCount > 10 ? 'overloaded' : ($taskCount > 5 ? 'busy' : 'available'),
                ];
            }
        }

        return $workload;
    }

    /**
     * Get recent tasks for departments.
     */
    private function getRecentTasksForDepartments(array $departmentIds)
    {
        return Task::whereIn('assigned_department_id', $departmentIds)
            ->with(['assignedDepartment', 'assignedUsers'])
            ->latest('created_at')
            ->limit(10)
            ->get()
            ->map(function ($task) {
                return [
                    'id' => $task->id,
                    'title' => $task->title,
                    'status' => $task->state,
                    'priority' => $task->priority,
                    'department' => $task->assignedDepartment?->name,
                    'assigned_users' => $task->assignedUsers->pluck('name'),
                    'due_date' => $task->due_at?->toISOString(),
                ];
            });
    }

    /**
     * Get department stats for manager view.
     */
    private function getDepartmentStatsForManager(array $departmentIds)
    {
        return Department::whereIn('id', $departmentIds)
            ->active()
            ->withCount([
                'users',
                'assignedTasks as pending_tasks_count' => function ($query) {
                    $query->where('state', '!=', 'Done');
                },
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
                        ->where('state', 'Done')
                        ->count(),
                ];
            });
    }

    /**
     * Get user's personal tasks.
     */
    private function getMyTasks(User $user)
    {
        return Task::whereHas('assignedUsers', function ($query) use ($user) {
            $query->where('user_id', $user->id);
        })
            ->with(['assignedDepartment'])
            ->latest('created_at')
            ->limit(10)
            ->get()
            ->map(function ($task) {
                return [
                    'id' => $task->id,
                    'title' => $task->title,
                    'status' => $task->state,
                    'priority' => $task->priority,
                    'department' => $task->assignedDepartment?->name,
                    'due_date' => $task->due_at?->toISOString(),
                    'created_at' => $task->created_at->toISOString(),
                ];
            });
    }

    /**
     * Get user's task statistics.
     */
    private function getMyTaskStats(User $user): array
    {
        $myTasks = Task::whereHas('assignedUsers', function ($query) use ($user) {
            $query->where('user_id', $user->id);
        });

        return [
            'pending' => $myTasks->where('state', 'Draft')->count(),
            'in_progress' => $myTasks->where('state', 'InProgress')->count(),
            'waiting' => $myTasks->where('state', 'InReview')->count(),
            'completed' => $myTasks->where('state', 'Done')->count(),
        ];
    }

    /**
     * Get tasks forwarded to user.
     */
    private function getForwardedTasks(User $user)
    {
        return TaskForwarding::where('to_user_id', $user->id)
            ->where('status', 'pending')
            ->with(['task.assignedDepartment'])
            ->latest('forwarded_at')
            ->limit(10)
            ->get()
            ->map(function ($forwarding) {
                return [
                    'id' => $forwarding->id,
                    'task_id' => $forwarding->task_id,
                    'task_title' => $forwarding->task?->title,
                    'from_user' => $forwarding->fromUser?->name,
                    'from_department' => $forwarding->fromDepartment?->name,
                    'forwarded_at' => $forwarding->forwarded_at?->toISOString(),
                    'remarks' => $forwarding->remarks,
                ];
            });
    }

    /**
     * Get upcoming deadlines for user's tasks.
     */
    private function getUpcomingDeadlines(User $user)
    {
        return Task::whereHas('assignedUsers', function ($query) use ($user) {
            $query->where('user_id', $user->id);
        })
            ->where('state', '!=', 'Done')
            ->whereDate('due_at', '>=', today())
            ->whereDate('due_at', '<=', now()->addDays(7))
            ->orderBy('due_at')
            ->limit(10)
            ->get()
            ->map(function ($task) {
                return [
                    'id' => $task->id,
                    'title' => $task->title,
                    'status' => $task->state,
                    'priority' => $task->priority,
                    'due_date' => $task->due_at?->toISOString(),
                    'is_overdue' => $task->due_at?->isPast() ?? false,
                ];
            });
    }

    /**
     * Get recent time entries for user.
     */
    private function getRecentTimeEntries(User $user)
    {
        $taskIds = $user->assignedTasks()->pluck('tasks.id');

        return TaskTimeEntry::whereIn('task_id', $taskIds)
            ->whereDate('created_at', today())
            ->with(['task'])
            ->latest()
            ->limit(10)
            ->get()
            ->map(function ($entry) {
                return [
                    'id' => $entry->id,
                    'task_title' => $entry->task?->title,
                    'hours' => $entry->hours,
                    'minutes' => $entry->minutes,
                    'created_at' => $entry->created_at->toISOString(),
                ];
            });
    }

    /**
     * Get daily time spent chart data for the current user.
     */
    private function getTimeSpentChartData(User $user): array
    {
        $rangeStart = Carbon::now()->subDays(29)->startOfDay();
        $rangeEnd = Carbon::now()->endOfDay();

        $timeEntries = TaskTimeEntry::where('user_id', $user->id)
            ->where(function ($query) use ($rangeStart, $rangeEnd) {
                $query->whereBetween('start_time', [$rangeStart, $rangeEnd])
                    ->orWhereBetween('end_time', [$rangeStart, $rangeEnd])
                    ->orWhere(function ($query) use ($rangeStart, $rangeEnd) {
                        $query->where('start_time', '<', $rangeStart)
                            ->where('end_time', '>', $rangeEnd);
                    });
            })
            ->get();

        return [
            'weekly' => $this->buildTimeSpentChartSeries($timeEntries, 7),
            'monthly' => $this->buildTimeSpentChartSeries($timeEntries, 30),
        ];
    }

    private function buildTimeSpentChartSeries($timeEntries, int $days): array
    {
        $series = [];

        for ($day = $days - 1; $day >= 0; $day--) {
            $date = Carbon::now()->subDays($day)->startOfDay();
            $series[] = [
                'label' => $days === 7 ? $date->format('D') : $date->format('M j'),
                'date' => $date->toDateString(),
                'hours' => round($this->calculateTotalHoursForDate($timeEntries, $date->toDateString()), 2),
            ];
        }

        return $series;
    }

    private function calculateTotalHoursForDate($timeEntries, string $date): float
    {
        $totalSeconds = 0;

        foreach ($timeEntries as $entry) {
            $totalSeconds += $entry->calculateDurationForDate($date, Carbon::parse($date)->endOfDay());
        }

        return $totalSeconds / 3600;
    }
}
