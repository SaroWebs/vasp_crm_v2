<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class EmployeeOfficeController extends Controller
{
    /**
     * Update the active office for the logged-in employee.
     */
    public function updateActiveOffice(Request $request)
    {
        $validated = $request->validate([
            'office_id' => 'required|exists:offices,id',
        ]);

        $user = Auth::user();
        $employee = $user->employee;

        if (! $employee) {
            return back()->with('error', 'Employee record not found.');
        }

        // Check if the office is assigned to the employee
        if (! $employee->offices()->where('offices.id', $validated['office_id'])->exists()) {
            return back()->with('error', 'The selected office is not assigned to you.');
        }

        // Set all offices as inactive first
        $employee->offices()->updateExistingPivot($employee->offices->pluck('id'), ['is_active' => false]);

        // Set the selected office as active
        $employee->offices()->updateExistingPivot($validated['office_id'], ['is_active' => true]);

        return back()->with('success', 'Active office updated successfully.');
    }
}
