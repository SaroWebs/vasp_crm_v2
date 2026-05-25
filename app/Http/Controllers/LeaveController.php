<?php

namespace App\Http\Controllers;

use App\Models\Employee;
use App\Models\LeaveApproval;
use App\Models\LeaveRequest;
use Illuminate\Http\Request;

class LeaveController extends Controller
{
    /**
     * GET /api/leave-requests
     * List leave requests (filtered by user or employee)
     */
    public function index(Request $request)
    {
        $query = LeaveRequest::query()
            ->with(['employee', 'leaveType', 'requestedByUser', 'approvals.approvedByUser']);

        // Filter by status
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        // Filter by employee
        if ($request->filled('employee_id')) {
            $query->where('employee_id', $request->employee_id);
        }

        // Filter by date range
        if ($request->filled('start_date')) {
            $query->where('start_date', '>=', $request->start_date);
        }
        if ($request->filled('end_date')) {
            $query->where('end_date', '<=', $request->end_date);
        }

        $leaveRequests = $query->orderBy('start_date', 'desc')->paginate(20);

        return response()->json($leaveRequests);
    }

    /**
     * POST /api/leave-requests
     * Create a new leave request
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'employee_id' => 'required|exists:employees,id',
            'leave_type_id' => 'required|exists:leave_types,id',
            'start_date' => 'required|date_format:Y-m-d',
            'end_date' => 'required|date_format:Y-m-d|after_or_equal:start_date',
            'reason' => 'nullable|string|max:500',
        ]);

        // Check for overlapping leave requests
        $overlapping = LeaveRequest::forEmployee($validated['employee_id'])
            ->whereIn('status', ['pending', 'approved'])
            ->forDateRange($validated['start_date'], $validated['end_date'])
            ->exists();

        if ($overlapping) {
            return response()->json([
                'message' => 'Employee already has a leave request in this date range.',
            ], 422);
        }

        $validated['requested_by_user_id'] = auth()->id();

        $leaveRequest = LeaveRequest::create($validated);
        $leaveRequest->load(['employee', 'leaveType', 'requestedByUser']);

        return response()->json($leaveRequest, 201);
    }

    /**
     * GET /api/leave-requests/{id}
     * Get a specific leave request
     */
    public function show(LeaveRequest $leaveRequest)
    {
        $leaveRequest->load(['employee', 'leaveType', 'requestedByUser', 'approvals.approvedByUser']);

        return response()->json($leaveRequest);
    }

    /**
     * PUT /api/leave-requests/{id}
     * Update a leave request (only if pending)
     */
    public function update(Request $request, LeaveRequest $leaveRequest)
    {
        if ($leaveRequest->status !== 'pending') {
            return response()->json([
                'message' => 'Can only update pending leave requests.',
            ], 422);
        }

        $validated = $request->validate([
            'start_date' => 'sometimes|date_format:Y-m-d',
            'end_date' => 'sometimes|date_format:Y-m-d|after_or_equal:start_date',
            'reason' => 'nullable|string|max:500',
        ]);

        $leaveRequest->update($validated);
        $leaveRequest->load(['employee', 'leaveType', 'requestedByUser']);

        return response()->json($leaveRequest);
    }

    /**
     * DELETE /api/leave-requests/{id}
     * Cancel a leave request (only if pending)
     */
    public function destroy(LeaveRequest $leaveRequest)
    {
        if ($leaveRequest->status !== 'pending') {
            return response()->json([
                'message' => 'Can only cancel pending leave requests.',
            ], 422);
        }

        $leaveRequest->update(['status' => 'cancelled']);

        return response()->json(['message' => 'Leave request cancelled successfully.']);
    }

    /**
     * POST /api/leave-requests/{id}/approve
     * Approve a leave request
     */
    public function approve(Request $request, LeaveRequest $leaveRequest)
    {
        if ($leaveRequest->status !== 'pending') {
            return response()->json([
                'message' => 'Only pending leave requests can be approved.',
            ], 422);
        }

        $validated = $request->validate([
            'notes' => 'nullable|string|max:500',
        ]);

        $leaveRequest->update(['status' => 'approved']);

        LeaveApproval::create([
            'leave_request_id' => $leaveRequest->id,
            'approved_by_user_id' => auth()->id(),
            'decision' => 'approved',
            'notes' => $validated['notes'] ?? null,
            'decided_at' => now(),
        ]);

        $leaveRequest->load(['employee', 'leaveType', 'approvals.approvedByUser']);

        return response()->json([
            'message' => 'Leave request approved successfully.',
            'leave_request' => $leaveRequest,
        ]);
    }

    /**
     * POST /api/leave-requests/{id}/reject
     * Reject a leave request
     */
    public function reject(Request $request, LeaveRequest $leaveRequest)
    {
        if ($leaveRequest->status !== 'pending') {
            return response()->json([
                'message' => 'Only pending leave requests can be rejected.',
            ], 422);
        }

        $validated = $request->validate([
            'notes' => 'required|string|max:500',
        ]);

        $leaveRequest->update(['status' => 'rejected']);

        LeaveApproval::create([
            'leave_request_id' => $leaveRequest->id,
            'approved_by_user_id' => auth()->id(),
            'decision' => 'rejected',
            'notes' => $validated['notes'],
            'decided_at' => now(),
        ]);

        $leaveRequest->load(['employee', 'leaveType', 'approvals.approvedByUser']);

        return response()->json([
            'message' => 'Leave request rejected successfully.',
            'leave_request' => $leaveRequest,
        ]);
    }

    /**
     * GET /api/employees/{id}/leave-balance
     * Get employee's leave balance for a specific year
     */
    public function getLeaveBalance(Request $request, Employee $employee)
    {
        $year = $request->integer('year', now()->year);

        $balances = $employee->leaveBalances()
            ->forYear($year)
            ->with('leaveType')
            ->get()
            ->map(function ($balance) {
                $balance->available = $balance->getAvailableBalance();

                return $balance;
            });

        return response()->json([
            'employee_id' => $employee->id,
            'employee_name' => $employee->name,
            'year' => $year,
            'leave_balances' => $balances,
        ]);
    }

    /**
     * GET /api/employees/{id}/leave-requests
     * Get all leave requests for an employee
     */
    public function getEmployeeLeaveRequests(Request $request, Employee $employee)
    {
        $query = $employee->leaveRequests()
            ->with(['leaveType', 'requestedByUser', 'approvals.approvedByUser']);

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('year')) {
            $year = $request->integer('year');
            $query->whereYear('start_date', $year);
        }

        $leaveRequests = $query->orderBy('start_date', 'desc')->get();

        return response()->json([
            'employee_id' => $employee->id,
            'employee_name' => $employee->name,
            'leave_requests' => $leaveRequests,
        ]);
    }
}
