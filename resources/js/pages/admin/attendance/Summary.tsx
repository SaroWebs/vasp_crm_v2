import { useState, useEffect, useCallback } from 'react';
import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import axios from 'axios';
import { MonthYearPicker } from '@/components/attendance';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Loader2, Download, Eye } from 'lucide-react';
import { Link } from '@inertiajs/react';

interface EmployeeSummary {
    id: number;
    name: string;
    code: string;
    department?: string;
    summary: {
        total_days: number;
        present_days: number;
        absent_days: number;
        late_days: number;
        total_hours: number;
    };
}

interface AdminAttendanceSummaryPageProps {
    breadcrumbs?: BreadcrumbItem[];
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
    {
        title: 'Summary',
        href: '/admin/attendance/summary',
    },
];

export default function AdminAttendanceSummaryPage(_props: AdminAttendanceSummaryPageProps) {
    void _props;

    const today = new Date();
    const [month, setMonth] = useState(today.getMonth() + 1);
    const [year, setYear] = useState(today.getFullYear());
    const [summaries, setSummaries] = useState<EmployeeSummary[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchSummaries = useCallback(async () => {
        setLoading(true);
        try {
            const response = await axios.get('/api/attendance/summary', {
                params: { month, year },
            });

            if (response.data.status === 'success') {
                setSummaries(response.data.data || []);
            }
        } catch (error) {
            console.error('Failed to fetch attendance summaries:', error);
            setSummaries([]);
        } finally {
            setLoading(false);
        }
    }, [month, year]);

    useEffect(() => {
        fetchSummaries();
    }, [fetchSummaries]);

    const handleMonthChange = (newMonth: number, newYear: number) => {
        setMonth(newMonth);
        setYear(newYear);
    };

    const handleExportCSV = () => {
        const headers = ['Employee', 'Department', 'Present', 'Absent', 'Late', 'Total Hours'];
        const rows = summaries.map((emp) => [
            emp.name,
            emp.department || 'N/A',
            emp.summary.present_days,
            emp.summary.absent_days,
            emp.summary.late_days,
            emp.summary.total_hours.toFixed(1),
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map((row) => row.join(',')),
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `attendance_summary_${year}_${month}.csv`;
        link.click();
    };

    const totalPresent = summaries.reduce((sum, emp) => sum + emp.summary.present_days, 0);
    const totalAbsent = summaries.reduce((sum, emp) => sum + emp.summary.absent_days, 0);
    const totalLate = summaries.reduce((sum, emp) => sum + emp.summary.late_days, 0);
    const totalHours = summaries.reduce((sum, emp) => sum + emp.summary.total_hours, 0);

    return (
        <>
            <Head title="Attendance Summary" />
            <AppLayout breadcrumbs={breadcrumbs}>
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <h1 className="text-2xl font-semibold">Attendance Summary</h1>
                        <div className="flex items-center gap-4">
                            <MonthYearPicker
                                month={month}
                                year={year}
                                onChange={handleMonthChange}
                            />
                            <Button
                                variant="outline"
                                onClick={handleExportCSV}
                                className="gap-2"
                            >
                                <Download className="h-4 w-4" />
                                Export CSV
                            </Button>
                        </div>
                    </div>

                    <div className="grid grid-cols-4 gap-4">
                        <Card className="border-none shadow-sm">
                            <CardContent className="p-4">
                                <p className="text-sm text-muted-foreground">Total Employees</p>
                                <p className="text-2xl font-semibold">{summaries.length}</p>
                            </CardContent>
                        </Card>
                        <Card className="border-none shadow-sm">
                            <CardContent className="p-4">
                                <p className="text-sm text-muted-foreground">Total Present</p>
                                <p className="text-2xl font-semibold text-green-600">{totalPresent}</p>
                            </CardContent>
                        </Card>
                        <Card className="border-none shadow-sm">
                            <CardContent className="p-4">
                                <p className="text-sm text-muted-foreground">Total Absent</p>
                                <p className="text-2xl font-semibold text-red-600">{totalAbsent}</p>
                            </CardContent>
                        </Card>
                        <Card className="border-none shadow-sm">
                            <CardContent className="p-4">
                                <p className="text-sm text-muted-foreground">Total Hours</p>
                                <p className="text-2xl font-semibold text-blue-600">{totalHours.toFixed(1)}</p>
                            </CardContent>
                        </Card>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle>Employee Attendance Summary</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {loading ? (
                                <div className="flex items-center justify-center py-12">
                                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                </div>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Employee</TableHead>
                                            <TableHead>Department</TableHead>
                                            <TableHead className="text-center">Present</TableHead>
                                            <TableHead className="text-center">Absent</TableHead>
                                            <TableHead className="text-center">Late</TableHead>
                                            <TableHead className="text-center">Total Hours</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {summaries.length === 0 ? (
                                            <TableRow>
                                                <TableCell
                                                    colSpan={7}
                                                    className="text-center text-muted-foreground"
                                                >
                                                    No attendance data for this period
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            summaries.map((emp) => (
                                                <TableRow key={emp.id}>
                                                    <TableCell className="font-medium">
                                                        {emp.name}
                                                    </TableCell>
                                                    <TableCell>{emp.department || '-'}</TableCell>
                                                    <TableCell className="text-center">
                                                        <span className="text-green-600 font-medium">
                                                            {emp.summary.present_days}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        <span className="text-red-600 font-medium">
                                                            {emp.summary.absent_days}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        <span className="text-yellow-600 font-medium">
                                                            {emp.summary.late_days}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        {emp.summary.total_hours.toFixed(1)}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <Link
                                                            href={`/admin/attendance?employee=${emp.id}`}
                                                        >
                                                            <Button variant="ghost" size="sm">
                                                                <Eye className="h-4 w-4" />
                                                            </Button>
                                                        </Link>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </AppLayout>
        </>
    );
}
