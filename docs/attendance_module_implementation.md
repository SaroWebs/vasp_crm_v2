# Attendance Visual Module — Implementation Guide

> Based on analysis of `Attn_sample.xlsx` (multi-sheet attendance tracker for 9 employees, May 2026)

---

## 📋 Excel File Structure Analysis

### Sheets Overview

| Sheet | Purpose |
|---|---|
| Per-employee sheets (e.g. `Sarowar`, `Anurag`, `Tolan`, …) | Daily punch-in/punch-out log with calculated metrics |
| `May` (Summary sheet) | Consolidated monthly summary for all team members |

### Per-Employee Sheet — Columns (A–O)

| Col | Field | Description |
|---|---|---|
| A | `SL` | Serial / row number |
| B | `Name` | Employee name |
| C | `Date` | Calendar date |
| D | `Day` | Day of week (Monday–Sunday) |
| E | `EntryDate` | Duplicate of Date (used for formula reference) |
| F | `Intime` | Scheduled in-time (e.g. 09:00) |
| G | `Entry` | Actual punch-in time (or `NULL` / status string) |
| H | `Exittime` | Scheduled exit-time (e.g. 18:00, 14:00 on Saturdays) |
| I | `Out` | Actual punch-out time (or `NULL` / status string) |
| J | `DailyWorkingHours` | Scheduled working hours for the day (9 or 5) |
| K | `ActualWorkHours` | Actual hours worked (decimal, e.g. `8.45`) |
| L | `WeekNo` | ISO/internal week number |
| M | `Delay in entry` | Entry delay = Actual Entry − Scheduled Intime |
| N | `Delay In Exit` | Exit delay = Actual Out − Scheduled Exittime |
| O | `Actual work hours` | Net actual work = `M − N` (scheduled vs. actual delta) |

### Per-Employee Sheet — Summary Block (rows 32–47)

| Row | Content |
|---|---|
| Total | Sum of all Delay In Entry (`M`) and Delay In Exit (`N`) |
| Total Late | Total Entry − Total Exit delay net |
| Total Working Hours | Computed actual hours (e.g. `127.32`) |
| Weekly breakdown | Week numbers vs. scheduled/actual hours (weeks 17–21) |
| Monthly breakdown | March / April / Total columns with scheduled + actual hours |
| Working days | Total days, Present, Leave counts |
| Legend | Half day, Leave, WFH, Holiday, Sunday, Sick/Casual Leave, Office Work |
| Notes | Free-text notes (e.g. pending leave balance) |

### Day Status Values (in `Entry` / `Out` / status columns)

| Value | Meaning |
|---|---|
| `HH:MM:SS` | Normal punch-in/punch-out |
| `NULL` | Absent / day off / not recorded |
| `WFH` | Work From Home |
| `Leave` | Planned leave |
| `Sick leave/casual` | Sick or casual leave |
| `Office work` | Away on official work / field duty |
| `Half day` | Half-day attendance |
| `Holiday` | Public holiday |
| `Sunday` | Weekly off |

### Monthly Summary Sheet (`May`) — Columns

| Column | Field |
|---|---|
| Name | Employee name |
| Total Working hours | Sum of all actual hours worked |
| Total late coming | Aggregated lateness (text, e.g. "19hrs/40mins") |
| Total Working days | Days in the period (e.g. 30) |
| Present | Days actually present |
| Absent | Days absent |
| Reimbursements (TA+Miscellaneous) | Travel allowance + expense notes or `NA` |

---

## 🏗️ Implementation Steps

---

### Step 0 — Operational Month (`op_month`) — Foundation

> **This is the core concept that governs ALL date ranges, filters, and calculations throughout the module. Implement this before anything else.**

#### 0a. What is `op_month`?

An **Operational Month** is a **derived** date window computed from a table of **cycle rules** configured by the admin. The admin does **not** create op_months manually — instead, they define rules that say _"starting from this date, each new cycle begins on day X of every month"_. The system automatically derives all past and current op_months from these rules.

**Example rule set:**

| id | month_starts_on | effective_from | effective_to | notes |
|---|---|---|---|---|
| 1 | 21 | 15-03-2026 | null | Current active rule — cycles start on the 21st |
| 2 | 1 | 01-01-2026 | 14-03-2026 | Old rule — cycles started on the 1st |

**How cycles are derived from rule id=1** (`month_starts_on: 21`, `effective_from: 15-03-2026`):

| Op Month Label | Start | End | Notes |
|---|---|---|---|
| Mar–Apr 2026 | **15-03-2026** | 20-04-2026 | First cycle — starts on effective_from, not on the 21st |
| Apr–May 2026 | 21-04-2026 | 20-05-2026 | Regular cycle |
| May–Jun 2026 | 21-05-2026 | 20-06-2026 | Regular cycle |
| … | … | … | … |

> When calculating attendance on **25-05-2026**: the resolved **past (completed) op_month** is `21-04-2026 → 20-05-2026`, and the **current (in-progress) op_month** is `21-05-2026 → 20-06-2026`.

---

#### 0b. Cycle Rule — Data Model

```ts
// Admin-configured rule — one row per cycle change
interface MonthCycleRule {
  id: number;
  month_starts_on: number;       // Day of month (1–31) when each new cycle begins
  effective_from: Date;          // Date from which this rule is in effect (inclusive)
  effective_to: Date | null;     // Date until which this rule is in effect (inclusive). null = still active
  include_gap_in_current: boolean; // If true, absorb gap days (between rules) into the first cycle of this rule
  created_by: string;
  created_at: Date;
}

// A computed/derived operational month (never stored — always derived on-the-fly)
interface OperationalMonth {
  label: string;           // e.g. "Apr–May 2026"
  startDate: Date;         // inclusive
  endDate: Date;           // inclusive
  ruleId: number;          // which MonthCycleRule generated this cycle
  isFirstCycle: boolean;   // true if this is the very first cycle under its rule
  hasGapPrefix: boolean;   // true if gap days were absorbed into this cycle
  gapStartDate?: Date;     // first day of the absorbed gap (if hasGapPrefix)
}
```

**DB table** (only the rules table is stored; op_months are computed):

```sql
CREATE TABLE month_cycle_rules (
  id                     SERIAL PRIMARY KEY,
  month_starts_on        INTEGER NOT NULL CHECK (month_starts_on BETWEEN 1 AND 31),
  effective_from         DATE NOT NULL,
  effective_to           DATE,                     -- nullable = still active
  include_gap_in_current BOOLEAN NOT NULL DEFAULT TRUE,
  created_by             UUID REFERENCES users(id),
  created_at             TIMESTAMPTZ DEFAULT NOW(),

  -- No two rules may overlap in time
  CONSTRAINT no_overlap EXCLUDE USING gist (
    daterange(effective_from, effective_to, '[]') WITH &&
  )
);
```

> **No op_month table is stored.** Every op_month boundary is **computed** from the rules at query time.

---

#### 0c. Core Algorithm — Deriving Op Month Boundaries

```ts
/**
 * Given any calendar date, return the op_month it falls in.
 * Uses the ordered list of MonthCycleRules to determine boundaries.
 */
function resolveOpMonth(
  targetDate: Date,
  rules: MonthCycleRule[]   // sorted ascending by effective_from
): OperationalMonth {

  // 1. Find which rule covers targetDate
  const rule = rules.find(r =>
    targetDate >= r.effective_from &&
    (r.effective_to === null || targetDate <= r.effective_to)
  );

  // 2. Handle gap — targetDate falls in a gap between two rules
  if (!rule) {
    // Find the next rule that starts after targetDate
    const nextRule = rules.find(r => r.effective_from > targetDate);
    if (!nextRule) throw new Error(`No rule covers date: ${targetDate}`);

    // Gap days belong to nextRule's first cycle (if include_gap_in_current)
    if (nextRule.include_gap_in_current) {
      return deriveFirstCycle(nextRule, rules, absorbGap = true);
    }
    // Otherwise gap is untracked (throw or return a special "uncovered" period)
    throw new Error(`Date ${targetDate} falls in an uncovered gap`);
  }

  // 3. Find the previous rule to detect a gap at the start of this rule
  const ruleIndex = rules.indexOf(rule);
  const prevRule = ruleIndex > 0 ? rules[ruleIndex - 1] : null;
  const gapExists = prevRule !== null &&
    prevRule.effective_to !== null &&
    addDays(prevRule.effective_to, 1) < rule.effective_from;

  // 4. Compute cycle boundaries using month_starts_on
  //    The cycle that contains targetDate starts on the most recent
  //    occurrence of month_starts_on on-or-before targetDate,
  //    but never before rule.effective_from.
  const cycleStart = findCycleStart(targetDate, rule, rules, gapExists);
  const cycleEnd   = findCycleEnd(cycleStart, rule, rules);

  return {
    label: formatOpMonthLabel(cycleStart, cycleEnd),
    startDate: cycleStart,
    endDate: cycleEnd,
    ruleId: rule.id,
    isFirstCycle: isSameDay(cycleStart, rule.effective_from) || (gapExists && rule.include_gap_in_current),
    hasGapPrefix: gapExists && rule.include_gap_in_current,
    gapStartDate: (gapExists && rule.include_gap_in_current && prevRule)
      ? addDays(prevRule.effective_to!, 1)
      : undefined,
  };
}

/**
 * Find the start of the cycle that contains `targetDate` under `rule`.
 *
 * Logic:
 *   - A regular cycle starts on `month_starts_on` of some month.
 *   - Walk backwards from targetDate to find the most recent cycle start.
 *   - Never go before max(rule.effective_from, gapStart).
 */
function findCycleStart(
  targetDate: Date,
  rule: MonthCycleRule,
  allRules: MonthCycleRule[],
  gapExists: boolean
): Date {
  const d = rule.month_starts_on;
  const prevRule = getPrevRule(rule, allRules);
  
  // The earliest possible start for any cycle under this rule
  const earliestStart = (gapExists && rule.include_gap_in_current && prevRule?.effective_to)
    ? addDays(prevRule.effective_to, 1)   // absorb gap: cycle starts from gap start
    : rule.effective_from;               // no gap: cycle starts from effective_from

  // Find the candidate cycle-start = day `d` of the same month as targetDate
  let candidate = setDayOfMonth(targetDate, d);  // clamp to month-end if d > month days

  // If candidate is after targetDate, go back one month
  if (candidate > targetDate) {
    candidate = setDayOfMonth(subMonths(targetDate, 1), d);
  }

  // If candidate is before the rule's earliest start, the cycle started at earliestStart
  if (candidate < earliestStart) {
    return earliestStart;
  }

  return candidate;
}

/**
 * Find the end of the cycle that starts at `cycleStart` under `rule`.
 * Cycle ends the day before the next cycle starts, or at rule.effective_to.
 */
function findCycleEnd(
  cycleStart: Date,
  rule: MonthCycleRule,
  allRules: MonthCycleRule[]
): Date {
  const d = rule.month_starts_on;

  // Next cycle would start one month after the regular cycle-start anchor
  // (not necessarily one month after cycleStart, to avoid drift)
  const anchor = findNearestCycleAnchor(cycleStart, d);
  let nextCycleStart = setDayOfMonth(addMonths(anchor, 1), d);

  // Cap at rule.effective_to if this rule ends before next cycle
  if (rule.effective_to && nextCycleStart > addDays(rule.effective_to, 1)) {
    return rule.effective_to;
  }

  // Check if the next rule starts before next cycle and absorbs the gap
  const nextRule = getNextRule(rule, allRules);
  if (nextRule && nextCycleStart > nextRule.effective_from) {
    return subDays(nextRule.effective_from, 1);
  }

  return subDays(nextCycleStart, 1);  // cycle end = day before next cycle start
}

/**
 * Handle month_starts_on > days-in-month edge case.
 * e.g. month_starts_on=31 in February → use last day of Feb (28 or 29).
 */
function setDayOfMonth(date: Date, day: number): Date {
  const year  = date.getFullYear();
  const month = date.getMonth();
  const maxDay = new Date(year, month + 1, 0).getDate(); // last day of month
  return new Date(year, month, Math.min(day, maxDay));
}
```

---

#### 0d. Worked Example — Full Timeline

**Rules:**
```
Rule A: id=2, month_starts_on=1,  effective_from=01-01-2026, effective_to=14-03-2026
Rule B: id=1, month_starts_on=21, effective_from=15-03-2026, effective_to=null
```

**Gap analysis:**  
Rule A ends `14-03-2026`. Rule B starts `15-03-2026`. **No gap** (consecutive days).

**Derived op_months (Rule A — starts on 1st):**

| Op Month | Start | End | Notes |
|---|---|---|---|
| Jan 2026 | 01-01-2026 | 31-01-2026 | Regular |
| Feb 2026 | 01-02-2026 | 28-02-2026 | Regular |
| Mar 2026 partial | 01-03-2026 | **14-03-2026** | Truncated at rule A's effective_to |

**Derived op_months (Rule B — starts on 21st):**

| Op Month | Start | End | Notes |
|---|---|---|---|
| Mar–Apr 2026 | **15-03-2026** | 20-04-2026 | First cycle: starts at effective_from (15th), not 21st |
| Apr–May 2026 | 21-04-2026 | 20-05-2026 | Regular |
| May–Jun 2026 | 21-05-2026 | 20-06-2026 | Regular (in-progress on 25-05-2026) |

---

**Gap example (with `include_gap_in_current = true`):**

```
Rule X: month_starts_on=20, effective_from=01-01-2026, effective_to=10-03-2026
Rule Y: month_starts_on=15, effective_from=16-03-2026, effective_to=null
                                               ↑
                        Gap: 11-03-2026 → 15-03-2026 (5 days)
```

Because Rule Y has `include_gap_in_current = true`:

| Op Month | Start | End | Notes |
|---|---|---|---|
| Feb–Mar 2026 | 20-02-2026 | **10-03-2026** | Last cycle under Rule X (truncated) |
| **Gap absorbed** | **11-03-2026** | 14-04-2026 | Rule Y's first cycle starts from gap start (11th), not from 16th |
| Apr–May 2026 | 15-04-2026 | 14-05-2026 | Regular cycle under Rule Y |

If `include_gap_in_current = false`, days 11–15 Mar are untracked and the first Rule Y cycle starts 15-04-2026.

---

#### 0e. Admin Configuration Panel (Cycle Rule Manager)

```
┌──────────────────────────────────────────────────────────────────┐
│  ⚙️  Operational Month — Cycle Rules                              │
├──────────────────────────────────────────────────────────────────┤
│  Active Rule:  Cycles start on the 21st  (since 15-Mar-2026)    │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  + Add New Cycle Rule                                      │  │
│  │                                                            │  │
│  │  Month Starts On:  [ 21  ▲▼ ]  (day of month, 1–31)       │  │
│  │  Effective From:   [ 2026-05-21  📅 ]                      │  │
│  │  Effective To:     [ leave blank if ongoing  📅 ]          │  │
│  │  Include gap days in first cycle:  [✓]                     │  │
│  │                                                            │  │
│  │  Preview →  Cycles: May 21–Jun 20, Jun 21–Jul 20, …        │  │
│  │  ⚠️ This will close current rule at 2026-05-20.             │  │
│  │                                                            │  │
│  │                          [ Save Rule ]                     │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                  │
│  Rule History                                                    │
│  ┌──────┬────────────────┬──────────────┬────────────────────┐  │
│  │ Rule │ Starts On Day  │ Effective    │ Status             │  │
│  ├──────┼────────────────┼──────────────┼────────────────────┤  │
│  │  2   │ 1st of month   │ Jan–Mar 2026 │ Closed 14-Mar-2026 │  │
│  │  1   │ 21st of month  │ 15-Mar-2026→ │ ✅ Active          │  │
│  └──────┴────────────────┴──────────────┴────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
```

**Validation on save:**
- `month_starts_on` must be 1–31.
- `effective_from` must not overlap with any existing rule's active period.
- If there's a gap between the current rule's `effective_to` and new rule's `effective_from`, warn the admin and show the gap days count. Let them toggle `include_gap_in_current`.
- Auto-set `effective_to` of the **previous active rule** to `new.effective_from - 1 day` if it was null.
- Show a **live preview** of the first 3 derived op_months from the new rule.

---

#### 0f. Op Month Utility Functions (Full Set)

```ts
// ── Primary query ────────────────────────────────────────────────
// Get all derived op_months from effective_from up to today (or a target date)
function deriveAllOpMonths(
  rules: MonthCycleRule[],
  upTo: Date = new Date()
): OperationalMonth[] { ... }

// Resolve which op_month a specific date belongs to
function resolveOpMonth(targetDate: Date, rules: MonthCycleRule[]): OperationalMonth { ... }

// Get the most recently COMPLETED op_month (endDate < today)
function getLastCompletedOpMonth(rules: MonthCycleRule[]): OperationalMonth { ... }

// Get the current IN-PROGRESS op_month
function getCurrentOpMonth(rules: MonthCycleRule[]): OperationalMonth { ... }

// ── Date helpers ─────────────────────────────────────────────────
// Clamp day-of-month to valid range for that month (handles month_starts_on > 28)
function setDayOfMonth(date: Date, day: number): Date { ... }

// Get all calendar dates within an op_month
function getOpMonthDates(opMonth: OperationalMonth): Date[] { ... }

// ── Display helpers ──────────────────────────────────────────────
// "Apr 21 – May 20, 2026"
function formatOpMonthLabel(start: Date, end: Date): string { ... }

// Split op_month records by calendar month boundary
function splitByCalendarMonth(records: AttendanceRecord[], opMonth: OperationalMonth) { ... }

// Get the op_month N steps before/after a given one
function shiftOpMonth(opMonth: OperationalMonth, delta: number, rules: MonthCycleRule[]): OperationalMonth { ... }
```

---

#### 0g. How `op_month` Affects Every Other Module Area

| Module Area | Before | After op_month |
|---|---|---|
| Calendar View | Fixed calendar-month grid | Date-range grid from `op_month.startDate → endDate` |
| KPI Cards | Sums calendar-month records | Sums records within op_month window |
| Weekly Breakdown | ISO calendar weeks | Weeks sliced within op_month boundary |
| Breakdown Table | "April \| May \| Total" | "April portion \| May portion \| Op Month Total" (split at calendar boundary) |
| Nav / Month Picker | Month dropdown | Op Month Selector (shows derived label, e.g. "Apr 21–May 20, 2026") |
| Leave/Absent count | Calendar-month count | Count within op_month window |
| Lateness total | Calendar-month lateness | Lateness within op_month |
| Team Summary | Per-calendar-month | Per-op_month, labelled with derived range |
| Export | Calendar month header | Op_month label + date range in header |

---

### Step 1 — Define the Full Data Model

Design your database schema or TypeScript interfaces capturing every field, including `op_month` linkage:

```ts
// Daily attendance record
interface AttendanceRecord {
  id: number;
  employeeName: string;
  employeeId: string;
  date: Date;
  dayOfWeek: string;             // "Monday" … "Sunday"
  opMonthId: string;             // FK → OperationalMonth.id
  scheduledInTime: string;       // "09:00"
  actualEntry: string | null;    // "09:33" or null
  scheduledExitTime: string;     // "18:00" or "14:00"
  actualOut: string | null;      // "18:18" or null
  dayStatus: DayStatus;
  scheduledHours: number;        // 9 or 5 (Saturday)
  actualWorkHours: number | null;
  weekNumber: number;
  entryDelayMinutes: number | null;
  exitDelayMinutes: number | null;
  netWorkDelta: number | null;
}

// All possible day status types
type DayStatus =
  | "present"
  | "absent"
  | "wfh"
  | "leave"
  | "sick_casual_leave"
  | "office_work"
  | "half_day"
  | "holiday"
  | "sunday_off";

// Operational Month (see Step 0 for full interface)
interface OperationalMonth {
  id: string;
  label: string;
  startDate: Date;
  endDate: Date;
  cutoffDay: number;
  isActive: boolean;
  createdBy: string;
  createdAt: Date;
  notes?: string;
}

// Op-month-scoped summary per employee
interface OpMonthSummary {
  employeeId: string;
  employeeName: string;
  opMonthId: string;
  opMonthLabel: string;          // "Apr 20 – May 19, 2026"
  totalScheduledDays: number;
  totalWorkingHours: number;
  totalLateMinutes: number;
  presentDays: number;
  absentDays: number;
  wfhDays: number;
  leaveDays: number;
  sickDays: number;
  officeWorkDays: number;
  halfDays: number;
  holidayDays: number;
  sundayOffDays: number;
  reimbursementNote: string | null;
}

// Weekly breakdown within an op_month
interface OpMonthWeeklySlice {
  opMonthId: string;
  weekLabel: string;             // "Week 1 (Apr 20–26)"
  weekNumber: number;
  scheduledHours: number;
  actualHours: number;
  efficiencyPct: number;
  presentDays: number;
  wfhDays: number;
}
```

---

### Step 2 — Build the Status Legend Component

Map each day-status to a distinct visual token used across all views:

| Status | Badge Color | Icon |
|---|---|---|
| Present | `#22c55e` Green | ✅ |
| WFH | `#3b82f6` Blue | 🏠 |
| Leave | `#f59e0b` Amber | 🏖️ |
| Sick / Casual Leave | `#a78bfa` Purple | 🤒 |
| Office Work (field) | `#06b6d4` Cyan | 🏢 |
| Half Day | `#fb923c` Orange | 🌓 |
| Holiday | `#ec4899` Pink | 🎉 |
| Sunday Off | `#94a3b8` Slate | 🔕 |
| Absent | `#ef4444` Red | ❌ |

```html
<!-- Legend strip component -->
<div class="status-legend">
  <span class="badge present">Present</span>
  <span class="badge wfh">WFH</span>
  <span class="badge leave">Leave</span>
  <span class="badge sick">Sick/Casual</span>
  <span class="badge office-work">Office Work</span>
  <span class="badge half-day">Half Day</span>
  <span class="badge holiday">Holiday</span>
  <span class="badge sunday">Sunday</span>
  <span class="badge absent">Absent</span>
</div>
```

---

### Step 3 — Op Month Selector (Global Navigation Control)

> **The `op_month` selector replaces the old "Month Picker" control and is the primary navigation context for the entire attendance module.**

```
┌──────────────────────────────────────────────────────┐
│  📅  Op Month:  [ Apr 20 – May 19, 2026  ▼ ]        │
│                   ↑ dropdown of all past op_months   │
│  30 days  ·  Cycle cut-off: 20th of month            │
└──────────────────────────────────────────────────────┘
```

Implementation:

```ts
// Fetch all available op_months for the dropdown
const opMonths = await fetchOpMonths(); // sorted desc by startDate
const activeOpMonth = opMonths.find(om => om.isActive);

// All downstream data queries use: selectedOpMonth.startDate, endDate
const [selectedOpMonth, setSelectedOpMonth] = useState(activeOpMonth);
```

When the selected `op_month` changes:
- Re-fetch all employee attendance records filtered by `op_month_id` (or by date range).
- Re-compute all KPI cards, weekly slices, and summaries.
- Update the calendar grid to show the op_month date range (not a calendar month).
- Update the page title/breadcrumb to show the op_month label.

---

### Step 4 — Calendar / Daily Log View

Render a **date-range grid** (not a fixed 7×5 calendar month) spanning the full `op_month` window:

#### Grid layout
- Start from `opMonth.startDate`, render rows of 7 days each until `opMonth.endDate`.
- The first row may start mid-week (e.g. if Apr 20 is a Tuesday, the first row starts on Tuesday).
- Days **outside** the op_month range (padding cells) are rendered greyed-out / empty.
- Show a **divider/label** where a calendar month boundary is crossed mid-grid (e.g. "↑ April  |  May ↓").

#### Cell Content (per day)
- **Date** (e.g. "Apr 20", "May 3")
- **Day of week** label
- **Status badge** (colour-coded)
- **Actual In / Out times** (e.g. `09:33 → 18:18`)
- **Actual hours worked** (e.g. `8.45 hrs`)
- **Lateness indicator** — red pill if entry delayed (e.g. `+1h 33m late`)
- **Early exit indicator** — orange pill if left early

#### Visual Rules
```
Sunday/Holiday cells  → greyed background, no time data
WFH cells             → blue tint background
Leave cells           → amber tint background
Sick cells            → purple tint background
Office Work cells     → cyan tint background
Late entry cells      → red left-border accent
Early exit cells      → orange bottom-border accent
Month boundary cells  → subtle top-border divider with month label
```

```js
function renderDayCell(record, opMonth) {
  const lateEntry = record.entryDelayMinutes > 0;
  const earlyExit = record.exitDelayMinutes < 0;
  const isMonthBoundary = record.date.getDate() === 1; // first of a new calendar month

  return `
    <div class="day-cell status-${record.dayStatus}
                 ${lateEntry ? 'late-entry' : ''}
                 ${earlyExit ? 'early-exit' : ''}
                 ${isMonthBoundary ? 'month-boundary' : ''}">
      ${isMonthBoundary ? `<div class="month-label">${formatMonth(record.date)}</div>` : ''}
      <span class="day-number">${format(record.date, 'MMM d')}</span>
      <span class="day-name">${record.dayOfWeek.slice(0,3)}</span>
      <span class="status-badge">${formatStatus(record.dayStatus)}</span>
      ${record.actualEntry ? `
        <div class="times">${record.actualEntry} → ${record.actualOut}</div>
        <div class="hours">${record.actualWorkHours} hrs</div>
      ` : ''}
      ${lateEntry ? `<div class="late-pill">+${formatMinutes(record.entryDelayMinutes)} late</div>` : ''}
    </div>
  `;
}
```

---

### Step 5 — Weekly Summary Panel (within Op Month)

Weeks are sliced **within the op_month boundary**, not by ISO calendar weeks:

| Week Slice | Date Range | Scheduled Hrs | Actual Hrs | Efficiency |
|---|---|---|---|---|
| Week 1 | Apr 20–26 | 45 hrs | 41.2 hrs | 91.6% |
| Week 2 | Apr 27–May 3 | 44 hrs | 39.5 hrs | 89.8% |
| Week 3 | May 4–10 | 45 hrs | 43.0 hrs | 95.6% |
| Week 4 | May 11–17 | 45 hrs | 38.7 hrs | 86.0% |
| Week 5 | May 18–19 | 18 hrs | 16.2 hrs | 90.0% |

```ts
function sliceOpMonthIntoWeeks(
  opMonth: OperationalMonth,
  records: AttendanceRecord[]
): OpMonthWeeklySlice[] {
  const dates = getOpMonthDates(opMonth);
  const weeks: OpMonthWeeklySlice[] = [];

  // Chunk dates into groups of 7 starting from opMonth.startDate
  for (let i = 0; i < dates.length; i += 7) {
    const weekDates = dates.slice(i, i + 7);
    const weekRecords = records.filter(r =>
      weekDates.some(d => isSameDay(d, r.date))
    );
    const scheduledHours = weekRecords.reduce((s, r) => s + (r.scheduledHours || 0), 0);
    const actualHours = weekRecords.reduce((s, r) => s + (r.actualWorkHours || 0), 0);

    weeks.push({
      opMonthId: opMonth.id,
      weekLabel: `Week ${Math.floor(i / 7) + 1} (${format(weekDates[0], 'MMM d')}–${format(weekDates.at(-1)!, 'MMM d')})`,
      weekNumber: Math.floor(i / 7) + 1,
      scheduledHours,
      actualHours,
      efficiencyPct: scheduledHours > 0 ? (actualHours / scheduledHours) * 100 : 0,
      presentDays: weekRecords.filter(r => r.dayStatus === 'present').length,
      wfhDays: weekRecords.filter(r => r.dayStatus === 'wfh').length,
    });
  }

  return weeks;
}
```

**Visual**: Horizontal progress bars — actual hours vs. scheduled hours, per week slice.

---

### Step 6 — Op Month KPI Summary (per-employee)

A **KPI card row** scoped to the selected `op_month`:

```
Op Month: Apr 20 – May 19, 2026  (30 days)
┌─────────────────┐  ┌────────────────┐  ┌─────────────────┐  ┌──────────────────┐
│  Total Hours    │  │  Days Present  │  │  Days Absent    │  │  Total Lateness  │
│  127.32 hrs     │  │  26 / 30       │  │  4              │  │  19h 40m         │
└─────────────────┘  └────────────────┘  └─────────────────┘  └──────────────────┘
┌─────────────────┐  ┌────────────────┐  ┌─────────────────┐
│  WFH Days       │  │  Leave Days    │  │  Efficiency %   │
│  3              │  │  2             │  │  84.3%          │
└─────────────────┘  └────────────────┘  └─────────────────┘
```

All values are computed against `opMonth.startDate` → `opMonth.endDate`.

#### Cross-op_month comparison (optional drilldown)

When the user clicks on a KPI card, show a **sparkline trend** of that metric across the last 3–6 op_months:

```
Total Hours — last 6 op months:
Oct▐███████ 182h
Nov▐█████████ 199h
Dec▐███████ 175h  ← holiday season
Jan▐████████ 190h
Feb▐████████ 187h
Mar▐███████████ 210h  ← best month
```

---

### Step 7 — Op Month Breakdown Table (cross-calendar-month display)

Since an op_month spans two calendar months, show the breakdown split at the calendar boundary:

| Period | Dates | Scheduled Days | Scheduled Hrs | Actual Hrs | Variance |
|---|---|---|---|---|---|
| April portion | Apr 20–30 | 9 days | 81 hrs | 72.4 hrs | −8.6 hrs |
| May portion | May 1–19 | 21 days | 189 hrs | 165.7 hrs | −23.3 hrs |
| **Op Month Total** | **Apr 20–May 19** | **30 days** | **270 hrs** | **238.1 hrs** | **−31.9 hrs** |

```ts
function splitByCalendarMonth(
  records: AttendanceRecord[],
  opMonth: OperationalMonth
) {
  const groups: Record<string, AttendanceRecord[]> = {};
  records.forEach(r => {
    const key = format(r.date, 'yyyy-MM'); // e.g. "2026-04"
    if (!groups[key]) groups[key] = [];
    groups[key].push(r);
  });
  return Object.entries(groups).map(([monthKey, recs]) => ({
    monthKey,
    label: format(parseISO(monthKey + '-01'), 'MMMM yyyy'),
    scheduledHours: recs.reduce((s, r) => s + (r.scheduledHours || 0), 0),
    actualHours: recs.reduce((s, r) => s + (r.actualWorkHours || 0), 0),
    presentDays: recs.filter(r => r.dayStatus === 'present').length,
  }));
}
```

---

### Step 8 — Team Overview (Op Month–Scoped)

Visualize the team summary sheet filtered to the selected `op_month`:

#### 8a. Team Leaderboard Table

| # | Employee | Op Month | Working Hours | Present | Absent | Lateness | Reimbursement |
|---|---|---|---|---|---|---|---|
| 1 | Badal | Apr 20–May 19 | 206.07 | 30/30 | 0 | 11h 16m | — |
| 2 | Harshit | Apr 20–May 19 | 189.22 | 27/30 | 3 | 50m | ₹813 |

#### 8b. Comparative Bar Chart
- X-axis: Employee names
- Y-axis: Total working hours within op_month
- Reference line: team average
- Color: Green = above average, Yellow = near average, Red = below

#### 8c. Attendance Rate Mini-Donuts
Inline per-employee: `Present % | WFH % | Leave % | Absent %`

#### 8d. Reimbursement Tracker (per op_month)

```
Pranadeep: ₹1,342  |  Harshit: ₹813  |  Neha: ₹700  |  Sarowar: ⚠️ pending
```

---

### Step 9 — Lateness & Punctuality Analysis

#### 9a. Entry Time Scatter Plot (across op_month dates)
- X-axis: Dates within op_month (Apr 20 → May 19)
- Y-axis: Actual entry time
- Reference horizontal line at scheduled in-time (09:00)
- Dots above = late, dots below = early

#### 9b. Lateness Heatmap
Calendar heatmap spanning the op_month range:
- 0 min late → light green
- 1–15 min → yellow
- 15–60 min → orange
- 60+ min → red
- Off days (Sunday/Holiday/Leave) → grey

#### 9c. Cumulative Lateness Line Chart
Running total of late minutes from `opMonth.startDate` to `opMonth.endDate`.

---

### Step 10 — Filtering & Navigation Controls

| Control | Behaviour |
|---|---|
| **Op Month Selector** | Primary dropdown — selects which op_month to view (replaces calendar month picker) |
| Employee Selector | Dropdown or tab list |
| Week Slice Filter | Jump to / highlight a specific week within the op_month |
| Status Filter | Toggle which day-statuses are visible |
| View Toggle | Calendar / Table / Charts |
| Compare Mode | Select two op_months side by side for trend comparison |

---

### Step 11 — Notes & Alerts Panel

Display free-text notes scoped to the selected op_month:

```
⚠️  [Apr 20–May 19]  Sarowar: 3-day leave balance from last month is pending.
ℹ️  [Apr 20–May 19]  Detailed TA for Pranadeep & Harshit shared separately.
```

Notes can be:
- **Auto-generated** from Excel import
- **Manually added** by admin for an op_month (stored in `operational_months.notes`)
- **Per-employee** (stored in attendance notes table)

---

### Step 12 — Responsive Layout Structure

```
┌──────────────────────────────────────────────────────────────┐
│  HEADER:  Op Month Selector  |  Employee Tabs  |  View Mode │
├──────────────────────────────────────────────────────────────┤
│  OP MONTH BANNER: "Apr 20 – May 19, 2026  (30 days)"        │
├──────────────────────────────────────────────────────────────┤
│  KPI CARDS: Hours | Present | Absent | WFH | Lateness       │
├──────────────────────────────────────────────────────────────┤
│  NOTES / ALERTS  (if any)                                   │
├──────────────────────────────────────────────────────────────┤
│  [CALENDAR VIEW]   Op Month date-range grid                  │
│     or                                                       │
│  [TABLE VIEW]      Daily log rows (op_month filtered)        │
│     or                                                       │
│  [CHARTS VIEW]     Weekly bars + Punctuality scatter         │
├──────────────────────────────────────────────────────────────┤
│  WEEKLY SLICES  (Week 1 | 2 | 3 | 4 | 5)                   │
├──────────────────────────────────────────────────────────────┤
│  OP MONTH BREAKDOWN TABLE (Apr portion | May portion | Total)│
├──────────────────────────────────────────────────────────────┤
│  TEAM VIEW TAB: Leaderboard, Compare Chart, Reimburse        │
├──────────────────────────────────────────────────────────────┤
│  ADMIN TAB: Op Month Manager, Create/Edit cycles            │
└──────────────────────────────────────────────────────────────┘
```

---

## 🧮 Key Computed Metrics Reference

All metrics are computed within the **op_month date window** (`startDate` → `endDate`):

| Metric | Formula |
|---|---|
| Entry delay (min) | `(actualEntry − scheduledIntime)` in minutes |
| Exit delay (min) | `(actualOut − scheduledExittime)` in minutes |
| Net work delta | `entryDelay − exitDelay` |
| Attendance rate % | `(presentDays / totalScheduledWorkingDays) × 100` |
| Punctuality rate % | `(daysOnTime / presentDays) × 100` |
| Hours efficiency % | `(actualWorkHours / scheduledHours) × 100` |
| Op month scheduled hrs | Sum of `scheduledHours` for all records in op_month |
| Op month actual hrs | Sum of `actualWorkHours` for all records in op_month |
| Total lateness | Sum of all positive `entryDelayMinutes` within op_month |
| Op month duration | `(endDate − startDate) + 1` days |
| Calendar split | Group records by `yyyy-MM` within op_month |

---

## 📁 Suggested File Structure (Frontend Module)

```
src/
  attendance/
    admin/
      OpMonthManager.jsx           # Create / edit / activate op_months
      OpMonthForm.jsx              # Date picker + auto-suggest form
      OpMonthList.jsx              # Past op_months table
    components/
      OpMonthSelector.jsx          # Global op_month dropdown (primary nav)
      OpMonthBanner.jsx            # Context banner showing current op_month range
      AttendanceCalendar.jsx       # Op-month date-range grid view
      DayCell.jsx                  # Single day card
      WeeklySlicePanel.jsx         # Week-by-week summary within op_month
      MonthlyKPICards.jsx          # KPI strip (op_month scoped)
      OpMonthBreakdownTable.jsx    # Calendar-month split within op_month
      TeamLeaderboard.jsx          # Team overview (op_month scoped)
      TeamCompareChart.jsx         # Bar chart comparison
      PunctualityChart.jsx         # Entry time scatter (op_month x-axis)
      LatenessHeatmap.jsx          # Heatmap spanning op_month range
      ReimbursementCard.jsx        # TA + expense display
      NotesAlertBanner.jsx         # Notes for this op_month
      StatusLegend.jsx             # Colour legend strip
      FilterControls.jsx           # Op month, employee, status filters
    hooks/
      useOpMonth.js                # Active op_month state, selector logic
      useAttendanceData.js         # Data fetching scoped by op_month_id
      useAttendanceCalculations.js # All computed metrics (op_month aware)
    utils/
      opMonthUtils.ts              # getOpMonthDates, isInOpMonth, resolveOpMonth
      parseLateness.js             # Parse "19hrs/40mins" → minutes
      statusMapper.js              # Map raw strings → DayStatus enum
      timeUtils.js                 # Time difference helpers
    AttendanceModule.jsx           # Main module container
    attendance.css                 # Module-scoped styles
```

---

## ✅ Feature Checklist

### Op Month Core
- [ ] `OperationalMonth` data model and DB table with date-range + cutoff-day
- [ ] Admin: Create / Edit / Activate op_month panel
- [ ] Auto-suggest end date from start date + cycle length
- [ ] Overlap detection when creating new op_month
- [ ] Historical op_month list queryable for past reports
- [ ] `op_month_id` linked to all attendance records
- [ ] `OpMonthSelector` dropdown replaces calendar month picker
- [ ] `OpMonthBanner` showing active range on all views

### Daily Log / Calendar
- [ ] Calendar grid spans op_month date range (not calendar month)
- [ ] Month-boundary divider when op_month crosses calendar months
- [ ] Day cells with in/out times, status, lateness pills
- [ ] Late entry / early exit visual indicators

### Weekly & Summary
- [ ] Weekly slices computed within op_month boundary (not ISO weeks)
- [ ] Op month KPI cards scoped to op_month window
- [ ] Calendar-month split breakdown table (April portion | May portion | Total)
- [ ] Cross-op_month sparkline trends on KPI click

### Team View
- [ ] Team leaderboard scoped to selected op_month
- [ ] Comparative bar chart (op_month scoped)
- [ ] Reimbursement tracker per op_month
- [ ] Attendance rate mini-donuts per employee

### Analytics
- [ ] Punctuality scatter plot (x-axis = op_month dates)
- [ ] Lateness heatmap spanning op_month range
- [ ] Cumulative lateness line chart (op_month scope)

### General
- [ ] Day status legend (9 statuses)
- [ ] Status filter toggles
- [ ] Employee selector
- [ ] View toggle: Calendar / Table / Charts
- [ ] Notes/alert panel (per op_month + per employee)
- [ ] Export / print view labelled with op_month range
- [ ] Responsive layout for mobile + desktop
