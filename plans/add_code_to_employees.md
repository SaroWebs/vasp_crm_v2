# Add Employee Code Field

Expose the existing `code` field in the `employees` table across the application to allow administrators to manage unique employee identifiers.

## Proposed Changes

### Backend

#### [MODIFY] [Employee.php](file:///d:/office/VASP_CRM_V2/app/Models/Employee.php)
- Add `code` to the `$fillable` array.

#### [MODIFY] [EmployeeController.php](file:///d:/office/VASP_CRM_V2/app/Http/Controllers/EmployeeController.php)
- **`store` method**: Add validation rule for `code` (`nullable|string|max:50|unique:employees,code`) and include it in the `Employee::create` call.
- **`update` method**: Add validation rule for `code` (`nullable|string|max:50|unique:employees,code,{$employee->id}`) and include it in the `update` call.

#### [NEW] [EmployeeFactory.php](file:///d:/office/VASP_CRM_V2/database/factories/EmployeeFactory.php)
- Create a factory for the `Employee` model, including the `code` field.

#### [NEW] [EmployeeManagementTest.php](file:///d:/office/VASP_CRM_V2/tests/Feature/EmployeeManagementTest.php)
- Create a new feature test to verify CRUD operations for Employees, specifically ensuring the `code` field is correctly handled.

---

### Frontend

#### [MODIFY] [index.d.ts](file:///d:/office/VASP_CRM_V2/resources/js/types/index.d.ts)
- Add `code?: string | null;` to the `Employee` interface.

#### [MODIFY] [Index.tsx](file:///d:/office/VASP_CRM_V2/resources/js/Pages/admin/employees/Index.tsx)
- Add a "Code" column to the employees table header.
- Display the `employee.code` in the table rows.

#### [MODIFY] [Create.tsx](file:///d:/office/VASP_CRM_V2/resources/js/Pages/admin/employees/Create.tsx)
- Add `code: ''` to the `useForm` initial state.
- Add a "Code" input field in the "User Information" card.

#### [MODIFY] [Edit.tsx](file:///d:/office/VASP_CRM_V2/resources/js/Pages/admin/employees/Edit.tsx)
- Add `code: employee.code ?? ''` to the `employeeForm` initial state.
- Add a "Code" input field in the "Employee Information" card.

#### [MODIFY] [Show.tsx](file:///d:/office/VASP_CRM_V2/resources/js/Pages/admin/employees/Show.tsx)
- Update the local `Employee` interface to include `code`.
- Display the "Code" in the "Basic Information" card.

## Verification Plan

### Automated Tests
- I will check if there are existing tests for Employee and update them or create a new one to verify the `code` field is saved correctly.
- Run `php artisan test --filter EmployeeTest` (if exists).

### Manual Verification
- Navigate to the Employees page and verify the "Code" column is visible.
- Create a new employee with a code and verify it's saved.
- Edit an employee's code and verify it's updated.
- View an employee's details and verify the code is displayed.
