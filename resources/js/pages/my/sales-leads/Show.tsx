import { SalesLeadDetail } from '@/components/sales-leads/SalesLeadDetail';
import { type BreadcrumbItem } from '@/types';
import { type SalesLead } from '@/types/sales-leads';

interface MySalesLeadShowProps {
    lead: SalesLead;
    backUrl: string;
    mode: 'my';
}

export default function MySalesLeadShow({
    lead,
    backUrl,
    mode,
}: MySalesLeadShowProps) {
    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Dashboard',
            href: '/admin/dashboard',
        },
        {
            title: 'My Sales Leads',
            href: backUrl,
        },
        {
            title: lead.organization_name,
            href: `/my/sales-leads/${lead.id}`,
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
