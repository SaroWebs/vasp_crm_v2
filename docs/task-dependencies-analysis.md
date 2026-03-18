# Task Dependencies Analysis & Missing Routes

## Issues Identified

### 1. Task Forwarding Issues

**Problem:**
- Controller expects: `fromDepartment`, `toDepartment`, `forwardedBy`, `acceptedBy`, `rejectedBy`
- Model has: `fromUser`, `toUser`, `toDepartment`
- Migration has: `from_user_id`, `to_user_id`, `to_department_id`
- Controller uses: `from_department_id`, `forwarded_by`, `accepted_by`, `rejected_by`, `reason`, `notes`

**Missing Columns in Migration:**
- `from_department_id` (controller uses this)
- `forwarded_by` (controller uses this)
- `accepted_by` (controller uses this)
- `rejected_by` (controller uses this)
- `accepted_at` (controller uses this)
- `rejected_at` (controller uses this)
- `rejection_reason` (controller uses this)
- `reason` (controller uses this, but migration has `remarks`)

**Missing Relationships in Model:**
- `fromDepartment()` - should map to `from_department_id`
- `forwardedBy()` - should map to `forwarded_by` (or `from_user_id`)
- `acceptedBy()` - should map to `accepted_by`
- `rejectedBy()` - should map to `rejected_by`

**Route Mismatch:**
- Frontend calls: `/data/tasks/{id}/forwardings`
- Backend route: `/tasks/{task}/forwarding`

### 2. Task Comments

**Status:** Controller exists (`TaskCommentController`)
**Missing:** API routes under `/data/tasks/{task}/comments`
**Existing Routes:** None found for task comments

### 3. Task History

**Status:** Controller method exists (`AdminTaskController::getTaskHistory`)
**Missing:** API route under `/data/tasks/{task}/history`
**Existing Route:** `/tasks/{task}/history` (admin only)

### 4. Task Attachments

**Status:** Model relationship exists (`Task::attachments()`)
**Missing:** Controller and routes completely missing
**Migration:** Exists (`task_attachments` table)

### 5. Workload Metrics

**Status:** Model relationship exists (`Task::workloadMetrics()`)
**Missing:** Controller and routes completely missing
**Migration:** Exists (`workload_metrics` table)

### 6. Audit Events

**Status:** Model relationship exists (`Task::auditEvents()`)
**Missing:** Controller method and route for task-specific audit events
**Migration:** Exists (`task_audit_events` table)

### 7. Timeline Events

**Status:** Controller exists (`TimelineEventController`)
**Routes:** Exist but frontend calls `/timeline-events?task_id={id}` which works

## Required Fixes

1. **Create migration** to add missing columns to `task_forwardings` table
2. **Update TaskForwarding model** with correct relationships
3. **Add API routes** for all missing endpoints:
   - `/data/tasks/{task}/forwardings` (GET)
   - `/data/tasks/{task}/comments` (GET, POST)
   - `/data/tasks/{task}/history` (GET)
   - `/data/tasks/{task}/attachments` (GET, POST, DELETE)
   - `/data/tasks/{task}/workload-metrics` (GET)
   - `/data/tasks/{task}/audit-events` (GET)
4. **Create controllers** for attachments, workload metrics, audit events
5. **Update frontend** API calls to match correct routes

