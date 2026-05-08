import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Link } from '@inertiajs/react';
import { Text } from '@mantine/core';
import axios from 'axios';
import { useEffect, useState } from 'react';

type RecentReport = {
    id: number;
    title: string;
    user_name: string;
    report_date: string;
    task_count: number;
    total_hours: number | string;
};

function formatHours(decimalHours: number | string): string {
    const total = Number(decimalHours);
    const h = Math.floor(total);
    const m = Math.round((total - h) * 60);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

const RecentReportSection = () => {
    const [recentReports, setRecentReports] = useState<RecentReport[]>([]);
    const [selectedDate, setSelectedDate] = useState(() => {
        const today = new Date();
        return today.toISOString().slice(0, 10);
    });

    const loadReports = () => {
        axios
            .get(`/admin/api/reports/daily/${selectedDate}`)
            .then((res) => {
                setRecentReports(res.data);
            })
            .catch((err) => {
                console.log(err);
            });
    };

    useEffect(() => {
        loadReports();
    }, [selectedDate]);

    const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSelectedDate(e.target.value);
    };

    return (
        <Card className="col-span-4">
            <CardHeader>
                <div className="flex justify-between gap-2">
                    <div className="heading">
                        <CardTitle>Recent Reports</CardTitle>
                        <CardDescription>
                            Latest daily reports from employees
                        </CardDescription>
                    </div>
                    <div className="actions flex items-center gap-2">
                        <input
                            id="recent-report-date"
                            type="date"
                            value={selectedDate}
                            onChange={handleDateChange}
                            max={new Date().toISOString().slice(0, 10)}
                            className="px-2 py-1 rounded-md border border-muted shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-sm bg-background transition-colors"
                        />
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="space-y-4 max-h-64 overflow-y-auto">
                    {recentReports &&
                        recentReports.map((report) => (
                            <Link
                                href={`/admin/reports/${report.id}`}
                                key={report.id}
                                className="flex items-center justify-between border-b border-gray-100 hover:shadow-md"
                            >
                                <div className="flex items-center space-x-2">
                                    <Text size="sm" className='font-mono'>{report.user_name}</Text>
                                </div>
                                <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                                    <span>
                                        {report.task_count} tasks
                                    </span>
                                    <span>
                                        {formatHours(report.total_hours)}
                                    </span>
                                </div>
                            </Link>
                        ))}
                </div>
                <div className="mt-4 text-right">
                    <Link href="/admin/reports">
                        <Button variant="outline" size="sm">
                            View Report Details
                        </Button>
                    </Link>
                </div>
            </CardContent>
        </Card>
    );
};

export default RecentReportSection;