# Migration Guide - V1 Task Management System

This guide explains how to migrate from the existing system to the new V1 Task Management System.

## Overview

The V1 Task Management System introduces:
- Enhanced data model with SLA support
- Capability-based permissions
- State machine workflows
- Comprehensive audit logging
- Smart assignment algorithms

## Prerequisites

- Backup your existing database
- Ensure you have Laravel 10+ installed
- PHP 8.1 or higher
- Composer dependencies updated

## Migration Steps

### 1. Fresh Installation (Recommended)

For new installations or when you can start fresh:

```bash
# 1. Drop existing database (if acceptable)
php artisan migrate:fresh --seed

# 2. Run the V1 migration
php artisan migrate --path=database/migrations/2025_12_18_000000_create_v1_task_management_system.php

# 3. Seed the database
php artisan db:seed --class=V1TaskManagementSeeder
```

### 2. Data Migration (For Existing Systems)

If you need to preserve existing data:

#### Step 1: Backup and Prepare

```bash
# Backup your current database
mysqldump -u username -p database_name > backup.sql

# Create a new database for the migration
mysql -u username -p -e "CREATE DATABASE new_database_name;"
```

#### Step 2: Run Fresh Migration

```bash
# Switch to the new database in .env
DB_DATABASE=new_database_name

# Run the V1 migration
php artisan migrate --path=database/migrations/2025_12_18_000000_create_v1_task_management_system.php

# Seed base data
php artisan db:seed --class=V1TaskManagementSeeder
```

#### Step 3: Migrate Existing Data

Create a migration script to transfer your existing data:

```php
// database/migrations/2025_12_18_000001_migrate_existing_data.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

class MigrateExistingData extends Migration
{
    public function up()
    {
        // Migrate users
        $this->migrateUsers();
        
        // Migrate departments
        $this->migrateDepartments();
        
        // Migrate tasks
        $this->migrateTasks();
        
        // Migrate tickets
        $this->migrateTickets();
    }

    private function migrateUsers()
    {
        // Map old users to new structure
        $oldUsers = DB::connection('old_connection')->table('users')->get();
        
        foreach ($oldUsers as $user) {
            DB::table('users')->updateOrInsert(
                ['email' => $user->email],
                [
                    'name' => $user->name,
                    'email' => $user->email,
                    'password' => $user->password,
                    'status' => $user->status ?? 'active',
                    'created_at' => $user->created_at,
                    'updated_at' => $user->updated_at,
                ]
            );
        }
    }

    private function migrateDepartments()
    {
        // Map old departments to new structure
        $oldDepts = DB::connection('old_connection')->table('departments')->get();
        
        foreach ($oldDepts as $dept) {
            DB::table('departments')->updateOrInsert(
                ['name' => $dept->name],
                [
                    'name' => $dept->name,
                    'description' => $dept->description,
                    'status' => $dept->status ?? 'active',
                    'color' => $dept->color ?? '#3B82F6',
                    'created_at' => $dept->created_at,
                    'updated_at' => $dept->updated_at,
                ]
            );
        }
    }

    private function migrateTasks()
    {
        // Map old tasks to new enhanced structure
        $oldTasks = DB::connection('old_connection')->table('tasks')->get();
        
        foreach ($oldTasks as $task) {
            DB::table('tasks')->updateOrInsert(
                ['task_code' => $task->task_code],
                [
                    'task_code' => $task->task_code,
                    'title' => $task->title,
                    'description' => $task->description,
                    'type' => $this->mapTaskType($task->status),
                    'priority' => $this->mapPriority($task->priority),
                    'created_by_user_id' => $task->created_by,
                    'current_owner_kind' => $task->assigned_to ? 'USER' : 'UNASSIGNED',
                    'current_owner_id' => $task->assigned_to,
                    'state' => $this->mapTaskState($task->status),
                    'due_at' => $task->due_date,
                    'estimate_hours' => null,
                    'version' => 1,
                    'ticket_id' => $task->ticket_id,
                    'created_at' => $task->created_at,
                    'updated_at' => $task->updated_at,
                ]
            );
        }
    }

    private function migrateTickets()
    {
        // Map old tickets to new structure
        $oldTickets = DB::connection('old_connection')->table('tickets')->get();
        
        foreach ($oldTickets as $ticket) {
            DB::table('tickets')->updateOrInsert(
                ['ticket_number' => $ticket->ticket_number],
                [
                    'ticket_number' => $ticket->ticket_number,
                    'title' => $ticket->title,
                    'description' => $ticket->description,
                    'category' => $ticket->category ?? 'general',
                    'priority' => $this->mapPriority($ticket->priority),
                    'status' => $ticket->status,
                    'client_id' => $ticket->client_id,
                    'client_product_instance_id' => $ticket->client_product_instance_id,
                    'assigned_to' => $ticket->assigned_to,
                    'created_at' => $ticket->created_at,
                    'updated_at' => $ticket->updated_at,
                ]
            );
        }
    }

    private function mapTaskType($status)
    {
        // Map old status to new task types
        return 'ProjectWork'; // Default mapping
    }

    private function mapPriority($priority)
    {
        // Map old priority to new P1-P4 format
        $priorityMap = [
            'low' => 'P3',
            'medium' => 'P2',
            'high' => 'P2',
            'critical' => 'P1',
        ];
        
        return $priorityMap[$priority] ?? 'P2';
    }

    private function mapTaskState($status)
    {
        // Map old status to new state machine
        $stateMap = [
            'pending' => 'Assigned',
            'in-progress' => 'InProgress',
            'completed' => 'Done',
            'cancelled' => 'Cancelled',
        ];
        
        return $stateMap[$status] ?? 'Draft';
    }
}
```

### 3. Update Application Code

#### Models

Update your models to use the new structure:

```php
// app/Models/Task.php
class Task extends Model
{
    protected $fillable = [
        'task_code',
        'title',
        'description',
        'type',
        'priority',
        'sla_policy_id',
        'created_by_user_id',
        'project_id',
        'department_id',
        'current_owner_kind',
        'current_owner_id',
        'state',
        'start_at',
        'due_at',
        'completed_at',
        'estimate_hours',
        'severity',
        'tags',
        'version',
        'parent_task_id',
        'ticket_id',
        'metadata',
    ];

    protected $casts = [
        'tags' => 'array',
        'metadata' => 'array',
        'start_at' => 'datetime',
        'due_at' => 'datetime',
        'completed_at' => 'datetime',
        'estimate_hours' => 'decimal:2',
    ];
}
```

#### Controllers

Update controllers to use new endpoints and validation:

```php
// app/Http/Controllers/TaskController.php
class TaskController extends Controller
{
    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'type' => ['required', 'string', 'in:Bugfix,ProjectWork,Support,InternalRequest,Inspection'],
            'priority' => ['required', 'string', 'in:P1,P2,P3,P4'],
            'assigned_to' => ['nullable', 'exists:users,id'],
            // ... other validations
        ]);

        $task = Task::create($validated);
        
        // Create audit event
        TaskAuditEvent::create([
            'task_id' => $task->id,
            'actor_user_id' => auth()->id(),
            'action' => 'CREATE',
            'to_state' => $task->state,
            'to_owner_kind' => $task->current_owner_kind,
            'to_owner_id' => $task->current_owner_id,
        ]);

        return response()->json($task, 201);
    }
}
```

#### Routes

Update routes to use new API structure:

```php
// routes/api.php
Route::prefix('v1')->group(function () {
    Route::apiResource('tasks', TaskController::class);
    
    // Workflow endpoints
    Route::patch('tasks/{task}/state', [TaskWorkflowController::class, 'updateState']);
    Route::post('tasks/{task}/assign', [TaskAssignmentController::class, 'assign']);
    Route::post('tasks/{task}/reassign', [TaskAssignmentController::class, 'reassign']);
    Route::post('tasks/{task}/block', [TaskWorkflowController::class, 'block']);
    Route::post('tasks/{task}/unblock', [TaskWorkflowController::class, 'unblock']);
    Route::post('tasks/{task}/review', [TaskWorkflowController::class, 'submitReview']);
    
    // Audit trail
    Route::get('tasks/{task}/audit', [TaskAuditController::class, 'getAuditTrail']);
});
```

### 4. Frontend Updates

Update your frontend components to work with the new API:

```javascript
// resources/js/composables/useTasks.js
export function useTasks() {
    const createTask = async (taskData) => {
        const response = await axios.post('/api/v1/tasks', {
            ...taskData,
            type: taskData.type || 'ProjectWork',
            priority: taskData.priority || 'P2',
        });
        return response.data;
    };

    const updateTaskState = async (taskId, newState, reason) => {
        const response = await axios.patch(`/api/v1/tasks/${taskId}/state`, {
            to_state: newState,
            reason: reason,
        });
        return response.data;
    };

    const assignTask = async (taskId, assignee) => {
        const response = await axios.post(`/api/v1/tasks/${taskId}/assign`, {
            to: assignee,
        });
        return response.data;
    };

    return {
        createTask,
        updateTaskState,
        assignTask,
    };
}
```

### 5. Testing

After migration, test the following:

1. **Data Integrity**
   ```bash
   # Verify data migration
   php artisan tinker
   >>> App\Models\Task::count()
   >>> App\Models\User::count()
   ```

2. **API Endpoints**
   ```bash
   # Test new API endpoints
   curl -X GET http://your-app.test/api/v1/tasks
   curl -X POST http://your-app.test/api/v1/tasks \
     -H "Content-Type: application/json" \
     -d '{"title":"Test Task","type":"Bugfix","priority":"P1"}'
   ```

3. **Permissions**
   ```bash
   # Test capability-based permissions
   php artisan tinker
   >>> $user = App\Models\User::find(1)
   >>> $user->hasPermission('task.create')
   ```

4. **Workflows**
   ```bash
   # Test state transitions
   curl -X PATCH http://your-app.test/api/v1/tasks/1/state \
     -H "Content-Type: application/json" \
     -d '{"to_state":"InProgress","reason":"Starting work"}'
   ```

### 6. Deployment

#### Environment Configuration

Update your `.env` file:

```env
# Database
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=your_database
DB_USERNAME=your_username
DB_PASSWORD=your_password

# Queue (for SLA notifications)
QUEUE_CONNECTION=database

# Cache
CACHE_DRIVER=redis
SESSION_DRIVER=database

# Logging
LOG_CHANNEL=stack
LOG_LEVEL=debug
```

#### Queue Workers

Set up queue workers for SLA notifications:

```bash
# Start queue worker
php artisan queue:work --daemon

# Or use supervisor for production
# /etc/supervisor/conf.d/laravel-worker.conf
```

#### Scheduled Tasks

Set up cron job for scheduled tasks:

```bash
# crontab -e
* * * * * php /path/to/your/project/artisan schedule:run >> /dev/null 2>&1
```

### 7. Rollback Plan

If you need to rollback:

```bash
# 1. Restore database backup
mysql -u username -p database_name < backup.sql

# 2. Revert code changes
git checkout HEAD -- app/Models/
git checkout HEAD -- app/Http/Controllers/
git checkout HEAD -- routes/

# 3. Clear cache
php artisan config:clear
php artisan cache:clear
php artisan route:clear
php artisan view:clear
```

## Common Issues and Solutions

### Issue 1: Foreign Key Constraints

**Problem**: Migration fails due to foreign key constraints.

**Solution**: 
```php
// In your migration, disable foreign key checks
Schema::disableForeignKeyConstraints();
// Your migration code
Schema::enableForeignKeyConstraints();
```

### Issue 2: Data Type Mismatches

**Problem**: Old data doesn't match new field types.

**Solution**: 
```php
// In migration script, cast data appropriately
$oldValue = $record->old_field;
$newValue = $this->convertDataType($oldValue, $newFieldType);
```

### Issue 3: Permission Errors

**Problem**: Users can't access new features.

**Solution**: 
```bash
# Regenerate permissions
php artisan app:generate-permissions

# Assign permissions to roles
php artisan tinker
>>> $role = App\Models\Role::where('slug', 'admin')->first()
>>> $role->permissions()->sync(App\Models\Permission::all())
```

### Issue 4: API Versioning

**Problem**: Frontend still calling old API endpoints.

**Solution**: 
```javascript
// Update API base URL
const api = axios.create({
    baseURL: '/api/v1',
    headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
    }
});
```

## Post-Migration Tasks

1. **Update Documentation**
   - API documentation
   - User guides
   - Developer documentation

2. **Training**
   - Train users on new workflows
   - Train developers on new API
   - Train administrators on new permissions

3. **Monitoring**
   - Set up monitoring for SLA breaches
   - Monitor assignment algorithm performance
   - Track workflow efficiency

4. **Optimization**
   - Optimize database queries
   - Add indexes for frequently queried fields
   - Configure caching strategies

## Support

If you encounter issues during migration:

1. Check the [API Documentation](docs/api-contracts.md)
2. Review [Data Validation Rules](docs/data-validation-rules.md)
3. Check application logs: `storage/logs/laravel.log`
4. Use the [Debug Mode](docs/README-v1-implementation.md#debug-mode)

For additional help:
- Create an issue in the project repository
- Contact the development team
- Check the [FAQ](docs/faq.md)