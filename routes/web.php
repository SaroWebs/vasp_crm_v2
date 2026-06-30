<?php

use App\Http\Controllers\ActivityLogController;
use App\Http\Controllers\AdminAuthController;
use App\Http\Controllers\AdminDashboardController;
use App\Http\Controllers\AdminPasswordResetController;
use App\Http\Controllers\AdminTaskController;
use App\Http\Controllers\AdminTaskTimeEntryController;
use App\Http\Controllers\AdminTicketController;
use App\Http\Controllers\AttendanceController;
use App\Http\Controllers\Client\ClientCommentAttachmentController;
use App\Http\Controllers\Client\ClientPortalAuthController;
use App\Http\Controllers\Client\ClientTicketCommentController;
use App\Http\Controllers\Client\ClientTicketController;
use App\Http\Controllers\ClientController;
use App\Http\Controllers\ClientSsoController;
use App\Http\Controllers\CommentAttachmentController;
use App\Http\Controllers\DepartmentController;
use App\Http\Controllers\EmployeeController;
use App\Http\Controllers\EmployeeProgressController;
use App\Http\Controllers\FieldWorkController;
use App\Http\Controllers\FieldWorkRequestController;
use App\Http\Controllers\HolidayController;
use App\Http\Controllers\HolidayWorkController;
use App\Http\Controllers\LeaveBalanceController;
use App\Http\Controllers\LeaveController;
use App\Http\Controllers\LeaveTypeController;
use App\Http\Controllers\MenuManagementController;
use App\Http\Controllers\MonthlyCycleRuleController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\OrganizationUserController;
use App\Http\Controllers\PermissionController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\ProjectAttachmentController;
use App\Http\Controllers\ProjectController;
use App\Http\Controllers\ProjectPhaseController;
use App\Http\Controllers\ProjectTimelineController;
use App\Http\Controllers\RemoteWorkAssignmentController;
use App\Http\Controllers\RemoteWorkController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\RoleController;
use App\Http\Controllers\SalesLeadController;
use App\Http\Controllers\ShiftController;
use App\Http\Controllers\TaskAssignmentController;
use App\Http\Controllers\TaskAttachmentController;
use App\Http\Controllers\TaskCommentController;
use App\Http\Controllers\TaskController;
use App\Http\Controllers\TaskDependencyController;
use App\Http\Controllers\TaskForwardingController;
use App\Http\Controllers\TicketCommentController;
use App\Http\Controllers\TimelineEventController;
use App\Http\Controllers\TimeTrackingController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\UserTaskController;
use App\Http\Controllers\VisitorController;
use App\Http\Controllers\WorkloadMatrixController;
use App\Models\Client;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('welcome');
})->name('home');

Route::get('/sample', [UserController::class, 'test'])->name('sample');

Route::get('/testx/{client:code}', function (Client $client) {
    $client->load('product');

    return response()->json([
        'client' => $client,
    ]);
});

Route::get('/link', function () {
    Artisan::call('storage:link');

    return response()->json(['status' => 'Storage linked']);
});

Route::get('/s/{code}', [ClientSsoController::class, 'consume'])->name('sso.consume');

Route::get('/c/{client:code}/logout', function (Client $client) {
    return inertia('client/Logout');
})->name('client.logout.page');

Route::prefix('c/{client:code}')
    ->name('client.')
    ->middleware(['web', 'auth:organization', 'organization.client'])
    ->group(function () {
        Route::get('/', function (Request $request, $client) {
            return redirect()->route('client.tickets.index', $client);
        })->name('dashboard');

        Route::post('/logout', [ClientPortalAuthController::class, 'logout'])->name('logout');

        Route::controller(ClientTicketController::class)->group(function () {
            Route::get('/tickets', 'index')->name('tickets.index');
            Route::get('/tickets/create', 'create')->name('tickets.create');
            Route::post('/tickets', 'store')->name('tickets.store');
            Route::get('/tickets/{ticket}', 'show')->name('tickets.show');
            Route::get('/tickets/{ticket}/edit', 'edit')->name('tickets.edit');
            Route::patch('/tickets/{ticket}', 'update')->name('tickets.update');
            Route::delete('/tickets/{ticket}', 'destroy')->name('tickets.destroy');
            Route::post('/tickets/{ticket}/reopen', 'reopen')->name('tickets.reopen');
        });

        Route::controller(ClientTicketCommentController::class)->group(function () {
            Route::get('/tickets/{ticket}/comments', 'index')->name('tickets.comments.index');
            Route::post('/tickets/{ticket}/comments', 'store')->name('tickets.comments.store');
            Route::patch('/tickets/{ticket}/comments/{comment}', 'update')->name('tickets.comments.update');
            Route::delete('/tickets/{ticket}/comments/{comment}', 'destroy')->name('tickets.comments.destroy');
        });

        Route::delete('/tickets/{ticket}/comments/{comment}/attachments/{attachment}', [ClientCommentAttachmentController::class, 'destroy'])
            ->name('comments.attachments.destroy');
    });

// Admin routes with /admin prefix - using AdminAuthController
Route::prefix('admin')->name('admin.')->middleware(['web'])->group(function () {
    Route::get('/login', [AdminAuthController::class, 'showLoginForm'])->name('login');
    Route::post('/login', [AdminAuthController::class, 'login'])->name('login.attempt');

    Route::get('/forgot-password', [AdminPasswordResetController::class, 'create'])->name('password.request');
    Route::post('/forgot-password', [AdminPasswordResetController::class, 'store'])->name('password.email');
    Route::get('/reset-password/{token}', [AdminPasswordResetController::class, 'edit'])->name('password.reset');
    Route::post('/reset-password', [AdminPasswordResetController::class, 'update'])->name('password.update');

    Route::middleware(['admin'])->group(function () {
        Route::get('/dashboard', [AdminDashboardController::class, 'index'])->name('dashboard');
        Route::get('/sales-leads', [SalesLeadController::class, 'adminIndex'])->name('sales-leads.index');
        Route::get('/data/sales-leads', [SalesLeadController::class, 'adminData'])->name('sales-leads.data');
        Route::get('/data/sales-leads/report', [SalesLeadController::class, 'adminReport'])->name('sales-leads.report');
        Route::get('/sales-leads/export', [SalesLeadController::class, 'adminExport'])->name('sales-leads.export');
        Route::post('/sales-leads', [SalesLeadController::class, 'adminStore'])->name('sales-leads.store');
        Route::get('/sales-leads/{salesLead}', [SalesLeadController::class, 'adminShow'])->name('sales-leads.show');
        Route::patch('/sales-leads/{salesLead}', [SalesLeadController::class, 'adminUpdate'])->name('sales-leads.update');
        Route::delete('/sales-leads/{salesLead}', [SalesLeadController::class, 'adminDestroy'])->name('sales-leads.destroy');
        Route::post('/sales-leads/{salesLead}/convert', [SalesLeadController::class, 'adminConvert'])->name('sales-leads.convert');
        Route::post('/sales-leads/{salesLead}/activities', [SalesLeadController::class, 'adminStoreActivity'])->name('sales-leads.activities.store');
        Route::post('/sales-leads/{salesLead}/complete-follow-up', [SalesLeadController::class, 'adminCompleteFollowUp'])->name('sales-leads.follow-up.complete');
        Route::post('/sales-leads/{salesLead}/close-deal', [SalesLeadController::class, 'adminCloseDeal'])->name('sales-leads.close-deal');
        Route::post('/sales-leads/reminders/send', [SalesLeadController::class, 'adminSendReminders'])->name('sales-leads.reminders.send');

        // Dashboard API endpoints
        Route::get('/api/dashboard/stats', [AdminDashboardController::class, 'getStats'])->name('api.dashboard.stats');
        Route::get('/api/dashboard/tickets', [AdminDashboardController::class, 'getTickets'])->name('api.dashboard.tickets');
        Route::get('/api/dashboard/tasks', [AdminDashboardController::class, 'getTasks'])->name('api.dashboard.tasks');
        Route::get('/api/dashboard/activities', [AdminDashboardController::class, 'getActivities'])->name('api.dashboard.activities');
        Route::get('/api/dashboard/chart-data', [AdminDashboardController::class, 'getChartData'])->name('api.dashboard.chart-data');
        Route::get('/api/dashboard/recent-reports', [AdminDashboardController::class, 'getRecentReports'])->name('api.dashboard.recent-reports');
        Route::post('/logout', [AdminAuthController::class, 'logout'])->name('logout');
        Route::get('/logout', [AdminAuthController::class, 'logout'])->name('logout.get');

        // Client routes (used in frontend)
        Route::controller(ClientController::class)->group(function () {
            Route::get('/clients', 'index');
            Route::get('/data/clients', 'getData')->name('clients.data');
            Route::get('/clients/create', 'create')->name('clients.create');
            Route::post('/clients', 'store');
            Route::get('/clients/{client}', 'show');
            Route::get('/clients/{client}/edit', 'edit')->name('clients.edit');
            Route::patch('/clients/{client}', 'update');
            Route::delete('/clients/{client}', 'destroy');
            Route::post('/clients/{client}/restore', 'restore');
            Route::delete('/clients/{client}/force-delete', 'forceDelete');
            Route::get('/clients/{client}/organization-users', 'getClientOrganizationUsers');
        });

        // Client organization users (manage)
        Route::controller(OrganizationUserController::class)->group(function () {
            Route::get('/clients/{client}/organization-users/manage', 'index')->name('clients.organization-users.index');
            Route::post('/clients/{client}/organization-users', 'store')->name('clients.organization-users.store');
            Route::patch('/clients/{client}/organization-users/{organizationUser}', 'update')->name('clients.organization-users.update');
            Route::delete('/clients/{client}/organization-users/{organizationUser}', 'destroy')->name('clients.organization-users.destroy');
        });

        // Project Management Routes
        Route::get('/projects', [ProjectController::class, 'index'])->name('projects.index');
        Route::get('/projects/list', [ProjectController::class, 'index'])->name('projects.list');
        Route::get('/projects/create', [ProjectController::class, 'create'])->name('projects.create');
        Route::post('/projects', [ProjectController::class, 'store'])->name('projects.store');
        Route::get('/projects/{project}', [ProjectController::class, 'show'])->name('projects.show');
        Route::get('/projects/{project}/edit', [ProjectController::class, 'edit'])->name('projects.edit');
        Route::patch('/projects/{project}', [ProjectController::class, 'update'])->name('projects.update');
        Route::delete('/projects/{project}', [ProjectController::class, 'destroy'])->name('projects.destroy');
        Route::post('/projects/{project}/restore', [ProjectController::class, 'restore'])->name('projects.restore');
        Route::get('/projects/{project}/statistics', [ProjectController::class, 'getStatistics'])->name('projects.statistics');
        Route::post('/projects/{project}/progress', [ProjectController::class, 'updateProgress'])->name('projects.progress.update');
        Route::get('/projects/{project}/gantt', [ProjectController::class, 'getGanttData'])->name('projects.gantt');

        // Project Team
        Route::get('/projects/{project}/team', [ProjectController::class, 'getTeam'])->name('projects.team');
        Route::post('/projects/{project}/team', [ProjectController::class, 'addTeamMember'])->name('projects.team.add');
        Route::delete('/projects/{project}/team/{user}', [ProjectController::class, 'removeTeamMember'])->name('projects.team.remove');
        Route::patch('/projects/{project}/team/{user}', [ProjectController::class, 'updateTeamMemberRole'])->name('projects.team.update-role');

        // Project Phases
        Route::get('/projects/{project}/phases', [ProjectPhaseController::class, 'index'])->name('projects.phases.index');
        Route::post('/projects/{project}/phases', [ProjectPhaseController::class, 'store'])->name('projects.phases.store');
        Route::get('/projects/{project}/phases/{phase}', [ProjectPhaseController::class, 'show'])->name('projects.phases.show');
        Route::patch('/projects/{project}/phases/{phase}', [ProjectPhaseController::class, 'update'])->name('projects.phases.update');
        Route::delete('/projects/{project}/phases/{phase}', [ProjectPhaseController::class, 'destroy'])->name('projects.phases.destroy');
        Route::post('/projects/{project}/phases/reorder', [ProjectPhaseController::class, 'reorder'])->name('projects.phases.reorder');
        Route::post('/projects/{project}/phases/{phase}/complete', [ProjectPhaseController::class, 'complete'])->name('projects.phases.complete');
        Route::get('/projects/{project}/phases/{phase}/tasks', [ProjectPhaseController::class, 'getTasks'])->name('projects.phases.tasks');
        Route::post('/projects/{project}/phases/{phase}/update-progress', [ProjectPhaseController::class, 'updateProgress'])->name('projects.phases.update-progress');

        // Project Timeline Events
        Route::get('/projects/{project}/timeline', [ProjectTimelineController::class, 'index'])->name('projects.timeline.index');
        Route::post('/projects/{project}/timeline', [ProjectTimelineController::class, 'store'])->name('projects.timeline.store');
        Route::get('/projects/{project}/timeline/{timelineEvent}', [ProjectTimelineController::class, 'show'])->name('projects.timeline.show');
        Route::patch('/projects/{project}/timeline/{timelineEvent}', [ProjectTimelineController::class, 'update'])->name('projects.timeline.update');
        Route::delete('/projects/{project}/timeline/{timelineEvent}', [ProjectTimelineController::class, 'destroy'])->name('projects.timeline.destroy');
        Route::post('/projects/{project}/timeline/{timelineEvent}/complete', [ProjectTimelineController::class, 'complete'])->name('projects.timeline.complete');
        Route::get('/projects/{project}/timeline/milestones', [ProjectTimelineController::class, 'milestones'])->name('projects.timeline.milestones');
        Route::get('/projects/{project}/timeline/type/{type}', [ProjectTimelineController::class, 'byType'])->name('projects.timeline.by-type');

        // Project Attachments
        Route::get('/projects/{project}/attachments', [ProjectAttachmentController::class, 'index'])->name('projects.attachments.index');
        Route::post('/projects/{project}/attachments', [ProjectAttachmentController::class, 'store'])->name('projects.attachments.store');
        Route::get('/projects/{project}/attachments/{attachment}', [ProjectAttachmentController::class, 'show'])->name('projects.attachments.show');
        Route::get('/projects/{project}/attachments/{attachment}/download', [ProjectAttachmentController::class, 'download'])->name('projects.attachments.download');
        Route::get('/projects/{project}/attachments/{attachment}/preview', [ProjectAttachmentController::class, 'preview'])->name('projects.attachments.preview');
        Route::patch('/projects/{project}/attachments/{attachment}', [ProjectAttachmentController::class, 'update'])->name('projects.attachments.update');
        Route::delete('/projects/{project}/attachments/{attachment}', [ProjectAttachmentController::class, 'destroy'])->name('projects.attachments.destroy');

        // Product management routes (used in frontend)
        Route::controller(ProductController::class)->group(function () {
            Route::get('/products', 'index')->name('products.index');
            Route::get('/products/create', 'create')->name('products.create');
            Route::post('/products', 'store')->name('products.store');
            Route::get('/products/{product}', 'show')->name('products.show');
            Route::get('/products/{product}/edit', 'edit')->name('products.edit');
            Route::patch('/products/{product}', 'update')->name('products.update');
            Route::delete('/products/{product}', 'destroy')->name('products.destroy');
            Route::post('/products/{product}/restore', 'restore')->name('products.restore');
        });

        Route::prefix('client/{client}')->name('clients.')->group(function () {
            Route::get('/next-ticket-number', [AdminTicketController::class, 'getNextTicketNumber'])->name('tickets.number');
        });

        // Ticket routes (used in frontend)
        Route::get('/tickets', [AdminTicketController::class, 'index']);
        Route::get('/tickets/export', [AdminTicketController::class, 'exportTickets'])->name('tickets.export');
        Route::get('/data/tickets', [AdminTicketController::class, 'data'])->name('tickets.index-data');
        Route::get('/data/tickets/stats', [AdminTicketController::class, 'stats'])->name('tickets.stats');
        Route::get('/data/tickets/{ticket}', [AdminTicketController::class, 'getTicketData'])->name('tickets.data');
        Route::post('/tickets', [AdminTicketController::class, 'store']);
        Route::get('/tickets/{ticket}', [AdminTicketController::class, 'show'])->name('tickets.show');
        Route::get('/tickets/{ticket}/edit', [AdminTicketController::class, 'edit'])->name('tickets.edit');
        Route::patch('/tickets/{ticket}', [AdminTicketController::class, 'update']);
        Route::delete('/tickets/{ticket}', [AdminTicketController::class, 'destroy']);
        Route::post('/tickets/{ticket}/restore', [AdminTicketController::class, 'restore']);

        // Ticket comment routes (used in frontend)
        Route::get('/tickets/{ticket}/comments', [TicketCommentController::class, 'index'])->name('tickets.comments.index');
        Route::post('/tickets/{ticket}/comments', [TicketCommentController::class, 'store'])->name('tickets.comments.store');
        Route::patch('/tickets/{ticket}/comments/{comment}', [TicketCommentController::class, 'update'])->name('tickets.comments.update');
        Route::delete('/tickets/{ticket}/comments/{comment}', [TicketCommentController::class, 'destroy'])->name('tickets.comments.destroy');

        // Deleted comment routes (superadmin only) (used in frontend)
        Route::get('/tickets/{ticket}/comments/deleted', [TicketCommentController::class, 'getDeletedComments'])->name('tickets.comments.deleted');
        Route::patch('/tickets/{ticket}/comments/{comment}/restore', [TicketCommentController::class, 'restoreComment'])->name('tickets.comments.restore');
        Route::delete('/tickets/{ticket}/comments/{comment}/force-delete', [TicketCommentController::class, 'forceDeleteComment'])->name('tickets.comments.force-delete');

        // Comment attachment routes (used in frontend)
        Route::delete('/tickets/{ticket}/comments/{comment}/attachments/{attachment}', [CommentAttachmentController::class, 'destroy'])->name('comments.attachments.destroy');

        Route::post('/ticket/{ticket}/assign', [AdminTicketController::class, 'assignTicket'])->name('ticket.assign');
        Route::get('/tickets/{ticket}/history', [AdminTicketController::class, 'getTicketHistory'])->name('tickets.history');
        // Ticket approval workflow routes (used in frontend)
        Route::post('/tickets/{ticket}/approve', [AdminTicketController::class, 'approve']);
        Route::post('/tickets/{ticket}/reject', [AdminTicketController::class, 'reject']);
        Route::get('/tickets/approval-queue', [AdminTicketController::class, 'getTicketsForApproval']);
        Route::patch('/tickets/{ticket}/status', [AdminTicketController::class, 'updateStatus']);
        Route::get('/tickets/{ticket}/check-tasks', [AdminTicketController::class, 'checkTaskStatus']);

        Route::get('/tasks/export', [AdminTaskController::class, 'exportTasks'])->name('tasks.export');

        // Admin Task management routes (web pages)
        Route::get('/tasks', [AdminTaskController::class, 'index'])->name('tasks.admin.index');
        Route::get('/data/tasks', [AdminTaskController::class, 'getData'])->name('tasks.admin.data');
        Route::post('/tasks', [AdminTaskController::class, 'store'])->name('tasks.admin.store');
        Route::get('/tasks/create', [AdminTaskController::class, 'create'])->name('tasks.admin.create');
        Route::get('/tasks/{task}', [AdminTaskController::class, 'show'])->name('tasks.admin.show');
        Route::get('/tasks/{task}/edit', [AdminTaskController::class, 'edit'])->name('tasks.admin.edit');
        Route::patch('/tasks/{task}', [AdminTaskController::class, 'update'])->name('tasks.admin.update');
        Route::delete('/tasks/{task}', [AdminTaskController::class, 'destroy'])->name('tasks.admin.destroy');
        Route::patch('/tasks/{task}/status', [AdminTaskController::class, 'updateStatus'])->name('tasks.admin.update-status');
        Route::get('/tasks/{task}/history', [AdminTaskController::class, 'getTaskHistory'])->name('tasks.admin.history');
        Route::post('/tasks/{task}/restore', [AdminTaskController::class, 'restore'])->name('tasks.admin.restore');
        Route::delete('/tasks/{task}/force-delete', [AdminTaskController::class, 'forceDelete'])->name('tasks.admin.force-delete');
        Route::patch('/tasks/{task}/dates', [AdminTaskController::class, 'updateDates'])->name('tasks.admin.update-dates');

        // Admin task time entries (manual add + gantt adjustments)
        Route::post('/tasks/{task}/time-entries/manual', [AdminTaskTimeEntryController::class, 'store'])
            ->name('tasks.admin.time-entries.manual.store');
        Route::patch('/tasks/{task}/time-entries/batch', [AdminTaskTimeEntryController::class, 'batchUpdate'])
            ->name('tasks.admin.time-entries.batch.update');
        Route::delete('/tasks/{task}/time-entries/{timeEntry}', [AdminTaskTimeEntryController::class, 'destroy'])
            ->name('tasks.admin.time-entries.destroy');

        // Task assignment routes within admin
        Route::get('/tasks/{task}/available-users', [TaskAssignmentController::class, 'getAvailableUsers']);
        Route::post('/tasks/{task}/assign', [TaskAssignmentController::class, 'assignUserToTask']);

        // SLA policies by task type route
        Route::get('/tasks/sla-policies/{taskTypeId}', [AdminTaskController::class, 'getSlaPoliciesByTaskType'])->name('tasks.admin.sla-policies');

        // Department management routes (used in frontend)
        Route::get('/departments', [DepartmentController::class, 'index'])->name('departments.index');
        Route::post('/departments', [DepartmentController::class, 'store'])->name('departments.store');
        Route::get('/departments/create', [DepartmentController::class, 'create'])->name('departments.create');
        Route::get('/departments/data', [DepartmentController::class, 'getData'])->name('departments.data');

        // Department user management routes (must come before wildcard routes) (used in frontend)
        Route::get('/departments/available-users', [DepartmentController::class, 'getAvailableUsers'])->name('departments.available-users');
        Route::post('/departments/{department}/assign-user', [DepartmentController::class, 'assignUser'])->name('departments.assign-user');
        Route::delete('/departments/{department}/remove-user/{user}', [DepartmentController::class, 'removeUser'])->name('departments.remove-user');
        Route::get('/departments/{department}/statistics', [DepartmentController::class, 'getStatistics'])->name('departments.statistics');
        Route::post('/departments/{department}/bulk-assign', [DepartmentController::class, 'bulkAssignUsers'])->name('departments.bulk-assign');

        // Wildcard department routes (must come after specific routes) (used in frontend)
        Route::get('/departments/{department}', [DepartmentController::class, 'show'])->name('departments.show');
        Route::get('/departments/{department}/edit', [DepartmentController::class, 'edit'])->name('departments.edit');
        Route::patch('/departments/{department}', [DepartmentController::class, 'update'])->name('departments.update');
        Route::delete('/departments/{department}', [DepartmentController::class, 'destroy'])->name('departments.destroy');

        // Notification routes (used in frontend)
        Route::get('/notifications', [NotificationController::class, 'index'])->name('notifications.index');
        Route::get('/notifications/data', [NotificationController::class, 'data'])->name('notifications.data');
        Route::patch('/notifications/{notification}/read', [NotificationController::class, 'markAsRead'])->name('notifications.mark-read');
        Route::post('/notifications/mark-all-read', [NotificationController::class, 'markAllAsRead'])->name('notifications.mark-all-read');

        // Menu visibility management routes (admin only)
        Route::get('/menu', [MenuManagementController::class, 'index'])->name('menu.index');
        Route::put('/menu', [MenuManagementController::class, 'update'])->name('menu.update');

        // Roles and Permissions routes (used in frontend)
        Route::get('/roles-permissions', [RoleController::class, 'index'])->name('roles-permissions.index');
        Route::get('/roles', [RoleController::class, 'index'])->name('roles.index');
        Route::get('/roles/create', [RoleController::class, 'create'])->name('roles.create');
        Route::post('/roles', [RoleController::class, 'store'])->name('roles.store');
        Route::get('/roles/{role}', [RoleController::class, 'show'])->name('roles.show');
        Route::get('/roles/{role}/edit', [RoleController::class, 'edit'])->name('roles.edit');
        Route::patch('/roles/{role}', [RoleController::class, 'update'])->name('roles.update');
        Route::delete('/roles/{role}', [RoleController::class, 'destroy'])->name('roles.destroy');

        // Role Permission management routes (used in frontend)
        Route::post('/roles/{role}/permissions', [RoleController::class, 'addPermissions'])->name('roles.add-permissions');
        Route::delete('/roles/{role}/permissions/{permission}', [RoleController::class, 'removePermission'])->name('roles.remove-permission');

        // Permission routes (used in frontend)
        Route::get('/permissions', [PermissionController::class, 'index'])->name('permissions.index');
        Route::get('/permissions/create', [PermissionController::class, 'create'])->name('permissions.create');
        Route::post('/permissions', [PermissionController::class, 'store'])->name('permissions.store');
        Route::get('/permissions/{permission}', [PermissionController::class, 'show'])->name('permissions.show');
        Route::get('/permissions/{permission}/edit', [PermissionController::class, 'edit'])->name('permissions.edit');
        Route::patch('/permissions/{permission}', [PermissionController::class, 'update'])->name('permissions.update');
        Route::delete('/permissions/{permission}', [PermissionController::class, 'destroy'])->name('permissions.destroy');

        // User management routes (used in frontend)
        Route::get('/users', [UserController::class, 'index'])->name('users.index');
        Route::get('/users/create', [UserController::class, 'create'])->name('users.create');
        Route::post('/users', [UserController::class, 'store'])->name('users.store');
        Route::get('/users/{user}', [UserController::class, 'show'])->name('users.show');
        Route::get('/users/{user}/edit', [UserController::class, 'edit'])->name('users.edit');
        Route::patch('/users/{user}', [UserController::class, 'update'])->name('users.update');
        Route::delete('/users/{user}', [UserController::class, 'destroy'])->name('users.destroy');

        Route::get('/data/users/assignment', [UserController::class, 'getUsersForAssignment'])->name('users.assignment');

        // User role management routes (used in frontend)
        Route::post('/users/{user}/roles', [UserController::class, 'assignRoles'])->name('users.assign-roles');

        // User permission management routes (used in frontend)
        Route::post('/users/{user}/permissions/grant', [UserController::class, 'grantPermission'])->name('users.grant-permission');
        Route::post('/users/{user}/permissions/deny', [UserController::class, 'denyPermission'])->name('users.deny-permission');
        Route::post('/users/{user}/permissions/revoke', [UserController::class, 'revokePermission'])->name('users.revoke-permission');
        Route::post('/users/{user}/permissions/bulk-manage', [UserController::class, 'bulkManagePermissions'])->name('users.bulk-manage-permissions');

        // Employee management routes (used in frontend)
        Route::get('/employees', [EmployeeController::class, 'index'])->name('employees.index');
        Route::get('/api/employees', [EmployeeController::class, 'getList'])->name('api.employees.list');
        Route::get('/employees/create', [EmployeeController::class, 'create'])->name('employees.create');
        Route::post('/employees', [EmployeeController::class, 'store'])->name('employees.store');
        Route::get('/employees/{employee}', [EmployeeController::class, 'show'])->name('employees.show');
        Route::get('/employees/{employee}/edit', [EmployeeController::class, 'edit'])->name('employees.edit');
        Route::patch('/employees/{employee}', [EmployeeController::class, 'update'])->name('employees.update');
        Route::patch('/employees/{employee}/roles', [EmployeeController::class, 'updateRoles'])->name('employees.update-roles');
        Route::delete('/employees/{employee}', [EmployeeController::class, 'destroy'])->name('employees.destroy');

        // Visitor management routes (used in frontend)
        Route::get('/visitors', [VisitorController::class, 'index'])->name('visitors.index');
        Route::post('/visitors', [VisitorController::class, 'store'])->name('visitors.store');
        Route::get('/visitors/{visitor}', [VisitorController::class, 'show'])->name('visitors.show');
        Route::patch('/visitors/{visitor}', [VisitorController::class, 'update'])->name('visitors.update');
        Route::delete('/visitors/{visitor}', [VisitorController::class, 'destroy'])->name('visitors.destroy');
        Route::get('/visitors/{visitor}/punches', [VisitorController::class, 'getPunchHistory'])->name('visitors.punch-history');
        Route::post('/visitors/bulk-delete', [VisitorController::class, 'bulkDelete'])->name('visitors.bulk-delete');
        Route::post('/visitors/bulk-toggle-active', [VisitorController::class, 'bulkToggleActive'])->name('visitors.bulk-toggle-active');

        // Employee progress routes
        Route::get('/employee-progress', [EmployeeProgressController::class, 'showEmployeeProgressPanel'])->name('employee.progress');
        Route::get('/api/employee-progress', [EmployeeProgressController::class, 'getEmployeeProgressData'])->name('api.employee.progress');
        Route::get('/api/employee-progress/stats', [EmployeeProgressController::class, 'getEmployeeProgressStats'])->name('api.employee.progress.stats');

        // Attendance management routes (admin)
        Route::get('/attendance', [AttendanceController::class, 'adminIndex'])->name('attendance.index');
        Route::get('/attendance/summary', [AttendanceController::class, 'adminSummaryPage'])->name('attendance.summary');
        Route::get('/employee-attendance/{employee}', [AttendanceController::class, 'adminGetEmployeeAttendance'])->name('api.attendance.employee');
        Route::get('/api/attendance/summary', [AttendanceController::class, 'adminGetAllAttendanceSummary'])->name('api.attendance.summary');
        Route::get('/api/attendance/date', [AttendanceController::class, 'getAttendanceByDate'])->name('api.attendance.byDate');
        Route::post('/api/attendance/{employee}/override', [AttendanceController::class, 'adminOverrideAttendance'])->name('api.attendance.override');
        Route::delete('/api/attendance/{attendance}', [AttendanceController::class, 'adminDeleteAttendance'])->name('api.attendance.delete');

        // Op Month Cycle Rules
        Route::get('/attendance/cycle-rules', [MonthlyCycleRuleController::class, 'page'])->name('attendance.cycle-rules');
        Route::get('/api/attendance/cycle-rules', [MonthlyCycleRuleController::class, 'index'])->name('api.attendance.cycle-rules.index');
        Route::post('/api/attendance/cycle-rules', [MonthlyCycleRuleController::class, 'store'])->name('api.attendance.cycle-rules.store');
        Route::put('/api/attendance/cycle-rules/{monthlyCycleRule}', [MonthlyCycleRuleController::class, 'update'])->name('api.attendance.cycle-rules.update');
        Route::get('/api/attendance/cycle-rules/preview', [MonthlyCycleRuleController::class, 'preview'])->name('api.attendance.cycle-rules.preview');
        Route::get('/api/attendance/op-month/current', [MonthlyCycleRuleController::class, 'currentOpMonth'])->name('api.attendance.op-month.current');
        Route::get('/api/attendance/op-month/resolve', [MonthlyCycleRuleController::class, 'resolveDate'])->name('api.attendance.op-month.resolve');
        Route::get('/api/attendance/op-months', [MonthlyCycleRuleController::class, 'listOpMonths'])->name('api.attendance.op-months');

        Route::get('/shifts', [ShiftController::class, 'index'])->name('shifts.index');
        Route::get('/api/shifts', [ShiftController::class, 'shifts'])->name('api.shifts.list');
        Route::post('/api/shifts', [ShiftController::class, 'storeShift'])->name('api.shifts.store');
        Route::patch('/api/shifts/{shift}', [ShiftController::class, 'updateShift'])->name('api.shifts.update');
        Route::delete('/api/shifts/{shift}', [ShiftController::class, 'destroyShift'])->name('api.shifts.destroy');
        Route::get('/api/shift-assignments', [ShiftController::class, 'assignments'])->name('api.shift-assignments.list');
        Route::post('/api/shift-assignments', [ShiftController::class, 'storeAssignment'])->name('api.shift-assignments.store');
        Route::patch('/api/shift-assignments/{assignment}', [ShiftController::class, 'updateAssignment'])->name('api.shift-assignments.update');
        Route::delete('/api/shift-assignments/{assignment}', [ShiftController::class, 'destroyAssignment'])->name('api.shift-assignments.destroy');
        Route::get('/api/shifts/employees', [ShiftController::class, 'employees'])->name('api.shifts.employees');

        // Workload matrix routes
        Route::get('/workload-matrix', [WorkloadMatrixController::class, 'index'])->name('workload-matrix.index');
        Route::get('/api/workload-matrix', [WorkloadMatrixController::class, 'data'])->name('api.workload-matrix');
        Route::get('/api/workload-matrix/tasks', [WorkloadMatrixController::class, 'tasks'])->name('api.workload-matrix.tasks');
        Route::get('/api/workload-matrix/export', [WorkloadMatrixController::class, 'export'])->name('api.workload-matrix.export');

        // Reports routes
        Route::get('/reports', [ReportController::class, 'index'])->name('reports.index');
        Route::get('/reports/{report}/edit', [ReportController::class, 'edit'])->name('reports.edit');
        Route::get('/reports/{report}', [ReportController::class, 'show'])->name('reports.show');
        Route::get('/api/reports/employees', [ReportController::class, 'getEmployees'])->name('api.reports.employees');

        // New reports system routes
        Route::post('/api/reports', [ReportController::class, 'store'])->name('api.reports.store');
        Route::get('/api/reports/daily/{date}', [ReportController::class, 'getDailyReportAll'])->name('api.reports.daily.all');
        Route::get('/api/reports/daily/{userId}/{date}', [ReportController::class, 'getDailyReport'])->name('api.reports.daily');
        Route::post('/api/reports/{reportId}/tasks/{taskId}', [ReportController::class, 'connectTaskToReport'])->name('api.reports.connect-task');
        Route::delete('/api/reports/{reportId}/tasks/{taskId}', [ReportController::class, 'disconnectTaskFromReport'])->name('api.reports.disconnect-task');
        Route::post('/api/reports/{reportId}/attachments', [ReportController::class, 'addAttachment'])->name('api.reports.add-attachment');
        Route::get('/api/reports/employee/{userId}', [ReportController::class, 'getEmployeeReports'])->name('api.reports.employee');
        Route::get('/api/reports/all', [ReportController::class, 'getAllReports'])->name('api.reports.all');
        Route::patch('/api/reports/{reportId}', [ReportController::class, 'update'])->name('api.reports.update');
        Route::delete('/api/reports/{reportId}', [ReportController::class, 'destroy'])->name('api.reports.destroy');
        Route::delete('/api/reports/{reportId}/attachments/{attachmentId}', [ReportController::class, 'deleteAttachment'])->name('api.reports.delete-attachment');

        // Consolidated reports route
        Route::get('/api/reports/consolidated', [ReportController::class, 'getConsolidatedReports'])->name('api.reports.consolidated');
        Route::get('/api/reports/consolidated/export', [ReportController::class, 'exportConsolidatedReports'])->name('api.reports.consolidated.export');

        // Remote Work Assignments routes (admin-direct assignment)
        Route::prefix('remote-work-assignments')->controller(RemoteWorkAssignmentController::class)->group(function () {
            Route::post('/', 'store')->name('admin.remote-work-assignments.store');      // Create remote work assignment
            Route::put('/{remoteWorkAssignment}', 'update')->name('admin.remote-work-assignments.update'); // Update remote work assignment
            Route::delete('/{remoteWorkAssignment}', 'destroy')->name('admin.remote-work-assignments.destroy'); // Delete remote work assignment
        });

        // Field Work Assignments routes (admin-direct assignment)
        Route::prefix('field-work-assignments')->controller(FieldWorkController::class)->group(function () {
            Route::post('/', 'store')->name('admin.field-work-assignments.store');      // Create field work assignment
            Route::put('/{fieldWorkAssignment}', 'update')->name('admin.field-work-assignments.update');   // Update field work assignment
            Route::delete('/{fieldWorkAssignment}', 'destroy')->name('admin.field-work-assignments.destroy'); // Delete field work assignment
            Route::post('/{fieldWorkAssignment}/approve', 'approve')->name('admin.field-work-assignments.approve'); // Approve field work assignment
            Route::post('/{fieldWorkAssignment}/reject', 'reject')->name('admin.field-work-assignments.reject'); // Reject field work assignment
        });

        // Leave Types management route
        Route::get('/leave-types', function () {
            return Inertia::render('admin/leave-types/Index');
        })->name('leave-types.index');

        // Holiday management route
        Route::get('/holidays', function () {
            return Inertia::render('admin/holidays/Index');
        })->name('holidays.index');
    });
});

Route::middleware(['web', 'auth', 'admin'])->group(function () {
    Route::get('/api/notifications', [NotificationController::class, 'data'])->name('api.notifications.data');
    Route::get('/api/notifications/unread-count', [NotificationController::class, 'getUnreadCount'])->name('api.notifications.unread-count');
    Route::get('/api/notifications/recent', [NotificationController::class, 'getRecent'])->name('api.notifications.recent');

    Route::post('/api/notifications/{notification}/mark-read', [NotificationController::class, 'markAsRead'])->name('api.notifications.mark-read');
    Route::post('/api/notifications/mark-all-read', [NotificationController::class, 'markAllAsRead'])->name('api.notifications.mark-all-read');
    Route::post('/api/notifications/bulk-mark-read', [NotificationController::class, 'bulkMarkAsRead'])->name('api.notifications.bulk-mark-read');

    Route::delete('/api/notifications/{notification}', [NotificationController::class, 'destroy'])->name('api.notifications.destroy');
    Route::delete('/api/notifications/bulk-delete', [NotificationController::class, 'bulkDelete'])->name('api.notifications.bulk-delete');

    // Self-assigned task routes for users to create tasks for themselves
    Route::post('/self/tasks', [TaskController::class, 'storeSelfAssigned'])->name('tasks.self.store');

    // Task management routes (used in frontend - API routes)
    Route::get('/data/my/tasks', [TaskController::class, 'getMyTasks'])->name('data.tasks.my');
    Route::get('/data/all/tasks', [TaskController::class, 'getAllTasks'])->name('data.tasks.all');

    // Task min due date calculation route (must be before wildcard route)
    Route::get('/data/tasks/calculate-min-due-date', [TaskController::class, 'calculateMinDueDate'])->name('api.tasks.calculate-min-due-date');

    Route::get('/data/tasks/{task}', [TaskController::class, 'show'])->name('api.tasks.show');
    Route::patch('/data/tasks/{task}', [TaskController::class, 'update'])->name('api.tasks.update');
    Route::patch('/data/tasks/{task}/extend-due-date', [TaskController::class, 'extendDueDate'])->name('api.tasks.extend-due-date');
    Route::delete('/data/tasks/{task}', [TaskController::class, 'destroy'])->name('api.tasks.destroy');
    Route::patch('/data/tasks/{task}/status', [TaskController::class, 'updateStatus'])->name('api.tasks.update-status');
    Route::get('/data/tasks/status/{status}', [TaskController::class, 'getTasksByStatus'])->name('api.tasks.by-status');
    Route::get('/data/task-types', [TaskController::class, 'getTaskTypes'])->name('api.task-types.index');
    Route::get('/data/task-types/{taskType}/sla-policies', [TaskController::class, 'getSlaPoliciesByTaskType'])->name('api.task-types.sla-policies');

    // Task comments routes
    Route::get('/data/tasks/{task}/comments', [TaskCommentController::class, 'index'])->name('api.tasks.comments.index');
    Route::post('/data/tasks/{task}/comments', [TaskCommentController::class, 'store'])->name('api.tasks.comments.store');
    Route::patch('/data/tasks/{task}/comments/{comment}', [TaskCommentController::class, 'update'])->name('api.tasks.comments.update');
    Route::delete('/data/tasks/{task}/comments/{comment}', [TaskCommentController::class, 'destroy'])->name('api.tasks.comments.destroy');

    // Deleted task comments routes (admin only permissions checked in controller, but route accessible to auth)
    Route::get('/data/tasks/{task}/comments/deleted', [TaskCommentController::class, 'getDeletedComments'])->name('api.tasks.comments.deleted');
    Route::patch('/data/tasks/{task}/comments/{comment}/restore', [TaskCommentController::class, 'restoreComment'])->name('api.tasks.comments.restore');
    Route::delete('/data/tasks/{task}/comments/{comment}/force-delete', [TaskCommentController::class, 'forceDeleteComment'])->name('api.tasks.comments.force-delete');

    // Task history route
    Route::get('/data/tasks/{task}/history', [TaskController::class, 'getHistory'])->name('api.tasks.history');

    // Task attachments routes
    Route::get('/data/tasks/{task}/attachments', [TaskAttachmentController::class, 'index'])->name('api.tasks.attachments.index');
    Route::post('/data/tasks/{task}/attachments', [TaskAttachmentController::class, 'store'])->name('api.tasks.attachments.store');
    Route::delete('/data/tasks/{task}/attachments/{attachment}', [TaskAttachmentController::class, 'destroy'])->name('api.tasks.attachments.destroy');

    // Task forwarding routes (API routes matching frontend expectations)
    Route::get('/data/tasks/{task}/forwardings', [TaskForwardingController::class, 'index'])->name('api.tasks.forwardings.index');
    Route::post('/data/tasks/{task}/forwardings', [TaskForwardingController::class, 'store'])->name('api.tasks.forwardings.store');

    // Task workload metrics route
    Route::get('/data/tasks/{task}/workload-metrics', [TaskController::class, 'getWorkloadMetrics'])->name('api.tasks.workload-metrics');

    // Task audit events route
    Route::get('/data/tasks/{task}/audit-events', [TaskController::class, 'getAuditEvents'])->name('api.tasks.audit-events');

    // Task time tracking routes (user-specific)
    // Get tasks with time entries for user on specific date
    Route::get('/my/tasks/time-entries', [UserTaskController::class, 'getTasksWithTimeEntries'])->name('my.tasks.time-entries');

    // Board tasks endpoint - returns recent tasks for the Board component
    Route::get('/data/my/board-tasks', [UserTaskController::class, 'getBoardTasks'])->name('data.tasks.board');

    // My Tasks route (outside admin pages)
    Route::get('/my/tasks', [TaskController::class, 'myTasks'])->name('tasks.my');

    // My Attendance routes
    Route::get('/my/attendance', [AttendanceController::class, 'myAttendancePage'])->name('my.attendance');
    Route::get('/my/sales-leads', [SalesLeadController::class, 'myIndex'])->name('my.sales-leads.index');
    Route::get('/data/my/sales-leads', [SalesLeadController::class, 'myData'])->name('my.sales-leads.data');
    Route::post('/my/sales-leads', [SalesLeadController::class, 'myStore'])->name('my.sales-leads.store');
    Route::get('/my/sales-leads/{salesLead}', [SalesLeadController::class, 'myShow'])->name('my.sales-leads.show');
    Route::patch('/my/sales-leads/{salesLead}', [SalesLeadController::class, 'myUpdate'])->name('my.sales-leads.update');
    Route::post('/my/sales-leads/{salesLead}/activities', [SalesLeadController::class, 'myStoreActivity'])->name('my.sales-leads.activities.store');
    Route::post('/my/sales-leads/{salesLead}/complete-follow-up', [SalesLeadController::class, 'myCompleteFollowUp'])->name('my.sales-leads.follow-up.complete');
    Route::post('/my/sales-leads/{salesLead}/close-deal', [SalesLeadController::class, 'myCloseDeal'])->name('my.sales-leads.close-deal');

    // My Task View route
    Route::get('/my/tasks/{task}', function ($taskId) {
        return Inertia::render('tasks/MyTaskView', [
            'taskId' => $taskId,
        ]);
    })->name('tasks.my.view');
    Route::post('/my/tasks/{task}/start', [UserTaskController::class, 'startTask'])->name('my.tasks.start');
    Route::post('/my/tasks/{task}/extend-and-start', [TimeTrackingController::class, 'extendDueDateAndStart'])->name('my.tasks.extend-and-start');
    Route::post('/my/tasks/{task}/pause', [UserTaskController::class, 'pauseTask'])->name('my.tasks.pause');
    Route::post('/my/tasks/{task}/resume', [UserTaskController::class, 'resumeTask'])->name('my.tasks.resume');
    Route::post('/my/tasks/{task}/end', [UserTaskController::class, 'endTask'])->name('my.tasks.end');
    Route::get('/my/tasks/{task}/time-spent', [UserTaskController::class, 'calculateTimeSpent'])->name('my.tasks.time-spent');
    Route::get('/my/tasks/{task}/remaining-time', [UserTaskController::class, 'calculateRemainingTime'])->name('my.tasks.remaining-time');
    Route::get('/my/tasks/{task}/working-time-spent', [TimeTrackingController::class, 'getWorkingTimeSpent'])->name('my.tasks.working-time-spent');
    Route::get('/api/working-hours-config', [TimeTrackingController::class, 'getWorkingHoursConfig'])->name('api.working-hours-config');
    Route::get('/my/tasks/{task}/time-entries', [UserTaskController::class, 'getTaskTimeEntriesForDate'])->name('my.tasks.single.time-entries');

    // Admin task time tracking routes (kept for backward compatibility)
    Route::post('/tasks/{task}/start', [TaskController::class, 'startTask'])->name('tasks.start');
    Route::post('/tasks/{task}/pause', [TaskController::class, 'pauseTask'])->name('tasks.pause');
    Route::post('/tasks/{task}/resume', [TaskController::class, 'resumeTask'])->name('tasks.resume');
    Route::post('/tasks/{task}/end', [TaskController::class, 'endTask'])->name('tasks.end');
    Route::get('/tasks/{task}/time-spent', [TaskController::class, 'calculateTimeSpent'])->name('tasks.time-spent');
    Route::get('/tasks/{task}/remaining-time', [TaskController::class, 'calculateRemainingTime'])->name('tasks.remaining-time');

    // Timeline event routes (used in frontend - API routes)
    Route::get('/timeline-events', [TimelineEventController::class, 'index'])->name('api.timeline-events.index');
    Route::post('/timeline-events', [TimelineEventController::class, 'store'])->name('api.timeline-events.store');
    Route::post('/timeline-events/store-report', [TimelineEventController::class, 'storeReport'])->name('api.timeline-events.store-report');
    Route::get('/timeline-events/{timelineEvent}', [TimelineEventController::class, 'show'])->name('api.timeline-events.show');
    Route::patch('/timeline-events/{timelineEvent}', [TimelineEventController::class, 'update'])->name('api.timeline-events.update');
    Route::delete('/timeline-events/{timelineEvent}', [TimelineEventController::class, 'destroy'])->name('api.timeline-events.destroy');

    // Milestone routes
    Route::post('/timeline-events/milestones', [TimelineEventController::class, 'storeMilestone'])->name('api.timeline-events.milestones.store');
    Route::patch('/timeline-events/{timelineEvent}/milestone', [TimelineEventController::class, 'updateMilestone'])->name('api.timeline-events.milestones.update');
    Route::delete('/timeline-events/{timelineEvent}/milestone', [TimelineEventController::class, 'destroyMilestone'])->name('api.timeline-events.milestones.destroy');
    Route::patch('/timeline-events/{timelineEvent}/complete', [TimelineEventController::class, 'completeMilestone'])->name('api.timeline-events.milestones.complete');
    Route::get('/tasks/{task}/milestones', [TimelineEventController::class, 'getMilestonesForTask'])->name('api.tasks.milestones');
    Route::get('/api/milestones/summary', [TimelineEventController::class, 'getMilestoneSummary'])->name('api.milestones.summary');

    // Task dependency routes (used in frontend - API routes)
    Route::get('/task-dependencies', [TaskDependencyController::class, 'index'])->name('api.task-dependencies.index');
    Route::post('/task-dependencies', [TaskDependencyController::class, 'store'])->name('api.task-dependencies.store');
    Route::get('/task-dependencies/{taskDependency}', [TaskDependencyController::class, 'show'])->name('api.task-dependencies.show');
    Route::patch('/task-dependencies/{taskDependency}', [TaskDependencyController::class, 'update'])->name('api.task-dependencies.update');
    Route::delete('/task-dependencies/{taskDependency}', [TaskDependencyController::class, 'destroy'])->name('api.task-dependencies.destroy');
    // Task forwarding routes (used in frontend)
    Route::get('/tasks/{task}/forwarding', [TaskForwardingController::class, 'index'])->name('tasks.forwarding.index');
    Route::post('/tasks/{task}/forward', [TaskForwardingController::class, 'store'])->name('tasks.forward');
    Route::patch('/task-forwarding/{taskForwarding}/accept', [TaskForwardingController::class, 'accept'])->name('task-forwarding.accept');

    Route::patch('/task-forwarding/{taskForwarding}/reject', [TaskForwardingController::class, 'reject'])->name('task-forwarding.reject');

    // Task assignment routes (API endpoints for task assignment management)
    Route::get('/api/task-assignments', [TaskAssignmentController::class, 'index'])->name('api.task-assignments.index');
    Route::post('/api/tasks/{task}/assign', [TaskAssignmentController::class, 'assignUserToTask'])->name('api.tasks.assign');
    Route::post('/api/tasks/{task}/unassign', [TaskAssignmentController::class, 'unassignUserFromTask'])->name('api.tasks.unassign');
    Route::get('/api/tasks/{task}/assignments', [TaskAssignmentController::class, 'getTaskAssignments'])->name('api.tasks.assignments');
    Route::get('/api/tasks/{task}/available-users', [TaskAssignmentController::class, 'getAvailableUsers'])->name('api.tasks.available-users');

    // Activity Log routes (API endpoints for React frontend)
    Route::get('/api/activity-logs', [ActivityLogController::class, 'index'])->name('api.activity-logs.index');
    Route::get('/api/activity-logs/{activityLog}', [ActivityLogController::class, 'show'])->name('api.activity-logs.show');
    Route::get('/api/activity-logs/model/{modelType}/{modelId}', [ActivityLogController::class, 'getModelActivity'])->name('api.activity-logs.model');
    Route::get('/api/activity-logs/user/{userId}', [ActivityLogController::class, 'getUserActivity'])->name('api.activity-logs.user');
    Route::get('/api/activity-logs/statistics', [ActivityLogController::class, 'getStatistics'])->name('api.activity-logs.statistics');
    Route::get('/api/activity-logs/recent', [ActivityLogController::class, 'getRecentActivity'])->name('api.activity-logs.recent');
    Route::delete('/api/activity-logs/clear-old', [ActivityLogController::class, 'clearOldLogs'])->name('api.activity-logs.clear-old');
    Route::get('/api/activity-logs/export', [ActivityLogController::class, 'export'])->name('api.activity-logs.export');
    Route::get('/api/daily/attendance', [AttendanceController::class, 'getDailyDetails'])->name('api.attendance.daily');
    Route::get('/api/attendance/{employeeId}', [AttendanceController::class, 'getAttendance'])->name('api.attendance');

    Route::prefix('api/holidays')->controller(HolidayController::class)->group(function () {
        Route::get('/', 'index'); // ?year=2026&type=national
        Route::post('/', 'store'); // date, name, type in body
        Route::patch('/copy_year', 'copyYear'); // from_year, to_year in body
        Route::put('/d/{holiday}', 'update'); // date, name, type in body
        Route::delete('/d/{holiday}', 'destroy');
    });

    // Leave Types routes
    Route::prefix('api/leave-types')->controller(LeaveTypeController::class)->group(function () {
        Route::get('/', 'index');      // Get all leave types, ?active_only=true
        Route::post('/', 'store');      // Create leave type
        Route::get('/{leaveType}', 'show');       // Get specific leave type
        Route::put('/{leaveType}', 'update');     // Update leave type
        Route::delete('/{leaveType}', 'destroy');  // Delete leave type
    });

    // Leave Requests routes
    Route::prefix('api/leave-requests')->controller(LeaveController::class)->group(function () {
        Route::get('/', 'index');      // Get leave requests, ?status=pending&employee_id=1&start_date=2026-05-01&end_date=2026-05-31
        Route::post('/', 'store');      // Create leave request
        Route::get('/{leaveRequest}', 'show');     // Get specific leave request
        Route::put('/{leaveRequest}', 'update');   // Update leave request (only if pending)
        Route::delete('/{leaveRequest}', 'destroy'); // Cancel leave request (only if pending)
        Route::post('/{leaveRequest}/approve', 'approve'); // Approve leave request
        Route::post('/{leaveRequest}/reject', 'reject');   // Reject leave request
    });

    // Leave Balance routes
    Route::prefix('api/leave-balances')->controller(LeaveBalanceController::class)->group(function () {
        Route::get('/', 'index');           // Get leave balances, ?employee_id=1&year=2026
        Route::post('/', 'store');          // Create single leave balance
        Route::post('/bulk-assign', 'bulkAssign');  // Bulk assign leave balances
        Route::get('/{leaveBalance}', 'show');      // Get specific leave balance
        Route::put('/{leaveBalance}', 'update');    // Update leave balance
        Route::delete('/{leaveBalance}', 'destroy'); // Delete leave balance
    });

    // Employee leave-related routes
    Route::prefix('api/employees/{employee}')->controller(LeaveController::class)->group(function () {
        Route::get('/leave-balance', 'getLeaveBalance');         // Get leave balance, ?year=2026
        Route::get('/leave-requests', 'getEmployeeLeaveRequests'); // Get employee's leave requests, ?status=approved&year=2026
    });

    // Remote Work Requests routes
    Route::prefix('api/remote-work-requests')->controller(RemoteWorkController::class)->group(function () {
        Route::get('/', 'index');      // List remote work requests, ?status=pending&employee_id=1&start_date=2026-05-01&end_date=2026-05-31
        Route::post('/', 'store');      // Create remote work request
        Route::get('/{remoteWorkRequest}', 'show');     // Get specific remote work request
        Route::put('/{remoteWorkRequest}', 'update');   // Update remote work request (only if pending)
        Route::delete('/{remoteWorkRequest}', 'destroy'); // Cancel remote work request
        Route::post('/{remoteWorkRequest}/approve', 'approve'); // Approve remote work request
        Route::post('/{remoteWorkRequest}/reject', 'reject');   // Reject remote work request
    });

    // Remote Work Assignments routes (admin-direct) - MOVED TO WEB.PHP
    // The read-only GET /api/remote-work-assignments is still available for API access
    Route::prefix('api/remote-work-assignments')->controller(RemoteWorkAssignmentController::class)->group(function () {
        Route::get('/', 'index');      // List remote work assignments, ?employee_id=1
    });

    // Field Work Requests routes (employee-requested)
    Route::prefix('api/field-work-requests')->controller(FieldWorkRequestController::class)->group(function () {
        Route::get('/', 'index');      // List field work requests, ?status=pending&employee_id=1
        Route::post('/', 'store');      // Create field work request
        Route::get('/{fieldWorkRequest}', 'show');     // Get specific field work request
        Route::put('/{fieldWorkRequest}', 'update');   // Update field work request (only if pending)
        Route::delete('/{fieldWorkRequest}', 'destroy'); // Cancel field work request (only if pending)
        Route::post('/{fieldWorkRequest}/approve', 'approve'); // Approve field work request
        Route::post('/{fieldWorkRequest}/reject', 'reject');   // Reject field work request
    });

    // Field Work Assignments routes (admin-direct) - MOVED TO WEB.PHP
    // The read-only GET routes are still available for API access
    Route::prefix('api/field-work-assignments')->controller(FieldWorkController::class)->group(function () {
        Route::get('/', 'index');      // List field work assignments, ?employee_id=1&active_only=true&location=site
        Route::get('/{fieldWorkAssignment}', 'show');     // Get specific field work assignment
    });

    // Holiday Work Records routes
    Route::prefix('api/holiday-work-records')->controller(HolidayWorkController::class)->group(function () {
        Route::get('/', 'index');
        Route::post('/', 'store');
        Route::get('/{holidayWorkRecord}', 'show');
        Route::post('/{holidayWorkRecord}/approve', 'approve');
        Route::post('/{holidayWorkRecord}/reject', 'reject');
        Route::post('/{holidayWorkRecord}/compensatory-off', 'createCompensatoryOff');
    });

    // Employee remote work, field work, holiday work, and compensatory off routes
    Route::prefix('api/employees/{employee}')->group(function () {
        Route::get('/remote-work-requests', [RemoteWorkController::class, 'getEmployeeRemoteWorkRequests']); // Get employee's remote work requests, ?status=approved&year=2026
        Route::get('/remote-work-assignments', [RemoteWorkAssignmentController::class, 'getEmployeeRemoteWorkAssignments']); // Get employee's remote work assignments, ?year=2026
        Route::get('/field-work-assignments', [FieldWorkController::class, 'getEmployeeFieldWorkAssignments']); // Get employee's field work assignments, ?year=2026&active_only=true
        Route::get('/field-work-requests', [FieldWorkRequestController::class, 'getEmployeeFieldWorkRequests']); // Get employee's field work requests, ?status=approved&year=2026
        Route::get('/holiday-work-records', [HolidayWorkController::class, 'getEmployeeHolidayWork']); // Get employee's holiday work records, ?status=approved&year=2026
        Route::get('/compensatory-offs', [HolidayWorkController::class, 'getCompensatoryOffs']); // Get employee's compensatory off records, ?status=available
        Route::post('/change-shift', [ShiftController::class, 'changeShift']); // Admin change shift for employee
    });

    Route::prefix('api')->group(function () {
        Route::get('/my/attendance', [AttendanceController::class, 'getEmployeeAttendance'])->name('api.my.attendance');
        Route::post('/my/attendance/punch', [AttendanceController::class, 'punchEntry'])->name('api.my.attendance.punch');

        Route::get('/my/attendance/today', [AttendanceController::class, 'getTodaysAttendance']);
        Route::get('/my/leaves', [AttendanceController::class, 'getLeaveRequests']);
        Route::post('/my/leaves', [AttendanceController::class, 'storeLeaveRequest']);
        Route::get('/my/leave-balances', [AttendanceController::class, 'getLeaveBalances']);
        Route::get('/my/remote-work', [AttendanceController::class, 'getRemoteWorkRequests']);
        Route::post('/my/remote-work', [AttendanceController::class, 'storeRemoteWorkRequest']);
        Route::get('/my/field-work', [FieldWorkRequestController::class, 'myIndex']);
        Route::post('/my/field-work', [FieldWorkRequestController::class, 'myStore']);
        Route::put('/my/field-work/{fieldWorkRequest}', [FieldWorkRequestController::class, 'myUpdate']);
        Route::delete('/my/field-work/{fieldWorkRequest}', [FieldWorkRequestController::class, 'myDestroy']);
    });

});

require __DIR__.'/settings.php';
