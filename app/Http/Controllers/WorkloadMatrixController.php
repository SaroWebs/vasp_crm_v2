<?php

namespace App\Http\Controllers;

use App\Models\Department;
use App\Models\Employee;
use App\Models\User;
use App\Services\WorkloadMatrixService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class WorkloadMatrixController extends Controller
{
    public function index(Request $request, WorkloadMatrixService $workloadMatrixService)
    {
        $user = User::find(Auth::id());
        $this->authorizeAccess($user);

        $filters = $this->normalizeFilters($request->validate([
            'period' => ['nullable', 'string', 'in:daily,weekly,monthly,custom'],
            'from_date' => ['nullable', 'date'],
            'to_date' => ['nullable', 'date'],
            'department_id' => ['nullable', 'integer', 'exists:departments,id'],
            'user_id' => ['nullable', 'integer', 'exists:users,id'],
        ]));

        $matrix = $workloadMatrixService->build($filters);

        $departments = Department::query()
            ->where('status', 'active')
            ->select('id', 'name')
            ->orderBy('name')
            ->get();

        $employees = Employee::query()
            ->with(['user:id,name,status'])
            ->whereHas('user', function ($query) {
                $query->where('status', 'active');
            })
            ->select('id', 'user_id', 'department_id')
            ->get()
            ->map(function (Employee $employee) {
                return [
                    'id' => $employee->user_id,
                    'name' => $employee->user?->name ?? 'Unknown',
                    'department_id' => $employee->department_id,
                ];
            })
            ->sortBy('name')
            ->values();

        return Inertia::render('admin/workload-matrix/Index', [
            'matrix' => $matrix,
            'filters' => $matrix['filters'],
            'departments' => $departments,
            'employees' => $employees,
        ]);
    }

    public function data(Request $request, WorkloadMatrixService $workloadMatrixService)
    {
        $user = User::find(Auth::id());
        $this->authorizeAccess($user);

        $filters = $this->normalizeFilters($request->validate([
            'period' => ['nullable', 'string', 'in:daily,weekly,monthly,custom'],
            'from_date' => ['nullable', 'date'],
            'to_date' => ['nullable', 'date'],
            'department_id' => ['nullable', 'integer', 'exists:departments,id'],
            'user_id' => ['nullable', 'integer', 'exists:users,id'],
        ]));

        return response()->json([
            'success' => true,
            'data' => $workloadMatrixService->build($filters),
        ]);
    }

    public function export(Request $request, WorkloadMatrixService $workloadMatrixService)
    {
        $user = User::find(Auth::id());
        $this->authorizeAccess($user);

        $filters = $this->normalizeFilters($request->validate([
            'period' => ['nullable', 'string', 'in:daily,weekly,monthly,custom'],
            'from_date' => ['nullable', 'date'],
            'to_date' => ['nullable', 'date'],
            'department_id' => ['nullable', 'integer', 'exists:departments,id'],
            'user_id' => ['nullable', 'integer', 'exists:users,id'],
        ]));

        $payload = $workloadMatrixService->build($filters);
        $fromDate = $payload['filters']['from_date'];
        $toDate = $payload['filters']['to_date'];
        $filename = "workload_matrix_{$fromDate}_to_{$toDate}.csv";

        return response()->streamDownload(function () use ($payload) {
            $file = fopen('php://output', 'w');

            fputcsv($file, ['Workload Matrix Export']);
            fputcsv($file, ['From Date', $payload['filters']['from_date']]);
            fputcsv($file, ['To Date', $payload['filters']['to_date']]);
            fputcsv($file, ['Period', $payload['filters']['period']]);
            fputcsv($file, ['Generated At', $payload['generated_at']]);
            fputcsv($file, []);

            fputcsv($file, ['Summary']);
            fputcsv($file, ['Employee Count', $payload['summary']['employee_count']]);
            fputcsv($file, ['Total Active Tasks', $payload['summary']['total_active_tasks']]);
            fputcsv($file, ['Total In Progress Tasks', $payload['summary']['total_in_progress_tasks']]);
            fputcsv($file, ['Total Overdue Tasks', $payload['summary']['total_overdue_tasks']]);
            fputcsv($file, ['Total Open Estimated Hours', $payload['summary']['total_open_estimated_hours']]);
            fputcsv($file, ['Total Logged Hours', $payload['summary']['total_logged_hours']]);
            fputcsv($file, ['Total Capacity Hours', $payload['summary']['total_capacity_hours']]);
            fputcsv($file, ['Avg Planned Utilization %', $payload['summary']['avg_planned_utilization_percent']]);
            fputcsv($file, ['Avg Actual Utilization %', $payload['summary']['avg_actual_utilization_percent']]);
            fputcsv($file, []);

            fputcsv($file, [
                'Employee',
                'Email',
                'Department',
                'Active Tasks',
                'In Progress Tasks',
                'Overdue Tasks',
                'Pending Assignments',
                'Accepted Assignments',
                'In Progress Assignments',
                'Open Estimated Hours',
                'Logged Hours',
                'Capacity Hours',
                'Planned Utilization %',
                'Actual Utilization %',
                'Availability Status',
            ]);

            foreach ($payload['rows'] as $row) {
                fputcsv($file, [
                    $row['name'],
                    $row['email'],
                    $row['department']['name'] ?? '',
                    $row['active_task_count'],
                    $row['in_progress_task_count'],
                    $row['overdue_task_count'],
                    $row['assignment_state_counts']['pending'] ?? 0,
                    $row['assignment_state_counts']['accepted'] ?? 0,
                    $row['assignment_state_counts']['in_progress'] ?? 0,
                    $row['open_estimated_hours'],
                    $row['logged_hours'],
                    $row['capacity_hours'],
                    $row['planned_utilization_percent'],
                    $row['actual_utilization_percent'],
                    $row['availability_status'],
                ]);
            }

            fclose($file);
        }, $filename, [
            'Content-Type' => 'text/csv',
        ]);
    }

    private function normalizeFilters(array $filters): array
    {
        $normalized = [];
        foreach ($filters as $key => $value) {
            if ($value === '' || $value === null) {
                continue;
            }
            $normalized[$key] = $value;
        }

        if (!empty($normalized['from_date']) && empty($normalized['to_date'])) {
            $normalized['to_date'] = $normalized['from_date'];
        }

        if (!empty($normalized['to_date']) && empty($normalized['from_date'])) {
            $normalized['from_date'] = $normalized['to_date'];
        }

        if (!empty($normalized['from_date']) || !empty($normalized['to_date'])) {
            $normalized['period'] = $normalized['period'] ?? 'custom';
        }

        return $normalized;
    }

    private function authorizeAccess(?User $user): void
    {
        if (!$user) {
            abort(403, 'Insufficient permissions');
        }

        $canView =
            $user->hasPermission('task.read')
            || $user->hasPermission('employee.read')
            || $user->hasPermission('workload-metric.read')
            || $user->hasPermission('dashboard.read');

        if (!$canView) {
            abort(403, 'Insufficient permissions');
        }
    }
}
