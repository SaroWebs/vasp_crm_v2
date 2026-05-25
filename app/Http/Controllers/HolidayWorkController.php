<?php

namespace App\Http\Controllers;

use App\Models\CompensatoryOff;
use App\Models\Employee;
use App\Models\HolidayWorkRecord;
use Illuminate\Http\Request;

class HolidayWorkController extends Controller
{
    public function index(Request $request)
    {
        $query = HolidayWorkRecord::query()
            ->with(['employee', 'holiday', 'approvedByUser']);

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('employee_id')) {
            $query->where('employee_id', $request->employee_id);
        }

        if ($request->filled('holiday_id')) {
            $query->where('holiday_id', $request->holiday_id);
        }

        $holidayWorkRecords = $query->orderBy('created_at', 'desc')->paginate(20);

        return response()->json($holidayWorkRecords);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'employee_id' => 'required|exists:employees,id',
            'holiday_id' => 'required|exists:holidays,id',
            'hours_worked' => 'required|numeric|min:0.25|max:24',
            'premium_multiplier' => 'nullable|numeric|min:1|max:3',
            'notes' => 'nullable|string|max:500',
        ]);

        $validated['premium_multiplier'] = $validated['premium_multiplier'] ?? 1.5;

        $holidayWork = HolidayWorkRecord::create($validated);
        $holidayWork->load(['employee', 'holiday']);

        return response()->json($holidayWork, 201);
    }

    public function show(HolidayWorkRecord $holidayWorkRecord)
    {
        $holidayWorkRecord->load(['employee', 'holiday', 'approvedByUser']);

        return response()->json($holidayWorkRecord);
    }

    public function approve(Request $request, HolidayWorkRecord $holidayWorkRecord)
    {
        if ($holidayWorkRecord->status !== 'pending') {
            return response()->json(['message' => 'Only pending holiday work records can be approved.'], 422);
        }

        $validated = $request->validate([
            'notes' => 'nullable|string|max:500',
        ]);

        $holidayWorkRecord->update([
            'status' => 'approved',
            'approved_by_user_id' => auth()->id(),
            'approved_at' => now(),
            'notes' => $validated['notes'] ?? $holidayWorkRecord->notes,
        ]);

        return response()->json([
            'message' => 'Holiday work approved successfully.',
            'holiday_work_record' => $holidayWorkRecord->load(['employee', 'holiday', 'approvedByUser']),
        ]);
    }

    public function reject(Request $request, HolidayWorkRecord $holidayWorkRecord)
    {
        if ($holidayWorkRecord->status !== 'pending') {
            return response()->json(['message' => 'Only pending holiday work records can be rejected.'], 422);
        }

        $validated = $request->validate([
            'notes' => 'required|string|max:500',
        ]);

        $holidayWorkRecord->update([
            'status' => 'rejected',
            'approved_by_user_id' => auth()->id(),
            'approved_at' => now(),
            'notes' => $validated['notes'],
        ]);

        return response()->json([
            'message' => 'Holiday work rejected successfully.',
            'holiday_work_record' => $holidayWorkRecord->load(['employee', 'holiday', 'approvedByUser']),
        ]);
    }

    public function getEmployeeHolidayWork(Request $request, Employee $employee)
    {
        $query = $employee->holidayWorkRecords()->with(['holiday', 'approvedByUser']);

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('year')) {
            $query->whereYear('created_at', $request->year);
        }

        $records = $query->orderBy('created_at', 'desc')->get();

        return response()->json([
            'employee_id' => $employee->id,
            'employee_name' => $employee->name,
            'holiday_work_records' => $records,
        ]);
    }

    public function createCompensatoryOff(Request $request, HolidayWorkRecord $holidayWorkRecord)
    {
        if ($holidayWorkRecord->status !== 'approved') {
            return response()->json(['message' => 'Only approved holiday work can generate compensatory off.'], 422);
        }

        $validated = $request->validate([
            'expiry_date' => 'nullable|date_format:Y-m-d|after_or_equal:today',
        ]);

        $compOff = CompensatoryOff::create([
            'employee_id' => $holidayWorkRecord->employee_id,
            'comp_off_hours' => $holidayWorkRecord->generateCompOffHours(),
            'source_holiday_work_id' => $holidayWorkRecord->id,
            'expiry_date' => $validated['expiry_date'] ?? null,
        ]);

        return response()->json($compOff, 201);
    }

    public function getCompensatoryOffs(Request $request, Employee $employee)
    {
        $query = $employee->compensatoryOffs()->with(['sourceHolidayWork', 'usedForLeaveRequest']);

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        $records = $query->orderBy('created_at', 'desc')->get();

        return response()->json([
            'employee_id' => $employee->id,
            'employee_name' => $employee->name,
            'compensatory_offs' => $records,
        ]);
    }
}
