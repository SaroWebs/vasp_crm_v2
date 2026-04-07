<?php

namespace App\Services;

use App\Models\Employee;
use App\Models\TaskAssignment;
use App\Models\TaskTimeEntry;
use Carbon\Carbon;

class WorkloadMatrixService
{
    private const TERMINAL_TASK_STATES = ['Done', 'Cancelled', 'Rejected'];

    private const PENDING_TASK_STATES = ['Draft', 'Assigned', 'Blocked'];

    private const IN_PROGRESS_TASK_STATES = ['InProgress', 'InReview'];

    public function __construct(private readonly WorkingHoursService $workingHoursService) {}

    public function build(array $filters = []): array
    {
        [$periodStart, $periodEnd, $period] = $this->resolveDateRange($filters);

        $departmentId = $filters['department_id'] ?? null;
        $userId = $filters['user_id'] ?? null;

        $employeesQuery = Employee::query()
            ->with(['user:id,name,email,status', 'department:id,name'])
            ->whereHas('user', function ($query) {
                $query->where('status', 'active');
            });

        if (! empty($departmentId)) {
            $employeesQuery->where('department_id', $departmentId);
        }

        if (! empty($userId)) {
            $employeesQuery->where('user_id', $userId);
        }

        $employees = $employeesQuery->get()
            ->filter(fn (Employee $employee) => $employee->user !== null)
            ->values();

        if ($employees->isEmpty()) {
            return [
                'filters' => $this->formatFilters($periodStart, $periodEnd, $period, $departmentId, $userId),
                'summary' => [
                    'employee_count' => 0,
                    'total_active_tasks' => 0,
                    'total_in_progress_tasks' => 0,
                    'total_overdue_tasks' => 0,
                    'total_open_estimated_hours' => 0,
                    'total_logged_hours' => 0,
                    'total_capacity_hours' => 0,
                    'avg_planned_utilization_percent' => 0,
                    'avg_actual_utilization_percent' => 0,
                ],
                'rows' => [],
                'generated_at' => now()->toISOString(),
            ];
        }

        $userIds = $employees->pluck('user_id')->map(fn ($id) => (int) $id)->all();
        $now = now();

        $taskDateRange = [
            $periodStart->copy()->startOfDay(),
            $periodEnd->copy()->endOfDay(),
        ];

        $assignments = TaskAssignment::query()
            ->whereIn('user_id', $userIds)
            ->where('is_active', true)
            ->whereHas('task', function ($query) use ($taskDateRange) {
                $query->whereNull('deleted_at')
                    ->where(function ($query) use ($taskDateRange) {
                        $query->where('due_at', '>=', $taskDateRange[0])
                            ->orWhere(function ($query) use ($taskDateRange) {
                                $query->whereNull('due_at')
                                    ->whereBetween('created_at', $taskDateRange);
                            });
                    });
            })
            ->with(['task:id,state,due_at,estimate_hours,created_at'])
            ->get();

        $taskIds = $assignments->pluck('task_id')->unique()->values();
        $activeAssigneeCountByTask = [];

        if ($taskIds->isNotEmpty()) {
            $activeAssigneeCountByTask = TaskAssignment::query()
                ->whereIn('task_id', $taskIds)
                ->where('is_active', true)
                ->selectRaw('task_id, COUNT(*) as assignee_count')
                ->groupBy('task_id')
                ->pluck('assignee_count', 'task_id')
                ->map(fn ($count) => (int) $count)
                ->all();
        }

        $assignmentStatsByUser = [];
        foreach ($assignments as $assignment) {
            $task = $assignment->task;
            if (! $task) {
                continue;
            }

            $taskId = (int) $assignment->task_id;
            $uid = (int) $assignment->user_id;
            $taskState = (string) $task->state;
            $assignmentState = (string) $assignment->state;

            $stats = $assignmentStatsByUser[$uid] ?? $this->emptyUserStats();
            $stats['task_ids'][$taskId] = true;

            if (in_array($taskState, self::TERMINAL_TASK_STATES, true)) {
                $assignmentStatsByUser[$uid] = $stats;

                continue;
            }

            $stats['assignment_state_counts'][$assignmentState] = ($stats['assignment_state_counts'][$assignmentState] ?? 0) + 1;
            $stats['active_task_ids'][$taskId] = true;

            if (in_array($taskState, self::IN_PROGRESS_TASK_STATES, true)) {
                $stats['in_progress_task_ids'][$taskId] = true;
            } elseif (in_array($taskState, self::PENDING_TASK_STATES, true)) {
                $stats['pending_task_ids'][$taskId] = true;
            } else {
                $stats['pending_task_ids'][$taskId] = true;
            }

            if (! empty($task->due_at) && Carbon::parse($task->due_at)->lt($now)) {
                $stats['overdue_task_ids'][$taskId] = true;
            }

            $taskEstimateHours = (float) ($task->estimate_hours ?? 0);
            $assigneeCount = $activeAssigneeCountByTask[$taskId] ?? 1;
            $stats['open_estimated_hours'] += $assignment->estimated_time !== null
                ? (float) $assignment->estimated_time
                : $this->splitTaskEstimateAcrossAssignees($taskEstimateHours, $assigneeCount);

            $assignmentStatsByUser[$uid] = $stats;
        }

        $timeEntries = TaskTimeEntry::query()
            ->whereIn('user_id', $userIds)
            ->where('is_active', false)
            ->whereBetween('start_time', [
                $periodStart->copy()->startOfDay(),
                $periodEnd->copy()->endOfDay(),
            ])
            ->whereHas('task', function ($query) {
                $query->whereNull('deleted_at');
            })
            ->get(['id', 'task_id', 'user_id', 'start_time', 'end_time', 'is_active', 'metadata']);

        $loggedHoursByUser = [];
        $workedTaskIdsByUser = [];
        foreach ($timeEntries as $entry) {
            $uid = (int) $entry->user_id;
            $loggedHoursByUser[$uid] = ($loggedHoursByUser[$uid] ?? 0) + (float) $entry->duration_hours;
            $workedTaskIdsByUser[$uid][(int) $entry->task_id] = true;
        }

        $capacityHoursPerEmployee = $this->calculateCapacityHours($periodStart, $periodEnd);

        $rows = $employees->map(function (Employee $employee) use (
            $assignmentStatsByUser,
            $loggedHoursByUser,
            $workedTaskIdsByUser,
            $capacityHoursPerEmployee
        ) {
            $uid = (int) $employee->user_id;
            $stats = $assignmentStatsByUser[$uid] ?? $this->emptyUserStats();
            $loggedHours = round((float) ($loggedHoursByUser[$uid] ?? 0), 2);
            $openEstimatedHours = round((float) $stats['open_estimated_hours'], 2);

            $plannedUtilization = $capacityHoursPerEmployee > 0
                ? round(($openEstimatedHours / $capacityHoursPerEmployee) * 100, 2)
                : 0;
            $actualUtilization = $capacityHoursPerEmployee > 0
                ? round(($loggedHours / $capacityHoursPerEmployee) * 100, 2)
                : 0;

            $availabilityStatus = 'available';
            if ($plannedUtilization >= 100) {
                $availabilityStatus = 'overloaded';
            } elseif ($plannedUtilization >= 70) {
                $availabilityStatus = 'balanced';
            }

            return [
                'employee_id' => (int) $employee->id,
                'user_id' => $uid,
                'name' => (string) ($employee->user?->name ?? 'Unknown'),
                'email' => (string) ($employee->user?->email ?? ''),
                'department' => [
                    'id' => $employee->department?->id,
                    'name' => $employee->department?->name,
                ],
                'active_task_count' => count($stats['active_task_ids']),
                'in_progress_task_count' => count($stats['in_progress_task_ids']),
                'pending_task_count' => count($stats['pending_task_ids']),
                'overdue_task_count' => count($stats['overdue_task_ids']),
                'assignment_state_counts' => [
                    'pending' => (int) ($stats['assignment_state_counts']['pending'] ?? 0),
                    'accepted' => (int) ($stats['assignment_state_counts']['accepted'] ?? 0),
                    'in_progress' => (int) ($stats['assignment_state_counts']['in_progress'] ?? 0),
                ],
                'open_estimated_hours' => $openEstimatedHours,
                'logged_hours' => $loggedHours,
                'capacity_hours' => $capacityHoursPerEmployee,
                'planned_utilization_percent' => $plannedUtilization,
                'actual_utilization_percent' => $actualUtilization,
                'worked_task_count_in_period' => count($workedTaskIdsByUser[$uid] ?? []),
                'availability_status' => $availabilityStatus,
            ];
        })
            ->sortByDesc('planned_utilization_percent')
            ->values();

        $summary = [
            'employee_count' => $rows->count(),
            'total_active_tasks' => (int) $rows->sum('active_task_count'),
            'total_in_progress_tasks' => (int) $rows->sum('in_progress_task_count'),
            'total_overdue_tasks' => (int) $rows->sum('overdue_task_count'),
            'total_open_estimated_hours' => round((float) $rows->sum('open_estimated_hours'), 2),
            'total_logged_hours' => round((float) $rows->sum('logged_hours'), 2),
            'total_capacity_hours' => round((float) ($capacityHoursPerEmployee * $rows->count()), 2),
            'avg_planned_utilization_percent' => $rows->count() > 0
                ? round((float) $rows->avg('planned_utilization_percent'), 2)
                : 0,
            'avg_actual_utilization_percent' => $rows->count() > 0
                ? round((float) $rows->avg('actual_utilization_percent'), 2)
                : 0,
        ];

        return [
            'filters' => $this->formatFilters($periodStart, $periodEnd, $period, $departmentId, $userId),
            'summary' => $summary,
            'rows' => $rows->all(),
            'charts' => $this->buildChartData($rows, $summary),
            'generated_at' => now()->toISOString(),
        ];
    }

    private function buildChartData($rows, array $summary): array
    {
        $workloadByEmployee = $rows->map(function ($row) {
            return [
                'name' => explode(' ', $row['name'])[0], // First name only for shorter labels
                'fullName' => $row['name'],
                'assigned' => $row['active_task_count'],
                'inProgress' => $row['in_progress_task_count'],
                'estimatedHours' => $row['open_estimated_hours'],
                'loggedHours' => $row['logged_hours'],
                'capacityHours' => $row['capacity_hours'],
            ];
        })->values()->all();

        // Utilization gauge data
        $utilizationData = [
            ['name' => 'Planned Utilization', 'value' => $summary['avg_planned_utilization_percent'], 'color' => '#8b5cf6'],
            ['name' => 'Actual Utilization', 'value' => $summary['avg_actual_utilization_percent'], 'color' => '#10b981'],
        ];

        // Workload distribution by department
        $workloadByDepartment = [];
        $departmentGroups = $rows->groupBy(fn ($row) => $row['department']['name'] ?? 'Unassigned');
        foreach ($departmentGroups as $deptName => $deptRows) {
            $workloadByDepartment[] = [
                'name' => $deptName,
                'employees' => $deptRows->count(),
                'totalTasks' => (int) $deptRows->sum('active_task_count'),
                'totalEstimatedHours' => round((float) $deptRows->sum('open_estimated_hours'), 2),
                'totalLoggedHours' => round((float) $deptRows->sum('logged_hours'), 2),
                'avgUtilization' => $deptRows->count() > 0
                    ? round((float) $deptRows->avg('planned_utilization_percent'), 1)
                    : 0,
            ];
        }

        // Workload trend (simulated based on current data)
        $workloadTrend = [
            ['period' => 'Current', 'utilization' => $summary['avg_planned_utilization_percent']],
        ];

        return [
            'workloadByEmployee' => $workloadByEmployee,
            'utilizationData' => $utilizationData,
            'workloadByDepartment' => $workloadByDepartment,
            'workloadTrend' => $workloadTrend,
        ];
    }

    private function resolveDateRange(array $filters): array
    {
        $period = $filters['period'] ?? 'weekly';
        $fromDate = $filters['from_date'] ?? null;
        $toDate = $filters['to_date'] ?? null;

        if (! empty($fromDate) && ! empty($toDate)) {
            $start = Carbon::parse($fromDate)->startOfDay();
            $end = Carbon::parse($toDate)->endOfDay();
        } else {
            if ($period === 'daily') {
                $start = now()->startOfDay();
                $end = now()->endOfDay();
            } elseif ($period === 'monthly') {
                $start = now()->startOfMonth()->startOfDay();
                $end = now()->endOfMonth()->endOfDay();
            } else {
                $start = now()->startOfWeek()->startOfDay();
                $end = now()->endOfWeek()->endOfDay();
                $period = 'weekly';
            }
        }

        if ($start->gt($end)) {
            [$start, $end] = [$end->copy()->startOfDay(), $start->copy()->endOfDay()];
        }

        return [$start, $end, $period];
    }

    private function calculateCapacityHours(Carbon $start, Carbon $end): float
    {
        $hours = 0.0;
        $cursor = $start->copy()->startOfDay();
        $limit = $end->copy()->startOfDay();

        while ($cursor->lte($limit)) {
            $hours += $this->workingHoursService->getDailyWorkingHours($cursor->toDateTime());
            $cursor->addDay();
        }

        return round($hours, 2);
    }

    private function splitTaskEstimateAcrossAssignees(float $taskEstimateHours, int $assigneeCount): float
    {
        if ($taskEstimateHours <= 0) {
            return 0;
        }

        return round($taskEstimateHours / max(1, $assigneeCount), 2);
    }

    private function emptyUserStats(): array
    {
        return [
            'task_ids' => [],
            'active_task_ids' => [],
            'in_progress_task_ids' => [],
            'pending_task_ids' => [],
            'overdue_task_ids' => [],
            'assignment_state_counts' => [],
            'open_estimated_hours' => 0.0,
        ];
    }

    private function formatFilters(
        Carbon $periodStart,
        Carbon $periodEnd,
        string $period,
        mixed $departmentId,
        mixed $userId
    ): array {
        return [
            'period' => $period,
            'from_date' => $periodStart->toDateString(),
            'to_date' => $periodEnd->toDateString(),
            'department_id' => $departmentId,
            'user_id' => $userId,
        ];
    }
}
