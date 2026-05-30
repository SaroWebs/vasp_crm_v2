<?php

namespace App\Http\Controllers;

use App\Models\Employee;
use App\Models\RemoteWorkRequest;
use Illuminate\Http\Request;

class RemoteWorkController extends Controller
{
    /**
     * GET /api/remote-work-requests
     * List remote work requests with filtering
     */
    public function index(Request $request)
    {
        $query = RemoteWorkRequest::query()
            ->with(['employee', 'requestedByUser', 'approvedByUser']);

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

        $remoteWorkRequests = $query->orderBy('start_date', 'desc')->paginate(20);

        return response()->json($remoteWorkRequests);
    }

    /**
     * POST /api/remote-work-requests
     * Create a new remote work request
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'employee_id' => 'required|exists:employees,id',
            'start_date' => 'required|date_format:Y-m-d',
            'end_date' => 'required|date_format:Y-m-d|after_or_equal:start_date',
            'reason' => 'nullable|string|max:500',
        ]);

        // Check for overlapping remote work requests
        $overlapping = RemoteWorkRequest::forEmployee($validated['employee_id'])
            ->whereIn('status', ['pending', 'approved'])
            ->forDateRange($validated['start_date'], $validated['end_date'])
            ->exists();

        if ($overlapping) {
            return response()->json([
                'message' => 'Employee already has a remote work request in this date range.',
            ], 422);
        }

        $validated['requested_by_user_id'] = auth()->id();

        $remoteWorkRequest = RemoteWorkRequest::create($validated);
        $remoteWorkRequest->load(['employee', 'requestedByUser']);

        return response()->json($remoteWorkRequest, 201);
    }

    /**
     * GET /api/remote-work-requests/{id}
     * Get a specific remote work request
     */
    public function show(RemoteWorkRequest $remoteWorkRequest)
    {
        $remoteWorkRequest->load(['employee', 'requestedByUser', 'approvedByUser']);

        return response()->json($remoteWorkRequest);
    }

    /**
     * PUT /api/remote-work-requests/{id}
     * Update a remote work request (only if pending)
     */
    public function update(Request $request, RemoteWorkRequest $remoteWorkRequest)
    {
        if ($remoteWorkRequest->status !== 'pending') {
            return response()->json([
                'message' => 'Can only update pending remote work requests.',
            ], 422);
        }

        $validated = $request->validate([
            'start_date' => 'sometimes|date_format:Y-m-d',
            'end_date' => 'sometimes|date_format:Y-m-d|after_or_equal:start_date',
            'reason' => 'nullable|string|max:500',
        ]);

        $remoteWorkRequest->update($validated);
        $remoteWorkRequest->load(['employee', 'requestedByUser']);

        return response()->json($remoteWorkRequest);
    }

    /**
     * DELETE /api/remote-work-requests/{id}
     * Cancel a remote work request (only if pending)
     */
    public function destroy(RemoteWorkRequest $remoteWorkRequest)
    {
        if ($remoteWorkRequest->status !== 'pending') {
            return response()->json([
                'message' => 'Can only cancel pending remote work requests.',
            ], 422);
        }

        $remoteWorkRequest->update(['status' => 'cancelled']);

        return response()->json(['message' => 'Remote work request cancelled successfully.']);
    }

    /**
     * POST /api/remote-work-requests/{id}/approve
     * Approve a remote work request
     */
    public function approve(Request $request, RemoteWorkRequest $remoteWorkRequest)
    {
        if ($remoteWorkRequest->status !== 'pending') {
            return response()->json([
                'message' => 'Only pending remote work requests can be approved.',
            ], 422);
        }

        $validated = $request->validate([
            'notes' => 'nullable|string|max:500',
        ]);

        $remoteWorkRequest->update([
            'status' => 'approved',
            'approved_by_user_id' => auth()->id(),
            'approval_notes' => $validated['notes'] ?? null,
            'decided_at' => now(),
        ]);

        $remoteWorkRequest->load(['employee', 'requestedByUser', 'approvedByUser']);

        return response()->json([
            'message' => 'Remote work request approved successfully.',
            'remote_work_request' => $remoteWorkRequest,
        ]);
    }

    /**
     * POST /api/remote-work-requests/{id}/reject
     * Reject a remote work request
     */
    public function reject(Request $request, RemoteWorkRequest $remoteWorkRequest)
    {
        if ($remoteWorkRequest->status !== 'pending') {
            return response()->json([
                'message' => 'Only pending remote work requests can be rejected.',
            ], 422);
        }

        $validated = $request->validate([
            'notes' => 'required|string|max:500',
        ]);

        $remoteWorkRequest->update([
            'status' => 'rejected',
            'approved_by_user_id' => auth()->id(),
            'approval_notes' => $validated['notes'],
            'decided_at' => now(),
        ]);

        $remoteWorkRequest->load(['employee', 'requestedByUser', 'approvedByUser']);

        return response()->json([
            'message' => 'Remote work request rejected successfully.',
            'remote_work_request' => $remoteWorkRequest,
        ]);
    }

    /**
     * GET /api/employees/{id}/remote-work-requests
     * Get all remote work requests for an employee
     */
    public function getEmployeeRemoteWorkRequests(Request $request, Employee $employee)
    {
        $query = $employee->remoteWorkRequests()
            ->with(['requestedByUser', 'approvedByUser']);

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('year')) {
            $year = $request->integer('year');
            $query->whereYear('start_date', $year);
        }

        $perPage = $request->integer('per_page', 50);
        $remoteWorkRequests = $query->orderBy('start_date', 'desc')->paginate($perPage);

        return response()->json($remoteWorkRequests);
    }
}
