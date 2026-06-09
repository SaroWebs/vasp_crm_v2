import { SalesLeadWorkspace } from '@/components/sales-leads/SalesLeadWorkspace';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { type SalesLeadProductOption } from '@/types/sales-leads';
import { Head } from '@inertiajs/react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/admin/dashboard',
    },
    {
        title: 'My Sales Leads',
        href: '/my/sales-leads',
    },
];

interface MySalesLeadsIndexProps {
    products: SalesLeadProductOption[];
}

export default function MySalesLeadsIndex({ products }: MySalesLeadsIndexProps) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="My Sales Leads" />
            <SalesLeadWorkspace mode="my" products={products} />
        </AppLayout>
    );
}
