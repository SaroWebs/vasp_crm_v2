import AppLayout from '@/layouts/app-layout';
import { Task, type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { format } from 'date-fns';
import {
    Calendar,
    User,
    AlertCircle,
    CheckCircle,
    Clock,
    XCircle,
    Plus,
} from 'lucide-react';
import Board from '@/components/tasks/Board';
import Overview from '@/components/tasks/Overview';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { useEffect, useState } from 'react';
import axios from 'axios';
import ReportForm from '@/components/reports/ReportForm';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/admin/dashboard',
    },
    {
        title: 'My Tasks',
        href: '/my/tasks',
    },
];

const getPriorityColor = (priority: string) => {
    switch (priority) {
        case 'P1':
            return 'bg-red-100 text-red-800 border-red-200';
        case 'P2':
            return 'bg-orange-100 text-orange-800 border-orange-200';
        case 'P3':
            return 'bg-yellow-100 text-yellow-800 border-yellow-200';
        case 'P4':
            return 'bg-green-100 text-green-800 border-green-200';
        default:
            return 'bg-gray-100 text-gray-800 border-gray-200';
    }
};

const getStatusColor = (status: string) => {
    switch (status) {
        case 'Done':
            return 'bg-green-100 text-green-800 border-green-200';
        case 'InProgress':
            return 'bg-blue-100 text-blue-800 border-blue-200';
        case 'Draft':
            return 'bg-gray-100 text-gray-800 border-gray-200';
        case 'Assigned':
            return 'bg-purple-100 text-purple-800 border-purple-200';
        case 'Blocked':
            return 'bg-red-100 text-red-800 border-red-200';
        case 'InReview':
            return 'bg-yellow-100 text-yellow-800 border-yellow-200';
        case 'Cancelled':
            return 'bg-red-100 text-red-800 border-red-200';
        case 'Rejected':
            return 'bg-red-100 text-red-800 border-red-200';
        default:
            return 'bg-gray-100 text-gray-800 border-gray-200';
    }
};

const getStatusIcon = (status: string) => {
    switch (status) {
        case 'Done':
            return <CheckCircle className="h-4 w-4" />;
        case 'InProgress':
            return <Clock className="h-4 w-4" />;
        case 'Draft':
            return <AlertCircle className="h-4 w-4" />;
        case 'Assigned':
            return <User className="h-4 w-4" />;
        case 'Blocked':
            return <XCircle className="h-4 w-4" />;
        case 'InReview':
            return <AlertCircle className="h-4 w-4" />;
        case 'Cancelled':
            return <XCircle className="h-4 w-4" />;
        case 'Rejected':
            return <XCircle className="h-4 w-4" />;
        default:
            return <XCircle className="h-4 w-4" />;
    }
};

interface PaginatedTasks {
    data: Task[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
}

export default function MyTasks() {
    const [tasks, setTasks] = useState<PaginatedTasks | null>(null);
    const [boardTasks, setBoardTasks] = useState<Task[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [loading, setLoading] = useState(false);
    const [boardLoading, setBoardLoading] = useState(false);
    const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);

    const loadTasks = (page = 1) => {
        setLoading(true);
        axios
            .get(`/data/my/tasks?page=${page}`)
            .then((res) => {
                setTasks(res.data);
                setCurrentPage(page);
            })
            .catch((err) => {
                console.log(err);
            })
            .finally(() => {
                setLoading(false);
            });
    };

    const loadBoardTasks = () => {
        setBoardLoading(true);
        axios
            .get('/data/my/board-tasks')
            .then((res) => {
                setBoardTasks(res.data.data || []);
            })
            .catch((err) => {
                console.log(err);
            })
            .finally(() => {
                setBoardLoading(false);
            });
    };

    useEffect(() => {
        loadTasks();
        loadBoardTasks();
    }, []);



    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="My Tasks" />

            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto p-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">
                            My Tasks
                        </h1>
                        <p className="text-muted-foreground">
                            View and manage tasks assigned to you
                        </p>
                    </div>
                    <div>
                        <Button
                            onClick={() => setIsReportDialogOpen(true)}
                            className=""
                        >
                            <Plus className="mr-2 h-4 w-4" />
                            Submit Report
                        </Button>
                    </div>
                </div>
                {/* Overview Component */}
                <Overview tasks={tasks?.data || []} loadTasks={loadTasks} />

                {/* Board Component - uses separate endpoint for recent tasks */}
                <Board tasks={boardTasks} loadTasks={loadBoardTasks} />

                {/* Tasks Table */}
                <Card>
                    <CardHeader>
                        <CardTitle>My Tasks</CardTitle>
                        <CardDescription>
                            A list of all tasks assigned to you
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {tasks?.data?.length === 0 ? (
                            <div className="py-8 text-center">
                                <p className="text-gray-500">
                                    No tasks assigned to you.
                                </p>
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Task</TableHead>
                                        <TableHead>State</TableHead>
                                        <TableHead>Priority</TableHead>
                                        <TableHead>Type</TableHead>
                                        <TableHead>Assigned By</TableHead>
                                        <TableHead>Due Date</TableHead>
                                        <TableHead>Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {tasks?.data?.map((task: Task) => {
                                        const isDeleted = !!task.deleted_at;
                                        return (
                                            <TableRow
                                                key={task.id}
                                                className={
                                                    isDeleted
                                                        ? 'bg-muted/50 opacity-60'
                                                        : ''
                                                }
                                            >
                                                <TableCell>
                                                    <div>
                                                        <Link
                                                            href={`/my/tasks/${task.id}`}
                                                            className={
                                                                isDeleted
                                                                    ? 'pointer-events-none text-muted-foreground'
                                                                    : ''
                                                            }
                                                            tabIndex={
                                                                isDeleted
                                                                    ? -1
                                                                    : undefined
                                                            }
                                                            aria-disabled={
                                                                isDeleted ||
                                                                undefined
                                                            }
                                                        >
                                                            <p
                                                                className={`text-sm font-medium leading-none${isDeleted ? 'text-muted-foreground line-through' : ''}`}
                                                            >
                                                                {task.title ||
                                                                    `Task #${task.id}`}
                                                            </p>
                                                        </Link>
                                                        <div className="space-y-1 text-xs text-muted-foreground">
                                                            {task.task_code && (
                                                                <p>
                                                                    Code:{' '}
                                                                    {
                                                                        task.task_code
                                                                    }
                                                                </p>
                                                            )}
                                                            {task.ticket && (
                                                                <p>
                                                                    Ticket:{' '}
                                                                    {
                                                                        task
                                                                            .ticket
                                                                            .ticket_number
                                                                    }{' '}
                                                                    -{' '}
                                                                    {
                                                                        task
                                                                            .ticket
                                                                            .title
                                                                    }
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge
                                                        className={`${getStatusColor(task.state)}${isDeleted ? 'opacity-60' : ''}`}
                                                    >
                                                        <div className="flex items-center gap-1">
                                                            {getStatusIcon(
                                                                task.state,
                                                            )}
                                                            <span
                                                                className={`capitalize${isDeleted ? 'line-through' : ''}`}
                                                            >
                                                                {task.state.replace(
                                                                    '-',
                                                                    ' ',
                                                                )}
                                                            </span>
                                                        </div>
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge
                                                        className={`${getPriorityColor(task.sla_policy?.priority || 'P4')}${isDeleted ? 'opacity-60' : ''}`}
                                                    >
                                                        <AlertCircle className="mr-1 h-3 w-3" />
                                                        <span
                                                            className={`capitalize${isDeleted ? 'line-through' : ''}`}
                                                        >
                                                            {task.sla_policy
                                                                ?.priority ||
                                                                'P4'}
                                                        </span>
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    {task.task_type ? (
                                                        <div className="flex items-center gap-2">
                                                            <span
                                                                className={`text-sm${isDeleted ? 'text-muted-foreground line-through' : ''}`}
                                                            >
                                                                {
                                                                    task
                                                                        .task_type
                                                                        .name
                                                                }
                                                            </span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-sm text-muted-foreground">
                                                            No Type
                                                        </span>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    {task.created_by ? (
                                                        <div className="flex items-center gap-2">
                                                            <User className="h-4 w-4 text-muted-foreground" />
                                                            <span
                                                                className={`text-sm${isDeleted ? 'text-muted-foreground line-through' : ''}`}
                                                            >
                                                                {
                                                                    task
                                                                        .created_by
                                                                        .name
                                                                }
                                                            </span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-sm text-muted-foreground">
                                                            System
                                                        </span>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    {task.due_at ? (
                                                        <div className="flex items-center gap-2">
                                                            <Calendar className="h-4 w-4 text-muted-foreground" />
                                                            <span
                                                                className={`text-sm${isDeleted ? 'text-muted-foreground line-through' : ''}`}
                                                            >
                                                                {format(
                                                                    new Date(
                                                                        task.due_at,
                                                                    ),
                                                                    'MMM dd, yyyy',
                                                                )}
                                                            </span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-sm text-muted-foreground">
                                                            No due date
                                                        </span>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <Link
                                                        href={`/my/tasks/${task.id}`}
                                                    >
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                        >
                                                            View Details
                                                        </Button>
                                                    </Link>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>

                {tasks && tasks.last_page > 1 && (
                    <div className="flex justify-center mt-4">
                        <nav className="flex items-center space-x-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => loadTasks(currentPage - 1)}
                                disabled={currentPage === 1 || loading}
                            >
                                Previous
                            </Button>
                            <span className="text-sm text-gray-600">
                                Page {currentPage} of {tasks.last_page}
                            </span>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => loadTasks(currentPage + 1)}
                                disabled={currentPage === tasks.last_page || loading}
                            >
                                Next
                            </Button>
                        </nav>
                    </div>
                )}

                {/* Report Dialog */}
                <ReportForm
                    open={isReportDialogOpen}
                    onOpenChange={setIsReportDialogOpen}
                    tasks={tasks?.data || []}
                />
            </div>
        </AppLayout>
    );
}
