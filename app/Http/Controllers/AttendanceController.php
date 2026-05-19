<?php

namespace App\Http\Controllers;

use App\Http\Requests\AttendanceOverrideRequest;
use App\Http\Requests\AttendanceUploadRequest;
use App\Models\Attendance;
use App\Models\Employee;
use App\Models\Punch;
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
    public function uploadPunchData(AttendanceUploadRequest $request): JsonResponse
    {
        $punches = $request->validated();
        $stored = 0;

        foreach ($punches as $punchData) {
            $punchDateTime = Carbon::parse($punchData['PunchTime']);

            if ($this->hasPunchWithinOneMinute((string) $punchData['EmployeeId'], $punchDateTime, true)) {
                continue;
            }

            Punch::updateOrCreate(
                [
                    'EmployeeId' => $punchData['EmployeeId'],
                    'PunchTime' => $punchDateTime,
                ],
                [
                    'MachineId' => $punchData['MachineId'] ?? null,
                    'Ip' => $punchData['Ip'] ?? null,
                    'GroupName' => $punchData['GroupName'] ?? null,
                    'EmployeeName' => $punchData['EmployeeName'] ?? null,
                    'Islive' => $punchData['Islive'] ?? false,
                ]
            );

            $this->syncAttendanceFromPunches(
                (string) $punchData['EmployeeId'],
                $punchDateTime,
                'office'
            );

            if (! empty($punchData['Islive']) || $punchData['Islive'] === true) {
                $this->sendLivePunchNotification($punchData);
            }

            $stored++;
        }

        return response()->json([
            'status' => 'success',
            'message' => "Attendance recorded successfully. {$stored} punch(es) processed.",
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

        $existingPunchCount = Punch::where('EmployeeId', $employee->code)
            ->whereDate('PunchTime', $attendanceDate)
            ->count();

        if ($this->hasPunchWithinOneMinute($employee->code, $punchDateTime)) {
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
            ->orderBy('punch_in')
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

            return $attendance;
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

        $presentDays = $records->groupBy('attendance_date')->count();
        $absentDays = max(0, $totalWorkingDays - $presentDays);

        // Late = punch_in after configured workday start time for the first punch of each day
        $lateDays = $records->groupBy('attendance_date')->filter(function (Collection $group) use ($workingHoursService) {
            $record = $group->sortBy('punch_in')->first();

            if (! $record || ! $record->punch_in || ! $record->attendance_date) {
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

        $now = Carbon::now();
        $segments = [];

        foreach ($punches as $index => $punch) {
            if ($index % 2 === 0) {
                $segments[] = [
                    'employee_id' => $employeeId,
                    'machine_id' => $punch->MachineId,
                    'attendance_date' => $attendanceDate,
                    'punch_in' => $punch->PunchTime->format('H:i:s'),
                    'punch_out' => null,
                    'ip' => $punch->Ip,
                    'employee_name' => $punch->EmployeeName,
                    'group_name' => $punch->GroupName,
                    'is_live' => $punch->Islive ? 1 : 0,
                    'mode' => $mode,
                    'created_at' => $now,
                    'updated_at' => $now,
                ];

                continue;
            }

            $lastIndex = count($segments) - 1;
            $segments[$lastIndex]['punch_out'] = $punch->PunchTime->format('H:i:s');

            if ($punch->MachineId !== null) {
                $segments[$lastIndex]['machine_id'] = $punch->MachineId;
            }
            if ($punch->Ip) {
                $segments[$lastIndex]['ip'] = $punch->Ip;
            }
            if ($punch->Islive) {
                $segments[$lastIndex]['is_live'] = 1;
            }
        }

        Attendance::insert($segments);
    }

    private function hasPunchWithinOneMinute(string $employeeId, Carbon $punchDateTime, bool $excludeExact = false): bool
    {
        $query = Punch::where('EmployeeId', $employeeId)
            ->whereBetween('PunchTime', [
                $punchDateTime->copy()->subMinute(),
                $punchDateTime->copy()->addMinute(),
            ]);

        if ($excludeExact) {
            $query->where('PunchTime', '!=', $punchDateTime);
        }

        return $query->exists();
    }

    /**
     * Send a WhatsApp notification to the employee's office(s) for a live punch.
     *
     * @param  array{EmployeeId: string, PunchTime: string, EmployeeName?: string}  $punchData
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
            $message = "{$employeeName} has punched at {$punchTime}.";

            /** @var NotificationService $notificationService */
            $notificationService = app(NotificationService::class);

            foreach ($employee->offices as $office) {
                if (! empty($office->whatsapp_number)) {
                    $notificationService->sendWhatsApp($office->whatsapp_number, $message, true);
                } else {
                    $notificationService->sendWhatsApp('918811047292-1550922196@g.us', $message, true);
                }
            }
        } catch (\Throwable $e) {
            Log::error('Failed to send live punch notification', [
                'employee_id' => $punchData['EmployeeId'],
                'error' => $e->getMessage(),
            ]);
        }
    }
}
