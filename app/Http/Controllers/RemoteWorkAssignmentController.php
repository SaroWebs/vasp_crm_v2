<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreRemoteWorkAssignmentRequest;
use App\Http\Requests\UpdateRemoteWorkAssignmentRequest;
use App\Models\Employee;
use App\Models\RemoteWorkAssignment;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class RemoteWorkAssignmentController extends Controller
{
    /**
     * GET /api/remote-work-assignments
     * List remote work assignments with filtering
     */
    public function index(Request $request): JsonResponse
    {
        $query = RemoteWorkAssignment::query()
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

        $assignments = $query->orderBy('start_date', 'desc')->paginate(20);

        return response()->json($assignments);
    }

    /**
     * POST /api/remote-work-assignments
     * Create a direct remote work assignment (admin assigned)
     */
    public function store(StoreRemoteWorkAssignmentRequest $request): JsonResponse
    {
        $validated = $request->validated();
        // $assigner is a type of User
        /** @var User $user */
        $user = Auth::user();

        if (! $user) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        if (! $user->isAdmin()) {
            return response()->json(['message' => 'Only admins can create remote work assignments.'], 403);
        }

        $validated['assigned_by_user_id'] = $user->id;

        // Check for overlapping assignments
        $overlapping = RemoteWorkAssignment::forEmployee($validated['employee_id'])
            ->forDateRange($validated['start_date'], $validated['end_date'])
            ->exists();

        if ($overlapping) {
            return response()->json([
                'message' => 'Employee already has a remote work assignment in this date range.',
                'error' => 'overlap',
            ], 422);
        }

        $assignment = RemoteWorkAssignment::create($validated);
        $assignment->load(['employee', 'assignedByUser']);

        return response()->json($assignment, 201);
    }

    /**
     * PUT /admin/remote-work-assignments/{id}
     * Update a direct remote work assignment.
     */
    public function update(UpdateRemoteWorkAssignmentRequest $request, RemoteWorkAssignment $remoteWorkAssignment): JsonResponse
    {
        /** @var User|null $user */
        $user = Auth::user();

        if (! $user) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        if (! $user->isAdmin()) {
            return response()->json(['message' => 'Only admins can update remote work assignments.'], 403);
        }

        $validated = $request->validated();
        $startDate = $validated['start_date'] ?? $remoteWorkAssignment->start_date->toDateString();
        $endDate = $validated['end_date'] ?? $remoteWorkAssignment->end_date->toDateString();

        $overlapping = RemoteWorkAssignment::forEmployee($remoteWorkAssignment->employee_id)
            ->whereKeyNot($remoteWorkAssignment->id)
            ->forDateRange($startDate, $endDate)
            ->exists();

        if ($overlapping) {
            return response()->json([
                'message' => 'Employee already has a remote work assignment in this date range.',
                'error' => 'overlap',
            ], 422);
        }

        $remoteWorkAssignment->update($validated);
        $remoteWorkAssignment->load(['employee', 'assignedByUser']);

        return response()->json($remoteWorkAssignment);
    }

    /**
     * DELETE /api/remote-work-assignments/{id}
     * Delete a remote work assignment
     */
    public function destroy(RemoteWorkAssignment $remoteWorkAssignment): JsonResponse
    {
        $remoteWorkAssignment->delete();

        return response()->json(['message' => 'Remote work assignment deleted successfully.']);
    }

    /**
     * GET /api/employees/{id}/remote-work-assignments
     * Get all remote work assignments for an employee
     */
    public function getEmployeeRemoteWorkAssignments(Request $request, Employee $employee): JsonResponse
    {
        $query = $employee->remoteWorkAssignments()->with('assignedByUser');

        if ($request->filled('year')) {
            $year = $request->integer('year');
            $query->whereYear('start_date', $year);
        }

        $perPage = $request->integer('per_page', 50);
        $assignments = $query->orderBy('start_date', 'desc')->paginate($perPage);

        return response()->json($assignments);
    }
}
