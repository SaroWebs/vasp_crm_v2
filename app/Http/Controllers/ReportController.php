<?php

namespace App\Http\Controllers;

use App\Models\Report;
use App\Models\ReportAttachment;
use App\Models\User;
use App\Services\NotificationService;
use App\Services\WorkingHoursService;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class ReportController extends Controller
{
    public function __construct(
        protected NotificationService $notificationService
    ) {}

    public function getDailyReportAll($date)
    {
        $reports = Report::where('report_date', $date)
            ->with(['user', 'tasks', 'attachments'])
            ->get()
            ->map(function ($report) {
                return [
                    'id' => $report->id,
                    'title' => $report->title,
                    'description' => $report->description,
                    'report_date' => $report->report_date,
                    'status' => $report->status,
                    'total_hours' => $report->total_hours,
                    'user_name' => $report->user->name,
                    'task_count' => $report->tasks->count(),
                    'attachment_count' => $report->attachments->count(),
                ];
            });

        return response()->json($reports);
    }

    public function getDailyReports($userId, $date)
    {
        // If userId is 'me', use authenticated user's ID
        if ($userId === 'me' || ! $userId) {
            $userId = Auth::id();
        }

        $reports = Report::where('user_id', $userId)
            ->where('report_date', $date)
            ->with(['tasks' => function ($query) {
                $query->withPivot('remarks'); // Include remarks from pivot table
            }, 'tasks.timeEntries' => function ($query) use ($date) {
                $query->where(function ($q) use ($date) {
                    $q->whereDate('start_time', $date)
                        ->orWhereDate('end_time', $date);
                })
                    ->where('is_active', false);
            }, 'attachments'])
            ->get();

        return response()->json($reports);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'report_date' => 'required|date',
            'selected_tasks' => 'nullable|array',
            'tasks_remarks' => 'nullable|array',
            'attachments' => 'nullable|array',
            'total_hours' => 'nullable',
        ]);

        $userId = Auth::id();

        // Create report
        $report = Report::create([
            'user_id' => $userId,
            'report_date' => $validated['report_date'],
            'title' => $validated['title'],
            'description' => $validated['description'],
            'status' => 'submitted',
            'total_hours' => $validated['total_hours'],
        ]);

        // Attach tasks to report with remarks
        if (! empty($validated['selected_tasks'])) {
            foreach ($validated['selected_tasks'] as $taskId) {
                $remarks = $validated['tasks_remarks'][$taskId] ?? null;
                $report->tasks()->attach($taskId, ['remarks' => $remarks]);
            }
        }

        // Handle attachments
        if ($request->hasFile('attachments')) {
            foreach ($request->file('attachments') as $file) {
                $this->storeAttachment($report, $file);
            }
        }

        $report->calculateTotalHours();
        $this->notificationService->sendReportSubmissionNotificationToManagers($report);

        return response()->json($report);
    }

    public function connectTaskToReport($reportId, $taskId)
    {
        $report = Report::findOrFail($reportId);
        $report->tasks()->attach($taskId);
        $report->calculateTotalHours();

        return response()->json(['message' => 'Task connected to report']);
    }

    public function disconnectTaskFromReport($reportId, $taskId)
    {
        $report = Report::findOrFail($reportId);
        $report->tasks()->detach($taskId);
        $report->calculateTotalHours();

        return response()->json(['message' => 'Task disconnected from report']);
    }

    /**
     * Store an attachment for a report with proper folder structure using Storage facade.
     */
    protected function storeAttachment(Report $report, $file)
    {
        // Create a structured folder path: reports/{report_id}/attachments
        $folderPath = "reports/{$report->id}/attachments";

        // Store the file using Storage facade with public visibility for access
        $path = Storage::disk('public')->put($folderPath, $file);

        // Create attachment record
        $attachment = $report->attachments()->create([
            'file_name' => $file->getClientOriginalName(),
            'file_path' => $path,
            'file_type' => $file->getMimeType(),
            'file_size' => $file->getSize(),
            'metadata' => [
                'original_name' => $file->getClientOriginalName(),
                'extension' => $file->getClientOriginalExtension(),
                'uploaded_by' => $report->user_id,
                'uploaded_at' => now()->toISOString(),
            ],
        ]);

        return $attachment;
    }

    public function addAttachment(Request $request, $reportId)
    {
        $report = Report::findOrFail($reportId);

        $request->validate([
            'file' => ['required', 'file', 'max:10240', 'mimes:jpg,jpeg,png,gif,pdf,doc,docx,xls,xlsx,txt'],
        ]);

        if ($request->hasFile('file')) {
            $file = $request->file('file');
            $attachment = $this->storeAttachment($report, $file);

            return response()->json($attachment);
        }

        return response()->json(['error' => 'No file uploaded'], 400);
    }

    public function getEmployeeReports(Request $request, $userId)
    {
        $query = Report::where('user_id', $userId)
            ->with(['user', 'tasks' => function ($query) {
                $query->withPivot('remarks'); // Include remarks from pivot table
            }, 'attachments'])
            ->orderBy('report_date', 'desc');

        if ($request->filled('start_date') && $request->filled('end_date')) {
            $query->whereBetween('report_date', [
                $request->start_date,
                $request->end_date,
            ]);
        }

        $perPage = $request->input('per_page', 10);

        return response()->json($query->paginate($perPage));
    }

    public function getAllReports(Request $request)
    {
        $query = Report::with(['user', 'tasks' => function ($query) {
            $query->withPivot('remarks'); // Include remarks from pivot table
        }, 'attachments'])
            ->orderBy('report_date', 'desc');

        if ($request->filled('start_date') && $request->filled('end_date')) {
            $query->whereBetween('report_date', [
                $request->start_date,
                $request->end_date,
            ]);
        }

        if ($request->filled('employee_id')) {
            $query->where('user_id', $request->employee_id);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('search')) {
            $searchTerm = $request->search;
            $query->where(function ($q) use ($searchTerm) {
                $q->where('title', 'like', "%{$searchTerm}%")
                    ->orWhere('description', 'like', "%{$searchTerm}%")
                    ->orWhereHas('user', function ($q) use ($searchTerm) {
                        $q->where('name', 'like', "%{$searchTerm}%");
                    })
                    ->orWhereHas('tasks', function ($q) use ($searchTerm) {
                        $q->where('title', 'like', "%{$searchTerm}%");
                    });
            });
        }

        $perPage = $request->input('per_page', 10);

        return response()->json($query->paginate($perPage));
    }

    /**
     * Display the reports page.
     */
    public function index()
    {
        $employees = User::all();

        return Inertia::render('admin/reports/Index', [
            'employees' => $employees,
            'authUser' => Auth::user(),
        ]);
    }

    /**
     * Display a single report.
     */
    public function show($id)
    {
        // First get the report date
        $reportDate = Report::where('id', $id)->value('report_date');

        // Load the report and relationships with timeEntries filtered by report date
        $report = Report::with(['user', 'tasks' => function ($query) {
            $query->withPivot('remarks');
        }, 'tasks.timeEntries' => function ($query) use ($reportDate) {
            $query->where(function ($q) use ($reportDate) {
                $q->whereDate('start_time', $reportDate)
                    ->orWhereDate('end_time', $reportDate);
            });
        }, 'attachments'])
            ->findOrFail($id);

        // Calculate working time for each time entry
        $workingHoursService = new WorkingHoursService;

        foreach ($report->tasks as $task) {
            $totalWorkingSeconds = 0;

            foreach ($task->timeEntries as $timeEntry) {
                $workingSeconds = $timeEntry->calculateDurationForDate($reportDate);
                $timeEntry->working_duration = $workingSeconds;
                $totalWorkingSeconds += $workingSeconds;
            }

            // Add total working duration to task
            $task->total_working_seconds = $totalWorkingSeconds;
        }

        return Inertia::render('admin/reports/Show', [
            'report' => $report,
            'authUser' => Auth::user(),
        ]);
    }

    /**
     * Display the edit form for a report.
     */
    public function edit($id)
    {
        // Get the report date
        $reportDate = Report::where('id', $id)->value('report_date');

        // Load the report and relationships with timeEntries filtered by report date
        $report = Report::with(['user', 'tasks' => function ($query) {
            $query->withPivot('remarks');
        }, 'tasks.timeEntries' => function ($query) use ($reportDate) {
            $query->where(function ($q) use ($reportDate) {
                $q->whereDate('start_time', $reportDate)
                    ->orWhereDate('end_time', $reportDate);
            });
        }, 'attachments'])
            ->findOrFail($id);

        // Check if user has permission to edit this report
        if ($report->user_id !== Auth::id()) {
            abort(403, 'Unauthorized to edit this report.');
        }

        // Check if report was created within the last 2 hours
        $createdAt = $report->created_at;
        $now = Carbon::now();
        if ($now->diffInHours($createdAt) > 2) {
            abort(403, 'Report can only be edited within 2 hours of creation.');
        }

        // Calculate working time for each time entry
        $workingHoursService = new WorkingHoursService;

        foreach ($report->tasks as $task) {
            $totalWorkingSeconds = 0;

            foreach ($task->timeEntries as $timeEntry) {
                $workingSeconds = $timeEntry->calculateDurationForDate($reportDate);
                $timeEntry->working_duration = $workingSeconds;
                $totalWorkingSeconds += $workingSeconds;
            }

            // Add total working duration to task
            $task->total_working_seconds = $totalWorkingSeconds;
        }

        return Inertia::render('admin/reports/Edit', [
            'report' => $report,
            'authUser' => Auth::user(),
        ]);
    }

    /**
     * Calculate working time in seconds considering work hours and holidays.
     */
    protected function calculateWorkingTimeSeconds(?string $startTime, ?string $endTime, WorkingHoursService $workingHoursService): int
    {
        if (empty($startTime) || empty($endTime)) {
            return 0;
        }

        $start = new Carbon($startTime);
        $end = new Carbon($endTime);

        // If end is before start, return 0
        if ($end->lt($start)) {
            return 0;
        }

        $workingSeconds = 0;
        $current = $start->copy();

        while ($current->lt($end)) {
            $currentDate = new Carbon($current->toDateString());

            // Check if it's a working day
            if (! $workingHoursService->isWorkingDay($currentDate)) {
                // Skip this day entirely
                $current->addDay()->startOfDay();

                continue;
            }

            $workingHours = $workingHoursService->getWorkingHoursForDate($currentDate);

            if (! $workingHours['start'] || ! $workingHours['end']) {
                $current->addDay()->startOfDay();

                continue;
            }

            // Calculate the working period boundaries for this day
            $dayStart = new Carbon($current->toDateString().' '.$workingHours['start']->format('H:i:s'));
            $dayEnd = new Carbon($current->toDateString().' '.$workingHours['end']->format('H:i:s'));

            // Adjust for break time
            $breakStart = $workingHours['break_start'] ? new Carbon($current->toDateString().' '.$workingHours['break_start']->format('H:i:s')) : null;
            $breakEnd = $workingHours['break_end'] ? new Carbon($current->toDateString().' '.$workingHours['break_end']->format('H:i:s')) : null;

            // Determine the effective end of work for this portion
            $effectiveStart = $current->gte($dayStart) ? $current : $dayStart;
            $effectiveEnd = $end->lte($dayEnd) ? $end : $dayEnd;

            if ($effectiveStart->gte($effectiveEnd)) {
                $current->addDay()->startOfDay();

                continue;
            }

            // Calculate duration
            $duration = $effectiveStart->diffInSeconds($effectiveEnd);

            // Subtract break time if overlapping
            if ($breakStart && $breakEnd) {
                $breakOverlap = max(0, min($effectiveEnd, $breakEnd) - max($effectiveStart, $breakStart));
                $duration -= $breakOverlap;
            }

            $workingSeconds += max(0, $duration);

            // Move to next day
            $current->addDay()->startOfDay();
        }

        return $workingSeconds;
    }

    public function update(Request $request, $reportId)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'tasks_remarks' => 'nullable|array',
        ]);

        $report = Report::findOrFail($reportId);

        // Check if user has permission to edit this report
        if ($report->user_id !== Auth::id()) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        // Check if report was created within the last 2 hours
        $createdAt = $report->created_at;
        $now = Carbon::now();
        if ($now->diffInHours($createdAt) > 2) {
            return response()->json(['error' => 'Report can only be edited within 2 hours of creation'], 403);
        }

        // Update report
        $report->update([
            'title' => $validated['title'],
            'description' => $validated['description'],
        ]);

        // Update task remarks (keep existing tasks, just update remarks)
        if (isset($validated['tasks_remarks']) && is_array($validated['tasks_remarks'])) {
            foreach ($validated['tasks_remarks'] as $taskId => $remarks) {
                $report->tasks()->updateExistingPivot($taskId, ['remarks' => $remarks]);
            }
        }

        return response()->json($report);
    }

    public function deleteAttachment($reportId, $attachmentId)
    {
        $report = Report::findOrFail($reportId);
        $attachment = ReportAttachment::where('id', $attachmentId)->where('report_id', $reportId)->firstOrFail();

        // Check if user has permission to delete this attachment
        if ($report->user_id !== Auth::id()) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        // Delete the file from storage
        Storage::disk('public')->delete($attachment->file_path);

        // Delete the attachment record
        $attachment->delete();

        return response()->json(['message' => 'Attachment deleted successfully']);
    }

    public function destroy($reportId)
    {
        $report = Report::findOrFail($reportId);

        // Check if user has permission to delete this report
        if ($report->user_id !== Auth::id()) {
            return response()->json(['error' => 'Unauthorized to delete this report.'], 403);
        }

        // Check if report was created within the last 2 hours
        $createdAt = $report->created_at;
        $now = Carbon::now();
        if ($now->diffInHours($createdAt) > 2) {
            return response()->json(['error' => 'Report can only be deleted within 2 hours of creation.'], 403);
        }

        // Delete all attachments and their files
        foreach ($report->attachments as $attachment) {
            Storage::disk('public')->delete($attachment->file_path);
            $attachment->delete();
        }

        // Delete the report
        $report->delete();

        // Clean up the empty directory
        $folderPath = "reports/{$report->id}";
        if (Storage::disk('public')->exists($folderPath)) {
            Storage::disk('public')->deleteDirectory($folderPath);
        }

        return response()->json(['message' => 'Report deleted successfully']);
    }

    /**
     * Get employees for the reports.
     */
    public function getEmployees()
    {
        $employees = User::all();

        return response()->json($employees);
    }

    /**
     * Get consolidated reports across multiple employees and date range.
     */
    public function getConsolidatedReports(Request $request)
    {
        $request->validate([
            'employee_ids' => 'required|array',
            'start_date' => 'required|date',
            'end_date' => 'required|date',
        ]);

        $employeeIds = $request->employee_ids;
        $startDate = $request->start_date;
        $endDate = $request->end_date;

        // Get all reports within date range for selected employees
        $reports = Report::whereIn('user_id', $employeeIds)
            ->whereBetween('report_date', [$startDate, $endDate])
            ->with(['user', 'tasks', 'attachments'])
            ->orderBy('report_date', 'asc')
            ->get();

        // Calculate consolidated statistics
        $totalReports = $reports->count();
        $totalHours = $reports->sum('total_hours');
        $uniqueEmployees = $reports->pluck('user_id')->unique()->count();
        $uniqueDates = $reports->pluck('report_date')->unique()->count();

        // Group reports by date
        $reportsByDate = $reports->groupBy('report_date')->map(function ($dateReports) {
            return [
                'date' => $dateReports->first()->report_date,
                'report_count' => $dateReports->count(),
                'total_hours' => $dateReports->sum('total_hours'),
                'reports' => $dateReports->map(function ($report) {
                    return [
                        'id' => $report->id,
                        'title' => $report->title,
                        'description' => $report->description,
                        'report_date' => $report->report_date,
                        'status' => $report->status,
                        'total_hours' => $report->total_hours,
                        'user_name' => $report->user->name,
                        'task_count' => $report->tasks->count(),
                        'attachment_count' => $report->attachments->count(),
                    ];
                }),
            ];
        })->values();

        // Group reports by employee
        $reportsByEmployee = $reports->groupBy('user_id')->map(function ($employeeReports) {
            $user = $employeeReports->first()->user;

            return [
                'user_id' => $user->id,
                'user_name' => $user->name,
                'email' => $user->email,
                'report_count' => $employeeReports->count(),
                'total_hours' => $employeeReports->sum('total_hours'),
                'reports' => $employeeReports->map(function ($report) {
                    return [
                        'id' => $report->id,
                        'title' => $report->title,
                        'report_date' => $report->report_date,
                        'status' => $report->status,
                        'total_hours' => $report->total_hours,
                        'task_count' => $report->tasks->count(),
                    ];
                }),
            ];
        })->values();

        return response()->json([
            'summary' => [
                'total_reports' => $totalReports,
                'total_hours' => $totalHours,
                'unique_employees' => $uniqueEmployees,
                'unique_dates' => $uniqueDates,
                'start_date' => $startDate,
                'end_date' => $endDate,
            ],
            'reports_by_date' => $reportsByDate,
            'reports_by_employee' => $reportsByEmployee,
            'all_reports' => $reports->map(function ($report) {
                return [
                    'id' => $report->id,
                    'title' => $report->title,
                    'description' => $report->description,
                    'report_date' => $report->report_date,
                    'status' => $report->status,
                    'total_hours' => $report->total_hours,
                    'user_name' => $report->user->name,
                    'user_id' => $report->user_id,
                    'task_count' => $report->tasks->count(),
                    'attachment_count' => $report->attachments->count(),
                ];
            }),
        ]);
    }

    /**
     * Export consolidated reports for admin.
     */
    public function exportConsolidatedReports(Request $request)
    {
        $validated = $request->validate([
            'employee_ids' => 'nullable|array',
            'employee_ids.*' => 'integer|exists:users,id',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'status' => 'nullable|string|in:draft,submitted,approved',
            'search' => 'nullable|string|max:255',
            'format' => 'nullable|string|in:csv,json',
        ]);

        $reportsQuery = Report::query()
            ->with([
                'user:id,name,email',
                'tasks:id,title',
                'attachments:id,report_id',
            ])
            ->whereBetween('report_date', [$validated['start_date'], $validated['end_date']]);

        if (! empty($validated['employee_ids'])) {
            $reportsQuery->whereIn('user_id', $validated['employee_ids']);
        }

        if (! empty($validated['status'])) {
            $reportsQuery->where('status', $validated['status']);
        }

        if (! empty($validated['search'])) {
            $searchTerm = $validated['search'];
            $reportsQuery->where(function ($query) use ($searchTerm) {
                $query->where('title', 'like', "%{$searchTerm}%")
                    ->orWhere('description', 'like', "%{$searchTerm}%")
                    ->orWhereHas('user', function ($userQuery) use ($searchTerm) {
                        $userQuery->where('name', 'like', "%{$searchTerm}%");
                    })
                    ->orWhereHas('tasks', function ($taskQuery) use ($searchTerm) {
                        $taskQuery->where('title', 'like', "%{$searchTerm}%");
                    });
            });
        }

        $reports = $reportsQuery->orderBy('report_date', 'asc')->get();

        $summary = [
            'total_reports' => $reports->count(),
            'total_hours' => (float) $reports->sum('total_hours'),
            'unique_employees' => $reports->pluck('user_id')->unique()->count(),
            'unique_dates' => $reports->pluck('report_date')->unique()->count(),
            'start_date' => $validated['start_date'],
            'end_date' => $validated['end_date'],
        ];

        $reportsByEmployee = $reports->groupBy('user_id')->map(function ($employeeReports) {
            $user = $employeeReports->first()->user;
            $totalHours = (float) $employeeReports->sum('total_hours');
            $reportCount = $employeeReports->count();

            return [
                'user_id' => $user?->id,
                'user_name' => $user?->name ?? 'Unknown',
                'email' => $user?->email ?? '',
                'report_count' => $reportCount,
                'total_hours' => $totalHours,
                'avg_hours_per_report' => $reportCount > 0 ? round($totalHours / $reportCount, 2) : 0,
            ];
        })->values();

        if (($validated['format'] ?? 'csv') === 'json') {
            return response()->json([
                'summary' => $summary,
                'reports_by_employee' => $reportsByEmployee,
                'all_reports' => $reports->map(function ($report) {
                    return [
                        'id' => $report->id,
                        'report_date' => $report->report_date,
                        'user_name' => $report->user?->name,
                        'user_email' => $report->user?->email,
                        'title' => $report->title,
                        'description' => $report->description,
                        'status' => $report->status,
                        'total_hours' => (float) $report->total_hours,
                        'task_count' => $report->tasks->count(),
                        'attachment_count' => $report->attachments->count(),
                    ];
                }),
            ]);
        }

        $filename = sprintf(
            'consolidated_reports_%s_to_%s.csv',
            $validated['start_date'],
            $validated['end_date']
        );

        $headers = [
            'Content-type' => 'text/csv',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
            'Pragma' => 'no-cache',
            'Cache-Control' => 'must-revalidate, post-check=0, pre-check=0',
            'Expires' => '0',
        ];

        $callback = function () use ($summary, $reportsByEmployee, $reports) {
            $file = fopen('php://output', 'w');

            fputcsv($file, ['Consolidated Reports Export']);
            fputcsv($file, ['Start Date', $summary['start_date']]);
            fputcsv($file, ['End Date', $summary['end_date']]);
            fputcsv($file, ['Total Reports', $summary['total_reports']]);
            fputcsv($file, ['Total Hours', $summary['total_hours']]);
            fputcsv($file, ['Unique Employees', $summary['unique_employees']]);
            fputcsv($file, ['Unique Dates', $summary['unique_dates']]);
            fputcsv($file, []);

            fputcsv($file, [
                'Employee ID',
                'Employee Name',
                'Email',
                'Report Count',
                'Total Hours',
                'Average Hours/Report',
            ]);

            foreach ($reportsByEmployee as $employeeSummary) {
                fputcsv($file, [
                    $employeeSummary['user_id'],
                    $employeeSummary['user_name'],
                    $employeeSummary['email'],
                    $employeeSummary['report_count'],
                    $employeeSummary['total_hours'],
                    $employeeSummary['avg_hours_per_report'],
                ]);
            }

            fputcsv($file, []);
            fputcsv($file, [
                'Report ID',
                'Date',
                'Employee',
                'Email',
                'Title',
                'Description',
                'Status',
                'Total Hours',
                'Task Count',
                'Attachment Count',
                'Task Titles',
            ]);

            foreach ($reports as $report) {
                fputcsv($file, [
                    $report->id,
                    $report->report_date,
                    $report->user?->name ?? 'Unknown',
                    $report->user?->email ?? '',
                    $report->title,
                    $report->description,
                    $report->status,
                    (float) $report->total_hours,
                    $report->tasks->count(),
                    $report->attachments->count(),
                    $report->tasks->pluck('title')->implode(' | '),
                ]);
            }

            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }
}
