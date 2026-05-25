<?php

namespace App\Http\Controllers;

use App\Models\Employee;
use App\Models\FieldWorkAssignment;
use Illuminate\Http\Request;

class FieldWorkController extends Controller
{
    /**
     * GET /api/field-work-assignments
     * List field work assignments with filtering
     */
    public function index(Request $request)
    {
        $query = FieldWorkAssignment::query()
            ->with(['employee', 'assignedByUser']);

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

        // Filter active only
        if ($request->boolean('active_only')) {
            $query->active();
        }

        // Filter by location
        if ($request->filled('location')) {
            $query->where('location', 'like', '%'.$request->location.'%');
        }

        $fieldWorkAssignments = $query->orderBy('start_date', 'desc')->paginate(20);

        return response()->json($fieldWorkAssignments);
    }

    /**
     * POST /api/field-work-assignments
     * Create a new field work assignment
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
            'notes' => 'nullable|string|max:500',
        ]);

        // Check for overlapping field work assignments
        $overlapping = FieldWorkAssignment::forEmployee($validated['employee_id'])
            ->forDateRange($validated['start_date'], $validated['end_date'])
            ->exists();

        if ($overlapping) {
            return response()->json([
                'message' => 'Employee already has a field work assignment in this date range.',
            ], 422);
        }

        $validated['assigned_by_user_id'] = auth()->id();

        $fieldWorkAssignment = FieldWorkAssignment::create($validated);
        $fieldWorkAssignment->load(['employee', 'assignedByUser']);

        return response()->json($fieldWorkAssignment, 201);
    }

    /**
     * GET /api/field-work-assignments/{id}
     * Get a specific field work assignment
     */
    public function show(FieldWorkAssignment $fieldWorkAssignment)
    {
        $fieldWorkAssignment->load(['employee', 'assignedByUser']);

        return response()->json($fieldWorkAssignment);
    }

    /**
     * PUT /api/field-work-assignments/{id}
     * Update a field work assignment
     */
    public function update(Request $request, FieldWorkAssignment $fieldWorkAssignment)
    {
        $validated = $request->validate([
            'start_date' => 'sometimes|date_format:Y-m-d',
            'end_date' => 'sometimes|date_format:Y-m-d|after_or_equal:start_date',
            'location' => 'sometimes|string|max:255',
            'description' => 'nullable|string|max:500',
            'custom_start_time' => 'nullable|date_format:H:i',
            'custom_end_time' => 'nullable|date_format:H:i',
            'notes' => 'nullable|string|max:500',
        ]);

        $fieldWorkAssignment->update($validated);
        $fieldWorkAssignment->load(['employee', 'assignedByUser']);

        return response()->json($fieldWorkAssignment);
    }

    /**
     * DELETE /api/field-work-assignments/{id}
     * Delete a field work assignment
     */
    public function destroy(FieldWorkAssignment $fieldWorkAssignment)
    {
        $fieldWorkAssignment->delete();

        return response()->json(['message' => 'Field work assignment deleted successfully.']);
    }

    /**
     * GET /api/employees/{id}/field-work-assignments
     * Get all field work assignments for an employee
     */
    public function getEmployeeFieldWorkAssignments(Request $request, Employee $employee)
    {
        $query = $employee->fieldWorkAssignments()
            ->with('assignedByUser');

        if ($request->filled('year')) {
            $year = $request->integer('year');
            $query->whereYear('start_date', $year);
        }

        if ($request->boolean('active_only')) {
            $query->active();
        }

        $fieldWorkAssignments = $query->orderBy('start_date', 'desc')->get();

        return response()->json([
            'employee_id' => $employee->id,
            'employee_name' => $employee->name,
            'field_work_assignments' => $fieldWorkAssignments,
        ]);
    }
}
