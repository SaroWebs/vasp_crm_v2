# V1 Task Management System - Conceptual Design

## Overview

This document outlines the V1 conceptual design for a task management system that is extendable, supports multiple task types, and includes SLA-aware routing and assignment. The design focuses on software work and inspection workflows while maintaining flexibility for future enhancements.

## 1. Current System Analysis

### Existing Architecture
- **Task Model**: Basic task structure with soft deletes, relationships to tickets, users, and departments
- **Permissions**: Role-based system with granular permissions and user-level overrides
- **State Management**: Simple status enum (pending, in-progress, completed, cancelled)
- **Ownership**: Direct assignment to users or departments
- **Audit**: Basic task history tracking

### Identified Gaps
- No formal task types or workflow definitions
- Limited SLA/priority handling
- No structured routing/assignment algorithm
- Missing comprehensive audit trail for ownership changes
- No capability-based permissions (currently role-based)

## 2. V1 Conceptual Data Model

### Core Entities

#### Task (Enhanced)
```sql
-- Core Task Table
CREATE TABLE tasks (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    task_code VARCHAR(50) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(50) NOT NULL, -- ProjectWork, Bugfix, Support, InternalRequest, Inspection
    priority VARCHAR(20) NOT NULL, -- P1-P4 or 1-5 scale
    sla_policy_id BIGINT, -- References SLA policies
    created_by_user_id BIGINT NOT NULL,
    project_id BIGINT NULL, -- Optional project association
    department_id BIGINT NULL, -- Optional owning department
    current_owner_kind ENUM('USER', 'DEPARTMENT', 'UNASSIGNED') NOT NULL,
    current_owner_id BIGINT NULL, -- References user_id or department_id
    state VARCHAR(50) NOT NULL, -- Draft, Assigned, InProgress, Blocked, InReview, Done, Cancelled, Rejected
    start_at TIMESTAMP NULL,
    due_at TIMESTAMP NULL,
    completed_at TIMESTAMP NULL,
    estimate_hours DECIMAL(5,2) NULL, -- Story points or hours
    tags JSON NULL, -- Flexible tagging system
    severity VARCHAR(20) NULL, -- For bugfixes (Critical, High, Medium, Low)
    version INTEGER NOT NULL DEFAULT 1, -- Optimistic concurrency token
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    
    INDEX idx_task_type_priority (type, priority),
    INDEX idx_task_state (state),
    INDEX idx_task_owner (current_owner_kind, current_owner_id),
    INDEX idx_task_due_date (due_at),
    INDEX idx_task_project (project_id),
    INDEX idx_task_department (department_id),
    FOREIGN KEY (created_by_user_id) REFERENCES users(id),
    FOREIGN KEY (sla_policy_id) REFERENCES sla_policies(id),
    FOREIGN KEY (project_id) REFERENCES projects(id),
    FOREIGN KEY (department_id) REFERENCES departments(id)
);
```

#### TaskAuditEvent (Append-Only Audit Log)
```sql
CREATE TABLE task_audit_events (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    task_id BIGINT NOT NULL,
    occurred_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actor_user_id BIGINT NOT NULL,
    action VARCHAR(50) NOT NULL, -- ASSIGN, REASSIGN, STATE_CHANGE, PRIORITY_CHANGE, etc.
    
    -- State transitions
    from_state VARCHAR(50),
    to_state VARCHAR(50),
    
    -- Ownership changes
    from_owner_kind ENUM('USER', 'DEPARTMENT', 'UNASSIGNED'),
    from_owner_id BIGINT,
    to_owner_kind ENUM('USER', 'DEPARTMENT', 'UNASSIGNED'),
    to_owner_id BIGINT,
    
    -- SLA snapshots
    sla_snapshot JSON, -- Priority, due_at at time of change
    
    -- Context
    reason TEXT,
    metadata JSON,
    
    INDEX idx_audit_task_time (task_id, occurred_at),
    INDEX idx_audit_actor (actor_user_id),
    INDEX idx_audit_action (action),
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
    FOREIGN KEY (actor_user_id) REFERENCES users(id)
);
```

#### SLAPolicy (SLA Management)
```sql
CREATE TABLE sla_policies (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    type VARCHAR(50) NOT NULL, -- Task type this policy applies to
    priority VARCHAR(20) NOT NULL, -- Priority level
    response_time_minutes INTEGER NOT NULL, -- Time to start work
    resolution_time_minutes INTEGER NOT NULL, -- Time to complete
    review_time_minutes INTEGER NOT NULL, -- Time to approve in review
    escalation_steps JSON, -- Escalation configuration
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

#### TaskType (Task Type Definitions)
```sql
CREATE TABLE task_types (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    code VARCHAR(50) UNIQUE NOT NULL, -- ProjectWork, Bugfix, Support, etc.
    name VARCHAR(100) NOT NULL,
    description TEXT,
    default_priority VARCHAR(20) DEFAULT 'medium',
    requires_sla BOOLEAN DEFAULT TRUE,
    requires_project BOOLEAN DEFAULT FALSE,
    requires_department BOOLEAN DEFAULT FALSE,
    workflow_definition JSON, -- State machine definition
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Supporting Tables

#### WorkloadMetrics (For Assignment Algorithm)
```sql
CREATE TABLE workload_metrics (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    date DATE NOT NULL,
    active_task_count INTEGER DEFAULT 0,
    sum_remaining_estimate DECIMAL(8,2) DEFAULT 0,
    overdue_count INTEGER DEFAULT 0,
    completed_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE KEY uk_user_date (user_id, date),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

#### UserSkills (For Skill-Based Routing)
```sql
CREATE TABLE user_skills (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    skill_name VARCHAR(100) NOT NULL,
    proficiency_level INTEGER DEFAULT 1, -- 1-5 scale
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE KEY uk_user_skill (user_id, skill_name),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

## 3. State Machine & Workflows

### Core States
- **Draft**: Task created, not yet assigned
- **Assigned**: Task assigned to user/department, awaiting start
- **InProgress**: Work has begun
- **Blocked**: Work paused due to external dependencies
- **InReview**: Work completed, awaiting approval
- **Done**: Task completed and approved
- **Cancelled**: Task cancelled
- **Rejected**: Task rejected in review, needs rework

### State Transitions
```
Draft → Assigned (by assigner)
Assigned → InProgress (by assignee)
InProgress ↔ Blocked (assignee or manager)
InProgress → InReview (assignee submits)
InReview → Done (reviewer approves)
InReview → InProgress (reviewer rejects)
Any → Cancelled (by permitted role)
Assigned → Rejected (if assignee refuses)
```

### Task-Type Specific Workflows

#### Bugfix Workflow
```
Draft → Assigned → InProgress → InReview (QA/Lead) → Done
Key Features:
- Severity impacts SLA (Critical bugs have shorter response times)
- QA approval required for InReview → Done
- Rejection sends back to InProgress with feedback
```

#### Project Work Workflow
```
Draft → Assigned → InProgress → InReview (Lead) → Done
Key Features:
- Prefers project team members for assignment
- Continuity: prefers previous assignee on same project
- Lead approval required
```

#### Inspection Workflow
```
Draft → Assigned → InProgress (inspect) → InReview (approver) → Done/Rejected
Key Features:
- Specialized approvers (not necessarily the assignee)
- Can be rejected back to InProgress
```

## 4. SLA & Priority System

### Priority Levels
- **P1 (Critical)**: Immediate attention required
- **P2 (High)**: High business impact
- **P3 (Medium)**: Normal priority
- **P4 (Low)**: Low impact, can wait

### SLA Policy Example
```json
{
  "Bugfix": {
    "P1": {
      "response_time": "1 hour",
      "resolution_time": "8 hours", 
      "review_time": "4 hours",
      "escalation": [
        {"after": "2 hours", "notify": "Team Lead"},
        {"after": "6 hours", "notify": "Manager"}
      ]
    },
    "P2": {
      "response_time": "4 hours",
      "resolution_time": "2 days",
      "review_time": "1 day",
      "escalation": [
        {"after": "1 day", "notify": "Team Lead"}
      ]
    }
  },
  "ProjectWork": {
    "P2": {
      "response_time": "1 day",
      "resolution_time": "sprint_end",
      "review_time": "2 days",
      "escalation": []
    }
  }
}
```

### SLA Timer Events
- **On Assigned**: Set startDueAt = now + responseTime
- **On InProgress**: Set resolveDueAt = now + resolutionTime
- **On InReview**: Set reviewDueAt = now + reviewTime
- **On Breach**: Mark isBreached=true, emit SLA_BREACHED event, notify escalation roles

## 5. Capability-Based Permissions

### Core Capabilities
- **Task.Create**: Create new tasks
- **Task.Assign**: Assign to user/department
- **Task.Reassign**: Move between users/departments
- **Task.ChangePriority**: Modify task priority
- **Task.ChangeSLA**: Modify SLA settings
- **Task.Start/UpdateProgress**: Start work or update progress
- **Task.Block/Unblock**: Block or unblock tasks
- **Task.RequestReview/ReviewApprove/ReviewReject**: Review workflow
- **Task.Complete**: Mark as complete
- **Task.Override**: Bypass normal guards (for managers)
- **Task.ViewAll**: View all tasks
- **Task.ViewOwn/Department**: View own or department tasks

### Permission Rules
- **No "Admin" Role**: Use specific capabilities instead
- **Routing/Assignment**: Requires Task.Assign/Task.Reassign
- **Client Self-Assignment**: Not allowed unless user has Task.Assign
- **Manager Overrides**: Task.Override capability allows bypassing normal guards

## 6. Routing & Assignment Algorithm

### Input Parameters
- Task type, priority, project_id, severity, required skills/tags
- Requester role/department
- Assignee constraints (must be in project team, etc.)
- SLA policy table (by type+priority)
- Workload signals (activeTaskCount, sumRemainingEstimate, overdueCount)

### Algorithm Steps

#### Step 1: Task Classification
```
Classify task into routing bucket:
- Bugfix
- ProjectFeature  
- InternalRequest
- Inspection
```

#### Step 2: Candidate Selection (Hard Filters)
```
Select eligible users by rules:
- Has permission/role for this task type
- If project-related: is in project team
- If user has no department: still eligible if explicitly allowed by role
- Skill match: has required skills/tags
- Workload threshold: activeTaskCount < max_threshold
```

#### Step 3: Fallback Handling
```
If no candidates:
- Set ownerKind=DEPARTMENT to intake dept or UNASSIGNED
- Raise event/notification for managers to manually assign
```

#### Step 4: SLA Computation
```
dueAt = now + slaDuration(type, priority, severity)
escalateAt = dueAt - escalationWindow(priority)
```

#### Step 5: Scoring & Assignment
```
score(user) = w1*availability - w2*activeLoad - w3*overdueCount + w4*skillMatch + w5*ownershipContinuity

Where:
- availability: user availability (hours/percentage)
- activeLoad: activeTaskCount or sum of estimates
- skillMatch: boolean or weighted skill match
- ownershipContinuity: prefer previous assignee on same project/module
- weights: configurable (w1=0.3, w2=0.25, w3=0.2, w4=0.15, w5=0.1)

Assign to user with highest score
Write audit event: TASK_ASSIGNED
```

### User Without Department
- Can still be assigned directly if they satisfy role-based eligibility
- Should not be used for department-based fallbacks
- For reporting, keep task.department_id as "origin/owning dept" even if assignee has none

## 7. Implementation Roadmap

### Phase 1: Core Infrastructure (Week 1-2)
1. **Database Migrations**
   - Create enhanced task table with new fields
   - Create task_audit_events table
   - Create sla_policies table
   - Create task_types table
   - Create workload_metrics table
   - Create user_skills table

2. **Models & Relationships**
   - Update Task model with new relationships
   - Create TaskAuditEvent model
   - Create SLAPolicy model
   - Create TaskType model

3. **Data Migration**
   - Migrate existing tasks to new schema
   - Set default values for new fields
   - Create audit trail for migration

### Phase 2: State Machine & Workflows (Week 2-3)
1. **State Management**
   - Implement state transition validation
   - Create state transition service
   - Add state change audit logging

2. **Workflow Definitions**
   - Define workflow JSON schemas for each task type
   - Create workflow validation service
   - Implement workflow-specific business rules

3. **Task Type System**
   - Seed default task types
   - Create task type management UI
   - Implement type-specific form fields

### Phase 3: SLA System (Week 3-4)
1. **SLA Policy Management**
   - Create SLA policy CRUD operations
   - Implement SLA calculation service
   - Create SLA policy assignment logic

2. **Timer & Escalation**
   - Implement SLA timer service
   - Create escalation notification system
   - Add SLA breach detection

3. **UI Enhancements**
   - Add SLA indicators in task lists
   - Show SLA countdowns
   - Display escalation status

### Phase 4: Assignment Algorithm (Week 4-5)
1. **Workload Tracking**
   - Implement workload metrics collection
   - Create workload calculation service
   - Add real-time workload updates

2. **Skill Management**
   - Create user skill management
   - Implement skill matching algorithm
   - Add skill-based filtering

3. **Assignment Engine**
   - Implement routing algorithm
   - Create assignment scoring service
   - Add manual assignment override

### Phase 5: Permissions & Security (Week 5-6)
1. **Capability System**
   - Define capability constants
   - Implement capability checking service
   - Update existing permission checks

2. **Audit Enhancement**
   - Enhance audit logging for all operations
   - Create audit trail UI
   - Implement audit export functionality

3. **Security Review**
   - Review permission boundaries
   - Test assignment restrictions
   - Validate capability enforcement

### Phase 6: Integration & Testing (Week 6-7)
1. **API Integration**
   - Update existing API endpoints
   - Create new API endpoints for enhanced features
   - Implement API versioning if needed

2. **Frontend Updates**
   - Update task creation form
   - Enhance task detail views
   - Add workflow state indicators
   - Implement assignment controls

3. **Testing**
   - Unit tests for new services
   - Integration tests for workflows
   - End-to-end tests for assignment
   - Performance tests for SLA calculations

### Phase 7: Deployment & Monitoring (Week 7-8)
1. **Deployment Preparation**
   - Create deployment scripts
   - Prepare rollback procedures
   - Update environment configurations

2. **Monitoring**
   - Add metrics for SLA compliance
   - Implement assignment success tracking
   - Create dashboard for workflow metrics

3. **Documentation**
   - Update API documentation
   - Create user guides for new features
   - Document workflow definitions

## 8. API Contracts

### Task Creation
```http
POST /api/tasks
Content-Type: application/json

{
  "title": "Fix login bug",
  "description": "Users cannot login after recent deployment",
  "type": "Bugfix",
  "priority": "P1",
  "project_id": 123,
  "severity": "Critical",
  "tags": ["authentication", "frontend"],
  "sla_policy_id": 456,
  "assigned_to": {
    "kind": "USER",
    "id": 789
  },
  "due_at": "2024-01-15T10:00:00Z"
}
```

### State Transition
```http
PATCH /api/tasks/{id}/state
Content-Type: application/json

{
  "to_state": "InProgress",
  "reason": "Starting work on the bug fix",
  "sla_snapshot": {
    "priority": "P1",
    "due_at": "2024-01-15T10:00:00Z"
  }
}
```

### Assignment
```http
POST /api/tasks/{id}/assign
Content-Type: application/json

{
  "to": {
    "kind": "USER",
    "id": 789
  },
  "reason": "User has relevant skills for this task type",
  "sla_computed": {
    "due_at": "2024-01-15T10:00:00Z",
    "escalate_at": "2024-01-14T10:00:00Z"
  }
}
```

### Audit Query
```http
GET /api/tasks/{id}/audit?from=2024-01-01&to=2024-01-31&action=ASSIGN,STATE_CHANGE
```

## 9. Data Validation Rules

### Task Validation
- **Type**: Must be valid task type code
- **Priority**: Must be P1-P4 or 1-5 scale
- **State**: Must follow workflow transition rules
- **Assignment**: Must have Task.Assign capability
- **SLA**: Must have valid SLA policy for type+priority
- **Project**: If requires_project=true, project_id is mandatory
- **Department**: If requires_department=true, department_id is mandatory

### State Transition Validation
- **Draft → Assigned**: Requires assignment
- **Assigned → InProgress**: Only by assignee
- **InProgress → Blocked**: Requires reason
- **InProgress → InReview**: Requires completion notes
- **InReview → Done**: Requires reviewer approval
- **InReview → InProgress**: Requires rejection reason

### SLA Validation
- **Response Time**: Must be positive integer
- **Resolution Time**: Must be >= response time
- **Escalation**: Must be before resolution time
- **Breach Detection**: Real-time monitoring required

## 10. Future Extensibility

### Claim Queue (V2)
- Add "Queued" state for department queues
- Implement claim mechanism for users
- Add queue priority based on SLA

### Round-Robin Assignment (V2)
- Add assignment history tracking
- Implement round-robin algorithm per department
- Create assignment preference system

### ML-Based Assignment (V3)
- Collect assignment success metrics
- Train ML model on historical data
- Implement confidence scoring

### Advanced Workflows (V3)
- Support for parallel task execution
- Conditional workflow branches
- Sub-task dependencies

## Conclusion

This V1 design provides a solid foundation for a task management system that supports multiple task types, SLA-aware routing, and capability-based permissions. The append-only audit log ensures full traceability, while the flexible data model allows for future enhancements without breaking existing functionality.

The implementation roadmap is designed to be incremental, allowing for testing and validation at each phase while maintaining system availability. The focus on software work and inspection workflows provides immediate value while keeping the architecture general enough to support additional task types in the future.