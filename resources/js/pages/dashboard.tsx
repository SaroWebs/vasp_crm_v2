import NotificationMenu from '@/components/notifications/NotificationMenu';
import EmployeeTaskProgress from '@/components/admin/employees/EmployeeTaskProgress';
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
import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import {
    Building2,
    CheckCircle,
    Ticket,
    UserCheck,
    Users,
} from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/admin/dashboard',
    },
];

interface DashboardProps {
    stats: {
        total_departments: number;
        total_users: number;
        total_clients: number;
        total_products: number;
        total_tickets: number;
        total_tasks: number;
        open_tickets: number;
        pending_tasks: number;
        completed_tasks_this_month: number;
        active_users_today: number;
        tickets_created_today: number;
        tasks_completed_today: number;
    };
    recentTickets: any[];
    recentTasks: any[];
    employeeProgress: {
        data: any[];
        total_employees: number;
        total_time: number;
        total_tasks: number;
        avg_time_per_employee: number;
    };
    employees: Array<{
        id: number;
        name: string;
        email?: string;
    }>;
    unreadNotifications: number;
    ticketStats: Record<string, number>;
    taskStats: Record<string, number>;
    userPermissions: string[];
}

export default function Dashboard(props: DashboardProps) {
    const {
        stats,
        recentTickets,
        employeeProgress,
        employees,
        ticketStats,
        taskStats,
        userPermissions
    } = props;

    const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | null>(null);

    const ShowEmployeeDetails = (employee: any) => {
        router.visit(`/admin/employees/${employee.id}`);
    }


    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Admin Dashboard" />

            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto p-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">
                            Admin Dashboard
                        </h1>
                        <p className="text-muted-foreground">
                            Overview of your VASP ticket management system
                        </p>
                    </div>
                    <NotificationMenu />
                </div>

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
                            {recentTickets.map((ticket) => (
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
                                                    : ticket.status ===
                                                        'approved'
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
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                        value={selectedEmployeeId ?? ''}
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            setSelectedEmployeeId(value ? Number(value) : null);
                                        }}
                                    >
                                        <option value="">Select an employee</option>
                                        {employeeProgress.data.map((employee) => (
                                            <option key={employee.user_id} value={employee.user_id}>
                                                {employee.user_name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Employee Task Progress Component */}
                            {selectedEmployeeId ? (
                                <EmployeeTaskProgress employeeId={selectedEmployeeId} />
                            ) : (
                                <div className="text-center py-8 text-muted-foreground">
                                    <p>Select an employee to view their task progress</p>
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
                                {Object.entries(ticketStats).map(
                                    ([status, count]) => (
                                        <div
                                            key={status}
                                            className="flex items-center justify-between"
                                        >
                                            <span className="capitalize">
                                                {status.replace('_', ' ')}
                                            </span>
                                            <Badge variant="outline">
                                                {count}
                                            </Badge>
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
                                {Object.entries(taskStats).map(
                                    ([status, count]) => (
                                        <div
                                            key={status}
                                            className="flex items-center justify-between"
                                        >
                                            <span className="capitalize">
                                                {status.replace('_', ' ')}
                                            </span>
                                            <Badge variant="outline">
                                                {count}
                                            </Badge>
                                        </div>
                                    ),
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Quick Actions */}
                <Card>
                    <CardHeader>
                        <CardTitle>Quick Actions</CardTitle>
                        <CardDescription>
                            Common administrative tasks
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-wrap gap-2">
                            {userPermissions.includes('department.create') && (
                                <Link href="/admin/departments/create">
                                    <Button variant="outline">
                                        <Building2 className="mr-2 h-4 w-4" />
                                        Create Department
                                    </Button>
                                </Link>
                            )}
                            {userPermissions.includes('ticket.read') && (
                                <Link href="/admin/tickets">
                                    <Button variant="outline">
                                        <Ticket className="mr-2 h-4 w-4" />
                                        View Tickets
                                    </Button>
                                </Link>
                            )}
                            {userPermissions.includes('task.read') && (
                                <Link href="/admin/tasks">
                                    <Button variant="outline">
                                        <CheckCircle className="mr-2 h-4 w-4" />
                                        View Tasks
                                    </Button>
                                </Link>
                            )}
                            {userPermissions.includes('client.read') && (
                                <Link href="/admin/clients">
                                    <Button variant="outline">
                                        <UserCheck className="mr-2 h-4 w-4" />
                                        Manage Clients
                                    </Button>
                                </Link>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}

