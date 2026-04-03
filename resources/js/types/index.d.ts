import { InertiaLinkProps } from '@inertiajs/react';
import { LucideIcon } from 'lucide-react';

export interface Auth {
    user: User | OrganizationUser;
    guard?: 'admin' | 'organization' | null;
    menu_access?: Record<string, boolean>;
    menu_access_configured?: boolean;
}

export interface BreadcrumbItem {
    title: string;
    href: string;
}

export interface NavGroup {
    title: string;
    items: NavItem[];
}

export interface NavItem {
    title: string;
    href: NonNullable<InertiaLinkProps['href']>;
    icon?: LucideIcon | null;
    isActive?: boolean;
    roles?: string[]; // Array of role slugs that can see this item
    permission?: string; // Permission slug required to see this item
    menuKey?: string; // Stable key for role-based menu visibility management
    adminOnly?: boolean; // Ignore role-menu overrides and keep this item admin-only
}

export interface SharedData {
    name?: string;
    quote?: { message: string; author: string };
    auth?: Auth;
    sidebarOpen?: boolean;
    [key: string]: unknown;
}

export interface Permission {
    id: number;
    name: string;
    slug: string;
    module: string;
    action: string;
    description?: string;
    roles?: Role[];
}

export interface UserPermission {
    id: number;
    name: string;
    slug: string;
    module: string;
}

export interface Role {
    id: number;
    name: string;
    slug: string;
    description?: string;
    permissions?: Permission[];
}

export interface User {
    id: number;
    name: string;
    email?: string;
    avatar?: string;
    roles?: Role[];
    role?: Role;
    role_permissions?: UserPermission[];
    additional_permissions?: UserPermission[];
    denied_permissions?: string[];
    email_verified_at?: string | null;
    two_factor_enabled?: boolean;
    created_at?: string;
    updated_at?: string;
    [key: string]: unknown;
}

export interface Employee {
    id: number;
    name: string;
    email: string;
    phone?: string | null;
    department_id?: number;
    user_id?: number;
    department?: Department;
    user?: User;
    created_at?: string;
}


export interface PaginatedItem<T = any> {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
}

export interface Department {
    id: number;
    name: string;
    description?: string;
    status?: string;
    color?: string;
    users?: User[];
}

export interface Product {
    id: number;
    name: string;
    version?: string;
    description?: string;
    status?: 'active' | 'inactive' | 'discontinued';
    metadata?: Record<string, unknown>;
    deleted_at?: string;
    created_at?: string;
    updated_at?: string;
    clients_count?: number;
    ticket_counts?: Array<{
        product_id: number;
        total: number;
        closed: string;
        active: string;
        laravel_through_key: number;
    }>;
}

export interface Client {
    id: number;
    name: string;
    email?: string | null;
    phone?: string | null;
    code?: string | null;
    product_id?: number | null;
    product?: Product | null;
    address?: string | null;
    status: 'active' | 'inactive';
    deleted_at?: string;
    created_at?: string;
    updated_at?: string;
    organization_users?: OrganizationUser[];
}

export interface OrganizationUser {
    id: number;
    client_id: number;
    name: string;
    email?: string | null;
    designation?: string | null;
    phone?: string | null;
    status: 'active' | 'inactive';
    deleted_at?: string;
    created_at?: string;
    updated_at?: string;
    client?: Client;
}

export interface Ticket {
    id: number;
    client_id: number;
    organization_user_id: number;
    ticket_number: string;
    title: string;
    description?: string;
    category?: string;
    priority: 'low' | 'medium' | 'high' | 'critical';
    status: 'open' | 'approved' | 'in-progress' | 'closed' | 'cancelled';
    assigned_to?: any;
    approved_by?: any;
    created_by?: any;
    approved_at?: string;
    rejection_reason?: string;
    rejected_by?: number;
    rejected_at?: string;
    deleted_at?: string;
    created_at: string;
    updated_at: string;
    client?: Client;
    organization_user?: OrganizationUser;
    assignedTo?: User;
    approvedBy?: User;
    attachments?: Attachment[];
    tasks?: Task[];
    work_status?: {
        status: 'no-tasks' | 'pending' | 'in-progress' |'closed' | 'partial' | 'blocked' | 'completed';
        label: string;
        color: 'gray' | 'blue' | 'green' | 'red' | 'yellow';
        total: number;
        completed: number;
        in_progress: number;
        blocked: number;
        pending: number;
        progress: number;
    };
}

export interface Attachment {
    id: number;
    ticket_id: number;
    file_name: string;
    file_path: string;
    file_type: string;
    uploaded_by_type: string;
    uploaded_by?: string | null;
    created_at: string;
    updated_at: string;
}

export interface Task {
    id: number;
    task_code: string;
    title: string;
    description?: string;
    task_type_id?: number;
    sla_policy_id?: number;
    project_id?: number;
    department_id?: number;
    current_owner_kind?: 'USER' | 'DEPARTMENT' | 'UNASSIGNED';
    current_owner_id?: number;
    state: 'Draft' | 'Assigned' | 'InProgress' | 'Blocked' | 'InReview' | 'Done' | 'Cancelled' | 'Rejected';
    priority: string;
    start_at?: string;
    due_at?: string;
    due_date?: string;
    completed_at?: string;
    estimate_hours?: number;
    tags?: string[];
    version?: number;
    metadata?: Record<string, unknown>;
    parent_task_id?: number;
    ticket_id?: number;
    ticket?: {
        id: number;
        ticket_number: string;
        title: string;
        client_id?: number;
        client?: Pick<Client, 'id' | 'name'>;
    };
    assigned_department_id?: number;
    completion_notes?: string;
    deleted_at?: string;
    created_at: string;
    updated_at: string;
    sla_status?: string;
    completion_percentage?: number;
    urgency_score?: number;
    overdue_time?: string | null;
    is_overdue?: boolean;
    assigned_to?: User;
    assignedTo?: User;
    assigned_department?: Department;
    assignedDepartment?: Department;
    assigned_users?: User[];
    assignedUsers?: User[];
    createdBy?: User;
    created_by?: User;
    task_type?: {
        id: number;
        name: string;
        code: string;
    };
    taskType?: {
        id: number;
        name: string;
        code: string;
    };
    sla_policy?: {
        id: number;
        name?: string;
        type?: string;
        priority: string;
    };
    slaPolicy?: {
        id: number;
        name?: string;
        type?: string;
        priority: string;
    };
    parentTask?: Task;
    parent_task?: Task;
    childTasks?: Task[];
    child_tasks?: Task[];
    comments?: TaskComment[];
    comments_count?: number;
    history?: TaskHistory[];
    auditEvents?: TaskAuditEvent[];
    audit_events?: TaskAuditEvent[];
    attachments?: TaskAttachment[];
    workloadMetrics?: WorkloadMetric[];
    workload_metrics?: WorkloadMetric[];
    userSkills?: UserSkill[];
    user_skills?: UserSkill[];
    time_entries: TimeEntry[];
    timeline_events?: TimelineEvent[];
    total_working_time_spent?: number;
    total_working_time_spent_seconds?: number;
}

export interface TaskHistory {
    id: number;
    task_id: number;
    old_status: string;
    new_status: string;
    changed_by: number;
    changed_by_user?: User;
    created_at: string;
    updated_at: string;
}

export interface TaskAuditEvent {
    id: number;
    task_id: number;
    occurred_at: string;
    actor_user_id: number;
    actor_user?: User;
    action: string;
    from_state?: string;
    to_state?: string;
    from_owner_kind?: 'USER' | 'DEPARTMENT' | 'UNASSIGNED';
    from_owner_id?: number;
    to_owner_kind?: 'USER' | 'DEPARTMENT' | 'UNASSIGNED';
    to_owner_id?: number;
    sla_snapshot?: Record<string, unknown>;
    reason?: string;
    metadata?: Record<string, unknown>;
    created_at: string;
    updated_at: string;
}

export interface TaskAttachment {
    id: number;
    task_id: number;
    file_path: string;
    file_name: string;
    file_type: string;
    file_size: number;
    uploaded_by: number;
    uploaded_by_user?: User;
    created_at: string;
    updated_at: string;
}

export interface WorkloadMetric {
    id: number;
    user_id: number;
    task_id?: number;
    metric_type: string;
    metric_value: number;
    metric_unit: string;
    period_start: string;
    period_end: string;
    calculated_at: string;
    metadata?: Record<string, unknown>;
    created_at: string;
    updated_at: string;
    deleted_at?: string;
    user?: User;
    task?: Task;
}

export interface UserSkill {
    id: number;
    user_id: number;
    skill_name: string;
    skill_level: string;
    years_of_experience?: number;
    certification?: string;
    is_primary: boolean;
    skill_category?: string;
    proficiency_score?: number;
    last_used?: string;
    skill_description?: string;
    created_at: string;
    updated_at: string;
    deleted_at?: string;
    user?: User;
}

export interface TicketCommentAttachments {
    id: number;
    comment_id?: number;
    file_path?: string;
    file_url?: string;
    file_type?: string;
    original_filename?: string;
    file_size?: number;
    uploaded_by_type: 'user' | 'organization_user';
    uploaded_by?: number | null;
    created_at: string;
    updated_at: string;
}





export interface TaskType {
    id: number;
    code: string;
    name: string;
    description?: string;
    default_priority: string;
    requires_sla: boolean;
    requires_project: boolean;
    requires_department: boolean;
    workflow_definition?: Record<string, unknown>;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface Project {
    id: number;
    name: string;
    description?: string;
    department_id: number;
    manager_id?: number;
    status: 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled';
    start_date?: string;
    end_date?: string;
    created_at: string;
    updated_at: string;
    deleted_at?: string;
    department?: Department;
    manager?: User;
}

export interface SlaPolicy {
    id: number;
    name: string;
    description?: string;
    type: string;
    priority: string;
    response_time_minutes: number;
    resolution_time_minutes: number;
    review_time_minutes: number;
    escalation_steps?: Record<string, unknown>;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    deleted_at?: string;
}

export interface TicketComment {
    id: number;
    ticket_id: number;
    comment_text: string;
    commented_by_type: 'user' | 'organization_user';
    commented_by: number;
    is_internal: boolean;
    created_at: string;
    updated_at: string;
    deleted_at?: string;
    deleted_by?: number;
    commenter?: User | OrganizationUser;
    deleted_by_user?: User;
    attachments?: TicketCommentAttachments[];
}

export interface TaskComment {
    id: number;
    task_id: number;
    comment_text: string;
    commented_by_type: 'user' | 'organization_user';
    commented_by: number;
    is_internal: boolean;
    created_at: string;
    updated_at: string;
    deleted_at?: string;
    deleted_by?: number;
    commenter?: User | OrganizationUser;
    deleted_by_user?: User;
    attachments?: TicketCommentAttachments[];
}


export interface TimeEntry {
  id: number;
  task_id: number;
  user_id: number;
  start_time: string;
  end_time: string | null;
  is_active: boolean;
}

export interface TimelineEvent {
    id: number;
    task_id: number;
    user_id: number;
    event_type: string;
    event_name: string;
    event_description: string | null;
    event_date: string;
    is_milestone: boolean;
    milestone_type?: string;
    target_date?: string;
    is_completed?: boolean;
    completed_at?: string | null;
    progress_percentage?: number;
    metadata?: Record<string, unknown>;
    created_at: string;
    updated_at: string;
    deleted_at?: string;
}
