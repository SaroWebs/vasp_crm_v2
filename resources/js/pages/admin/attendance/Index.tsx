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
                {/* <div className="space-y-6 px-4 p-8 w-[600px]">
                    <AttendanceCalendar auth={auth} />
                </div> */}
            </AppLayout>
        </>
    );
}
