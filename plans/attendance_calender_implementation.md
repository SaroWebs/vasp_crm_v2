# Attendance Calendar — Implementation Plan

## Overview

This plan covers the full implementation of the **Attendance Calendar** feature for the portal. It
includes:

- **Employee self-service view** — employees see their own monthly attendance calendar.
- **Admin view** — admins browse any employee's attendance, with summary stats.
- **Controller methods** (already partially built) that need completing.
- **Routes** wiring up those controller methods.
- **React calendar UI** using the existing design system.

---

## Current State

| Area | Status |
|---|---|
| `attendances` migration | ✅ Exists (`create_attendances_table`) |
| `Attendance` model | ✅ Exists (fillable fields set) |
| `AttendanceController::uploadPunchData` | ✅ Done — biometric device push |
| `AttendanceController::punchEntry` | ✅ Done — employee self punch |
| `AttendanceController::getEmployeeAttendance` | ✅ Done — employee self fetch |
| Admin: get any employee's attendance | ❌ Missing controller method |
| Admin: get all employees' attendance summary | ❌ Missing controller method |
| Admin: manually override attendance | ❌ Missing controller method |
| Employee relationship on `Attendance` | ❌ Missing (`hasMany` on `Employee`) |
| Routes: self punch & fetch | ❌ Not registered in `web.php` / `api.php` |
| Routes: admin attendance management | ❌ Not registered |
| Employee portal calendar page | ❌ Not built |
| Admin attendance calendar page | ❌ Not built |

---

## Phase 1 — Backend: Complete Controller & Register Routes

### 1.1 Add missing controller methods to `AttendanceController`

#### Method: `adminGetEmployeeAttendance`
- Guard: `auth + admin` middleware.
- Accept `employee_id` (the `employees.id` PK, **not** the biometric code), `month`, `year`.
- Resolve employee → get `employee->code` → query attendances by code + month/year.
- Return JSON with attendance records **and** computed summary:
  - `total_days`, `present_days`, `absent_days`, `late_days` (punch_in > 09:00), `total_hours`.

#### Method: `adminGetAllAttendanceSummary`
- Guard: `auth + admin` middleware.
- Accept `month`, `year` (defaults to current).
- Return a list of **all employees** with their summary for that month.
- Eager-load employees with their attendance records for that month.

#### Method: `adminOverrideAttendance`
- Guard: `auth + admin` middleware.
- Accept `employee_id`, `attendance_date`, `punch_in`, `punch_out`, `mode`.
- `updateOrCreate` on `(employee_id_code, attendance_date)`.
- Use a new `AttendanceOverrideRequest` Form Request for validation.

#### Method: `adminDeleteAttendance`
- Guard: `auth + admin` middleware.
- Accept an attendance record ID; delete it.

### 1.2 Add `attendance` relationship to `Employee` model

```php
public function attendances(): HasMany
{
    return $this->hasMany(Attendance::class, 'employee_id', 'code');
}
```

### 1.3 Add `employee` accessor to `Attendance` model

```php
public function employee(): BelongsTo
{
    return $this->belongsTo(Employee::class, 'employee_id', 'code');
}
```

### 1.4 Register routes in `web.php`

**Employee self-service** (under `middleware(['web', 'auth', 'admin'])` group):

```
GET  /my/attendance                   → AttendanceController@myAttendancePage    (name: my.attendance)
GET  /api/my/attendance               → AttendanceController@getEmployeeAttendance (name: api.my.attendance)
POST /api/my/attendance/punch         → AttendanceController@punchEntry          (name: api.my.attendance.punch)
```

**Admin attendance management** (under `admin` prefix group):

```
GET    /attendance                          → AttendanceController@adminIndex        (name: attendance.index)
GET    /api/attendance/summary              → AttendanceController@adminGetAllAttendanceSummary (name: api.attendance.summary)
GET    /api/attendance/{employee}           → AttendanceController@adminGetEmployeeAttendance   (name: api.attendance.employee)
POST   /api/attendance/{employee}/override  → AttendanceController@adminOverrideAttendance      (name: api.attendance.override)
DELETE /api/attendance/{attendance}         → AttendanceController@adminDeleteAttendance         (name: api.attendance.delete)
```

### 1.5 Create `AttendanceOverrideRequest` Form Request

```
php artisan make:request AttendanceOverrideRequest --no-interaction
```

Fields: `employee_id` (required, exists:employees,id), `attendance_date` (required, date),
`punch_in` (nullable, date_format:H:i:s), `punch_out` (nullable, date_format:H:i:s, after:punch_in),
`mode` (nullable, in:office,remote).

---

## Phase 2 — Employee Self-Service: `My Attendance` Page

**File:** `resources/js/Pages/my/attendance/Index.tsx`

### UI Components

```
MyAttendancePage
├── MonthYearPicker          — navigate months
├── AttendanceSummaryCards   — Present / Absent / Late / Hours stats
├── AttendanceCalendarGrid   — 7-col monthly grid (Mon–Sun)
│   └── DayCell              — colored pill per day:
│       • green  = present (full day)
│       • yellow = present (half day / only punch_in)
│       • red    = absent (working day, no record)
│       • grey   = weekend / holiday
│       • blue   = today
└── PunchWidget              — Punch In / Punch Out button (calls punchEntry API)
```

### Data Flow

1. On mount + month change → `GET /api/my/attendance?month=&year=`
2. Map records to calendar grid by `attendance_date`.
3. Working days = Mon–Fri; mark absent only for past working days with no record.
4. Punch widget calls `POST /api/my/attendance/punch`.
5. After punch, refetch current month data.

### Route Registration

Add to `web.php`:

```
GET /my/attendance → AttendanceController@myAttendancePage
```

Add `myAttendancePage` method to controller returning `Inertia::render('my/attendance/Index')`.

---

## Phase 3 — Admin Attendance Calendar Page

**File:** `resources/js/Pages/admin/attendance/Index.tsx`

### UI Components

```
AdminAttendancePage
├── EmployeeSelector        — searchable dropdown (all employees)
├── MonthYearPicker
├── AttendanceSummaryCards  — same stat cards as employee view
├── AttendanceCalendarGrid  — same grid component (reused)
├── AttendanceTableView     — tabular fallback showing punch_in/punch_out/mode
└── OverrideModal           — form to manually add/edit an attendance record
    ├── DatePicker
    ├── PunchIn TimePicker
    ├── PunchOut TimePicker
    └── Mode toggle (office / remote)
```

### All-Employees Summary Sub-page

**File:** `resources/js/Pages/admin/attendance/Summary.tsx`

```
AdminAttendanceSummaryPage
├── MonthYearPicker
└── AttendanceSummaryTable
    └── Columns: Employee | Department | Present | Absent | Late | Hours | Actions
```

### Routes

```
GET /admin/attendance          → AdminAttendanceController@index      (admin.attendance.index)
GET /admin/attendance/summary  → AdminAttendanceController@summary    (admin.attendance.summary)
```

---

## Phase 4 — Shared React Components

Extract reusable components to `resources/js/components/attendance/`:

| Component | Purpose |
|---|---|
| `AttendanceCalendarGrid.tsx` | Monthly grid, accepts `records[]` + `month` + `year` |
| `DayCell.tsx` | Single day cell with status colouring |
| `AttendanceSummaryCards.tsx` | Stats row (present / absent / late / hours) |
| `MonthYearPicker.tsx` | Month navigation with prev/next arrows |
| `PunchWidget.tsx` | Punch in/out button |
| `AttendanceOverrideModal.tsx` | Admin override form modal |

---

## Phase 5 — Tests

### Feature Tests

```
php artisan make:test AttendanceControllerTest --no-interaction
```

Tests to cover:

- `uploadPunchData` — happy path, missing fields, duplicate punch logic.
- `punchEntry` — punch-in, punch-out, no employee code error.
- `getEmployeeAttendance` — correct month filter, no employee error.
- `adminGetEmployeeAttendance` — correct records returned, admin only.
- `adminGetAllAttendanceSummary` — all employees returned.
- `adminOverrideAttendance` — creates / updates, validation errors.
- `adminDeleteAttendance` — deletes record, 404 on missing.

---

## Phase 6 — Polish & Navigation

- Add **Attendance** to the sidebar menu (`MenuManagementController` / role menu items).
- Handle **holidays** — optional: seed a `holidays` table or hardcode common holidays.
- Add **export to CSV** for admin summary table.
- Wayfinder type generation — run `npm run build` after routes are registered.

---

## Todo List

### Phase 1 — Backend

- [x] Add `attendances()` HasMany to `Employee` model
- [x] Add `employee()` BelongsTo to `Attendance` model
- [x] Implement `adminGetEmployeeAttendance()` in `AttendanceController`
- [x] Implement `adminGetAllAttendanceSummary()` in `AttendanceController`
- [x] Implement `adminOverrideAttendance()` in `AttendanceController`
- [x] Implement `adminDeleteAttendance()` in `AttendanceController`
- [x] Add `myAttendancePage()` Inertia render method in `AttendanceController`
- [x] Add `adminIndex()` Inertia render method in `AttendanceController`
- [x] Add `adminSummaryPage()` Inertia render method in `AttendanceController`
- [x] Create `AttendanceOverrideRequest` Form Request with validation rules
- [x] Register employee self-service routes in `web.php`
- [x] Register admin attendance management routes in `web.php`
- [x] Run `vendor/bin/pint --dirty --format agent` to format PHP files

### Phase 2 — Employee Self-Service Page

- [x] Create `resources/js/Pages/my/attendance/Index.tsx`
- [x] Implement `MonthYearPicker` component
- [x] Implement `AttendanceSummaryCards` component
- [x] Implement `AttendanceCalendarGrid` + `DayCell` components
- [x] Implement `PunchWidget` component (punch-in / punch-out)
- [x] Wire API calls for fetching attendance and punching

### Phase 3 — Admin Attendance Pages

- [x] Create `resources/js/Pages/admin/attendance/Index.tsx`
- [x] Create `resources/js/Pages/admin/attendance/Summary.tsx`
- [x] Implement employee selector dropdown
- [x] Implement `AttendanceOverrideModal` component
- [x] Implement tabular attendance view
- [x] Wire all admin API calls

### Phase 4 — Shared Components

- [x] Extract `AttendanceCalendarGrid.tsx` to `resources/js/components/attendance/`
- [x] Extract `DayCell.tsx`
- [x] Extract `AttendanceSummaryCards.tsx`
- [x] Extract `MonthYearPicker.tsx`
- [x] Extract `AttendanceOverrideModal.tsx`

### Phase 5 — Tests

- [x] Create `AttendanceControllerTest` feature test class
- [x] Write tests for `uploadPunchData`
- [x] Write tests for `punchEntry`
- [x] Write tests for `getEmployeeAttendance`
- [x] Write tests for `adminGetEmployeeAttendance`
- [x] Write tests for `adminGetAllAttendanceSummary`
- [x] Write tests for `adminOverrideAttendance`
- [x] Write tests for `adminDeleteAttendance`
- [ ] Run all tests and confirm passing

### Phase 6 — Polish

- [x] Add Attendance menu items for admin sidebar
- [x] Add My Attendance link to employee sidebar
- [x] CSV export for admin summary
- [ ] Run `npm run build` / regenerate Wayfinder types
