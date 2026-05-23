import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { AttendanceCalendar } from '@/components/attendance';
import DailyAttendancePanel from '@/components/admin/employees/DailyAttendancePanel';

interface AdminAttendancePageProps {
    auth: any;
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/admin/dashboard',
    },
    {
        title: 'Attendance',
        href: '/admin/attendance',
    },
];

export default function AdminAttendancePage({ auth }: AdminAttendancePageProps) {
    return (
        <>
            <Head title="Attendance Management" />
            <AppLayout breadcrumbs={breadcrumbs}>
                <DailyAttendancePanel/>
            </AppLayout>
        </>
    );
}
