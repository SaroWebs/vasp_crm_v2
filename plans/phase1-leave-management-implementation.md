# Leave Management Implementation Summary

**Date:** May 25, 2026  
**Status:** ✅ Leave Management Phase Complete  
**Phase:** 1 of 7

---

## Overview

Comprehensive leave management system has been created to support:
- Leave type management (Casual, Sick, Personal, etc.)
- Leave request workflow (pending → approved/rejected)
- Leave balance tracking per employee per year
- Approval audit trail
- API endpoints for all leave operations

---

## Files Created

### Migrations (4 tables)
1. **`2026_05_25_120000_create_leave_types_table.php`**
   - Stores leave type definitions
   - Fields: name, description, duration_type, default_hours, requires_approval, is_paid, carry_over_allowed, is_active

2. **`2026_05_25_120100_create_leave_requests_table.php`**
   - Stores employee leave requests
   - Fields: employee_id, leave_type_id, start_date, end_date, reason, status, requested_by_user_id
   - Status: pending, approved, rejected, cancelled

3. **`2026_05_25_120200_create_leave_approvals_table.php`**
   - Audit trail for leave request decisions
   - Fields: leave_request_id, approved_by_user_id, decision (approved/rejected), notes, decided_at

4. **`2026_05_25_120300_create_leave_balances_table.php`**
   - Tracks employee leave balance per year
   - Fields: employee_id, leave_type_id, year, opening_balance, allocated_hours, used_hours, closing_balance

### Models (4 models)
1. **`app/Models/LeaveType.php`**
   - Relationships: hasMany(LeaveRequest), hasMany(LeaveBalance)
   - Scopes: active(), requiresApproval()

2. **`app/Models/LeaveRequest.php`**
   - Relationships: belongsTo(Employee), belongsTo(LeaveType), belongsTo(User), hasMany(LeaveApproval)
   - Scopes: pending(), approved(), forEmployee(), forDateRange()
   - Methods: getDaysCount()

3. **`app/Models/LeaveApproval.php`**
   - Relationships: belongsTo(LeaveRequest), belongsTo(User)

4. **`app/Models/LeaveBalance.php`**
   - Relationships: belongsTo(Employee), belongsTo(LeaveType)
   - Scopes: forEmployee(), forYear(), forLeaveType()
   - Methods: getAvailableBalance()

### Controllers (2 controllers)
1. **`app/Http/Controllers/LeaveTypeController.php`**
   - `index()` - List all leave types
   - `store()` - Create new leave type
   - `show()` - Get specific leave type
   - `update()` - Update leave type
   - `destroy()` - Delete leave type (with validation)

2. **`app/Http/Controllers/LeaveController.php`**
   - `index()` - List leave requests with filtering
   - `store()` - Create leave request with overlap checking
   - `show()` - Get specific leave request
   - `update()` - Update leave request (if pending only)
   - `destroy()` - Cancel leave request
   - `approve()` - Approve leave request with audit trail
   - `reject()` - Reject leave request with reason
   - `getLeaveBalance()` - Get employee's leave balance for year
   - `getEmployeeLeaveRequests()` - Get all leaves for employee

### Updated Files
1. **`app/Models/Employee.php`**
   - Added: `leaveRequests()` relationship
   - Added: `leaveBalances()` relationship

2. **`routes/api.php`**
   - Added: Leave type routes (CRUD)
   - Added: Leave request routes (CRUD + approve/reject)
   - Added: Employee leave balance and request routes

---

## API Endpoints

### Leave Types
```
GET    /api/leave-types                    List all leave types
POST   /api/leave-types                    Create leave type
GET    /api/leave-types/{id}              Get specific leave type
PUT    /api/leave-types/{id}              Update leave type
DELETE /api/leave-types/{id}              Delete leave type
```

### Leave Requests
```
GET    /api/leave-requests                List leave requests (with filters)
POST   /api/leave-requests                Create leave request
GET    /api/leave-requests/{id}          Get specific leave request
PUT    /api/leave-requests/{id}          Update leave request (if pending)
DELETE /api/leave-requests/{id}          Cancel leave request
POST   /api/leave-requests/{id}/approve  Approve leave request
POST   /api/leave-requests/{id}/reject   Reject leave request
```

### Employee Leave Info
```
GET    /api/employees/{id}/leave-balance       Get leave balance for year
GET    /api/employees/{id}/leave-requests      Get employee's all leaves
```

---

## Key Features

### Leave Type Management
- Support for multiple duration types: full_day, half_day, custom_hours, hourly
- Configurable approval requirement and payment status
- Carry-over policy support

### Leave Request Workflow
```
Employee Request → Pending → Manager Review → Approved/Rejected
                                  ↓
                          LeaveApproval record created
                          Audit trail maintained
```

### Overlap Detection
- Prevents duplicate leave requests for same date range
- Checks both pending and approved leaves

### Audit Trail
- Every approval/rejection creates LeaveApproval record
- Tracks approver, decision, notes, timestamp

### Leave Balance Tracking
- Separate balance record per employee, leave type, and year
- Tracks: opening balance, allocated, used, closing
- Calculate available balance on demand

---

## Validation Rules

### Leave Type Creation
- name: unique, max 100 chars
- description: optional
- duration_type: required (full_day, half_day, custom_hours, hourly)
- default_hours: optional, numeric, 0-24
- requires_approval: boolean
- is_paid: boolean
- carry_over_allowed: boolean

### Leave Request Creation
- employee_id: required, exists in employees table
- leave_type_id: required, exists in leave_types table
- start_date: required, date format Y-m-d
- end_date: required, after_or_equal to start_date
- reason: optional, max 500 chars
- No overlapping leave requests allowed

### Approval/Rejection
- Leave request must be in pending status
- notes: optional for approval, required for rejection

---

## Database Relationships

```
Employee (1) ──→ (many) LeaveRequest ──→ (many) LeaveApproval
                              ↓
                         LeaveType (1) ──→ (many) LeaveRequest
                              
Employee (1) ──→ (many) LeaveBalance ──→ (1) LeaveType

LeaveApproval ──→ User (approver)
LeaveRequest ──→ User (requester)
```

---

## Next Steps (Phase 2)

1. ✅ **Leave Management System** - COMPLETED
2. **Remote Work Requests**
   - Create RemoteWorkRequest model/migration
   - Implement approval workflow
   - Add to API routes

3. **Field Work Assignments**
   - Create FieldWorkAssignment model/migration
   - Admin assignment interface
   - Location tracking

4. **Integrate with Attendance Calculation**
   - Update AttendanceCalculationService to check for leave days
   - Mark attendance as "on_leave" for approved leave requests
   - Update work_mode and other flags

---

## Testing Checklist

- [ ] Create leave type via API
- [ ] Update leave type
- [ ] Delete leave type with validation
- [ ] Request leave with valid data
- [ ] Request leave with overlapping dates (should fail)
- [ ] Approve leave request
- [ ] Reject leave request with reason
- [ ] Cancel pending leave request
- [ ] Get employee leave balance
- [ ] Get employee all leave requests
- [ ] Approve/reject only affects pending leaves
- [ ] Audit trail recorded for all decisions

---

## Configuration

Leave types can be seeded with factory/seeder. Example leave types:
```php
LeaveType::create([
    'name' => 'Casual Leave',
    'duration_type' => 'full_day',
    'default_hours' => 9,
    'requires_approval' => true,
    'is_paid' => true,
    'carry_over_allowed' => true,
]);

LeaveType::create([
    'name' => 'Sick Leave',
    'duration_type' => 'full_day',
    'default_hours' => 9,
    'requires_approval' => false,
    'is_paid' => true,
    'carry_over_allowed' => false,
]);
```

---

## Status

✅ **Phase 1 (Leave Management):** COMPLETED
- All migrations executed successfully
- All models created with relationships
- All controllers with CRUD operations
- API routes configured
- Ready for testing and UI integration

**Previous Phase:**
- ✅ Holiday Management (Holiday model, migrations, controller, routes)

**Upcoming Phases:**
- Phase 2: Remote Work Requests
- Phase 3: Field Work Assignments
- Phase 4: Holiday Work & Compensation
- Phase 5: Attendance Corrections
- Phase 6: Task Scheduling Decoupling
- Phase 7: UI & Reporting

---

**Document:** [plans/attendance-enhancement-plan.md](plans/attendance-enhancement-plan.md)  
**Implementation Date:** May 25, 2026
