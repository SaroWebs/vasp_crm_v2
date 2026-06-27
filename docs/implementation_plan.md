# Performance Optimization Plan — Heavy Page Rendering & Cloudflare 520

## Background

The app uses **Inertia.js + React** on **shared hosting behind Cloudflare**. When a user directly navigates to a heavy page (full page load, not SPA navigation), PHP must execute all DB queries, serialize the full page props to JSON, and send it to the browser. When this takes too long, Cloudflare shows a **520** error.

## Root Cause Analysis

### 1. `/admin/tickets` Index — 8+ DB Queries Per Request

| Query | Issue |
|---|---|
| `->with(['client','organizationUser','assignedTo','approvedBy','createdBy','latestClosedHistory','tasks'])` | Eagerly loads **full task objects** for every ticket row |
| `computeWorkStatus()` per ticket | PHP loop iterates task collections after load |
| `Ticket::where('status','open')->count()` × 3 | 3 separate COUNT queries for stats dashboard |
| `Auth::user()->getAllPermissions()` | Loads `roles`, `permissions`, `deniedPermissions` — 3-4 queries per request |

### 2. `/admin/tickets/{id}` Show — 7+ DB Queries

Eagerly loads client, organizationUser, assignedTo, approvedBy, createdBy, attachments, **tasks with 3 sub-relations** (assignedUsers, assignedDepartment, createdBy) — all before sending the page. Comments and history are already fetched via AJAX (good), but tasks should be too since `getTicketData` endpoint already exists and `Show.tsx` already calls it via axios.

### 3. `getAllPermissions()` — 3-4 Queries Every Page

`User::getAllPermissions()` fires:
- `$this->permissions()->get()` — user_permissions JOIN
- `$this->load('roles')` — role_user JOIN
- `$this->deniedPermissions()->get()` — another user_permissions query
- `$role->permissions()->get()` per role (N queries)

Called on every heavy page controller with no memoization.

### 4. Large JSON Payload

Every Inertia full-page load embeds all page props as JSON in the initial HTML `<script>` tag. 15+ paginated tickets with all their relations = a very large initial response that's slow to serialize in PHP on shared hosting.

---

## Proposed Changes

### Phase 1 — Quick Wins (No UI Changes)

---

#### [MODIFY] AdminTicketController.php — `index()` method

**Remove full task relation, use withCount instead:**

```php
// Before
->with(['client', 'organizationUser', 'assignedTo', 'approvedBy', 'createdBy', 'latestClosedHistory', 'tasks'])

// After
->with(['client:id,name', 'organizationUser:id,name', 'assignedTo:id,name', 'approvedBy:id,name', 'createdBy:id,name'])
->withCount([
    'tasks',
    'tasks as completed_tasks_count' => fn($q) => $q->whereIn('state', ['Done','Cancelled','Rejected']),
    'tasks as in_progress_tasks_count' => fn($q) => $q->whereIn('state', ['InProgress','InReview','Assigned']),
    'tasks as blocked_tasks_count' => fn($q) => $q->where('state', 'Blocked'),
])
```

**Work status from counts (no PHP loop over task objects):**

```php
// computeWorkStatus() replaced with inline calculation using the counts
$ticket->work_status = [
    'total'       => $ticket->tasks_count,
    'completed'   => $ticket->completed_tasks_count,
    'in_progress' => $ticket->in_progress_tasks_count,
    'blocked'     => $ticket->blocked_tasks_count,
    'status'      => ..., // derive from counts
];
```

**Merge 3 stats COUNT queries into one:**

```php
// Before: 3 separate queries
$stats = [
    'total_open' => Ticket::where('status', 'open')->count(),
    'open_today' => Ticket::where('status', 'open')->whereDate('created_at', Carbon::today())->count(),
    'in_progress' => Ticket::where('status', 'in-progress')->count(),
    'completed' => Ticket::where('status', 'closed')->count(),
];

// After: 1 query
$statsRaw = DB::table('tickets')->whereNull('deleted_at')->selectRaw("
    SUM(status = 'open') as total_open,
    SUM(status = 'open' AND DATE(created_at) = CURDATE()) as open_today,
    SUM(status = 'in-progress') as in_progress,
    SUM(status = 'closed') as completed
")->first();
$stats = (array) $statsRaw;
```

---

#### [MODIFY] AdminTicketController.php — `show()` method

Remove `tasks` from server-side eager-load. The frontend `Show.tsx` already calls `getTicketData()` via axios on mount — tasks come from there:

```php
// Before
$ticket->load(['client', 'organizationUser', 'assignedTo', 'approvedBy', 'createdBy', 'attachments',
    'tasks' => fn($q) => $q->with(['assignedUsers', 'assignedDepartment', 'createdBy'])->latest()
]);

// After — tasks removed (loaded via getTicketData JSON endpoint by frontend)
$ticket->load([
    'client:id,name',
    'organizationUser:id,name,email',
    'assignedTo:id,name',
    'approvedBy:id,name',
    'createdBy:id,name',
    'attachments',
]);
```

> **Prerequisite:** Must confirm that `Show.tsx` uses `getTicketData` for tasks and not the server-rendered `ticket.tasks` prop (see Open Questions).

---

#### [MODIFY] User.php — Memoize `getAllPermissions()`

Add request-level memoization using Laravel 11's `once()` helper:

```php
public function getAllPermissions()
{
    return once(function () {
        $permissions = collect();
        $userPermissions = $this->permissions()->get();
        $permissions = $permissions->merge($userPermissions);

        if (!$this->relationLoaded('roles')) {
            $this->load('roles');
        }

        $deniedPermissionIds = $this->deniedPermissions()->get()->pluck('id')->toArray();

        foreach ($this->roles as $role) {
            $rolePermissions = $role->permissions()->get()->whereNotIn('id', $deniedPermissionIds);
            $permissions = $permissions->merge($rolePermissions);
        }

        return $permissions->unique('id');
    });
}
```

This makes every subsequent call in the same request free (returns cached result).

---

### Phase 2 — Inertia Lazy Props

For the tickets index, use `Inertia::lazy()` to defer stats and permissions — they load after the page is visible via a client-side partial reload:

```php
return Inertia::render('admin/tickets/Index', [
    'tickets' => $tickets,         // Always loaded (essential for table)
    'filters' => [...],            // Always loaded (essential for filters)
    'clients' => $clients,         // Always loaded (small list)
    'stats'           => Inertia::lazy(fn() => $this->computeStats()),
    'userPermissions' => Inertia::lazy(fn() => Auth::user()?->getAllPermissions()->pluck('slug')->toArray() ?? []),
]);
```

Frontend adjustment in `Index.tsx`:

```tsx
// Trigger partial reload on mount to fetch deferred lazy props
useEffect(() => {
    router.reload({ only: ['stats', 'userPermissions'] });
}, []);

// Show skeleton for stats cards while they load
```

Stats cards show a skeleton loader for ~300ms then populate — acceptable UX tradeoff for faster initial page load.

---

### Phase 3 — Frontend Cleanup

**[MODIFY] `admin/tickets/Index.tsx` line 355**

Remove production debug log:
```tsx
// Remove this line:
console.log('Filtered Tickets:', filteredTickets);
```

---

### Phase 4 — Database Indexes

**[NEW] Migration file**

Add composite indexes for the most frequently queried columns:

```php
Schema::table('tickets', function (Blueprint $table) {
    $table->index('status');
    $table->index('client_id');
    $table->index(['status', 'created_at']);
    $table->index('deleted_at');
});

Schema::table('tasks', function (Blueprint $table) {
    $table->index(['ticket_id', 'state']);
});

Schema::table('user_permissions', function (Blueprint $table) {
    $table->index('user_id');
});
```

---

## File Change Summary

| File | Change | Impact |
|---|---|---|
| [AdminTicketController.php](file:///D:/office/VASP_CRM_V2/app/Http/Controllers/AdminTicketController.php) | Remove tasks eager-load in `index()` + `show()`, merge stats query, lazy props | 🔴 High |
| [User.php](file:///D:/office/VASP_CRM_V2/app/Models/User.php) | Memoize `getAllPermissions()` with `once()` | 🔴 High |
| [admin/tickets/Index.tsx](file:///D:/office/VASP_CRM_V2/resources/js/pages/admin/tickets/Index.tsx) | Partial reload for lazy props, remove console.log | 🟡 Medium |
| [admin/tickets/Show.tsx](file:///D:/office/VASP_CRM_V2/resources/js/pages/admin/tickets/Show.tsx) | Confirm tasks not used from server props | 🟡 Medium |
| New migration file | Add DB indexes | 🟡 Medium |

---

## Open Questions

> [!IMPORTANT]
> **Q1 — Show.tsx tasks source**: Does `Show.tsx` use `ticket.tasks` from the Inertia page props, or exclusively from the `getTicketData` axios endpoint? We need to verify before removing tasks from `show()`.

> [!IMPORTANT]
> **Q2 — DB size**: Approximately how many tickets and tasks are in the production database? This determines whether indexes will give a significant speed boost.

> [!NOTE]
> **Q3 — Stats delay acceptable?**: With `Inertia::lazy()` for stats, the stat cards will show a loading skeleton for ~300ms on direct navigation. Is this acceptable UX?

> [!NOTE]
> **Q4 — console.log**: The `console.log('Filtered Tickets:', ...)` in Index.tsx (line 355) appears to be debug code. Should we remove it?

---

## Verification Plan

### Automated
```bash
php artisan migrate
php artisan config:cache && php artisan route:cache
```

### Manual
1. Navigate directly to `/admin/tickets` in a new browser tab (simulates Cloudflare 520 scenario)
2. Navigate directly to `/admin/tickets/{id}` in a new browser tab
3. Check Cloudflare dashboard — origin response time should drop from 3000ms+ to under 800ms
4. Verify table data, filters, pagination all work normally
5. Confirm stats cards populate (with lazy: ~300ms delay; without lazy: immediate)
