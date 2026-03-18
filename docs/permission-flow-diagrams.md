# Employee-User-Role-Permission Flow Diagram

## Entity Relationship Diagram

```mermaid
erDiagram
    EMPLOYEES ||--|| USERS : has
    USERS ||--o{ ROLE_USER : assigned_to
    ROLES ||--o{ ROLE_USER : has
    ROLES ||--o{ ROLE_PERMISSIONS : grants
    PERMISSIONS ||--o{ ROLE_PERMISSIONS : assigned_to
    USERS ||--o{ USER_PERMISSIONS : overrides
    PERMISSIONS ||--o{ USER_PERMISSIONS : overridden_for
    
    EMPLOYEES {
        id PK
        name
        email
        phone
        user_id FK
        department_id FK
        status
    }
    
    USERS {
        id PK
        name
        email
        password
        email_verified_at
        created_at
        updated_at
    }
    
    ROLES {
        id PK
        name
        slug
        description
        level
        is_default
    }
    
    PERMISSIONS {
        id PK
        name
        slug
        module
        action
        description
    }
    
    ROLE_USER {
        id PK
        role_id FK
        user_id FK
        created_at
        updated_at
    }
    
    ROLE_PERMISSIONS {
        id PK
        role_id FK
        permission_id FK
        created_at
        updated_at
    }
    
    USER_PERMISSIONS {
        id PK
        user_id FK
        permission_id FK
        granted
        created_at
        updated_at
    }
```

## Permission Flow Diagrams

### Flow 1: Employee → User → Permission (Override Flow)

```mermaid
flowchart TD
    A[Employee Record] -->|user_id| B[User Account]
    B -->|user_permissions<br/>granted='granted'| C[Permission Granted]
    B -->|user_permissions<br/>granted='denied'| D[Permission Denied]
    
    C --> E[Effective Permission]
    D --> F[Blocked Permission]
    
    style A fill:#e1f5fe
    style B fill:#f3e5f5
    style C fill:#e8f5e8
    style D fill:#ffebee
    style E fill:#e8f5e8
    style F fill:#ffebee
```

### Flow 2: Employee → User → Role → Permission (Inheritance Flow)

```mermaid
flowchart TD
    A[Employee Record] -->|user_id| B[User Account]
    B -->|role_user| C[Role Assignment]
    C -->|role_permissions| D[Role Permissions]
    D --> E[Effective Permissions]
    
    style A fill:#e1f5fe
    style B fill:#f3e5f5
    style C fill:#fff3e0
    style D fill:#e8f5e8
    style E fill:#e8f5e8
```

## Complete Permission Resolution Flow

```mermaid
flowchart TD
    A[Permission Check Request] --> B{User has explicit denial?}
    B -->|Yes| C[DENY Permission]
    B -->|No| D{User has explicit grant?}
    D -->|Yes| E[GRANT Permission]
    D -->|No| F{Check Role Permissions}
    F -->|Found in any role| E
    F -->|Not found| G[DENY Permission]
    
    style C fill:#ffebee
    style E fill:#e8f5e8
    style G fill:#ffebee
```

## Data Flow Examples

### Example 1: Role-Based Only

```mermaid
flowchart LR
    subgraph "Employee: John Doe"
        A[id: 1, user_id: 5]
    end
    
    subgraph "User: john@example.com"
        B[id: 5]
    end
    
    subgraph "Role: Manager"
        C[id: 2, name: Manager]
    end
    
    subgraph "Permissions"
        D[task.read]
        E[task.update]  
        F[user.read]
    end
    
    A -->|links to| B
    B -->|assigned to| C
    C -->|grants| D
    C -->|grants| E
    C -->|grants| F
    
    style C fill:#fff3e0
    style D fill:#e8f5e8
    style E fill:#e8f5e8
    style F fill:#e8f5e8
```

### Example 2: Role + Overrides

```mermaid
flowchart LR
    subgraph "Employee: Jane Smith"
        A[id: 2, user_id: 10]
    end
    
    subgraph "User: jane@example.com"
        B[id: 10]
    end
    
    subgraph "Role: Employee"
        C[id: 3, name: Employee]
    end
    
    subgraph "Role Permissions"
        D[task.read]
        E[ticket.read]
    end
    
    subgraph "Additional Permissions"
        F[task.update - GRANTED]
    end
    
    subgraph "Restricted Permissions"
        G[ticket.read - DENIED]
    end
    
    A -->|links to| B
    B -->|assigned to| C
    C -->|grants| D
    C -->|grants| E
    
    B -->|additional| F
    B -->|restrict| G
    
    style C fill:#fff3e0
    style D fill:#e8f5e8
    style E fill:#ffebee
    style F fill:#e8f5e8
    style G fill:#ffebee
```

**Calculation**:
- **Role Permissions**: 2 (task.read, ticket.read)
- **Additional**: 1 (task.update)  
- **Restricted**: 1 (ticket.read)
- **Effective Total**: (2 - 1) + 1 = 2 permissions
- **Final Permissions**: [task.read, task.update]

## Query Patterns

### Get User's Effective Permissions

```sql
-- Step 1: Get role-based permissions (minus denied)
SELECT DISTINCT p.*
FROM permissions p
JOIN role_permissions rp ON p.id = rp.permission_id
JOIN role_user ru ON rp.role_id = ru.role_id
WHERE ru.user_id = :user_id
AND p.id NOT IN (
    SELECT permission_id 
    FROM user_permissions 
    WHERE user_id = :user_id AND granted = 'denied'
)

UNION

-- Step 2: Get explicitly granted user permissions
SELECT DISTINCT p.*
FROM permissions p
JOIN user_permissions up ON p.id = up.permission_id
WHERE up.user_id = :user_id AND up.granted = 'granted';
```

### Check Specific Permission

```php
public function hasPermission($permissionSlug): bool
{
    $user = $this;
    $permission = Permission::where('slug', $permissionSlug)->first();
    
    if (!$permission) return false;
    
    // Priority 1: Explicit denial
    if ($user->deniedPermissions()->where('permission_id', $permission->id)->exists()) {
        return false;
    }
    
    // Priority 2: Explicit grant
    if ($user->permissions()->where('permission_id', $permission->id)->exists()) {
        return true;
    }
    
    // Priority 3: Role-based
    foreach ($user->roles as $role) {
        if ($role->permissions()->where('permission_id', $permission->id)->exists()) {
            return true;
        }
    }
    
    return false;
}
```

## API Endpoints and Data Flow

### Employee List API Response

```json
{
  "employees": {
    "data": [
      {
        "id": 1,
        "name": "John Doe",
        "email": "john@example.com",
        "department": {
          "id": 1,
          "name": "IT Department"
        },
        "user": {
          "id": 5,
          "role": {
            "id": 2,
            "name": "Manager"
          },
          "role_permissions": [
            {
              "id": 1,
              "name": "Read Tasks",
              "slug": "task.read",
              "module": "task"
            },
            {
              "id": 2,
              "name": "Update Tasks", 
              "slug": "task.update",
              "module": "task"
            }
          ],
          "additional_permissions": [],
          "denied_permissions": []
        }
      }
    ]
  }
}
```

### Permission Summary Calculation (Frontend)

```javascript
// Calculate effective permissions for display
function calculatePermissionSummary(user) {
    const rolePermissions = user.role_permissions || [];
    const additionalPermissions = user.additional_permissions || [];
    const restrictedPermissions = user.denied_permissions || [];
    
    // Formula: (Role Permissions - Restricted Role Permissions) + Additional Permissions
    const effectiveRolePermissions = rolePermissions.filter(
        permission => !restrictedPermissions.includes(permission.slug)
    );
    
    const totalEffectivePermissions = [
        ...effectiveRolePermissions,
        ...additionalPermissions
    ];
    
    return {
        roleBased: rolePermissions.length,
        additional: additionalPermissions.length,
        restricted: restrictedPermissions.length,
        effectiveTotal: totalEffectivePermissions.length,
        effectivePermissions: totalEffectivePermissions
    };
}
```

**Permission Formula**:
```
Total Effective Permissions = (Role Permissions - Restricted Role Permissions) + Additional Permissions
```

## Summary

The permission system uses a **hybrid RBAC model** with override capabilities:

- **Base Layer**: Role-based permissions provide default access
- **Override Layer**: User-level permissions can grant or deny specific permissions  
- **Resolution Logic**: Denials > Grants > Role Permissions > No Access

This design provides flexibility for fine-grained permission management while maintaining role-based organization for scalability.