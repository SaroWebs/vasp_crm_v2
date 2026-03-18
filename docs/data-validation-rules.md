# Data Validation Rules - V1 Task Management System

This document defines all data validation rules for the V1 Task Management System, including field-level validations, business rule validations, and workflow validations.

## Table of Contents

1. [Field-Level Validations](#field-level-validations)
2. [Business Rule Validations](#business-rule-validations)
3. [Workflow Validations](#workflow-validations)
4. [Permission Validations](#permission-validations)
5. [SLA Validations](#sla-validations)
6. [Assignment Validations](#assignment-validations)
7. [Error Messages](#error-messages)

## Field-Level Validations

### Task Fields

#### Title
- **Type**: String
- **Required**: Yes
- **Min Length**: 3 characters
- **Max Length**: 255 characters
- **Pattern**: No leading/trailing whitespace
- **Validation**: Trim whitespace before saving

```php
'title' => [
    'required',
    'string',
    'min:3',
    'max:255',
    'regex:/^[^\s].*[^\s]$/'
]
```

#### Description
- **Type**: String
- **Required**: No
- **Max Length**: 65535 characters (TEXT field)
- **Default**: null

```php
'description' => [
    'nullable',
    'string',
    'max:65535'
]
```

#### Task Type
- **Type**: String
- **Required**: Yes
- **Allowed Values**: `Bugfix`, `ProjectWork`, `Support`, `InternalRequest`, `Inspection`
- **Validation**: Must exist in task_types table

```php
'type' => [
    'required',
    'string',
    'in:Bugfix,ProjectWork,Support,InternalRequest,Inspection',
    'exists:task_types,code'
]
```

#### Priority
- **Type**: String
- **Required**: Yes
- **Allowed Values**: `P1`, `P2`, `P3`, `P4`
- **Validation**: Case-sensitive

```php
'priority' => [
    'required',
    'string',
    'in:P1,P2,P3,P4'
]
```

#### Project ID
- **Type**: Integer
- **Required**: Conditional (depends on task type)
- **Validation**: Must exist in projects table
- **Condition**: Required if task type requires_project = true

```php
'project_id' => [
    'nullable',
    'integer',
    'exists:projects,id',
    'required_if:type,Bugfix,ProjectWork'
]
```

#### Department ID
- **Type**: Integer
- **Required**: Conditional (depends on task type)
- **Validation**: Must exist in departments table
- **Condition**: Required if task type requires_department = true

```php
'department_id' => [
    'nullable',
    'integer',
    'exists:departments,id',
    'required_if:type,InternalRequest,Support'
]
```

#### Severity
- **Type**: String
- **Required**: Conditional
- **Allowed Values**: `Critical`, `High`, `Medium`, `Low`
- **Condition**: Required only for Bugfix type

```php
'severity' => [
    'nullable',
    'string',
    'in:Critical,High,Medium,Low',
    'required_if:type,Bugfix'
]
```

#### Estimate Hours
- **Type**: Decimal
- **Required**: No
- **Min Value**: 0.00
- **Max Value**: 999.99
- **Precision**: 2 decimal places
- **Validation**: Must be positive number

```php
'estimate_hours' => [
    'nullable',
    'numeric',
    'min:0',
    'max:999.99',
    'regex:/^\d+(\.\d{1,2})?$/'
]
```

#### Due At
- **Type**: DateTime (ISO 8601)
- **Required**: No
- **Format**: ISO 8601 or MySQL datetime
- **Validation**: Must be in future (if provided)
- **Default**: Computed from SLA policy

```php
'due_at' => [
    'nullable',
    'date_format:Y-m-d\TH:i:s\Z|Y-m-d H:i:s',
    'after:now'
]
```

#### Tags
- **Type**: Array of Strings
- **Required**: No
- **Max Items**: 10 tags
- **Item Length**: 3-50 characters
- **Pattern**: Alphanumeric with hyphens and underscores

```php
'tags' => [
    'nullable',
    'array',
    'max:10'
],
'tags.*' => [
    'string',
    'min:3',
    'max:50',
    'regex:/^[a-zA-Z0-9-_]+$'
]
```

#### SLA Policy ID
- **Type**: Integer
- **Required**: No
- **Validation**: Must exist in sla_policies table
- **Default**: Auto-selected based on type + priority

```php
'sla_policy_id' => [
    'nullable',
    'integer',
    'exists:sla_policies,id'
]
```

#### Assigned To
- **Type**: Object
- **Required**: No
- **Structure**:
  ```php
  'assigned_to.kind' => [
      'nullable',
      'string',
      'in:USER,DEPARTMENT,UNASSIGNED'
  ],
  'assigned_to.id' => [
      'nullable',
      'integer',
      'required_with:assigned_to.kind',
      'exists:users,id,where,kind,USER|exists:departments,id,where,kind,DEPARTMENT'
  ]
  ```

### User Fields

#### Name
- **Type**: String
- **Required**: Yes
- **Min Length**: 2 characters
- **Max Length**: 100 characters
- **Pattern**: No special characters except spaces, hyphens, apostrophes

```php
'name' => [
    'required',
    'string',
    'min:2',
    'max:100',
    'regex:/^[a-zA-Z\s\'\-]+$'
]
```

#### Email
- **Type**: String
- **Required**: Yes
- **Format**: Valid email address
- **Unique**: Across all users
- **Max Length**: 255 characters

```php
'email' => [
    'required',
    'string',
    'email',
    'max:255',
    'unique:users,email'
]
```

#### Skills
- **Type**: Array of Objects
- **Max Items**: 10 skills per user
- **Structure**:
  ```php
  'skills' => [
      'array',
      'max:10'
  ],
  'skills.*.name' => [
      'required_with:skills.*',
      'string',
      'min:2',
      'max:50',
      'unique:user_skills,skill_name,NULL,id,user_id,' . $userId
  ],
  'skills.*.proficiency' => [
      'required_with:skills.*',
      'integer',
      'min:1',
      'max:5'
  ],
  'skills.*.is_primary' => [
      'boolean'
  ]
  ```

## Business Rule Validations

### Task Creation Rules

1. **Task Type Requirements**
   ```php
   // Bugfix and ProjectWork require project_id
   if (in_array($taskType, ['Bugfix', 'ProjectWork'])) {
       $this->validateProjectId($projectId);
   }
   
   // InternalRequest and Support require department_id
   if (in_array($taskType, ['InternalRequest', 'Support'])) {
       $this->validateDepartmentId($departmentId);
   }
   ```

2. **Priority and Severity Mapping**
   ```php
   // P1 tasks should have Critical or High severity
   if ($priority === 'P1' && !in_array($severity, ['Critical', 'High'])) {
       throw new ValidationException('P1 tasks must have Critical or High severity');
   }
   ```

3. **SLA Policy Validation**
   ```php
   // Must have valid SLA policy for type + priority
   $slaPolicy = SLAPolicy::where([
       ['type', '=', $taskType],
       ['priority', '=', $priority],
       ['is_active', '=', true]
   ])->first();
   
   if (!$slaPolicy) {
       throw new ValidationException("No SLA policy found for {$taskType} {$priority}");
   }
   ```

4. **Project and Department Consistency**
   ```php
   // If project is specified, department should match project's department
   if ($projectId && $departmentId) {
       $project = Project::find($projectId);
       if ($project->department_id !== $departmentId) {
           throw new ValidationException('Project department does not match specified department');
       }
   }
   ```

### Assignment Rules

1. **User Eligibility**
   ```php
   // User must have permission for task type
   if (!$user->hasPermission("task.{$taskType}.create")) {
       throw new ValidationException('User does not have permission for this task type');
   }
   
   // User must be active
   if ($user->status !== 'active') {
       throw new ValidationException('Cannot assign to inactive user');
   }
   ```

2. **Workload Limits**
   ```php
   // User should not exceed max workload
   $activeTasks = Task::where([
       ['assigned_to_id', '=', $userId],
       ['state', 'not in', ['Done', 'Cancelled']]
   ])->count();
   
   if ($activeTasks >= config('task_management.max_tasks_per_user')) {
       throw new ValidationException('User has reached maximum active task limit');
   }
   ```

3. **Department Assignment**
   ```php
   // Department must exist and be active
   $department = Department::find($departmentId);
   if (!$department || $department->status !== 'active') {
       throw new ValidationException('Invalid or inactive department');
   }
   ```

## Workflow Validations

### State Transition Rules

#### Draft → Assigned
**Preconditions:**
- Task must have valid assignment
- Assignee must have required permissions
- SLA policy must be applied

**Validation:**
```php
public function canTransitionToAssigned(Task $task, User $assigner): bool
{
    // Check if assigner has Task.Assign permission
    if (!$assigner->hasPermission('task.assign')) {
        return false;
    }
    
    // Check assignment validity
    if (!$task->current_owner_id || !$task->current_owner_kind) {
        return false;
    }
    
    // Check SLA policy
    if (!$task->sla_policy_id) {
        return false;
    }
    
    return true;
}
```

#### Assigned → InProgress
**Preconditions:**
- Only the assigned user can start work
- Task must not be blocked
- User must have Task.Start permission

**Validation:**
```php
public function canTransitionToInProgress(Task $task, User $user): bool
{
    // Must be assigned to this user
    if ($task->current_owner_kind !== 'USER' || $task->current_owner_id !== $user->id) {
        return false;
    }
    
    // Must have start permission
    if (!$user->hasPermission('task.start')) {
        return false;
    }
    
    // Must not be blocked
    if ($task->state === 'Blocked') {
        return false;
    }
    
    return true;
}
```

#### InProgress → Blocked
**Preconditions:**
- Must provide reason
- Must be in InProgress state
- Optional: expected resolution time

**Validation:**
```php
public function canTransitionToBlocked(Task $task, array $data): bool
{
    // Must be in progress
    if ($task->state !== 'InProgress') {
        return false;
    }
    
    // Must provide reason
    if (empty($data['reason'])) {
        return false;
    }
    
    // Reason must be reasonable length
    if (strlen($data['reason']) < 10 || strlen($data['reason']) > 500) {
        return false;
    }
    
    return true;
}
```

#### InProgress → InReview
**Preconditions:**
- Must be assigned user
- Must provide completion notes (optional but recommended)
- Must have reviewers assigned

**Validation:**
```php
public function canTransitionToInReview(Task $task, User $user, array $data): bool
{
    // Must be assigned user
    if ($task->current_owner_kind !== 'USER' || $task->current_owner_id !== $user->id) {
        return false;
    }
    
    // Must have reviewers
    if (empty($data['reviewers']) || !is_array($data['reviewers'])) {
        return false;
    }
    
    // Reviewers must exist and have review permission
    foreach ($data['reviewers'] as $reviewerId) {
        $reviewer = User::find($reviewerId);
        if (!$reviewer || !$reviewer->hasPermission('task.review_approve')) {
            return false;
        }
    }
    
    return true;
}
```

#### InReview → Done
**Preconditions:**
- Must be approved by all reviewers
- Must have approval notes
- Must be in InReview state

**Validation:**
```php
public function canTransitionToDone(Task $task, User $reviewer, array $data): bool
{
    // Must be in review
    if ($task->state !== 'InReview') {
        return false;
    }
    
    // Must be a reviewer
    $isReviewer = ReviewAssignment::where([
        ['task_id', '=', $task->id],
        ['reviewer_id', '=', $reviewer->id],
        ['status', '=', 'pending']
    ])->exists();
    
    if (!$isReviewer) {
        return false;
    }
    
    // Must provide approval
    if (empty($data['approval_notes'])) {
        return false;
    }
    
    return true;
}
```

#### InReview → InProgress
**Preconditions:**
- Must be rejected by reviewer
- Must provide rejection reason
- Must have actionable feedback

**Validation:**
```php
public function canTransitionToInProgressFromReview(Task $task, User $reviewer, array $data): bool
{
    // Must be in review
    if ($task->state !== 'InReview') {
        return false;
    }
    
    // Must be a reviewer
    $isReviewer = ReviewAssignment::where([
        ['task_id', '=', $task->id],
        ['reviewer_id', '=', $reviewer->id],
        ['status', '=', 'pending']
    ])->exists();
    
    if (!$isReviewer) {
        return false;
    }
    
    // Must provide rejection reason
    if (empty($data['rejection_reason'])) {
        return false;
    }
    
    // Reason must be actionable
    if (strlen($data['rejection_reason']) < 20) {
        return false;
    }
    
    return true;
}
```

### Workflow State Validation

```php
class WorkflowValidator
{
    private $validTransitions = [
        'Draft' => ['Assigned', 'Cancelled'],
        'Assigned' => ['InProgress', 'Blocked', 'Reassigned', 'Cancelled'],
        'InProgress' => ['Blocked', 'InReview', 'Cancelled'],
        'Blocked' => ['InProgress', 'Cancelled'],
        'InReview' => ['InProgress', 'Done', 'Cancelled'],
        'Done' => [],
        'Cancelled' => [],
        'Rejected' => ['Assigned', 'Cancelled']
    ];
    
    public function isValidTransition(string $fromState, string $toState): bool
    {
        return in_array($toState, $this->validTransitions[$fromState] ?? []);
    }
    
    public function getValidTransitions(string $currentState): array
    {
        return $this->validTransitions[$currentState] ?? [];
    }
}
```

## Permission Validations

### Capability-Based Permissions

#### Task.Create
**Required for:**
- Creating new tasks
- Setting initial task properties

**Validation:**
```php
if (!$user->hasPermission('task.create')) {
    throw new AuthorizationException('Insufficient permissions to create tasks');
}
```

#### Task.Assign
**Required for:**
- Assigning tasks to users/departments
- Changing task ownership

**Validation:**
```php
if (!$user->hasPermission('task.assign')) {
    throw new AuthorizationException('Insufficient permissions to assign tasks');
}

// Additional validation for self-assignment
if ($assigneeId === $user->id && !$user->hasPermission('task.self_assign')) {
    throw new ValidationException('Cannot self-assign without self-assign permission');
}
```

#### Task.Reassign
**Required for:**
- Moving tasks between users/departments
- Changing ownership from department to user

**Validation:**
```php
if (!$user->hasPermission('task.reassign')) {
    throw new AuthorizationException('Insufficient permissions to reassign tasks');
}

// Must have permission to unassign current owner
if ($currentOwnerId && !$user->hasPermission('task.unassign')) {
    throw new ValidationException('Cannot unassign current owner without permission');
}
```

#### Task.ChangePriority
**Required for:**
- Modifying task priority
- Escalating task priority

**Validation:**
```php
if (!$user->hasPermission('task.change_priority')) {
    throw new AuthorizationException('Insufficient permissions to change priority');
}

// Priority escalation validation
if ($newPriority === 'P1' && !$user->hasPermission('task.escalate')) {
    throw new ValidationException('Cannot escalate to P1 without escalation permission');
}
```

#### Task.ChangeSLA
**Required for:**
- Modifying SLA policies
- Changing due dates

**Validation:**
```php
if (!$user->hasPermission('task.change_sla')) {
    throw new AuthorizationException('Insufficient permissions to change SLA');
}

// Due date extension validation
if ($newDueDate > $currentDueDate && !$user->hasPermission('task.extend_due_date')) {
    throw new ValidationException('Cannot extend due date without permission');
}
```

#### Task.Start/UpdateProgress
**Required for:**
- Starting work on tasks
- Updating task progress

**Validation:**
```php
if (!$user->hasPermission('task.start')) {
    throw new AuthorizationException('Insufficient permissions to start tasks');
}

// Must be assigned to task
if ($task->current_owner_id !== $user->id) {
    throw new ValidationException('Can only start assigned tasks');
}
```

#### Task.Block/Unblock
**Required for:**
- Blocking tasks due to dependencies
- Unblocking tasks when resolved

**Validation:**
```php
if (!$user->hasPermission('task.block')) {
    throw new AuthorizationException('Insufficient permissions to block tasks');
}

// Must be assigned user or manager
if ($task->current_owner_id !== $user->id && !$user->hasPermission('task.manage_others')) {
    throw new ValidationException('Can only block own tasks');
}
```

#### Task.RequestReview/ReviewApprove/ReviewReject
**Required for:**
- Submitting tasks for review
- Approving/rejecting reviews

**Validation:**
```php
// Request review
if (!$user->hasPermission('task.request_review')) {
    throw new AuthorizationException('Insufficient permissions to request review');
}

// Review approve/reject
if (!$user->hasPermission('task.review_approve')) {
    throw new AuthorizationException('Insufficient permissions to review');
}

// Must be assigned reviewer
if (!ReviewAssignment::where([
    ['task_id', '=', $task->id],
    ['reviewer_id', '=', $user->id]
])->exists()) {
    throw new ValidationException('Not authorized to review this task');
}
```

#### Task.Complete
**Required for:**
- Marking tasks as complete
- Finalizing task workflow

**Validation:**
```php
if (!$user->hasPermission('task.complete')) {
    throw new AuthorizationException('Insufficient permissions to complete tasks');
}

// Must be assigned user or manager
if ($task->current_owner_id !== $user->id && !$user->hasPermission('task.manage_others')) {
    throw new ValidationException('Can only complete own tasks');
}
```

#### Task.Override
**Required for:**
- Bypassing normal workflow guards
- Manager overrides

**Validation:**
```php
if (!$user->hasPermission('task.override')) {
    throw new AuthorizationException('Insufficient permissions for override');
}

// Log override action
AuditLog::create([
    'user_id' => $user->id,
    'action' => 'TASK_OVERRIDE',
    'details' => [
        'task_id' => $task->id,
        'override_reason' => $reason,
        'bypassed_rules' => $bypassedRules
    ]
]);
```

#### Task.ViewAll vs Task.ViewOwn/Department
**Required for:**
- Viewing task lists
- Accessing task details

**Validation:**
```php
// View all tasks
if (!$user->hasPermission('task.view_all')) {
    // Check if can view own tasks
    if (!$user->hasPermission('task.view_own')) {
        throw new AuthorizationException('Insufficient permissions to view tasks');
    }
    
    // Filter to own tasks
    $query->where('current_owner_id', $user->id);
}

// View department tasks
if ($user->hasPermission('task.view_department')) {
    $query->where('department_id', $user->department_id);
}
```

## SLA Validations

### SLA Policy Validation

#### Response Time
- **Type**: Integer (minutes)
- **Required**: Yes
- **Min Value**: 15 minutes
- **Max Value**: 480 minutes (8 hours)
- **Validation**: Must be positive integer

```php
'response_time_minutes' => [
    'required',
    'integer',
    'min:15',
    'max:480'
]
```

#### Resolution Time
- **Type**: Integer (minutes)
- **Required**: Yes
- **Min Value**: Response time + 30 minutes
- **Max Value**: 7200 minutes (5 days)
- **Validation**: Must be >= response time

```php
'resolution_time_minutes' => [
    'required',
    'integer',
    'min' => 'response_time_minutes + 30',
    'max:7200'
]
```

#### Review Time
- **Type**: Integer (minutes)
- **Required**: Yes
- **Min Value**: 30 minutes
- **Max Value**: 1440 minutes (24 hours)
- **Validation**: Must be reasonable for review process

```php
'review_time_minutes' => [
    'required',
    'integer',
    'min:30',
    'max:1440'
]
```

#### Escalation Steps
- **Type**: Array of Objects
- **Max Items**: 5 escalation steps
- **Structure**:
  ```php
  'escalation_steps' => [
      'array',
      'max:5'
  ],
  'escalation_steps.*.after_minutes' => [
      'required_with:escalation_steps.*',
      'integer',
      'min:15',
      'max:resolution_time_minutes'
  ],
  'escalation_steps.*.notify' => [
      'required_with:escalation_steps.*',
      'string',
      'in:Team Lead,Manager,Director,VP'
  ],
  'escalation_steps.*.users' => [
      'nullable',
      'array'
  ],
  'escalation_steps.*.users.*' => [
      'exists:users,id'
  ]
  ```

### SLA Calculation Validation

#### Due Date Calculation
```php
public function calculateDueDate(Task $task): Carbon
{
    $slaPolicy = $task->slaPolicy;
    
    // Base due date from creation time
    $baseTime = $task->created_at ?? now();
    
    // Add resolution time
    $dueDate = $baseTime->copy()->addMinutes($slaPolicy->resolution_time_minutes);
    
    // Consider business hours (if configured)
    if (config('sla.business_hours.enabled')) {
        $dueDate = $this->adjustForBusinessHours($baseTime, $dueDate, $slaPolicy->resolution_time_minutes);
    }
    
    // Consider holidays (if configured)
    if (config('sla.holidays.enabled')) {
        $dueDate = $this->adjustForHolidays($dueDate);
    }
    
    return $dueDate;
}
```

#### Breach Detection
```php
public function checkForBreach(Task $task): array
{
    $now = now();
    $breaches = [];
    
    // Check response time breach
    if ($task->state !== 'Done' && $task->start_at) {
        $responseDue = $task->start_at->copy()->addMinutes($task->slaPolicy->response_time_minutes);
        if ($now->gt($responseDue)) {
            $breaches[] = [
                'type' => 'response',
                'breach_time' => $responseDue,
                'time_overdue' => $now->diffInMinutes($responseDue)
            ];
        }
    }
    
    // Check resolution time breach
    if ($task->state !== 'Done' && $task->due_at) {
        if ($now->gt($task->due_at)) {
            $breaches[] = [
                'type' => 'resolution',
                'breach_time' => $task->due_at,
                'time_overdue' => $now->diffInMinutes($task->due_at)
            ];
        }
    }
    
    // Check review time breach
    if ($task->state === 'InReview' && $task->review_started_at) {
        $reviewDue = $task->review_started_at->copy()->addMinutes($task->slaPolicy->review_time_minutes);
        if ($now->gt($reviewDue)) {
            $breaches[] = [
                'type' => 'review',
                'breach_time' => $reviewDue,
                'time_overdue' => $now->diffInMinutes($reviewDue)
            ];
        }
    }
    
    return $breaches;
}
```

## Assignment Validations

### Assignment Algorithm Validation

#### Candidate Selection
```php
public function validateCandidate(User $user, Task $task): array
{
    $issues = [];
    
    // Check permissions
    if (!$user->hasPermission("task.{$task->type}.create")) {
        $issues[] = 'Missing permission for task type';
    }
    
    // Check project team membership (if required)
    if ($task->project_id) {
        $projectTeam = ProjectTeam::where([
            ['project_id', '=', $task->project_id],
            ['user_id', '=', $user->id]
        ])->exists();
        
        if (!$projectTeam) {
            $issues[] = 'User not in project team';
        }
    }
    
    // Check workload threshold
    $activeTasks = $this->getActiveTaskCount($user->id);
    $maxLoad = config('assignment.max_tasks_per_user');
    
    if ($activeTasks >= $maxLoad) {
        $issues[] = "User at maximum capacity ({$activeTasks}/{$maxLoad})";
    }
    
    // Check skill match
    $requiredSkills = $task->tags;
    $userSkills = $user->skills->pluck('name')->toArray();
    $skillMatch = count(array_intersect($requiredSkills, $userSkills)) / count($requiredSkills);
    
    if ($skillMatch < 0.5) { // Less than 50% skill match
        $issues[] = "Low skill match ({$skillMatch * 100}%)";
    }
    
    return $issues;
}
```

#### Assignment Scoring
```php
public function calculateAssignmentScore(User $user, Task $task): float
{
    $weights = config('assignment.weights');
    
    $score = 0;
    
    // Availability (0-1)
    $availability = $this->calculateAvailability($user);
    $score += $availability * $weights['availability'];
    
    // Workload (inverse, 0-1)
    $workload = $this->calculateWorkloadScore($user);
    $score += $workload * $weights['workload'];
    
    // Overdue tasks (inverse, 0-1)
    $overdueScore = $this->calculateOverdueScore($user);
    $score += $overdueScore * $weights['overdue'];
    
    // Skill match (0-1)
    $skillScore = $this->calculateSkillMatch($user, $task);
    $score += $skillScore * $weights['skills'];
    
    // Ownership continuity (0-1)
    $continuityScore = $this->calculateContinuityScore($user, $task);
    $score += $continuityScore * $weights['continuity'];
    
    return round($score, 2);
}
```

### Assignment Constraints

#### User Constraints
```php
// User must be active
if ($user->status !== 'active') {
    throw new ValidationException('Cannot assign to inactive user');
}

// User must not be on leave
if ($user->leave_status === 'on_leave') {
    throw new ValidationException('Cannot assign to user on leave');
}

// User must have required certifications (if applicable)
if ($task->requires_certification && !$user->hasCertification($task->required_certification)) {
    throw new ValidationException('User lacks required certification');
}
```

#### Department Constraints
```php
// Department must be active
if ($department->status !== 'active') {
    throw new ValidationException('Cannot assign to inactive department');
}

// Department must have capacity
$activeTasks = Task::where([
    ['assigned_department_id', '=', $department->id],
    ['state', 'not in', ['Done', 'Cancelled']]
])->count();

if ($activeTasks >= $department->max_capacity) {
    throw new ValidationException('Department at maximum capacity');
}
```

#### Task Constraints
```php
// Task must not be completed or cancelled
if (in_array($task->state, ['Done', 'Cancelled'])) {
    throw new ValidationException('Cannot assign completed or cancelled tasks');
}

// Task must not already be assigned to the same user
if ($task->current_owner_kind === 'USER' && $task->current_owner_id === $userId) {
    throw new ValidationException('Task is already assigned to this user');
}
```

## Error Messages

### Field Validation Errors

```php
public static function getFieldErrorMessages(): array
{
    return [
        'title.required' => 'Task title is required',
        'title.min' => 'Task title must be at least 3 characters',
        'title.max' => 'Task title cannot exceed 255 characters',
        'title.regex' => 'Task title cannot start or end with whitespace',
        
        'description.max' => 'Description cannot exceed 65535 characters',
        
        'type.required' => 'Task type is required',
        'type.in' => 'Task type must be one of: Bugfix, ProjectWork, Support, InternalRequest, Inspection',
        'type.exists' => 'Invalid task type specified',
        
        'priority.required' => 'Task priority is required',
        'priority.in' => 'Priority must be one of: P1, P2, P3, P4',
        
        'project_id.exists' => 'Specified project does not exist',
        'project_id.required_if' => 'Project is required for this task type',
        
        'department_id.exists' => 'Specified department does not exist',
        'department_id.required_if' => 'Department is required for this task type',
        
        'severity.in' => 'Severity must be one of: Critical, High, Medium, Low',
        'severity.required_if' => 'Severity is required for Bugfix tasks',
        
        'estimate_hours.numeric' => 'Estimate must be a number',
        'estimate_hours.min' => 'Estimate cannot be negative',
        'estimate_hours.max' => 'Estimate cannot exceed 999.99 hours',
        'estimate_hours.regex' => 'Estimate must have up to 2 decimal places',
        
        'due_at.date_format' => 'Due date must be in ISO 8601 format',
        'due_at.after' => 'Due date must be in the future',
        
        'tags.max' => 'Cannot have more than 10 tags',
        'tags.*.min' => 'Tags must be at least 3 characters',
        'tags.*.max' => 'Tags cannot exceed 50 characters',
        'tags.*.regex' => 'Tags can only contain letters, numbers, hyphens, and underscores',
        
        'sla_policy_id.exists' => 'Specified SLA policy does not exist',
        
        'assigned_to.kind.in' => 'Owner kind must be USER, DEPARTMENT, or UNASSIGNED',
        'assigned_to.id.exists' => 'Specified owner does not exist',
        
        'name.regex' => 'Name can only contain letters, spaces, hyphens, and apostrophes',
        'email.unique' => 'Email address is already in use',
        
        'skills.max' => 'Cannot have more than 10 skills',
        'skills.*.name.unique' => 'Skill name already exists for this user',
        'skills.*.proficiency.min' => 'Proficiency must be at least 1',
        'skills.*.proficiency.max' => 'Proficiency cannot exceed 5'
    ];
}
```

### Business Rule Errors

```php
public static function getBusinessRuleErrorMessages(): array
{
    return [
        'task_type_requirements' => 'This task type requires additional information',
        'priority_severity_mismatch' => 'P1 tasks must have Critical or High severity',
        'sla_policy_not_found' => 'No SLA policy found for the specified task type and priority',
        'project_department_mismatch' => 'Project department does not match specified department',
        'user_not_eligible' => 'User does not meet requirements for this task',
        'user_at_capacity' => 'User has reached maximum active task limit',
        'department_at_capacity' => 'Department has reached maximum active task limit',
        'invalid_department' => 'Invalid or inactive department',
        'user_not_active' => 'Cannot assign to inactive user',
        'user_on_leave' => 'Cannot assign to user on leave',
        'missing_certification' => 'User lacks required certification for this task'
    ];
}
```

### Workflow Errors

```php
public static function getWorkflowErrorMessages(): array
{
    return [
        'invalid_state_transition' => 'Invalid state transition from :from to :to',
        'missing_permission' => 'Insufficient permissions for this action',
        'not_assigned_user' => 'Only assigned users can perform this action',
        'missing_reason' => 'Reason is required for this action',
        'reason_too_short' => 'Reason must be at least 10 characters',
        'reason_too_long' => 'Reason cannot exceed 500 characters',
        'missing_reviewers' => 'At least one reviewer is required',
        'invalid_reviewer' => 'Reviewer does not have required permissions',
        'not_reviewer' => 'You are not authorized to review this task',
        'missing_approval_notes' => 'Approval notes are required',
        'missing_rejection_reason' => 'Rejection reason is required',
        'rejection_reason_too_short' => 'Rejection reason must be at least 20 characters',
        'task_already_completed' => 'Task is already completed',
        'task_cancelled' => 'Cannot perform action on cancelled task'
    ];
}
```

### SLA Errors

```php
public static function getSLAErrorMessages(): array
{
    return [
        'response_time_min' => 'Response time must be at least 15 minutes',
        'response_time_max' => 'Response time cannot exceed 8 hours',
        'resolution_time_min' => 'Resolution time must be at least 30 minutes longer than response time',
        'resolution_time_max' => 'Resolution time cannot exceed 5 days',
        'review_time_min' => 'Review time must be at least 30 minutes',
        'review_time_max' => 'Review time cannot exceed 24 hours',
        'escalation_after_min' => 'Escalation must be at least 15 minutes after task start',
        'escalation_after_max' => 'Escalation cannot be after resolution time',
        'escalation_notify_invalid' => 'Escalation notify must be Team Lead, Manager, Director, or VP',
        'escalation_users_invalid' => 'Invalid user specified for escalation',
        'sla_breach' => 'SLA breach detected: :breach_type overdue by :minutes minutes',
        'business_hours_not_configured' => 'Business hours configuration is required',
        'holidays_not_configured' => 'Holidays configuration is required'
    ];
}
```

### Assignment Errors

```php
public static function getAssignmentErrorMessages(): array
{
    return [
        'assignment_failed' => 'Assignment algorithm failed: :reason',
        'no_eligible_candidates' => 'No eligible users found for assignment',
        'department_assignment_failed' => 'Department assignment failed: :reason',
        'user_not_in_project_team' => 'User is not a member of the required project team',
        'user_missing_permission' => 'User lacks required permission: :permission',
        'user_at_maximum_capacity' => 'User has reached maximum active task capacity',
        'low_skill_match' => 'User skill match is below minimum threshold (:percentage%)',
        'invalid_assignment_target' => 'Invalid assignment target',
        'task_already_assigned' => 'Task is already assigned to this user/department',
        'cannot_assign_to_inactive' => 'Cannot assign to inactive user/department',
        'assignment_override_required' => 'Assignment override permission required'
    ];
}
```

## Validation Examples

### Example 1: Task Creation Validation

```php
public function validateTaskCreation(array $data, User $user): void
{
    $validator = Validator::make($data, [
        'title' => ['required', 'string', 'min:3', 'max:255', 'regex:/^[^\s].*[^\s]$/'],
        'description' => ['nullable', 'string', 'max:65535'],
        'type' => ['required', 'string', 'in:Bugfix,ProjectWork,Support,InternalRequest,Inspection', 'exists:task_types,code'],
        'priority' => ['required', 'string', 'in:P1,P2,P3,P4'],
        'project_id' => ['nullable', 'integer', 'exists:projects,id', 'required_if:type,Bugfix,ProjectWork'],
        'department_id' => ['nullable', 'integer', 'exists:departments,id', 'required_if:type,InternalRequest,Support'],
        'severity' => ['nullable', 'string', 'in:Critical,High,Medium,Low', 'required_if:type,Bugfix'],
        'estimate_hours' => ['nullable', 'numeric', 'min:0', 'max:999.99', 'regex:/^\d+(\.\d{1,2})?$/'],
        'due_at' => ['nullable', 'date_format:Y-m-d\TH:i:s\Z|Y-m-d H:i:s', 'after:now'],
        'tags' => ['nullable', 'array', 'max:10'],
        'tags.*' => ['string', 'min:3', 'max:50', 'regex:/^[a-zA-Z0-9-_]+$/'],
        'sla_policy_id' => ['nullable', 'integer', 'exists:sla_policies,id'],
        'assigned_to.kind' => ['nullable', 'string', 'in:USER,DEPARTMENT,UNASSIGNED'],
        'assigned_to.id' => ['nullable', 'integer', 'required_with:assigned_to.kind']
    ], $this->getFieldErrorMessages());
    
    if ($validator->fails()) {
        throw new ValidationException($validator);
    }
    
    // Business rule validation
    $this->validateBusinessRules($data, $user);
    
    // Permission validation
    if (!$user->hasPermission('task.create')) {
        throw new AuthorizationException('Insufficient permissions to create tasks');
    }
}
```

### Example 2: State Transition Validation

```php
public function validateStateTransition(Task $task, string $newState, User $user, array $data = []): void
{
    $workflowValidator = new WorkflowValidator();
    
    // Check if transition is valid
    if (!$workflowValidator->isValidTransition($task->state, $newState)) {
        throw new ValidationException("Cannot transition from {$task->state} to {$newState}");
    }
    
    // Check permissions based on transition
    switch ($newState) {
        case 'Assigned':
            if (!$user->hasPermission('task.assign')) {
                throw new AuthorizationException('Insufficient permissions to assign tasks');
            }
            break;
            
        case 'InProgress':
            if (!$user->hasPermission('task.start')) {
                throw new AuthorizationException('Insufficient permissions to start tasks');
            }
            if ($task->current_owner_kind === 'USER' && $task->current_owner_id !== $user->id) {
                throw new ValidationException('Only assigned users can start tasks');
            }
            break;
            
        case 'Blocked':
            if (!$user->hasPermission('task.block')) {
                throw new AuthorizationException('Insufficient permissions to block tasks');
            }
            if (empty($data['reason']) || strlen($data['reason']) < 10) {
                throw new ValidationException('Blocking reason is required and must be at least 10 characters');
            }
            break;
            
        case 'InReview':
            if (!$user->hasPermission('task.request_review')) {
                throw new AuthorizationException('Insufficient permissions to request review');
            }
            if ($task->current_owner_kind === 'USER' && $task->current_owner_id !== $user->id) {
                throw new ValidationException('Only assigned users can submit for review');
            }
            if (empty($data['reviewers'])) {
                throw new ValidationException('At least one reviewer is required');
            }
            break;
            
        case 'Done':
            if (!$user->hasPermission('task.complete')) {
                throw new AuthorizationException('Insufficient permissions to complete tasks');
            }
            if ($task->state !== 'InReview') {
                throw new ValidationException('Tasks can only be completed from InReview state');
            }
            break;
    }
    
    // SLA validation for certain transitions
    if (in_array($newState, ['Assigned', 'InProgress', 'Done'])) {
        $this->validateSLACompliance($task, $newState);
    }
}
```

### Example 3: Assignment Validation

```php
public function validateAssignment(Task $task, string $ownerKind, ?int $ownerId, User $assigner): array
{
    $errors = [];
    
    // Check assigner permissions
    if (!$assigner->hasPermission('task.assign')) {
        $errors[] = 'Insufficient permissions to assign tasks';
    }
    
    // Validate assignment target
    if ($ownerKind === 'USER') {
        $user = User::find($ownerId);
        if (!$user) {
            $errors[] = 'User does not exist';
        } elseif ($user->status !== 'active') {
            $errors[] = 'Cannot assign to inactive user';
        } elseif (!$user->hasPermission("task.{$task->type}.create")) {
            $errors[] = 'User does not have permission for this task type';
        }
        
        // Check workload
        $activeTasks = Task::where([
            ['assigned_to_id', '=', $ownerId],
            ['state', 'not in', ['Done', 'Cancelled']]
        ])->count();
        
        if ($activeTasks >= config('assignment.max_tasks_per_user')) {
            $errors[] = "User has reached maximum capacity ({$activeTasks}/" . config('assignment.max_tasks_per_user') . ")";
        }
        
    } elseif ($ownerKind === 'DEPARTMENT') {
        $department = Department::find($ownerId);
        if (!$department) {
            $errors[] = 'Department does not exist';
        } elseif ($department->status !== 'active') {
            $errors[] = 'Cannot assign to inactive department';
        }
        
        // Check department capacity
        $activeTasks = Task::where([
            ['assigned_department_id', '=', $ownerId],
            ['state', 'not in', ['Done', 'Cancelled']]
        ])->count();
        
        if ($activeTasks >= $department->max_capacity) {
            $errors[] = "Department has reached maximum capacity ({$activeTasks}/{$department->max_capacity})";
        }
    }
    
    // Validate task state
    if (in_array($task->state, ['Done', 'Cancelled'])) {
        $errors[] = 'Cannot assign completed or cancelled tasks';
    }
    
    // Check if already assigned to same target
    if ($task->current_owner_kind === $ownerKind && $task->current_owner_id === $ownerId) {
        $errors[] = 'Task is already assigned to this target';
    }
    
    return $errors;
}
```

---

**Note**: This validation rules document should be updated whenever new validation rules are added or existing rules are modified. It serves as the single source of truth for all validation logic in the system.