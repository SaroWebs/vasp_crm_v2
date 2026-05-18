# Attendance Restructure Plan

## Overview

The attendance system will be revised to support multiple punch entries per employee per day. Each punch is stored in the `punches` table, and attendance records are derived from ordered punch pairs.

Key behavior:
- A user clicks the system punch button and a record is created in `punches` with `machineId = null`.
- Punches are evaluated in chronological order for the same employee and day.
- Odd-numbered punches become "in" entries; even-numbered punches become "out" entries.
- Attendance segments are built from consecutive in/out pairs: 1st punch = in, 2nd = out, 3rd = in, 4th = out, etc.

## Goals

- Keep each punch as a single source of truth.
- Build attendances from punch pairs rather than requiring manual in/out toggles.
- Preserve support for multiple office locations and mapped user operations.
- Ensure reporting and messaging flows adapt to the new punch-driven attendance model.

## Phase 1: Data model and capture flow

- [ ] Review and document current `punches` table schema and relationships.
- [ ] Confirm `machineId` is nullable for system punches.
- [ ] Ensure system punch button stores a punch row with employee ID, timestamp, office ID, and `machineId = null`.
- [ ] Map user and employee records to the correct office contexts for punch storage.
- [ ] Validate that multiple punches per day can be created without conflict.

## Phase 2: Attendance derivation logic

- [ ] Define the attendance-building algorithm from ordered punches.
- [ ] Implement logic to assign `in` and `out` status by odd/even punch sequence.
- [ ] Handle incomplete pairs gracefully (e.g. day ends on an odd punch without matching out).
- [ ] Determine how gaps, overlapping punches, and duplicate punches are reported.
- [ ] Decide whether to create or update attendance records after each new punch.

## Phase 3: System flow updates

- [ ] Update the attendance button/action flow to write directly to `punches`.
- [ ] Change any existing attendance creation flow that assumes explicit in/out actions.
- [ ] Ensure employee time summaries and daily attendance views are generated from punches.
- [ ] Adjust business rules for attendance approval, editing, and correction to use punch data.
- [ ] Confirm the punch-driven flow supports multiple offices and user-office mapping.

## Phase 4: Messaging and notifications

- [ ] Identify all messaging scenarios impacted by attendance changes.
- [ ] Update notifications to reference punch-generated attendance segments.
- [ ] Ensure message content remains clear when a day has multiple in/out pairs.
- [ ] Add alerts or summaries for incomplete punch pairs if required.
- [ ] Verify the messaging flow works for system punches and office punches.

## Phase 5: Reporting and validation

- [ ] Review attendance reports to confirm they aggregate data from punch pairs.
- [ ] Validate daily totals, overtime, and absence logic under the new model.
- [ ] Check edge cases: single punch day, odd number of punches, same-minute punches.
- [ ] Update any attendance export or analytics features to reflect punch-derived records.
- [ ] Test system behavior across multiple offices and employee mappings.

## Phase 6: Deployment and rollout

- [ ] Communicate the new punch-based attendance model to stakeholders.
- [ ] Provide a short implementation checklist for QA and operations.
- [ ] Monitor initial live usage for mismatched in/out sequences.
- [ ] Collect feedback and refine gaps in the new attendance flow.
- [ ] Finalize documentation for the attendance process and punch handling.
