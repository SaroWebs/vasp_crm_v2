# Task Action Permissions TODO

## Goal
- `manager` can edit/delete any task.
- `developer`, `hr`, and `support` can edit/delete only their own tasks (not tasks created by other users).

## Current Findings (from codebase)
- `TaskController` already has an ownership guard for update/delete (`isTaskOwner || isSuperAdmin`), but it is tied to `super-admin` and not `manager`.
- `AdminTaskController` `edit`, `update`, `destroy`, `updateDates`, `restore`, and `forceDelete` currently do not enforce ownership/role checks for task actions.
- Admin task UI currently shows edit/delete actions broadly:
  - `resources/js/pages/admin/tasks/Index.tsx` shows `Edit Task` and `Delete Task` for non-deleted rows.
  - `resources/js/pages/admin/tasks/Show.tsx` shows edit/delete actions; it computes `isOwnTask` and `isSuperAdmin` but does not gate buttons by that.
- Role seeding in `database/seeders/PermissionSeeder.php` defines `super-admin`, `manager`, and `employee` (no first-class `developer`, `hr`, `support` slugs in this seeder).

## TODO Checklist

### 0. Pre-check database state (mandatory)
- [ ] Check current `users`, `employees`, `roles`, `permissions`, `role_user`, `role_permissions`, and `user_permissions` data in DB before making any permission-related changes.
- [ ] Capture a quick snapshot/report of current role-to-user and role-to-permission mappings for validation before/after implementation.

### 1. Define role mapping for restriction rules
- [ ] Confirm canonical role slugs in production DB for `developer`, `hr`, `support` (or map them to current `employee`).
- [ ] Decide whether rule is role-based only, permission-based only, or hybrid:
  - `manager` = global task edit/delete.
  - `developer/hr/support` = own-task-only edit/delete.

### 2. Centralize authorization logic
- [ ] Add a reusable task action authorization helper (service or policy-style class) to avoid duplicated controller checks.
- [ ] Add helper methods like:
  - `canManageAnyTask(User $user): bool` (true for `manager` and `super-admin`).
  - `canManageTask(User $user, Task $task): bool` (true for manager/super-admin or task owner).

### 3. Enforce rules in AdminTaskController
- [ ] Add permission + ownership checks in `edit($task_id)`.
- [ ] Add permission + ownership checks in `update($task_id)`.
- [ ] Add permission + ownership checks in `destroy($task_id)`.
- [ ] Add same guard for high-impact related actions:
  - `updateDates($task_id)`
  - `restore($task_id)`
  - `forceDelete($task_id)`
- [ ] Return consistent `403` messages for unauthorized attempts.

### 4. Align TaskController with manager rule
- [ ] Update existing own-task check in `TaskController@update` and `TaskController@destroy` to allow `manager` (and `super-admin`) to manage all tasks.
- [ ] Keep own-task guard for non-manager roles.

### 5. Align frontend task action visibility
- [ ] In `resources/js/pages/admin/tasks/Index.tsx`, hide/disable edit/delete menu items when user cannot manage that task.
- [ ] In `resources/js/pages/admin/tasks/Show.tsx`, gate action buttons with same rule (`canManageTask`).
- [ ] In `resources/js/components/admin/TaskDetailsModalContent.tsx`, conditionally show `Edit Task` link based on manage permission for that task.
- [ ] Ensure UI checks are only UX helpers; backend must remain source of truth.

### 6. Permission seeder/data consistency
- [ ] If `developer/hr/support` roles are expected, add/normalize those roles in `PermissionSeeder` (or document their mapping to `employee`).
- [ ] Review assignment of `task.update`, `task.delete`, `task.update-own`, `task.delete-own` across roles.
- [ ] Re-seed/update role-permission records safely in non-production first.

### 7. Tests (required)
- [ ] Feature test: manager can edit/delete own and others' tasks.
- [ ] Feature test: developer cannot edit/delete task created by another user.
- [ ] Feature test: hr cannot edit/delete task created by another user.
- [ ] Feature test: support cannot edit/delete task created by another user.
- [ ] Feature test: developer/hr/support can edit/delete own tasks.
- [ ] Feature test: unauthorized admin-task routes return `403`.
- [ ] Frontend behavior check: action buttons hidden/disabled consistently.

### 8. Rollout/verification
- [ ] Verify with representative users from each role in staging.
- [ ] Confirm audit logs clearly capture denied attempts and allowed edit/delete actions.
- [ ] Publish a short change note describing the new task action permission behavior.

## Suggested Execution Order
1. Role mapping confirmation
2. Backend authorization centralization + controller enforcement
3. Frontend action gating
4. Tests
5. Seeder/role cleanup (if needed)
6. Staging verification
