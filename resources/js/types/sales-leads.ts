export const salesLeadInterestLevels = ['negative', 'unclear', 'positive'] as const;

export const salesLeadStatuses = [
    'new',
    'contacted',
    'follow_up',
    'interested',
    'not_interested',
    'won',
    'lost',
] as const;

export const salesLeadOrganizationTypes = [
    'school',
    'college',
    'business',
    'logistics_company',
    'other',
] as const;

export const salesLeadActivityTypes = [
    'call',
    'visit',
    'meeting',
    'whatsapp',
    'email',
    'note',
] as const;

export type SalesLeadInterestLevel = (typeof salesLeadInterestLevels)[number];

export type SalesLeadStatus = (typeof salesLeadStatuses)[number];

export type SalesLeadOrganizationType = (typeof salesLeadOrganizationTypes)[number];

export type SalesLeadActivityType = (typeof salesLeadActivityTypes)[number];

export interface SalesLeadUserOption {
    id: number;
    name: string;
    email?: string | null;
}

export interface SalesLeadProductOption {
    id: number;
    name: string;
}

export interface SalesLeadMetrics {
    total: number;
    positive: number;
    overdue_followups: number;
    upcoming_followups: number;
    employees_active: number;
    won?: number;
    lost?: number;
    converted?: number;
}

export interface SalesLeadReport {
    by_employee: Array<{
        owner_user_id: number | null;
        owner_name: string;
        total: number;
        positive: number;
        won: number;
        lost: number;
    }>;
    by_product: Array<{
        product_id: number | null;
        product_name: string;
        total: number;
        positive: number;
    }>;
    by_status: Record<string, number>;
    followups_completed: number;
}

export interface SalesLeadPagination {
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
}

export interface SalesLead {
    id: number;
    organization_name: string;
    organization_type: SalesLeadOrganizationType;
    contact_person_name?: string | null;
    contact_phone?: string | null;
    contact_email?: string | null;
    location?: string | null;
    service_notes?: string | null;
    product_id?: number | null;
    interest_level: SalesLeadInterestLevel;
    status: SalesLeadStatus;
    source?: string | null;
    latest_response?: string | null;
    last_contacted_at?: string | null;
    next_follow_up_at?: string | null;
    notes?: string | null;
    owner_user_id: number;
    converted_client_id?: number | null;
    converted_at?: string | null;
    activities_count?: number;
    owner?: SalesLeadUserOption | null;
    product?: SalesLeadProductOption | null;
    latest_activity?: {
        id: number;
        activity_type: SalesLeadActivityType;
        outcome_status?: SalesLeadStatus | null;
        response_text?: string | null;
        activity_at?: string | null;
        next_follow_up_at?: string | null;
        user?: Pick<SalesLeadUserOption, 'id' | 'name'> | null;
    } | null;
    created_by_user?: Pick<SalesLeadUserOption, 'id' | 'name'> | null;
    updated_by_user?: Pick<SalesLeadUserOption, 'id' | 'name'> | null;
    activities?: Array<
        SalesLeadActivity & {
            user?: Pick<SalesLeadUserOption, 'id' | 'name'> | null;
        }
    >;
    created_at: string;
    updated_at: string;
}

export interface SalesLeadFormData {
    owner_user_id: string;
    product_id: string;
    organization_name: string;
    organization_type: SalesLeadOrganizationType;
    contact_person_name: string;
    contact_phone: string;
    contact_email: string;
    location: string;
    service_notes: string;
    interest_level: SalesLeadInterestLevel;
    status: SalesLeadStatus;
    source: string;
    latest_response: string;
    last_contacted_at: string;
    next_follow_up_at: string;
    notes: string;
}

export interface SalesLeadActivityFormData {
    activity_type: SalesLeadActivityType;
    outcome_status: '' | SalesLeadStatus;
    interest_level: '' | SalesLeadInterestLevel;
    response_text: string;
    activity_at: string;
    next_follow_up_at: string;
}

export interface SalesLeadActivity {
    id: number;
    sales_lead_id: number;
    user_id: number;
    activity_type: SalesLeadActivityType;
    outcome_status?: SalesLeadStatus | null;
    response_text?: string | null;
    activity_at: string;
    next_follow_up_at?: string | null;
    created_at: string;
    updated_at: string;
}
