import { useEffect, useState } from 'react';
import axios from 'axios';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, Calendar, Clock, ChevronRight, AlertCircle, FileCheck } from 'lucide-react';
import { Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface Report {
    id: number;
    title: string;
    report_date: string;
    status: string;
    total_hours: number;
    created_at: string;
}

export default function EmployeeRecentReportsWidget({ className }: { className?: string }) {
    const [reports, setReports] = useState<Report[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        axios.get('/admin/api/dashboard/recent-reports')
            .then(res => setReports(res.data.reports || []))
            .catch(err => console.error('Error fetching recent reports:', err))
            .finally(() => setLoading(false));
    }, []);

    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case 'approved':
                return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200';
            case 'submitted':
                return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200';
            case 'draft':
                return 'bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-400 border-slate-200';
            default:
                return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400 border-gray-200';
        }
    };

    if (loading) {
        return (
            <Card className={cn("shadow-sm border-border/50", className)}>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-primary" />
                        My Reports
                    </CardTitle>
                    <CardDescription>Loading your recent reports...</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="h-[60px] animate-pulse bg-muted rounded-xl" />
                        ))}
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className={cn("shadow-sm border-border/50", className)}>
            <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-border/50 mb-4">
                <div className="space-y-1">
                    <CardTitle className="flex items-center gap-2 text-xl font-bold">
                        <FileText className="h-5 w-5 text-primary" />
                        My Reports
                    </CardTitle>
                    <CardDescription>Your last 5 daily reports and summaries.</CardDescription>
                </div>
                <Link href="/admin/reports">
                    <Button variant="ghost" size="sm" className="gap-1 text-primary hover:text-primary hover:bg-primary/10">
                        View Center
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </Link>
            </CardHeader>
            <CardContent>
                {reports.length > 0 ? (
                    <div className="space-y-3">
                        {reports.map((report) => (
                            <Link
                                key={report.id}
                                href={`/admin/reports/${report.id}`}
                                className="group block"
                            >
                                <div className="flex items-center justify-between p-3 rounded-xl border border-border/60 bg-card hover:border-primary/30 hover:bg-muted/50 transition-all duration-200">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-200">
                                            <FileCheck className="h-5 w-5" />
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-sm font-semibold leading-none group-hover:text-primary transition-colors">
                                                {report.title || `Report for ${new Date(report.report_date).toLocaleDateString()}`}
                                            </p>
                                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                                <div className="flex items-center gap-1">
                                                    <Calendar className="h-3 w-3" />
                                                    {new Date(report.report_date).toLocaleDateString()}
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <Clock className="h-3 w-3" />
                                                    {Number(report.total_hours).toFixed(1)} hrs
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <Badge
                                        variant="outline"
                                        className={cn("capitalize px-2 py-0 text-[10px] font-bold border", getStatusColor(report.status))}
                                    >
                                        {report.status}
                                    </Badge>
                                </div>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-3">
                            <AlertCircle className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <h3 className="font-medium text-sm">No reports found</h3>
                        <p className="text-xs text-muted-foreground mt-1 max-w-[200px]">
                            You haven't submitted any daily reports recently.
                        </p>
                        <Link href="/admin/reports" className="mt-4">
                            <Button size="sm" variant="outline">Create First Report</Button>
                        </Link>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
