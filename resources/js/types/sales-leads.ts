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

export interface SalesLeadPlaceholderMetric {
    label: string;
    value: string;
    description: string;
}

export interface SalesLeadFilterPlaceholder {
    label: string;
    value: string;
}

export interface SalesLead {
    id: number;
    organization_name: string;
    organization_type: SalesLeadOrganizationType;
    contact_person_name?: string | null;
    contact_phone?: string | null;
    contact_email?: string | null;
    location?: string | null;
    product_id?: number | null;
    interest_level: SalesLeadInterestLevel;
    status: SalesLeadStatus;
    latest_response?: string | null;
    last_contacted_at?: string | null;
    next_follow_up_at?: string | null;
    notes?: string | null;
    owner_user_id: number;
    created_at: string;
    updated_at: string;
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
