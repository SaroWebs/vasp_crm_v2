import EmployeeTaskProgress from '@/components/admin/employees/EmployeeTaskProgress';
import TaskTimeline from '@/components/admin/TaskTimeline';
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
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import {
    AlertCircle,
    ArrowRight,
    Briefcase,
    Building2,
    CheckCircle,
    Clock,
    FolderKanban,
    Ticket,
    UserCheck,
    Users,
} from 'lucide-react';
import { useEffect, useState } from 'react';

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
    unreadNotificationsList?: any[];
}

export default function Dashboard(props: DashboardProps) {
    const {
        dashboard_type,
        stats,
        recentTickets,
        employees,
        ticketStats,
        taskStats,
        userPermissions,
        myDepartmentTasks,
        teamWorkload,
        myTasks,
        myTaskStats,
        forwardedTasks,
        upcomingDeadlines,
    } = props;

    const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');

    useEffect(() => {
        setSelectedEmployeeId('all');
    }, []);


    const renderAdminDashboard = () => (
        <>
            {/* Charts and Recent Activity */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <RecentReportSection />

                {/* Recent Tickets */}
                <Card className="col-span-3">
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
            </div>

            <MajorTasks employees={employees || []} />
            
            <TaskTimeline/>

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
                            <div className="py-8 text-center text-muted-foreground">
                                <p>
                                    Select an employee or all employees to view
                                    task progress
                                </p>
                            </div>
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
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Team Members
                        </CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {stats?.total_team_members || 0}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Department Tasks
                        </CardTitle>
                        <FolderKanban className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {stats?.total_department_tasks || 0}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Tasks Due This Week
                        </CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {stats?.tasks_due_this_week || 0}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Overdue Tasks
                        </CardTitle>
                        <AlertCircle className="h-4 w-4 text-destructive" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-destructive">
                            {stats?.overdue_tasks || 0}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Team Workload */}
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

            {/* Department Tasks */}
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
                                            ? new Date(
                                                  task.due_date,
                                              ).toLocaleDateString()
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

            {/* Quick Actions */}
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
            {/* Employee Stats Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            My Tasks
                        </CardTitle>
                        <FolderKanban className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {stats?.total_my_tasks || 0}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            In Progress
                        </CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {stats?.in_progress_tasks || 0}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Due This Week
                        </CardTitle>
                        <AlertCircle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {stats?.tasks_due_this_week || 0}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Forwarded Tasks
                        </CardTitle>
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {stats?.forwarded_tasks_count || 0}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* My Tasks */}
            <Card>
                <CardHeader>
                    <CardTitle>My Tasks</CardTitle>
                    <CardDescription>Your assigned tasks</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {myTasks?.map((task) => (
                            <Link
                                key={task.id}
                                href={`/my/tasks/${task.id}`}
                                className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted"
                            >
                                <div className="flex-1">
                                    <p className="font-medium">{task.title}</p>
                                    <p className="text-sm text-muted-foreground">
                                        {task.department} • Due:{' '}
                                        {task.due_date
                                            ? new Date(
                                                  task.due_date,
                                              ).toLocaleDateString()
                                            : 'N/A'}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Badge
                                        variant={
                                            task.status === 'in-progress'
                                                ? 'default'
                                                : task.status === 'completed'
                                                  ? 'secondary'
                                                  : 'outline'
                                        }
                                    >
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
                        {(!myTasks || myTasks.length === 0) && (
                            <p className="py-4 text-center text-muted-foreground">
                                No tasks assigned to you
                            </p>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Two column layout for forwarded tasks and upcoming deadlines */}
            <div className="grid gap-4 md:grid-cols-2">
                {/* Forwarded Tasks */}
                <Card>
                    <CardHeader>
                        <CardTitle>Forwarded Tasks</CardTitle>
                        <CardDescription>
                            Tasks forwarded to you by others
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {forwardedTasks?.map((task) => (
                                <div
                                    key={task.id}
                                    className="rounded-lg border p-3"
                                >
                                    <p className="font-medium">
                                        {task.task_title}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        From: {task.from_user} (
                                        {task.from_department})
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        Forwarded:{' '}
                                        {new Date(
                                            task.forwarded_at,
                                        ).toLocaleDateString()}
                                    </p>
                                </div>
                            ))}
                            {(!forwardedTasks ||
                                forwardedTasks.length === 0) && (
                                <p className="py-4 text-center text-muted-foreground">
                                    No forwarded tasks
                                </p>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Upcoming Deadlines */}
                <Card>
                    <CardHeader>
                        <CardTitle>Upcoming Deadlines</CardTitle>
                        <CardDescription>
                            Tasks due in the next 7 days
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {upcomingDeadlines?.map((task) => (
                                <div
                                    key={task.id}
                                    className="flex items-center justify-between rounded-lg border p-3"
                                >
                                    <div>
                                        <p className="font-medium">
                                            {task.title}
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            Due:{' '}
                                            {new Date(
                                                task.due_date,
                                            ).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <Badge
                                        variant={
                                            task.is_overdue
                                                ? 'destructive'
                                                : 'outline'
                                        }
                                    >
                                        {task.is_overdue
                                            ? 'Overdue'
                                            : task.status}
                                    </Badge>
                                </div>
                            ))}
                            {(!upcomingDeadlines ||
                                upcomingDeadlines.length === 0) && (
                                <p className="py-4 text-center text-muted-foreground">
                                    No upcoming deadlines
                                </p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Task Status Summary */}
            <Card>
                <CardHeader>
                    <CardTitle>My Task Summary</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                        <div className="rounded-lg bg-muted p-4 text-center">
                            <div className="text-2xl font-bold">
                                {myTaskStats?.pending || 0}
                            </div>
                            <div className="text-sm text-muted-foreground">
                                Pending
                            </div>
                        </div>
                        <div className="rounded-lg bg-muted p-4 text-center">
                            <div className="text-2xl font-bold">
                                {myTaskStats?.in_progress || 0}
                            </div>
                            <div className="text-sm text-muted-foreground">
                                In Progress
                            </div>
                        </div>
                        <div className="rounded-lg bg-muted p-4 text-center">
                            <div className="text-2xl font-bold">
                                {myTaskStats?.waiting || 0}
                            </div>
                            <div className="text-sm text-muted-foreground">
                                Waiting
                            </div>
                        </div>
                        <div className="rounded-lg bg-muted p-4 text-center">
                            <div className="text-2xl font-bold">
                                {myTaskStats?.completed || 0}
                            </div>
                            <div className="text-sm text-muted-foreground">
                                Completed
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
                <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-wrap gap-2">
                        <Link href="/my/tasks">
                            <Button variant="outline">
                                <FolderKanban className="mr-2 h-4 w-4" />
                                My Tasks
                            </Button>
                        </Link>
                        <Link href="/my/tasks?create=true">
                            <Button variant="outline">
                                <Briefcase className="mr-2 h-4 w-4" />
                                Create Task
                            </Button>
                        </Link>
                    </div>
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
                return 'My Dashboard';
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

                {/* Stats Grid for Admin */}
                {dashboard_type === 'admin' && stats && (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">
                                    Total Users
                                </CardTitle>
                                <Users className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {stats.total_users}
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">
                                    Departments
                                </CardTitle>
                                <Building2 className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {stats.total_departments}
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">
                                    Open Tickets
                                </CardTitle>
                                <Ticket className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {stats.open_tickets}
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">
                                    Pending Tasks
                                </CardTitle>
                                <CheckCircle className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {stats.pending_tasks}
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">
                                    Active Today
                                </CardTitle>
                                <UserCheck className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {stats.active_users_today}
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">
                                    Completed Today
                                </CardTitle>
                                <CheckCircle className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {stats.tasks_completed_today}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Render dashboard based on type */}
                {renderDashboard()}
            </div>
        </AppLayout>
    );
}
