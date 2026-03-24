<?php

use App\Http\Controllers\ActivityLogController;
use App\Http\Controllers\AdminAuthController;
use App\Http\Controllers\AdminClientSsoTestController;
use App\Http\Controllers\AdminDashboardController;
use App\Http\Controllers\AdminTaskController;
use App\Http\Controllers\AdminTicketController;
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
use App\Http\Controllers\MenuManagementController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\OrganizationUserController;
use App\Http\Controllers\PermissionController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\ProjectAttachmentController;
use App\Http\Controllers\ProjectController;
use App\Http\Controllers\ProjectMilestoneController;
use App\Http\Controllers\ProjectPhaseController;
use App\Http\Controllers\ProjectTimelineController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\RoleController;
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
use App\Http\Controllers\WorkloadMatrixController;
use App\Models\Client;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('welcome');
})->name('home');

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

Route::get('/clients/{clientCode}/sso/test', [AdminClientSsoTestController::class, 'redirectToSso'])->name('clients.sso.test');

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
    Route::middleware(['admin'])->group(function () {
        Route::get('/dashboard', [AdminDashboardController::class, 'index'])->name('dashboard');
        Route::post('/logout', [AdminAuthController::class, 'logout'])->name('logout');
        Route::get('/logout', [AdminAuthController::class, 'logout'])->name('logout.get');

        // Client routes (used in frontend)
        Route::controller(ClientController::class)->group(function () {
            Route::get('/clients', 'index');
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

        // Project Milestones
        Route::get('/projects/{project}/milestones', [ProjectMilestoneController::class, 'index'])->name('projects.milestones.index');
        Route::post('/projects/{project}/milestones', [ProjectMilestoneController::class, 'store'])->name('projects.milestones.store');
        Route::get('/projects/{project}/milestones/{milestone}', [ProjectMilestoneController::class, 'show'])->name('projects.milestones.show');
        Route::patch('/projects/{project}/milestones/{milestone}', [ProjectMilestoneController::class, 'update'])->name('projects.milestones.update');
        Route::delete('/projects/{project}/milestones/{milestone}', [ProjectMilestoneController::class, 'destroy'])->name('projects.milestones.destroy');
        Route::post('/projects/{project}/milestones/{milestone}/complete', [ProjectMilestoneController::class, 'complete'])->name('projects.milestones.complete');
        Route::post('/projects/{project}/milestones/reorder', [ProjectMilestoneController::class, 'reorder'])->name('projects.milestones.reorder');
        Route::get('/projects/{project}/milestones/overdue', [ProjectMilestoneController::class, 'overdue'])->name('projects.milestones.overdue');
        Route::get('/projects/{project}/milestones/upcoming', [ProjectMilestoneController::class, 'upcoming'])->name('projects.milestones.upcoming');

        // Project Phases
        Route::get('/projects/{project}/phases', [ProjectPhaseController::class, 'index'])->name('projects.phases.index');
        Route::post('/projects/{project}/phases', [ProjectPhaseController::class, 'store'])->name('projects.phases.store');
        Route::get('/projects/{project}/phases/{phase}', [ProjectPhaseController::class, 'show'])->name('projects.phases.show');
        Route::patch('/projects/{project}/phases/{phase}', [ProjectPhaseController::class, 'update'])->name('projects.phases.update');
        Route::delete('/projects/{project}/phases/{phase}', [ProjectPhaseController::class, 'destroy'])->name('projects.phases.destroy');
        Route::post('/projects/{project}/phases/reorder', [ProjectPhaseController::class, 'reorder'])->name('projects.phases.reorder');
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

        // Admin Task management routes (web pages)
        Route::get('/tasks', [AdminTaskController::class, 'index'])->name('tasks.admin.index');
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
        Route::get('/employees/create', [EmployeeController::class, 'create'])->name('employees.create');
        Route::post('/employees', [EmployeeController::class, 'store'])->name('employees.store');
        Route::get('/employees/{employee}', [EmployeeController::class, 'show'])->name('employees.show');
        Route::get('/employees/{employee}/edit', [EmployeeController::class, 'edit'])->name('employees.edit');
        Route::patch('/employees/{employee}', [EmployeeController::class, 'update'])->name('employees.update');
        Route::patch('/employees/{employee}/roles', [EmployeeController::class, 'updateRoles'])->name('employees.update-roles');
        Route::delete('/employees/{employee}', [EmployeeController::class, 'destroy'])->name('employees.destroy');

        // Employee progress routes
        Route::get('/employee-progress', [EmployeeProgressController::class, 'showEmployeeProgressPanel'])->name('employee.progress');
        Route::get('/api/employee-progress', [EmployeeProgressController::class, 'getEmployeeProgressData'])->name('api.employee.progress');
        Route::get('/api/employee-progress/stats', [EmployeeProgressController::class, 'getEmployeeProgressStats'])->name('api.employee.progress.stats');

        // Workload matrix routes
        Route::get('/workload-matrix', [WorkloadMatrixController::class, 'index'])->name('workload-matrix.index');
        Route::get('/api/workload-matrix', [WorkloadMatrixController::class, 'data'])->name('api.workload-matrix');
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
    Route::get('/my/tasks/{task}/time-entries', [UserTaskController::class, 'getTaskTimeEntriesForDate'])->name('my.tasks.time-entries');

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
});

require __DIR__.'/settings.php';
