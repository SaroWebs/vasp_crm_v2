## Manual Task Time Entry (Admin · Single Task View)

### Goal
- [ ] In `resources/js/pages/admin/tasks/Show.tsx`, add a “Time Entries” section that visualizes all `task_time_entries` for this task as a simple Gantt-style timeline.
- [ ] Allow admins/users to add missed time entries manually (start/end) and adjust entries by dragging/resizing on the timeline, then persist changes with an explicit “Save changes” action.

### Assumptions / Constraints
- [ ] Use existing `task_time_entries` table (`start_time`, `end_time`, `is_active`, `description`, `metadata`, soft deletes).
- [ ] Manual entries must be **completed** entries (`start_time` + `end_time` required, `is_active = false`).
- [ ] Existing play/pause/end actions keep working unchanged.
- [ ] Define allowed editors (super admin vs. own entries vs. any admin) and enforce consistently in API + UI.
- [ ] Timezone rules: decide whether timeline uses server TZ, user TZ, or app TZ; apply consistently for display and payloads.

### Backend (Laravel)
#### Read (Task Show payload)
- [ ] Ensure the admin task show endpoint includes `timeEntries` for the task (sorted by `start_time` asc) and any summary props needed (e.g., total minutes, day grouping).
- [ ] Eager load the `user` for each entry if the UI needs “who logged it”.

#### Create (Manual entry)
- [ ] Add a dedicated endpoint to create a manual time entry for a task:
  - [ ] Validate: `start_time` required, `end_time` required, `end_time > start_time`.
  - [ ] Force `is_active = false`.
  - [ ] Save `description` (optional) and/or `metadata` (optional).
- [ ] Authorization: only permitted roles can create manual entries on a task.

#### Update (Drag/resize adjust)
- [ ] Add endpoint(s) to update an existing time entry’s `start_time`/`end_time`:
  - [ ] Validate: `end_time > start_time`.
  - [ ] Block editing entries that are `is_active = true` (or define rule: must be ended first).
  - [ ] Authorization: only permitted roles can adjust.
- [ ] Add a **batch** “persist adjustments” endpoint to update multiple entries in one request (recommended for “adjust then Save” UX):
  - [ ] Payload: array of `{ id, start_time, end_time }`.
  - [ ] Validate all entries belong to the same `task_id`.
  - [ ] Transaction + per-entry authorization/validation.

#### Validation rules / edge cases
- [ ] Decide on overlap policy:
  - [ ] Allow overlaps (simple) OR
  - [ ] Prevent overlaps per user (recommended) and return friendly validation errors.
- [ ] Decide on minimum duration / snapping (e.g., 5-min increments) and enforce (server-side and client-side).
- [ ] Ensure soft-deleted entries are excluded by default.

### Frontend (Inertia + React)
#### Timeline UI (Gantt-like)
- [ ] Add a `Time Entries` card/section in `resources/js/pages/admin/tasks/Show.tsx`.
- [ ] Create/reuse a timeline component (consider extracting from patterns in `resources/js/components/admin/TaskTimeline.tsx`):
  - [ ] Render entries as horizontal bars on a time axis.
  - [ ] Support day view (default) with next/prev day navigation.
  - [ ] Optional: week view toggle if needed.
- [ ] Visual encoding:
  - [ ] Different style for active vs. completed entries.
  - [ ] Show entry duration and start/end on hover/tooltip.
  - [ ] Show entry owner (if applicable).

#### Manual add
- [ ] Add “Add manual entry” button:
  - [ ] Modal/panel with start/end datetime inputs + description.
  - [ ] Client validation and inline error display.
  - [ ] On success, insert into local list and update timeline.

#### Drag/resize + “Save changes”
- [ ] Implement bar dragging (moves start/end together) and resizing (adjusts start or end).
- [ ] Apply snapping (e.g., 5 min) and clamp to visible window/day bounds (as defined).
- [ ] Keep edits local until user clicks “Save changes”.
- [ ] “Save changes” button:
  - [ ] Disabled when no dirty changes.
  - [ ] Calls batch update endpoint; handles partial failures by highlighting failed entries.
- [ ] “Discard changes” action to revert local adjustments.

#### Accessibility / UX polish
- [ ] Keyboard alternatives for adjustments (optional but recommended): nudge start/end +/- 5 min.
- [ ] Loading/empty/error states for timeline and save operation.

### Testing (PHPUnit)
- [ ] Create feature tests for manual create endpoint:
  - [ ] Happy path creates `task_time_entries` row with `is_active = false`.
  - [ ] Reject invalid ranges (`end_time <= start_time`).
  - [ ] Authorization checks.
- [ ] Create feature tests for update/batch update:
  - [ ] Happy path updates times.
  - [ ] Reject updates on `is_active = true` entries (if enforced).
  - [ ] Overlap rules enforced (if implemented).

### Dev Notes
- [ ] If frontend route helpers are used, add/regen Wayfinder artifacts per project convention after adding routes.
