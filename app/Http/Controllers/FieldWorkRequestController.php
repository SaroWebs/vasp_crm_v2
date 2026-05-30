<?php

namespace App\Http\Controllers;

use App\Models\Employee;
use App\Models\FieldWorkAssignment;
use App\Models\FieldWorkRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class FieldWorkRequestController extends Controller
{
    /**
     * GET /api/field-work-requests
     * List field work requests with filtering
     */
    public function index(Request $request)
    {
        $query = FieldWorkRequest::query()
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

        $requests = $query->orderBy('start_date', 'desc')->paginate(20);

        return response()->json($requests);
    }

    /**
     * POST /api/field-work-requests
     * Employee request for field work
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'employee_id' => 'required|exists:employees,id',
            'start_date' => 'required|date_format:Y-m-d',
            'end_date' => 'required|date_format:Y-m-d|after_or_equal:start_date',
            'location' => 'required|string|max:255',
            'description' => 'nullable|string|max:500',
            'custom_start_time' => 'nullable|date_format:H:i',
            'custom_end_time' => 'nullable|date_format:H:i',
        ]);

        // Check for overlapping requests (pending or approved)
        $overlapping = FieldWorkRequest::forEmployee($validated['employee_id'])
            ->whereIn('status', ['pending', 'approved'])
            ->forDateRange($validated['start_date'], $validated['end_date'])
            ->exists();

        if ($overlapping) {
            return response()->json([
                'message' => 'Employee already has a field work request in this date range.',
            ], 422);
        }

        $validated['requested_by_user_id'] = auth()->id();

        $fieldWorkRequest = FieldWorkRequest::create($validated);
        $fieldWorkRequest->load(['employee', 'requestedByUser']);

        return response()->json($fieldWorkRequest, 201);
    }

    /**
     * GET /api/field-work-requests/{id}
     * Get specific field work request
     */
    public function show(FieldWorkRequest $fieldWorkRequest)
    {
        $fieldWorkRequest->load(['employee', 'requestedByUser', 'approvedByUser']);

        return response()->json($fieldWorkRequest);
    }

    /**
     * PUT /api/field-work-requests/{id}
     * Update field work request (only if pending)
     */
    public function update(Request $request, FieldWorkRequest $fieldWorkRequest)
    {
        if ($fieldWorkRequest->status !== 'pending') {
            return response()->json([
                'message' => 'Can only update pending field work requests.',
            ], 422);
        }

        $validated = $request->validate([
            'start_date' => 'sometimes|date_format:Y-m-d',
            'end_date' => 'sometimes|date_format:Y-m-d|after_or_equal:start_date',
            'location' => 'sometimes|string|max:255',
            'description' => 'nullable|string|max:500',
            'custom_start_time' => 'nullable|date_format:H:i',
            'custom_end_time' => 'nullable|date_format:H:i',
        ]);

        $fieldWorkRequest->update($validated);
        $fieldWorkRequest->load(['employee', 'requestedByUser']);

        return response()->json($fieldWorkRequest);
    }

    /**
     * DELETE /api/field-work-requests/{id}
     * Cancel field work request (only if pending)
     */
    public function destroy(FieldWorkRequest $fieldWorkRequest)
    {
        if ($fieldWorkRequest->status !== 'pending') {
            return response()->json([
                'message' => 'Can only cancel pending field work requests.',
            ], 422);
        }

        $fieldWorkRequest->update(['status' => 'cancelled']);

        return response()->json(['message' => 'Field work request cancelled successfully.']);
    }

    /**
     * POST /api/field-work-requests/{id}/approve
     * Approve field work request and create field work assignment
     */
    public function approve(Request $request, FieldWorkRequest $fieldWorkRequest)
    {
        if ($fieldWorkRequest->status !== 'pending') {
            return response()->json([
                'message' => 'Only pending field work requests can be approved.',
            ], 422);
        }

        return DB::transaction(function () use ($request, $fieldWorkRequest) {
            $fieldWorkRequest->update([
                'status' => 'approved',
                'approved_by_user_id' => auth()->id(),
                'approval_notes' => $request->input('notes'),
                'decided_at' => now(),
            ]);

            // Create field work assignment for the approved period
            FieldWorkAssignment::create([
                'employee_id' => $fieldWorkRequest->employee_id,
                'start_date' => $fieldWorkRequest->start_date,
                'end_date' => $fieldWorkRequest->end_date,
                'location' => $fieldWorkRequest->location,
                'description' => $fieldWorkRequest->description,
                'custom_start_time' => $fieldWorkRequest->custom_start_time,
                'custom_end_time' => $fieldWorkRequest->custom_end_time,
                'assigned_by_user_id' => auth()->id(),
                'status' => 'approved',
            ]);

            $fieldWorkRequest->load(['employee', 'requestedByUser', 'approvedByUser']);

            return response()->json([
                'message' => 'Field work request approved successfully.',
                'field_work_request' => $fieldWorkRequest,
            ]);
        });
    }

    /**
     * POST /api/field-work-requests/{id}/reject
     * Reject field work request
     */
    public function reject(Request $request, FieldWorkRequest $fieldWorkRequest)
    {
        if ($fieldWorkRequest->status !== 'pending') {
            return response()->json([
                'message' => 'Only pending field work requests can be rejected.',
            ], 422);
        }

        $validated = $request->validate([
            'notes' => 'required|string|max:500',
        ]);

        $fieldWorkRequest->update([
            'status' => 'rejected',
            'approved_by_user_id' => auth()->id(),
            'approval_notes' => $validated['notes'],
            'decided_at' => now(),
        ]);

        $fieldWorkRequest->load(['employee', 'requestedByUser', 'approvedByUser']);

        return response()->json([
            'message' => 'Field work request rejected successfully.',
            'field_work_request' => $fieldWorkRequest,
        ]);
    }

    /**
     * GET /api/employees/{id}/field-work-requests
     * Get all field work requests for an employee
     */
    public function getEmployeeFieldWorkRequests(Request $request, Employee $employee)
    {
        $query = $employee->fieldWorkRequests()->with(['requestedByUser', 'approvedByUser']);

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('year')) {
            $year = $request->integer('year');
            $query->whereYear('start_date', $year);
        }

        $requests = $query->orderBy('start_date', 'desc')->get();

        return response()->json([
            'employee_id' => $employee->id,
            'employee_name' => $employee->name,
            'field_work_requests' => $requests,
        ]);
    }
}
