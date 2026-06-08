# Frontend-Only Sales Leads Structure

## Summary

Add the visible frontend shell for a future sales leads CRM module, with sidebar navigation and placeholder pages. No backend routes, controllers, models, migrations, validation, API calls, or database changes will be implemented in this phase.

## Key Changes

- Add Sales Leads navigation in the app sidebar under a new or existing CRM/Organization group.
- Create placeholder Inertia React pages:
  - Admin sales leads page for all-lead tracking.
  - Employee/my sales leads page for personal lead work.
- Add reusable frontend structure for phase 2:
  - Sales lead type definitions.
  - Status and interest-level constants.
  - Empty state components.
  - Filter/header layout placeholders.
- Use interest levels:
  - `negative`
  - `unclear`
  - `positive`
- Keep sales lead organizations/contact people visually and conceptually separate from existing Clients.

## UI Behavior

- `/admin/sales-leads` placeholder should show:
  - page title: `Sales Leads`
  - admin-oriented filter controls disabled or visually empty
  - metric placeholders for total leads, positive leads, follow-ups, and employee activity
  - empty state explaining that lead tracking will be connected in phase 2
- `/my/sales-leads` placeholder should show:
  - page title: `My Sales Leads`
  - empty state for personal lead generation
  - disabled/placeholder create button
- Sidebar should show:
  - `Sales Leads` for admin/manager roles pointing to `/admin/sales-leads`
  - `My Sales Leads` for employees pointing to `/my/sales-leads`
- Since backend routes are not part of this phase, route wiring will be limited to frontend structure expectations and may require phase 2 Laravel routes before pages are reachable through Inertia.

## Files To Touch

- `resources/js/components/app-sidebar.tsx`
  - Add sales lead navigation items with appropriate icons and role visibility.
- `resources/js/pages/admin/sales-leads/Index.tsx`
  - Admin placeholder page.
- `resources/js/pages/my/sales-leads/Index.tsx`
  - Employee placeholder page.
- `resources/js/types/sales-leads.ts`
  - Shared frontend-only types/constants for statuses and interest levels.
- Optional shared component path if useful:
  - `resources/js/components/sales-leads/SalesLeadEmptyState.tsx`

## Test Plan

- Run frontend type check: `npm run types`.
- Run ESLint on touched frontend files.
- Verify no PHP/backend files were changed.
- Manually confirm the sidebar compiles and placeholder pages do not import backend-only route helpers.

## Assumptions

- Phase 1 intentionally allows placeholder links that require Laravel routes in phase 2.
- No API calls should be added yet.
- No existing `Client` UI or data types should be reused for sales prospects except general visual layout patterns.
