import { SalesLeadDetail } from '@/components/sales-leads/SalesLeadDetail';
import { type BreadcrumbItem } from '@/types';
import { type SalesLead } from '@/types/sales-leads';

interface AdminSalesLeadShowProps {
    lead: SalesLead;
    backUrl: string;
    mode: 'admin';
}

export default function AdminSalesLeadShow({
    lead,
    backUrl,
    mode,
}: AdminSalesLeadShowProps) {
    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Admin',
            href: '/admin/dashboard',
        },
        {
            title: 'Sales Leads',
            href: backUrl,
        },
        {
            title: lead.organization_name,
            href: `/admin/sales-leads/${lead.id}`,
        },
    ];

    return (
        <SalesLeadDetail
            lead={lead}
            backUrl={backUrl}
            mode={mode}
            breadcrumbs={breadcrumbs}
        />
    );
}
