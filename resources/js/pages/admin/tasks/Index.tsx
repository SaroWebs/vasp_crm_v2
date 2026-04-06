import TaskAssignmentModal from '@/components/TaskAssignmentModal';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { Task, type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { Badge } from '@mantine/core';
import axios from 'axios';
import { format } from 'date-fns';
import {
    ArrowUpDown,
    AlertCircle,
    Calendar,
    CheckCircle,
    Clock,
    ChevronDown,
    ChevronUp,
    EllipsisVertical,
    Plus,
    Search,
    TicketIcon,
    User,
    UserPlus,
    XCircle,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { BiSolidEdit } from 'react-icons/bi';
import { FiTrash } from 'react-icons/fi';
import { PiEye } from 'react-icons/pi';
import { toast } from 'sonner';

interface PaginatedTasks {
    data: Task[]; 
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
    links: Array<{
        url: string | null;
        label: string;
        active: boolean;
    }>;
}

interface TaskOverviewStats {
    total: number;
    draft: number;
    assigned: number;
    inProgress: number;
    blocked: number;
    inReview: number;
    done: number;
    cancelled: number;
    rejected: number;
}

interface TasksDataResponse {
    tasks: PaginatedTasks;
    stats: {
        total: number;
        draft: number;
        assigned: number;
        in_progress: number;
        blocked: number;
        in_review: number;
        done: number;
        cancelled: number;
        rejected: number;
    };
}

interface TasksIndexProps {
    filters: {
        state?: string;
        assigned_to?: string;
        search?: string;
        per_page?: string;
        sort_by?: string;
        sort_order?: string;
    };
    users: Array<{ id: number; name: string }>;
}

type TaskFilterKey = 'state' | 'assigned_to';
type TaskSortField = 'created_at' | 'title' | 'task_code' | 'state' | 'due_at' | 'priority';

const sortableTaskFields: TaskSortField[] = [
    'created_at',
    'title',
    'task_code',
    'state',
    'due_at',
    'priority',
];

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/admin/dashboard',
    },
    {
        title: 'Tasks',
        href: '/admin/tasks',
    },
];

const getStatusColor = (status: string) => {
    switch (status) {
        case 'Done':
            return 'green';
        case 'InProgress':
            return 'lime';
        case 'Draft':
            return 'gray';
        case 'Assigned':
            return 'grape';
        case 'Blocked':
            return 'red';
        case 'InReview':
            return 'yellow';
        case 'Cancelled':
            return 'red';
        case 'Rejected':
            return 'red';
        default:
            return 'gray';
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

const getPriorityCheck = (priority?: string) => {
    const map = {
        P1: 'Critical',
        P2: 'High',
        P3: 'Medium',
        P4: 'Low',
    };

    if (priority) {
        return priority in map ? map[priority as keyof typeof map] : map.P4;
    } else {
        return map.P4;
    }
};

export default function TasksIndex({
    filters = {},
    users,
}: TasksIndexProps) {
    const [searchQuery, setSearchQuery] = useState(filters.search || '');
    const [, setIsDeleting] = useState(false);
    const [selectedTaskForAssignment, setSelectedTaskForAssignment] = useState<
        number | null
    >(null);
    const [showAssignmentModal, setShowAssignmentModal] = useState(false);
    const [tasksData, setTasksData] = useState<PaginatedTasks>({
        data: [],
        current_page: 1,
        last_page: 1,
        per_page: Number(filters.per_page) || 10,
        total: 0,
        from: 0,
        to: 0,
        links: [],
    });
    const [perPage, setPerPage] = useState(Number(filters.per_page) || 10);
    const [sortConfig, setSortConfig] = useState<{
        field: TaskSortField;
        direction: 'asc' | 'desc';
    }>({
        field: sortableTaskFields.includes(filters.sort_by as TaskSortField)
            ? (filters.sort_by as TaskSortField)
            : 'created_at',
        direction: filters.sort_order === 'asc' ? 'asc' : 'desc',
    });
    const [activeFilters, setActiveFilters] = useState({
        state: filters.state || 'all',
        assigned_to: filters.assigned_to || 'all',
        search: filters.search || '',
    });
    const [taskStats, setTaskStats] = useState<TaskOverviewStats>({
        total: 0,
        draft: 0,
        assigned: 0,
        inProgress: 0,
        blocked: 0,
        inReview: 0,
        done: 0,
        cancelled: 0,
        rejected: 0,
    });
    const [isTasksLoading, setIsTasksLoading] = useState(false);

    const filteredTasks = tasksData.data;

    const loadTasksData = async (
        overrides: Partial<{
            state: string;
            assigned_to: string;
            search: string;
            page: number;
            per_page: number;
            sort_by: TaskSortField;
            sort_order: 'asc' | 'desc';
        }> = {},
    ) => {
        const mergedFilters = {
            ...activeFilters,
            ...overrides,
        };
        const nextPerPage = overrides.per_page ?? perPage;
        const nextSortField = overrides.sort_by ?? sortConfig.field;
        const nextSortOrder = overrides.sort_order ?? sortConfig.direction;

        const requestParams: Record<string, string | number> = {
            per_page: nextPerPage,
            sort_by: nextSortField,
            sort_order: nextSortOrder,
        };

        if (mergedFilters.state && mergedFilters.state !== 'all') {
            requestParams.state = mergedFilters.state;
        }

        if (mergedFilters.assigned_to && mergedFilters.assigned_to !== 'all') {
            requestParams.assigned_to = mergedFilters.assigned_to;
        }


        if (mergedFilters.search && mergedFilters.search.trim() !== '') {
            requestParams.search = mergedFilters.search.trim();
        }

        if (overrides.page) {
            requestParams.page = overrides.page;
        }

        setPerPage(nextPerPage);
        setSortConfig({
            field: nextSortField,
            direction: nextSortOrder,
        });
        setIsTasksLoading(true);

        try {
            const response = await axios.get('/admin/data/tasks', {
                params: requestParams,
            });
            const responseData: TasksDataResponse = response.data;
            setTasksData(responseData.tasks);
            setTaskStats({
                total: responseData.stats.total,
                draft: responseData.stats.draft,
                assigned: responseData.stats.assigned,
                inProgress: responseData.stats.in_progress,
                blocked: responseData.stats.blocked,
                inReview: responseData.stats.in_review,
                done: responseData.stats.done,
                cancelled: responseData.stats.cancelled,
                rejected: responseData.stats.rejected,
            });
            setActiveFilters(mergedFilters);
        } catch (error) {
            console.error('Error loading tasks data:', error);
        } finally {
            setIsTasksLoading(false);
        }
    };

    const handleFilterChange = (key: TaskFilterKey, value: string) => {
        loadTasksData({
            [key]: value,
            page: 1,
        });
    };

    const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        loadTasksData({
            search: searchQuery.trim(),
            page: 1,
        });
    };

    const handleDeleteTask = (task: Task) => {
        if (
            confirm(
                'Are you sure you want to delete this task? It will be moved to trash and can be restored later.',
            )
        ) {
            setIsDeleting(true);
            axios
                .delete(`/admin/tasks/${task.id}`)
                .then(() => {
                    loadTasksData({
                        page: tasksData.current_page,
                    });
                })
                .catch((res) => {
                    console.log(res);
                })
                .finally(() => {
                    setIsDeleting(false);
                });
        }
    };

    const handleSort = (field: TaskSortField) => {
        const nextDirection =
            sortConfig.field === field && sortConfig.direction === 'asc'
                ? 'desc'
                : 'asc';

        loadTasksData({
            sort_by: field,
            sort_order: nextDirection,
            page: 1,
        });
    };

    const getSortIcon = (field: TaskSortField) => {
        if (sortConfig.field !== field) {
            return <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />;
        }

        return sortConfig.direction === 'asc' ? (
            <ChevronUp className="h-3.5 w-3.5" />
        ) : (
            <ChevronDown className="h-3.5 w-3.5" />
        );
    };

    const showingFrom =
        tasksData.total === 0
            ? 0
            : tasksData.from ||
              (tasksData.current_page - 1) * tasksData.per_page + 1;
    const showingTo =
        tasksData.total === 0
            ? 0
            : tasksData.to ||
              Math.min(
                  tasksData.current_page * tasksData.per_page,
                  tasksData.total,
              );

    useEffect(() => {
        loadTasksData();
    }, []);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Tasks" />

            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto p-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">
                            Tasks
                        </h1>
                        <p className="text-muted-foreground">
                            Manage and track all tasks across your organization
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            onClick={() => {
                                loadTasksData({
                                    page: tasksData.current_page,
                                });
                            }}
                            disabled={isTasksLoading}
                        >
                            Refresh Tasks
                        </Button>
                        <Link href="/admin/tasks/create">
                            <Button>
                                <Plus className="mr-2 h-4 w-4" />
                                Create Task
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid gap-3 md:grid-cols-4">
                    <div className="rounded-lg border bg-card p-3">
                        <div className="flex items-center justify-between">
                            <div className="text-2xl font-bold">
                                {taskStats.total}
                            </div>
                            <TicketIcon className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="text-xs text-muted-foreground">
                            Total
                        </div>
                    </div>

                    <div className="rounded-lg border bg-card p-3">
                        <div className="flex items-center justify-between">
                            <div className="text-2xl font-bold">
                                {taskStats.draft}
                            </div>
                            <AlertCircle className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="text-xs text-muted-foreground">
                            Draft
                        </div>
                    </div>

                    <div className="rounded-lg border bg-card p-3">
                        <div className="flex items-center justify-between">
                            <div className="text-2xl font-bold">
                                {taskStats.inProgress}
                            </div>
                            <Clock className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="text-xs text-muted-foreground">
                            In Progress
                        </div>
                    </div>

                    <div className="rounded-lg border bg-card p-3">
                        <div className="flex items-center justify-between">
                            <div className="text-2xl font-bold">
                                {taskStats.done}
                            </div>
                            <CheckCircle className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="text-xs text-muted-foreground">
                            Done
                        </div>
                    </div>
                </div>

                {/* Tasks Table */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <CardTitle>All Tasks</CardTitle>
                                <CardDescription>
                                    A list of all tasks in the system
                                </CardDescription>
                            </div>
                            <div className="flex flex-wrap gap-4">
                                <form
                                    onSubmit={handleSearch}
                                    className="flex gap-2"
                                >
                                    <Input
                                        placeholder="Search tasks..."
                                        value={searchQuery}
                                        onChange={(e) =>
                                            setSearchQuery(e.target.value)
                                        }
                                        className="w-48"
                                    />
                                    <Button type="submit" variant="outline">
                                        <Search className="h-4 w-4" />
                                    </Button>
                                </form>

                                <Select
                                    value={activeFilters.assigned_to}
                                    onValueChange={(value) =>
                                        handleFilterChange('assigned_to', value)
                                    }
                                >
                                    <SelectTrigger className="w-40">
                                        <SelectValue placeholder="Assigned To" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">
                                            All Users
                                        </SelectItem>
                                        {users.map((user) => (
                                            <SelectItem
                                                key={user.id}
                                                value={user.id.toString()}
                                            >
                                                {user.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                <Select
                                    value={activeFilters.state}
                                    onValueChange={(value) =>
                                        handleFilterChange('state', value)
                                    }
                                >
                                    <SelectTrigger className="w-32">
                                        <SelectValue placeholder="State" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">
                                            All States
                                        </SelectItem>
                                        <SelectItem value="Draft">
                                            Draft
                                        </SelectItem>
                                        <SelectItem value="Assigned">
                                            Assigned
                                        </SelectItem>
                                        <SelectItem value="InProgress">
                                            In Progress
                                        </SelectItem>
                                        <SelectItem value="Blocked">
                                            Blocked
                                        </SelectItem>
                                        <SelectItem value="InReview">
                                            In Review
                                        </SelectItem>
                                        <SelectItem value="Done">
                                            Done
                                        </SelectItem>
                                        <SelectItem value="Cancelled">
                                            Cancelled
                                        </SelectItem>
                                        <SelectItem value="Rejected">
                                            Rejected
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {filteredTasks.length === 0 ? (
                            <div className="py-8 text-center">
                                <TicketIcon className="mx-auto h-12 w-12 text-gray-400" />
                                <h3 className="mt-2 text-sm font-semibold text-gray-900">
                                    No tasks found
                                </h3>
                                <p className="mt-1 text-sm text-gray-500">
                                    {searchQuery
                                        ? 'Try adjusting your search criteria.'
                                        : 'Get started by creating a new task.'}
                                </p>
                                {!searchQuery && (
                                    <div className="mt-6">
                                        <Link href="/admin/tasks/create">
                                            <Button>
                                                <Plus className="mr-2 h-4 w-4" />
                                                Create Task
                                            </Button>
                                        </Link>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Task</TableHead>
                                        <TableHead
                                            className="cursor-pointer select-none"
                                            onClick={() => handleSort('state')}
                                        >
                                            <div className="flex items-center gap-1">
                                                <span>State</span>
                                                {getSortIcon('state')}
                                            </div>
                                        </TableHead>
                                        <TableHead
                                            className="cursor-pointer select-none"
                                            onClick={() => handleSort('priority')}
                                        >
                                            <div className="flex items-center gap-1">
                                                <span>Priority</span>
                                                {getSortIcon('priority')}
                                            </div>
                                        </TableHead>
                                        <TableHead>Type</TableHead>
                                        <TableHead>Assigned To</TableHead>
                                        <TableHead
                                            className="cursor-pointer select-none"
                                            onClick={() => handleSort('due_at')}
                                        >
                                            <div className="flex items-center gap-1">
                                                <span>Due Date</span>
                                                {getSortIcon('due_at')}
                                            </div>
                                        </TableHead>
                                        <TableHead>Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredTasks.map((task) => {
                                        const isDeleted = !!task.deleted_at;
                                        return (
                                            <TableRow
                                                key={task.id}
                                                onClick={() =>
                                                    console.log(task)
                                                }
                                                className={
                                                    isDeleted
                                                        ? 'bg-muted/50 opacity-60'
                                                        : ''
                                                }
                                            >
                                                <TableCell>
                                                    <div>
                                                        <Link
                                                            href={`/admin/tasks/${task.id}`}
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
                                                        className={`${isDeleted ? 'opacity-60' : ''}`}
                                                        color={getStatusColor(
                                                            task.state,
                                                        )}
                                                    >
                                                        <div className="flex items-center gap-1 py-2">
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
                                                        className={`${isDeleted ? 'opacity-60' : ''}`}
                                                        color={
                                                            {
                                                                P1: 'red',
                                                                P2: 'orange',
                                                                P3: 'teal',
                                                                P4: 'cyan',
                                                            }[
                                                            task.sla_policy
                                                                ?.priority ||
                                                            'P4'
                                                            ]
                                                        }
                                                    >
                                                        <div className="flex items-center gap-1">
                                                            <AlertCircle className="mr-1 h-3 w-3" />
                                                            <span
                                                                className={`capitalize${isDeleted ? 'line-through' : ''}`}
                                                            >
                                                                {getPriorityCheck(
                                                                    task
                                                                        .sla_policy
                                                                        ?.priority,
                                                                )}
                                                            </span>
                                                        </div>
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
                                                    {task.assigned_users &&
                                                        task.assigned_users.length >
                                                        0 ? (
                                                        <div className="flex items-center gap-2">
                                                            <User className="h-4 w-4 text-muted-foreground" />
                                                            <span
                                                                className={`text-sm${isDeleted ? 'text-muted-foreground line-through' : ''}`}
                                                            >
                                                                {task.assigned_users
                                                                    .map(
                                                                        (
                                                                            user,
                                                                        ) =>
                                                                            user.name,
                                                                    )
                                                                    .join(', ')}
                                                            </span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-sm text-muted-foreground">
                                                            Unassigned
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
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger
                                                            asChild
                                                        >
                                                            <Button
                                                                variant="ghost"
                                                                className="h-8 w-8 p-0"
                                                            >
                                                                <span className="sr-only">
                                                                    Open menu
                                                                </span>
                                                                <EllipsisVertical />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuLabel>
                                                                Actions
                                                            </DropdownMenuLabel>
                                                            <DropdownMenuItem
                                                                asChild
                                                            >
                                                                <Link
                                                                    href={`/admin/tasks/${task.id}`}
                                                                >
                                                                    <PiEye className="mr-2 h-4 w-4" />
                                                                    View Details
                                                                </Link>
                                                            </DropdownMenuItem>
                                                            {!isDeleted && (
                                                                <>
                                                                    <DropdownMenuItem
                                                                        onClick={(
                                                                            e,
                                                                        ) => {
                                                                            e.stopPropagation();
                                                                            setSelectedTaskForAssignment(
                                                                                task.id,
                                                                            );
                                                                            setShowAssignmentModal(
                                                                                true,
                                                                            );
                                                                        }}
                                                                    >
                                                                        <UserPlus className="mr-2 h-4 w-4" />
                                                                        Assign
                                                                        Users
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuItem
                                                                        asChild
                                                                    >
                                                                        <Link
                                                                            href={`/admin/tasks/${task.id}/edit`}
                                                                        >
                                                                            <BiSolidEdit className="mr-2 h-4 w-4" />
                                                                            Edit
                                                                            Task
                                                                        </Link>
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuSeparator />
                                                                    <DropdownMenuItem
                                                                        className="text-red-600"
                                                                        onClick={() =>
                                                                            handleDeleteTask(
                                                                                task,
                                                                            )
                                                                        }
                                                                    >
                                                                        <FiTrash className="mr-2 h-4 w-4" />
                                                                        Delete
                                                                        Task
                                                                    </DropdownMenuItem>
                                                                </>
                                                            )}
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>

                {/* Pagination */}
                {tasksData.total > 0 && (
                    <div className="space-y-2">
                        <div>
                            <Select
                                value={perPage.toString()}
                                onValueChange={(value) => {
                                    loadTasksData({
                                        per_page: Number(value),
                                        page: 1,
                                    });
                                }}
                            >
                                <SelectTrigger className="w-42">
                                    <SelectValue placeholder="Per page" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="5">
                                        5 per page
                                    </SelectItem>
                                    <SelectItem value="10">
                                        10 per page
                                    </SelectItem>
                                    <SelectItem value="25">
                                        25 per page
                                    </SelectItem>
                                    <SelectItem value="50">
                                        50 per page
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="mt-4 flex items-center justify-between gap-4">
                            <div className="text-sm text-muted-foreground">
                                Showing {showingFrom} to {showingTo} of{' '}
                                {tasksData.total} tasks
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                                {tasksData.last_page > 1 &&
                                    tasksData.links.map((link, index) => (
                                        <Button
                                            key={index}
                                            variant={
                                                link.active
                                                    ? 'default'
                                                    : 'outline'
                                            }
                                            disabled={!link.url || link.active}
                                            onClick={() => {
                                                if (link.url) {
                                                    const url = new URL(
                                                        link.url,
                                                        window.location.origin,
                                                    );
                                                    const page = Number(
                                                        url.searchParams.get(
                                                            'page',
                                                        ) || '1',
                                                    );
                                                    loadTasksData({ page });
                                                }
                                            }}
                                        >
                                            <span
                                                dangerouslySetInnerHTML={{
                                                    __html: link.label,
                                                }}
                                            />
                                        </Button>
                                    ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
            <TaskAssignmentModal
                taskId={selectedTaskForAssignment}
                isOpen={showAssignmentModal}
                onClose={() => {
                    setShowAssignmentModal(false);
                    setSelectedTaskForAssignment(null);
                }}
                onAssignmentsUpdated={() => {
                    toast.success('Task assignments updated successfully');
                    loadTasksData({
                        page: tasksData.current_page,
                    });
                }}
            />
        </AppLayout>
    );
}
