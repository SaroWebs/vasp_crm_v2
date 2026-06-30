import AppLayout from '@/layouts/app-layout';
import { Auth, type BreadcrumbItem } from '@/types';
import { Head, usePage } from '@inertiajs/react';
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
}

export default function Dashboard(props: DashboardProps) {
    const page = usePage<{ auth?: Auth }>();
    const { dashboard_type = 'employee', auth = page.props.auth ?? null } = props;

    return (
        <AppLayout breadcrumbs={breadcrumbs} auth={auth ?? undefined}>
            <Head title={dashboard_type === 'employee' ? 'Employee Dashboard' : 'Admin Dashboard'} />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto p-6">
                {dashboard_type === 'employee' ? (
                    <EmployeeDashboard auth={auth} />
                ) : (
                    <AdminDashboard auth={auth} />
                )}
            </div>
        </AppLayout>
    );
}
