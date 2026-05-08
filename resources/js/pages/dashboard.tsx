import axios from 'axios';
import TaskTimeline from '@/components/admin/TaskTimeline';
import { AttendanceCalendar } from '@/components/attendance';
import Board from '@/components/tasks/Board';
import RecentReportSection from '@/components/reports/RecentReportSection';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type Task } from '@/types';
import { Head, Link } from '@inertiajs/react';
import {
    Building2,
    Calendar,
    CheckCircle,
    Clock,
    Ticket,
    TicketIcon,
    UserCheck,
    Users,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { AttendanceList } from '@/components/attendance/AttendanceList';
import DashboardStatsWidget from '@/components/dashboard/widgets/DashboardStatsWidget';
import RecentTicketsWidget from '@/components/dashboard/widgets/RecentTicketsWidget';
import DashboardTasksWidget from '@/components/dashboard/widgets/DashboardTasksWidget';
import EmployeeActivitiesWidget from '@/components/dashboard/widgets/EmployeeActivitiesWidget';
import EmployeeRecentReportsWidget from '@/components/dashboard/widgets/EmployeeRecentReportsWidget';
import WizCardDesign1 from '@/components/wizards/WizCardDesign1';
import { useDashboardStats } from '@/hooks/use-dashboard-stats';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/admin/dashboard',
    },
];


interface DashboardProps {
    dashboard_type: 'admin' | 'manager' | 'employee';
    auth: any;
    employees?: Array<{
        id: number;
        name: string;
        email?: string;
    }>;
    unreadNotifications?: number;
    ticketStats?: Record<string, number>;
    taskStats?: Record<string, number>;
    userPermissions?: string[];
    // Manager specific
    myDepartmentTasks?: any[];
    teamWorkload?: any[];
    departmentStats?: any[];
    // Employee specific
    myTaskStats?: Record<string, number>;
    forwardedTasks?: any[];
    upcomingDeadlines?: any[];
    unreadNotificationsList?: any[];
}

export default function Dashboard(props: DashboardProps) {
    const {
        dashboard_type,
        employees,
        ticketStats,
        taskStats,
        userPermissions,
        myDepartmentTasks,
        teamWorkload,
        departmentStats,
        auth,
    } = props;

    const { stats: dashboardStats } = useDashboardStats(auth?.user?.id);

    const [boardTasks, setBoardTasks] = useState<Task[]>([]);
    const [boardLoading, setBoardLoading] = useState(false);
    const [boardError, setBoardError] = useState<string | null>(null);

    const loadBoardTasks = async (): Promise<void> => {
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
        } catch (error) {
            setBoardError('Unable to load your task board.');
        } finally {
            setBoardLoading(false);
        }
    };

    useEffect(() => {
        if (auth?.user?.id) {
            loadBoardTasks();
        }
    }, [auth?.user?.id]);


    const wizCards = [
        {
            title: 'Open Tickets',
            text: 'All active tickets',
            stats: dashboardStats.open_tickets ?? 0,
            icon: TicketIcon,
            color: 'orange',
        },
        {
            title: 'Closed Tickets',
            text: 'All closed tickets',
            stats: dashboardStats.closed_tickets ?? 0,
            icon: CheckCircle,
            color: 'blue',
        },
        {
            title: 'Pending Tasks',
            text: 'All pending tasks',
            stats: dashboardStats.pending_tasks ?? 0,
            icon: Clock,
            color: 'purple',
        },
        {
            title: 'Completed Tasks',
            text: 'All completed tasks',
            stats: dashboardStats.completed_tasks ?? 0,
            icon: CheckCircle,
            color: 'green',
        },
    ] as const;

    const renderAdminDashboard = () => (
        <>
            {/* Charts and Recent Activity */}
            <div className="grid gap-4 md:grid-cols-5">
                <div className="md:col-span-5">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                        {wizCards.map((wizCard) => (
                            <WizCardDesign1
                                key={wizCard.title}
                                title={wizCard.title}
                                text={wizCard.text}
                                stats={wizCard.stats}
                                icon={wizCard.icon}
                                color={wizCard.color}
                            />
                        ))}
                    </div>
                </div>
                <div className="md:col-span-3 space-y-4">
                    <RecentTicketsWidget />

                </div>
                <div className="md:col-span-2 space-y-4">
                    <AttendanceList
                        date={new Date()}
                        type="admin"
                        hasPagination={true}
                        hasFilter={true}
                        showRecentOnly={false}
                    />
                    <RecentReportSection />
                </div>
            </div>

            <TaskTimeline />

            {/* Task Status Overview */}
            <div className="grid gap-4 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Ticket Status Distribution</CardTitle>
                        <CardDescription>
                            Current status of all tickets
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {Object.entries(ticketStats || {}).map(
                                ([status, count]) => (
                                    <div
                                        key={status}
                                        className="flex items-center justify-between"
                                    >
                                        <span className="capitalize">
                                            {status.replace('_', ' ')}
                                        </span>
                                        <Badge variant="outline">{count}</Badge>
                                    </div>
                                ),
                            )}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Task Status Distribution</CardTitle>
                        <CardDescription>
                            Current status of all tasks
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {Object.entries(taskStats || {}).map(
                                ([status, count]) => (
                                    <div
                                        key={status}
                                        className="flex items-center justify-between"
                                    >
                                        <span className="capitalize">
                                            {status.replace('_', ' ')}
                                        </span>
                                        <Badge variant="outline">{count}</Badge>
                                    </div>
                                ),
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </>
    );

    const renderManagerDashboard = () => (
        <>
            {/* Manager Stats Grid Widget */}
            <DashboardStatsWidget dashboardType="manager" />

            <div className="grid gap-4 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Department Tasks</CardTitle>
                        <CardDescription>
                            Active tasks in your departments
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {myDepartmentTasks?.map((task) => (
                                <Link
                                    key={task.id}
                                    href={`/admin/tasks/${task.id}`}
                                    className="flex items-center justify-between rounded-lg p-2 hover:bg-muted"
                                >
                                    <div>
                                        <p className="font-medium">{task.title}</p>
                                        <p className="text-sm text-muted-foreground">
                                            {task.department} • Due:{' '}
                                            {task.due_date
                                                ? new Date(task.due_date).toLocaleDateString()
                                                : 'N/A'}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Badge variant="outline">
                                            {task.status}
                                        </Badge>
                                        <Badge
                                            variant={
                                                task.priority === 'high'
                                                    ? 'destructive'
                                                    : 'secondary'
                                            }
                                        >
                                            {task.priority}
                                        </Badge>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Department Summary</CardTitle>
                        <CardDescription>
                            Task progress across your departments
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {departmentStats?.map((department) => (
                                <div
                                    key={department.id}
                                    className="rounded-lg border border-border p-3"
                                >
                                    <div className="flex items-center justify-between">
                                        <span className="font-medium">
                                            {department.name}
                                        </span>
                                        <Badge variant="outline">
                                            {department.user_count} users
                                        </Badge>
                                    </div>
                                    <div className="mt-2 flex flex-col gap-1 text-sm text-muted-foreground">
                                        <span>
                                            Pending tasks: {department.pending_tasks}
                                        </span>
                                        <span>
                                            Completed this month:{' '}
                                            {department.completed_this_month}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Team Workload</CardTitle>
                    <CardDescription>
                        Current task distribution across team members
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {teamWorkload?.map((user) => (
                            <div
                                key={user.user_id}
                                className="flex items-center justify-between"
                            >
                                <div className="flex items-center gap-2">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                                        <span className="text-xs font-medium">
                                            {user.name.charAt(0)}
                                        </span>
                                    </div>
                                    <span className="font-medium">
                                        {user.name}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Badge
                                        variant={
                                            user.status === 'overloaded'
                                                ? 'destructive'
                                                : user.status === 'busy'
                                                    ? 'default'
                                                    : 'secondary'
                                        }
                                    >
                                        {user.task_count} tasks
                                    </Badge>
                                    <Badge variant="outline">
                                        {user.status}
                                    </Badge>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Team Activity Timeline</CardTitle>
                    <CardDescription>
                        See recent task flow and status updates for your team
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <TaskTimeline />
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-wrap gap-2">
                        {userPermissions?.includes('task.read') && (
                            <Link href="/admin/tasks">
                                <Button variant="outline">
                                    <CheckCircle className="mr-2 h-4 w-4" />
                                    View Tasks
                                </Button>
                            </Link>
                        )}
                        {userPermissions?.includes('ticket.read') && (
                            <Link href="/admin/tickets">
                                <Button variant="outline">
                                    <Ticket className="mr-2 h-4 w-4" />
                                    View Tickets
                                </Button>
                            </Link>
                        )}
                        {userPermissions?.includes('department.read') && (
                            <Link href="/admin/departments">
                                <Button variant="outline">
                                    <Building2 className="mr-2 h-4 w-4" />
                                    Departments
                                </Button>
                            </Link>
                        )}
                    </div>
                </CardContent>
            </Card>
        </>
    );

    const renderEmployeeDashboard = () => (
        <>
            {/* Employee Stats Grid Widget */}
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
                        <AttendanceCalendar auth={props.auth} />
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

    // Render based on dashboard type
    const renderDashboard = () => {
        switch (dashboard_type) {
            case 'employee':
                return renderEmployeeDashboard();
            default:
                return renderAdminDashboard();
        }
    };

    // Get title based on dashboard type
    const getDashboardTitle = () => {
        switch (dashboard_type) {
            case 'employee':
                return 'Employee Dashboard';
            default:
                return 'Admin Dashboard';
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={getDashboardTitle()} />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto p-6">
                {renderDashboard()}
            </div>
        </AppLayout>
    );
}
