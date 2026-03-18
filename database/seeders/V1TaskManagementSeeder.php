<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class V1TaskManagementSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Seed task types
        $this->seedTaskTypes();
         
        // Seed SLA policies
        $this->seedSLAPolicies();
         
        // Seed permissions
        $this->seedPermissions();
         
        // Seed roles
        $this->seedRoles();
         
        // Seed role permissions
        $this->seedRolePermissions();
         
        // Seed departments
        $this->seedDepartments();
         
        // Seed products
        $this->seedProducts();
         
        // Seed default admin user
        $this->seedAdminUser();


    }

    private function seedTaskTypes(): void
    {
        $taskTypes = [
            [
                'code' => 'Bugfix',
                'name' => 'Bug Fix',
                'description' => 'Fix software bugs and issues',
                'default_priority' => 'P3',
                'requires_sla' => true,
                'requires_project' => false,
                'requires_department' => false,
                'workflow_definition' => json_encode([
                    'states' => ['Draft', 'Assigned', 'InProgress', 'Blocked', 'InReview', 'Done', 'Cancelled'],
                    'transitions' => [
                        'Draft' => ['Assigned', 'Cancelled'],
                        'Assigned' => ['InProgress', 'Blocked', 'Reassigned', 'Cancelled'],
                        'InProgress' => ['Blocked', 'InReview', 'Cancelled'],
                        'Blocked' => ['InProgress', 'Cancelled'],
                        'InReview' => ['InProgress', 'Done', 'Cancelled'],
                        'Done' => [],
                        'Cancelled' => []
                    ]
                ]),
                'is_active' => true,
            ],
            [
                'code' => 'ProjectWork',
                'name' => 'Project Work',
                'description' => 'Development tasks for projects',
                'default_priority' => 'P2',
                'requires_sla' => true,
                'requires_project' => true,
                'requires_department' => false,
                'workflow_definition' => json_encode([
                    'states' => ['Draft', 'Assigned', 'InProgress', 'Blocked', 'InReview', 'Done', 'Cancelled'],
                    'transitions' => [
                        'Draft' => ['Assigned', 'Cancelled'],
                        'Assigned' => ['InProgress', 'Blocked', 'Reassigned', 'Cancelled'],
                        'InProgress' => ['Blocked', 'InReview', 'Cancelled'],
                        'Blocked' => ['InProgress', 'Cancelled'],
                        'InReview' => ['InProgress', 'Done', 'Cancelled'],
                        'Done' => [],
                        'Cancelled' => []
                    ]
                ]),
                'is_active' => true,
            ],
            [
                'code' => 'Support',
                'name' => 'Support Request',
                'description' => 'Customer support and assistance',
                'default_priority' => 'P2',
                'requires_sla' => true,
                'requires_project' => false,
                'requires_department' => true,
                'workflow_definition' => json_encode([
                    'states' => ['Draft', 'Assigned', 'InProgress', 'Blocked', 'InReview', 'Done', 'Cancelled'],
                    'transitions' => [
                        'Draft' => ['Assigned', 'Cancelled'],
                        'Assigned' => ['InProgress', 'Blocked', 'Reassigned', 'Cancelled'],
                        'InProgress' => ['Blocked', 'InReview', 'Cancelled'],
                        'Blocked' => ['InProgress', 'Cancelled'],
                        'InReview' => ['InProgress', 'Done', 'Cancelled'],
                        'Done' => [],
                        'Cancelled' => []
                    ]
                ]),
                'is_active' => true,
            ],
            [
                'code' => 'InternalRequest',
                'name' => 'Internal Request',
                'description' => 'Internal company requests',
                'default_priority' => 'P3',
                'requires_sla' => true,
                'requires_project' => false,
                'requires_department' => true,
                'workflow_definition' => json_encode([
                    'states' => ['Draft', 'Assigned', 'InProgress', 'Blocked', 'InReview', 'Done', 'Cancelled'],
                    'transitions' => [
                        'Draft' => ['Assigned', 'Cancelled'],
                        'Assigned' => ['InProgress', 'Blocked', 'Reassigned', 'Cancelled'],
                        'InProgress' => ['Blocked', 'InReview', 'Cancelled'],
                        'Blocked' => ['InProgress', 'Cancelled'],
                        'InReview' => ['InProgress', 'Done', 'Cancelled'],
                        'Done' => [],
                        'Cancelled' => []
                    ]
                ]),
                'is_active' => true,
            ],
            [
                'code' => 'Inspection',
                'name' => 'Inspection',
                'description' => 'Quality inspections and audits',
                'default_priority' => 'P2',
                'requires_sla' => true,
                'requires_project' => false,
                'requires_department' => false,
                'workflow_definition' => json_encode([
                    'states' => ['Draft', 'Assigned', 'InProgress', 'Blocked', 'InReview', 'Done', 'Cancelled'],
                    'transitions' => [
                        'Draft' => ['Assigned', 'Cancelled'],
                        'Assigned' => ['InProgress', 'Blocked', 'Reassigned', 'Cancelled'],
                        'InProgress' => ['Blocked', 'InReview', 'Cancelled'],
                        'Blocked' => ['InProgress', 'Cancelled'],
                        'InReview' => ['InProgress', 'Done', 'Cancelled'],
                        'Done' => [],
                        'Cancelled' => []
                    ]
                ]),
                'is_active' => true,
            ]
        ];

        foreach ($taskTypes as $taskType) {
            DB::table('task_types')->updateOrInsert(
                ['code' => $taskType['code']],
                $taskType
            );
        }
    }

    private function seedSLAPolicies(): void
    {
        // Get task type IDs first
        $taskTypes = DB::table('task_types')->pluck('id', 'code')->toArray();
        
        $slaPolicies = [
            // Bugfix SLA Policies
            [
                'name' => 'Bugfix P1 Policy',
                'description' => 'Critical bug fix',
                'task_type_id' => $taskTypes['Bugfix'] ?? null,
                'priority' => 'P1',
                'response_time_minutes' => 60,      // 1 hour
                'resolution_time_minutes' => 480,   // 8 hours
                'review_time_minutes' => 240,       // 4 hours
                'escalation_steps' => json_encode([
                    ['after_minutes' => 120, 'notify' => 'Team Lead'],
                    ['after_minutes' => 360, 'notify' => 'Manager']
                ]),
                'is_active' => true,
            ],
            [
                'name' => 'Bugfix P2 Policy',
                'description' => 'High priority bug fix',
                'task_type_id' => $taskTypes['Bugfix'] ?? null,
                'priority' => 'P2',
                'response_time_minutes' => 240,      // 4 hours
                'resolution_time_minutes' => 2880,   // 2 days
                'review_time_minutes' => 1440,       // 1 day
                'escalation_steps' => json_encode([
                    ['after_minutes' => 1440, 'notify' => 'Team Lead']
                ]),
                'is_active' => true,
            ],
            [
                'name' => 'Bugfix P3 Policy',
                'description' => 'Medium priority bug fix',
                'task_type_id' => $taskTypes['Bugfix'] ?? null,
                'priority' => 'P3',
                'response_time_minutes' => 480,      // 8 hours
                'resolution_time_minutes' => 7200,   // 5 days
                'review_time_minutes' => 2880,       // 2 days
                'escalation_steps' => json_encode([]),
                'is_active' => true,
            ],
            [
                'name' => 'Bugfix P4 Policy',
                'description' => 'Low priority bug fix',
                'task_type_id' => $taskTypes['Bugfix'] ?? null,
                'priority' => 'P4',
                'response_time_minutes' => 1440,     // 1 day
                'resolution_time_minutes' => 14400,  // 10 days
                'review_time_minutes' => 5760,       // 4 days
                'escalation_steps' => json_encode([]),
                'is_active' => true,
            ],

            // ProjectWork SLA Policies
            [
                'name' => 'ProjectWork P1 Policy',
                'description' => 'Critical project work',
                'task_type_id' => $taskTypes['ProjectWork'] ?? null,
                'priority' => 'P1',
                'response_time_minutes' => 240,      // 4 hours
                'resolution_time_minutes' => 2880,   // 2 days
                'review_time_minutes' => 1440,       // 1 day
                'escalation_steps' => json_encode([
                    ['after_minutes' => 1440, 'notify' => 'Project Manager']
                ]),
                'is_active' => true,
            ],
            [
                'name' => 'ProjectWork P2 Policy',
                'description' => 'High priority project work',
                'task_type_id' => $taskTypes['ProjectWork'] ?? null,
                'priority' => 'P2',
                'response_time_minutes' => 480,      // 8 hours
                'resolution_time_minutes' => 5760,   // 4 days
                'review_time_minutes' => 2880,       // 2 days
                'escalation_steps' => json_encode([]),
                'is_active' => true,
            ],
            [
                'name' => 'ProjectWork P3 Policy',
                'description' => 'Medium priority project work',
                'task_type_id' => $taskTypes['ProjectWork'] ?? null,
                'priority' => 'P3',
                'response_time_minutes' => 960,      // 16 hours
                'resolution_time_minutes' => 10080,  // 7 days
                'review_time_minutes' => 5760,       // 4 days
                'escalation_steps' => json_encode([]),
                'is_active' => true,
            ],

            // Support SLA Policies
            [
                'name' => 'Support P1 Policy',
                'description' => 'Critical support request',
                'task_type_id' => $taskTypes['Support'] ?? null,
                'priority' => 'P1',
                'response_time_minutes' => 120,      // 2 hours
                'resolution_time_minutes' => 1440,   // 1 day
                'review_time_minutes' => 720,        // 12 hours
                'escalation_steps' => json_encode([
                    ['after_minutes' => 240, 'notify' => 'Support Manager']
                ]),
                'is_active' => true,
            ],
            [
                'name' => 'Support P2 Policy',
                'description' => 'High priority support request',
                'task_type_id' => $taskTypes['Support'] ?? null,
                'priority' => 'P2',
                'response_time_minutes' => 480,      // 8 hours
                'resolution_time_minutes' => 2880,   // 2 days
                'review_time_minutes' => 1440,       // 1 day
                'escalation_steps' => json_encode([]),
                'is_active' => true,
            ],
            [
                'name' => 'Support P3 Policy',
                'description' => 'Medium priority support request',
                'task_type_id' => $taskTypes['Support'] ?? null,
                'priority' => 'P3',
                'response_time_minutes' => 1440,     // 1 day
                'resolution_time_minutes' => 7200,   // 5 days
                'review_time_minutes' => 2880,       // 2 days
                'escalation_steps' => json_encode([]),
                'is_active' => true,
            ],

            // InternalRequest SLA Policies
            [
                'name' => 'InternalRequest P2 Policy',
                'description' => 'High priority internal request',
                'task_type_id' => $taskTypes['InternalRequest'] ?? null,
                'priority' => 'P2',
                'response_time_minutes' => 480,      // 8 hours
                'resolution_time_minutes' => 2880,   // 2 days
                'review_time_minutes' => 1440,       // 1 day
                'escalation_steps' => json_encode([]),
                'is_active' => true,
            ],
            [
                'name' => 'InternalRequest P3 Policy',
                'description' => 'Medium priority internal request',
                'task_type_id' => $taskTypes['InternalRequest'] ?? null,
                'priority' => 'P3',
                'response_time_minutes' => 1440,     // 1 day
                'resolution_time_minutes' => 5760,   // 4 days
                'review_time_minutes' => 2880,       // 2 days
                'escalation_steps' => json_encode([]),
                'is_active' => true,
            ],

            // Inspection SLA Policies
            [
                'name' => 'Inspection P2 Policy',
                'description' => 'High priority inspection',
                'task_type_id' => $taskTypes['Inspection'] ?? null,
                'priority' => 'P2',
                'response_time_minutes' => 480,      // 8 hours
                'resolution_time_minutes' => 2880,   // 2 days
                'review_time_minutes' => 1440,       // 1 day
                'escalation_steps' => json_encode([]),
                'is_active' => true,
            ],
            [
                'name' => 'Inspection P3 Policy',
                'description' => 'Medium priority inspection',
                'task_type_id' => $taskTypes['Inspection'] ?? null,
                'priority' => 'P3',
                'response_time_minutes' => 1440,     // 1 day
                'resolution_time_minutes' => 5760,   // 4 days
                'review_time_minutes' => 2880,       // 2 days
                'escalation_steps' => json_encode([]),
                'is_active' => true,
            ]
        ];

        foreach ($slaPolicies as $policy) {
            // Only seed if task_type_id exists
            if ($policy['task_type_id']) {
                DB::table('sla_policies')->updateOrInsert(
                    ['task_type_id' => $policy['task_type_id'], 'priority' => $policy['priority']],
                    $policy
                );
            }
        }
    }

    private function seedPermissions(): void
    {
        $permissions = [
            // Task permissions
            ['name' => 'Task.Create', 'slug' => 'task.create', 'module' => 'task', 'action' => 'create', 'description' => 'Create new tasks'],
            ['name' => 'Task.Read', 'slug' => 'task.read', 'module' => 'task', 'action' => 'read', 'description' => 'Read tasks'],
            ['name' => 'Task.Update', 'slug' => 'task.update', 'module' => 'task', 'action' => 'update', 'description' => 'Update tasks'],
            ['name' => 'Task.Assign', 'slug' => 'task.assign', 'module' => 'task', 'action' => 'assign', 'description' => 'Assign tasks to users/departments'],
            ['name' => 'Task.Reassign', 'slug' => 'task.reassign', 'module' => 'task', 'action' => 'reassign', 'description' => 'Reassign tasks between users/departments'],
            ['name' => 'Task.ChangePriority', 'slug' => 'task.change_priority', 'module' => 'task', 'action' => 'change_priority', 'description' => 'Change task priority'],
            ['name' => 'Task.ChangeSLA', 'slug' => 'task.change_sla', 'module' => 'task', 'action' => 'change_sla', 'description' => 'Change SLA settings'],
            ['name' => 'Task.Start', 'slug' => 'task.start', 'module' => 'task', 'action' => 'start', 'description' => 'Start work on tasks'],
            ['name' => 'Task.UpdateProgress', 'slug' => 'task.update_progress', 'module' => 'task', 'action' => 'update_progress', 'description' => 'Update task progress'],
            ['name' => 'Task.Block', 'slug' => 'task.block', 'module' => 'task', 'action' => 'block', 'description' => 'Block tasks'],
            ['name' => 'Task.Unblock', 'slug' => 'task.unblock', 'module' => 'task', 'action' => 'unblock', 'description' => 'Unblock tasks'],
            ['name' => 'Task.RequestReview', 'slug' => 'task.request_review', 'module' => 'task', 'action' => 'request_review', 'description' => 'Submit tasks for review'],
            ['name' => 'Task.ReviewApprove', 'slug' => 'task.review_approve', 'module' => 'task', 'action' => 'review_approve', 'description' => 'Approve task reviews'],
            ['name' => 'Task.ReviewReject', 'slug' => 'task.review_reject', 'module' => 'task', 'action' => 'review_reject', 'description' => 'Reject task reviews'],
            ['name' => 'Task.Complete', 'slug' => 'task.complete', 'module' => 'task', 'action' => 'complete', 'description' => 'Mark tasks as complete'],
            ['name' => 'Task.Cancel', 'slug' => 'task.cancel', 'module' => 'task', 'action' => 'cancel', 'description' => 'Cancel tasks'],
            ['name' => 'Task.Override', 'slug' => 'task.override', 'module' => 'task', 'action' => 'override', 'description' => 'Override normal workflow guards'],
            ['name' => 'Task.ViewAll', 'slug' => 'task.view_all', 'module' => 'task', 'action' => 'view_all', 'description' => 'View all tasks'],
            ['name' => 'Task.ViewOwn', 'slug' => 'task.view_own', 'module' => 'task', 'action' => 'view_own', 'description' => 'View own tasks'],
            ['name' => 'Task.ViewDepartment', 'slug' => 'task.view_department', 'module' => 'task', 'action' => 'view_department', 'description' => 'View department tasks'],
            ['name' => 'Task.ManageOthers', 'slug' => 'task.manage_others', 'module' => 'task', 'action' => 'manage_others', 'description' => 'Manage other users tasks'],

            // Ticket permissions
            ['name' => 'Ticket.Create', 'slug' => 'ticket.create', 'module' => 'ticket', 'action' => 'create', 'description' => 'Create new tickets'],
            ['name' => 'Ticket.Read', 'slug' => 'ticket.read', 'module' => 'ticket', 'action' => 'read', 'description' => 'View tickets'],
            ['name' => 'Ticket.Update', 'slug' => 'ticket.update', 'module' => 'ticket', 'action' => 'update', 'description' => 'Update tickets'],
            ['name' => 'Ticket.Delete', 'slug' => 'ticket.delete', 'module' => 'ticket', 'action' => 'delete', 'description' => 'Delete tickets'],
            ['name' => 'Ticket.Assign', 'slug' => 'ticket.assign', 'module' => 'ticket', 'action' => 'assign', 'description' => 'Assign tickets'],
            ['name' => 'Ticket.Approve', 'slug' => 'ticket.approve', 'module' => 'ticket', 'action' => 'approve', 'description' => 'Approve tickets'],
            ['name' => 'Ticket.Reject', 'slug' => 'ticket.reject', 'module' => 'ticket', 'action' => 'reject', 'description' => 'Reject tickets'],
            ['name' => 'Ticket.ViewAll', 'slug' => 'ticket.view_all', 'module' => 'ticket', 'action' => 'view_all', 'description' => 'View all tickets'],
            ['name' => 'Ticket.ViewOwn', 'slug' => 'ticket.view_own', 'module' => 'ticket', 'action' => 'view_own', 'description' => 'View own tickets'],
            ['name' => 'Ticket.Manage', 'slug' => 'ticket.manage', 'module' => 'ticket', 'action' => 'manage', 'description' => 'Manage tickets'],

            // User permissions
            ['name' => 'User.Create', 'slug' => 'user.create', 'module' => 'user', 'action' => 'create', 'description' => 'Create new users'],
            ['name' => 'User.Read', 'slug' => 'user.read', 'module' => 'user', 'action' => 'read', 'description' => 'View users'],
            ['name' => 'User.Update', 'slug' => 'user.update', 'module' => 'user', 'action' => 'update', 'description' => 'Update users'],
            ['name' => 'User.Delete', 'slug' => 'user.delete', 'module' => 'user', 'action' => 'delete', 'description' => 'Delete users'],
            ['name' => 'User.ManageRoles', 'slug' => 'user.manage_roles', 'module' => 'user', 'action' => 'manage_roles', 'description' => 'Manage user roles'],
            ['name' => 'User.ManagePermissions', 'slug' => 'user.manage_permissions', 'module' => 'user', 'action' => 'manage_permissions', 'description' => 'Manage user permissions'],

            // Employee permissions
            ['name' => 'Employee.Create', 'slug' => 'employee.create', 'module' => 'employee', 'action' => 'create', 'description' => 'Create new employees'],
            ['name' => 'Employee.Read', 'slug' => 'employee.read', 'module' => 'employee', 'action' => 'read', 'description' => 'View employees'],
            ['name' => 'Employee.Update', 'slug' => 'employee.update', 'module' => 'employee', 'action' => 'update', 'description' => 'Update employees'],
            ['name' => 'Employee.Delete', 'slug' => 'employee.delete', 'module' => 'employee', 'action' => 'delete', 'description' => 'Delete employees'],

            // Department permissions
            ['name' => 'Department.Create', 'slug' => 'department.create', 'module' => 'department', 'action' => 'create', 'description' => 'Create new departments'],
            ['name' => 'Department.Read', 'slug' => 'department.read', 'module' => 'department', 'action' => 'read', 'description' => 'View departments'],
            ['name' => 'Department.Update', 'slug' => 'department.update', 'module' => 'department', 'action' => 'update', 'description' => 'Update departments'],
            ['name' => 'Department.Delete', 'slug' => 'department.delete', 'module' => 'department', 'action' => 'delete', 'description' => 'Delete departments'],
            ['name' => 'Department.ManageUsers', 'slug' => 'department.manage_users', 'module' => 'department', 'action' => 'manage_users', 'description' => 'Manage department users'],

            // Client permissions
            ['name' => 'Client.Create', 'slug' => 'client.create', 'module' => 'client', 'action' => 'create', 'description' => 'Create new clients'],
            ['name' => 'Client.Read', 'slug' => 'client.read', 'module' => 'client', 'action' => 'read', 'description' => 'View clients'],
            ['name' => 'Client.Update', 'slug' => 'client.update', 'module' => 'client', 'action' => 'update', 'description' => 'Update clients'],
            ['name' => 'Client.Delete', 'slug' => 'client.delete', 'module' => 'client', 'action' => 'delete', 'description' => 'Delete clients'],
            ['name' => 'Client.ManageProducts', 'slug' => 'client.manage_products', 'module' => 'client', 'action' => 'manage_products', 'description' => 'Manage client products'],

            // Product permissions
            ['name' => 'Product.Create', 'slug' => 'product.create', 'module' => 'product', 'action' => 'create', 'description' => 'Create new products'],
            ['name' => 'Product.Read', 'slug' => 'product.read', 'module' => 'product', 'action' => 'read', 'description' => 'View products'],
            ['name' => 'Product.Update', 'slug' => 'product.update', 'module' => 'product', 'action' => 'update', 'description' => 'Update products'],
            ['name' => 'Product.Delete', 'slug' => 'product.delete', 'module' => 'product', 'action' => 'delete', 'description' => 'Delete products'],

            // Project permissions
            ['name' => 'Project.Create', 'slug' => 'project.create', 'module' => 'project', 'action' => 'create', 'description' => 'Create new projects'],
            ['name' => 'Project.Read', 'slug' => 'project.read', 'module' => 'project', 'action' => 'read', 'description' => 'View projects'],
            ['name' => 'Project.Update', 'slug' => 'project.update', 'module' => 'project', 'action' => 'update', 'description' => 'Update projects'],
            ['name' => 'Project.Delete', 'slug' => 'project.delete', 'module' => 'project', 'action' => 'delete', 'description' => 'Delete projects'],

            // SLA permissions
            ['name' => 'SLA.Create', 'slug' => 'sla.create', 'module' => 'sla', 'action' => 'create', 'description' => 'Create new SLA policies'],
            ['name' => 'SLA.Read', 'slug' => 'sla.read', 'module' => 'sla', 'action' => 'read', 'description' => 'View SLA policies'],
            ['name' => 'SLA.Update', 'slug' => 'sla.update', 'module' => 'sla', 'action' => 'update', 'description' => 'Update SLA policies'],
            ['name' => 'SLA.Delete', 'slug' => 'sla.delete', 'module' => 'sla', 'action' => 'delete', 'description' => 'Delete SLA policies'],

            // Report permissions
            ['name' => 'Report.View', 'slug' => 'report.view', 'module' => 'report', 'action' => 'view', 'description' => 'View reports'],
            ['name' => 'Report.Generate', 'slug' => 'report.generate', 'module' => 'report', 'action' => 'generate', 'description' => 'Generate reports'],
            ['name' => 'Report.Export', 'slug' => 'report.export', 'module' => 'report', 'action' => 'export', 'description' => 'Export reports'],
            ['name' => 'Report.Create', 'slug' => 'report.create', 'module' => 'report', 'action' => 'create', 'description' => 'Create reports'],
            ['name' => 'Report.Update', 'slug' => 'report.update', 'module' => 'report', 'action' => 'update', 'description' => 'Update reports'],
            ['name' => 'Report.Delete', 'slug' => 'report.delete', 'module' => 'report', 'action' => 'delete', 'description' => 'Delete reports'],

            // Activity Log permissions
            ['name' => 'ActivityLog.Read', 'slug' => 'activity_log.read', 'module' => 'activity_log', 'action' => 'read', 'description' => 'View activity logs'],
            ['name' => 'ActivityLog.Delete', 'slug' => 'activity_log.delete', 'module' => 'activity_log', 'action' => 'delete', 'description' => 'Delete activity logs'],

            // Timeline Event permissions
            ['name' => 'TimelineEvent.Create', 'slug' => 'timeline_event.create', 'module' => 'timeline_event', 'action' => 'create', 'description' => 'Create timeline events'],
            ['name' => 'TimelineEvent.Read', 'slug' => 'timeline_event.read', 'module' => 'timeline_event', 'action' => 'read', 'description' => 'View timeline events'],
            ['name' => 'TimelineEvent.Update', 'slug' => 'timeline_event.update', 'module' => 'timeline_event', 'action' => 'update', 'description' => 'Update timeline events'],
            ['name' => 'TimelineEvent.Delete', 'slug' => 'timeline_event.delete', 'module' => 'timeline_event', 'action' => 'delete', 'description' => 'Delete timeline events'],

            // Task Dependency permissions
            ['name' => 'TaskDependency.Create', 'slug' => 'task_dependency.create', 'module' => 'task_dependency', 'action' => 'create', 'description' => 'Create task dependencies'],
            ['name' => 'TaskDependency.Read', 'slug' => 'task_dependency.read', 'module' => 'task_dependency', 'action' => 'read', 'description' => 'View task dependencies'],
            ['name' => 'TaskDependency.Update', 'slug' => 'task_dependency.update', 'module' => 'task_dependency', 'action' => 'update', 'description' => 'Update task dependencies'],
            ['name' => 'TaskDependency.Delete', 'slug' => 'task_dependency.delete', 'module' => 'task_dependency', 'action' => 'delete', 'description' => 'Delete task dependencies'],

            // Task Forwarding permissions
            ['name' => 'TaskForwarding.Create', 'slug' => 'task_forwarding.create', 'module' => 'task_forwarding', 'action' => 'create', 'description' => 'Create task forwardings'],
            ['name' => 'TaskForwarding.Read', 'slug' => 'task_forwarding.read', 'module' => 'task_forwarding', 'action' => 'read', 'description' => 'View task forwardings'],
            ['name' => 'TaskForwarding.Update', 'slug' => 'task_forwarding.update', 'module' => 'task_forwarding', 'action' => 'update', 'description' => 'Update task forwardings'],
            ['name' => 'TaskForwarding.Delete', 'slug' => 'task_forwarding.delete', 'module' => 'task_forwarding', 'action' => 'delete', 'description' => 'Delete task forwardings'],

            // Task Assignment permissions
            ['name' => 'TaskAssignment.Create', 'slug' => 'task_assignment.create', 'module' => 'task_assignment', 'action' => 'create', 'description' => 'Create task assignments'],
            ['name' => 'TaskAssignment.Read', 'slug' => 'task_assignment.read', 'module' => 'task_assignment', 'action' => 'read', 'description' => 'View task assignments'],
            ['name' => 'TaskAssignment.Update', 'slug' => 'task_assignment.update', 'module' => 'task_assignment', 'action' => 'update', 'description' => 'Update task assignments'],
            ['name' => 'TaskAssignment.Delete', 'slug' => 'task_assignment.delete', 'module' => 'task_assignment', 'action' => 'delete', 'description' => 'Delete task assignments'],

            // Notification permissions
            ['name' => 'Notification.Read', 'slug' => 'notification.read', 'module' => 'notification', 'action' => 'read', 'description' => 'View notifications'],
            ['name' => 'Notification.Update', 'slug' => 'notification.update', 'module' => 'notification', 'action' => 'update', 'description' => 'Update notifications'],
            ['name' => 'Notification.Delete', 'slug' => 'notification.delete', 'module' => 'notification', 'action' => 'delete', 'description' => 'Delete notifications'],

            // System permissions
            ['name' => 'System.Settings', 'slug' => 'system.settings', 'module' => 'system', 'action' => 'settings', 'description' => 'Access system settings'],
            ['name' => 'System.Maintenance', 'slug' => 'system.maintenance', 'module' => 'system', 'action' => 'maintenance', 'description' => 'Perform system maintenance'],
            ['name' => 'System.Backup', 'slug' => 'system.backup', 'module' => 'system', 'action' => 'backup', 'description' => 'Backup system data'],
        ];

        foreach ($permissions as $permission) {
            DB::table('permissions')->updateOrInsert(
                ['slug' => $permission['slug']],
                $permission
            );
        }
    }

    private function seedRoles(): void
    {
        $roles = [
            [
                'name' => 'Super Admin',
                'slug' => 'super-admin',
                'description' => 'Full system access',
                'is_default' => false,
                'level' => 10,
            ],
            [
                'name' => 'Administrator',
                'slug' => 'admin',
                'description' => 'System administrator with most permissions',
                'is_default' => false,
                'level' => 8,
            ],
            [
                'name' => 'Manager',
                'slug' => 'manager',
                'description' => 'Department manager with team management permissions',
                'is_default' => false,
                'level' => 6,
            ],
            [
                'name' => 'Team Lead',
                'slug' => 'team-lead',
                'description' => 'Team lead with review and assignment permissions',
                'is_default' => false,
                'level' => 4,
            ],
            [
                'name' => 'Developer',
                'slug' => 'developer',
                'description' => 'Developer with task management permissions',
                'is_default' => false,
                'level' => 2,
            ],
            [
                'name' => 'Support Agent',
                'slug' => 'support-agent',
                'description' => 'Support agent with ticket management permissions',
                'is_default' => false,
                'level' => 2,
            ]
        ];

        foreach ($roles as $role) {
            DB::table('roles')->updateOrInsert(
                ['slug' => $role['slug']],
                $role
            );
        }
    }

    private function seedRolePermissions(): void
    {
        // Super Admin - All permissions
        $superAdminId = DB::table('roles')->where('slug', 'super-admin')->value('id');
        if (!$superAdminId) {
            // Roles are required for seeding role_permissions; skip to avoid null role_id inserts
            return;
        }
        $allPermissionIds = DB::table('permissions')->pluck('id')->toArray();
        foreach ($allPermissionIds as $permissionId) {
            DB::table('role_permissions')->updateOrInsert(
                ['role_id' => $superAdminId, 'permission_id' => $permissionId],
                ['role_id' => $superAdminId, 'permission_id' => $permissionId]
            );
        }

        // Administrator - Most permissions except some sensitive ones
        $adminId = DB::table('roles')->where('slug', 'admin')->value('id');
        $adminPermissions = [
            'task.create', 'task.read', 'task.update', 'task.assign', 'task.reassign', 'task.change_priority', 'task.change_sla',
            'task.start', 'task.update_progress', 'task.block', 'task.unblock', 'task.request_review',
            'task.review_approve', 'task.review_reject', 'task.complete', 'task.cancel', 'task.view_all',
            'task.view_own', 'task.view_department', 'task.manage_others',
            'ticket.create', 'ticket.read', 'ticket.update', 'ticket.delete', 'ticket.assign', 'ticket.approve',
            'ticket.reject', 'ticket.view_all', 'ticket.view_own', 'ticket.manage',
            'user.create', 'user.read', 'user.update', 'user.delete', 'user.manage_roles', 'user.manage_permissions',
            'employee.create', 'employee.read', 'employee.update', 'employee.delete',
            'department.create', 'department.read', 'department.update', 'department.delete', 'department.manage_users',
            'client.create', 'client.read', 'client.update', 'client.delete', 'client.manage_products',
            'product.create', 'product.read', 'product.update', 'product.delete',
            'project.create', 'project.read', 'project.update', 'project.delete',
            'sla.create', 'sla.read', 'sla.update', 'sla.delete',
            'report.view', 'report.generate', 'report.export', 'report.create', 'report.update', 'report.delete',
            'activity_log.read', 'activity_log.delete',
            'timeline_event.create', 'timeline_event.read', 'timeline_event.update', 'timeline_event.delete',
            'task_dependency.create', 'task_dependency.read', 'task_dependency.update', 'task_dependency.delete',
            'task_forwarding.create', 'task_forwarding.read', 'task_forwarding.update', 'task_forwarding.delete',
            'task_assignment.create', 'task_assignment.read', 'task_assignment.update', 'task_assignment.delete',
            'notification.read', 'notification.update', 'notification.delete',
            'system.settings', 'system.maintenance'
        ];
        foreach ($adminPermissions as $permissionSlug) {
            $permissionId = DB::table('permissions')->where('slug', $permissionSlug)->value('id');
            if ($permissionId && $adminId) {
                DB::table('role_permissions')->updateOrInsert(
                    ['role_id' => $adminId, 'permission_id' => $permissionId],
                    ['role_id' => $adminId, 'permission_id' => $permissionId]
                );
            }
        }

        // Manager - Team management and oversight
        $managerId = DB::table('roles')->where('slug', 'manager')->value('id');
        $managerPermissions = [
            'task.create', 'task.read', 'task.update', 'task.assign', 'task.reassign', 'task.change_priority', 'task.change_sla',
            'task.start', 'task.update_progress', 'task.block', 'task.unblock', 'task.request_review',
            'task.review_approve', 'task.review_reject', 'task.complete', 'task.cancel', 'task.view_all',
            'task.view_own', 'task.view_department', 'task.manage_others',
            'ticket.create', 'ticket.read', 'ticket.update', 'ticket.assign', 'ticket.approve',
            'ticket.reject', 'ticket.view_all', 'ticket.view_own', 'ticket.manage',
            'user.read', 'user.update', 'user.manage_roles',
            'employee.read', 'employee.update',
            'department.read', 'department.update', 'department.manage_users',
            'client.read', 'client.update',
            'product.read',
            'project.read',
            'sla.read',
            'report.view', 'report.generate', 'report.create', 'report.update',
            'activity_log.read',
            'timeline_event.read',
            'task_dependency.read',
            'task_forwarding.read',
            'task_assignment.read',
            'notification.read', 'notification.update',
            'system.settings'
        ];
        foreach ($managerPermissions as $permissionSlug) {
            $permissionId = DB::table('permissions')->where('slug', $permissionSlug)->value('id');
            if ($permissionId && $managerId) {
                DB::table('role_permissions')->updateOrInsert(
                    ['role_id' => $managerId, 'permission_id' => $permissionId],
                    ['role_id' => $managerId, 'permission_id' => $permissionId]
                );
            }
        }

        // Team Lead - Review and assignment permissions
        $teamLeadId = DB::table('roles')->where('slug', 'team-lead')->value('id');
        $teamLeadPermissions = [
            'task.create', 'task.read', 'task.update', 'task.assign', 'task.reassign', 'task.change_priority',
            'task.start', 'task.update_progress', 'task.block', 'task.unblock', 'task.request_review',
            'task.review_approve', 'task.review_reject', 'task.complete', 'task.cancel', 'task.view_all',
            'task.view_own', 'task.view_department',
            'ticket.create', 'ticket.read', 'ticket.update', 'ticket.assign', 'ticket.approve',
            'ticket.reject', 'ticket.view_all', 'ticket.view_own',
            'user.read', 'user.update',
            'employee.read',
            'department.read',
            'client.read',
            'product.read',
            'project.read',
            'report.view', 'report.create',
            'activity_log.read',
            'timeline_event.read',
            'task_dependency.read',
            'task_forwarding.read',
            'task_assignment.read',
            'notification.read', 'notification.update'
        ];
        foreach ($teamLeadPermissions as $permissionSlug) {
            $permissionId = DB::table('permissions')->where('slug', $permissionSlug)->value('id');
            if ($permissionId && $teamLeadId) {
                DB::table('role_permissions')->updateOrInsert(
                    ['role_id' => $teamLeadId, 'permission_id' => $permissionId],
                    ['role_id' => $teamLeadId, 'permission_id' => $permissionId]
                );
            }
        }

        // Developer - Task management permissions
        $developerId = DB::table('roles')->where('slug', 'developer')->value('id');
        $developerPermissions = [
            'task.create', 'task.read', 'task.update', 'task.start', 'task.update_progress', 'task.block', 'task.unblock', 'task.request_review',
            'task.complete', 'task.cancel', 'task.view_own', 'task.view_department',
            'ticket.read', 'ticket.view_own',
            'user.read',
            'employee.read',
            'department.read',
            'client.read',
            'product.read',
            'project.read',
            'report.view', 'report.create', 'report.update', 'report.delete',
            'activity_log.read',
            'timeline_event.read', 'timeline_event.create', 'timeline_event.update',
            'task_dependency.read', 'task_dependency.create', 'task_dependency.update',
            'task_forwarding.read', 'task_forwarding.create', 'task_forwarding.update',
            'task_assignment.read', 'task_assignment.create', 'task_assignment.update',
            'notification.read', 'notification.update'
        ];
        foreach ($developerPermissions as $permissionSlug) {
            $permissionId = DB::table('permissions')->where('slug', $permissionSlug)->value('id');
            if ($permissionId && $developerId) {
                DB::table('role_permissions')->updateOrInsert(
                    ['role_id' => $developerId, 'permission_id' => $permissionId],
                    ['role_id' => $developerId, 'permission_id' => $permissionId]
                );
            }
        }

        // Support Agent - Ticket management permissions
        $supportAgentId = DB::table('roles')->where('slug', 'support-agent')->value('id');
        $supportAgentPermissions = [
            'task.create', 'task.read', 'task.update', 'task.start', 'task.update_progress', 'task.block', 'task.unblock', 'task.request_review',
            'task.complete', 'task.cancel', 'task.view_own', 'task.view_department',
            'ticket.create', 'ticket.read', 'ticket.update', 'ticket.assign', 'ticket.approve',
            'ticket.reject', 'ticket.view_own',
            'user.read',
            'employee.read',
            'department.read',
            'client.read',
            'product.read',
            'project.read',
            'report.view', 'report.create', 'report.update', 'report.delete',
            'activity_log.read',
            'timeline_event.read', 'timeline_event.create', 'timeline_event.update',
            'task_dependency.read',
            'task_forwarding.read', 'task_forwarding.create', 'task_forwarding.update',
            'task_assignment.read', 'task_assignment.create', 'task_assignment.update',
            'notification.read', 'notification.update'
        ];
        foreach ($supportAgentPermissions as $permissionSlug) {
            $permissionId = DB::table('permissions')->where('slug', $permissionSlug)->value('id');
            if ($permissionId && $supportAgentId) {
                DB::table('role_permissions')->updateOrInsert(
                    ['role_id' => $supportAgentId, 'permission_id' => $permissionId],
                    ['role_id' => $supportAgentId, 'permission_id' => $permissionId]
                );
            }
        }
    }

    private function seedDepartments(): void
    {
        $departments = [
            [
                'name' => 'Management',
                'description' => 'Product management and planning team',
                'color' => '#8B5CF6',
                'sort_order' => 4,
                'status' => 'active',
            ],
            [
                'name' => 'Development',
                'description' => 'Software development and engineering team',
                'color' => '#3B82F6',
                'sort_order' => 1,
                'status' => 'active',
            ],
            [
                'name' => 'Support',
                'description' => 'Customer support and assistance team',
                'color' => '#10B981',
                'sort_order' => 2,
                'status' => 'active',
            ]
        ];

        foreach ($departments as $department) {
            DB::table('departments')->updateOrInsert(
                ['name' => $department['name']],
                $department
            );
        }
    }

    private function seedProducts(): void
    {
        $products = [
            [
                'name' => 'Desalite Connect',
                'version' => '1.0.0',
                'description' => 'Complete school management solution',
                'status' => 'active',
                'metadata' => json_encode([
                    'category' => 'Education',
                    'features' => ['attendance', 'fees', 'exams', 'timetable'],
                    'supported_modules' => ['core', 'hr', 'finance']
                ]),
            ],
            [
                'name' => 'Ednect',
                'version' => '1.0.0',
                'description' => 'School management system',
                'status' => 'active',
                'metadata' => json_encode([
                    'category' => 'Education',
                    'features' => ['attendance', 'fees', 'exams', 'timetable'],
                    'supported_modules' => ['core', 'hr', 'finance']
                ]),
            ],
            [
                'name' => 'Transtract',
                'version' => '2.0.0',
                'description' => 'Enterprise resource planning system',
                'status' => 'active',
                'metadata' => json_encode([
                    'category' => 'Enterprise',
                    'features' => ['inventory', 'finance'],
                    'supported_modules' => ['all']
                ]),
            ],
        ];

        foreach ($products as $product) {
            DB::table('products')->updateOrInsert(
                ['name' => $product['name']],
                $product
            );
        }
    }

    private function seedAdminUser(): void
    {
        $adminUserId = DB::table('users')->updateOrInsert(
            ['email' => 'admin@example.com'],
            [
                'name' => 'Admin User',
                'email' => 'admin@example.com',
                'password' => Hash::make('password123'),
                'status' => 'active',
                'created_at' => now(),
                'updated_at' => now(),
            ]
        );

        if ($adminUserId) {
            $adminUserId = DB::table('users')->where('email', 'admin@example.com')->value('id');
            $adminRoleId = DB::table('roles')->where('slug', 'super-admin')->value('id');
             
            DB::table('role_user')->updateOrInsert(
                ['user_id' => $adminUserId, 'role_id' => $adminRoleId],
                ['user_id' => $adminUserId, 'role_id' => $adminRoleId]
            );
        }
    }
}
