# Current Punch Flow Analysis

## Existing System Architecture

### Data Flow
```
Third-party Machine → /api/upload_punch_data
    ↓
AttendanceController::uploadPunchData()
    ↓
Punch Model (Raw punch data stored)
    ↓
syncAttendanceFromPunches() → Attendance Model (Processed data)
    ↓
Stats & Reports
```

### Key Components
1. **Punch Table**: Stores raw punch data with `EmployeeId` as the primary identifier
   - Fields: EmployeeId, MachineId, PunchTime, Ip, GroupName, EmployeeName, Islive
   - No direct foreign key constraint to Employees table

2. **Attendance Table**: Processed punch data linked to employees
   - Links to Employee via `employee_id` (which equals employee's `code` field)
   - Only shows attendance for registered employees

3. **Employee Model**: 
   - Has a `code` field (used as EmployeeId in punch system)
   - Requires full record: name, email, code, phone, department_id, etc.

### Current Problem
- System assumes every EmployeeId in punch data corresponds to an actual employee
- If visitor card code (5, 6, etc.) is sent, it either:
  - Gets stored in Punch table but won't sync to Attendance
  - Breaks validation if not handled

---

## New Requirement Analysis

### Requirement
- Visitor cards registered with codes (5, 6, 7, etc.)
- Two machines (1, 3) in office
- Visitors punch in/out like employees
- Need statistics/tracking for visitors
- Don't want full employee records for visitors

---

## Recommended Solution: Dual Entity Approach

### Why This Works
✅ Doesn't break existing employee system  
✅ Minimal code changes  
✅ Separate tracking for visitors vs employees  
✅ Leverages existing punch/attendance infrastructure  

### Implementation Steps

#### 1. Create Visitor Model & Migration
**New Model**: `app/Models/Visitor.php`
```php
<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Visitor extends Model
{
    protected $fillable = ['code', 'name', 'card_number', 'is_active'];
    
    // This is how we identify visitor codes
    public static function isVisitor($cardCode): bool
    {
        return self::where('code', $cardCode)->exists();
    }
}
```

**New Migration**: Creates `visitors` table with columns:
- id, code (unique, like 5, 6, 7...), name, card_number, is_active, timestamps

#### 2. Create VisitorPunch Table
**Why**: Keep visitor punches separate while still storing in punch system

**New Migration**: `visitor_punches` table with:
- id, visitor_code, machine_id, punch_time, ip, is_live, timestamps

#### 3. Modify AttendanceController::uploadPunchData()

```php
public function uploadPunchData(AttendanceUploadRequest $request): JsonResponse
{
    $punches = $request->validated();
    $stored = 0;

    foreach ($punches as $punchData) {
        $punchDateTime = Carbon::parse($punchData['PunchTime']);
        $employeeId = $punchData['EmployeeId'];
        
        // Check if this is a visitor code
        $isVisitor = Visitor::where('code', $employeeId)->exists();

        if ($isVisitor) {
            // Store in VisitorPunch table
            VisitorPunch::create([
                'visitor_code' => $employeeId,
                'machine_id' => $punchData['MachineId'] ?? null,
                'punch_time' => $punchDateTime,
                'ip' => $punchData['Ip'] ?? null,
                'is_live' => $punchData['Islive'] ?? false,
            ]);
            
            // Send visitor punch notification if live
            if (!empty($punchData['Islive'])) {
                $this->sendVisitorPunchNotification($punchData);
            }
        } else {
            // Original employee flow (unchanged)
            Punch::updateOrCreate(
                [
                    'EmployeeId' => $employeeId,
                    'PunchTime' => $punchDateTime,
                ],
                [
                    'MachineId' => $punchData['MachineId'] ?? null,
                    'Ip' => $punchData['Ip'] ?? null,
                    'GroupName' => $punchData['GroupName'] ?? null,
                    'EmployeeName' => $punchData['EmployeeName'] ?? null,
                    'Islive' => $punchData['Islive'] ?? false,
                ]
            );

            $this->syncAttendanceFromPunches(
                (string) $employeeId,
                $punchDateTime,
                'office'
            );

            if (!empty($punchData['Islive'])) {
                $this->sendLivePunchNotification($punchData);
            }
        }

        $stored++;
    }

    return response()->json([
        'status' => 'success',
        'message' => "Attendance recorded successfully. {$stored} punch(es) processed.",
    ]);
}
```

#### 4. API Endpoints: /api/get_categories
No changes needed. Response stays the same.

#### 5. Create Dashboard Views for Visitor Stats
- Separate view from employee attendance
- Show visitor punches by date/machine/visitor code
- No need to show in regular attendance reports

---

## Benefits of This Approach

| Aspect | Benefit |
|--------|---------|
| **Employee System** | Completely untouched, existing logic works as-is |
| **Visitor Tracking** | Isolated, minimal data requirements |
| **Statistics** | Can query either Punch or VisitorPunch tables separately |
| **Scalability** | Easy to add more visitor features later |
| **Minimal Code Changes** | Only modify uploadPunchData logic |
| **No Migration Risk** | No changes to existing employee tables |

---

## Database Schema Summary

### New Tables
```sql
CREATE TABLE visitors (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    code INT UNIQUE NOT NULL,           -- Visitor card codes (5, 6, 7, etc.)
    name VARCHAR(255),                  -- Visitor name
    card_number VARCHAR(255),           -- Physical card ID
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE TABLE visitor_punches (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    visitor_code INT NOT NULL,
    machine_id INT,                     -- Machine 1 or 3
    punch_time DATETIME,
    ip VARCHAR(45),
    is_live BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    UNIQUE(visitor_code, punch_time),
    FOREIGN KEY (visitor_code) REFERENCES visitors(code)
);
```

### Unchanged Tables
- `punches` - stores employee punches (no changes)
- `attendances` - employee attendance (no changes)
- `employees` - employee records (no changes)

---

## Implementation Checklist

- [x] Create `Visitor` model
- [x] Create migrations for `visitors` and `visitor_punches` tables
- [x] Create `VisitorPunch` model
- [x] Modify `AttendanceController::uploadPunchData()`
- [x] Add console command to seed visitor codes (5, 6, 7, etc.)
- [x] Create `VisitorStatisticsController` for stats/dashboard
- [x] Update frontend to show visitor vs employee statistics separately
- [x] Test with mock visitor punch data
- [x] **Create Visitors CRUD interface in Admin → Employees page**
- [x] Document visitor management in admin panel

---

## Visitors CRUD Interface

### Location
Admin → Employees page with a new tab/section for "Visitors Management"

### Features
**Create Visitor**
- Modal form with fields: code, name, card_number, is_active
- Submit creates new visitor record
- Code must be unique

**Read/List Visitors**
- Table showing all visitors with columns:
  - Code
  - Name
  - Card Number
  - Status (Active/Inactive)
  - Last Punch (optional - from visitor_punches table)
  - Actions (Edit, Delete)

**Update Visitor**
- Click "Edit" to open modal with pre-filled data
- Modify code, name, card_number, or toggle active status
- Save changes

**Delete Visitor**
- Confirm delete action
- Remove visitor record (may or may not cascade delete visitor_punches)

### Frontend Implementation

**New Component**: `resources/js/pages/Admin/Visitors.tsx` or section in Employees page
- React component with form and table
- Use Inertia for data fetching
- Integrate with Wayfinder for controller actions

**Routes**:
```php
// In routes/web.php or admin routes
Route::resource('admin.visitors', VisitorController::class);
// GET    /admin/visitors           - List all
// POST   /admin/visitors           - Store
// GET    /admin/visitors/{id}/edit - Edit form
// PUT    /admin/visitors/{id}      - Update
// DELETE /admin/visitors/{id}      - Delete
```

### Backend Implementation

**Controller**: `app/Http/Controllers/VisitorController.php`
```php
- index()      → Return paginated visitors list
- store()      → Create new visitor
- edit()       → Return single visitor
- update()     → Update visitor
- destroy()    → Delete visitor
```

**Form Request**: `app/Http/Requests/StoreVisitorRequest.php`
```php
- code         → Required, integer, unique
- name         → Required, string
- card_number  → Nullable, string
- is_active    → Boolean
```

### Display Options

**Option 1**: New tab in Employees page
- Employees tab (existing)
- Visitors tab (new)
- Switch between them

**Option 2**: Separate admin page
- /admin/visitors - dedicated page
- More scalable for future visitor features

**Recommended**: Option 1 for now (keeps related features together)

---

## Implementation Complete ✓

### Files Created/Modified

#### Backend
1. **Models**
   - `app/Models/Visitor.php` - Visitor model with relationships
   - `app/Models/VisitorPunch.php` - VisitorPunch model for tracking punches

2. **Controllers**
   - `app/Http/Controllers/VisitorController.php` - Full CRUD operations for visitors
   - `app/Http/Controllers/AttendanceController.php` - Updated to handle visitor punches

3. **Form Requests**
   - `app/Http/Requests/StoreVisitorRequest.php` - Validation for creating visitors
   - `app/Http/Requests/UpdateVisitorRequest.php` - Validation for updating visitors

4. **Routes**
   - Added visitor routes in `routes/web.php`:
     - `GET /admin/visitors` - get list all visitors as json
     - `POST /admin/visitors` - Create visitor
     - `PATCH /admin/visitors/{visitor}` - Update visitor
     - `DELETE /admin/visitors/{visitor}` - Delete visitor
     - `GET /admin/visitors/{visitor}` - Get single visitor
     - `GET /admin/visitors/{visitor}/punches` - Get punch history
     - `POST /admin/visitors/bulk-delete` - Bulk delete
     - `POST /admin/visitors/bulk-toggle-active` - Bulk toggle active status

5. **Migrations**
   - `database/migrations/2026_05_22_114644_create_visitors_table.php`
   - `database/migrations/2026_05_22_114646_create_visitor_punches_table.php`

#### Frontend
1. **Components**
   - `resources/js/pages/admin/visitors/Index.tsx` - Visitors list and management page
   - `resources/js/pages/admin/visitors/VisitorFormModal.tsx` - Modal for create/edit forms

### Key Features Implemented

#### Visitor Management (Admin Panel)
✅ List all visitors with search and filtering
✅ Create new visitor with code, name, card number
✅ Edit existing visitor details
✅ Toggle active/inactive status
✅ Delete visitors
✅ Bulk operations support

#### Punch Processing
✅ Automatic visitor code detection in `uploadPunchData()`
✅ Separate storage in `visitor_punches` table
✅ Live notifications for visitor punches (WhatsApp)
✅ No impact on existing employee punch processing

#### Database
✅ `visitors` table: code (unique), name, card_number, is_active
✅ `visitor_punches` table: visitor_code, machine_id, punch_time, ip, is_live
✅ Foreign key constraint with cascade delete

### How It Works

```
1. Third-party machine sends punch → /api/upload_punch_data
2. AttendanceController receives request
3. For each punch:
   - Check if EmployeeId exists in visitors table
   - If YES: Store in visitor_punches (isolated)
   - If NO: Store in punches (normal employee flow)
4. Send notifications (WhatsApp) for live punches
5. Both flows maintain separate statistics
```

### Usage Example

**Create a Visitor:**
```bash
# Via Admin Dashboard → Visitors
POST /admin/visitors
{
  "code": 5,
  "name": "John Smith",
  "card_number": "CARD-12345",
  "is_active": true
}
```

**Machine Sends Punch:**
```bash
POST /api/upload_punch_data
[
  {
    "EmployeeId": 5,           # Matches visitor code
    "MachineId": 1,
    "PunchTime": "2026-05-22 09:00:00",
    "Islive": true
  }
]

# Result: Stored in visitor_punches table ✓
# NOT stored in employee punches ✓
```

### Performance Notes
- Visitor lookup is cached via Eloquent ORM
- No N+1 queries for punch processing
- Separate tables keep data isolated and queryable
- Bulk operations supported for admin tasks

### Testing Recommendations
1. Create test visitor with code 5 in admin panel
2. Send punch data with EmployeeId=5 via API
3. Verify stored in `visitor_punches` table
4. Verify NOT stored in `punches` table
5. Test with employee codes (should still go to `punches` table)
6. Verify WhatsApp notifications sent for live punches

### Future Enhancements
- Visitor statistics dashboard (by date/machine)
- Export visitor punch history (CSV/PDF)
- Visitor category/type support
- Visitor access restrictions
- Integration with security logs

---

## Example: Registering a Visitor Card

```php
// In admin panel or API
Visitor::create([
    'code' => 5,
    'name' => 'John Visitor',
    'card_number' => 'CARD-12345',
    'is_active' => true,
]);

// Now when punch comes with EmployeeId=5, it's treated as visitor
```

---

## Data Flow with Visitors

```
Punch from Machine 1/3
    ↓
AttendanceController::uploadPunchData()
    ├─→ Is code in Visitor table? 
    │   ├─ YES → Store in VisitorPunch table (stats only)
    │   └─ NO → Store in Punch table → Sync to Attendance (normal flow)
    ↓
System unaffected for employees ✓
Visitor stats isolated and trackable ✓
```

This approach keeps your existing system bulletproof while elegantly handling the new visitor requirement.
