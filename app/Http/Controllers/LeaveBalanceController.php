<?php

namespace App\Http\Controllers;

use App\Models\LeaveBalance;
use App\Models\LeaveType;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class LeaveBalanceController extends Controller
{
    /**
     * GET /api/leave-balances?employee_id=1&year=2026&leave_type_id=1&department_id=1
     * Get leave balances for employee(s)
     */
    public function index(Request $request)
    {
        $query = LeaveBalance::with(['employee', 'employee.department', 'leaveType']);

        if ($request->has('employee_id')) {
            $query->where('employee_id', $request->integer('employee_id'));
        }

        if ($request->has('year')) {
            $query->where('year', $request->integer('year'));
        }

        if ($request->has('leave_type_id')) {
            $query->where('leave_type_id', $request->integer('leave_type_id'));
        }

        if ($request->has('department_id')) {
            $query->whereHas('employee', function ($q) use ($request) {
                $q->where('department_id', $request->integer('department_id'));
            });
        }

        $balances = $query->orderBy('created_at', 'desc')->get();

        return response()->json([
            'total' => $balances->count(),
            'data' => $balances,
        ]);
    }

    /**
     * POST /api/leave-balances/bulk-assign
     * Bulk assign leave balances to employees
     *
     * Request body:
     * {
     *   "leave_type_id": 1,
     *   "employee_ids": [1, 2, 3],
     *   "number_of_leaves": 8,
     *   "year": 2026
     * }
     */
    public function bulkAssign(Request $request)
    {
        $validated = $request->validate([
            'leave_type_id' => 'required|exists:leave_types,id',
            'employee_ids' => 'required|array|min:1',
            'employee_ids.*' => 'exists:employees,id',
            'number_of_leaves' => 'required|integer|min:0',
            'year' => 'required|integer|min:2000|max:2100',
        ]);

        return DB::transaction(function () use ($validated) {
            $leaveType = LeaveType::find($validated['leave_type_id']);
            $year = $validated['year'];
            $numberOfLeaves = (int) $validated['number_of_leaves'];
            $employeeIds = $validated['employee_ids'];

            $results = [
                'created' => 0,
                'updated' => 0,
                'failed' => 0,
                'errors' => [],
            ];

            foreach ($employeeIds as $employeeId) {
                try {
                    $balance = LeaveBalance::firstOrCreate(
                        [
                            'employee_id' => $employeeId,
                            'leave_type_id' => $leaveType->id,
                            'year' => $year,
                        ],
                        [
                            'opening_leaves' => 0,
                            'assigned_leaves' => $numberOfLeaves,
                            'consumed_leaves' => 0,
                            'remaining_leaves' => $numberOfLeaves,
                        ]
                    );

                    $closingBalance = $this->calculateClosingBalance(
                        (int) $balance->opening_leaves,
                        $numberOfLeaves,
                        (int) $balance->consumed_leaves,
                    );

                    if ($balance->wasRecentlyCreated) {
                        $results['created']++;
                    } else {
                        $balance->update([
                            'assigned_leaves' => $numberOfLeaves,
                            'remaining_leaves' => $closingBalance,
                        ]);
                        $results['updated']++;
                    }
                } catch (\Exception $e) {
                    $results['failed']++;
                    $results['errors'][] = [
                        'employee_id' => $employeeId,
                        'message' => $e->getMessage(),
                    ];
                }
            }

            return response()->json([
                'message' => 'Leave balances assigned successfully.',
                'leave_type' => $leaveType->name,
                'year' => $year,
                'allocated_to_employees' => count($employeeIds),
                'results' => $results,
            ], 201);
        });
    }

    /**
     * GET /api/leave-balances/{leaveBalance}
     * Get a specific leave balance
     */
    public function show(LeaveBalance $leaveBalance)
    {
        return response()->json($leaveBalance->load(['employee', 'leaveType']));
    }

    /**
     * POST /api/leave-balances
     * Create a single leave balance
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'employee_id' => 'required|exists:employees,id',
            'leave_type_id' => 'required|exists:leave_types,id',
            'year' => 'required|integer|min:2000|max:2100',
            'number_of_leaves' => 'required|integer|min:0',
            'opening_leaves' => 'nullable|integer|min:0',
        ]);

        $openingLeaves = (int) ($validated['opening_leaves'] ?? 0);
        $assignedLeaves = (int) $validated['number_of_leaves'];

        // Check for duplicate
        $existing = LeaveBalance::where([
            'employee_id' => $validated['employee_id'],
            'leave_type_id' => $validated['leave_type_id'],
            'year' => $validated['year'],
        ])->first();

        if ($existing) {
            return response()->json([
                'message' => 'Leave balance already exists for this employee, leave type, and year.',
            ], 422);
        }

        $balance = LeaveBalance::create([
            'employee_id' => $validated['employee_id'],
            'leave_type_id' => $validated['leave_type_id'],
            'year' => $validated['year'],
            'opening_leaves' => $openingLeaves,
            'assigned_leaves' => $assignedLeaves,
            'consumed_leaves' => 0,
            'remaining_leaves' => $this->calculateClosingBalance($openingLeaves, $assignedLeaves, 0),
        ]);

        return response()->json($balance->load(['employee', 'leaveType']), 201);
    }

    /**
     * PUT /api/leave-balances/{leaveBalance}
     * Update a leave balance
     */
    public function update(Request $request, LeaveBalance $leaveBalance)
    {
        $validated = $request->validate([
            'number_of_leaves' => 'sometimes|integer|min:0',
            'opening_leaves' => 'sometimes|integer|min:0',
        ]);

        $openingLeaves = (int) ($validated['opening_leaves'] ?? $leaveBalance->opening_leaves);
        $assignedLeaves = (int) ($validated['number_of_leaves'] ?? $leaveBalance->assigned_leaves);

        $leaveBalance->update([
            'opening_leaves' => $openingLeaves,
            'assigned_leaves' => $assignedLeaves,
            'remaining_leaves' => $this->calculateClosingBalance($openingLeaves, $assignedLeaves, (int) $leaveBalance->consumed_leaves),
        ]);

        return response()->json($leaveBalance->load(['employee', 'leaveType']));
    }

    private function calculateClosingBalance(int $openingLeaves, int $assignedLeaves, int $consumedLeaves): int
    {
        return max(0, $openingLeaves + $assignedLeaves - $consumedLeaves);
    }

    /**
     * DELETE /api/leave-balances/{leaveBalance}
     * Delete a leave balance
     */
    public function destroy(LeaveBalance $leaveBalance)
    {
        $leaveBalance->delete();

        return response()->json(['message' => 'Leave balance deleted successfully.']);
    }
}
