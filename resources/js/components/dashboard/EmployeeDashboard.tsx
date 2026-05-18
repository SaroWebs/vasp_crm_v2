import axios from 'axios';
import { useCallback, useEffect, useState } from 'react';
import { AttendanceCalendar } from '@/components/attendance';
import Board from '@/components/tasks/Board';
import DashboardStatsWidget from '@/components/dashboard/widgets/DashboardStatsWidget';
import DashboardTasksWidget from '@/components/dashboard/widgets/DashboardTasksWidget';
import EmployeeActivitiesWidget from '@/components/dashboard/widgets/EmployeeActivitiesWidget';
import EmployeeRecentReportsWidget from '@/components/dashboard/widgets/EmployeeRecentReportsWidget';
import TaskTimeline from '@/components/admin/TaskTimeline';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from '@inertiajs/react';
import { type Task } from '@/types';

interface EmployeeDashboardProps {
    auth: { user?: { id?: number } } | null;
}

export default function EmployeeDashboard({ auth }: EmployeeDashboardProps) {
    const [boardTasks, setBoardTasks] = useState<Task[]>([]);
    const [boardLoading, setBoardLoading] = useState(false);
    const [boardError, setBoardError] = useState<string | null>(null);

    const loadBoardTasks = useCallback(async (): Promise<void> => {
        if (!auth?.user?.id) {
            setBoardTasks([]);
            return;
        }

        setBoardLoading(true);
        setBoardError(null);

        try {
            const response = await axios.get('/admin/data/tasks', {
                params: {
                    assigned_to: auth.user.id,
                    per_page: 100,
                    sort_by: 'due_at',
                    sort_order: 'asc',
                },
            });

            const taskData = response.data.tasks?.data ?? response.data.tasks ?? [];
            setBoardTasks(Array.isArray(taskData) ? taskData : []);
        } catch {
            setBoardError('Unable to load your task board.');
        } finally {
            setBoardLoading(false);
        }
    }, [auth?.user?.id]);

    useEffect(() => {
        loadBoardTasks();
    }, [loadBoardTasks]);

    return (
        <>
            <DashboardStatsWidget dashboardType="employee" />

            <div className="grid gap-4 lg:grid-cols-[3fr_2fr]">
                <DashboardTasksWidget />

                <Card>
                    <CardHeader>
                        <CardTitle>Attendance Calendar</CardTitle>
                        <CardDescription>
                            Your attendance summary for the current period
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <AttendanceCalendar auth={auth} />
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Task Board</CardTitle>
                    <CardDescription>
                        Drag tasks between statuses and keep your work flowing.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {boardError ? (
                        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
                            {boardError}
                        </div>
                    ) : boardLoading ? (
                        <div className="py-8 text-center text-muted-foreground">
                            Loading task board...
                        </div>
                    ) : (
                        <Board tasks={boardTasks} loadTasks={loadBoardTasks} />
                    )}
                </CardContent>
            </Card>

            <EmployeeActivitiesWidget />

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                    <CardHeader>
                        <CardTitle>Workload Matrix</CardTitle>
                        <CardDescription>
                            View the full workload matrix on the dedicated page.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col gap-3">
                            <p className="text-sm text-muted-foreground">
                                The workload matrix provides an overview of assignments and capacity for your team.
                            </p>
                            <Link href="/admin/workload-matrix">
                                <Button variant="outline">
                                    View Workload Matrix
                                </Button>
                            </Link>
                        </div>
                    </CardContent>
                </Card>

                <EmployeeRecentReportsWidget className="lg:col-span-2" />
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Task Timeline</CardTitle>
                    <CardDescription>
                        Activity and status changes for your assigned tasks
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <TaskTimeline />
                </CardContent>
            </Card>
        </>
    );
}
