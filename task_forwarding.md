# Task Forwarding - Status Audit (2026-04-27)

## Current algorithm (as implemented)
1. User calls forwarding endpoint (`POST /data/tasks/{task}/forwardings` or `POST /tasks/{task}/forward`).
2. Controller validates `to_department_id`, `reason`, optional `priority`, `due_date`, `notes`.
3. Permission check: requires `task.update`.
4. Department check: user must belong to task's current assigned department (or be super admin by role check).
5. Prevents forwarding to same department.
6. In DB transaction:
   - Creates a `task_forwardings` row with `status = pending`.
   - Updates task assignment department to the target department.
   - Sends in-app and external notifications to target department users/managers.
7. Accept/reject endpoints update the forwarding record and notify original forwarder.

## Completed
- `task_forwardings` table exists with status + audit fields.
- Forwarding model and relationships exist.
- Forwarding API routes exist (list/create/accept/reject).
- Basic permission and department guardrails are implemented.
- Duplicate-department forwarding is blocked.
- Notifications are wired for forward, accept, reject events.
- Forwarding history can be fetched and displayed in task modal (`TaskCard` list view).

## Remaining / gaps
- No automated tests for forwarding flow (feature/unit coverage is missing).
- `TaskForwardingController@store` does not set required `from_user_id` even though migration defines it as non-nullable.
- Task updates in forwarding use inconsistent task fields:
  - Uses `due_date` instead of canonical `due_at`.
  - Accept/reject set `status` (`in-progress` / `pending`) while task workflow uses `state` (`InProgress`, etc.).
- Super admin check uses `hasRole('superadmin')` while project conventions commonly use `super-admin` slug.
- No state guard to prevent repeated/invalid accept/reject transitions on non-pending forwardings.
- UI currently shows forwarding history only; no visible create/accept/reject action flow in React pages.
- Forwarding list UI expects `forwarded_by_user`, but loaded relation is `forwardedBy` (`forwarded_by` in JSON), so "Forwarded by" may not render.
- Multi-hop forwarding chain visualization is not implemented (example: E1 -> E5 -> E8).
- No forwarded-state icon on task cards / gantt bars / other task list surfaces.
- No waterfall/hierarchy structure in task details to show forward path sequence and lineage.

## New Requirement Added (Forward Chain UX)
### Scenario
- If employee `E1` forwards a task to `E5`, and `E5` forwards the same task to `E8`, the UI must preserve and show full forwarding lineage.

### Expected behavior
1. Forwarded information must show complete chain, not only the latest hop.
2. Wherever a task is rendered (task card, gantt bar, and comparable task views), show a forwarded indicator icon when the task has at least one forwarding record.
3. In task details, show forwarders in waterfall structure, for example:
   - `E1 -> E5`
   - `E5 -> E8`
4. Detail view should make the latest assignee/department obvious while retaining historical path.
5. Chain display should be chronological and easy to scan.

### Suggested acceptance checks
1. A twice-forwarded task displays two ordered forwarding hops in details.
2. Forwarded icon appears on card + gantt for forwarded tasks, and is absent for never-forwarded tasks.
3. After second forward, original first hop remains visible (no history loss).

## Practical next actions
1. Add forwarding feature tests (store, accept, reject, permissions, invalid transitions).
2. Align controller writes with task schema/workflow (`due_at`, `state` values).
3. Set `from_user_id` during forwarding create.
4. Normalize super-admin role slug check.
5. Add explicit pending-only transition checks for accept/reject.
6. Implement UI actions for forward/accept/reject (not only history list).
