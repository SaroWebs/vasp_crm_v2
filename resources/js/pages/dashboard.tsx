import AppLayout from '@/layouts/app-layout';
import { Auth, type BreadcrumbItem } from '@/types';
import { Head, router, usePage } from '@inertiajs/react';
import AdminDashboard from '@/components/dashboard/AdminDashboard';
import EmployeeDashboard from '@/components/dashboard/EmployeeDashboard';
import { Button, Loader } from '@mantine/core';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/admin/dashboard',
    },
];

interface DashboardProps {
    dashboard_type?: 'admin' | 'manager' | 'employee';
    auth?: Auth;
}

export default function Dashboard(props: DashboardProps) {
    const page = usePage<{ auth?: Auth }>();
    const { dashboard_type = 'employee', auth = page.props.auth ?? null } = props;

    return (
        <AppLayout breadcrumbs={breadcrumbs} auth={auth ?? undefined}>
            <Head title={dashboard_type === 'employee' ? 'Employee Dashboard' : 'Admin Dashboard'} />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto p-6">
                <div className="w-full p-4 text-center border border-dashed rounded-lg dark:border-dark-5 bg-blue-50 text-blue-600 font-semibold dark:bg-dark-1">
                    {"Work in progress..."}
                </div>
                <div className="flex justify-between items-center mb-4">
                    <span>
                        {dashboard_type != 'employee' ? "Admin Dashboard" : null}
                        {dashboard_type === 'employee' ? "Employee Dashboard" : null}
                    </span>
                    <div className="loader">
                        <Loader />
                    </div>
                    <div className="flex gap-2">
                        {/* Window Reload, Router Reload, link reload */}
                        <Button onClick={() => window.location.reload()}>Refresh</Button>
                        <Button onClick={() => router.reload()}>Router Refresh</Button>
                        <Button onClick={() => router.visit('/admin/dashboard')}>Link Reload</Button>
                    </div>
                </div>

            </div>
        </AppLayout>
    );
}
