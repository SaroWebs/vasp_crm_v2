import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Activity, Clock, ListChecks } from 'lucide-react';

type ProgressPeriod = 'daily' | 'weekly' | 'monthly';

interface EmployeeProgressDailyReportEvent {
    event_type: string;
    event_name: string;
    event_description: string | null;
    task_id?: number;
    task_code?: string;
    task_title?: string;
    duration_hours?: number;
    remarks?: string;
}

interface EmployeeProgressDailyReport {
    date: string;
    total_time: number;
    tasks_completed: number;
    events: EmployeeProgressDailyReportEvent[];
}

interface EmployeeProgressDataItem {
    id: number;
    user_id: number;
    user_name: string;
    email: string;
    total_time: number;
    tasks_completed: number;
    task_details: number[];
    daily_reports: Record<string, EmployeeProgressDailyReport>;
}

interface EmployeeProgressResponse {
    success: boolean;
    data: EmployeeProgressDataItem[];
    total_employees: number;
    total_time: number;
    total_tasks: number;
    period: ProgressPeriod;
}

interface CurrentEmployeeProgress {
    total_time: number;
    tasks_completed: number;
    daily_reports: Record<string, EmployeeProgressDailyReport>;
}

interface EmployeeTaskProgressProps {
    employeeId: number;
}

const EmployeeTaskProgress: React.FC<EmployeeTaskProgressProps> = ({ employeeId }) => {
    const [period, setPeriod] = useState<ProgressPeriod>('monthly');
    const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [selectedWeekStart, setSelectedWeekStart] = useState<string>(() => {
        const today = new Date();
        const dayOfWeek = today.getDay();
        const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
        const monday = new Date(today.setDate(diff));
        return monday.toISOString().split('T')[0];
    });
    const [selectedMonth, setSelectedMonth] = useState<string>(() => {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    });
    const [progressRefreshNonce, setProgressRefreshNonce] = useState(0);
    const [isProgressLoading, setIsProgressLoading] = useState(true);
    const [progressError, setProgressError] = useState<string | null>(null);
    const [progressPayload, setProgressPayload] = useState<EmployeeProgressResponse | null>(null);

    useEffect(() => {
        const controller = new AbortController();

        const loadProgress = async () => {
            setIsProgressLoading(true);
            setProgressError(null);
            try {
                const params = new URLSearchParams({ period, employee_id: employeeId.toString() });
                if (period === 'daily') {
                    params.append('date', selectedDate);
                } else if (period === 'weekly') {
                    params.append('week_start', selectedWeekStart);
                } else if (period === 'monthly') {
                    params.append('month', selectedMonth);
                }

                const response = await fetch(`/admin/api/employee-progress?${params.toString()}`, {
                    signal: controller.signal,
                    headers: {
                        Accept: 'application/json',
                    },
                });

                if (!response.ok) {
                    throw new Error(`Request failed with status ${response.status}`);
                }

                const data = (await response.json()) as EmployeeProgressResponse;
                setProgressPayload(data);
            } catch {
                if (controller.signal.aborted) return;
                setProgressError('Unable to load employee progress right now.');
            } finally {
                if (!controller.signal.aborted) {
                    setIsProgressLoading(false);
                }
            }
        };

        loadProgress();

        return () => {
            controller.abort();
        };
    }, [period, progressRefreshNonce, selectedDate, selectedWeekStart, selectedMonth]);

    const currentEmployeeProgress = useMemo<CurrentEmployeeProgress | null>(() => {
        if (!progressPayload) return null;

        const found = progressPayload.data.find((item) => item.id === employeeId);

        if (!found) {
            return null;
        }

        return {
            total_time: found.total_time,
            tasks_completed: found.tasks_completed,
            daily_reports: found.daily_reports,
        };
    }, [progressPayload, employeeId]);

    const contributionPercent = useMemo(() => {
        if (!currentEmployeeProgress || !progressPayload || Number(progressPayload.total_time) <= 0) {
            return 0;
        }

        return (Number(currentEmployeeProgress.total_time) / Number(progressPayload.total_time)) * 100;
    }, [currentEmployeeProgress, progressPayload]);

    const averageTimePerTask = useMemo(() => {
        if (!currentEmployeeProgress || currentEmployeeProgress.tasks_completed === 0) {
            return 0;
        }

        return Number(currentEmployeeProgress.total_time) / currentEmployeeProgress.tasks_completed;
    }, [currentEmployeeProgress]);

    const recentDailyReports = useMemo(() => {
        if (!currentEmployeeProgress) return [];

        return Object.values(currentEmployeeProgress.daily_reports || {})
            .sort((a, b) => b.date.localeCompare(a.date))
            .slice(0, 5);
    }, [currentEmployeeProgress]);
    return (
        <Card>
            <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <CardTitle className="flex items-center gap-2">
                        <Activity className="h-5 w-5" />
                        Employee Progress
                    </CardTitle>
                    <CardDescription>
                        Time tracking and completed task overview
                    </CardDescription>
                </div>
                <div className="">
                    <div className="flex items-center gap-2">
                        {(['daily', 'weekly', 'monthly'] as ProgressPeriod[]).map((value) => (
                            <Button
                                key={value}
                                variant={period === value ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setPeriod(value)}
                            >
                                {value.charAt(0).toUpperCase() + value.slice(1)}
                            </Button>
                        ))}
                    </div>
                    <div className="mt-2">
                        {period === 'daily' && (
                            <Input
                                type="date"
                                value={selectedDate}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSelectedDate(e.target.value)}
                                className="w-full sm:w-auto"
                            />
                        )}
                        {period === 'weekly' && (
                            <div className="flex items-center gap-2">
                                <Input
                                    type="date"
                                    value={selectedWeekStart}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                        setSelectedWeekStart(e.target.value)
                                    }
                                    className="w-full sm:w-auto"
                                />
                                <span className="text-sm text-muted-foreground">to</span>
                                <span className="text-sm font-medium">
                                    {new Date(
                                        new Date(selectedWeekStart).getTime() + 6 * 24 * 60 * 60 * 1000,
                                    )
                                        .toISOString()
                                        .split('T')[0]}
                                </span>
                            </div>
                        )}
                        {period === 'monthly' && (
                            <Input
                                type="month"
                                value={selectedMonth}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSelectedMonth(e.target.value)}
                                className="w-full sm:w-auto"
                            />
                        )}
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {isProgressLoading && (
                    <p className="text-sm text-muted-foreground">Loading employee progress...</p>
                )}

                {!isProgressLoading && progressError && (
                    <div className="space-y-3">
                        <p className="text-sm text-destructive">{progressError}</p>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setProgressRefreshNonce((value) => value + 1)}
                        >
                            Retry
                        </Button>
                    </div>
                )}

                {!isProgressLoading && !progressError && !currentEmployeeProgress && (
                    <p className="text-sm text-muted-foreground">
                        No progress records found for this employee in the selected period.
                    </p>
                )}

                {!isProgressLoading && !progressError && currentEmployeeProgress && (
                    <>
                        <div className="grid gap-2 md:grid-cols-4">
                            <div className="rounded-lg border p-2 flex justify-between items-center">
                                <p className="text-xs text-muted-foreground">Total Time</p>
                                <p className="text-xs font-semibold flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {Number(currentEmployeeProgress.total_time).toFixed(2)}h
                                </p>
                            </div>
                            <div className="rounded-lg border p-2 flex justify-between items-center">
                                <p className="text-xs text-muted-foreground">Tasks</p>
                                <p className="text-xs font-semibold flex items-center gap-1">
                                    <ListChecks className="h-3 w-3" />
                                    {currentEmployeeProgress.tasks_completed}
                                </p>
                            </div>
                            <div className="rounded-lg border p-2 flex justify-between items-center">
                                <p className="text-xs text-muted-foreground">Avg/Task</p>
                                <p className="text-xs font-semibold">
                                    {averageTimePerTask.toFixed(2)}h
                                </p>
                            </div>
                            <div className="rounded-lg border p-2 flex justify-between items-center">
                                <p className="text-xs text-muted-foreground">Team %</p>
                                <p className="text-xs font-semibold">
                                    {contributionPercent.toFixed(1)}%
                                </p>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <h4 className="text-sm font-medium">Workflow</h4>
                            {recentDailyReports.length > 0 ? (
                                <div className="space-y-2">
                                    {recentDailyReports.map((report) => (
                                        <div
                                            key={report.date}
                                            className="space-y-3 rounded-lg border p-3 text-sm"
                                        >
                                            <div className="flex items-center justify-between">
                                                <span>
                                                    {new Date(report.date).toLocaleDateString('en-US', {
                                                        year: 'numeric',
                                                        month: 'short',
                                                        day: 'numeric',
                                                    })}
                                                </span>
                                                <span className="text-muted-foreground">
                                                    {Number(report.total_time).toFixed(2)}h
                                                </span>
                                            </div>

                                            {report.events?.length > 0 ? (
                                                <div className="space-y-2 border-t pt-2">
                                                    {report.events.map((event, index) => (
                                                        <div
                                                            key={`${report.date}-${event.event_name}-${index}`}
                                                            className="space-y-1"
                                                        >
                                                            <div className="flex items-center gap-2">
                                                                <span className="font-medium">{event.event_name}</span>
                                                                {event.duration_hours !== undefined && (
                                                                    <span className="text-xs text-muted-foreground">
                                                                        ({Number(event.duration_hours).toFixed(2)}h)
                                                                    </span>
                                                                )}
                                                            </div>
                                                            {event.event_description && (
                                                                <p className="text-muted-foreground">
                                                                    {event.event_description}
                                                                </p>
                                                            )}

                                                            {event.remarks && (
                                                                <div
                                                                    className="text-xs font-medium text-blue-600"
                                                                    dangerouslySetInnerHTML={{ __html: event.remarks }}
                                                                />
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="border-t pt-2 text-muted-foreground">
                                                    No report details available.
                                                </p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground">
                                    No daily reports available for this period.
                                </p>
                            )}
                        </div>
                    </>
                )}
            </CardContent>
        </Card>
    );
};

export default EmployeeTaskProgress;