<?php

namespace App\Http\Controllers;

use App\Http\Requests\AttendanceOverrideRequest;
use App\Http\Requests\AttendanceUploadRequest;
use App\Models\Attendance;
use App\Models\Employee;
use App\Models\LeaveBalance;
use App\Models\LeaveRequest;
use App\Models\Punch;
use App\Models\RemoteWorkRequest;
use App\Models\Visitor;
use App\Models\VisitorPunch;
use App\Services\AttendanceCalculationService;
use App\Services\NotificationService;
use App\Services\WorkingHoursService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response;

class AttendanceController extends Controller
{
    private const MACHINE_ID_PUNCH_IN = 3;

    private const MACHINE_ID_PUNCH_OUT = 1;

    private const MACHINE_ID_IN_OUT = 2;

    public function getTodaysAttendance(Request $request): JsonResponse
    {
        $user = Auth::user();

        if (! $user || ! $user->employee) {
            return response()->json([
                'status' => 'error',
                'message' => 'Employee record not found for this user.',
            ], 404);
        }

        $employee = $user->employee;
        $today = Carbon::today()->toDateString();

        if (! $employee->code) {
            return response()->json([
                'status' => 'error',
                'message' => 'Employee code is required for attendance entry. Please contact admin to generate biometric employee ID.',
            ], 404);
        }

        $attendance = Attendance::where('employee_id', $employee->code)
            ->where('attendance_date', $today)
            ->first();

        $shiftMeta = app(AttendanceCalculationService::class)
            ->resolveEffectiveShiftForEmployeeDate($employee->code, $today);

        if ($attendance) {
            $data = $this->decorateAttendanceWithShiftMetrics($attendance);
            $data['status'] = app(AttendanceCalculationService::class)
                ->determineAttendanceStatus($data);
        } else {
            $data = array_merge([
                'attendance_date' => $today,
                'punch_in' => null,
                'punch_out' => null,
                'mode' => 'office',
            ], $shiftMeta);
            $data['status'] = app(AttendanceCalculationService::class)
                ->determineAttendanceStatus($data);
        }

        $shift = [
            'shift_id' => $shiftMeta['shift_id'],
            'start_time' => $shiftMeta['start_time'],
            'end_time' => $shiftMeta['end_time'],
            'grace_minutes' => $shiftMeta['grace_minutes'],
            'is_half_day' => $shiftMeta['is_half_day'] ?? false,
            'is_leave_day' => $shiftMeta['is_leave_day'] ?? false,
            'is_holiday' => $shiftMeta['is_holiday'] ?? false,
            'is_field_work' => $shiftMeta['is_field_work'] ?? false,
            'is_remote_work' => $shiftMeta['is_remote_work'] ?? false,
        ];

        return response()->json([
            'status' => 'success',
            'data' => array_merge($data, ['shift' => $shift]),
        ]);
    }

    public function getLeaveRequests(Request $request): JsonResponse
    {
        $user = Auth::user();

        if (! $user || ! $user->employee) {
            return response()->json([
                'status' => 'error',
                'message' => 'Employee record not found for this user.',
            ], 404);
        }

        $employee = $user->employee;

        $validated = $request->validate([
            'month' => ['nullable', 'integer', 'in:1,2,3,4,5,6,7,8,9,10,11,12'],
            'year' => ['nullable', 'integer'],
        ]);

        $month = $validated['month'] ?? (int) now()->month;
        $year = $validated['year'] ?? (int) now()->year;

        $leaveRequests = LeaveRequest::query()
            ->where('employee_id', $employee->id)
            ->whereMonth('start_date', $month)
            ->whereYear('start_date', $year)
            ->with('leaveType:id,name')
            ->orderBy('start_date', 'desc')
            ->get()
            ->map(fn ($request) => [
                'id' => $request->id,
                'leave_type' => $request->leaveType ? ['name' => $request->leaveType->name] : null,
                'start_date' => $request->start_date->toDateString(),
                'end_date' => $request->end_date->toDateString(),
                'reason' => $request->reason,
                'status' => $request->status,
                'requested_at' => $request->created_at->toIso8601String(),
            ]);

        return response()->json([
            'status' => 'success',
            'data' => $leaveRequests,
            'month' => $month,
            'year' => $year,
        ]);
    }

    public function storeLeaveRequest(Request $request): JsonResponse
    {
        $user = Auth::user();

        if (! $user || ! $user->employee) {
            return response()->json([
                'status' => 'error',
                'message' => 'Employee record not found for this user.',
            ], 404);
        }

        $employee = $user->employee;

        $validated = $request->validate([
            'leave_type_id' => ['required', 'exists:leave_types,id'],
            'start_date' => ['required', 'date'],
            'end_date' => ['required', 'date', 'after_or_equal:start_date'],
            'reason' => ['required', 'string', 'min:10'],
        ]);

        $leaveRequest = LeaveRequest::create([
            'employee_id' => $employee->id,
            'leave_type_id' => $validated['leave_type_id'],
            'start_date' => $validated['start_date'],
            'end_date' => $validated['end_date'],
            'reason' => $validated['reason'],
            'status' => 'pending',
            'requested_by_user_id' => $user->id,
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Leave request submitted successfully.',
            'data' => $leaveRequest,
        ], 201);
    }

    public function getRemoteWorkRequests(Request $request): JsonResponse
    {
        $user = Auth::user();

        if (! $user || ! $user->employee) {
            return response()->json([
                'status' => 'error',
                'message' => 'Employee record not found for this user.',
            ], 404);
        }

        $employee = $user->employee;

        $validated = $request->validate([
            'month' => ['nullable', 'integer', 'in:1,2,3,4,5,6,7,8,9,10,11,12'],
            'year' => ['nullable', 'integer'],
        ]);

        $month = $validated['month'] ?? (int) now()->month;
        $year = $validated['year'] ?? (int) now()->year;

        $remoteWorkRequests = RemoteWorkRequest::query()
            ->where('employee_id', $employee->id)
            ->whereMonth('start_date', $month)
            ->whereYear('start_date', $year)
            ->orderBy('start_date', 'desc')
            ->get()
            ->map(fn ($request) => [
                'id' => $request->id,
                'start_date' => $request->start_date->toDateString(),
                'end_date' => $request->end_date->toDateString(),
                'reason' => $request->reason,
                'status' => $request->status,
                'requested_at' => $request->created_at->toIso8601String(),
            ]);

        return response()->json([
            'status' => 'success',
            'data' => $remoteWorkRequests,
            'month' => $month,
            'year' => $year,
        ]);
    }

    public function storeRemoteWorkRequest(Request $request): JsonResponse
    {
        $user = Auth::user();

        if (! $user || ! $user->employee) {
            return response()->json([
                'status' => 'error',
                'message' => 'Employee record not found for this user.',
            ], 404);
        }

        $employee = $user->employee;

        $validated = $request->validate([
            'start_date' => ['required', 'date'],
            'end_date' => ['required', 'date', 'after_or_equal:start_date'],
            'reason' => ['required', 'string', 'min:10'],
        ]);

        $remoteWorkRequest = RemoteWorkRequest::create([
            'employee_id' => $employee->id,
            'start_date' => $validated['start_date'],
            'end_date' => $validated['end_date'],
            'reason' => $validated['reason'],
            'status' => 'pending',
            'requested_by_user_id' => $user->id,
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Remote work request submitted successfully.',
            'data' => $remoteWorkRequest,
        ], 201);
    }

    public function getLeaveBalances(Request $request): JsonResponse
    {
        $user = Auth::user();

        if (! $user || ! $user->employee) {
            return response()->json([
                'status' => 'error',
                'message' => 'Employee record not found for this user.',
            ], 404);
        }

        $employee = $user->employee;

        $validated = $request->validate([
            'year' => ['nullable', 'integer'],
        ]);

        $year = $validated['year'] ?? (int) now()->year;

        $leaveBalances = LeaveBalance::query()
            ->where('employee_id', $employee->id)
            ->where('year', $year)
            ->with('leaveType:id,name')
            ->get()
            ->map(fn ($balance) => [
                'leave_type' => $balance->leaveType ? ['id' => $balance->leaveType->id, 'name' => $balance->leaveType->name] : null,
                'opening_leaves' => $balance->opening_leaves,
                'assigned_leaves' => $balance->assigned_leaves,
                'number_of_leaves' => $balance->assigned_leaves,
                'consumed_leaves' => $balance->consumed_leaves,
                'used_leaves' => $balance->consumed_leaves,
                'remaining_leaves' => $balance->remaining_leaves,
                'available_balance' => $balance->getAvailableBalance(),
                'available_leaves' => $balance->getAvailableBalance(),
            ]);

        return response()->json([
            'status' => 'success',
            'data' => $leaveBalances,
            'year' => $year,
        ]);
    }

    public function uploadPunchData(AttendanceUploadRequest $request): JsonResponse
    {
        $punches = $request->validated();
        $stored = 0;

        foreach ($punches as $punchData) {
            $punchDateTime = $this->parseAttendanceDateTime($punchData['PunchTime']);
            $employeeId = $punchData['EmployeeId'];

            // Check if this is a visitor code
            $isVisitor = Visitor::where('code', $employeeId)->exists();

            if ($isVisitor) {
                // Store visitor punch in VisitorPunch table
                VisitorPunch::updateOrCreate(
                    [
                        'visitor_code' => $employeeId,
                        'punch_time' => $punchDateTime,
                    ],
                    [
                        'machine_id' => $punchData['MachineId'] ?? null,
                        'ip' => $punchData['Ip'] ?? null,
                        'is_live' => false,
                    ]
                );

                if (! empty($punchData['Islive']) || $punchData['Islive'] === true) {
                    $this->sendVisitorPunchNotification($punchData);
                }
            } else {
                // Original employee flow (unchanged)
                Punch::updateOrCreate(
                    [
                        'EmployeeId' => $employeeId,
                        'PunchTime' => $punchDateTime,
                    ],
                    [
                        'MachineId' => $punchData['MachineId'] ?? null,
                        'Ip' => $punchData['Ip'] ?? null,
                        'GroupName' => $punchData['GroupName'] ?? null,
                        'EmployeeName' => $punchData['EmployeeName'] ?? null,
                        'Islive' => false,
                    ]
                );

                $this->syncAttendanceFromPunches(
                    (string) $employeeId,
                    $punchDateTime,
                    'office'
                );

                if (! empty($punchData['Islive']) || $punchData['Islive'] === true) {
                    $this->sendLivePunchNotification($punchData);

                }
            }

            $stored++;
        }

        return response()->json([
            'status' => 'success',
            'message' => "Attendance recorded successfully. {$stored} punch(es) processed.",
        ]);
    }

    public function getDailyDetails(Request $request)
    {
        $date = Carbon::parse($request->query('date', today()));
        $employeeCodesWithPunches = Punch::whereDate('PunchTime', $date->toDateString())
            ->pluck('EmployeeId')
            ->unique()
            ->toArray();

        $employees = Employee::whereIn('code', $employeeCodesWithPunches)
            ->whereHas('user', function ($query) {
                $query->where('status', 'active');
            })
            ->with('user')
            ->get();

        $records = $employees->map(function ($emp) use ($date) {
            $summary = $this->getAttendanceSummary($emp->code, $date);

            return array_merge($summary, [
                'employee_name' => $emp->name,
                'office' => $emp->offices()->wherePivot('is_active', true)->pluck('name')->first() ?? 'N/A',
            ]);
        });

        return response()->json(['records' => $records, 'date' => $date->toDateString()]);
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
            ? $this->parseAttendanceDateTime($validated['punch_time'])
            : now();

        $attendanceDate = $punchDateTime->toDateString();
        $timeOnly = $punchDateTime->toTimeString();

        $existingPunchCount = Punch::where('EmployeeId', $employee->code)
            ->whereDate('PunchTime', $attendanceDate)
            ->count();

        if ($this->hasPunchWithinTenSeconds($employee->code, $punchDateTime)) {
            return response()->json([
                'status' => 'success',
                'message' => 'Punch ignored because a nearby punch already exists within one minute.',
            ]);
        }

        $newPunch = Punch::create([
            'EmployeeId' => $employee->code,
            'MachineId' => null,
            'PunchTime' => $punchDateTime,
            'Ip' => $request->ip(),
            'GroupName' => null,
            'EmployeeName' => $employee->name,
            'Islive' => false,
        ]);

        $this->syncAttendanceFromPunches(
            $employee->code,
            $punchDateTime,
            $validated['mode'] ?? 'office'
        );

        $message = ($existingPunchCount % 2 === 0)
            ? 'Punch-in recorded successfully.'
            : 'Punch-out recorded successfully.';

        return response()->json([
            'status' => 'success',
            'message' => $message,
            'data' => $newPunch,
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
            ->orderBy('attendance_date')
            ->orderBy('punch_in')
            ->get();
        $attendanceData = $attendance->map(fn (Attendance $record) => $this->decorateAttendanceWithShiftMetrics($record))->values();

        $month = $validated['month'] ?? (int) date('m');
        $year = $validated['year'] ?? (int) date('Y');
        $summary = $this->computeSummary($attendance, $month, $year);
        $calendarDays = $this->buildAttendanceCalendarDays($employee, $attendanceData, $month, $year);

        /** @var WorkingHoursService $workingHoursService */
        $workingHoursService = app(WorkingHoursService::class);

        return response()->json([
            'status' => 'success',
            'message' => 'Employee attendance fetched successfully.',
            'data' => $attendanceData,
            'summary' => $summary,
            'calendar' => [
                'working_hours' => $workingHoursService->getWorkingHoursConfig(),
                'holidays' => $workingHoursService->getHolidaysForYear($year),
                'days' => $calendarDays,
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
            ->where('status', 'active')
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
        $validated = $request->validate([
            'month' => ['nullable', 'integer', 'between:1,12'],
            'year' => ['nullable', 'integer', 'min:2000', 'max:2100'],
        ]);

        /** @var User|null $user */
        $user = Auth::user();

        if (! $user) {
            return response()->json([
                'status' => 'error',
                'message' => 'Unauthorized.',
            ], 401);
        }

        if (! $user->hasRole(['admin', 'manager', 'hr'])) {
            $user->loadMissing('employee');
        }

        $employee = Employee::where('id', $employeeId)->first();

        if (! $employee || ! $employee->code) {
            return response()->json([
                'status' => 'error',
                'message' => 'Employee not found.',
            ], 404);
        }

        $canView = ! $user->employee
            || $user->hasRole(['admin', 'manager', 'hr'])
            || (string) $user->employee->code === (string) $employee->code;

        if (! $canView) {
            Log::warning('Unauthorized attendance access attempt', [
                'user_id' => $user->id,
                'user_email' => $user->email,
                'user_roles' => $user->getRoleNames(),
                'user_employee' => $user->employee->code,
                'requested_employee' => $employee->code,
                'ip' => $request->ip(),
                'user_agent' => $request->userAgent(),
                'timestamp' => now()->toDateTimeString(),
            ]);

            return response()->json([
                'status' => 'error',
                'message' => 'You do not have permission to view this attendance record.',
            ], 403);
        }

        $month = $validated['month'] ?? (int) now()->month;
        $year = $validated['year'] ?? (int) now()->year;

        $records = Attendance::where('employee_id', $employee->code)
            ->whereMonth('attendance_date', $month)
            ->whereYear('attendance_date', $year)
            ->orderBy('attendance_date')
            ->orderBy('punch_in')
            ->get();
        $recordsData = $records->map(fn (Attendance $record) => $this->decorateAttendanceWithShiftMetrics($record))->values();

        $summary = $this->computeSummary($records, $month, $year);
        $calendarDays = $this->buildAttendanceCalendarDays($employee, $recordsData, $month, $year);

        /** @var WorkingHoursService $workingHoursService */
        $workingHoursService = app(WorkingHoursService::class);

        return response()->json([
            'status' => 'success',
            'message' => 'Attendance fetched successfully.',
            'data' => $recordsData,
            'summary' => $summary,
            'calendar' => [
                'working_hours' => $workingHoursService->getWorkingHoursConfig(),
                'holidays' => $workingHoursService->getHolidaysForYear($year),
                'days' => $calendarDays,
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
            ->orderBy('punch_in')
            ->get();
        $recordsData = $records->map(fn (Attendance $record) => $this->decorateAttendanceWithShiftMetrics($record))->values();

        $summary = $this->computeSummary($records, $month, $year);
        $calendarDays = $this->buildAttendanceCalendarDays($employee, $recordsData, $month, $year);

        /** @var WorkingHoursService $workingHoursService */
        $workingHoursService = app(WorkingHoursService::class);

        return response()->json([
            'status' => 'success',
            'message' => 'Attendance fetched successfully.',
            'data' => $recordsData,
            'summary' => $summary,
            'calendar' => [
                'working_hours' => $workingHoursService->getWorkingHoursConfig(),
                'holidays' => $workingHoursService->getHolidaysForYear($year),
                'days' => $calendarDays,
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

        $attendanceDate = Carbon::parse($request->attendance_date)->toDateString();
        $punchIn = Carbon::createFromFormat('H:i', $request->punch_in)->format('H:i:s');
        $punchOut = $request->punch_out
            ? Carbon::createFromFormat('H:i', $request->punch_out)->format('H:i:s')
            : null;
        $attendance = Attendance::updateOrCreate(
            [
                'employee_id' => $employee->code,
                'attendance_date' => $attendanceDate,
            ],
            [
                'employee_name' => $employee->name,
                'mode' => $request->mode ?? 'office',
                'punch_in' => $punchIn,
                'punch_out' => $punchOut,
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
     * Admin API: get all attendance records for a specific date.
     * Returns simple list of attendance records (including those with missing punch_out).
     */
    public function getAttendanceByDate(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'date' => ['required', 'date'],
        ]);

        $date = Carbon::parse($validated['date'])->toDateString();

        $records = Attendance::where('attendance_date', $date)
            ->orderBy('attendance_date')
            ->get();

        $records->transform(function ($attendance) {
            if (empty($attendance->employee_name)) {
                $employee = Employee::where('code', $attendance->employee_id)->first();

                if ($employee) {
                    $attendance->employee_name = $employee->name;
                }
            }

            return $this->decorateAttendanceWithShiftMetrics($attendance);
        });

        return response()->json([
            'status' => 'success',
            'message' => 'Attendance records fetched successfully.',
            'data' => $records,
        ]);
    }

    /**
     * Compute summary stats for a collection of attendance records for a given month.
     *
     * @param  Collection<int, Attendance>  $records
     * @return array{total_working_days: int, present_days: int, absent_days: int, late_days: int, early_out_days: int, total_late_minutes: int, total_early_out_minutes: int, total_hours: float}
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

        $presentDays = $records->groupBy('attendance_date')->count();
        $absentDays = max(0, $totalWorkingDays - $presentDays);

        $dailyShiftMetrics = $records->groupBy('attendance_date')->map(function (Collection $group) {
            $record = $group->sortBy('punch_in')->first();

            if (! $record || ! $record->punch_in || ! $record->attendance_date) {
                return [
                    'is_late_in' => false,
                    'is_early_in' => false,
                    'is_early_out' => false,
                    'is_late_out' => false,
                    'late_in_minutes' => 0,
                    'early_in_minutes' => 0,
                    'early_out_minutes' => 0,
                    'late_out_minutes' => 0,
                ];
            }

            $date = Carbon::parse($record->attendance_date);
            $attendanceDate = $date->toDateString();
            $shiftMeta = $this->resolveEffectiveShiftForEmployeeDate((string) $record->employee_id, $attendanceDate);

            return $this->buildShiftMetrics($attendanceDate, $record->punch_in, $record->punch_out, $shiftMeta);
        });

        $lateDays = $dailyShiftMetrics->filter(fn (array $metrics) => $metrics['is_late_in'])->count();
        $earlyOutDays = $dailyShiftMetrics->filter(fn (array $metrics) => $metrics['is_early_out'])->count();
        $totalLateMinutes = (int) $dailyShiftMetrics->sum(fn (array $metrics) => $metrics['late_in_minutes']);
        $totalEarlyOutMinutes = (int) $dailyShiftMetrics->sum(fn (array $metrics) => $metrics['early_out_minutes']);

        // Total hours = sum of actual work minutes from shift metrics converted to hours
        // This uses the calculated total_work_minutes which properly handles punch times
        // accounting for early_in, late_out, and other variations
        $totalHours = $dailyShiftMetrics->sum(function (array $metrics) {
            $workMinutes = $metrics['total_work_minutes'] ?? null;
            if ($workMinutes === null) {
                return 0;
            }

            return abs($workMinutes) / 60;
        });

        return [
            'total_days' => $totalWorkingDays,
            'total_working_days' => $totalWorkingDays,
            'present_days' => $presentDays,
            'absent_days' => $absentDays,
            'late_days' => $lateDays,
            'early_out_days' => $earlyOutDays,
            'total_late_minutes' => $totalLateMinutes,
            'total_early_out_minutes' => $totalEarlyOutMinutes,
            'total_hours' => round($totalHours, 2),
        ];
    }

    /**
     * Build a blank segment array for a punch.
     */
    private function makeSegment(
        string $employeeId,
        string $attendanceDate,
        ?int $machineId,
        ?string $punchIn,
        $punch,
        string $mode,
        Carbon $now
    ): array {
        return [
            'employee_id' => $employeeId,
            'machine_id' => $machineId,
            'attendance_date' => $attendanceDate,
            'punch_in' => $punchIn,
            'punch_out' => null,
            'ip' => $punch['Ip'],
            'employee_name' => $punch['EmployeeName'],
            'group_name' => $punch['GroupName'],
            'is_live' => $punch['Islive'] ? 1 : 0,
            'mode' => $mode,
            'created_at' => $now,
            'updated_at' => $now,
        ];
    }

    private function syncAttendanceFromPunches(string $employeeId, Carbon $punchDate, string $mode = 'office'): void
    {
        $attendanceDate = $punchDate->toDateString();
        $punches = Punch::where('EmployeeId', $employeeId)
            ->whereDate('PunchTime', $attendanceDate)
            ->orderBy('PunchTime')
            ->get();

        Attendance::where('employee_id', $employeeId)
            ->where('attendance_date', $attendanceDate)
            ->delete();

        if ($punches->isEmpty()) {
            return;
        }

        $collapsed = collect();
        $lastRole = null; // 'in' | 'out' | 'inout' | 'unknown'

        foreach ($punches as $punch) {
            $mid = $punch['MachineId'] !== null ? (int) $punch['MachineId'] : null;

            if ($this->isPunchInMachine($mid)) {
                if ($lastRole === 'in') {
                    // Consecutive IN: skip — first IN already captured
                    continue;
                }
                $lastRole = 'in';
                $collapsed->push($punch);

            } elseif ($this->isPunchOutMachine($mid)) {
                if ($lastRole === 'out') {
                    // Consecutive OUT: replace previous with this later one
                    $collapsed->pop();
                }
                $lastRole = 'out';
                $collapsed->push($punch);

            } else {
                // in-out machine or unknown — always keep
                $lastRole = $this->isInOutMachine($mid) ? 'inout' : 'unknown';
                $collapsed->push($punch);
            }
        }

        // ---------------------------------------------------------------
        // SEGMENT BUILD (unchanged logic, now on deduplicated punches)
        // ---------------------------------------------------------------
        $now = Carbon::now();
        $segments = [];
        $open = null;

        foreach ($collapsed as $punch) {
            $mid = $punch['MachineId'] !== null ? (int) $punch['MachineId'] : null;
            $time = $punch['PunchTime']->format('H:i:s');

            if ($this->isPunchInMachine($mid)) {
                if ($open !== null) {
                    $segments[] = $open;
                }
                $open = $this->makeSegment($employeeId, $attendanceDate, $mid, $time, $punch, $mode, $now);

                continue;
            }

            if ($this->isPunchOutMachine($mid)) {
                if ($open === null) {
                    $seg = $this->makeSegment($employeeId, $attendanceDate, $mid, null, $punch, $mode, $now);
                    $seg['punch_out'] = $time;
                    $seg['punch_in'] = null;
                    $segments[] = $seg;
                } else {
                    $open['punch_out'] = $time;
                    if ($punch['Ip']) {
                        $open['ip'] = $punch['Ip'];
                    }
                    if ($punch['Islive']) {
                        $open['is_live'] = 1;
                    }
                    $segments[] = $open;
                    $open = null;
                }

                continue;
            }

            if ($this->isInOutMachine($mid)) {
                if ($open === null) {
                    $open = $this->makeSegment($employeeId, $attendanceDate, $mid, $time, $punch, $mode, $now);
                } else {
                    $open['punch_out'] = $time;
                    if ($punch['Ip']) {
                        $open['ip'] = $punch['Ip'];
                    }
                    if ($punch['Islive']) {
                        $open['is_live'] = 1;
                    }
                    $segments[] = $open;
                    $open = null;
                }

                continue;
            }

            // unknown/null machine
            if ($open !== null) {
                $segments[] = $open;
            }
            $open = $this->makeSegment($employeeId, $attendanceDate, $mid, $time, $punch, $mode, $now);
        }

        if ($open !== null) {
            $segments[] = $open;
        }

        Attendance::insert($segments);
    }

    private function isPunchInMachine(?int $machineId): bool
    {
        return $machineId === self::MACHINE_ID_PUNCH_IN;
    }

    private function isPunchOutMachine(?int $machineId): bool
    {
        return $machineId === self::MACHINE_ID_PUNCH_OUT;
    }

    private function isInOutMachine(?int $machineId): bool
    {
        return $machineId === self::MACHINE_ID_IN_OUT;
    }

    private function hasPunchWithinTenSeconds(string $employeeId, Carbon $punchDateTime, bool $excludeExact = false): bool
    {
        $query = Punch::where('EmployeeId', $employeeId)
            ->whereBetween('PunchTime', [
                $punchDateTime->copy()->subSeconds(10),
                $punchDateTime->copy()->addSeconds(10),
            ]);

        if ($excludeExact) {
            $query->where('PunchTime', '!=', $punchDateTime);
        }

        return $query->exists();
    }

    /**
     * Resolve the effective attendance schedule for an employee and date.
     * Uses shift assignment if available, otherwise falls back to configured working hours.
     * Holidays and non-working days return a null schedule.
     *
     * @return array{shift_id: ?int, start_time: ?string, end_time: ?string, grace_minutes: int, is_half_day: bool}
     */
    private function resolveEffectiveShiftForEmployeeDate(string $employeeCode, string $attendanceDate): array
    {
        return app(AttendanceCalculationService::class)->resolveEffectiveShiftForEmployeeDate($employeeCode, $attendanceDate);
    }

    /**
     * @param  array{shift_id: ?int, start_time: ?string, end_time: ?string, grace_minutes: int, is_half_day: bool}  $shiftMeta
     * @return array{shift_id: ?int, start_time: ?string, end_time: ?string, is_half_day: bool, scheduled_hours: float, punch_in: ?string, punch_out: ?string, early_in_minutes: int, late_in_minutes: int, early_out_minutes: int, late_out_minutes: int, is_early_in: bool, is_late_in: bool, is_early_out: bool, is_late_out: bool, overtime_minutes: int, total_work_minutes: ?int}
     */
    private function buildShiftMetrics(string $attendanceDate, ?string $punchIn, ?string $punchOut, array $shiftMeta): array
    {
        return app(AttendanceCalculationService::class)->buildShiftMetrics($attendanceDate, $punchIn, $punchOut, $shiftMeta);
    }

    /**
     * @return array<string, mixed>
     */
    private function decorateAttendanceWithShiftMetrics(Attendance $attendance): array
    {
        $attendanceDate = Carbon::parse($attendance->attendance_date)->toDateString();
        $punchIn = $this->normalizeAttendanceTime($attendance->punch_in);
        $punchOut = $this->normalizeAttendanceTime($attendance->punch_out);
        $shiftMeta = $this->resolveEffectiveShiftForEmployeeDate((string) $attendance->employee_id, $attendanceDate);
        $metrics = $this->buildShiftMetrics($attendanceDate, $punchIn, $punchOut, $shiftMeta);
        $metrics['status'] = app(AttendanceCalculationService::class)->determineAttendanceStatus($metrics);
        $metrics['late_minutes'] = $metrics['late_in_minutes'];
        $metrics['is_late'] = $metrics['is_late_in'];

        return array_merge($attendance->toArray(), [
            'attendance_date' => $attendanceDate,
            'punch_in' => $punchIn,
            'punch_out' => $punchOut,
        ], $metrics);
    }

    private function parseAttendanceDateTime(string $value): Carbon
    {
        $timezone = app(WorkingHoursService::class)->getWorkingHoursConfig()['timezone']
            ?? config('app.timezone');

        return Carbon::parse($value)->setTimezone($timezone);
    }

    private function normalizeAttendanceTime(mixed $value): ?string
    {
        if ($value === null || $value === '') {
            return null;
        }

        if ($value instanceof \DateTimeInterface) {
            return Carbon::instance($value)->format('H:i:s');
        }

        $time = trim((string) $value);

        if (preg_match('/^\d{1,2}:\d{2}(?::\d{2})?$/', $time) === 1) {
            return Carbon::parse($time)->format('H:i:s');
        }

        return $this->parseAttendanceDateTime($time)->format('H:i:s');
    }

    private function calculateOvertimeMinutes(string $employeeId, string $attendanceDate, string $punchOut, ?int $totalWorkMinutes = null): int
    {
        $shiftMeta = $this->resolveEffectiveShiftForEmployeeDate($employeeId, $attendanceDate);

        if (! $shiftMeta['end_time']) {
            return 0;
        }

        $scheduledOut = Carbon::parse($attendanceDate.' '.$shiftMeta['end_time']);
        $actualOut = Carbon::parse($attendanceDate.' '.$punchOut);

        if ($actualOut->lte($scheduledOut)) {
            return 0;
        }

        return $scheduledOut->diffInMinutes($actualOut);
    }

    /**
     * Send a WhatsApp notification to the employee's office(s) for a live punch.
     *
     * @param  array{EmployeeId: string, PunchTime: string, EmployeeName?: string, MachineId?: int|null}  $punchData
     */
    private function sendLivePunchNotification(array $punchData): void
    {
        try {
            $officeQuery = function ($query) {
                $query->wherePivot('is_active', true)
                    ->whereRaw('offices.is_active = ?', [1]);
            };

            $employee = Employee::with(['offices' => $officeQuery])
                ->where('code', $punchData['EmployeeId'])
                ->first();

            if (! $employee) {
                return;
            }

            if ($employee->offices->isEmpty()) {
                $employee->offices()->syncWithoutDetaching([
                    1 => ['is_active' => true],
                ]);
                $employee->load(['offices' => $officeQuery]);
            }

            $employeeName = $employee->name ?? $punchData['EmployeeName'] ?? $punchData['EmployeeId'];
            $punchTime = Carbon::parse($punchData['PunchTime'])->format('d M Y, h:i A');
            $machineId = isset($punchData['MachineId']) ? (int) $punchData['MachineId'] : null;

            if ($machineId === self::MACHINE_ID_PUNCH_IN) {
                $message = "*{$employeeName}* has *PUNCHED IN* at {$punchTime}.";
            } elseif ($machineId === self::MACHINE_ID_PUNCH_OUT) {
                $message = "*{$employeeName}* has *PUNCHED OUT* at {$punchTime}.";
            } else {
                $message = "*{$employeeName}* has *PUNCHED* at {$punchTime}.";
            }

            /** @var NotificationService $notificationService */
            $notificationService = app(NotificationService::class);

            foreach ($employee->offices as $office) {
                if (! empty($office->whatsapp_number)) {
                    $notificationService->sendWhatsApp($office->whatsapp_number, $message, true);
                } else {
                    $notificationService->sendWhatsApp('918811047292-1550922196@g.us', $message, true);
                }
            }
            Punch::where('EmployeeId', $punchData['EmployeeId'])
                ->where('PunchTime', $punchData['PunchTime'])
                ->update(['Islive' => false]);

        } catch (\Throwable $e) {
            Log::error('Failed to send live punch notification', [
                'employee_id' => $punchData['EmployeeId'],
                'error' => $e->getMessage(),
            ]);
        }
    }

    private function sendVisitorPunchNotification(array $punchData): void
    {
        try {
            $visitor = Visitor::where('code', $punchData['EmployeeId'])->first();

            if (! $visitor) {
                return;
            }

            $visitorName = $visitor->name ?? $punchData['EmployeeName'] ?? 'Visitor #'.$punchData['EmployeeId'];
            $punchTime = Carbon::parse($punchData['PunchTime'])->format('d M Y, h:i A');
            $machineId = isset($punchData['MachineId']) ? (int) $punchData['MachineId'] : null;

            if ($machineId === self::MACHINE_ID_PUNCH_IN) {
                $message = "*{$visitorName}* (Visitor) has *PUNCHED IN* at {$punchTime}.";
            } elseif ($machineId === self::MACHINE_ID_PUNCH_OUT) {
                $message = "*{$visitorName}* (Visitor) has *PUNCHED OUT* at {$punchTime}.";
            } else {
                $message = "*{$visitorName}* (Visitor) has *PUNCHED* at {$punchTime}.";
            }

            /** @var NotificationService $notificationService */
            $notificationService = app(NotificationService::class);

            // Send to default office notification number
            $notificationService->sendWhatsApp('918811047292-1550922196@g.us', $message, true);

            VisitorPunch::where('visitor_code', $punchData['EmployeeId'])
                ->where('punch_time', $punchData['PunchTime'])
                ->update(['is_live' => false]);
        } catch (\Throwable $e) {
            Log::error('Failed to send visitor punch notification', [
                'visitor_code' => $punchData['EmployeeId'],
                'error' => $e->getMessage(),
            ]);
        }
    }

    public function getAttendanceSummary(string $employeeId, Carbon $date): array
    {
        $emptyResult = [
            'status' => 'success',
            'employee_id' => $employeeId,
            'date' => $date->toDateString(),
            'shift_id' => null,
            'shift_start' => null,
            'shift_end' => null,
            'shift_grace_minutes' => 0,
            'punch_in' => null,
            'punch_out' => null,
            'breaks' => [],
            'total_break_minutes' => 0,
            'total_work_minutes' => null,
            'early_in_minutes' => 0,
            'late_in_minutes' => 0,
            'early_out_minutes' => 0,
            'late_out_minutes' => 0,
            'is_early_in' => false,
            'is_late_in' => false,
            'is_early_out' => false,
            'is_late_out' => false,
            'is_late' => false,
            'late_minutes' => 0,
            'overtime_minutes' => 0,
        ];

        // ── 1. Fetch raw punches ───────────────────────────────────────────────────
        // Keep as Eloquent Collection — do NOT call ->toArray().
        // Laravel's toArray() snake_cases PascalCase columns so $punch["PunchTime"]
        // would silently return null. Object syntax $punch->PunchTime is correct.
        $rawPunches = Punch::where('EmployeeId', $employeeId)
            ->whereDate('PunchTime', $date->toDateString())
            ->orderBy('PunchTime')
            ->get(['PunchTime', 'MachineId']);

        if ($rawPunches->isEmpty()) {
            return $emptyResult;
        }

        // ── 2. Build a flat, typed event list ─────────────────────────────────────
        $events = [];    // [["time" => Carbon, "direction" => string], ...]
        $hasUnknown = false;

        foreach ($rawPunches as $punch) {
            $time = Carbon::parse($punch->PunchTime);
            $machineId = (int) $punch->MachineId;

            if ($machineId === 3) {
                $events[] = ['time' => $time, 'direction' => 'in'];
            } elseif ($machineId === 1) {
                $events[] = ['time' => $time, 'direction' => 'out'];
            } elseif ($machineId === 2) {
                // Position-resolved in step 4
                $events[] = ['time' => $time, 'direction' => 'combined'];
            } else {
                $events[] = ['time' => $time, 'direction' => 'unknown'];
                $hasUnknown = true;
            }
        }

        if ($hasUnknown) {
            return $this->getAttendanceSummaryByTimeHeuristic($employeeId, $date, $emptyResult);
        }

        // ── 3. Collapse consecutive same-direction typed events (MachineId 1 & 3) ─
        
        $collapsed = [];
        $lastDir = null;

        foreach ($events as $event) {
            $dir = $event['direction'];

            if ($dir === 'combined') {
                $collapsed[] = $event;
                $lastDir = 'combined';

                continue;
            }

            if ($dir === $lastDir) {
                if ($dir === 'out') {
                    // Replace last OUT with the later one
                    $collapsed[count($collapsed) - 1] = $event;
                }
                // Consecutive INs: keep first — do nothing
            } else {
                $collapsed[] = $event;
                $lastDir = $dir;
            }
        }

        // ── 4. Position-resolve "combined" machine events ─────────────────────────
        
        $total = count($collapsed);
        $resolved = [];

        foreach ($collapsed as $idx => $event) {
            if ($event['direction'] !== 'combined') {
                $resolved[] = $event;

                continue;
            }

            if ($idx === 0) {
                $resolved[] = ['time' => $event['time'], 'direction' => 'in'];
            } elseif ($idx === $total - 1) {
                $resolved[] = ['time' => $event['time'], 'direction' => 'out'];
            } else {
                $middleIdx = $idx - 1; // 0-based within the middle segment
                $resolved[] = [
                    'time' => $event['time'],
                    'direction' => ($middleIdx % 2 === 0) ? 'out' : 'in',
                ];
            }
        }

        // Ensure sequence starts with an IN
        if (empty($resolved) || $resolved[0]['direction'] !== 'in') {
            return $emptyResult;
        }

        // ── 5. Extract punch_in, punch_out, and breaks ────────────────────────────
        
        $resolvedCount = count($resolved);
        $punchIn = $resolved[0]['time'];
        $punchOut = null;
        $breaks = [];

        if ($resolvedCount >= 2) {
            $punchOut = $resolved[$resolvedCount - 1]['time'];

            if ($resolvedCount >= 4) {
                $middle = array_slice($resolved, 1, $resolvedCount - 2);

                for ($i = 0; $i + 1 < count($middle); $i += 2) {
                    $breakOutEvent = $middle[$i];
                    $breakInEvent = $middle[$i + 1];

                    $breaks[] = [
                        'break_out' => $breakOutEvent['time']->toDateTimeString(),
                        'break_in' => $breakInEvent['time']->toDateTimeString(),
                        'duration_minutes' => (int) $breakOutEvent['time']->diffInMinutes($breakInEvent['time']),
                    ];
                }
            }
        }

        // ── 6. Compute totals and return ──────────────────────────────────────────
        $totalBreakMinutes = collect($breaks)->sum('duration_minutes');

        $totalWorkMinutes = $punchOut
            ? max(0, (int) $punchIn->diffInMinutes($punchOut) - $totalBreakMinutes)
            : null;

        $shiftMeta = $this->resolveEffectiveShiftForEmployeeDate($employeeId, $date->toDateString());
        $shiftMetrics = $this->buildShiftMetrics(
            $date->toDateString(),
            $punchIn->format('H:i:s'),
            $punchOut?->format('H:i:s'),
            $shiftMeta
        );

        $overtimeMinutes = $punchOut
            ? $this->calculateOvertimeMinutes(
                $employeeId,
                $date->toDateString(),
                $punchOut->format('H:i:s'),
                $totalWorkMinutes
            )
            : 0;

        return [
            'status' => 'success',
            'employee_id' => $employeeId,
            'date' => $date->toDateString(),
            'shift_id' => $shiftMeta['shift_id'],
            'shift_start' => $shiftMeta['start_time'],
            'shift_end' => $shiftMeta['end_time'],
            'shift_grace_minutes' => $shiftMeta['grace_minutes'],
            'punch_in' => $punchIn->toDateTimeString(),
            'punch_out' => $punchOut?->toDateTimeString(),
            'breaks' => $breaks,
            'total_break_minutes' => $totalBreakMinutes,
            'total_work_minutes' => $totalWorkMinutes,
            'early_in_minutes' => $shiftMetrics['early_in_minutes'],
            'late_in_minutes' => $shiftMetrics['late_in_minutes'],
            'early_out_minutes' => $shiftMetrics['early_out_minutes'],
            'late_out_minutes' => $shiftMetrics['late_out_minutes'],
            'is_early_in' => $shiftMetrics['is_early_in'],
            'is_late_in' => $shiftMetrics['is_late_in'],
            'is_early_out' => $shiftMetrics['is_early_out'],
            'is_late_out' => $shiftMetrics['is_late_out'],
            'late_minutes' => $shiftMetrics['late_in_minutes'],
            'is_late' => $shiftMetrics['is_late_in'],
            'overtime_minutes' => $overtimeMinutes,
        ];
    }

    /**
     * Fallback: time-heuristic for punches with unknown MachineId.
     *
     * Punches within $mergeGapMinutes of the previous one are dropped as
     * duplicate swipes. The cleaned list is then treated positionally:
     *   index 0     = punch_in
     *   index N-1   = punch_out  (N >= 2)
     *   index 1…N-2 = middle break pairs (only when N >= 4)
     */
    private function getAttendanceSummaryByTimeHeuristic(
        string $employeeId,
        Carbon $date,
        array $emptyResult,
        int $mergeGapMinutes = 2
    ): array {
        $punches = Punch::where('EmployeeId', $employeeId)
            ->whereDate('PunchTime', $date->toDateString())
            ->orderBy('PunchTime')
            ->pluck('PunchTime')
            ->map(fn ($t) => Carbon::parse($t))
            ->values();

        if ($punches->isEmpty()) {
            return $emptyResult;
        }

        // Deduplicate: drop punches within the merge gap of the previous one
        $merged = [$punches[0]];
        $lastTime = $punches[0];

        for ($i = 1; $i < $punches->count(); $i++) {
            $current = $punches[$i];
            if ($current->diffInMinutes($lastTime) > $mergeGapMinutes) {
                $merged[] = $current;
                $lastTime = $current;
            }
        }

        $mergedCount = count($merged);
        $punchIn = $merged[0];
        $punchOut = $mergedCount >= 2 ? $merged[$mergedCount - 1] : null;
        $breaks = [];

        if ($mergedCount >= 4) {
            $middle = array_slice($merged, 1, $mergedCount - 2);

            for ($i = 0; $i + 1 < count($middle); $i += 2) {
                $breakOut = $middle[$i];
                $breakIn = $middle[$i + 1];

                $breaks[] = [
                    'break_out' => $breakOut->toDateTimeString(),
                    'break_in' => $breakIn->toDateTimeString(),
                    'duration_minutes' => (int) $breakOut->diffInMinutes($breakIn),
                ];
            }
        }

        $totalBreakMinutes = collect($breaks)->sum('duration_minutes');
        $totalWorkMinutes = $punchOut
            ? max(0, (int) $punchIn->diffInMinutes($punchOut) - $totalBreakMinutes)
            : null;

        $shiftMeta = $this->resolveEffectiveShiftForEmployeeDate($employeeId, $date->toDateString());
        $shiftMetrics = $this->buildShiftMetrics(
            $date->toDateString(),
            $punchIn->format('H:i:s'),
            $punchOut?->format('H:i:s'),
            $shiftMeta
        );

        $overtimeMinutes = $punchOut
            ? $this->calculateOvertimeMinutes(
                $employeeId,
                $date->toDateString(),
                $punchOut->format('H:i:s'),
                $totalWorkMinutes
            )
            : 0;

        return [
            'status' => 'success',
            'employee_id' => $employeeId,
            'date' => $date->toDateString(),
            'shift_id' => $shiftMeta['shift_id'],
            'shift_start' => $shiftMeta['start_time'],
            'shift_end' => $shiftMeta['end_time'],
            'shift_grace_minutes' => $shiftMeta['grace_minutes'],
            'punch_in' => $punchIn->toDateTimeString(),
            'punch_out' => $punchOut?->toDateTimeString(),
            'breaks' => $breaks,
            'total_break_minutes' => $totalBreakMinutes,
            'total_work_minutes' => $totalWorkMinutes,
            'early_in_minutes' => $shiftMetrics['early_in_minutes'],
            'late_in_minutes' => $shiftMetrics['late_in_minutes'],
            'early_out_minutes' => $shiftMetrics['early_out_minutes'],
            'late_out_minutes' => $shiftMetrics['late_out_minutes'],
            'is_early_in' => $shiftMetrics['is_early_in'],
            'is_late_in' => $shiftMetrics['is_late_in'],
            'is_early_out' => $shiftMetrics['is_early_out'],
            'is_late_out' => $shiftMetrics['is_late_out'],
            'late_minutes' => $shiftMetrics['late_in_minutes'],
            'is_late' => $shiftMetrics['is_late_in'],
            'overtime_minutes' => $overtimeMinutes,
        ];
    }

    /**
     * Build the day-by-day calendar payload for the attendance UI.
     *
     * @param  Collection<int, array<string, mixed>>  $records
     * @return array<int, array<string, mixed>>
     */
    private function buildAttendanceCalendarDays(Employee $employee, Collection $records, int $month, int $year): array
    {
        $workingHoursService = app(WorkingHoursService::class);
        $holidayMap = collect($workingHoursService->getHolidaysForYear($year))->keyBy('date');
        $recordMap = $records->groupBy(function (array $record): string {
            $date = Carbon::parse($record['attendance_date'])->toDateString();

            return $date;
        })->map(fn (Collection $dailyRecords, string $date): array => $this->combineDailyCalendarRecords($employee, $dailyRecords, $date));

        $daysInMonth = Carbon::create($year, $month, 1)->daysInMonth;
        $days = [];

        for ($day = 1; $day <= $daysInMonth; $day++) {
            $calendarDate = Carbon::create($year, $month, $day)->startOfDay();
            $date = $calendarDate->toDateString();
            $record = $recordMap->get($date);
            $shiftMeta = $this->resolveEffectiveShiftForEmployeeDate((string) $employee->code, $date);
            $holiday = $holidayMap->get($date);
            $isCurrentMonthDay = $calendarDate->isToday();

            $status = $record
                ? $this->normalizeCalendarStatus((string) ($record['status'] ?? 'present'), $record)
                : $this->resolveCalendarStatus($shiftMeta, $calendarDate);

            $days[] = [
                'day' => $day,
                'date' => $date,
                'status' => $status,
                'is_today' => $isCurrentMonthDay,
                'record' => $record,
                'holiday' => $holiday ? [
                    'date' => $holiday['date'] ?? $date,
                    'name' => $holiday['name'] ?? 'Holiday',
                    'type' => $holiday['type'] ?? null,
                ] : null,
                'shift_id' => $shiftMeta['shift_id'],
                'shift_start' => $shiftMeta['start_time'],
                'shift_end' => $shiftMeta['end_time'],
                'shift_grace_minutes' => $shiftMeta['grace_minutes'],
                'shift_source' => $this->resolveShiftSource($shiftMeta),
                'is_leave_day' => (bool) ($shiftMeta['is_leave_day'] ?? false),
                'is_holiday' => (bool) ($shiftMeta['is_holiday'] ?? false),
                'is_field_work' => (bool) ($shiftMeta['is_field_work'] ?? false),
                'is_remote_work' => (bool) ($shiftMeta['is_remote_work'] ?? false),
            ];
        }

        return $days;
    }

    /**
     * @param  Collection<int, array<string, mixed>>  $records
     * @return array<string, mixed>
     */
    private function combineDailyCalendarRecords(Employee $employee, Collection $records, string $date): array
    {
        $orderedRecords = $records->sortBy('punch_in')->values();
        $punchIn = $orderedRecords->pluck('punch_in')->filter()->sort()->first();
        $punchOut = $orderedRecords->pluck('punch_out')->filter()->sort()->last();
        $baseRecord = $punchIn
            ? $orderedRecords->first(fn (array $record): bool => ($record['punch_in'] ?? null) === $punchIn)
            : $orderedRecords->first();

        $combinedRecord = array_merge($baseRecord, [
            'attendance_date' => $date,
            'punch_in' => $punchIn,
            'punch_out' => $punchOut,
        ]);

        $shiftMeta = $this->resolveEffectiveShiftForEmployeeDate((string) $employee->code, $date);
        $metrics = $this->buildShiftMetrics($date, $punchIn, $punchOut, $shiftMeta);
        $metrics['status'] = app(AttendanceCalculationService::class)->determineAttendanceStatus($metrics);
        $metrics['late_minutes'] = $metrics['late_in_minutes'];
        $metrics['is_late'] = $metrics['is_late_in'];

        return array_merge($combinedRecord, $metrics);
    }
 
    /**
     * Normalize the calendar status for days that do not have a punch record.
     *
     * @param  array{shift_id: ?int, start_time: ?string, end_time: ?string, grace_minutes: int, is_half_day?: bool, is_leave_day?: bool, is_holiday?: bool, is_field_work?: bool, is_remote_work?: bool}  $shiftMeta
     */
    private function resolveCalendarStatus(array $shiftMeta, Carbon $date): string
    {
        if ($shiftMeta['is_leave_day'] ?? false) {
            return 'leave';
        }

        if ($shiftMeta['is_holiday'] ?? false) {
            return 'holiday';
        }

        if ($shiftMeta['is_field_work'] ?? false) {
            return 'field_work';
        }

        if ($shiftMeta['is_remote_work'] ?? false) {
            return 'remote_work';
        }

        if (! $shiftMeta['start_time'] || ! $shiftMeta['end_time']) {
            return 'weekend';
        }

        if ($date->isFuture()) {
            return 'upcoming';
        }

        if ($date->isToday()) {
            $scheduledEnd = Carbon::parse($date->toDateString().' '.$shiftMeta['end_time']);

            if (now()->lt($scheduledEnd)) {
                return 'pending';
            }
        }

        return 'absent';
    }

    /**
     * @param  array<string, mixed>  $record
     */
    private function normalizeCalendarStatus(string $status, array $record = []): string
    {
        if ($record['is_half_day'] ?? false) {
            return 'half_day';
        }

        return match ($status) {
            'on_leave' => 'leave',
            'late_in' => 'late',
            'early_out' => 'early_out',
            'incomplete' => 'incomplete',
            default => $status,
        };
    }

    /**
     * Distinguish assigned shifts from general working hours for display.
     *
     * @param  array{shift_id: ?int, start_time: ?string, end_time: ?string}  $shiftMeta
     */
    private function resolveShiftSource(array $shiftMeta): string
    {
        if ($shiftMeta['shift_id']) {
            return 'assigned_shift';
        }

        if ($shiftMeta['start_time'] && $shiftMeta['end_time']) {
            return 'general_hours';
        }

        return 'none';
    }
}
