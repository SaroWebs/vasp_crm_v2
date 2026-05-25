<?php

namespace App\Http\Controllers;

use App\Models\LeaveType;
use Illuminate\Http\Request;

class LeaveTypeController extends Controller
{
    /**
     * GET /api/leave-types
     * List all leave types
     */
    public function index(Request $request)
    {
        $leaveTypes = LeaveType::when(
            $request->boolean('active_only'),
            fn ($q) => $q->active()
        )->orderBy('name')->get();

        return response()->json([
            'total' => $leaveTypes->count(),
            'leave_types' => $leaveTypes,
        ]);
    }

    /**
     * POST /api/leave-types
     * Create a new leave type
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:100|unique:leave_types',
            'description' => 'nullable|string',
            'duration_type' => 'required|in:full_day,half_day,custom_hours,hourly',
            'default_hours' => 'nullable|numeric|min:0|max:24',
            'requires_approval' => 'boolean',
            'is_paid' => 'boolean',
            'carry_over_allowed' => 'boolean',
            'is_active' => 'boolean',
        ]);

        $leaveType = LeaveType::create($validated);

        return response()->json($leaveType, 201);
    }

    /**
     * GET /api/leave-types/{id}
     * Get a specific leave type
     */
    public function show(LeaveType $leaveType)
    {
        return response()->json($leaveType);
    }

    /**
     * PUT /api/leave-types/{id}
     * Update a leave type
     */
    public function update(Request $request, LeaveType $leaveType)
    {
        $validated = $request->validate([
            'name' => 'sometimes|string|max:100|unique:leave_types,name,'.$leaveType->id,
            'description' => 'nullable|string',
            'duration_type' => 'sometimes|in:full_day,half_day,custom_hours,hourly',
            'default_hours' => 'nullable|numeric|min:0|max:24',
            'requires_approval' => 'boolean',
            'is_paid' => 'boolean',
            'carry_over_allowed' => 'boolean',
            'is_active' => 'boolean',
        ]);

        $leaveType->update($validated);

        return response()->json($leaveType);
    }

    /**
     * DELETE /api/leave-types/{id}
     * Delete a leave type
     */
    public function destroy(LeaveType $leaveType)
    {
        // Prevent deletion if there are active references
        if ($leaveType->leaveRequests()->exists()) {
            return response()->json([
                'message' => 'Cannot delete leave type with existing leave requests.',
            ], 422);
        }

        $leaveType->delete();

        return response()->json(['message' => 'Leave type deleted successfully.']);
    }
}
