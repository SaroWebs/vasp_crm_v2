import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
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
    dashboard_type: 'admin' | 'manager' | 'employee';
    auth: { user?: { id?: number } } | null;
    employees?: Array<{
        id: number;
        name: string;
        email?: string;
    }>;
    unreadNotifications?: number;
    ticketStats?: Record<string, number>;
    taskStats?: Record<string, number>;
    userPermissions?: string[];
    // Manager specific
    myDepartmentTasks?: Array<Record<string, unknown>>;
    teamWorkload?: Array<Record<string, unknown>>;
    departmentStats?: Array<Record<string, unknown>>;
    // Employee specific
    myTaskStats?: Record<string, number>;
    forwardedTasks?: Array<Record<string, unknown>>;
    upcomingDeadlines?: Array<Record<string, unknown>>;
    unreadNotificationsList?: Array<Record<string, unknown>>;
}

export default function Dashboard(props: DashboardProps) {
    const {
        dashboard_type,
        ticketStats,
        taskStats,
        auth,
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
