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

        $matrix = $workloadMatrixService->build();

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
            'departments' => $departments,
            'employees' => $employees,
        ]);
    }

    public function data(Request $request, WorkloadMatrixService $workloadMatrixService)
    {
        $user = User::find(Auth::id());
        $this->authorizeAccess($user);

        return response()->json([
            'success' => true,
            'data' => $workloadMatrixService->build(),
        ]);
    }

    public function export(Request $request, WorkloadMatrixService $workloadMatrixService)
    {
        $user = User::find(Auth::id());
        $this->authorizeAccess($user);

        $payload = $workloadMatrixService->build();

        return response()->streamDownload(function () use ($payload) {
            $file = fopen('php://output', 'w');

            fputcsv($file, ['Workload Matrix Export']);
            fputcsv($file, ['Generated At', $payload['generated_at']]);
            fputcsv($file, []);

            fputcsv($file, ['Summary']);
            fputcsv($file, ['Employee Count', $payload['summary']['employee_count']]);
            fputcsv($file, ['Total Assigned Tasks', $payload['summary']['total_active_tasks']]);
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
                'Assigned Tasks',
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
        }, 'workload_matrix.csv', [
            'Content-Type' => 'text/csv',
        ]);
    }

    private function authorizeAccess(?User $user): void
    {
        if (! $user) {
            abort(403, 'Insufficient permissions');
        }

        $canView =
            $user->hasPermission('task.read')
            || $user->hasPermission('employee.read')
            || $user->hasPermission('workload-metric.read')
            || $user->hasPermission('dashboard.read');

        if (! $canView) {
            abort(403, 'Insufficient permissions');
        }
    }
}
