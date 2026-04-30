# Independent Attendance Calendar Component

## Overview

The `AttendanceCalendar` component is a fully independent, reusable component that displays an employee's attendance information with role-based access control.

## Props

- **`employee_id`** (string | number, required): The ID or code of the employee to display attendance for
- **`auth`** (AuthUser, required): The authenticated user object containing user information and roles

```typescript
interface AuthUser {
    id: number;
    name: string;
    email: string;
    roles?: Array<{
        id: number;
        name: string;
        slug: string;
    }>;
}
```

## Features

1. **Role-Based Access Control**: 
   - Employees can only view their own attendance
   - Managers, HR, and Admins can view any employee's attendance
   - Attendance override/management is only available to authorized users (admin/manager/hr)

2. **Automatic Authorization**:
   - The component checks the auth user's roles and permissions
   - The API endpoint validates access on the server side
   - Proper error messages for unauthorized access

3. **Full Attendance Display**:
   - Monthly calendar view with attendance records
   - Attendance summary cards (total days, present days, absent days, late days, total hours)
   - Month/year picker for navigation
   - Working hours and holidays integration
   - Day cell with punch-in/punch-out times

4. **Admin Features**:
   - Override attendance records
   - Delete attendance records
   - Manual attendance entry

## Usage Example

```tsx
import { AttendanceCalendar } from '@/components/attendance';
import { useAuthContext } from '@/hooks/useAuth'; // or however auth is accessed

export default function EmployeeAttendancePage({ employee_id }: { employee_id: string }) {
    const { auth } = useAuthContext(); // Get authenticated user from context/props
    
    return (
        <div className="p-6">
            <h1 className="mb-6 text-2xl font-bold">Employee Attendance</h1>
            <AttendanceCalendar 
                employee_id={employee_id} 
                auth={auth}
            />
        </div>
    );
}
```

## Component API

### Permissions

The component automatically determines available actions based on user roles:

```typescript
const userRoles = auth.roles?.map((role) => role.slug.toLowerCase()) || [];

// Can view attendance
const canViewAttendance = userRoles.includes('admin') ||
                         userRoles.includes('manager') ||
                         userRoles.includes('hr') ||
                         userRoles.includes('employee');

// Can manage/override attendance
const canManageAttendance = userRoles.includes('admin') ||
                            userRoles.includes('manager') ||
                            userRoles.includes('hr');
```

### Data Fetching

The component fetches data from: `GET /api/attendance/{employeeId}?month=X&year=Y`

Returns:
```json
{
    "status": "success",
    "data": [
        {
            "id": 1,
            "attendance_date": "2026-04-30",
            "punch_in": "09:30:00",
            "punch_out": "17:45:00",
            "mode": "office"
        }
    ],
    "summary": {
        "total_days": 20,
        "present_days": 18,
        "absent_days": 2,
        "late_days": 3,
        "total_hours": 156.5
    },
    "calendar": {
        "working_hours": {...},
        "holidays": [...]
    },
    "month": 4,
    "year": 2026
}
```

## Error Handling

The component includes comprehensive error handling:

- **No Permission**: Shows error if user lacks access rights
- **Employee Not Found**: Shows message if employee doesn't exist
- **Network Errors**: Displays user-friendly error messages
- **Success Messages**: Shows confirmation when attendance is updated

## Styling

The component uses:
- Tailwind CSS for styling
- Shadcn/ui components (Card, Alert, Button)
- Lucide icons for visual elements
- Dark mode support through Tailwind's dark: prefix

## Related Components

- `MonthYearPicker`: Navigate between months
- `AttendanceSummaryCards`: Display summary statistics
- `AttendanceCalendarGrid`: Display the calendar grid
- `AttendanceOverrideModal`: Edit attendance records (admin only)
- `PunchWidget`: Quick punch in/out for own attendance

## Exports

The component is exported from `@/components/attendance`:

```tsx
export { AttendanceCalendar, type AttendanceCalendarProps } from './AttendanceCalendar';
```
