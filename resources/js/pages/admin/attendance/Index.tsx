import { useState, useEffect, useCallback } from 'react';
import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import axios from 'axios';
import {
    MonthYearPicker,
    AttendanceSummaryCards,
    AttendanceCalendarGrid,
    AttendanceOverrideModal,
} from '@/components/attendance';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Loader2, Plus } from 'lucide-react';

interface Employee {
    id: number;
    name: string;
    code: string;
    department?: {
        id: number;
        name: string;
    };
}

interface AttendanceRecord {
    id?: number;
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

interface AdminAttendancePageProps {
    employees: Employee[];
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
        href: '/admin/dashboard',
    },
    {
        title: 'Attendance',
        href: '/admin/attendance',
    },
];

export default function AdminAttendancePage({ employees }: AdminAttendancePageProps) {
    const today = new Date();
    const [month, setMonth] = useState(today.getMonth() + 1);
    const [year, setYear] = useState(today.getFullYear());
    const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | null>(
        employees[0]?.id || null
    );
    const [records, setRecords] = useState<AttendanceRecord[]>([]);
    const [summary, setSummary] = useState(defaultSummary);
    const [calendarMeta, setCalendarMeta] = useState<AttendanceCalendarMeta | null>(null);
    const [loading, setLoading] = useState(true);

    const [showOverrideModal, setShowOverrideModal] = useState(false);
    const [selectedDate, setSelectedDate] = useState<string | undefined>();
    const [selectedRecord, setSelectedRecord] = useState<AttendanceRecord | null>(null);

    const selectedEmployee = employees.find((e) => e.id === selectedEmployeeId);

    const fetchAttendance = useCallback(async () => {
        if (!selectedEmployeeId) {
            setRecords([]);
            setSummary(defaultSummary);
            return;
        }

        setLoading(true);
        try {
            const response = await axios.get(`/api/attendance/${selectedEmployeeId}`, {
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
    }, [selectedEmployeeId, month, year]);

    useEffect(() => {
        fetchAttendance();
    }, [fetchAttendance]);

    const handleMonthChange = (newMonth: number, newYear: number) => {
        setMonth(newMonth);
        setYear(newYear);
    };

    const handleDayClick = (date: string, record: AttendanceRecord | null) => {
        setSelectedDate(date);
        setSelectedRecord(record || null);
        setShowOverrideModal(true);
    };

    const handleOverrideSuccess = () => {
        fetchAttendance();
    };

    return (
        <>
            <Head title="Attendance Management" />
            <AppLayout breadcrumbs={breadcrumbs}>
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <h1 className="text-2xl font-semibold">Attendance Management</h1>
                        <MonthYearPicker
                            month={month}
                            year={year}
                            onChange={handleMonthChange}
                        />
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="w-64">
                            <Select
                                value={selectedEmployeeId?.toString() || ''}
                                onValueChange={(value) => setSelectedEmployeeId(Number(value))}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select employee" />
                                </SelectTrigger>
                                <SelectContent>
                                    {employees.map((employee) => (
                                        <SelectItem
                                            key={employee.id}
                                            value={employee.id.toString()}
                                        >
                                            {employee.name}
                                            {employee.department && (
                                                <span className="text-muted-foreground ml-2">
                                                    ({employee.department.name})
                                                </span>
                                            )}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <Button
                            variant="outline"
                            onClick={() => {
                                setSelectedDate(undefined);
                                setSelectedRecord(null);
                                setShowOverrideModal(true);
                            }}
                            className="gap-2"
                        >
                            <Plus className="h-4 w-4" />
                            Add Manual Entry
                        </Button>
                    </div>

                    <AttendanceSummaryCards summary={summary} />

                    <Card>
                        <CardHeader>
                            <CardTitle>Attendance Calendar</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {loading ? (
                                <div className="flex items-center justify-center py-12">
                                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                </div>
                            ) : selectedEmployeeId ? (
                                <AttendanceCalendarGrid
                                    records={records}
                                    month={month}
                                    year={year}
                                    calendar={calendarMeta ?? undefined}
                                    onDayClick={handleDayClick}
                                />
                            ) : (
                                <div className="flex items-center justify-center py-12 text-muted-foreground">
                                    Select an employee to view attendance
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {selectedEmployee && (
                        <AttendanceOverrideModal
                            open={showOverrideModal}
                            onOpenChange={setShowOverrideModal}
                            employeeId={selectedEmployeeId!}
                            employeeName={selectedEmployee.name}
                            selectedDate={selectedDate}
                            existingRecord={selectedRecord}
                            onSuccess={handleOverrideSuccess}
                        />
                    )}
                </div>
            </AppLayout>
        </>
    );
}
