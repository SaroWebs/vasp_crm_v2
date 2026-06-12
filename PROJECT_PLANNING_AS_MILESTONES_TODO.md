# Project Planning As Milestones Todo

## Goal

- Remove the separate project milestone workflow from Project Management.
- Treat each planning phase as the project's milestone.
- Keep phase dates, progress, status, ordering, tasks, and timeline as the single source of truth.
- Avoid maintaining the same project checkpoint in both Planning and Milestones.

## Scope Decision

- This change applies to project-level milestones stored in `project_milestones`.
- Keep task-level milestones in `timeline_events` and `TaskMilestones` unchanged unless they are separately approved for removal.
- Use the existing `ProjectPhase` model as the planning milestone model instead of introducing another table.
- Keep the user-facing name `Planning`, but describe each phase as a project milestone where helpful.

## 1. Audit Project Milestone Usage

- Find every backend, frontend, permission, report, dashboard, export, notification, and API reference to:
  - `ProjectMilestone`.
  - `project_milestones`.
  - `project.manage_milestones`.
  - `ProjectMilestonesTab`.
  - `milestones_count`.
  - Project milestone overdue and upcoming endpoints.
- Separate project milestone references from task timeline milestone references.
- Confirm whether external clients use the project milestone endpoints before removing them.
- Confirm whether historical `project_milestones` data exists in production and must be migrated.

## 2. Define Planning Milestone Rules

- Treat one `ProjectPhase` record as one project planning milestone.
- Use `start_date` and `end_date` as the milestone schedule.
- Use `status` for milestone state:
  - `pending`.
  - `active`.
  - `completed`.
  - `on_hold`.
- Use `progress` for milestone completion percentage.
- Use `sort_order` for milestone sequence.
- Use the phase-task relationship to calculate or display milestone progress.
- Decide whether a milestone requires:
  - A name.
  - A start date.
  - An end date.
  - At least one task.
- Decide whether progress is always task-derived or may be manually overridden.
- Decide whether only one planning milestone may be active at a time.

## 3. Existing Data Migration

- Create a migration strategy for existing `project_milestones` records.
- Map each project milestone to a `project_phases` record:
  - `name` to `name`.
  - `description` to `description`.
  - Previous milestone sequence to `sort_order`.
  - `target_date` to `end_date`.
  - `status` to the closest phase status.
  - `progress` to `progress`.
  - Milestone type and other metadata to `settings` if they must be retained.
- Decide how to derive `start_date` when the old milestone only has a target date.
- Prevent duplicate phases when an equivalent planning phase already exists.
- Preserve an audit mapping between old milestone IDs and new phase IDs during migration.
- Back up or archive milestone data before dropping the table.
- Make the migration safe for projects with no milestones and projects with no phases.

## 4. Planning Backend

- Update `ProjectPhaseController` so planning phases fully support the milestone workflow.
- Move inline validation into Form Request classes:
  - `StoreProjectPhaseRequest`.
  - `UpdateProjectPhaseRequest`.
  - `ReorderProjectPhasesRequest`.
- Add custom validation messages.
- Validate phase dates against the project start and end dates where applicable.
- Add an explicit complete action or ensure status updates consistently set:
  - `status = completed`.
  - `progress = 100`.
- Decide whether reopening a completed phase should reduce progress or leave it unchanged.
- Add upcoming and overdue planning queries based on `end_date`.
- Ensure reorder requests can update only phases belonging to the current project.
- Keep phase deletion blocked while tasks are assigned, with a clear response message.

## 5. Project Model And Statistics

- Remove the `Project::milestones()` relationship after data migration and compatibility work are complete.
- Replace milestone helpers with phase-based helpers:
  - `getOverduePlanningMilestones()`.
  - `getUpcomingPlanningMilestones()`.
  - Completed planning milestone count.
- Update project statistics:
  - Replace `total_milestones` with total planning phases.
  - Replace `completed_milestones` with completed phases.
  - Replace `overdue_milestones` with overdue phases.
- Decide whether project progress remains task-based or becomes a weighted rollup of planning phases.
- Eager load phases and phase task counts without introducing N+1 queries.

## 6. Routes And Controllers

- Remove project milestone routes from `routes/web.php` after consumers are migrated:
  - Index.
  - Store.
  - Show.
  - Update.
  - Delete.
  - Complete.
  - Reorder.
  - Overdue.
  - Upcoming.
- Remove `ProjectMilestoneController` after the replacement endpoints are tested.
- Keep project phase routes as the planning milestone API.
- Add named routes for any new complete, overdue, or upcoming phase actions.
- Regenerate Wayfinder route and controller action files after route changes.
- Do not remove task timeline milestone routes handled by `TimelineEventController`.

## 7. Permissions

- Retire `project.manage_milestones`.
- Use `project.manage_phases` as the permission for managing planning milestones.
- Update:
  - `PermissionSeeder`.
  - `GeneratePermissions`.
  - Role or team permission mappings.
  - Any permission-management UI.
- Migrate users and roles that have `project.manage_milestones` so they receive `project.manage_phases` when appropriate.
- Confirm read-only users can view planning milestones but cannot modify them.

## 8. Project Show Page

- Remove the separate `Milestones` tab.
- Remove `ProjectMilestonesTab` and its state, refresh request, imports, and props.
- Keep `Planning` as the single place to manage project milestones.
- Update Planning copy:
  - Rename `Create Phase` to `Create Planning Milestone` if approved.
  - Explain that each phase represents a milestone in the project plan.
  - Rename `Phases` to `Planning Milestones` where clarity is needed.
- Add a clear complete action to each planning milestone.
- Show overdue state when `end_date` has passed and status is not completed.
- Keep drag ordering and timeline date editing.
- Ensure mobile layouts remain usable with the additional status and progress actions.

## 9. Project Overview And Index

- Replace the overview `Milestones` count with `Planning Milestones` or `Planning Phases`.
- Source the count from phases, not `project_milestones`.
- Update the project index table to replace `milestones_count` with `phases_count`.
- Update `ProjectController@index` to use `withCount(['tasks', 'phases'])`.
- Remove milestone-specific icons, labels, and empty states that imply a separate workflow.
- Add completed and overdue planning counts if useful to project managers.

## 10. Tasks And Timeline Integration

- Keep tasks assigned through `phase_id`.
- Ensure the task create and edit flows label phase selection consistently with planning milestones.
- Recalculate planning milestone progress when:
  - A task is created in a phase.
  - A task moves between phases.
  - A task state or progress changes.
  - A task is deleted.
- Ensure the Gantt and project timeline use phase dates as milestone boundaries.
- Decide whether project timeline events should display phase completion events automatically.
- Do not mix task-level timeline milestones with project planning milestone counts.

## 11. Frontend Types And Components

- Remove `ProjectMilestone` from `resources/js/components/projects/types.ts`.
- Remove `milestones` from `ProjectShowData`.
- Extend `ProjectPhase` if needed with:
  - `is_overdue`.
  - `completed_at`.
  - `tasks_count`.
  - Derived progress fields.
- Remove `ProjectMilestonesTab.tsx` after its useful UI behavior has been merged into `ProjectPlanningTab.tsx`.
- Replace direct Axios URL strings with Wayfinder route actions where practical.
- Update all project labels and TypeScript references from separate milestones to planning milestones.

## 12. Database Cleanup

- Drop `project_milestones` only after successful data migration and deployment verification.
- Remove the `ProjectMilestone` model.
- Remove obsolete factories, seeders, policies, resources, and observers if present.
- Remove obsolete project milestone permissions.
- Keep rollback support capable of restoring archived milestone data where feasible.
- Do not remove milestone columns from task `timeline_events`; they belong to a separate workflow.

## 13. Compatibility And Deployment

- Use a staged rollout if existing API clients may use project milestone endpoints:
  - Deploy phase-based replacements.
  - Migrate data.
  - Update frontend and clients.
  - Log deprecated endpoint usage.
  - Remove old endpoints in a later deployment.
- Consider temporary read-only compatibility responses that transform phases into the old milestone shape.
- Avoid dual writes unless a short compatibility window requires them.
- Document the final cutoff deployment for the old project milestone API.

## 14. Tests

- Add feature tests for planning milestone CRUD.
- Test permissions for viewing and managing planning milestones.
- Test a phase cannot be updated or reordered through another project.
- Test date validation against project dates.
- Test phase completion sets the expected status and progress.
- Test overdue and upcoming planning milestone queries.
- Test phase deletion fails when tasks are attached.
- Test task changes recalculate phase progress.
- Test project statistics use phases instead of project milestones.
- Test the project index returns `phases_count`.
- Test existing milestone data migrates without duplicates or data loss.
- Test project milestone routes are unavailable after removal.
- Keep existing task timeline milestone tests passing.
- Add frontend tests for Planning tab labels, empty states, complete action, ordering, and overdue display.

## 15. Verification

- Run focused project tests:
  - `php artisan test --compact --filter=Project`.
- Run the specific migration and planning milestone test files.
- Run frontend tests for edited project components.
- Run ESLint on edited TSX and TypeScript files.
- Run Pint after PHP changes:
  - `.\vendor\bin\pint.bat --dirty --format agent`.
- Run the frontend build to catch generated route and type errors.
- Manually verify:
  - Project creation.
  - Planning milestone creation and ordering.
  - Task assignment to a planning milestone.
  - Progress recalculation.
  - Completion and overdue behavior.
  - Project overview and index counts.
  - Read-only permission behavior.

## 16. Post-Change Graph

- If `graphify` is available and `graphify-out` is restored, run:
  - `graphify update .`.
- The current workspace does not contain `graphify-out/GRAPH_REPORT.md`, so graph updates cannot be verified yet.
