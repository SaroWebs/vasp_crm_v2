# Attendance System Enhancement Plan

**Date:** May 25, 2026  
**Status:** In Progress  
**Version:** 1.1

---

## Executive Summary

This document outlines a comprehensive enhancement plan for the attendance management system to support advanced workforce management scenarios including field work assignments, dynamic shift management, leave administration, overtime handling, holiday work adjustments, and administrative corrections.

---

## Current State Analysis

### Existing Architecture

**Models:**
- `Attendance`: Records punch-in/out with date, time, IP, mode (office/remote)
- `Employee`: Core employee with department, office assignments
- `EmployeeShiftAssignment`: Links employees to shifts with effective date ranges
- `Shift`: Defines working hours (start_time, end_time) with grace_minutes
- `Office`: Represents physical office locations

**Services:**
- `AttendanceCalculationService`: Computes metrics (early_in, late_in, early_out, late_out, overtime_minutes, total_work_minutes)
- `TimeCalculatorService`: Calculates working duration between two dates respecting working hours
- `DueDateCalculatorService`: Calculates task due dates based on estimated hours (currently depends on working hours configuration)

**Configuration:**
- `config/working-hours.json`: Default working hours by day of week (Mon-Fri: 09:00-18:00, Sat: 09:00-14:00)
- `config/holidays.json`: National and state holidays for 2026

**✅ Completed Models/Controllers:**
- `Holiday` model with date, name, type (national/state/restricted)
- `HolidayController` with index, store, update, delete, copyYear methods- `LeaveType` model (leave categories like Casual, Sick, Personal, etc.)
- `LeaveRequest` model (leave requests by employees)
- `LeaveApproval` model (approval audit trail)
- `LeaveBalance` model (employee leave balance tracking per year)
- `LeaveController` with CRUD, approve, reject endpoints
- `LeaveTypeController` for managing leave types
**Database Constraints:**
- `attendance.mode` enum: `office`, `remote`
- `employee.status` enum: `active`, `inactive`, `on_leave`, `terminated`
- Shift assignments have `effective_from` and `is_active` flags
- No explicit field work location tracking
- No leave/remote work request models
- No admin-override/correction audit trail

---

## New Requirements Analysis

### 1. **Field Work Assignment from Office**
**Scenario:** Admin assigns an employee to field work (location outside office).

**Current Gaps:**
- No field work location/address tracking
- Attendance mode only supports `office` or `remote`
- No tracking of which admin assigned the field work or when
- No audit trail for field work assignments

**Considerations:**
- Field work may have different working hours (flexible start/end, travel time)
- Need to distinguish between office, remote, and field work locations
- May require GPS/location verification or manual admin assignment
- Field work could be assigned for a single day or a range of dates

---

### 2. **Dynamic Working Hours with Shifts & Half Days**
**Scenario:** Working hours become dynamic based on shift assignment and day type.

**Current State:**
- Shifts exist but are not fully integrated into working hours resolution
- Half-day concept exists in config (Saturday: 5 hours)
- Only supports by-day-of-week working hours

**Current Flow:**
```
AttendanceCalculationService.resolveEffectiveShiftForEmployeeDate()
  → Checks EmployeeShiftAssignment for employee on given date
  → Falls back to config/working-hours.json by day of week
```

**Enhancement Needs:**
- Support half-day types beyond just Saturday (e.g., afternoon-only, morning-only, custom hours)
- Link half-days to leave records or admin designation
- Override working hours dynamically based on leave type or special assignment
- Support different shifts with different hours (e.g., Morning Shift 08:00-17:00, General Shift 09:00-18:00 ,Evening Shift 14:00-22:00)
- Track which working hours were applied to each attendance record

---

### 3. **Leave Management Integration**
**Scenario:** Leave requests, remote work requests, and admin approval workflows.

**Current Gaps:**
- `employee.status` has `on_leave` but no formal leave request model
- No leave types (Sick, Personal, Casual, Unpaid, Maternity, etc.)
- No leave balance tracking or leave year management
- No remote work request concept
- No approval workflow or audit trail

**Entities to Create:**
- `LeaveType`: Full day, half day, custom hours, unpaid, etc.
- `LeaveRequest`: Date range, reason, status (pending, approved, rejected, cancelled)
- `RemoteWorkRequest`: Date range, reason, approval status
- `LeaveBalance`: Tracks available and used leave per employee per year
- `LeaveApproval`: Audit record of who approved/rejected and why

**Business Rules:**
- Different leave types may have different approval workflows
- Leave requests must be approved before attendance is marked as "on leave"
- Remote work requests must be approved before mode is changed to `remote`
- Employees may request leave; admins may assign it
- Leave balance may be accrued or fixed per year
- Carry-over rules from previous year

---

### 4. **Task Management Independence from Working Hours**
**Scenario:** Task scheduling should not be bound to working hours since overtime work is allowed.

**Current Issue:**
- `Task.estimate_hours` field exists
- `DueDateCalculatorService.calculateDueDate()` is used to compute due dates based on working hours
- Tasks are scheduled assuming linear work within working hours only

**Problem Scenarios:**
- Employee works overtime on a task; should add to completion time
- Task assigned but employee is on leave; should push due date
- Multiple tasks assigned; working hours may not reflect actual capacity

**Enhancement Approach:**
- Decouple task scheduling from working hours configuration
- Introduce task capacity model (workload per employee per day)
- Account for leave, field work, and other absences when calculating task due dates
- Option 1: Calculate task due dates based on project calendar (working days only, not hours)
- Option 2: Use estimated hours but calculate from actual work completed (tracked via attendance)
- Option 3: Allow admin to manually set due dates; system calculates warnings based on workload

---

### 5. **Holiday Work with Leave Adjustment**
**Scenario:** Employee works on a holiday; may be adjusted with leave taken later.

**Current State:**
- `config/holidays.json` lists holidays
- `WorkingHoursService.isWorkingDay()` checks against holidays
- No explicit holiday work tracking or adjustment mechanism

**Enhancement Needs:**
- Track when employee works on a holiday (marked in attendance)
- Admin approval required for holiday work credit
- Holiday work credit can be adjusted/swapped with:
  - Leave taken on other dates
  - Reduced hours on other days
  - Compensatory off (comp-off) tracking
- Holiday work premium (1.5x or 2x credit depending on policy)
- Balance tracking: holiday worked vs. holiday compensated

**Entities Needed:**
- `HolidayWorkRecord`: Tracks when employee worked on holiday, hours, approval status
- `HolidayAdjustment`: Links holiday work to leave/comp-off adjustment
- `CompensatoryOff`: Track comp-off balance per employee

---

### 6. **Admin Corrections & Absence Marking**
**Scenario:** Admin can mark employee as absent or correct attendance due to employee mistake.

**Current Gaps:**
- No admin override/correction mechanism
- No audit trail for who made corrections and why
- No ability to retroactively mark as absent

**Enhancement Needs:**
- Admin can mark attendance as "Absent" even if punch records exist
- Admin can override calculated attendance status
- Audit trail: who made change, when, why (reason/notes)
- Correction workflow: soft/hard delete or correction record?
- Impact: Mark multiple days as absent if mistake spans multiple days

**Entities Needed:**
- `AttendanceCorrection`: Records admin corrections with before/after state
- `AttendanceOverride`: Admin-set attendance status that supersedes calculated status

---

## Proposed Enhancement Architecture

### A. Database Schema Extensions

#### New Models & Tables

**1. Leave Management**
```sql
-- leave_types table
CREATE TABLE leave_types (
  id BIGINT PRIMARY KEY,
  name VARCHAR(100) UNIQUE,        -- 'Sick Leave', 'Casual', 'Personal', 'Unpaid', etc.
  description TEXT,
  duration_type ENUM('full_day', 'half_day', 'custom_hours', 'hourly'),
  default_hours DECIMAL(5,2),      -- For half-day: typically 4-5 hours
  requires_approval BOOLEAN DEFAULT 1,
  is_paid BOOLEAN DEFAULT 1,
  carry_over_allowed BOOLEAN DEFAULT 0,
  created_at, updated_at
);

-- leave_requests table
CREATE TABLE leave_requests (
  id BIGINT PRIMARY KEY,
  employee_id BIGINT (foreign key),
  leave_type_id BIGINT (foreign key),
  start_date DATE,
  end_date DATE,
  reason TEXT,
  status ENUM('pending', 'approved', 'rejected', 'cancelled') DEFAULT 'pending',
  requested_by_user_id BIGINT,
  created_at, updated_at,
  INDEX idx_employee_date (employee_id, start_date, end_date),
  INDEX idx_status (status)
);

-- leave_approvals table (audit trail)
CREATE TABLE leave_approvals (
  id BIGINT PRIMARY KEY,
  leave_request_id BIGINT (foreign key),
  approved_by_user_id BIGINT (foreign key),
  decision ENUM('approved', 'rejected'),
  notes TEXT,
  decided_at TIMESTAMP,
  created_at, updated_at
);

-- leave_balances table
CREATE TABLE leave_balances (
  id BIGINT PRIMARY KEY,
  employee_id BIGINT (foreign key),
  leave_type_id BIGINT (foreign key),
  year INT,                        -- E.g., 2026
  opening_balance DECIMAL(10,2),   -- From previous year
  allocated_hours DECIMAL(10,2),   -- This year allocation
  used_hours DECIMAL(10,2),
  closing_balance DECIMAL(10,2),
  created_at, updated_at,
  UNIQUE KEY unique_employee_type_year (employee_id, leave_type_id, year)
);
```

**2. Remote Work & Field Work**
```sql
-- remote_work_requests table
CREATE TABLE remote_work_requests (
  id BIGINT PRIMARY KEY,
  employee_id BIGINT (foreign key),
  start_date DATE,
  end_date DATE,
  reason TEXT,
  status ENUM('pending', 'approved', 'rejected', 'cancelled') DEFAULT 'pending',
  requested_by_user_id BIGINT,
  approved_by_user_id BIGINT NULLABLE,
  created_at, updated_at,
  INDEX idx_employee_date (employee_id, start_date, end_date)
);

-- field_work_assignments table
CREATE TABLE field_work_assignments (
  id BIGINT PRIMARY KEY,
  employee_id BIGINT (foreign key),
  start_date DATE,
  end_date DATE,
  location TEXT,                   -- Address or site name
  assigned_by_user_id BIGINT (foreign key),
  notes TEXT,
  created_at, updated_at,
  INDEX idx_employee_date (employee_id, start_date, end_date)
};
```

**3. Holiday Work & Compensation**
```sql
-- holiday_work_records table
CREATE TABLE holiday_work_records (
  id BIGINT PRIMARY KEY,
  employee_id BIGINT (foreign key),
  holiday_date DATE (foreign key to holidays.json or holidays table),
  hours_worked DECIMAL(5,2),
  holiday_premium_multiplier DECIMAL(3,2) DEFAULT 1.5,  -- 1.5x or 2x
  status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
  approved_by_user_id BIGINT NULLABLE,
  created_at, updated_at,
  UNIQUE KEY unique_employee_holiday (employee_id, holiday_date),
  INDEX idx_status (status)
);

-- compensatory_offs table
CREATE TABLE compensatory_offs (
  id BIGINT PRIMARY KEY,
  employee_id BIGINT (foreign key),
  comp_off_hours DECIMAL(10,2),
  source_holiday_work_id BIGINT (foreign key to holiday_work_records),
  used_for_leave_request_id BIGINT NULLABLE (foreign key),
  status ENUM('available', 'used', 'expired') DEFAULT 'available',
  expiry_date DATE NULLABLE,
  created_at, updated_at
);
```

**4. Attendance Corrections**
```sql
-- attendance_corrections table
CREATE TABLE attendance_corrections (
  id BIGINT PRIMARY KEY,
  attendance_id BIGINT (foreign key),
  corrected_by_user_id BIGINT (foreign key),
  previous_status VARCHAR(50),           -- E.g., 'present', 'early_in', 'late_in'
  new_status VARCHAR(50),                -- E.g., 'absent', 'present'
  reason TEXT,
  created_at, updated_at,
  INDEX idx_attendance (attendance_id),
  INDEX idx_corrected_by (corrected_by_user_id)
};
```

**5. Dynamic Working Hours Tracking**
```sql
-- attendance_work_mode table
-- Extension to existing attendance table or separate tracking
ALTER TABLE attendances ADD COLUMN (
  work_mode ENUM('office', 'remote', 'field') DEFAULT 'office',
  field_work_assignment_id BIGINT NULLABLE (foreign key),
  applied_shift_id BIGINT NULLABLE (foreign key),
  applied_working_hours_start TIME NULLABLE,
  applied_working_hours_end TIME NULLABLE,
  is_half_day BOOLEAN DEFAULT 0,
  half_day_type VARCHAR(50) NULLABLE,   -- E.g., 'morning', 'afternoon', 'custom'
  is_holiday BOOLEAN DEFAULT 0,
  is_leave_day BOOLEAN DEFAULT 0,
  leave_type_id BIGINT NULLABLE (foreign key),
);
```

---

### B. Service Layer Enhancements

#### 1. Leave Management Service
```php
class LeaveManagementService
{
  // Check if employee is on leave on given date
  isEmployeeOnLeave(Employee $employee, Carbon $date): bool
  
  // Get leave request details for a date
  getLeaveRequestForDate(Employee $employee, Carbon $date): ?LeaveRequest
  
  // Get leave balance
  getLeaveBalance(Employee $employee, LeaveType $type, int $year): LeaveBalance
  
  // Request leave
  requestLeave(Employee $employee, LeaveRequest $data): LeaveRequest
  
  // Approve/reject leave
  approveLeaveRequest(LeaveRequest $request, User $approver, string $notes): void
  rejectLeaveRequest(LeaveRequest $request, User $approver, string $notes): void
  
  // Calculate used hours for period
  calculateUsedLeaveHours(Employee $employee, Carbon $start, Carbon $end): float
}
```

#### 2. Field Work Service
```php
class FieldWorkService
{
  // Check if employee is assigned to field work on date
  isEmployeeOnFieldWork(Employee $employee, Carbon $date): bool
  
  // Get field work assignment details
  getFieldWorkAssignment(Employee $employee, Carbon $date): ?FieldWorkAssignment
  
  // Assign employee to field work
  assignFieldWork(Employee $employee, FieldWorkAssignment $data): FieldWorkAssignment
  
  // Get working hours for field work (may differ from office)
  getFieldWorkHours(FieldWorkAssignment $assignment): array
}
```

#### 3. Remote Work Service
```php
class RemoteWorkService
{
  // Check if employee is approved for remote work on date
  isEmployeeRemoteWorkApproved(Employee $employee, Carbon $date): bool
  
  // Request remote work
  requestRemoteWork(Employee $employee, RemoteWorkRequest $data): RemoteWorkRequest
  
  // Approve/reject remote work request
  approveRemoteWorkRequest(RemoteWorkRequest $request, User $approver): void
  rejectRemoteWorkRequest(RemoteWorkRequest $request, User $approver, string $reason): void
}
```

#### 4. Enhanced Attendance Calculation Service
```php
class AttendanceCalculationService
{
  // ... existing methods ...
  
  // NEW: Resolve work mode for a date
  resolveWorkMode(Employee $employee, Carbon $date): string  // 'office', 'remote', 'field'
  
  // NEW: Check if date is leave/holiday/field work
  getEffectiveAttendanceContext(Employee $employee, Carbon $date): array
  // Returns:
  // {
  //   'is_leave': bool,
  //   'leave_type_id': ?int,
  //   'is_holiday': bool,
  //   'is_field_work': bool,
  //   'field_location': ?string,
  //   'is_remote_approved': bool,
  //   'work_mode': string,
  //   'working_hours_start': DateTime,
  //   'working_hours_end': DateTime
  // }
  
  // NEW: Mark attendance as absent (admin override)
  markAsAbsent(Attendance $attendance, User $admin, string $reason): AttendanceCorrection
  
  // NEW: Get correction history
  getCorrectionHistory(Attendance $attendance): Collection<AttendanceCorrection>
}
```

#### 5. Holiday Work Service
```php
class HolidayWorkService
{
  // Record employee working on holiday
  recordHolidayWork(Employee $employee, Carbon $date, float $hours): HolidayWorkRecord
  
  // Approve holiday work
  approveHolidayWork(HolidayWorkRecord $record, User $approver): void
  
  // Create compensatory off from holiday work
  createCompensatoryOff(HolidayWorkRecord $record): CompensatoryOff
  
  // Check available comp-off balance
  getAvailableCompOff(Employee $employee): float
  
  // Adjust holiday work with leave taken
  adjustHolidayWithLeave(HolidayWorkRecord $holiday, LeaveRequest $leave): HolidayAdjustment
}
```

#### 6. Task Scheduling Service (Decoupled from Working Hours)
```php
class TaskSchedulingService
{
  // Calculate task due date considering leaves, field work, comp-off
  calculateTaskDueDate(
    Task $task,
    Carbon $startDate,
    Employee $assignee,
    float $estimateHours
  ): Carbon
  // Logic:
  // 1. Start from startDate
  // 2. Subtract any approved leave days
  // 3. Subtract any field work days (unless field work has specific hours)
  // 4. Calculate based on remaining available working days
  // 5. Account for task priority and other assignments to the employee
  
  // Get employee workload for date range
  getEmployeeWorkload(Employee $employee, Carbon $start, Carbon $end): array
  // Returns hours available per day
  
  // Check if employee can accept new task by due date
  canEmployeeCompleteByDate(
    Employee $employee,
    float $estimateHours,
    Carbon $dueDate
  ): bool
}
```

---

### C. Workflow & Business Logic

#### 1. Attendance Calculation Flow (Updated)

```
┌─ AttendanceCalculationService.buildShiftMetrics(employee, date)
│
├─ 1. Get Effective Attendance Context
│  ├─ Is leave day? → LeaveManagementService.isEmployeeOnLeave()
│  ├─ Is holiday? → Check config/holidays.json
│  ├─ Is field work? → FieldWorkService.isEmployeeOnFieldWork()
│  └─ Is remote approved? → RemoteWorkService.isEmployeeRemoteWorkApproved()
│
├─ 2. Determine Work Mode & Location
│  ├─ If field work → field_work_assignment.location
│  ├─ If remote approved → attendance.mode = 'remote'
│  └─ Else → attendance.mode = 'office'
│
├─ 3. Resolve Effective Working Hours
│  ├─ If leave day → No working hours (skip)
│  ├─ If field work → Use field work hours (if specified)
│  ├─ If shift assigned → Use shift start/end
│  └─ Else → Use config/working-hours.json by day
│
├─ 4. Calculate Metrics
│  ├─ early_in, late_in, early_out, late_out, overtime
│  └─ Store applied_working_hours for audit
│
├─ 5. Check for Corrections
│  ├─ If AttendanceCorrection exists → Use new_status
│  └─ Mark attendance_corrections.id for reference
│
└─ 6. Determine Final Status
   ├─ If leave → Status = 'on_leave'
   ├─ If admin-marked absent → Status = 'absent'
   ├─ If no punch records → Status = 'absent'
   ├─ If holiday worked → Status = 'holiday_work'
   └─ Else → Use calculated status (present, early_in, late_in, etc.)
```

#### 2. Leave Request Approval Workflow

```
Employee Request Leave
  ↓
LeaveManagementService.requestLeave()
  ├─ Create LeaveRequest (status = pending)
  ├─ Check leave balance
  └─ Notify manager/approver
  ↓
[Manager Reviews]
  ├─ Option 1: Approve
  │  ├─ LeaveManagementService.approveLeaveRequest()
  │  ├─ Create LeaveApproval record
  │  ├─ Deduct from LeaveBalance
  │  ├─ Update attendance for leave days
  │  └─ Notify employee
  │
  └─ Option 2: Reject
     ├─ LeaveManagementService.rejectLeaveRequest()
     ├─ Create LeaveApproval record
     └─ Notify employee
```

#### 3. Field Work Assignment Workflow

```
Admin Assigns Field Work
  ↓
FieldWorkService.assignFieldWork()
  ├─ Create FieldWorkAssignment
  ├─ Specify location and dates
  ├─ Optionally specify custom working hours
  ├─ Store assigned_by_user_id (audit trail)
  └─ Notify employee
  ↓
[During attendance calculation]
  ├─ Check if employee is on field work for date
  ├─ Use field work location (if provided)
  ├─ Use field work hours (if specified) or use default shift
  └─ Mark attendance with work_mode = 'field'
```

#### 4. Holiday Work & Compensation Workflow

```
Employee Works on Holiday
  ↓
HolidayWorkService.recordHolidayWork()
  ├─ Create HolidayWorkRecord (status = pending)
  ├─ Specify hours worked and premium multiplier
  └─ Notify manager for approval
  ↓
[Manager Approves]
  ├─ HolidayWorkService.approveHolidayWork()
  ├─ Create CompensatoryOff record
  ├─ Track comp-off balance
  └─ Mark attendance as 'holiday_work'
  ↓
[Later: Adjust with Leave]
  ├─ Employee takes leave
  ├─ HolidayAdjustmentService.linkLeaveToHolidayWork()
  ├─ Reduce comp-off balance
  └─ Audit trail recorded
```

#### 5. Task Scheduling (Decoupled from Working Hours)

**Before (Current):**
```
Task created with estimate_hours
  → DueDateCalculatorService uses working_hours config
  → Due date = start_date + (estimate_hours / daily_hours)
  → No consideration for leaves or capacity
```

**After (Proposed):**
```
Task created with estimate_hours
  → TaskSchedulingService.calculateTaskDueDate()
  ├─ Check assignee's approved leaves in period
  ├─ Check assignee's field work assignments
  ├─ Check assignee's existing task load
  ├─ Calculate available working hours
  └─ Due date = start_date + (estimate_hours / available_hours_per_day)
  
  ↓
  
  Can also use project calendar approach:
  → Due date = start_date + estimate_days (working days only)
  → No hourly calculation; simpler for planning
```

---

### D. API Endpoints (New)

#### Leave Management
```
POST   /api/leave-requests                 - Create leave request
GET    /api/leave-requests                 - List user's leave requests
GET    /api/leave-requests/{id}            - Get leave request details
PUT    /api/leave-requests/{id}            - Cancel leave request
POST   /api/leave-requests/{id}/approve    - Approve leave (admin)
POST   /api/leave-requests/{id}/reject     - Reject leave (admin)
GET    /api/employees/{id}/leave-balance   - Get employee's leave balance
GET    /api/leave-types                    - List leave types
```

#### Remote Work
```
POST   /api/remote-work-requests           - Request remote work
GET    /api/remote-work-requests           - List requests
POST   /api/remote-work-requests/{id}/approve   - Approve (admin)
POST   /api/remote-work-requests/{id}/reject    - Reject (admin)
```

#### Field Work
```
POST   /api/employees/{id}/field-work      - Assign field work (admin)
GET    /api/employees/{id}/field-work      - Get field work assignments
DELETE /api/field-work/{id}                - Cancel field work (admin)
```

#### Holiday Work
```
POST   /api/holiday-work                   - Record holiday work
GET    /api/employees/{id}/holiday-work    - Get employee's holiday work
POST   /api/holiday-work/{id}/approve      - Approve holiday work (admin)
GET    /api/employees/{id}/comp-off        - Get comp-off balance
```

#### Attendance Corrections
```
POST   /api/attendance/{id}/mark-absent    - Mark as absent (admin)
GET    /api/attendance/{id}/corrections    - Get correction history
POST   /api/attendance/{id}/override       - Override status (admin)
```

---

## Implementation Roadmap

### Phase 1: Leave Management Foundation
**Duration:** 2-3 weeks
- ✅ Create leave type, leave request, leave balance models
- ✅ Create LeaveController with CRUD endpoints
- Create LeaveTypeController for leave type management
- Implement basic approval workflow
- Add leave balance calculation logic
- Update attendance calculation to check for leave days
- API endpoints for leave CRUD and approval
- **Tests:** Leave request creation, approval, balance tracking

### Phase 2: Remote Work & Field Work
**Duration:** 1-2 weeks
- ✅ RemoteWorkRequest model with approval workflow
- ✅ FieldWorkAssignment model with location tracking
- ✅ RemoteWorkController for request management
- ✅ FieldWorkController for assignment management
- ✅ API endpoints for both remote work and field work
- Integrate into attendance calculation for work_mode tracking

### Phase 3: Holiday Work & Compensation
**Duration:** 1-2 weeks
- Create holiday work and comp-off models
- Implement holiday work recording and approval
- Comp-off balance tracking
- Holiday work linking with leave adjustments
- **Tests:** Holiday work recording, comp-off calculation, adjustment logic

### Phase 4: Attendance Corrections & Overrides
**Duration:** 1 week
- Create attendance correction model and audit trail
- Implement admin mark-absent functionality
- Add correction history UI
- **Tests:** Correction creation, audit trail, status updates

### Phase 5: Task Scheduling Decoupling
**Duration:** 2-3 weeks
- Refactor `DueDateCalculatorService` to use `TaskSchedulingService`
- Integrate leave/field work/comp-off into due date calculation
- Add workload capacity checking
- Update task assignment logic
- **Tests:** Due date calculation with leaves, workload validation

### Phase 6: UI & Reporting
**Duration:** 3-4 weeks
- Build React components for leave request form
- Remote work request interface
- Field work assignment interface (admin)
- Holiday work recording interface
- Attendance correction interface (admin)
- Employee reports: leave balance, holiday work, comp-off
- Admin reports: leave approvals, field work assignments, attendance corrections

### Phase 7: Integration & Refinement
**Duration:** 1-2 weeks
- End-to-end testing of all workflows
- Performance optimization
- Documentation and training

---

## Data Migration Strategy

### For Existing Attendance Records
- No changes needed for existing `attendances` table initially
- Backfill `work_mode` field as `office` for all historical records
- Backfill `applied_shift_id` and `applied_working_hours_*` for audit trail

### For Existing Employee Leave Status
- Review employees with `status = 'on_leave'`
- Create retroactive `LeaveRequest` records if needed
- Initialize leave balances based on employment date and policy

---

## Configuration & Policy

### Leave Policy Configuration
```json
{
  "leave_policies": {
    "casual_leave": {
      "yearly_allocation": 12,
      "carry_over_limit": 5,
      "carry_over_expiry_days": 365,
      "requires_approval": true
    },
    "sick_leave": {
      "yearly_allocation": 10,
      "carry_over_limit": 0,
      "requires_approval": false,
      "documentation_required_days": 3
    },
    "personal_leave": {
      "yearly_allocation": 5,
      "carry_over_limit": 0,
      "requires_approval": true
    }
  },
  "holiday_work_multiplier": 1.5,
  "comp_off_expiry_days": 365
}
```

### Field Work Configuration
```json
{
  "field_work": {
    "default_hours": "09:00-18:00",
    "travel_time_allowance_minutes": 30,
    "requires_approval": false,
    "location_tracking_required": false
  }
}
```

---

## Testing Strategy

### Unit Tests
- LeaveManagementService: balance calculation, request validation
- FieldWorkService: assignment logic, date range overlap checking
- HolidayWorkService: comp-off calculation, premium multiplier
- TaskSchedulingService: due date calculation with leaves

### Feature Tests
- Leave request creation and approval workflow
- Field work assignment and mode switching
- Holiday work recording and compensation
- Attendance correction and audit trail
- Task due date calculation with complex scenarios

### Integration Tests
- End-to-end leave request workflow
- Multi-field work assignment overlap detection
- Holiday work adjustment with leave
- Task rescheduling when leave is approved

---

## Considerations & Risks

### 1. Data Consistency
- **Risk:** Leave record and attendance may drift if not synchronized
- **Mitigation:** Use transactions for approval workflows; audit trail for corrections

### 2. Timezone Handling
- **Risk:** Field work locations may span multiple timezones
- **Mitigation:** Store timezone with field work assignment; calculate working hours accordingly

### 3. Retroactive Changes
- **Risk:** Changing past leave/field work may affect historical calculations
- **Mitigation:** Audit trail; prevent modification of past records (only corrections allowed)

### 4. Performance
- **Risk:** Multiple service calls for complex attendance calculation
- **Mitigation:** Eager load related records; cache leave/field work info per week

### 5. User Communication
- **Risk:** Employees may not understand complex leave approval or comp-off logic
- **Mitigation:** Clear UI; help documentation; admin training

---

## Success Metrics

1. **Adoption:** > 80% of employees request leave through system within 1 month
2. **Accuracy:** > 95% of attendance records correctly categorized (office/remote/field/leave)
3. **Turnaround:** Leave approvals completed within 24 hours on average
4. **Satisfaction:** > 4/5 average rating from admin and employee surveys
5. **Performance:** Attendance calculation < 500ms per employee per day

---

## Future Enhancements

1. **Geo-fencing:** GPS verification for field work attendance
2. **Biometric Integration:** Link punch records to face recognition or fingerprint
3. **Machine Learning:** Predict leave requirements; anomaly detection in attendance
4. **Multi-country Support:** Handle different holiday calendars, leave policies by region
5. **Integration:** Export to payroll system; sync with HR platforms
6. **Mobile App:** Field employee self-service for remote work/holiday work requests
7. **Analytics:** Dashboard for leave trends, compliance reporting, workforce analytics

---

## Glossary

| Term | Definition |
|------|-----------|
| **Leave Request** | Formal request by employee to take leave for a date range |
| **Approved Leave** | Leave request that has been reviewed and approved by manager/admin |
| **Field Work** | Work assignment outside office; may have flexible hours |
| **Remote Work** | Work from home or other location; requires prior approval |
| **Comp-Off** | Compensatory off; time off earned by working on holiday |
| **Holiday Work** | Work done on a public holiday; tracked separately for compensation |
| **Work Mode** | Type of work location: office, remote, or field |
| **Grace Period** | Allowed late arrival before marking as late (configured per shift) |
| **Half Day** | Work period with reduced hours (e.g., 4-5 hours instead of 9-10) |
| **Admin Override** | Manual correction of attendance status by administrator |

---

## Appendix: Current Code References

**✅ Completed Files:**
- [database/migrations/2026_05_25_115615_create_holidays_table.php](database/migrations/2026_05_25_115615_create_holidays_table.php) - Holiday model
- [app/Models/Holiday.php](app/Models/Holiday.php) - Holiday model
- [app/Http/Controllers/HolidayController.php](app/Http/Controllers/HolidayController.php) - Holiday CRUD controller
- [database/migrations/2026_05_25_120000_create_leave_types_table.php](database/migrations/2026_05_25_120000_create_leave_types_table.php) - LeaveType
- [database/migrations/2026_05_25_120100_create_leave_requests_table.php](database/migrations/2026_05_25_120100_create_leave_requests_table.php) - LeaveRequest
- [database/migrations/2026_05_25_120200_create_leave_approvals_table.php](database/migrations/2026_05_25_120200_create_leave_approvals_table.php) - LeaveApproval
- [database/migrations/2026_05_25_120300_create_leave_balances_table.php](database/migrations/2026_05_25_120300_create_leave_balances_table.php) - LeaveBalance
- [app/Models/LeaveType.php](app/Models/LeaveType.php) - Leave type model
- [app/Models/LeaveRequest.php](app/Models/LeaveRequest.php) - Leave request model
- [app/Models/LeaveApproval.php](app/Models/LeaveApproval.php) - Leave approval audit model
- [app/Models/LeaveBalance.php](app/Models/LeaveBalance.php) - Leave balance tracking model
- [app/Http/Controllers/LeaveController.php](app/Http/Controllers/LeaveController.php) - Leave request controller
- [app/Http/Controllers/LeaveTypeController.php](app/Http/Controllers/LeaveTypeController.php) - Leave type controller
- [database/migrations/2026_05_25_120400_create_remote_work_requests_table.php](database/migrations/2026_05_25_120400_create_remote_work_requests_table.php) - RemoteWorkRequest
- [database/migrations/2026_05_25_120500_create_field_work_assignments_table.php](database/migrations/2026_05_25_120500_create_field_work_assignments_table.php) - FieldWorkAssignment
- [app/Models/RemoteWorkRequest.php](app/Models/RemoteWorkRequest.php) - Remote work request model
- [app/Models/FieldWorkAssignment.php](app/Models/FieldWorkAssignment.php) - Field work assignment model
- [app/Http/Controllers/RemoteWorkController.php](app/Http/Controllers/RemoteWorkController.php) - Remote work controller
- [app/Http/Controllers/FieldWorkController.php](app/Http/Controllers/FieldWorkController.php) - Field work controller
- [routes/api.php](routes/api.php) - API routes for leave, remote work, and field work management

**Key Files to Update/Reference:**
- [app/Models/Attendance.php](app/Models/Attendance.php) - Add work_mode, applied_shift_id fields
- [app/Models/Employee.php](app/Models/Employee.php) - ✅ Added relationships to leave, remote work, field work
- [app/Services/AttendanceCalculationService.php](app/Services/AttendanceCalculationService.php) - Refactor for new logic
- [app/Services/TimeCalculatorService.php](app/Services/TimeCalculatorService.php) - Reference for time calculations
- [app/Services/DueDateCalculatorService.php](app/Services/DueDateCalculatorService.php) - Decouple from working hours
- [config/working-hours.json](config/working-hours.json) - Keep for baseline; extend with policies
- [config/holidays.json](config/holidays.json) - Already maintained; use in all workflows

**Testing Files:**
- [tests/Feature/AttendanceCalculationTest.php](tests/Feature/AttendanceCalculationTest.php) - Existing tests; extend
- New test files: `LeaveManagementTest`, `FieldWorkTest`, `HolidayWorkTest`, `TaskSchedulingTest`

---

**Document Version:** 1.2  
**Last Updated:** May 25, 2026  
**Status:** Implementation In Progress - Phase 2 Complete

## Phases Complete
- ✅ Phase 1: Leave Management
- ✅ Phase 2: Remote Work & Field Work
- 🔄 Phase 3: Holiday Work & Compensation (Next)

## Recent Updates

### May 25, 2026 - Phase 1 & Phase 2 Implementation
- ✅ Phase 1 (Leave Management) - COMPLETED
  - Holiday model and migration created
  - HolidayController with full CRUD + copyYear functionality
  - LeaveType, LeaveRequest, LeaveApproval, LeaveBalance models
  - LeaveController & LeaveTypeController with full CRUD
  - API routes configured
  - Employee model relationships added

- ✅ Phase 2 (Remote Work & Field Work) - COMPLETED
  - ✅ `RemoteWorkRequest` model & migration (`2026_05_25_120400_create_remote_work_requests_table.php`)
    - Status workflow: pending → approved/rejected/cancelled
    - Approval audit trail with notes
  - ✅ `FieldWorkAssignment` model & migration (`2026_05_25_120500_create_field_work_assignments_table.php`)
    - Location tracking with custom working hours support
    - Date range based assignments
  - ✅ `RemoteWorkController` - list, create, approve, reject, update, delete
  - ✅ `FieldWorkController` - list, create, update, delete with location filtering
  - ✅ API routes for both remote work and field work
  - ✅ Employee model relationships added (remoteWorkRequests, fieldWorkAssignments)
  - ✅ Overlap detection for both remote work and field work
  - ✅ All migrations executed successfully
