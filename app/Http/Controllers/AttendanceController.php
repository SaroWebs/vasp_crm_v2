<?php

namespace App\Http\Controllers;

use App\Http\Requests\AttendanceOverrideRequest;
use App\Http\Requests\AttendanceUploadRequest;
use App\Models\Attendance;
use App\Models\Employee;
use App\Services\WorkingHoursService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class AttendanceController extends Controller
{
    // uploadPunchData is responsible to upload attendance from third party app
    public function uploadPunchData(AttendanceUploadRequest $request): JsonResponse
    {
        $punchTime = Carbon::parse($request->PunchTime);
        $date = $punchTime->toDateString();
        $time = $punchTime->toTimeString();

        $employee = Employee::where('code', $request->EmployeeId)->first();

        if ($employee && ! $request->EmployeeName) {
            $request->EmployeeName = $employee->name;
        }

        $attendance = Attendance::updateOrCreate(
            [
                'employee_id' => $request->EmployeeId,
                'attendance_date' => $date,
            ],
            [
                'machine_id' => $request->MachineId,
                'ip' => $request->Ip,
                'group_name' => $request->GroupName,
                'employee_name' => $request->EmployeeName,
                'is_live' => $request->Islive ?? false,
                'mode' => 'office',
            ]
        );

        // If punch_in is not set, this is the first punch of the day
        if (! $attendance->punch_in) {
            $attendance->update([
                'punch_in' => $time,
            ]);
        } else {
            // Update punch_out for every subsequent punch
            $attendance->update([
                'punch_out' => $time,
            ]);
        }

        return response()->json([
            'status' => 'success',
            'message' => 'Attendance recorded successfully',
            'data' => $attendance,
        ]);
    }

    // store
    public function punchEntry(Request $request): JsonResponse
    {
        $user = Auth::user();

        $validated = $request->validate([
            'mode' => ['nullable', 'string', 'in:remote,office'],
            'punch_time' => ['nullable', 'date'],
        ]);

        if (! $user || ! $user->employee) {
            return response()->json([
                'status' => 'error',
                'message' => 'Employee record not found for this user.',
            ], 404);
        }

        $employee = $user->employee;

        if (! $employee->code) {
            return response()->json([
                'status' => 'error',
                'message' => 'Employee code is required for attendance entry. Please contact admin to generate biometric employee ID.',
            ], 404);
        }

        $punchDateTime = ! empty($validated['punch_time'])
            ? Carbon::parse($validated['punch_time'])
            : now();

        $attendanceDate = $punchDateTime->toDateString();
        $timeOnly = $punchDateTime->toTimeString();

        $attendance = Attendance::firstOrCreate(
            [
                'employee_id' => $employee->code,
                'attendance_date' => $attendanceDate,
            ],
            [
                'employee_name' => $employee->name,
                'ip' => $request->ip(),
                'mode' => $validated['mode'] ?? 'office',
                'punch_in' => $timeOnly,
            ]
        );

        if ($attendance->wasRecentlyCreated) {
            $message = 'Punch-in recorded successfully.';
        } else {
            $attendance->update([
                'punch_out' => $timeOnly,
                'ip' => $request->ip(),
                'mode' => $validated['mode'] ?? $attendance->mode,
            ]);

            $message = 'Punch-out recorded successfully.';
        }

        return response()->json([
            'status' => 'success',
            'message' => $message,
            'data' => $attendance->fresh(),
        ]);
    }

    public function getEmployeeAttendance(Request $request): JsonResponse
    {
        $user = Auth::user();

        $validated = $request->validate([
            'month' => ['nullable', 'integer', 'in:1,2,3,4,5,6,7,8,9,10,11,12'],
            'year' => ['nullable', 'integer'],
        ]);

        if (! $user || ! $user->employee) {
            return response()->json([
                'status' => 'error',
                'message' => 'Employee record not found for this user.',
            ], 404);
        }

        $employee = $user->employee;

        if (! $employee->code) {
            return response()->json([
                'status' => 'error',
                'message' => 'Employee code is required for attendance entry. Please contact admin to generate biometric employee ID.',
            ], 404);
        }

        $attendance = Attendance::where('employee_id', $employee->code)
            ->whereMonth('attendance_date', $validated['month'] ?? date('m'))
            ->whereYear('attendance_date', $validated['year'] ?? date('Y'))
            ->get();

        $month = $validated['month'] ?? (int) date('m');
        $year = $validated['year'] ?? (int) date('Y');
        $summary = $this->computeSummary($attendance, $month, $year);

        /** @var WorkingHoursService $workingHoursService */
        $workingHoursService = app(WorkingHoursService::class);

        return response()->json([
            'status' => 'success',
            'message' => 'Employee attendance fetched successfully.',
            'data' => $attendance,
            'summary' => $summary,
            'calendar' => [
                'working_hours' => $workingHoursService->getWorkingHoursConfig(),
                'holidays' => $workingHoursService->getHolidaysForYear($year),
            ],
            'month' => $month,
            'year' => $year,
        ]);
    }

    /**
     * Inertia page: employee's own attendance calendar.
     */
    public function myAttendancePage(): Response
    {
        return Inertia::render('my/attendance/Index');
    }

    /**
     * Admin: render the per-employee attendance calendar page.
     */
    public function adminIndex(): Response
    {
        $employees = Employee::query()
            ->select(['id', 'name', 'code', 'department_id'])
            ->with('department:id,name')
            ->orderBy('name')
            ->get();

        return Inertia::render('admin/attendance/Index', [
            'employees' => $employees,
        ]);
    }

    /**
     * Admin: render the all-employees attendance summary page.
     */
    public function adminSummaryPage(): Response
    {
        return Inertia::render('admin/attendance/Summary');
    }

    /**
     * Unified API: fetch attendance for a specific employee (by ID or code).
     * Handles permission checks: employees can only view their own, managers/admins can view anyone.
     */
    public function getAttendance(Request $request, string $employeeId): JsonResponse
    {
        $user = Auth::user();

        if (! $user) {
            return response()->json([
                'status' => 'error',
                'message' => 'Unauthorized',
            ], 401);
        }

        $validated = $request->validate([
            'month' => ['nullable', 'integer', 'between:1,12'],
            'year' => ['nullable', 'integer'],
        ]);

        // Find employee by ID or code
        $employee = Employee::where('id', $employeeId)
            ->orWhere('code', $employeeId)
            ->first();

        if (! $employee || ! $employee->code) {
            return response()->json([
                'status' => 'error',
                'message' => 'Employee not found.',
            ], 404);
        }

        // Permission check: allow if user is admin/manager/hr or viewing their own attendance
        $canView = $user->hasRole(['admin', 'manager', 'hr']) ||
            ($user->employee && $user->employee->code === $employee->code);

        if (! $canView) {
            return response()->json([
                'status' => 'error',
                'message' => 'You do not have permission to view this attendance record.',
            ], 403);
        }

        $month = $validated['month'] ?? (int) date('m');
        $year = $validated['year'] ?? (int) date('Y');

        $records = Attendance::where('employee_id', $employee->code)
            ->whereMonth('attendance_date', $month)
            ->whereYear('attendance_date', $year)
            ->orderBy('attendance_date')
            ->get();

        $summary = $this->computeSummary($records, $month, $year);

        /** @var WorkingHoursService $workingHoursService */
        $workingHoursService = app(WorkingHoursService::class);

        return response()->json([
            'status' => 'success',
            'message' => 'Attendance fetched successfully.',
            'data' => $records,
            'summary' => $summary,
            'calendar' => [
                'working_hours' => $workingHoursService->getWorkingHoursConfig(),
                'holidays' => $workingHoursService->getHolidaysForYear($year),
            ],
            'month' => $month,
            'year' => $year,
        ]);
    }

    /**
     * Admin API: fetch a single employee's attendance for a given month/year.
     * Includes computed summary stats.
     */
    public function adminGetEmployeeAttendance(Request $request, Employee $employee): JsonResponse
    {
        $validated = $request->validate([
            'month' => ['nullable', 'integer', 'between:1,12'],
            'year' => ['nullable', 'integer'],
        ]);

        $month = $validated['month'] ?? (int) date('m');
        $year = $validated['year'] ?? (int) date('Y');

        $records = Attendance::where('employee_id', $employee->code)
            ->whereMonth('attendance_date', $month)
            ->whereYear('attendance_date', $year)
            ->orderBy('attendance_date')
            ->get();

        $summary = $this->computeSummary($records, $month, $year);

        /** @var WorkingHoursService $workingHoursService */
        $workingHoursService = app(WorkingHoursService::class);

        return response()->json([
            'status' => 'success',
            'message' => 'Attendance fetched successfully.',
            'data' => $records,
            'summary' => $summary,
            'calendar' => [
                'working_hours' => $workingHoursService->getWorkingHoursConfig(),
                'holidays' => $workingHoursService->getHolidaysForYear($year),
            ],
            'month' => $month,
            'year' => $year,
        ]);
    }

    /**
     * Admin API: fetch all employees with their attendance summary for a given month/year.
     */
    public function adminGetAllAttendanceSummary(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'month' => ['nullable', 'integer', 'between:1,12'],
            'year' => ['nullable', 'integer'],
        ]);

        $month = $validated['month'] ?? (int) date('m');
        $year = $validated['year'] ?? (int) date('Y');

        $employees = Employee::query()
            ->with([
                'department:id,name',
                'attendances' => function ($query) use ($month, $year) {
                    $query->whereMonth('attendance_date', $month)
                        ->whereYear('attendance_date', $year);
                },
            ])
            ->orderBy('name')
            ->get();

        $result = $employees->map(function (Employee $employee) use ($month, $year) {
            $summary = $this->computeSummary($employee->attendances, $month, $year);

            return [
                'id' => $employee->id,
                'name' => $employee->name,
                'code' => $employee->code,
                'department' => $employee->department?->name,
                'summary' => $summary,
            ];
        });

        return response()->json([
            'status' => 'success',
            'message' => 'Attendance summary fetched successfully.',
            'data' => $result,
            'month' => $month,
            'year' => $year,
        ]);
    }

    /**
     * Admin API: manually add a punch for an employee using the same
     * punch_time → punch_in / punch_out derivation used by punchEntry.
     */
    public function adminOverrideAttendance(AttendanceOverrideRequest $request, Employee $employee): JsonResponse
    {
        if (! $employee->code) {
            return response()->json([
                'status' => 'error',
                'message' => 'This employee has no biometric code. Cannot record attendance.',
            ], 422);
        }

        $attendance = Attendance::updateOrCreate(
            [
                'employee_id' => $employee->code,
                'attendance_date' => Carbon::parse($request->attendance_date)->toDateString(),
            ],
            [
                'employee_name' => $employee->name,
                'mode' => $request->mode ?? 'office',
                'punch_in' => Carbon::createFromFormat('H:i', $request->punch_in)->format('H:i:s'),
                'punch_out' => $request->punch_out
                    ? Carbon::createFromFormat('H:i', $request->punch_out)->format('H:i:s')
                    : null,
            ]
        );

        return response()->json([
            'status' => 'success',
            'message' => 'Attendance updated successfully.',
            'data' => $attendance,
        ]);
    }

    /**
     * Admin API: delete an attendance record.
     */
    public function adminDeleteAttendance(Attendance $attendance): JsonResponse
    {
        $attendance->delete();

        return response()->json([
            'status' => 'success',
            'message' => 'Attendance record deleted successfully.',
        ]);
    }

    /**
     * Compute summary stats for a collection of attendance records for a given month.
     *
     * @param  Collection<int, Attendance>  $records
     * @return array{total_working_days: int, present_days: int, absent_days: int, late_days: int, total_hours: float}
     */
    private function computeSummary(Collection $records, int $month, int $year): array
    {
        $periodStart = Carbon::create($year, $month, 1)->startOfMonth();
        $periodEnd = Carbon::create($year, $month, 1)->endOfMonth();
        $today = Carbon::today();

        /** @var WorkingHoursService $workingHoursService */
        $workingHoursService = app(WorkingHoursService::class);

        // Count configured working days up to today (or end of month)
        $boundary = $periodEnd->lt($today) ? $periodEnd : $today;
        $totalWorkingDays = 0;
        $cursor = $periodStart->copy();

        while ($cursor->lte($boundary)) {
            if ($workingHoursService->isWorkingDay($cursor)) {
                $totalWorkingDays++;
            }
            $cursor->addDay();
        }

        $presentDays = $records->count();
        $absentDays = max(0, $totalWorkingDays - $presentDays);

        // Late = punch_in after configured workday start time
        $lateDays = $records->filter(function (Attendance $record) use ($workingHoursService) {
            if (! $record->punch_in || ! $record->attendance_date) {
                return false;
            }

            $date = Carbon::parse($record->attendance_date);
            $workingHours = $workingHoursService->getWorkingHoursForDate($date);

            if (! $workingHours['start']) {
                return false;
            }

            return $record->punch_in > $workingHours['start']->format('H:i:s');
        })->count();

        // Total hours = sum of (punch_out - punch_in) in hours
        $totalHours = $records->sum(function (Attendance $record) {
            if (! $record->punch_in || ! $record->punch_out) {
                return 0;
            }

            $in = Carbon::parse($record->punch_in);
            $out = Carbon::parse($record->punch_out);

            return $out->diffInMinutes($in) / 60;
        });

        return [
            'total_days' => $totalWorkingDays,
            'total_working_days' => $totalWorkingDays,
            'present_days' => $presentDays,
            'absent_days' => $absentDays,
            'late_days' => $lateDays,
            'total_hours' => round($totalHours, 2),
        ];
    }
}
