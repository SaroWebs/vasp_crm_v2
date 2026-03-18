export type TeamRole = 'owner' | 'manager' | 'member' | 'viewer';

export interface UserOption {
    id: number;
    name: string;
    email?: string;
}

export interface ProjectTask {
    id: number;
    title: string | null;
    task_code: string;
    state: string;
    created_at?: string | null;
    start_at?: string | null;
    due_at?: string | null;
    estimate_hours?: number | string | null;
    phase_id?: number | null;
    project_phase?: { id: number; name: string } | null;
    task_type?: { id: number; name: string; code: string } | null;
}

export interface ProjectPhase {
    id: number;
    name: string;
    description?: string | null;
    sort_order?: number;
    start_date?: string | null;
    end_date?: string | null;
    status: string;
    progress: number;
    color?: string | null;
    tasks_count?: number;
}

export interface ProjectMilestone {
    id: number;
    name: string;
    description?: string | null;
    target_date: string | null;
    completed_date?: string | null;
    status: string;
    type: string;
    progress: number;
    sort_order?: number;
    created_at?: string;
    updated_at?: string;
}

export interface ProjectTimelineEvent {
    id: number;
    phase_id?: number | null;
    event_type: string;
    event_name: string;
    event_description?: string | null;
    event_date: string;
    is_milestone?: boolean;
    milestone_type?: string | null;
    target_date?: string | null;
    is_completed?: boolean;
    completed_at?: string | null;
    progress_percentage?: number;
    created_at?: string;
    updated_at?: string;
    user?: { id: number; name: string } | null;
    phase?: { id: number; name: string } | null;
}

export interface ProjectAttachment {
    id: number;
    original_filename: string;
    size: number;
    description?: string | null;
    uploader?: { id: number; name: string } | null;
}

export interface ProjectTeamMember {
    id?: number;
    user_id: number;
    role: TeamRole;
    user?: { id: number; name: string; email?: string } | null;
}

export interface ProjectShowData {
    id: number;
    name: string;
    code: string | null;
    description: string | null;
    status: string;
    priority: string;
    progress: number;
    start_date: string | null;
    end_date: string | null;
    budget: string | number | null;
    color: string | null;
    manager?: { id: number; name: string } | null;
    department?: { id: number; name: string } | null;
    creator?: { id: number; name: string } | null;
    team?: ProjectTeamMember[];
    milestones?: ProjectMilestone[];
    phases?: ProjectPhase[];
    timeline_events?: ProjectTimelineEvent[];
    attachments?: ProjectAttachment[];
    tasks?: ProjectTask[];
    tasks_count?: number;
    completed_tasks_count?: number;
}
