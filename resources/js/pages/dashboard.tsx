import AppLayout from '@/layouts/app-layout';
import { Auth, type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import AdminDashboard from '@/components/dashboard/AdminDashboard';
import EmployeeDashboard from '@/components/dashboard/EmployeeDashboard';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/admin/dashboard',
    },
];

interface DashboardProps {
    dashboard_type?: 'admin' | 'manager' | 'employee';
    auth?: Auth;
    ticketStats?: Record<string, number>;
    taskStats?: Record<string, number>;
}

export default function Dashboard(props: DashboardProps) {
    const {
        dashboard_type,
        ticketStats,
        taskStats,
        auth=null,
    } = props;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={dashboard_type === 'employee' ? 'Employee Dashboard' : 'Admin Dashboard'} />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto p-6">
                {dashboard_type === 'employee' ? (
                    <EmployeeDashboard auth={auth} />
                ) : (
                    <AdminDashboard auth={auth} ticketStats={ticketStats} taskStats={taskStats} />
                )}
            </div>
        </AppLayout>
    );
}
