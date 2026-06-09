import { SalesLeadWorkspace } from '@/components/sales-leads/SalesLeadWorkspace';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import {
    type SalesLeadProductOption,
    type SalesLeadUserOption,
} from '@/types/sales-leads';
import { Head } from '@inertiajs/react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Admin',
        href: '/admin/dashboard',
    },
    {
        title: 'Sales Leads',
        href: '/admin/sales-leads',
    },
];

interface AdminSalesLeadsIndexProps {
    products: SalesLeadProductOption[];
    salesUsers: SalesLeadUserOption[];
}

export default function AdminSalesLeadsIndex({
    products,
    salesUsers,
}: AdminSalesLeadsIndexProps) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Sales Leads" />
            <SalesLeadWorkspace
                mode="admin"
                products={products}
                salesUsers={salesUsers}
            />
        </AppLayout>
    );
}
