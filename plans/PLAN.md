# Client Re-Foundation: Organizations + Organization Users

## Summary
Replace the legacy client-as-auth-user concept with organizations and separate organization users. Remove client authentication and all client portal flows. Tickets are created by organization users and belong to organizations. This is a fresh migration set: delete old client/auth migrations and replace with clean ones; update the tickets migration to new foreign keys.

## Key Changes
1. **Data Model**
   1. Create `clients` as organizations (non-authenticatable model). Keep core org fields like `name`, `status`, contact fields if still needed.
   2. Add `organization_users` table and model with `client_id` FK and basic fields (name, email, designation, phone as needed).
   3. Drop `client_product_instances` entirely and remove all references.
   4. Update tickets schema:
      1. Replace `client_id` to reference `clients` as organization.
      2. Add `organization_user_id` as ticket owner/submitter.
      3. Remove `client_product_instance_id`.

2. **Auth and Middleware Cleanup**
   1. Remove client guard, provider, and password broker from `config/auth.php`.
   2. Delete client auth middleware and client API middleware.
   3. Remove client login/session logic from all middleware and request handling.

3. **Routes and Controllers**
   1. Remove all client auth routes and client portal routes.
   2. Remove client API routes and `client_code` flow.
   3. Remove controllers that serve the client portal and client auth.
   4. Update ticket controllers and queries to use `organization_user_id` and `client_id`.

4. **Comments and Attachments**
   1. Keep polymorphic attribution:
      1. `commented_by_type` becomes `user` or `organization_user`.
      2. Update model relations accordingly.
   2. Update any validation and serialization for comment/attachment ownership.

5. **Admin CRUD**
   1. Keep existing admin CRUD for organizations (currently `clients`).
   2. Plan to rename labels to “Organization” later when UI work is approved; no UI changes now.

6. **Migrations Strategy**
   1. Delete legacy client/auth and client-product-instance migrations.
   2. Add clean migrations:
      1. `create_clients_table` (orgs)
      2. `create_organization_users_table`
      3. Update `create_tickets_table` with new FKs and removed columns
   3. Update seeders accordingly (remove client auth data; seed organizations and org users if required).

## Test Plan
1. `php artisan migrate:fresh` should succeed with new schema.
2. Create an organization and organization user via admin or seeder; confirm FK integrity.
3. Create a ticket with `client_id` and `organization_user_id`; verify retrieval in admin views.
4. Create comments as internal users and organization users; verify polymorphic attribution.

## Assumptions
1. No client portal or client login is required for now.
2. Admin CRUD remains the only interface for organizations until future UI updates.
3. Ticket creation by organization users is done via admin or future API, not via public auth.
4. No need to preserve existing production data; migrations can be replaced cleanly.
