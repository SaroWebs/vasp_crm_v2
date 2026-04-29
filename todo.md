# Todo List - Biometric Punch Integration

## Phase 1: Foundation
- [x] Update `Attendance` model with `$fillable` fields:
    - `employee_id`, `machine_id`, `attendance_date`, `punch_in`, `punch_out`, `ip`, `employee_name`, `group_name`, `is_live`.
- [x] Define API route: `POST /api/upload_punch_data`.

## Phase 2: Implementation
- [x] Create `AttendanceController` with `uploadPunchData` method.
- [x] Implement Validation for Payload:
    - `EmployeeId` (bigint), `MachineId` (string), `PunchTime` (datetime), `Ip` (string), `GroupName` (string), `EmployeeName` (string), `Islive` (bool).
- [x] Implement Punch Logic:
    - Extract `date` and `time` from `PunchTime`.
    - Check for existing record where `employee_id = EmployeeId` and `attendance_date = date`.
    - If new: Create record, set `punch_in = time`. (`punch_out` remains null).
    - If exists: Update `punch_out = time`.
- [x] Map `EmployeeId` from payload to `employee_id` column (refers to `employees.code`).

## Phase 3: Testing & Validation
- [x] Create feature test `AttendanceUploadTest`.
- [x] Test Case: First punch of the day sets `punch_in`.
- [x] Test Case: Second punch of the day updates `punch_out`.
- [x] Test Case: Third punch of the day updates `punch_out` again.
- [x] Run `vendor/bin/pint` for code styling.
- [x] Final verification of database records.
