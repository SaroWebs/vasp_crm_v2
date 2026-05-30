# Combined Attendance Management Plan

**Consolidated Date:** May 27, 2026  
**Status:** In Progress  
**Version:** 1.0

---

## Table of Contents
1. [Attendance System Enhancement Plan](#attendance-system-enhancement-plan)
2. [Employee Interconnections Dashboard Plan](#employee-interconnections-dashboard-plan)
3. [UI/UX Improvement Plan](#uix-improvement-plan)
4. [Current Status Summary](#current-status-summary)

---

# Attendance System Enhancement Plan

**Date:** May 25, 2026  
**Status:** In Progress  
**Version:** 1.1

## Executive Summary

This document outlines a comprehensive enhancement plan for the attendance management system to support advanced workforce management scenarios including field work assignments, dynamic shift management, leave administration, overtime handling, holiday work adjustments, and administrative corrections.

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

### ✅ Completed Models/Controllers
- `Holiday` model with date, name, type (national/state/restricted)
- `HolidayController` with index, store, update, delete, copyYear methods
- `LeaveType` model (leave categories like Casual, Sick, Personal, etc.)
- `LeaveRequest` model (leave requests by employees)
- `LeaveApproval` model (approval audit trail)
- `LeaveBalance` model (employee leave balance tracking per year)
- `LeaveController` with CRUD, approve, reject endpoints
- `LeaveTypeController` for managing leave types

## New Requirements Analysis

### 1. Field Work Assignment from Office
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

### 2. Dynamic Working Hours with Shifts & Half Days
**Current Flow:**
```
AttendanceCalculationService.resolveEffectiveShiftForEmployeeDate()
  → Checks EmployeeShiftAssignment for employee on given date
  → Falls back to config/working-hours.json by day of week
```

**Enhancement Needs:**
- Support half-day types beyond just Saturday
- Link half-days to leave records or admin designation
- Override working hours dynamically based on leave type or special assignment
- Support different shifts with different hours
- Track which working hours were applied to each attendance record

### 3. Leave Management Integration
**Entities Created:**
- `LeaveType`: Full day, half day, custom hours, unpaid, etc.
- `LeaveRequest`: Date range, reason, status (pending, approved, rejected, cancelled)
- `RemoteWorkRequest`: Date range, reason, approval status
- `LeaveBalance`: Tracks available and used leave per employee per year
- `LeaveApproval`: Audit record of who approved/rejected and why

### 4. Task Management Independence from Working Hours
**Problem Scenarios:**
- Employee works overtime on a task; should add to completion time
- Task assigned but employee is on leave; should push due date
- Multiple tasks assigned; working hours may not reflect actual capacity

### 5. Holiday Work with Leave Adjustment
**Entities Needed:**
- `HolidayWorkRecord`: Tracks when employee worked on holiday, hours, approval status
- `HolidayAdjustment`: Links holiday work to leave/comp-off adjustment
- `CompensatoryOff`: Track comp-off balance per employee

### 6. Admin Corrections & Absence Marking
**Entities Needed:**
- `AttendanceCorrection`: Records admin corrections with before/after state
- `AttendanceOverride`: Admin-set attendance status that supersedes calculated status

---

## Proposed Enhancement Architecture

### A. Database Schema Extensions

#### New Models & Tables

**1. Leave Management**
- `leave_types` table: id, name, description, duration_type, default_hours, requires_approval, is_paid, carry_over_allowed
- `leave_requests` table: id, employee_id, leave_type_id, start_date, end_date, reason, status, requested_by_user_id
- `leave_approvals` table: id, leave_request_id, approved_by_user_id, decision, notes, decided_at
- `leave_balances` table: id, employee_id, leave_type_id, year, opening_balance, allocated_hours, used_hours, closing_balance

**2. Remote Work & Field Work**
- `remote_work_requests` table: employee_id, start_date, end_date, reason, status, requested_by_user_id, approved_by_user_id
- `field_work_assignments` table: employee_id, start_date, end_date, location, assigned_by_user_id, notes

**3. Holiday Work & Compensation**
- `holiday_work_records` table: employee_id, holiday_date, hours_worked, holiday_premium_multiplier, status, approved_by_user_id
- `compensatory_offs` table: employee_id, comp_off_hours, source_holiday_work_id, used_for_leave_request_id, status, expiry_date

**4. Attendance Corrections**
- `attendance_corrections` table: attendance_id, corrected_by_user_id, previous_status, new_status, reason

**5. Dynamic Working Hours Tracking**
- Add columns to `attendances` table: work_mode, field_work_assignment_id, applied_shift_id, applied_working_hours_start, applied_working_hours_end, is_half_day, half_day_type, is_holiday, is_leave_day, leave_type_id

### B. Service Layer Enhancements

#### 1. Leave Management Service
```php
class LeaveManagementService
{
  isEmployeeOnLeave(Employee $employee, Carbon $date): bool
  getLeaveRequestForDate(Employee $employee, Carbon $date): ?LeaveRequest
  getLeaveBalance(Employee $employee, LeaveType $type, int $year): LeaveBalance
  requestLeave(Employee $employee, LeaveRequest $data): LeaveRequest
  approveLeaveRequest(LeaveRequest $request, User $approver, string $notes): void
  rejectLeaveRequest(LeaveRequest $request, User $approver, string $notes): void
  calculateUsedLeaveHours(Employee $employee, Carbon $start, Carbon $end): float
}
```

#### 2. Field Work Service
```php
class FieldWorkService
{
  isEmployeeOnFieldWork(Employee $employee, Carbon $date): bool
  getFieldWorkAssignment(Employee $employee, Carbon $date): ?FieldWorkAssignment
  assignFieldWork(Employee $employee, FieldWorkAssignment $data): FieldWorkAssignment
  getFieldWorkHours(FieldWorkAssignment $assignment): array
}
```

#### 3. Remote Work Service
```php
class RemoteWorkService
{
  isEmployeeRemoteWorkApproved(Employee $employee, Carbon $date): bool
  requestRemoteWork(Employee $employee, RemoteWorkRequest $data): RemoteWorkRequest
  approveRemoteWorkRequest(RemoteWorkRequest $request, User $approver): void
  rejectRemoteWorkRequest(RemoteWorkRequest $request, User $approver, string $reason): void
}
```

#### 4. Enhanced Attendance Calculation Service
```php
class AttendanceCalculationService
{
  resolveWorkMode(Employee $employee, Carbon $date): string  // 'office', 'remote', 'field'
  getEffectiveAttendanceContext(Employee $employee, Carbon $date): array
  markAsAbsent(Attendance $attendance, User $admin, string $reason): AttendanceCorrection
  getCorrectionHistory(Attendance $attendance): Collection<AttendanceCorrection>
}
```

#### 5. Holiday Work Service
```php
class HolidayWorkService
{
  recordHolidayWork(Employee $employee, Carbon $date, float $hours): HolidayWorkRecord
  approveHolidayWork(HolidayWorkRecord $record, User $approver): void
  createCompensatoryOff(HolidayWorkRecord $record): CompensatoryOff
  getAvailableCompOff(Employee $employee): float
  adjustHolidayWithLeave(HolidayWorkRecord $holiday, LeaveRequest $leave): HolidayAdjustment
}
```

#### 6. Task Scheduling Service
```php
class TaskSchedulingService
{
  calculateTaskDueDate(Task $task, Carbon $startDate, Employee $assignee, float $estimateHours): Carbon
  getEmployeeWorkload(Employee $employee, Carbon $start, Carbon $end): array
  canEmployeeCompleteByDate(Employee $employee, float $estimateHours, Carbon $dueDate): bool
}
```

### C. Workflow & Business Logic

#### Attendance Calculation Flow (Updated)
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
│  ├─ If field work → work_mode = 'field', location from assignment
│  ├─ If remote approved → work_mode = 'remote'
│  └─ Else → work_mode = 'office'
│
├─ 3. Resolve Effective Working Hours
│  ├─ If leave day → No working hours (skip)
│  ├─ If field work → Use field work hours
│  ├─ If shift assigned → Use shift start/end
│  └─ Else → Use config/working-hours.json by day
│
└─ 4. Determine Final Status
   ├─ If leave → Status = 'on_leave'
   ├─ If holiday worked → Status = 'holiday_work'
   └─ Else → Use calculated status
```

---

# Employee Interconnections Dashboard Plan

## Overview

This document outlines a plan for implementing a professional and clean interface that presents the interconnections between the Employee module and related modules (Attendance, Tasks, Reports) in the VASP CRM application.

## Current System Analysis

Based on code analysis, the current interconnections are:

1. **Employee ↔ Attendance**
   - Employee hasMany Attendance through `employee_id` (references Employee.code)
   - Attendance belongsTo Employee

2. **Employee ↔ Tasks**
   - Employee hasOne User (user_id)
   - User belongsToMany Task through `task_assignments` pivot table
   - Task belongsToMany User (assignedUsers relationship)

3. **Employee ↔ Reports**
   - Employee hasOne User (user_id)
   - Report belongsTo User (user_id)
   - Report belongsToMany Task through `report_tasks` pivot table

## Goals

1. Create a unified dashboard showing an employee's activity across all three modules
2. Present data in a professional, clean interface consistent with existing UI patterns
3. Provide meaningful insights without requiring navigation between separate pages
4. Maintain performance through efficient data fetching
5. Follow Laravel Boost guidelines and existing code conventions

---

# UI/UX Improvement Plan

## Current State

### Fragmented Workflows
- Attendance monitoring, shift planning, and employee profile work are separated into independent pages
- No inline row-level actions for exceptions in daily attendance table

### Limited Operational Monitoring
- No live activity section showing employees currently onsite or pending approvals
- Late arrivals, missing punch-outs shown only as table values

### Shift Management Issues
- Shift page is CRUD table with modals instead of planning workspace
- No calendar-oriented views or conflict detection

## UI Redesign Recommendations

### Dashboard Improvements
- Add attendance operations panel with daily attendance summary
- Live activity section showing currently punched-in employees
- Quick action cards for: `Open Today`, `Assign Shift`, `Review Exceptions`
- Anomaly indicator bar for top issues

### Attendance Module Improvements
- Two-pane layout: left = exception summary/filters, right = attendance list
- Tabbed view: Daily / Live / Exceptions / Summary
- Detail drawer on row click with punch timeline
- Bulk operations support
- Status chips with color coding

### Employee Profile Improvements
- Add `Attendance Snapshot` card with current shift status, today's punch status
- Add `Recent Attendance` tab with monthly calendar view
- Add `Current shift` card with shift window and assignment dates
- Add attendance analytics: average punch times, streaks

### Shift Management Improvements
- Workspace with shift cards and 7-day summary panel
- Calendar/roster view for shift assignments
- Conflict detection and missing assignment indicators
- Shift rotation/template workflow

## Navigation Redesign

### Structural Changes
```
Dashboard
People Operations
  ├─ Attendance Overview
  ├─ Live Attendance
  ├─ Shifts & Rosters
  └─ Employees
My Work
  ├─ My Attendance
  └─ My Tasks
System
  ├─ Notifications
  ├─ Roles & Permissions
```

---

# Current Status Summary

## Completed Work

### Phase 1: Leave Management ✅
- Models: `LeaveType`, `LeaveRequest`, `LeaveApproval`, `LeaveBalance`
- Controllers: `LeaveController`, `LeaveTypeController`
- Migrations executed
- Employee relationships added (`leaveRequests`, `leaveBalances`)

### Phase 2: Remote Work & Field Work ✅
- Models: `RemoteWorkRequest`, `FieldWorkAssignment`
- Controllers: `RemoteWorkController`, `FieldWorkController`
- Migrations executed
- Employee relationships added (`remoteWorkRequests`, `fieldWorkAssignments`)
- `LeavePanel.tsx` UI component created with tabs

## Remaining Work (Prioritized)

### Priority 1: Employee Leave Management Integration ❌
**Missing:**
- Leave integration with `AttendanceCalculationService`
- Attendance not marked as "on_leave" when leave approved
- No automatic leave balance deduction on approval
- Employees cannot view their own balances/requests

### Priority 2: Shift Management Enhancement ❌
**Missing:**
- No API to change employee shifts
- No overlap checking for shift assignments
- Shift transitions mid-period not handled properly
- No admin shift reassignment workflow

### Priority 3: Field Work Approval Workflow ❌
**Missing:**
- No approval status in `FieldWorkAssignment`
- No approve/reject endpoints for field work
- Attendance not marked with `work_mode='field'`
- No field work request (only admin assignment)

## Implementation Roadmap

### Immediate Next Steps
1. Integrate leave with attendance calculation
2. Add shift change/reassignment endpoints
3. Add field work approval workflow
4. Create employee self-service endpoints

### Testing Requirements
- Unit tests for LeaveManagementService
- Feature tests for shift assignment workflows
- Integration tests for attendance-leave correlation