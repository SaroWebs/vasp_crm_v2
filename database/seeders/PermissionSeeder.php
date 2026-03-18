<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Permission;
use App\Models\Role;

class PermissionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Define permissions
        $permissions = [
            // Task permissions
            ['name' => 'Create Task', 'slug' => 'task.create', 'module' => 'task', 'action' => 'create'],
            ['name' => 'Read Task', 'slug' => 'task.read', 'module' => 'task', 'action' => 'read'],
            ['name' => 'Update Task', 'slug' => 'task.update', 'module' => 'task', 'action' => 'update'],
            ['name' => 'Delete Task', 'slug' => 'task.delete', 'module' => 'task', 'action' => 'delete'],
            
            // Ticket permissions
            ['name' => 'Create Ticket', 'slug' => 'ticket.create', 'module' => 'ticket', 'action' => 'create'],
            ['name' => 'Read Ticket', 'slug' => 'ticket.read', 'module' => 'ticket', 'action' => 'read'],
            ['name' => 'Update Ticket', 'slug' => 'ticket.update', 'module' => 'ticket', 'action' => 'update'],
            ['name' => 'Delete Ticket', 'slug' => 'ticket.delete', 'module' => 'ticket', 'action' => 'delete'],
            
            // User management permissions
            ['name' => 'Create User', 'slug' => 'user.create', 'module' => 'user', 'action' => 'create'],
            ['name' => 'Read User', 'slug' => 'user.read', 'module' => 'user', 'action' => 'read'],
            ['name' => 'Update User', 'slug' => 'user.update', 'module' => 'user', 'action' => 'update'],
            ['name' => 'Delete User', 'slug' => 'user.delete', 'module' => 'user', 'action' => 'delete'],
            
            // Role management permissions
            ['name' => 'Create Role', 'slug' => 'role.create', 'module' => 'role', 'action' => 'create'],
            ['name' => 'Read Role', 'slug' => 'role.read', 'module' => 'role', 'action' => 'read'],
            ['name' => 'Update Role', 'slug' => 'role.update', 'module' => 'role', 'action' => 'update'],
            ['name' => 'Delete Role', 'slug' => 'role.delete', 'module' => 'role', 'action' => 'delete'],
            
            // Department permissions
            ['name' => 'Create Department', 'slug' => 'department.create', 'module' => 'department', 'action' => 'create'],
            ['name' => 'Read Department', 'slug' => 'department.read', 'module' => 'department', 'action' => 'read'],
            ['name' => 'Update Department', 'slug' => 'department.update', 'module' => 'department', 'action' => 'update'],
            ['name' => 'Delete Department', 'slug' => 'department.delete', 'module' => 'department', 'action' => 'delete'],

            // Product permissions
            ['name' => 'Create Product', 'slug' => 'product.create', 'module' => 'product', 'action' => 'create'],
            ['name' => 'Read Product', 'slug' => 'product.read', 'module' => 'product', 'action' => 'read'],
            ['name' => 'Update Product', 'slug' => 'product.update', 'module' => 'product', 'action' => 'update'],
            ['name' => 'Delete Product', 'slug' => 'product.delete', 'module' => 'product', 'action' => 'delete'],

            // Client permissions
            ['name' => 'Create Client', 'slug' => 'client.create', 'module' => 'client', 'action' => 'create'],
            ['name' => 'Read Client', 'slug' => 'client.read', 'module' => 'client', 'action' => 'read'],
            ['name' => 'Update Client', 'slug' => 'client.update', 'module' => 'client', 'action' => 'update'],
            ['name' => 'Delete Client', 'slug' => 'client.delete', 'module' => 'client', 'action' => 'delete'],

            // Employee permissions
            ['name' => 'Create Employee', 'slug' => 'employee.create', 'module' => 'employee', 'action' => 'create'],
            ['name' => 'Read Employee', 'slug' => 'employee.read', 'module' => 'employee', 'action' => 'read'],
            ['name' => 'Update Employee', 'slug' => 'employee.update', 'module' => 'employee', 'action' => 'update'],
            ['name' => 'Delete Employee', 'slug' => 'employee.delete', 'module' => 'employee', 'action' => 'delete'],

            // Task History permissions
            ['name' => 'Read Task History', 'slug' => 'task-history.read', 'module' => 'task-history', 'action' => 'read'],

            // Task Dependency permissions
            ['name' => 'Create Task Dependency', 'slug' => 'task-dependency.create', 'module' => 'task-dependency', 'action' => 'create'],
            ['name' => 'Read Task Dependency', 'slug' => 'task-dependency.read', 'module' => 'task-dependency', 'action' => 'read'],
            ['name' => 'Update Task Dependency', 'slug' => 'task-dependency.update', 'module' => 'task-dependency', 'action' => 'update'],
            ['name' => 'Delete Task Dependency', 'slug' => 'task-dependency.delete', 'module' => 'task-dependency', 'action' => 'delete'],

            // Task Forwarding permissions
            ['name' => 'Create Task Forwarding', 'slug' => 'task-forwarding.create', 'module' => 'task-forwarding', 'action' => 'create'],
            ['name' => 'Read Task Forwarding', 'slug' => 'task-forwarding.read', 'module' => 'task-forwarding', 'action' => 'read'],
            ['name' => 'Update Task Forwarding', 'slug' => 'task-forwarding.update', 'module' => 'task-forwarding', 'action' => 'update'],
            ['name' => 'Delete Task Forwarding', 'slug' => 'task-forwarding.delete', 'module' => 'task-forwarding', 'action' => 'delete'],

            // Task Comment permissions
            ['name' => 'Create Task Comment', 'slug' => 'task-comment.create', 'module' => 'task-comment', 'action' => 'create'],
            ['name' => 'Read Task Comment', 'slug' => 'task-comment.read', 'module' => 'task-comment', 'action' => 'read'],
            ['name' => 'Update Task Comment', 'slug' => 'task-comment.update', 'module' => 'task-comment', 'action' => 'update'],
            ['name' => 'Delete Task Comment', 'slug' => 'task-comment.delete', 'module' => 'task-comment', 'action' => 'delete'],

            // Task Attachment permissions
            ['name' => 'Create Task Attachment', 'slug' => 'task-attachment.create', 'module' => 'task-attachment', 'action' => 'create'],
            ['name' => 'Read Task Attachment', 'slug' => 'task-attachment.read', 'module' => 'task-attachment', 'action' => 'read'],
            ['name' => 'Delete Task Attachment', 'slug' => 'task-attachment.delete', 'module' => 'task-attachment', 'action' => 'delete'],

            // Comment Attachment permissions
            ['name' => 'Delete Comment Attachment', 'slug' => 'comment-attachment.delete', 'module' => 'comment-attachment', 'action' => 'delete'],

            // Ticket Comment permissions
            ['name' => 'Create Ticket Comment', 'slug' => 'ticket-comment.create', 'module' => 'ticket-comment', 'action' => 'create'],
            ['name' => 'Read Ticket Comment', 'slug' => 'ticket-comment.read', 'module' => 'ticket-comment', 'action' => 'read'],
            ['name' => 'Update Ticket Comment', 'slug' => 'ticket-comment.update', 'module' => 'ticket-comment', 'action' => 'update'],
            ['name' => 'Delete Ticket Comment', 'slug' => 'ticket-comment.delete', 'module' => 'ticket-comment', 'action' => 'delete'],

            // Ticket Attachment permissions
            ['name' => 'Create Ticket Attachment', 'slug' => 'ticket-attachment.create', 'module' => 'ticket-attachment', 'action' => 'create'],
            ['name' => 'Read Ticket Attachment', 'slug' => 'ticket-attachment.read', 'module' => 'ticket-attachment', 'action' => 'read'],
            ['name' => 'Delete Ticket Attachment', 'slug' => 'ticket-attachment.delete', 'module' => 'ticket-attachment', 'action' => 'delete'],

            // Ticket History permissions
            ['name' => 'Read Ticket History', 'slug' => 'ticket-history.read', 'module' => 'ticket-history', 'action' => 'read'],

            // Timeline Event permissions
            ['name' => 'Create Timeline Event', 'slug' => 'timeline-event.create', 'module' => 'timeline-event', 'action' => 'create'],
            ['name' => 'Read Timeline Event', 'slug' => 'timeline-event.read', 'module' => 'timeline-event', 'action' => 'read'],
            ['name' => 'Update Timeline Event', 'slug' => 'timeline-event.update', 'module' => 'timeline-event', 'action' => 'update'],
            ['name' => 'Delete Timeline Event', 'slug' => 'timeline-event.delete', 'module' => 'timeline-event', 'action' => 'delete'],

            // Activity Log permissions
            ['name' => 'Read Activity Log', 'slug' => 'activity-log.read', 'module' => 'activity-log', 'action' => 'read'],
            ['name' => 'Clear Activity Log', 'slug' => 'activity-log.clear', 'module' => 'activity-log', 'action' => 'clear'],
            ['name' => 'Export Activity Log', 'slug' => 'activity-log.export', 'module' => 'activity-log', 'action' => 'export'],

            // Notification permissions
            ['name' => 'Read Notification', 'slug' => 'notification.read', 'module' => 'notification', 'action' => 'read'],
            ['name' => 'Update Notification', 'slug' => 'notification.update', 'module' => 'notification', 'action' => 'update'],
            ['name' => 'Delete Notification', 'slug' => 'notification.delete', 'module' => 'notification', 'action' => 'delete'],

            // Dashboard permissions
            ['name' => 'Read Dashboard', 'slug' => 'dashboard.read', 'module' => 'dashboard', 'action' => 'read'],

            // Task Time Entry permissions
            ['name' => 'Create Task Time Entry', 'slug' => 'task-time-entry.create', 'module' => 'task-time-entry', 'action' => 'create'],
            ['name' => 'Read Task Time Entry', 'slug' => 'task-time-entry.read', 'module' => 'task-time-entry', 'action' => 'read'],
            ['name' => 'Update Task Time Entry', 'slug' => 'task-time-entry.update', 'module' => 'task-time-entry', 'action' => 'update'],
            ['name' => 'Delete Task Time Entry', 'slug' => 'task-time-entry.delete', 'module' => 'task-time-entry', 'action' => 'delete'],

            // Task Audit Event permissions
            ['name' => 'Read Task Audit Event', 'slug' => 'task-audit-event.read', 'module' => 'task-audit-event', 'action' => 'read'],

            // Workload Metric permissions
            ['name' => 'Read Workload Metric', 'slug' => 'workload-metric.read', 'module' => 'workload-metric', 'action' => 'read'],

            // User Skill permissions
            ['name' => 'Create User Skill', 'slug' => 'user-skill.create', 'module' => 'user-skill', 'action' => 'create'],
            ['name' => 'Read User Skill', 'slug' => 'user-skill.read', 'module' => 'user-skill', 'action' => 'read'],
            ['name' => 'Update User Skill', 'slug' => 'user-skill.update', 'module' => 'user-skill', 'action' => 'update'],
            ['name' => 'Delete User Skill', 'slug' => 'user-skill.delete', 'module' => 'user-skill', 'action' => 'delete'],

            // SLA Policy permissions
            ['name' => 'Create SLA Policy', 'slug' => 'sla-policy.create', 'module' => 'sla-policy', 'action' => 'create'],
            ['name' => 'Read SLA Policy', 'slug' => 'sla-policy.read', 'module' => 'sla-policy', 'action' => 'read'],
            ['name' => 'Update SLA Policy', 'slug' => 'sla-policy.update', 'module' => 'sla-policy', 'action' => 'update'],
            ['name' => 'Delete SLA Policy', 'slug' => 'sla-policy.delete', 'module' => 'sla-policy', 'action' => 'delete'],

            // Project permissions
            ['name' => 'Create Project', 'slug' => 'project.create', 'module' => 'project', 'action' => 'create'],
            ['name' => 'Read Project', 'slug' => 'project.read', 'module' => 'project', 'action' => 'read'],
            ['name' => 'Update Project', 'slug' => 'project.update', 'module' => 'project', 'action' => 'update'],
            ['name' => 'Delete Project', 'slug' => 'project.delete', 'module' => 'project', 'action' => 'delete'],
            ['name' => 'Restore Project', 'slug' => 'project.restore', 'module' => 'project', 'action' => 'restore'],
            ['name' => 'Manage Project Team', 'slug' => 'project.manage_team', 'module' => 'project', 'action' => 'manage_team'],
            ['name' => 'Manage Project Milestones', 'slug' => 'project.manage_milestones', 'module' => 'project', 'action' => 'manage_milestones'],
            ['name' => 'Manage Project Phases', 'slug' => 'project.manage_phases', 'module' => 'project', 'action' => 'manage_phases'],
            ['name' => 'Manage Project Timeline', 'slug' => 'project.manage_timeline', 'module' => 'project', 'action' => 'manage_timeline'],
            ['name' => 'Manage Project Attachments', 'slug' => 'project.manage_attachments', 'module' => 'project', 'action' => 'manage_attachments'],
            ['name' => 'View Project Reports', 'slug' => 'project.view_reports', 'module' => 'project', 'action' => 'view_reports'],

            // Project Team permissions
            ['name' => 'Create Project Team', 'slug' => 'project-team.create', 'module' => 'project-team', 'action' => 'create'],
            ['name' => 'Read Project Team', 'slug' => 'project-team.read', 'module' => 'project-team', 'action' => 'read'],
            ['name' => 'Update Project Team', 'slug' => 'project-team.update', 'module' => 'project-team', 'action' => 'update'],
            ['name' => 'Delete Project Team', 'slug' => 'project-team.delete', 'module' => 'project-team', 'action' => 'delete'],

            // Task Type permissions
            ['name' => 'Create Task Type', 'slug' => 'task-type.create', 'module' => 'task-type', 'action' => 'create'],
            ['name' => 'Read Task Type', 'slug' => 'task-type.read', 'module' => 'task-type', 'action' => 'read'],
            ['name' => 'Update Task Type', 'slug' => 'task-type.update', 'module' => 'task-type', 'action' => 'update'],
            ['name' => 'Delete Task Type', 'slug' => 'task-type.delete', 'module' => 'task-type', 'action' => 'delete'],

            // Additional route-specific permissions based on web routes
            ['name' => 'Restore Client', 'slug' => 'client.restore', 'module' => 'client', 'action' => 'restore'],
            ['name' => 'Restore Product', 'slug' => 'product.restore', 'module' => 'product', 'action' => 'restore'],
            ['name' => 'Get Product Statistics', 'slug' => 'product.get-statistics', 'module' => 'product', 'action' => 'get-statistics'],
            ['name' => 'Update Product Status', 'slug' => 'product.update-status', 'module' => 'product', 'action' => 'update-status'],
            ['name' => 'Get Deleted Comments', 'slug' => 'ticket-comment.get-deleted', 'module' => 'ticket-comment', 'action' => 'get-deleted'],
            ['name' => 'Restore Comment', 'slug' => 'ticket-comment.restore', 'module' => 'ticket-comment', 'action' => 'restore'],
            ['name' => 'Force Delete Comment', 'slug' => 'ticket-comment.force-delete', 'module' => 'ticket-comment', 'action' => 'force-delete'],
            ['name' => 'Assign Ticket', 'slug' => 'ticket.assign', 'module' => 'ticket', 'action' => 'assign'],
            ['name' => 'Approve Ticket', 'slug' => 'ticket.approve', 'module' => 'ticket', 'action' => 'approve'],
            ['name' => 'Reject Ticket', 'slug' => 'ticket.reject', 'module' => 'ticket', 'action' => 'reject'],
            ['name' => 'Get Tickets For Approval', 'slug' => 'ticket.get-approval-queue', 'module' => 'ticket', 'action' => 'get-approval-queue'],
            ['name' => 'Get Available Users', 'slug' => 'department.get-available-users', 'module' => 'department', 'action' => 'get-available-users'],
            ['name' => 'Assign User', 'slug' => 'department.assign-user', 'module' => 'department', 'action' => 'assign-user'],
            ['name' => 'Remove User', 'slug' => 'department.remove-user', 'module' => 'department', 'action' => 'remove-user'],
            ['name' => 'Bulk Assign Users', 'slug' => 'department.bulk-assign-users', 'module' => 'department', 'action' => 'bulk-assign-users'],
            ['name' => 'Get Notifications Data', 'slug' => 'notification.get-data', 'module' => 'notification', 'action' => 'get-data'],
            ['name' => 'Mark All Notifications Read', 'slug' => 'notification.mark-all-read', 'module' => 'notification', 'action' => 'mark-all-read'],
            ['name' => 'Add Permissions to Role', 'slug' => 'role.add-permissions', 'module' => 'role', 'action' => 'add-permissions'],
            ['name' => 'Remove Permission from Role', 'slug' => 'role.remove-permission', 'module' => 'role', 'action' => 'remove-permission'],
            ['name' => 'Get Users For Assignment', 'slug' => 'user.get-assignment', 'module' => 'user', 'action' => 'get-assignment'],
            ['name' => 'Assign Roles to User', 'slug' => 'user.assign-roles', 'module' => 'user', 'action' => 'assign-roles'],
            ['name' => 'Grant Permission to User', 'slug' => 'user.grant-permission', 'module' => 'user', 'action' => 'grant-permission'],
            ['name' => 'Deny Permission to User', 'slug' => 'user.deny-permission', 'module' => 'user', 'action' => 'deny-permission'],
            ['name' => 'Revoke Permission from User', 'slug' => 'user.revoke-permission', 'module' => 'user', 'action' => 'revoke-permission'],
            ['name' => 'Bulk Manage User Permissions', 'slug' => 'user.bulk-manage-permissions', 'module' => 'user', 'action' => 'bulk-manage-permissions'],
            ['name' => 'Update Employee Roles', 'slug' => 'employee.update-roles', 'module' => 'employee', 'action' => 'update-roles'],
            ['name' => 'Start Task', 'slug' => 'task.start', 'module' => 'task', 'action' => 'start'],
            ['name' => 'Pause Task', 'slug' => 'task.pause', 'module' => 'task', 'action' => 'pause'],
            ['name' => 'Resume Task', 'slug' => 'task.resume', 'module' => 'task', 'action' => 'resume'],
            ['name' => 'End Task', 'slug' => 'task.end', 'module' => 'task', 'action' => 'end'],
            ['name' => 'Calculate Time Spent', 'slug' => 'task.calculate-time-spent', 'module' => 'task', 'action' => 'calculate-time-spent'],
            ['name' => 'Calculate Remaining Time', 'slug' => 'task.calculate-remaining-time', 'module' => 'task', 'action' => 'calculate-remaining-time'],
            ['name' => 'Get Task Types', 'slug' => 'task.get-task-types', 'module' => 'task', 'action' => 'get-task-types'],
            ['name' => 'Get SLA Policies by Task Type', 'slug' => 'task.get-sla-policies-by-task-type', 'module' => 'task', 'action' => 'get-sla-policies-by-task-type'],
            ['name' => 'Get My Tasks', 'slug' => 'task.get-my-tasks', 'module' => 'task', 'action' => 'get-my-tasks'],
            ['name' => 'Store Self Assigned Task', 'slug' => 'task.store-self-assigned', 'module' => 'task', 'action' => 'store-self-assigned'],
            ['name' => 'Get Tasks by Status', 'slug' => 'task.get-tasks-by-status', 'module' => 'task', 'action' => 'get-tasks-by-status'],
            ['name' => 'Get History', 'slug' => 'task.get-history', 'module' => 'task', 'action' => 'get-history'],
            ['name' => 'Get Workload Metrics', 'slug' => 'task.get-workload-metrics', 'module' => 'task', 'action' => 'get-workload-metrics'],
            ['name' => 'Get Audit Events', 'slug' => 'task.get-audit-events', 'module' => 'task', 'action' => 'get-audit-events'],
            ['name' => 'Start User Task', 'slug' => 'user-task.start', 'module' => 'user-task', 'action' => 'start'],
            ['name' => 'Pause User Task', 'slug' => 'user-task.pause', 'module' => 'user-task', 'action' => 'pause'],
            ['name' => 'Resume User Task', 'slug' => 'user-task.resume', 'module' => 'user-task', 'action' => 'resume'],
            ['name' => 'End User Task', 'slug' => 'user-task.end', 'module' => 'user-task', 'action' => 'end'],
            ['name' => 'Calculate User Task Time Spent', 'slug' => 'user-task.calculate-time-spent', 'module' => 'user-task', 'action' => 'calculate-time-spent'],
            ['name' => 'Calculate User Task Remaining Time', 'slug' => 'user-task.calculate-remaining-time', 'module' => 'user-task', 'action' => 'calculate-remaining-time'],
            ['name' => 'Accept Task Forwarding', 'slug' => 'task-forwarding.accept', 'module' => 'task-forwarding', 'action' => 'accept'],
            ['name' => 'Reject Task Forwarding', 'slug' => 'task-forwarding.reject', 'module' => 'task-forwarding', 'action' => 'reject'],
            ['name' => 'Get Model Activity', 'slug' => 'activity-log.get-model-activity', 'module' => 'activity-log', 'action' => 'get-model-activity'],
            ['name' => 'Get User Activity', 'slug' => 'activity-log.get-user-activity', 'module' => 'activity-log', 'action' => 'get-user-activity'],
            ['name' => 'Get Recent Activity', 'slug' => 'activity-log.get-recent-activity', 'module' => 'activity-log', 'action' => 'get-recent-activity'],
            ['name' => 'Clear Old Logs', 'slug' => 'activity-log.clear-old-logs', 'module' => 'activity-log', 'action' => 'clear-old-logs'],
            ['name' => 'Export Activity Logs', 'slug' => 'activity-log.export-logs', 'module' => 'activity-log', 'action' => 'export-logs'],
            ['name' => 'Get Unread Count', 'slug' => 'notification.get-unread-count', 'module' => 'notification', 'action' => 'get-unread-count'],
            ['name' => 'Get Recent Notifications', 'slug' => 'notification.get-recent', 'module' => 'notification', 'action' => 'get-recent'],
            ['name' => 'Bulk Mark Read', 'slug' => 'notification.bulk-mark-read', 'module' => 'notification', 'action' => 'bulk-mark-read'],
            ['name' => 'Bulk Delete Notifications', 'slug' => 'notification.bulk-delete', 'module' => 'notification', 'action' => 'bulk-delete'],
            ['name' => 'List Attachments', 'slug' => 'ticket.list-attachments', 'module' => 'ticket', 'action' => 'list-attachments'],
            ['name' => 'Upload Attachments', 'slug' => 'ticket.upload-attachments', 'module' => 'ticket', 'action' => 'upload-attachments'],
            ['name' => 'Remove Attachment', 'slug' => 'ticket.remove-attachment', 'module' => 'ticket', 'action' => 'remove-attachment'],
            ['name' => 'Get Data', 'slug' => 'department.get-data', 'module' => 'department', 'action' => 'get-data'],
            ['name' => 'Get Department Statistics', 'slug' => 'department.get-statistics', 'module' => 'department', 'action' => 'get-statistics'],
            ['name' => 'Get SLA Policy Statistics', 'slug' => 'sla-policy.get-statistics', 'module' => 'sla-policy', 'action' => 'get-statistics'],
            ['name' => 'Get Project Statistics', 'slug' => 'project.get-statistics', 'module' => 'project', 'action' => 'get-statistics'],
            ['name' => 'Get Project Team Statistics', 'slug' => 'project-team.get-statistics', 'module' => 'project-team', 'action' => 'get-statistics'],
            ['name' => 'Get Task Type Statistics', 'slug' => 'task-type.get-statistics', 'module' => 'task-type', 'action' => 'get-statistics'],
            ['name' => 'Get User Skill Statistics', 'slug' => 'user-skill.get-statistics', 'module' => 'user-skill', 'action' => 'get-statistics'],
            ['name' => 'Get Workload Metric Statistics', 'slug' => 'workload-metric.get-statistics', 'module' => 'workload-metric', 'action' => 'get-statistics'],
            ['name' => 'Get Task Audit Event Statistics', 'slug' => 'task-audit-event.get-statistics', 'module' => 'task-audit-event', 'action' => 'get-statistics'],
            ['name' => 'Get Task Time Entry Statistics', 'slug' => 'task-time-entry.get-statistics', 'module' => 'task-time-entry', 'action' => 'get-statistics'],
            ['name' => 'Get Task Dependency Statistics', 'slug' => 'task-dependency.get-statistics', 'module' => 'task-dependency', 'action' => 'get-statistics'],
            ['name' => 'Get Task Forwarding Statistics', 'slug' => 'task-forwarding.get-statistics', 'module' => 'task-forwarding', 'action' => 'get-statistics'],
            ['name' => 'Get Task Comment Statistics', 'slug' => 'task-comment.get-statistics', 'module' => 'task-comment', 'action' => 'get-statistics'],
            ['name' => 'Get Task Attachment Statistics', 'slug' => 'task-attachment.get-statistics', 'module' => 'task-attachment', 'action' => 'get-statistics'],
            ['name' => 'Get Comment Attachment Statistics', 'slug' => 'comment-attachment.get-statistics', 'module' => 'comment-attachment', 'action' => 'get-statistics'],
            ['name' => 'Get Ticket Comment Statistics', 'slug' => 'ticket-comment.get-statistics', 'module' => 'ticket-comment', 'action' => 'get-statistics'],
            ['name' => 'Get Ticket Attachment Statistics', 'slug' => 'ticket-attachment.get-statistics', 'module' => 'ticket-attachment', 'action' => 'get-statistics'],
            ['name' => 'Get Ticket History Statistics', 'slug' => 'ticket-history.get-statistics', 'module' => 'ticket-history', 'action' => 'get-statistics'],
            ['name' => 'Get Timeline Event Statistics', 'slug' => 'timeline-event.get-statistics', 'module' => 'timeline-event', 'action' => 'get-statistics'],
            ['name' => 'Get Activity Log Statistics', 'slug' => 'activity-log.get-statistics', 'module' => 'activity-log', 'action' => 'get-statistics'],
            ['name' => 'Get Notification Statistics', 'slug' => 'notification.get-statistics', 'module' => 'notification', 'action' => 'get-statistics'],
            ['name' => 'Get Dashboard Statistics', 'slug' => 'dashboard.get-statistics', 'module' => 'dashboard', 'action' => 'get-statistics'],
            ['name' => 'View Own Tasks', 'slug' => 'task.view-own', 'module' => 'task', 'action' => 'view-own'],
            ['name' => 'Update Own Tasks', 'slug' => 'task.update-own', 'module' => 'task', 'action' => 'update-own'],
            ['name' => 'Delete Own Tasks', 'slug' => 'task.delete-own', 'module' => 'task', 'action' => 'delete-own'],
            ['name' => 'Start Own Tasks', 'slug' => 'task.start-own', 'module' => 'task', 'action' => 'start-own'],
            ['name' => 'Pause Own Tasks', 'slug' => 'task.pause-own', 'module' => 'task', 'action' => 'pause-own'],
            ['name' => 'Resume Own Tasks', 'slug' => 'task.resume-own', 'module' => 'task', 'action' => 'resume-own'],
            ['name' => 'End Own Tasks', 'slug' => 'task.end-own', 'module' => 'task', 'action' => 'end-own'],
            ['name' => 'View Own Task History', 'slug' => 'task.view-own-history', 'module' => 'task', 'action' => 'view-own-history'],
            ['name' => 'Add Comments to Own Tasks', 'slug' => 'task-comment.add-own', 'module' => 'task-comment', 'action' => 'add-own'],
            ['name' => 'Update Comments on Own Tasks', 'slug' => 'task-comment.update-own', 'module' => 'task-comment', 'action' => 'update-own'],
            ['name' => 'Delete Comments on Own Tasks', 'slug' => 'task-comment.delete-own', 'module' => 'task-comment', 'action' => 'delete-own'],
            ['name' => 'Add Attachments to Own Tasks', 'slug' => 'task-attachment.add-own', 'module' => 'task-attachment', 'action' => 'add-own'],
            ['name' => 'Delete Attachments from Own Tasks', 'slug' => 'task-attachment.delete-own', 'module' => 'task-attachment', 'action' => 'delete-own'],
            ['name' => 'Track Time on Own Tasks', 'slug' => 'task-time-entry.track-own', 'module' => 'task-time-entry', 'action' => 'track-own'],
            ['name' => 'View Own Task Workload Metrics', 'slug' => 'task.view-own-workload-metrics', 'module' => 'task', 'action' => 'view-own-workload-metrics'],
            ['name' => 'View Own Task Audit Events', 'slug' => 'task.view-own-audit-events', 'module' => 'task', 'action' => 'view-own-audit-events'],
            ['name' => 'Forward Own Tasks', 'slug' => 'task.forward-own', 'module' => 'task', 'action' => 'forward-own'],
            ['name' => 'View Own Task Dependencies', 'slug' => 'task-dependency.view-own', 'module' => 'task-dependency', 'action' => 'view-own'],
            ['name' => 'Update Own Task Dependencies', 'slug' => 'task-dependency.update-own', 'module' => 'task-dependency', 'action' => 'update-own'],
            ['name' => 'View Own Task Forwardings', 'slug' => 'task-forwarding.view-own', 'module' => 'task-forwarding', 'action' => 'view-own'],
            ['name' => 'Accept Own Task Forwardings', 'slug' => 'task-forwarding.accept-own', 'module' => 'task-forwarding', 'action' => 'accept-own'],
            ['name' => 'Reject Own Task Forwardings', 'slug' => 'task-forwarding.reject-own', 'module' => 'task-forwarding', 'action' => 'reject-own'],
        ];

        // Create permissions
        foreach ($permissions as $permission) {
            Permission::firstOrCreate($permission);
        }

        // Create roles
        $roles = [
            [
                'name' => 'Super Admin',
                'slug' => 'super-admin',
                'description' => 'Super Administrator with all permissions',
                'level' => 3,
                'is_default' => false,
            ],
            [
                'name' => 'Manager',
                'slug' => 'manager',
                'description' => 'Department Manager with broad task and ticket management permissions',
                'level' => 2,
                'is_default' => false,
            ],
            [
                'name' => 'Employee',
                'slug' => 'employee',
                'description' => 'Basic employee with limited permissions',
                'level' => 1,
                'is_default' => true,
            ],
        ];

        foreach ($roles as $roleData) {
            $role = Role::firstOrCreate(['slug' => $roleData['slug']], $roleData);
            
            // Assign permissions to roles
            switch ($role->slug) {
                case 'super-admin':
                    // Super Admin gets all permissions
                    $allPermissions = Permission::all();
                    $role->permissions()->sync($allPermissions->pluck('id'));
                    break;
                    
                case 'manager':
                    // Manager gets all task and ticket permissions including route-specific ones
                    $managerPermissions = Permission::whereIn('module', ['task', 'ticket', 'department', 'user', 'product', 'client', 'employee', 'task-history', 'task-dependency', 'task-forwarding', 'task-comment', 'task-attachment', 'comment-attachment', 'ticket-comment', 'ticket-attachment', 'ticket-history', 'timeline-event', 'activity-log', 'notification', 'dashboard', 'task-time-entry', 'task-audit-event', 'workload-metric', 'user-skill', 'sla-policy', 'project', 'project-team', 'task-type'])
                        ->orWhere(function($query) {
                            $query->where('module', 'role')->whereIn('action', ['read', 'update']);
                        })
                        ->orWhere(function($query) {
                            // Include route-specific permissions for managers
                            $query->whereIn('slug', [
                                'client.restore',
                                'product.restore',
                                'product.get-statistics',
                                'product.update-status',
                                'ticket-comment.get-deleted',
                                'ticket-comment.restore',
                                'ticket-comment.force-delete',
                                'ticket.assign',
                                'ticket.approve',
                                'ticket.reject',
                                'ticket.get-approval-queue',
                                'department.get-available-users',
                                'department.assign-user',
                                'department.remove-user',
                                'department.bulk-assign-users',
                                'notification.get-data',
                                'notification.mark-all-read',
                                'role.add-permissions',
                                'role.remove-permission',
                                'user.get-assignment',
                                'user.assign-roles',
                                'user.grant-permission',
                                'user.deny-permission',
                                'user.revoke-permission',
                                'user.bulk-manage-permissions',
                                'employee.update-roles',
                                'task.start',
                                 'task.pause',
                                'task.resume',
                                'task.end',
                                'task.calculate-time-spent',
                                'task.calculate-remaining-time',
                                'task.get-task-types',
                                'task.get-sla-policies-by-task-type',
                                'task.get-my-tasks',
                                'task.store-self-assigned',
                                'task.get-tasks-by-status',
                                'task.get-history',
                                'task.get-workload-metrics',
                                'task.get-audit-events',
                                'user-task.start',
                                'user-task.pause',
                                'user-task.resume',
                                'user-task.end',
                                'user-task.calculate-time-spent',
                                'user-task.calculate-remaining-time',
                                'task-forwarding.accept',
                                'task-forwarding.reject',
                                'activity-log.get-model-activity',
                                'activity-log.get-user-activity',
                                'activity-log.get-statistics',
                                'activity-log.get-recent-activity',
                                'activity-log.clear-old-logs',
                                'activity-log.export-logs',
                                'notification.get-unread-count',
                                'notification.get-recent',
                                'notification.bulk-mark-read',
                                'notification.bulk-delete',
                                'ticket.list-attachments',
                                'ticket.upload-attachments',
                                'ticket.remove-attachment',
                                'department.get-data',
                                'department.get-statistics',
                                'product.get-statistics',
                                'sla-policy.get-statistics',
                                'project.get-statistics',
                                'project-team.get-statistics',
                                'task-type.get-statistics',
                                'user-skill.get-statistics',
                                'workload-metric.get-statistics',
                                'task-audit-event.get-statistics',
                                'task-time-entry.get-statistics',
                                'task-dependency.get-statistics',
                                'task-forwarding.get-statistics',
                                'task-comment.get-statistics',
                                'task-attachment.get-statistics',
                                'comment-attachment.get-statistics',
                                'ticket-comment.get-statistics',
                                'ticket-attachment.get-statistics',
                                'ticket-history.get-statistics',
                                'timeline-event.get-statistics',
                                'activity-log.get-statistics',
                                'notification.get-statistics',
                                'dashboard.get-statistics'
                            ]);
                        })
                        ->get();
                    $role->permissions()->sync($managerPermissions->pluck('id'));
                    break;
                    
                case 'employee':
                    // Employee gets basic task permissions including some route-specific ones and own task management
                    $employeePermissions = Permission::whereIn('slug', [
                        'task.create',
                        'task.read',
                        'task.update',
                        'ticket.create',
                        'ticket.read',
                        'ticket.update',
                        'department.read',
                        'product.read',
                        'task-comment.create',
                        'task-comment.read',
                        'task-comment.update',
                        'ticket-comment.create',
                        'ticket-comment.read',
                        'ticket-comment.update',
                        'task-attachment.create',
                        'task-attachment.read',
                        'ticket-attachment.create',
                        'ticket-attachment.read',
                        'task-time-entry.create',
                        'task-time-entry.read',
                        'dashboard.read',
                        // Add some route-specific permissions for employees
                        'task.start',
                        'task.pause',
                        'task.resume',
                        'task.end',
                        'task.calculate-time-spent',
                        'task.calculate-remaining-time',
                        'task.get-my-tasks',
                        'task.store-self-assigned',
                        'task.get-history',
                        'user-task.start',
                        'user-task.pause',
                        'user-task.resume',
                        'user-task.end',
                        'user-task.calculate-time-spent',
                        'user-task.calculate-remaining-time',
                        'notification.get-unread-count',
                        'notification.get-recent',
                        'notification.mark-read',
                        'task.get-task-types',
                        'task.get-sla-policies-by-task-type',
                        // Add own task management permissions for employees
                        'task.view-own',
                        'task.update-own',
                        'task.delete-own',
                        'task.start-own',
                        'task.pause-own',
                        'task.resume-own',
                        'task.end-own',
                        'task.view-own-history',
                        'task-comment.add-own',
                        'task-comment.update-own',
                        'task-comment.delete-own',
                        'task-attachment.add-own',
                        'task-attachment.delete-own',
                        'task-time-entry.track-own',
                        'task.view-own-workload-metrics',
                        'task.view-own-audit-events',
                        'task.forward-own',
                        'task-dependency.view-own',
                        'task-dependency.update-own',
                        'task-forwarding.view-own',
                        'task-forwarding.accept-own',
                        'task-forwarding.reject-own'
                    ])->get();
                    $role->permissions()->sync($employeePermissions->pluck('id'));
                    break;
            }
        }

        $this->command->info('Permissions and roles seeded successfully!');
    }
}
