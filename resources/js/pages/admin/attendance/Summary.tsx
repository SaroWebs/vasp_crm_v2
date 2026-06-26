import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { AttendanceSummaryTab } from '@/components/attendance';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/admin/dashboard' },
    { title: 'Attendance', href: '/admin/attendance' },
    { title: 'Summary', href: '/admin/attendance/summary' },
];

export default function AdminAttendanceSummaryPage() {
    return (
        <>
            <Head title="Attendance Summary" />
            <AppLayout breadcrumbs={breadcrumbs}>
                <div className="p-4">
                    <AttendanceSummaryTab />
                </div>
            </AppLayout>
        </>
    );
}
