# Report List Redesign - Todo

## Overview
Redesign the report list page to show an overview with logical grouping, using divs instead of tables.

## Requirements Analysis

### Current Issues
- Uses table layout
- Repeats date/employee for each row
- Shows unnecessary report title

### New Design Goals
1. Show all reports at once (overview)
2. Use divs with proper alignment
3. Smart grouping:
   - If filtered by employee → don't repeat username
   - If filtered by single date → don't repeat date
4. Focus on important info: date, employee, description (note), tasks with remarks, time entries with calculations

## Sample Layout

```
┌─────────────────────────────────────────────────────────────┐
│ FILTERS (Date Range | Employee | Status)                   │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ STATS: Total Reports | Total Time | Unique Tasks | Employees│
└─────────────────────────────────────────────────────────────┘

// Grouped by Date (when not filtering by single date)
┌─────────────────────────────────────────────────────────────┐
│ 📅 Monday, April 7, 2025                                    │
├─────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 👤 John Doe                                    ⏱ 8h 30m  │ │
│ │ 📝 Worked on API integration and fixed bugs            │ │
│ │ ├─ Task: API Integration (2h 15m)                     │ │
│ │ │   Remarks: Completed user auth module                │ │
│ │ ├─ Task: Bug Fixing (4h 00m)                           │ │
│ │ │   Remarks: Fixed login timeout issue                  │ │
│ │ └─ Task: Code Review (2h 15m)                           │ │
│ │ 📎 2 attachments                                        │ │
│ │ [View] [Edit] [Delete]                                  │ │
│ └─────────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 👤 Jane Smith                                   ⏱ 6h 45m  │ │
│ │ 📝 Database optimization and documentation              │ │
│ │ └─ Task: DB Optimization (6h 45m)                       │ │
│ │     Remarks: Indexed slow queries                       │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘

// Grouped by Employee (when filtered by single employee)
┌─────────────────────────────────────────────────────────────┐
│ 👤 John Doe                                      📅 April 2025│
├─────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 📅 Apr 7, 2025    ⏱ 8h 30m    [View] [Edit] [Delete]   │ │
│ │ 📝 Worked on API integration and fixed bugs             │ │
│ │ ├─ Task: API Integration (2h 15m)                       │ │
│ │ │   Remarks: Completed user auth module                 │ │
│ │ └─ Task: Bug Fixing (4h 00m)                           │ │
│ └─────────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 📅 Apr 6, 2025    ⏱ 7h 00m    [View] [Edit] [Delete]   │ │
│ │ 📝 Sprint planning and development                     │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## Implementation Steps

1. [x] Create GroupedReportCard component - single report display
2. [x] Create ReportGroup component - groups reports by date or employee
3. [x] Modify Index.tsx:
   - [x] Add grouping logic based on active filters
   - [x] Replace table with div-based layout
   - [x] Update stats calculation for grouped view
   - [x] Show time entries inline with task remarks
4. [x] Add responsive styling
5. [x] Test filters and grouping logic

## Key Components to Create/Modify

- `resources/js/components/reports/ReportGroup.tsx` (new)
- `resources/js/components/reports/ReportCard.tsx` (new)
- `resources/js/pages/admin/reports/Index.tsx` (modify)
