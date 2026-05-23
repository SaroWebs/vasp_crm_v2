# Shift In/Out + Late/Early Plan (No Existing Data Removal)

## Current Attendance System (As-Is)
- Raw punches are stored in `punches` (`EmployeeId`, `MachineId`, `PunchTime`, etc.).
- Processed daily segments are rebuilt into `attendances` by `syncAttendanceFromPunches()`.
- Current summary already calculates `late_days` using `WorkingHoursService` start time.
- Existing data risk point: `syncAttendanceFromPunches()` deletes same-day rows in `attendances` before inserting rebuilt rows.

## Goal 
- Add shift concept: expected shift start/end per employee/day.
- Track both:
  - Late In (actual in > shift start)
  - Early Out (actual out < shift end)
- Keep all existing data intact (no destructive migration, no historical deletion).

## Safe Design (Backward Compatible)
1. Keep `punches` and current `attendances` untouched for historical compatibility.
2. Add new nullable columns to `attendances` (additive only):
   - `shift_name` (string, nullable)
   - `shift_start` (time, nullable)
   - `shift_end` (time, nullable)
   - `late_minutes` (unsigned integer, default 0)
   - `early_out_minutes` (unsigned integer, default 0)
   - `is_late` (boolean, default false)
   - `is_early_out` (boolean, default false)
3. Add one new shift configuration table (or employee shift assignment table) instead of changing old tables.
4. Update sync logic to enrich attendance rows with shift + late/early metadata at write time.

## Step-by-Step Implementation Plan
1. **Create Shift Master + Assignment**
   - Add `shifts` table: `name`, `start_time`, `end_time`, `grace_minutes`, `is_active`.
   - Add `employee_shift_assignments` table: `employee_id/code`, `shift_id`, `effective_from`, `effective_to` (nullable), `is_active`.
   - This supports shift changes without editing old attendance records.

2. **Add Additive Columns To Attendances**
   - Create migration to add only nullable/new defaulted fields listed above.
   - Do not modify/remove existing columns.

3. **Resolve Shift Per Attendance Date**
   - In sync flow, resolve employee's active shift for that `attendance_date`.
   - If no shift assignment exists, keep shift fields null and late/early as 0/false.

4. **Calculate Late/Early During Sync**
   - Late formula: `max(0, punch_in - (shift_start + grace))` in minutes.
   - Early-out formula: if `punch_out` exists, `max(0, shift_end - punch_out)`.
   - Set `is_late` and `is_early_out` from minute values.

5. **Backfill (Non-Destructive)**
   - Build a console command that processes existing `attendances` in chunks and fills new shift/late/early columns.
   - Command must only `update` new columns, never delete rows.
   - Keep dry-run option first, then real run.

6. **API + UI Additions**
   - Include new fields in attendance API responses.
   - Add columns/chips in admin + employee attendance views:
     - Shift name/time
     - Late minutes
     - Early-out minutes
   - Keep old totals unchanged initially; add new summary cards later.

7. **Reporting Updates**
   - Extend summary methods with:
     - `early_out_days`
     - `total_late_minutes`
     - `total_early_out_minutes`
   - Keep `late_days` behavior compatible with current output.

8. **Testing (Must Have Before Release)**
   - Feature tests for sync:
     - On-time in/out -> no late/early
     - Late in only
     - Early out only
     - Both late + early same day
     - No shift assigned (all new fields neutral)
   - Backfill command test: updates only new columns, row count unchanged.

9. **Rollout Order (Production Safe)**
   - Deploy migrations (additive only).
   - Deploy code reading/writing new fields.
   - Run backfill command in off-peak hours.
   - Verify sample employees/dates.
   - Enable UI summary cards after verification.

## Data Safety Rules (Do Not Break Existing Data)
- Never truncate `attendances` or `punches`.
- Never remove/rename old columns used by existing pages.
- Backfill with chunked updates only.
- Keep existing API keys and response structure; only append new keys.

## Quick Execution Checklist
- [ ] Create shift tables + model relations
- [ ] Add additive attendance columns
- [ ] Implement shift resolver service
- [ ] Implement late/early calculator in sync flow
- [ ] Create backfill command with dry-run
- [ ] Add/adjust tests
- [ ] Deploy + run backfill + validate
