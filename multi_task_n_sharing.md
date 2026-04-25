# Multi Assignee Task Sharing: Working Algorithm + TODOs

## Problem Summary (Current Behavior)
- A shared task can have multiple assignees.
- When one assignee starts time tracking, the task state becomes `InProgress` globally.
- Other assignees then see the task as active/busy and can get blocked from starting their own work.
- Time-entry "active" detection is effectively treated as task-level in parts of API/UI instead of strictly user-level.

## Root Cause (Why This Happens)
- Time entries are stored per `(task_id, user_id)` correctly, but some reads use all task time entries.
- Frontend active detection often checks: "does task have any active entry?" instead of "does current user have active entry?"
- Global task lifecycle state (`InProgress`, `Done`) is used as if it represents each assignee's personal work session.
- Context flow attempts to pause an "active task" before starting another; if active flag came from someone else's entry, the pause/start chain fails for current user.

## Design Goal
- Keep **task state global** for workflow visibility.
- Keep **work session state user-specific** for time tracking and UI behavior.
- Guarantee: one user's active timer never blocks another user from starting/pausing/resuming their own entries.

---

## Proposed Algorithm

### 1) Separate Two States Clearly
- `task.state` (global workflow): `Draft`, `Assigned`, `InProgress`, `Blocked`, `InReview`, `Done`, etc.
- `assignment.state` (per user on shared task): `pending`, `accepted`, `in_progress`, `completed`, `rejected`.

Rule:
- Workflow state answers: "where is the task overall?"
- Assignment state answers: "what is this specific assignee doing?"

### 2) Enforce Single Active Entry Per User (Not Per Task)
- Invariant: a user can have max 1 active time entry at a time across all tasks.
- Start/resume flow for user U on task T:
1. Lock U's active entries (transaction + row lock).
2. End any active entry of U on task != T.
3. If U already has active entry on T, return idempotent success.
4. Else create new active entry for (T, U).
5. Set assignment state (T, U) -> `in_progress`.

### 3) Global Task State Derivation (Safe for Shared Tasks)
- On any assignment/time-entry change, derive `task.state`:
1. If all active assignments are terminal (`completed`/`rejected`) -> `Done` (or business terminal state).
2. Else if at least one assignment is `in_progress` -> `InProgress`.
3. Else if at least one assignment is `accepted` -> `Assigned`.
4. Else keep `Draft`/existing rule.

Important:
- Do not mark task `Done` just because one assignee ended tracking.
- Mark task `Done` only by explicit business rule (all required assignees done, or manager closes task).

### 4) Time Calculation Rules
- Per-user time on task:
`sum(completed entries for task_id + user_id) + active_duration(current active entry if exists)`
- Total task time:
`sum(all users' completed entries for task_id) + sum(all active durations on task)`
- Remaining time:
- If estimate is per-task shared effort: `estimate_task_seconds - total_task_seconds`.
- If estimate is per-assignee: track `task_assignments.estimated_time` and compute per user independently.

### 5) Read/API Contract for Shared Tasks
- Always return current-user scoped active flags:
- `my_active_entry` for task (entry or null).
- `my_is_tracking` boolean derived from `my_active_entry`.
- Optionally include `other_active_users_count` for awareness UI.
- Avoid using raw `timeEntries.some(is_active)` in client logic without filtering by `user_id === auth.id`.

### 6) UI Behavior Contract
- Start/Pause/Resume buttons use only `my_is_tracking`.
- Show badge like "2 others are tracking" without blocking current user.
- If current user starts another task, backend auto-pauses only that user's active entry.
- Never call pause on a task unless current user actually has an active entry there.

---

## Suggested Data/Domain Adjustments
- Keep `task_time_entries` as source of truth for actual durations.
- Use `task_assignments.state` as per-assignee workflow state.
- Add/ensure index for active lookup:
- `(user_id, is_active)` already exists; keep it.
- Add partial unique constraint at DB level if supported:
  - one active entry per user (`user_id`) where `is_active = true` and `deleted_at is null`.
- Add optional columns if needed:
- `task_assignments.started_at`, `task_assignments.last_paused_at`, `task_assignments.total_seconds_cached` (optional optimization, not mandatory).

---

## Implementation TODOs (Concrete)

## Backend
- [ ] In task/time endpoints, filter active entry checks by current user only.
- [ ] Make start/resume endpoints idempotent for same `(task,user)` active entry.
- [ ] In start/resume, pause only current user's other active entries.
- [ ] Update end-task behavior: do not auto-complete task globally unless completion rule is satisfied.
- [ ] Add service method to derive and update global `task.state` from assignment states.
- [ ] Ensure all reads for board/my-task endpoints provide `my_active_entry` and `my_is_tracking`.
- [ ] Wrap start/resume/pause/end in DB transaction + lock for race-safety.

## Frontend
- [ ] Replace any `time_entries.some(is_active)` logic with user-filtered check.
- [ ] In time tracking context, set active task by "my active entry", not "any active entry on task".
- [ ] Before pausing prior active task, verify current user is tracking that task.
- [ ] In task cards/detail, show separate indicators:
  - my tracking state
  - collaborators tracking count
- [ ] Decouple button disable logic from global `task.state` where needed.

## Testing (Must Have)
- [ ] Feature: two users assigned same task; User A starts; User B can still start another task.
- [ ] Feature: User A starts shared task; User B sees "others tracking" but own start/resume still works.
- [ ] Feature: ending User A entry does not mark task `Done` if User B assignment still active/pending.
- [ ] Feature: start/resume race test for same user (no duplicate active entries).
- [ ] Feature: total task time = sum of entries from all assignees; per-user time isolated correctly.

---

## Rollout Strategy
1. Fix backend scoping + idempotency first.
2. Update frontend active-state logic to current-user scoped fields.
3. Add shared-task concurrency tests.
4. Backfill/repair any inconsistent active entries (if needed) with one-time script/command.

## Acceptance Criteria
- One assignee starting shared task does not block others from tracking their own work.
- UI accurately distinguishes "my timer" vs "someone else is working."
- Time reports are correct per user and at aggregate task level.
- Task completion is not prematurely triggered by a single assignee.


