# Employee Inactive, Termination, And Deletion Todo

## 1. Audit Employee Usage

- List all endpoints and components that expose employee choices outside Employee Management.
- Classify each usage as one of:
  - Management/history view: may show inactive or terminated employees.
  - Future activity selector: active employees only.
  - Historical record lookup: should still resolve inactive or terminated employees.
- Check affected areas:
  - Attendance.
  - Shifts.
  - Leave.
  - Remote work.
  - Field work.
  - Reports.
  - Dashboard.
  - Workload.
  - Tasks.
  - Sales or activity flows if employee pickers exist.

## 2. Backend Employee Status Foundation

- Update `App\Models\Employee`.
- Add `status` to `$fillable`.
- Add status constants or enum-like helpers.
- Add query scopes:
  - `scopeActive`.
  - `scopeInactive`.
  - `scopeAssignable` or `scopeAvailableForActivity`.
- Add helper methods:
  - `isActive()`.
  - `isInactive()`.
  - `isTerminated()`.
  - `canReceiveFutureAssignments()`.

## 3. Termination Data

- Create a migration for `employee_terminations`.
- Suggested columns:
  - `id`.
  - `employee_id`.
  - `status`.
  - `termination_type`.
  - `effective_date`.
  - `reason`.
  - `notes`.
  - `created_by_user_id`.
  - timestamps.
- Create an `EmployeeTermination` model.
- Add relationships:
  - `Employee::termination()`.
  - `Employee::terminations()` if keeping history.
  - `EmployeeTermination::employee()`.
  - `EmployeeTermination::createdBy()`.

## 4. Validation Requests

- Create or update Form Request classes:
  - `UpdateEmployeeRequest`.
  - `TerminateEmployeeRequest`, or include termination fields in the update request.
  - `DeleteEmployeeRequest` if using typed confirmation.
- Move controller validation out of inline `$request->validate()`.
- Validate:
  - `status` is one of the allowed employee statuses.
  - Termination fields are required when status is `inactive` or `terminated`.
  - Delete confirmation matches the employee name or code if typed confirmation is used.

## 5. Employee Update Flow

- Update `EmployeeController@update`.
- Save normal employee fields.
- Save `status`.
- If status becomes `inactive` or `terminated`:
  - Mark linked `user.status = inactive`.
  - Create a termination record.
  - Close active shift assignment if needed.
- If status becomes `active`:
  - Optionally reactivate the linked user.
  - Keep termination history for audit instead of deleting it.

## 6. Employee Management Listing

- Update `EmployeeController@index`.
- Include `status` in JSON select.
- Add status filter support:
  - `all`.
  - `active`.
  - `inactive`.
  - `terminated`.
  - `on_leave`.
- Keep inactive and terminated employees visible in Employee Management.
- Include termination relationship in the detail response.

## 7. Operational Filtering

- Update every future-assignment and selector query to use active employees only.
- Likely backend targets:
  - `EmployeeController@getList`.
  - `ShiftController@employees`.
  - `ReportController@getEmployees`.
  - `EmployeeProgressController`, where appropriate.
  - `DashboardService`.
  - `WorkloadMatrixService`.
  - Leave, remote work, field work, and holiday assignment endpoints.
- Avoid filtering historical detail endpoints where the employee is already part of an existing record.

## 8. Frontend Types

- Update `resources/js/types/index.d.ts`.
- Add employee fields:
  - `status`.
  - `termination`.
  - Termination metadata types.
- Ensure employee table and detail panels can render status safely.

## 9. Employee Edit UI

- Add a status select to the employee edit form.
- Add conditional fields when status is `inactive` or `terminated`:
  - Termination type.
  - Effective date.
  - Reason.
  - Notes.
- Add clear copy that inactive or terminated employees will not appear in future activity selectors.

## 10. Employee Index UI

- Add a status filter beside search and department.
- Add status badge in employee table rows.
- Add status badge in side detail panel.
- Show termination information in the detail panel if present.

## 11. Delete UI

- Add delete action only for users with `employee.delete`.
- Show a destructive confirmation dialog.
- Warning text should explain:
  - Permanent deletion may remove employee-related data.
  - The recommended action is to keep the employee and mark inactive or terminated.
- Add safer primary action: `Mark Inactive` or `Cancel`.
- Add destructive action: `Delete Employee`.
- Optional: require typing the employee code or name before the delete button enables.

## 12. Delete Backend

- Update `EmployeeController@destroy`.
- Use a database transaction.
- Decide behavior:
  - Preferred: soft delete employee only.
  - Stronger: force delete only with explicit request and confirmation.
- Clean up appropriate pivots:
  - Offices.
  - Shift assignments, if not preserving.
  - User relationship and login access.
- Preserve historical records unless the business explicitly requires removal.

## 13. Tests

- Add feature tests for status visibility.
- Test Employee Management includes inactive employees.
- Test operational employee list excludes inactive and terminated employees.
- Test updating status to inactive creates a termination record.
- Test linked user becomes inactive.
- Test reactivating employee behaves correctly.
- Test delete requires permission and confirmation.
- Test delete does not accidentally expose deleted employees in the management list unless intended.

## 14. Formatting And Verification

- Run focused PHP tests:
  - `php artisan test --compact --filter=Employee`.
- Run the specific new test file if created.
- Run Pint:
  - `.\vendor\bin\pint.bat --dirty --format agent`.
- Run frontend lint for edited TSX files:
  - `.\node_modules\.bin\eslint.cmd <edited files>`.
- Regenerate Wayfinder actions if backend routes or signatures change and the project expects generated route files to be committed.

## 15. Post-Change Graph

- If `graphify` is available and `graphify-out` is restored, run:
  - `graphify update .`.
- Current workspace is missing `graphify-out/GRAPH_REPORT.md`, so this may be skipped unless the graph exists again.
