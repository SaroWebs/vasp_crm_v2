# Leave Management

This document explains the current leave-management implementation in the project and how it maps to the use case of fixed yearly leave entitlements such as:

- Casual Leave: 12 days
- Sick Leave: 8 days
- Annual Leave: 20 days
- Other custom leave buckets

The key idea in the current system is:

1. `leave_types` defines the kind of leave.
2. `leave_balances` defines how much of that leave an employee has for a given year.
3. `leave_requests` records how an employee uses leave.
4. `leave_approvals` records the approval trail.

## Current Data Model

### `leave_types`

Leave types are global templates, not employee-specific quotas.

Important fields:

- `name`
- `description`
- `duration_type`
- `default_hours`
- `requires_approval`
- `is_paid`
- `carry_over_allowed`
- `is_active`

Relevant files:

- [database/migrations/2026_05_25_120000_create_leave_types_table.php](../database/migrations/2026_05_25_120000_create_leave_types_table.php)
- [app/Models/LeaveType.php](../app/Models/LeaveType.php)
- [app/Http/Controllers/LeaveTypeController.php](../app/Http/Controllers/LeaveTypeController.php)

### `leave_balances`

This is the table that stores the employee entitlement for a specific leave type and year.

Important fields:

- `employee_id`
- `leave_type_id`
- `year`
- `opening_balance`
- `allocated_hours`
- `used_hours`
- `closing_balance`

Relevant files:

- [database/migrations/2026_05_25_120300_create_leave_balances_table.php](../database/migrations/2026_05_25_120300_create_leave_balances_table.php)
- [app/Models/LeaveBalance.php](../app/Models/LeaveBalance.php)
- [app/Http/Controllers/LeaveBalanceController.php](../app/Http/Controllers/LeaveBalanceController.php)

### `leave_requests`

This stores the actual leave application submitted by the employee or created by admin.

Important fields:

- `employee_id`
- `leave_type_id`
- `start_date`
- `end_date`
- `reason`
- `status`
- `requested_by_user_id`

Relevant files:

- [database/migrations/2026_05_25_120100_create_leave_requests_table.php](../database/migrations/2026_05_25_120100_create_leave_requests_table.php)
- [app/Models/LeaveRequest.php](../app/Models/LeaveRequest.php)
- [app/Http/Controllers/LeaveController.php](../app/Http/Controllers/LeaveController.php)

### `leave_approvals`

This is the audit trail for approve/reject decisions.

Important fields:

- `leave_request_id`
- `approved_by_user_id`
- `decision`
- `notes`
- `decided_at`

Relevant files:

- [database/migrations/2026_05_25_120200_create_leave_approvals_table.php](../database/migrations/2026_05_25_120200_create_leave_approvals_table.php)
- [app/Models/LeaveApproval.php](../app/Models/LeaveApproval.php)

## How Global Leave Assignment Works

In the current implementation, leave assignment is done by creating or updating a `leave_balances` row for each employee, leave type, and year.

The admin flow is already exposed through:

- `POST /api/leave-balances/bulk-assign`
- `POST /api/leave-balances`
- `PUT /api/leave-balances/{leaveBalance}`

The bulk assignment API can target:

- all employees
- employees in selected departments
- selected employees only

That behavior is wired in the admin leave types UI and the bulk assign controller.

Relevant files:

- [app/Http/Controllers/LeaveBalanceController.php](../app/Http/Controllers/LeaveBalanceController.php)
- [resources/js/pages/admin/leave-types/Index.tsx](../resources/js/pages/admin/leave-types/Index.tsx)

### Practical meaning of "12 days"

The database currently stores the entitlement in `allocated_hours`, even when the business language is "12 days".

So in practice:

- If your company treats one leave day as 8 hours, then 12 days becomes `96` hours.
- If your company uses a different working day length, the admin should allocate that converted hour value instead.
- For full-day leave types, the `duration_type` is usually `full_day`, but the entitlement still lives in the balance record.

This means the system already supports fixed counts of leave, but the count is represented as hours in storage.

## How Employees Use Leave

Employees use leave by submitting a leave request for a date range.

Two API paths exist today:

- authenticated employee self-service:
  - `GET /api/my/leaves`
  - `POST /api/my/leaves`
  - `GET /api/my/leave-balances`
- general leave management endpoints:
  - `GET /api/leave-requests`
  - `POST /api/leave-requests`
  - `POST /api/leave-requests/{id}/approve`
  - `POST /api/leave-requests/{id}/reject`

Relevant UI:

- [resources/js/components/attendance/LeaveRequestForm.tsx](../resources/js/components/attendance/LeaveRequestForm.tsx)
- [resources/js/components/attendance/LeaveHistoryList.tsx](../resources/js/components/attendance/LeaveHistoryList.tsx)
- [resources/js/components/attendance/LeaveBalanceDisplay.tsx](../resources/js/components/attendance/LeaveBalanceDisplay.tsx)
- [resources/js/components/admin/employees/LeavePanel.tsx](../resources/js/components/admin/employees/LeavePanel.tsx)

### Leave request flow

1. Employee picks a leave type.
2. Employee selects start and end dates.
3. Employee submits the request.
4. The request becomes `pending` unless it is created by admin.
5. Admin reviews and approves or rejects it.
6. Approval creates a `leave_approvals` record.

When a request is approved, the employee's attendance can be treated as leave for that date range by the attendance calculation layer.

Relevant file:

- [app/Services/AttendanceCalculationService.php](../app/Services/AttendanceCalculationService.php)

## Current Admin Workflow

The current admin workflow is:

1. Create or update leave types in `leave_types`.
2. Bulk-assign yearly balances through `leave-balances/bulk-assign`.
3. Review leave requests.
4. Approve or reject requests.

In the admin UI, assignment can be done:

- to all employees
- by department
- by individual selection

This is the right place to assign standard yearly entitlements like:

- Casual Leave = 12 days
- Sick Leave = 8 days
- Annual Leave = 20 days

## What Happens When Leave Is Approved

Approval currently does the following:

- changes the request status to `approved`
- creates a `leave_approvals` row
- deducts the consumed leave amount from the employee's yearly balance
- preserves approver, notes, and timestamp

The approval record is the audit trail.

The approval flow now validates that the employee has a matching leave balance for the year and enough remaining balance before the request can be approved.

## Employee Self-Service vs Admin-Managed Leaves

There are two usage patterns in the codebase.

### Employee self-service

Used for employees requesting their own leave and checking their own balance.

Endpoints:

- `GET /api/my/leaves`
- `POST /api/my/leaves`
- `GET /api/my/leave-balances`

### Admin-managed leave

Used for assigning leave on behalf of employees and for reviewing all requests.

Endpoints:

- `GET /api/leave-balances`
- `POST /api/leave-balances/bulk-assign`
- `GET /api/leave-requests`
- `POST /api/leave-requests/{id}/approve`
- `POST /api/leave-requests/{id}/reject`

## Important Implementation Note

The project currently has a small mismatch between the business idea and the data representation:

- business users think in days
- storage currently tracks entitlement in hours

That is workable, but the team should agree on one standard conversion rule, especially for:

- 1-day leave
- half-day leave
- custom-hour leave
- carry-forward rules at year end

If the company wants leave to be shown strictly as days everywhere, the current schema can still work, but the UI and calculations should consistently convert between days and hours instead of mixing both.

The current implementation now uses day-based leave requests as the source of truth and converts them into hours when deducting from balances.

## Recommended Operational Model

For this project, the cleanest operating model is:

1. Define leave types globally.
2. Assign yearly balances per employee using bulk assignment.
3. Store entitlements in a single unit consistently.
4. Let employees request leave against their balance.
5. Approve or reject requests with audit history.
6. Use approved leave dates in attendance calculation.

## Summary

The current system already supports the leave-management foundation needed for fixed annual leave quotas.

What is already present:

- global leave types
- per-employee per-year leave balances
- leave request and approval workflow
- admin bulk assignment
- employee balance visibility

What still needs careful product agreement:

- whether the business wants "days" or "hours" as the canonical unit
- whether approval should automatically deduct balance
- how partial-day leave should be normalized
- whether self-service should enforce balance checks before submission
