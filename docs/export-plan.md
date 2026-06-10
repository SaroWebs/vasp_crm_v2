# Consolidated Ticket and Task Export Plan

## Goal

Add an admin-only CSV export for tickets. The administrator selects a date range, one or more checked ticket statuses, optional filters, and the fields included in the ticket list.

The downloaded CSV contains:

1. Report criteria and overall totals.
2. Ticket counts grouped by selected status.
3. Ticket counts grouped by priority.
4. The filtered ticket list using only the selected fields.

## Backend

- Add `ExportTicketsRequest` for authorization and validation.
- Require the `ticket.export` permission.
- Validate an inclusive date range, `statuses[]`, `columns[]`, client, priority, and search.
- Query tickets created from the start of the first date through the end of the final date.
- Use `withCount()` for task, comment, and attachment totals.
- Stream the CSV instead of building the whole file in memory.
- Sanitize spreadsheet-formula prefixes in text values.

## Frontend

- Show the Export button only when `ticket.export` is present.
- Default the date range to the most recent seven days.
- Render statuses as checked boxes so multiple statuses, such as Open and Closed, can be exported together.
- Require at least one status and one detail field.
- Keep client and priority as optional filters.
- Download the streamed response using the filename supplied by the server.

## CSV Layout

- Report title
- Start date and end date
- Selected statuses
- Total tickets, unique clients, assigned tickets, and unassigned tickets
- Status summary
- Priority summary
- Ticket detail headers and rows

## Permissions

- Add `ticket.export`.
- Grant it to super administrators, administrators, and managers through the existing permission seeders.

## Tests

- Authorized export includes the summary and only selected statuses and fields.
- The final date is inclusive.
- Tickets outside the range or outside selected statuses are excluded.
- Requests without permission return `403`.
- Invalid or empty status and column selections fail validation.

## Consolidated Task Export

The task export uses the same redesigned export modal and CSV structure as tickets.

- Select an inclusive date range.
- Select one or more task states using the status pills.
- Optionally filter by priority and assigned user.
- Select the task fields included in the detail list.
- Include overall totals, assignment totals, estimated hours, state counts, and priority counts.
- Require the `task.export` permission.
- Stream the CSV with spreadsheet-formula sanitization.
