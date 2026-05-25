<?php

use App\Http\Controllers\AttendanceController;
use App\Http\Controllers\EmployeeCategoryController;
use App\Http\Controllers\FieldWorkController;
use App\Http\Controllers\HolidayController;
use App\Http\Controllers\HolidayWorkController;
use App\Http\Controllers\LeaveController;
use App\Http\Controllers\LeaveTypeController;
use App\Http\Controllers\RemoteWorkController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

Route::post('/upload_punch_data', [AttendanceController::class, 'uploadPunchData'])
    ->middleware('webhook.password:attendance');
Route::get('/get_categories', [EmployeeCategoryController::class, 'getData'])
    ->middleware('webhook.password:categories');
Route::post('/get_employees', [EmployeeCategoryController::class, 'getEmployees'])
    ->middleware('webhook.password:employees');

// testing route for holidays
Route::prefix('holidays')->controller(HolidayController::class)->group(function () {
    Route::get('/', 'index'); // ?year=2026&type=national
    Route::post('/', 'store'); // date, name, type in body
    Route::patch('/copy_year', 'copyYear'); // from_year, to_year in body
    Route::put('/d/{holiday}', 'update'); // date, name, type in body
    Route::delete('/d/{holiday}', 'destroy');
});

// Leave Types routes
Route::prefix('leave-types')->controller(LeaveTypeController::class)->group(function () {
    Route::get('/', 'index');      // Get all leave types, ?active_only=true
    Route::post('/', 'store');      // Create leave type
    Route::get('/{leaveType}', 'show');       // Get specific leave type
    Route::put('/{leaveType}', 'update');     // Update leave type
    Route::delete('/{leaveType}', 'destroy');  // Delete leave type
});

// Leave Requests routes
Route::prefix('leave-requests')->controller(LeaveController::class)->group(function () {
    Route::get('/', 'index');      // Get leave requests, ?status=pending&employee_id=1&start_date=2026-05-01&end_date=2026-05-31
    Route::post('/', 'store');      // Create leave request
    Route::get('/{leaveRequest}', 'show');     // Get specific leave request
    Route::put('/{leaveRequest}', 'update');   // Update leave request (only if pending)
    Route::delete('/{leaveRequest}', 'destroy'); // Cancel leave request (only if pending)
    Route::post('/{leaveRequest}/approve', 'approve'); // Approve leave request
    Route::post('/{leaveRequest}/reject', 'reject');   // Reject leave request
});

// Employee leave-related routes
Route::prefix('employees/{employee}')->controller(LeaveController::class)->group(function () {
    Route::get('/leave-balance', 'getLeaveBalance');         // Get leave balance, ?year=2026
    Route::get('/leave-requests', 'getEmployeeLeaveRequests'); // Get employee's leave requests, ?status=approved&year=2026
});

// Remote Work Requests routes
Route::prefix('remote-work-requests')->controller(RemoteWorkController::class)->group(function () {
    Route::get('/', 'index');      // List remote work requests, ?status=pending&employee_id=1&start_date=2026-05-01&end_date=2026-05-31
    Route::post('/', 'store');      // Create remote work request
    Route::get('/{remoteWorkRequest}', 'show');     // Get specific remote work request
    Route::put('/{remoteWorkRequest}', 'update');   // Update remote work request (only if pending)
    Route::delete('/{remoteWorkRequest}', 'destroy'); // Cancel remote work request (only if pending)
    Route::post('/{remoteWorkRequest}/approve', 'approve'); // Approve remote work request
    Route::post('/{remoteWorkRequest}/reject', 'reject');   // Reject remote work request
});

// Field Work Assignments routes
Route::prefix('field-work-assignments')->controller(FieldWorkController::class)->group(function () {
    Route::get('/', 'index');      // List field work assignments, ?employee_id=1&active_only=true&location=site
    Route::post('/', 'store');      // Create field work assignment
    Route::get('/{fieldWorkAssignment}', 'show');     // Get specific field work assignment
    Route::put('/{fieldWorkAssignment}', 'update');   // Update field work assignment
    Route::delete('/{fieldWorkAssignment}', 'destroy'); // Delete field work assignment
});

// Holiday Work Records routes
Route::prefix('holiday-work-records')->controller(HolidayWorkController::class)->group(function () {
    Route::get('/', 'index');
    Route::post('/', 'store');
    Route::get('/{holidayWorkRecord}', 'show');
    Route::post('/{holidayWorkRecord}/approve', 'approve');
    Route::post('/{holidayWorkRecord}/reject', 'reject');
    Route::post('/{holidayWorkRecord}/compensatory-off', 'createCompensatoryOff');
});

// Employee remote work, field work, holiday work, and compensatory off routes
Route::prefix('employees/{employee}')->group(function () {
    Route::get('/remote-work-requests', [RemoteWorkController::class, 'getEmployeeRemoteWorkRequests']); // Get employee's remote work requests, ?status=approved&year=2026
    Route::get('/field-work-assignments', [FieldWorkController::class, 'getEmployeeFieldWorkAssignments']); // Get employee's field work assignments, ?year=2026&active_only=true
    Route::get('/holiday-work-records', [HolidayWorkController::class, 'getEmployeeHolidayWork']); // Get employee's holiday work records, ?status=approved&year=2026
    Route::get('/compensatory-offs', [HolidayWorkController::class, 'getCompensatoryOffs']); // Get employee's compensatory off records, ?status=available
});
