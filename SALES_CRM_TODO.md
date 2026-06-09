# Sales CRM TODO

## Phase 3: Data Fetching, CRUD, And Calculations

- [x] Add backend data endpoints for admin sales leads.
  - Return paginated sales leads.
  - Include owner/sales employee, interested product/service, latest activity, and follow-up dates.
  - Support filters for search, employee, product, status, interest level, organization type, and date range.

- [x] Add backend data endpoints for `My Sales Leads`.
  - Return only leads owned by the logged-in sales user.
  - Prevent users from viewing or editing other users' leads.
  - Support personal filters for status, interest level, service, and follow-up date.

- [x] Implement lead creation.
  - Add Form Request validation.
  - Required fields: organization name, organization type, owner, interest level, and status.
  - Optional fields: contact person, phone, email, location, product, source, notes, and next follow-up.
  - Store `created_by_user_id` and `owner_user_id`.

- [x] Implement lead update.
  - Allow admins/managers to update any lead.
  - Allow sales users to update only their own leads.
  - Store `updated_by_user_id`.

- [x] Implement lead activity creation.
  - Add activity type: call, visit, meeting, WhatsApp, email, or note.
  - Store response text, activity date, outcome status, and next follow-up.
  - Update parent lead fields: latest response, last contacted date, next follow-up date, and optionally status.

- [x] Implement lead delete/archive behavior.
  - Use soft delete.
  - Allow admin/manager deletion.
  - Keep sales-user deletion disabled unless explicitly approved.

- [x] Add dashboard calculations.
  - Total leads.
  - Leads by employee.
  - Leads by status.
  - Leads by interest level.
  - Positive leads by service/product.
  - Overdue follow-ups.
  - Upcoming follow-ups.

- [x] Connect frontend pages to real data.
  - Replace placeholder metrics with backend data.
  - Enable search and filter controls.
  - Add loading states.
  - Add empty states.
  - Add pagination.

- [x] Add phase 3 tests.
  - Employee can create, list, and update own leads.
  - Employee cannot access other users' leads.
  - Admin can view all leads.
  - Activity creation updates the parent lead.
  - Dashboard counts are correct.

## Phase 4: Full Sales Workflow

- [x] Add create/edit lead UI.
  - Modal or full-page form.
  - Product/service dropdown.
  - Interest level selector: negative, unclear, positive.
  - Status selector.
  - Next follow-up date picker.

- [x] Add lead detail page.
  - Prospect details.
  - Contact person details.
  - Interested service.
  - Status and interest history.
  - Activity timeline.
  - Follow-up actions.

- [x] Add follow-up workflow.
  - Quick add call, meeting, WhatsApp, email, visit, or note.
  - Mark follow-up completed.
  - Set next follow-up.
  - Show overdue follow-ups clearly.

- [x] Add admin assignment workflow.
  - Assign or reassign lead owner.
  - Filter by sales employee.
  - Track employee workload.

- [x] Add role and permission integration.
  - Add sales lead permissions in the seeder.
  - Give the sales role default lead permissions.
  - Give admin/manager full access.
  - Keep sales employees scoped to own-lead access.

## Phase 5: Reports And Closed Deals

- [x] Add sales performance reports.
  - Leads generated per employee.
  - Positive leads per employee.
  - Follow-ups completed.
  - Won/lost count.
  - Product-wise interest.

- [x] Add export support.
  - CSV or Excel export for admin reports.
  - Respect active filters.

- [x] Mark closed deals as won.
  - Use the existing `won` lead status when a deal is closed.
  - Allow status updates from the lead edit drawer or activity outcome.
  - Keep sales leads separate from current clients.

- [x] Add notifications and reminders.
  - Notify sales users about overdue follow-ups.
  - Notify managers about high-interest leads.
  - Consider an optional daily summary.

- [x] Add final test coverage.
  - CRUD tests.
  - Authorization tests.
  - Report calculation tests.
  - Report won/lost counts.

## Future Phase: Lead Conversion

- [ ] Add lead-to-client conversion form.
  - Show a dedicated conversion form similar to the create form.
  - Let admins review and edit client details before creating a real `Client`.
  - Do not automatically create client portal users unless that workflow is explicitly added.
  - Keep this separate from closing a deal as `won`.
