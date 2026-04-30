import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import {
    PunchWidget,
    AttendanceCalendar,
} from '@/components/attendance';

interface MyAttendancePageProps {
    breadcrumbs?: BreadcrumbItem[];
    auth:any;
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
    {
        title: 'My Attendance',
        href: '/my/attendance',
    },
];

export default function MyAttendancePage(_props: MyAttendancePageProps) {
    void _props;
    const { auth } = _props;
    
    return (
        <>
            <Head title="My Attendance" />
            <AppLayout breadcrumbs={breadcrumbs}>

                <div className="space-y-6 px-4 p-8 w-[600px]">
                    <AttendanceCalendar
                        auth={auth}
                    />
                </div>
            </AppLayout>
        </>
    );
}
