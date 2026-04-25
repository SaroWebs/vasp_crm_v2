<?php

namespace App\Http\Controllers;

use App\Models\Employee;
use App\Models\TaskTimeEntry;
use App\Models\TimelineEvent;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class EmployeeProgressController extends Controller
{
    /**
     * Get employee progress data with filtering options.
     */
    public function getEmployeeProgressData(Request $request)
    {
        // Validate request parameters
        $request->validate([
            'date' => 'nullable|date',
            'from_date' => 'nullable|date',
            'to_date' => 'nullable|date',
            'period' => 'nullable|string|in:daily,weekly,monthly',
            'employee_id' => 'nullable|integer|exists:users,id',
        ]);

        // Get filter parameters
        $date = $request->input('date');
        $fromDate = $request->input('from_date');
        $toDate = $request->input('to_date');
        $period = $request->input('period', 'daily');
        $weekStart = $request->input('week_start');
        $month = $request->input('month');
        $employeeId = $request->input('employee_id');

        // Initialize query for task time entries
        // Only include time entries where the related user is an Employee
        $timeEntryQuery = TaskTimeEntry::query()
            ->with(['user', 'task'])
            ->whereHas('user', function ($query) {
                $query->whereIn('id', Employee::pluck('user_id'));
            })
            ->where('is_active', false);

        // Filter by specific employee if provided
        if ($employeeId) {
            $timeEntryQuery->where('user_id', $employeeId);
        }

        // Apply date filters based on the period
        if ($date) {
            $timeEntryQuery->whereDate('start_time', $date);
        } elseif ($fromDate || $toDate) {
            if ($fromDate && $toDate) {
                $timeEntryQuery->whereBetween('start_time', [
                    Carbon::parse($fromDate)->startOfDay(),
                    Carbon::parse($toDate)->endOfDay(),
                ]);
            } elseif ($fromDate) {
                $timeEntryQuery->where('start_time', '>=', Carbon::parse($fromDate)->startOfDay());
            } elseif ($toDate) {
                $timeEntryQuery->where('start_time', '<=', Carbon::parse($toDate)->endOfDay());
            }
        } elseif ($period === 'weekly' && $weekStart) {
            $startOfWeek = Carbon::parse($weekStart)->startOfWeek();
            $endOfWeek = Carbon::parse($weekStart)->endOfWeek();
            $timeEntryQuery->whereBetween('start_time', [$startOfWeek, $endOfWeek]);
        } elseif ($period === 'monthly' && $month) {
            $startOfMonth = Carbon::parse($month.'-01')->startOfMonth();
            $endOfMonth = Carbon::parse($month.'-01')->endOfMonth();
            $timeEntryQuery->whereBetween('start_time', [$startOfMonth, $endOfMonth]);
        } elseif ($period === 'weekly') {
            $timeEntryQuery->whereBetween('start_time', [now()->startOfWeek(), now()->endOfWeek()]);
        } elseif ($period === 'monthly') {
            $timeEntryQuery->whereBetween('start_time', [now()->startOfMonth(), now()->endOfMonth()]);
        }

        // Get all time entries for the filtered period
        $timeEntries = $timeEntryQuery->get();

        // Pre-fetch all report_tasks with their reports to avoid N+1 queries
        $reportTasksMap = [];
        $reportTasks = DB::table('report_tasks')
            ->select('report_tasks.*', 'reports.user_id', 'reports.report_date')
            ->join('reports', 'report_tasks.report_id', '=', 'reports.id')
            ->get();

        foreach ($reportTasks as $rt) {
            $key = $rt->task_id.'_'.$rt->user_id.'_'.Carbon::parse($rt->report_date)->format('Y-m-d');
            $reportTasksMap[$key] = $rt->remarks;
        }

        // Group time entries by employee/user
        $employeeProgress = [];

        foreach ($timeEntries as $entry) {
            $userId = $entry->user_id;
            $employeeId = Employee::where('user_id', $userId)->value('id');
            if (! isset($employeeProgress[$userId])) {
                $employeeProgress[$userId] = [
                    'id' => $employeeId,
                    'user_id' => $userId,
                    'user_name' => $entry->user ? $entry->user->name : 'Unknown',
                    'email' => $entry->user ? $entry->user->email : 'N/A',
                    'total_time' => 0,
                    'tasks_completed' => 0,
                    'task_details' => [],
                    'daily_reports' => [],
                ];
            }

            // Add time to the employee's total
            $employeeProgress[$userId]['total_time'] += $entry->duration_hours;

            // Count unique tasks completed
            $taskId = $entry->task_id;
            if (! in_array($taskId, $employeeProgress[$userId]['task_details'])) {
                $employeeProgress[$userId]['tasks_completed']++;
                $employeeProgress[$userId]['task_details'][] = $taskId;
            }

            // Add daily report data
            $date = $entry->start_time->format('Y-m-d');
            if (! isset($employeeProgress[$userId]['daily_reports'][$date])) {
                $employeeProgress[$userId]['daily_reports'][$date] = [
                    'date' => $date,
                    'total_time' => 0,
                    'tasks_completed' => 0,
                    'events' => [],
                ];
            }

            $employeeProgress[$userId]['daily_reports'][$date]['total_time'] += $entry->duration_hours;

            // Add task details from the time entry itself
            $taskDetails = null;
            $remarks = null;

            // Get remarks from pre-fetched report_tasks data
            $reportKey = $entry->task_id.'_'.$userId.'_'.$date;
            if (isset($reportTasksMap[$reportKey])) {
                $remarks = $reportTasksMap[$reportKey];
            }

            if ($entry->task) {
                $taskDetails = [
                    'event_type' => 'task_time_entry',
                    'event_name' => $entry->task->task_code.' - '.$entry->task->title,
                    'event_description' => $entry->description,
                    'task_id' => $entry->task_id,
                    'task_code' => $entry->task->task_code,
                    'task_title' => $entry->task->title,
                    'duration_hours' => $entry->duration_hours,
                    'remarks' => $remarks,
                ];
                $employeeProgress[$userId]['daily_reports'][$date]['events'][] = $taskDetails;
            }

            // Fetch timeline events for the day
            $events = TimelineEvent::where('task_id', $entry->task_id)
                ->whereDate('event_date', $date)
                ->get();

            foreach ($events as $event) {
                $employeeProgress[$userId]['daily_reports'][$date]['events'][] = [
                    'event_type' => $event->event_type,
                    'event_name' => $event->event_name,
                    'event_description' => $event->event_description,
                    'task_id' => $event->task_id,
                ];
            }
        }

        // Convert to array and sort by total time (descending)
        $employeeProgress = array_values($employeeProgress);
        usort($employeeProgress, function ($a, $b) {
            return $b['total_time'] <=> $a['total_time'];
        });

        return response()->json([
            'success' => true,
            'data' => $employeeProgress,
            'total_employees' => count($employeeProgress),
            'total_time' => array_sum(array_column($employeeProgress, 'total_time')),
            'total_tasks' => array_sum(array_column($employeeProgress, 'tasks_completed')),
            'period' => $period,
        ]);
    }

    /**
     * Display the employee progress panel in the dashboard.
     */
    public function showEmployeeProgressPanel(Request $request)
    {
        // Get initial data without filters
        $progressData = $this->getEmployeeProgressData($request);

        return Inertia::render('EmployeeProgressPanel', [
            'progressData' => $progressData->getData(),
            'filterOptions' => [
                'date' => $request->input('date'),
                'from_date' => $request->input('from_date'),
                'to_date' => $request->input('to_date'),
            ],
        ]);
    }

    /**
     * Get employee progress statistics.
     */
    public function getEmployeeProgressStats(Request $request)
    {
        $progressData = $this->getEmployeeProgressData($request);
        $data = $progressData->getData();

        return response()->json([
            'total_employees' => $data['total_employees'],
            'total_time' => $data['total_time'],
            'total_tasks' => $data['total_tasks'],
            'avg_time_per_employee' => $data['total_employees'] > 0 ? round($data['total_time'] / $data['total_employees'], 2) : 0,
        ]);
    }
}
