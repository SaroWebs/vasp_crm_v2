import axios from 'axios';
import EmployeeTaskProgress from '@/components/admin/employees/EmployeeTaskProgress';
import TaskTimeline from '@/components/admin/TaskTimeline';
import { AttendanceCalendar } from '@/components/attendance';
import Board from '@/components/tasks/Board';
import NotificationMenu from '@/components/notifications/NotificationMenu';
import RecentReportSection from '@/components/reports/RecentReportSection';
import MajorTasks from '@/components/tasks/MajorTasks';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import StatCard from '@/components/dashboard/StatCard';
import ActivityEntryCard from '@/components/dashboard/ActivityEntryCard';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type Task } from '@/types';
import { Head, Link } from '@inertiajs/react';
import {
    AlertCircle,
    ArrowRight,
    Briefcase,
    Building2,
    Calendar,
    CheckCircle,
    Clock,
    FolderKanban,
    Ticket,
    UserCheck,
    Users,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import TimeSpentBarChart from '@/components/dashboard/TimeSpentBarChart';
import { AttendanceList } from '@/components/attendance/AttendanceList';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/admin/dashboard',
    },
];

interface DashboardStats {
    total_departments?: number;
    total_users?: number;
    total_clients?: number;
    total_products?: number;
    total_tickets?: number;
    total_tasks?: number;
    open_tickets?: number;
    pending_tasks?: number;
    completed_tasks_this_month?: number;
    active_users_today?: number;
    tickets_created_today?: number;
    tasks_completed_today?: number;
    // Manager stats
    total_team_members?: number;
    total_department_tasks?: number;
    in_progress_tasks?: number;
    tasks_due_today?: number;
    tasks_due_this_week?: number;
    overdue_tasks?: number;
    // Employee stats
    total_my_tasks?: number;
    waiting_tasks?: number;
    completed_tasks?: number;
    completed_this_month?: number;
    forwarded_tasks_count?: number;
}

interface DashboardProps {
    dashboard_type: 'admin' | 'manager' | 'employee';
    auth: any;
    stats?: DashboardStats;
    recentTickets?: any[];
    recentTasks?: any[];
    employeeProgress?: {
        data: any[];
        total_employees: number;
        total_time: number;
        total_tasks: number;
        avg_time_per_employee: number;
    };
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
    myTasks?: any[];
    myTaskStats?: Record<string, number>;
    forwardedTasks?: any[];
    upcomingDeadlines?: any[];
    recentTimeEntries?: any[];
    timeSpentChartData?: {
        weekly: Array<{ label: string; date: string; hours: number }>;
        monthly: Array<{ label: string; date: string; hours: number }>;
    };
    unreadNotificationsList?: any[];
}

export default function Dashboard(props: DashboardProps) {
    const {
        dashboard_type,
        stats,
        recentTimeEntries,
        recentTickets,
        employees,
        ticketStats,
        taskStats,
        userPermissions,
        myDepartmentTasks,
        teamWorkload,
        departmentStats,
        auth,
        myTasks,
        myTaskStats,
        forwardedTasks,
        upcomingDeadlines,
        timeSpentChartData,
    } = props;

    const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
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

    const isOverdueTask = (task: any): boolean => {
        const dueDateString = task.due_date ?? task.due_at;
        const completed = ['Done', 'Cancelled', 'Rejected'].includes(task.status ?? task.state);
        if (!dueDateString || completed) {
            return false;
        }

        const dueDate = new Date(dueDateString);
        return dueDate < new Date() && !['Done', 'Cancelled', 'Rejected'].includes(task.status ?? task.state);
    };

    const pendingTasks = (myTasks ?? [])
        .filter((task) => {
            const isPendingState = ['Draft', 'Assigned'].includes(task.status ?? task.state);
            return isPendingState;
        })
        .sort((a, b) => {
            const aOverdue = isOverdueTask(a) ? 0 : 1;
            const bOverdue = isOverdueTask(b) ? 0 : 1;

            if (aOverdue !== bOverdue) {
                return aOverdue - bOverdue;
            }

            const priorityRank: Record<string, number> = {
                P1: 0,
                P2: 1,
                P3: 2,
                P4: 3,
            };

            return (priorityRank[a.priority] ?? 4) - (priorityRank[b.priority] ?? 4);
        })
        .slice(0, 6);

    const renderAdminDashboard = () => (
        <>
            {/* Charts and Recent Activity */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <div className="lg:col-span-4 space-y-4">
                    {/* Recent Tickets */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Recent Tickets</CardTitle>
                            <CardDescription>
                                Latest ticket submissions
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {recentTickets?.map((ticket) => (
                                <Link
                                    key={ticket.id}
                                    href={`/admin/tickets/${ticket.id}`}
                                    className="flex cursor-pointer items-center justify-between space-x-4"
                                >
                                    <div className="flex w-full items-center justify-between pb-4">
                                        <div className="flex-1 space-y-1">
                                            <p className="text-sm leading-none font-medium">
                                                {ticket.title}
                                            </p>

                                            <p className="text-sm text-muted-foreground">
                                                {ticket.client?.name} •{' '}
                                                {ticket.ticket_number}
                                            </p>
                                        </div>

                                        <Badge
                                            variant={
                                                ticket.status === 'open'
                                                    ? 'destructive'
                                                    : ticket.status === 'approved'
                                                        ? 'default'
                                                        : 'secondary'
                                            }
                                            className="h-6"
                                        >
                                            {ticket.status}
                                        </Badge>
                                    </div>
                                </Link>
                            ))}
                        </CardContent>
                    </Card>
                    <RecentReportSection />
                </div>
                <div className="lg:col-span-3">
                    <AttendanceList date={new Date()} />
                </div>
            </div>

            <MajorTasks employees={employees || []} />

            <TaskTimeline />

            {/* Employee Progress Section */}
            <Card>
                <CardHeader>
                    <div className="">
                        <CardTitle>Employee Progress</CardTitle>
                        <CardDescription>
                            Task time entries and progress tracking
                        </CardDescription>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {/* Employee Selection */}
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                                <Users className="h-4 w-4 text-muted-foreground" />
                                <select
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                                    value={selectedEmployeeId}
                                    onChange={(e) => {
                                        setSelectedEmployeeId(e.target.value);
                                    }}
                                >
                                    <option value="all">All employees</option>
                                    {(employees || []).map((employee) => (
                                        <option
                                            key={employee.id}
                                            value={employee.id}
                                        >
                                            {employee.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Employee Task Progress Component */}
                        {selectedEmployeeId === 'all' ? (
                            <EmployeeTaskProgress employeeId="all" />
                        ) : selectedEmployeeId ? (
                            <EmployeeTaskProgress
                                employeeId={Number(selectedEmployeeId)}
                            />
                        ) : (
                            <EmployeeTaskProgress employeeId="all" />
                        )}
                    </div>
                </CardContent>
            </Card>

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
            {/* Manager Stats Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    title="Team Members"
                    value={stats?.total_team_members || 0}
                    icon={Users}
                />
                <StatCard
                    title="Department Tasks"
                    value={stats?.total_department_tasks || 0}
                    icon={FolderKanban}
                />
                <StatCard
                    title="Tasks Due This Week"
                    value={stats?.tasks_due_this_week || 0}
                    icon={Clock}
                    variant={stats?.tasks_due_this_week && stats.tasks_due_this_week > 0 ? 'warning' : 'default'}
                />
                <StatCard
                    title="Overdue Tasks"
                    value={stats?.overdue_tasks || 0}
                    icon={AlertCircle}
                    variant="destructive"
                />
            </div>

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
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
                <StatCard
                    title="Total Tasks"
                    value={stats?.total_my_tasks || 0}
                    icon={Briefcase}
                />
                <StatCard
                    title="Pending"
                    value={stats?.pending_tasks || 0}
                    icon={AlertCircle}
                    variant="warning"
                />
                <StatCard
                    title="In Progress"
                    value={stats?.in_progress_tasks || 0}
                    icon={Clock}
                />
                <StatCard
                    title="Due Today"
                    value={stats?.tasks_due_today || 0}
                    icon={Calendar}
                    variant={stats?.tasks_due_today && stats.tasks_due_today > 0 ? 'destructive' : 'default'}
                />
                <StatCard
                    title="Overdue"
                    value={stats?.overdue_tasks || 0}
                    icon={AlertCircle}
                    variant="destructive"
                />
                <StatCard
                    title="Completed This Month"
                    value={stats?.completed_this_month || 0}
                    icon={CheckCircle}
                    variant="success"
                />
            </div>

            <div className="grid gap-4 lg:grid-cols-[3fr_2fr]">
                <Card>
                    <CardHeader>
                        <CardTitle>Important / Pending Tasks</CardTitle>
                        <CardDescription>
                            Your highest priority tasks that need attention first
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {pendingTasks.length ? (
                            pendingTasks.map((task) => {
                                const overdue = isOverdueTask(task);

                                return (
                                    <div
                                        key={task.id}
                                        className={`rounded-lg border p-4 ${overdue ? 'border-destructive/30 bg-destructive/5' : 'border-border hover:bg-muted'}`}
                                    >
                                        <div className="flex items-center justify-between gap-2">
                                            <p className="font-medium">{task.title}</p>
                                            <Badge variant={overdue ? 'destructive' : 'outline'}>
                                                {task.status ?? task.state}
                                            </Badge>
                                        </div>
                                        <p className="text-sm text-muted-foreground">
                                            Due: {(task.due_date ?? task.due_at)
                                                ? new Date(task.due_date ?? task.due_at).toLocaleDateString()
                                                : 'N/A'}
                                        </p>
                                    </div>
                                );
                            })
                        ) : (
                            <p className="text-sm text-muted-foreground">
                                No pending tasks assigned to you.
                            </p>
                        )}
                    </CardContent>
                </Card>

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

            <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
                <Card>
                    <CardHeader>
                        <CardTitle>Daily Time Spent</CardTitle>
                        <CardDescription>
                            Track your daily time spent over the last week or month.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <TimeSpentBarChart data={timeSpentChartData} />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Employee Activities</CardTitle>
                        <CardDescription>
                            Recent time entries and activity history for your work.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {recentTimeEntries?.length ? (
                                recentTimeEntries.map((entry) => (
                                    <ActivityEntryCard key={entry.id} entry={entry} />
                                ))
                            ) : (
                                <p className="text-sm text-muted-foreground">
                                    No recent activity recorded today.
                                </p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

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



            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                    <CardHeader>
                        <CardTitle>Forwarded Tasks</CardTitle>
                        <CardDescription>
                            Tasks that were forwarded to you
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {forwardedTasks?.length ? (
                                forwardedTasks.map((forwarded) => (
                                    <div key={forwarded.id} className="rounded-lg border border-border p-3">
                                        <p className="font-medium">{forwarded.task_title}</p>
                                        <p className="text-sm text-muted-foreground">
                                            From {forwarded.from_user} • {forwarded.from_department}
                                        </p>
                                    </div>
                                ))
                            ) : (
                                <p className="text-sm text-muted-foreground">
                                    No forwarded tasks pending.
                                </p>
                            )}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>My Reports</CardTitle>
                        <CardDescription>
                            Access your daily reports and summaries
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            <p className="text-sm text-muted-foreground">
                                View your daily report history and submit new reports from the report center.
                            </p>
                            <Link href="/admin/reports">
                                <Button variant="outline" size="sm">
                                    View Reports
                                </Button>
                            </Link>
                        </div>
                    </CardContent>
                </Card>
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
            case 'manager':
                return renderManagerDashboard();
            case 'employee':
                return renderEmployeeDashboard();
            default:
                return renderAdminDashboard();
        }
    };

    // Get title based on dashboard type
    const getDashboardTitle = () => {
        switch (dashboard_type) {
            case 'manager':
                return 'Manager Dashboard';
            case 'employee':
                return 'Employee Dashboard';
            default:
                return 'Admin Dashboard';
        }
    };

    // Get subtitle based on dashboard type
    const getDashboardSubtitle = () => {
        switch (dashboard_type) {
            case 'manager':
                return 'Overview of your team and department performance';
            case 'employee':
                return 'Your personal task overview and progress';
            default:
                return 'Overview of your VASP ticket management system';
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={getDashboardTitle()} />

            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto p-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">
                            {getDashboardTitle()}
                        </h1>
                        <p className="text-muted-foreground">
                            {getDashboardSubtitle()}
                        </p>
                    </div>
                    <NotificationMenu />
                </div>

                {/* Render dashboard based on type */}
                {renderDashboard()}
            </div>
        </AppLayout>
    );
}
