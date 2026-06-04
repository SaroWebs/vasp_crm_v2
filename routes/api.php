<?php

use App\Http\Controllers\AttendanceController;
use App\Http\Controllers\EmployeeCategoryController;
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
