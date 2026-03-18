# Employee-User-Role-Permission Flow Analysis

## Overview
This document analyzes the permission system architecture and data flow for the employee management system, specifically focusing on how permissions flow from employees through users, roles, and permissions.

## Database Structure

### Core Tables

#### 1. `employees` Table
- **Purpose**: Stores employee information
- **Key Fields**: `id`, `name`, `email`, `phone`, `user_id`, `department_id`
- **Relationships**: 
  - `user_id` → `users.id` (One-to-One)
  - `department_id` → `departments.id` (Many-to-One)

#### 2. `users` Table
- **Purpose**: Authentication and user accounts
- **Key Fields**: `id`, `name`, `email`, `password`
- **Relationships**:
  - Many-to-Many with `roles` via `role_user` table
  - Many-to-Many with `permissions` via `user_permissions` table (overrides)

#### 3. `roles` Table
- **Purpose**: Defines user roles with associated permissions
- **Key Fields**: `id`, `name`, `slug`, `description`, `level`
- **Relationships**:
  - Many-to-Many with `users` via `role_user` table
  - Many-to-Many with `permissions` via `role_permissions` table

#### 4. `permissions` Table
- **Purpose**: Defines granular permissions
- **Key Fields**: `id`, `name`, `slug`, `module`, `action`, `description`
- **Relationships**:
  - Many-to-Many with `roles` via `role_permissions` table
  - Many-to-Many with `users` via `user_permissions` table (overrides)

#### 5. `role_user` Table (Pivot)
- **Purpose**: Maps users to roles (Many-to-Many)
- **Fields**: `id`, `role_id`, `user_id`, `timestamps`
- **Uniqueness**: Unique constraint on `role_id` + `user_id`

#### 6. `role_permissions` Table (Pivot)
- **Purpose**: Maps roles to permissions (Many-to-Many)
- **Fields**: `id`, `role_id`, `permission_id`, `timestamps`
- **Uniqueness**: Unique constraint on `role_id` + `permission_id`

#### 7. `user_permissions` Table (Override Table)
- **Purpose**: User-level permission overrides
- **Fields**: `id`, `user_id`, `permission_id`, `granted` (enum: 'granted'/'denied'), `timestamps`
- **Uniqueness**: Unique constraint on `user_id` + `permission_id`
- **Significance**: This allows granular control beyond role permissions

## Relationship Flow Analysis

### 1. Employee → User → Permission Flow

```
Employee → User → User Permissions (Overrides)
```

**Data Path**:
1. **Employee** (record) → `user_id` → **User** (account)
2. **User** → `user_permissions` table → **Permission** (override)

**Use Case**: 
- Grant specific permissions directly to a user
- Deny specific permissions for a user (blacklist)
- These overrides take precedence over role permissions

**Database Query**:
```sql
SELECT p.* 
FROM permissions p
JOIN user_permissions up ON p.id = up.permission_id
WHERE up.user_id = ? AND up.granted = 'granted'
```

**Code Implementation**:
```php
// User model relationships
public function permissions() // Granted overrides
public function deniedPermissions() // Denied overrides

// User model methods
public function giveUserPermission($permission)
public function denyUserPermission($permission)
```

### 2. Employee → User → Role → Permission Flow

```
Employee → User → Role → Role Permissions
```

**Data Path**:
1. **Employee** (record) → `user_id` → **User** (account)
2. **User** → `role_user` table → **Role** (assignment)
3. **Role** → `role_permissions` table → **Permission** (role-based)

**Use Case**:
- Role-based permission inheritance
- Multiple roles per user supported
- Base permission set from role assignments

**Database Query**:
```sql
SELECT p.*
FROM permissions p
JOIN role_permissions rp ON p.id = rp.permission_id
JOIN role_user ru ON rp.role_id = ru.role_id
WHERE ru.user_id = ?
```

**Code Implementation**:
```php
// User model relationships
public function roles()
public function getAllPermissions() // Combines role + user permissions

// Role model relationships  
public function permissions()

// User model methods
public function assignRole($role) // Also applies role permissions
public function hasPermission($permission) // Checks both role + user permissions
```

## Permission Resolution Logic

### Priority Order (Highest to Lowest)

1. **Explicit User Denial** (`user_permissions.granted = 'denied'`)
   - Blocks permission even if granted by role
   
2. **Explicit User Grant** (`user_permissions.granted = 'granted'`)
   - Grants permission even if not in role
   
3. **Role-Based Permission** (`role_permissions`)
   - Default permission inheritance
   
4. **No Permission** (Default)
   - User has no access

### Permission Check Algorithm

```php
public function hasPermission($permission): bool
{
    // Step 1: Check if explicitly denied at user level
    if ($this->deniedPermissions()->get()->contains($permission->id)) {
        return false;
    }

    // Step 2: Check if explicitly granted at user level
    if ($this->permissions()->get()->contains($permission->id)) {
        return true;
    }

    // Step 3: Check role permissions
    foreach ($this->roles as $role) {
        if ($role->permissions()->get()->contains($permission->id)) {
            return true;
        }
    }

    // Step 4: No permission found
    return false;
}
```

## Data Flow Examples

### Example 1: Employee with Role-Based Permissions Only

**Setup**:
- Employee "John Doe" → User ID: 5
- User 5 → Role: "Manager" 
- Role "Manager" → Permissions: ["task.read", "task.update", "user.read"]

**Result**:
- Effective Permissions: ["task.read", "task.update", "user.read"]
- Source: All from role

**Database State**:
```
employees: {id: 1, name: "John Doe", user_id: 5}
role_user: {user_id: 5, role_id: 2} // Manager role
role_permissions: {role_id: 2, permission_id: [1,2,3]}
user_permissions: (empty)
```

### Example 2: Employee with Role + User Overrides

**Setup**:
- Employee "Jane Smith" → User ID: 10
- User 10 → Role: "Employee"
- Role "Employee" → Permissions: ["task.read", "ticket.read"]
- User 10 → Additional: ["task.update"] (granted)
- User 10 → Denied: ["ticket.read"] (denied)

**Result**:
- **Role Permissions**: ["task.read", "ticket.read"] (2 total)
- **Additional Permissions**: ["task.update"] (1 total)  
- **Restricted Permissions**: ["ticket.read"] (1 total)
- **Effective Total**: (2 - 1) + 1 = 2 permissions
- **Final Effective Permissions**: ["task.read", "task.update"]

**Database State**:
```
employees: {id: 2, name: "Jane Smith", user_id: 10}
role_user: {user_id: 10, role_id: 3} // Employee role
role_permissions: {role_id: 3, permission_id: [1,4]} // task.read, ticket.read
user_permissions: 
  - {user_id: 10, permission_id: 2, granted: 'granted'} // task.update (additional)
  - {user_id: 10, permission_id: 4, granted: 'denied'} // ticket.read (restricted)
```

**Permission Calculation**:
```
Effective Permissions = (Role Permissions - Restricted Role Permissions) + Additional Permissions
                      = (["task.read", "ticket.read"] - ["ticket.read"]) + ["task.update"]
                      = ["task.read"] + ["task.update"]
                      = ["task.read", "task.update"]
```

## API and Controller Implementation

### Employee Controller Permission Loading

```php
// In EmployeeController::index()
$query = Employee::with([
    'department', 
    'user',
    'user.roles.permissions',        // Role permissions
    'user.permissions',              // User granted permissions
    'user.deniedPermissions'         // User denied permissions
]);
```

### Permission Summary Calculation

```javascript
// In React component
const rolePermissions = user?.role_permissions || [];
const additionalPermissions = user?.additional_permissions || [];
const restrictedPermissions = user?.denied_permissions || [];

// Calculate effective permissions
// Formula: (Role Permissions - Restricted Role Permissions) + Additional Permissions
const effectiveRolePermissions = rolePermissions.filter(
    permission => !restrictedPermissions.includes(permission.slug)
);

// Total effective permissions
const totalPermissions = effectiveRolePermissions.length + additionalPermissions.length;

// For display purposes
const permissionSummary = {
    roleBased: rolePermissions.length,
    additional: additionalPermissions.length,
    restricted: restrictedPermissions.length,
    effectiveTotal: totalPermissions,
    effectivePermissions: [...effectiveRolePermissions, ...additionalPermissions]
};
```

**Permission Calculation Formula**:
```
Total Effective Permissions = (Role Permissions - Restricted Role Permissions) + Additional Permissions
```

## Key Design Patterns

### 1. **Role-Based Access Control (RBAC)**
- Users inherit permissions from roles
- Supports multiple roles per user
- Hierarchical permission levels

### 2. **Override Mechanism**
- User-level permissions can override role permissions
- Allows granular control without creating many roles
- Supports both granting and denying specific permissions

### 3. **Separation of Concerns**
- **Roles**: Define permission sets
- **Users**: Authentication and account info  
- **User Permissions**: Individual overrides
- **Employees**: Business entity data

### 4. **Cascade Safety**
- Foreign key constraints with appropriate cascade rules
- Role removal doesn't affect user account
- User removal doesn't affect employee record

## Security Considerations

### 1. **Permission Precedence**
- Explicit denies always take precedence
- Prevents privilege escalation
- Maintains security boundaries

### 2. **Data Integrity**
- Unique constraints prevent duplicate assignments
- Foreign key constraints maintain referential integrity
- Cascade rules handle cleanup

### 3. **Audit Trail**
- Timestamps on all permission assignments
- Track who made changes when
- Support for compliance requirements

## Performance Considerations

### 1. **Eager Loading**
- Use `with()` to load relationships efficiently
- Prevents N+1 query problems
- Critical for list views with many employees

### 2. **Indexing**
- Indexes on foreign keys (`user_id`, `role_id`, `permission_id`)
- Composite indexes for unique constraints
- Performance optimization for permission checks

### 3. **Caching**
- Role permissions can be cached
- User permission calculations cached
- Reduces database queries for frequent checks

## Summary

The employee-user-role-permission system implements a sophisticated RBAC model with override capabilities. The two primary flows are:

1. **Direct User Permissions**: Employee → User → User Permissions (for granular overrides)
2. **Role-Based Permissions**: Employee → User → Role → Role Permissions (for inherited access)

The system prioritizes explicit user denials over grants, which are prioritized over role-based permissions, ensuring fine-grained security control while maintaining manageable role structures.