import { useState, useEffect, useCallback } from 'react';
import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import axios from 'axios';
import {
    MonthYearPicker,
    AttendanceSummaryCards,
    AttendanceCalendarGrid,
    PunchWidget,
} from '@/components/attendance';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface AttendanceRecord {
    attendance_date: string;
    punch_in: string | null;
    punch_out: string | null;
    mode: string;
}

interface Holiday {
    date: string;
    name: string;
    type?: string;
}

interface WorkingHoursConfig {
    workdays: Array<{
        day: string;
        start: string;
        end: string;
        break_start: string;
        break_end: string;
    }>;
    timezone: string;
}

interface AttendanceCalendarMeta {
    holidays: Holiday[];
    working_hours: WorkingHoursConfig;
}

interface MyAttendancePageProps {
    breadcrumbs?: BreadcrumbItem[];
}

const defaultSummary = {
    total_days: 0,
    present_days: 0,
    absent_days: 0,
    late_days: 0,
    total_hours: 0,
};

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

    const today = new Date();
    const [month, setMonth] = useState(today.getMonth() + 1);
    const [year, setYear] = useState(today.getFullYear());
    const [records, setRecords] = useState<AttendanceRecord[]>([]);
    const [summary, setSummary] = useState(defaultSummary);
    const [calendarMeta, setCalendarMeta] = useState<AttendanceCalendarMeta | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchAttendance = useCallback(async () => {
        setLoading(true);
        try {
            const response = await axios.get('/api/my/attendance', {
                params: { month, year },
            });

            if (response.data.status === 'success') {
                setRecords(response.data.data || []);
                setSummary(response.data.summary || defaultSummary);
                setCalendarMeta(response.data.calendar || null);
            }
        } catch (error) {
            console.error('Failed to fetch attendance:', error);
            setRecords([]);
            setSummary(defaultSummary);
            setCalendarMeta(null);
        } finally {
            setLoading(false);
        }
    }, [month, year]);

    useEffect(() => {
        fetchAttendance();
    }, [fetchAttendance]);

    const handleMonthChange = (newMonth: number, newYear: number) => {
        setMonth(newMonth);
        setYear(newYear);
    };

    const handlePunchSuccess = () => {
        fetchAttendance();
    };

    const handleDayClick = (date: string, record: AttendanceRecord | null) => {
        const clickedDate = new Date(`${date}T00:00:00`);

        console.log(clickedDate);
        console.log(record);
    };

    return (
        <>
            <Head title="My Attendance" />
            <AppLayout breadcrumbs={breadcrumbs}>
                <div className="space-y-6 px-4 pb-12">
                    <div className="flex items-center justify-between">
                        <h1 className="text-2xl font-semibold">My Attendance</h1>
                        <MonthYearPicker
                            month={month}
                            year={year}
                            onChange={handleMonthChange}
                        />
                    </div>

                    <AttendanceSummaryCards summary={summary} />
                    
                        <Card className=''>
                            <CardHeader>
                                <CardTitle>Attendance Calendar</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {loading ? (
                                    <div className="flex items-center justify-center py-12">
                                        <div className="text-muted-foreground">Loading...</div>
                                    </div>
                                ) : (
                                    <AttendanceCalendarGrid
                                            records={records}
                                            month={month}
                                            year={year}
                                            calendar={calendarMeta ?? undefined}
                                            onDayClick={handleDayClick}
                                        />
                                )}
                            </CardContent>
                        </Card>

                    <PunchWidget onPunchSuccess={handlePunchSuccess} />
                </div>
            </AppLayout>
        </>
    );
}
