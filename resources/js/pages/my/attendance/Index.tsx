import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import {
    PunchWidget,
    AttendanceCalendar,
} from '@/components/attendance';
import { AttendanceList } from '@/components/attendance/AttendanceList';

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

                <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                    <div className="col-span-2">
                    <AttendanceCalendar auth={auth}/>
                    </div>
                    <div className="col-span-3">
                    <AttendanceList date={new Date()} type="employee" employeeId={auth.user.id}/>
                    </div>
                </div>
            </AppLayout>
        </>
    );
}
