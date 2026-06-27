# Walkthrough — Performance Optimization for Heavy Pages

We have implemented key optimizations at the controller, database, and rendering levels to fix the Cloudflare 520 / Response Timeouts on heavy pages.

## Changes Made

### 1. Database Indexing
Created a migration to add composite and single indexes on hot columns for tickets and tasks, which will significantly speed up queries as the data size grows:
* **Table:** `tickets`
  * Index on `status` (for quick filtering)
  * Index on `client_id` (for client scoping)
  * Index on `deleted_at` (for soft-deleted scoping)
* **Table:** `tasks`
  * Index on `['ticket_id', 'state']` (to speed up ticket work status lookup)
* **Table:** `user_permissions`
  * Index on `user_id` (for authorization check lookups)

📄 **New Migration File:** [`2026_06_27_103000_add_indexes_to_optimization_tables.php`](file:///D:/office/VASP_CRM_V2/database/migrations/2026_06_27_103000_add_indexes_to_optimization_tables.php)

---

### 2. Backend Optimizations
* **Eager-Load Optimization:** 
  In [`AdminTicketController.php`](file:///D:/office/VASP_CRM_V2/app/Http/Controllers/AdminTicketController.php), we restricted eager-loaded relations to fetch only required columns (e.g. `client:id,name`, `tasks:id,ticket_id,title,state,task_code`, `tasks.assignedUsers:id,name`), avoiding loading heavy texts/blobs in PHP memory.
* **Unused Relation Removal:**
  Removed `latestClosedHistory` from the ticket index query as it was unused on the frontend.
* **Merged Stat Queries:**
  Combined 3 separate `COUNT` queries for ticket metrics into a single aggregated raw SQL query.
* **Permission Memoization:**
  Wrapped `getAllPermissions()` in [`User.php`](file:///D:/office/VASP_CRM_V2/app/Models/User.php) using Laravel's `once()` helper. This caches the permissions list for the duration of the HTTP request, preventing duplicate database hits on every middleware/permission check.
* **Inertia Lazy Props:**
  Applied `Inertia::lazy()` to `stats` and `userPermissions` in `AdminTicketController::index()`. These props are no longer loaded during direct navigation, preventing page load delays.

---

### 3. Frontend Optimizations
* **Lazy Loading with Skeleton Loader:**
  In [`Index.tsx`](file:///D:/office/VASP_CRM_V2/resources/js/pages/admin/tickets/Index.tsx), the page will trigger an on-mount partial reload to fetch `stats` and `userPermissions` dynamically. In the meantime, the stats section renders 4 skeleton loaders matching the WizCards layout.
* **Cleaned Up debug logs:**
  Removed unnecessary `console.log` statements in `Index.tsx` and `Show.tsx`.

---

## Action Required

Run the new database migration on your local/staging/production server to apply the database indexes:
```bash
php artisan migrate
```
