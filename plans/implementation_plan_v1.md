# Refactor Ticket Assignment Dialog

This plan outlines the steps to make the `TicketAssignmentDialog` component reusable across the application, fetching its own data and setting smart default values for task assignment times.

## Background Context
Currently, `ticket-assignment-dialog.tsx` is partially implemented and `Show.tsx` has its own inline `UserAssignmentForm`. The goal is to fully implement `TicketAssignmentDialog` so it handles all assignment logic internally, taking only a `ticketId`, while fetching the ticket details and user list on demand. We also want to streamline the assignment form by calculating default values for start time, end time, and duration to reduce manual entry.

## Proposed Changes

### Component: `ticket-assignment-dialog.tsx`
- **Data Fetching:** 
  - Update `loadTicketData` to fetch ticket details.
  - Implement `loadEmployees` inside `TicketForm` (or `TicketAssignmentDialog` itself) using `/admin/data/users/assignment`.
- **Form State & Logic:**
  - Bring in the form structure from `UserAssignmentForm` (currently in `Show.tsx`), adapting it to be fully self-contained.
  - Update the submission logic to hit the `/admin/ticket/{ticket.id}/assign` endpoint directly, then close the modal and either trigger a callback or reload the page/invalidate Inertia data.
- **Smart Date Defaults:**
  - `Start At`: Default to current date & time.
  - `Due At`: Default to today at 18:00 if the current time is before 18:00. If the current time is after 18:00, default to the next day at 18:00.
  - `Estimated Duration`: Automatically calculate the duration in hours between `Start At` and `Due At` when the component mounts or when defaults are set.
- **UI Adjustments:**
  - Ensure the form retains all essential fields: User Select, Task Title, Task Description, Start At, Due At, Estimated Duration, and Assignment Notes.
  - Keep the ability for the user to manually override these defaults.

### Component: `Show.tsx`
- **Refactoring:**
  - Replace the inline `UserAssignmentForm` and its related modal state with the new `TicketAssignmentDialog`.
  - Pass the `ticketId` to `TicketAssignmentDialog`.
  - We can keep `TicketAssignmentDialog`'s structure to accept a type (e.g., 'button', 'link', 'custom') to fit seamlessly into `Show.tsx`'s dropdown menu or other triggers.

## User Review Required
> [!IMPORTANT]
> The new default behavior for `Due At` will be 18:00 today (if before 18:00) or 18:00 tomorrow (if after 18:00). Will this logic fit your business hours correctly?
>yes but we need to use the holiday logics also to skip the holidays, and while calculating the duration- use working hours logic.
i have services/methods accordingly. 
load required information while getting the ticket details. 

## Verification Plan
1. **Manual Verification**: 
   - Open the assignment dialog from the ticket details page.
   - Verify that the Start At is set to now, Due At is set to 18:00, and Duration is pre-calculated correctly.
   - Assign a user to the ticket and submit the form.
   - Verify the success toast, the form closes, and the ticket is updated correctly.
   - Use the dialog in a different context (e.g., Ticket Index page) to confirm it is fully decoupled.
