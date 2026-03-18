# Task Management System - V1 Implementation Guide

This guide provides the implementation details for the V1 Task Management System based on the conceptual design document.

## Quick Start

### 1. Database Setup

Run the following migrations to set up the enhanced task management system:

```bash
php artisan migrate
```

### 2. Seed Default Data

```bash
php artisan db:seed --class=TaskTypeSeeder
php artisan db:seed --class=SLAPolicySeeder
```

### 3. Update Existing Code

The following files have been enhanced or created:

#### Models
- [`app/Models/Task.php`](app/Models/Task.php) - Enhanced with new fields and relationships
- [`app/Models/TaskAuditEvent.php`](app/Models/TaskAuditEvent.php) - New audit log model
- [`app/Models/SLAPolicy.php`](app/Models/SLAPolicy.php) - New SLA policy model
- [`app/Models/TaskType.php`](app/Models/TaskType.php) - New task type model

#### Controllers
- [`app/Http/Controllers/AdminTaskController.php`](app/Http/Controllers/AdminTaskController.php) - Enhanced with new endpoints
- [`app/Http/Controllers/TaskAssignmentController.php`](app/Http/Controllers/TaskAssignmentController.php) - New assignment controller
- [`app/Http/Controllers/TaskWorkflowController.php`](app/Http/Controllers/TaskWorkflowController.php) - New workflow controller

#### Database Migrations
- [`database/migrations/xxxx_create_task_audit_events_table.php`](database/migrations/)
- [`database/migrations/xxxx_create_sla_policies_table.php`](database/migrations/)
- [`database/migrations/xxxx_create_task_types_table.php`](database/migrations/)
- [`database/migrations/xxxx_create_workload_metrics_table.php`](database/migrations/)
- [`database/migrations/xxxx_create_user_skills_table.php`](database/migrations/)

#### Services
- [`app/Services/TaskAssignmentService.php`](app/Services/TaskAssignmentService.php) - Assignment algorithm
- [`app/Services/SLAService.php`](app/Services/SLAService.php) - SLA management
- [`app/Services/WorkflowService.php`](app/Services/WorkflowService.php) - State machine

## Key Features

### 1. Enhanced Task Model

The Task model now supports:
- **Task Types**: Bugfix, ProjectWork, Support, InternalRequest, Inspection
- **SLA Policies**: Automatic due date calculation based on type and priority
- **Flexible Ownership**: User, Department, or Unassigned
- **State Machine**: Draft → Assigned → InProgress → InReview → Done
- **Audit Trail**: Complete history of all changes

### 2. Capability-Based Permissions

Replaced role-based permissions with capabilities:
- `Task.Create`, `Task.Assign`, `Task.Reassign`
- `Task.ChangePriority`, `Task.ChangeSLA`
- `Task.Start`, `Task.Block`, `Task.Unblock`
- `Task.RequestReview`, `Task.ReviewApprove`, `Task.ReviewReject`
- `Task.Complete`, `Task.Override`

### 3. Smart Assignment Algorithm

The assignment system:
- Considers workload, skills, and ownership continuity
- Uses SLA-aware routing
- Supports fallback to departments
- Maintains audit trail of all assignments

### 4. SLA Management

Features include:
- Policy-based SLA calculation
- Automatic timer events
- Escalation notifications
- Breach detection and reporting

## API Endpoints

### Task Management

```http
POST /api/tasks              # Create task with type and SLA
GET  /api/tasks              # List tasks with filters
GET  /api/tasks/{id}         # Get task details
PUT  /api/tasks/{id}         # Update task
DELETE /api/tasks/{id}       # Delete task

GET  /api/tasks/{id}/audit   # Get audit trail
GET  /api/tasks/types        # Get available task types
```

### Workflow Management

```http
PATCH /api/tasks/{id}/state      # Change task state
POST  /api/tasks/{id}/assign     # Assign task
POST  /api/tasks/{id}/reassign   # Reassign task
POST  /api/tasks/{id}/block      # Block task
POST  /api/tasks/{id}/unblock    # Unblock task
POST  /api/tasks/{id}/review     # Submit for review
```

### SLA Management

```http
GET    /api/sla/policies          # List SLA policies
POST   /api/sla/policies          # Create SLA policy
PUT    /api/sla/policies/{id}     # Update SLA policy
DELETE /api/sla/policies/{id}     # Delete SLA policy

GET /api/tasks/{id}/sla-status    # Get SLA status
```

## Frontend Components

### Task Creation Form

The enhanced task creation form includes:
- Task type selection
- Priority and SLA policy selection
- Project and department assignment
- Skill-based assignment suggestions
- Real-time SLA calculation

### Task Dashboard

Features:
- SLA compliance indicators
- Workload visualization
- Assignment history
- State transition controls

### Workflow Controls

Interactive elements for:
- State transitions with validation
- Assignment and reassignment
- Review submission and approval
- Block/unblock with reasons

## Configuration

### Environment Variables

```env
# SLA Configuration
SLA_DEFAULT_RESPONSE_TIME=4 # hours
SLA_DEFAULT_RESOLUTION_TIME=24 # hours
SLA_ESCALATION_ENABLED=true

# Assignment Configuration
ASSIGNMENT_MAX_LOAD=5 # max tasks per user
ASSIGNMENT_SKILL_WEIGHT=0.3
ASSIGNMENT_LOAD_WEIGHT=0.25
ASSIGNMENT_CONTINUITY_WEIGHT=0.1
```

### Task Type Configuration

Task types are defined in [`config/task_types.php`](config/task_types.php):

```php
return [
    'Bugfix' => [
        'workflow' => ['Draft', 'Assigned', 'InProgress', 'InReview', 'Done'],
        'requires_sla' => true,
        'requires_project' => false,
        'default_priority' => 'P3',
    ],
    'ProjectWork' => [
        'workflow' => ['Draft', 'Assigned', 'InProgress', 'InReview', 'Done'],
        'requires_sla' => true,
        'requires_project' => true,
        'default_priority' => 'P2',
    ],
];
```

## Testing

Run the test suite:

```bash
php artisan test
```

Key test files:
- [`tests/Unit/TaskAssignmentServiceTest.php`](tests/Unit/TaskAssignmentServiceTest.php)
- [`tests/Unit/SLAServiceTest.php`](tests/Unit/SLAServiceTest.php)
- [`tests/Unit/WorkflowServiceTest.php`](tests/Unit/WorkflowServiceTest.php)
- [`tests/Feature/TaskWorkflowTest.php`](tests/Feature/TaskWorkflowTest.php)

## Monitoring

### Metrics

The system tracks:
- SLA compliance rates
- Assignment success rates
- Workflow transition times
- Workload distribution

### Logs

Key log entries:
- Assignment decisions with scoring
- SLA breaches and escalations
- State transition validations
- Permission checks

## Migration Guide

### From Existing System

1. **Backup your database**
2. **Run migrations**
3. **Update frontend components** to use new API endpoints
4. **Configure task types** for your use cases
5. **Set up SLA policies** for your business rules
6. **Train users** on new workflow states

### Data Migration

Existing tasks will be:
- Assigned default task type (Generic)
- Given default priority (Medium)
- Set to Draft state initially
- Migrated with audit trail of the migration

## Troubleshooting

### Common Issues

1. **Assignment fails**: Check user permissions and workload thresholds
2. **SLA not calculated**: Verify SLA policy exists for task type and priority
3. **State transition blocked**: Review workflow rules and user permissions
4. **Audit trail missing**: Ensure audit logging is enabled in configuration

### Debug Mode

Enable debug logging:

```php
// config/logging.php
'channels' => [
    'stack' => [
        'driver' => 'single',
        'path' => storage_path('logs/laravel.log'),
        'level' => env('LOG_LEVEL', 'debug'),
    ],
],
```

## Next Steps

### V2 Enhancements (Planned)
- Claim queue for department assignments
- Round-robin assignment algorithm
- Advanced skill matching
- Workload forecasting

### V3 Enhancements (Future)
- ML-based assignment recommendations
- Predictive SLA breach detection
- Advanced workflow branching
- Integration with external systems

## Support

For questions or issues:
1. Check the [FAQ](docs/faq.md)
2. Review the [API documentation](docs/api.md)
3. Search existing [issues](https://github.com/your-repo/issues)
4. Create a new issue with detailed information

---

**Note**: This is a living document. Please update it as you implement changes or discover improvements.