<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreEmployeeShiftAssignmentRequest;
use App\Http\Requests\StoreShiftRequest;
use App\Http\Requests\UpdateEmployeeShiftAssignmentRequest;
use App\Http\Requests\UpdateShiftRequest;
use App\Models\Employee;
use App\Models\EmployeeShiftAssignment;
use App\Models\Shift;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class ShiftController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('admin/shifts/index');
    }

    public function shifts(): JsonResponse
    {
        $shifts = Shift::query()
            ->withCount('assignments')
            ->orderBy('name')
            ->get();

        return response()->json([
            'status' => 'success',
            'data' => $shifts,
        ]);
    }

    public function storeShift(StoreShiftRequest $request): JsonResponse
    {
        $shift = Shift::create([
            'name' => $request->name,
            'start_time' => $request->start_time.':00',
            'end_time' => $request->end_time.':00',
            'grace_minutes' => $request->grace_minutes ?? 0,
            'is_active' => $request->boolean('is_active', true),
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Shift created successfully.',
            'data' => $shift,
        ]);
    }

    public function updateShift(UpdateShiftRequest $request, Shift $shift): JsonResponse
    {
        $shift->update([
            'name' => $request->name,
            'start_time' => $request->start_time.':00',
            'end_time' => $request->end_time.':00',
            'grace_minutes' => $request->grace_minutes ?? 0,
            'is_active' => $request->boolean('is_active', true),
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Shift updated successfully.',
            'data' => $shift->fresh(),
        ]);
    }

    public function destroyShift(Shift $shift): JsonResponse
    {
        $shift->delete();

        return response()->json([
            'status' => 'success',
            'message' => 'Shift deleted successfully.',
        ]);
    }

    public function assignments(): JsonResponse
    {
        $assignments = EmployeeShiftAssignment::query()
            ->with(['employee:id,name,code', 'shift:id,name,start_time,end_time,grace_minutes,is_active'])
            ->orderByDesc('effective_from')
            ->get();

        return response()->json([
            'status' => 'success',
            'data' => $assignments,
        ]);
    }

    public function storeAssignment(StoreEmployeeShiftAssignmentRequest $request): JsonResponse
    {
        $employeeIds = $request->input('employee_ids', []);

        if (! is_array($employeeIds) || empty($employeeIds)) {
            $employeeIds = [$request->employee_id];
        }

        $assignments = DB::transaction(function () use ($request, $employeeIds) {
            $created = [];
            $effectiveFrom = Carbon::parse($request->effective_from)->toDateString();
            $closingDate = Carbon::parse($effectiveFrom)->subDay()->toDateString();

            foreach ($employeeIds as $employeeId) {
                EmployeeShiftAssignment::query()
                    ->where('employee_id', $employeeId)
                    ->where('is_active', true)
                    ->get()
                    ->each(function (EmployeeShiftAssignment $assignment) use ($closingDate) {
                        $assignment->update([
                            'is_active' => false,
                            'effective_to' => $closingDate,
                        ]);
                    });

                $created[] = EmployeeShiftAssignment::create([
                    'employee_id' => $employeeId,
                    'shift_id' => $request->shift_id,
                    'effective_from' => $effectiveFrom,
                    'effective_to' => $request->effective_to,
                    'is_active' => $request->boolean('is_active', true),
                ]);
            }

            return $created;
        });

        return response()->json([
            'status' => 'success',
            'message' => 'Shift assignment created successfully.',
            'data' => count($assignments) === 1 ? $assignments[0]->load(['employee:id,name,code', 'shift:id,name,start_time,end_time,grace_minutes,is_active']) : $assignments[0]->load(['employee:id,name,code', 'shift:id,name,start_time,end_time,grace_minutes,is_active']),
        ]);
    }

    public function updateAssignment(UpdateEmployeeShiftAssignmentRequest $request, EmployeeShiftAssignment $assignment): JsonResponse
    {
        $assignment->update([
            'employee_id' => $request->employee_id,
            'shift_id' => $request->shift_id,
            'effective_from' => $request->effective_from,
            'effective_to' => $request->effective_to,
            'is_active' => $request->boolean('is_active', true),
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Shift assignment updated successfully.',
            'data' => $assignment->fresh()->load(['employee:id,name,code', 'shift:id,name,start_time,end_time,grace_minutes,is_active']),
        ]);
    }

    public function destroyAssignment(EmployeeShiftAssignment $assignment): JsonResponse
    {
        $assignment->delete();

        return response()->json([
            'status' => 'success',
            'message' => 'Shift assignment deleted successfully.',
        ]);
    }

    public function employees(): JsonResponse
    {
        $employees = Employee::query()
            ->select(['id', 'name', 'code'])
            ->orderBy('name')
            ->get();

        return response()->json([
            'status' => 'success',
            'data' => $employees,
        ]);
    }
}
