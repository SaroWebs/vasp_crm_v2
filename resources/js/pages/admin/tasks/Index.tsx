import ExportModal, {
    type ExportColumn,
    type ExportConfig,
    type ExportFilterConfig,
} from '@/components/admin/ExportModal';
import TaskAssignmentModal from '@/components/TaskAssignmentModal';
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
import { Skeleton } from '@/components/ui/skeleton';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import WizCardDesign1 from '@/components/wizards/WizCardDesign1';
import AppLayout from '@/layouts/app-layout';
import { Task, type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import {
    ActionIcon,
    Button,
    Badge as MantineBadge,
    Select as MantineSelect,
    Pagination,
    TextInput,
} from '@mantine/core';
import axios from 'axios';
import { format } from 'date-fns';
import {
    AlertCircle,
    Calendar,
    CheckCircle,
    Clock,
    Download,
    Edit,
    Eye,
    MoreHorizontal,
    Plus,
    Search,
    TicketIcon,
    Trash2,
    User,
    UserPlus,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
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
    pending: number;
    inprogress: number;
    completed: number;
}

interface TasksDataResponse {
    tasks: PaginatedTasks;
    stats: {
        total: number;
        pending: number;
        inprogress: number;
        completed: number;
    };
}

interface TasksIndexProps {
    filters: {
        status?: string;
        assigned_to?: string;
        search?: string;
        per_page?: string;
    };
    users: Array<{ id: number; name: string }>;
    userPermissions?: string[];
}

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

/**
 * Map task state to simplified status: pending, inprogress, completed
 */
const mapTaskStateToStatus = (
    state: string,
): 'pending' | 'inprogress' | 'completed' => {
    const pendingStates = ['Draft', 'Assigned', 'Blocked'];
    const inProgressStates = ['InProgress', 'InReview'];
    const completedStates = ['Done', 'Cancelled', 'Rejected'];

    if (pendingStates.includes(state)) return 'pending';
    if (inProgressStates.includes(state)) return 'inprogress';
    if (completedStates.includes(state)) return 'completed';

    return 'pending';
};

/**
 * Get badge config for task status
 */
const getTaskStatusBadge = (
    state: string,
): { label: string; icon: typeof Clock; color: string; bgColor: string } => {
    const status = mapTaskStateToStatus(state);

    const statusConfig: Record<
        'pending' | 'inprogress' | 'completed',
        { label: string; icon: typeof Clock; color: string; bgColor: string }
    > = {
        pending: {
            label: 'Pending',
            icon: Clock,
            color: 'text-gray-600',
            bgColor: 'bg-gray-50',
        },
        inprogress: {
            label: 'In Progress',
            icon: Clock,
            color: 'text-blue-600',
            bgColor: 'bg-blue-50',
        },
        completed: {
            label: 'Completed',
            icon: CheckCircle,
            color: 'text-green-600',
            bgColor: 'bg-green-50',
        },
    };

    return statusConfig[status];
};

/**
 * Get priority label from SLA policy
 */
const getPriorityLabel = (priority?: string): string => {
    const map = {
        P1: 'Critical',
        P2: 'High',
        P3: 'Medium',
        P4: 'Low',
    };

    if (priority) {
        return priority in map ? map[priority as keyof typeof map] : map.P4;
    }
    return map.P4;
};

/**
 * Get priority badge color
 */
const getPriorityColor = (
    priority?: string,
): 'red' | 'orange' | 'yellow' | 'gray' => {
    const colorMap = {
        P1: 'red',
        P2: 'orange',
        P3: 'yellow',
        P4: 'gray',
    } as const;

    if (priority && priority in colorMap) {
        return colorMap[priority as keyof typeof colorMap];
    }
    return 'gray';
};

const defaultExportColumns = [
    'task_code',
    'title',
    'ticket',
    'type',
    'priority',
    'state',
    'assigned_to',
    'due_at',
    'created_at',
];

const exportColumns: ExportColumn[] = [
    { key: 'task_code', label: 'Task Code' },
    { key: 'title', label: 'Title' },
    { key: 'ticket', label: 'Ticket' },
    { key: 'client', label: 'Client' },
    { key: 'description', label: 'Description' },
    { key: 'type', label: 'Task Type' },
    { key: 'priority', label: 'Priority' },
    { key: 'state', label: 'State' },
    { key: 'assigned_to', label: 'Assigned To' },
    { key: 'department', label: 'Department' },
    { key: 'start_at', label: 'Start At' },
    { key: 'due_at', label: 'Due At' },
    { key: 'completed_at', label: 'Completed At' },
    { key: 'estimate_hours', label: 'Estimate Hours' },
    { key: 'created_by', label: 'Created By' },
    { key: 'created_at', label: 'Created At' },
    { key: 'completion_notes', label: 'Completion Notes' },
];

const taskStateOptions = [
    { value: 'Draft', label: 'Draft' },
    { value: 'Assigned', label: 'Assigned' },
    { value: 'InProgress', label: 'In Progress' },
    { value: 'Blocked', label: 'Blocked' },
    { value: 'InReview', label: 'In Review' },
    { value: 'Done', label: 'Done' },
    { value: 'Cancelled', label: 'Cancelled' },
    { value: 'Rejected', label: 'Rejected' },
];

const exportFilterConfigs: ExportFilterConfig[] = [
    {
        key: 'priority',
        label: 'Priority',
        type: 'select',
        options: [
            { value: 'P1', label: 'P1 - Critical' },
            { value: 'P2', label: 'P2 - High' },
            { value: 'P3', label: 'P3 - Medium' },
            { value: 'P4', label: 'P4 - Low' },
        ],
    },
    {
        key: 'assigned_to',
        label: 'Assigned To',
        type: 'select',
    },
];

export default function TasksIndex({
    filters = {},
    users,
    userPermissions = [],
}: TasksIndexProps) {
    const [searchQuery, setSearchQuery] = useState(filters.search || '');
    const [statusFilter, setStatusFilter] = useState(filters.status || 'all');
    const [assignedToFilter, setAssignedToFilter] = useState(
        filters.assigned_to || 'all',
    );
    const [isLoading, setIsLoading] = useState(false);
    const [tasksData, setTasksData] = useState<PaginatedTasks>({
        data: [],
        current_page: 1,
        last_page: 1,
        per_page: 10,
        total: 0,
        from: 0,
        to: 0,
        links: [],
    });
    const [taskStats, setTaskStats] = useState<TaskOverviewStats>({
        total: 0,
        pending: 0,
        inprogress: 0,
        completed: 0,
    });
    const [selectedTaskForAssignment, setSelectedTaskForAssignment] = useState<
        number | null
    >(null);
    const [showAssignmentModal, setShowAssignmentModal] = useState(false);
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const canExportTasks = userPermissions.includes('task.export');

    const loadTasksData = useCallback(
        async (
            overrides: Partial<{
                status: string;
                assigned_to: string;
                search: string;
                page: number;
                per_page: number;
            }> = {},
        ) => {
            const nextStatus = overrides.status ?? statusFilter;
            const nextAssignedTo = overrides.assigned_to ?? assignedToFilter;
            const nextSearch = overrides.search ?? searchQuery;
            const nextPage = overrides.page ?? 1;
            const nextPerPage = overrides.per_page ?? 10;

            const requestParams: Record<string, string | number> = {
                per_page: nextPerPage,
            };

            if (nextStatus && nextStatus !== 'all') {
                requestParams.status = nextStatus;
            }

            if (nextAssignedTo && nextAssignedTo !== 'all') {
                requestParams.assigned_to = nextAssignedTo;
            }

            if (nextSearch && nextSearch.trim() !== '') {
                requestParams.search = nextSearch.trim();
            }

            if (nextPage) {
                requestParams.page = nextPage;
            }

            setIsLoading(true);

            try {
                const response = await axios.get('/admin/data/tasks', {
                    params: requestParams,
                });
                const responseData: TasksDataResponse = response.data;
                setTasksData(responseData.tasks);
                setTaskStats(responseData.stats);
                setStatusFilter(nextStatus);
                setAssignedToFilter(nextAssignedTo);
                setSearchQuery(nextSearch);
            } catch (error) {
                console.error('Error loading tasks data:', error);
            } finally {
                setIsLoading(false);
            }
        },
        [statusFilter, assignedToFilter, searchQuery],
    );

    const handleDeleteTask = (task: Task) => {
        if (
            confirm(
                'Are you sure you want to delete this task? It will be moved to trash and can be restored later.',
            )
        ) {
            axios
                .delete(`/admin/tasks/${task.id}`)
                .then(() => {
                    toast.success('Task deleted successfully');
                    loadTasksData({ page: tasksData.current_page });
                })
                .catch((err) => {
                    toast.error('Failed to delete task');
                    console.log(err);
                });
        }
    };

    const handlePageChange = (page: number) => {
        loadTasksData({ page });
    };

    const handleExport = async (config: ExportConfig) => {
        setIsExporting(true);
        try {
            const params: Record<string, string | string[]> = {
                start_date: config.startDate,
                end_date: config.endDate,
                states: config.statuses,
                columns: config.columns,
            };

            if (config.filters.priority) {
                params.priority = config.filters.priority;
            }
            if (
                config.filters.assigned_to &&
                config.filters.assigned_to !== 'all'
            ) {
                params.assigned_to = config.filters.assigned_to;
            }
            const response = await axios.get('/admin/tasks/export', {
                params,
                responseType: 'blob',
            });

            const contentDisposition = response.headers[
                'content-disposition'
            ] as string | undefined;
            const filenameMatch =
                contentDisposition?.match(/filename="?([^"]+)"?/i);
            const filename =
                filenameMatch?.[1] ??
                `tasks_${config.startDate}_to_${config.endDate}.csv`;

            const blob = new Blob([response.data], {
                type: 'text/csv;charset=utf-8;',
            });
            const downloadUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.setAttribute('download', filename);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(downloadUrl);

            toast.success('Tasks exported successfully');
            setIsExportModalOpen(false);
        } catch (error) {
            console.error('Error exporting tasks:', error);
            toast.error('Failed to export tasks');
        } finally {
            setIsExporting(false);
        }
    };

    useEffect(() => {
        loadTasksData();
    }, []);

    const wizCards = [
        {
            title: 'Total',
            text: 'All tasks',
            stats: taskStats.total,
            icon: TicketIcon,
            color: 'orange',
            link: '/admin/tasks',
        },
        {
            title: 'Pending',
            text: 'Waiting to start',
            stats: taskStats.pending,
            icon: Clock,
            color: 'blue',
            link: '/admin/tasks?status=pending',
        },
        {
            title: 'In Progress',
            text: 'Currently working',
            stats: taskStats.inprogress,
            icon: Clock,
            color: 'purple',
            link: '/admin/tasks?status=inprogress',
        },
        {
            title: 'Completed',
            text: 'Finished tasks',
            stats: taskStats.completed,
            icon: CheckCircle,
            color: 'green',
            link: '/admin/tasks?status=completed',
        },
    ] as const;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Tasks" />

            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto p-6">
                {/* Stats Cards */}
                <div className="grid gap-2 md:grid-cols-4">
                    {wizCards.map((card) => (
                        <WizCardDesign1 key={card.title} {...card} />
                    ))}
                </div>

                {/* Tasks Table */}
                <Card>
                    <CardHeader>
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <CardTitle>All Tasks</CardTitle>
                                <CardDescription>
                                    {tasksData.total} task
                                    {tasksData.total !== 1 ? 's' : ''} in the system
                                </CardDescription>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">

                                <TextInput
                                    placeholder="Search tasks..."
                                    value={searchQuery}
                                    onChange={(e) =>
                                        setSearchQuery(e.target.value)
                                    }
                                    leftSection={<Search size={14} />}
                                    size="xs"
                                    w={180}
                                    rightSection={
                                        isLoading ? (
                                            <span className="animate-spin text-xs">
                                                ⏳
                                            </span>
                                        ) : undefined
                                    }
                                />
                                <MantineSelect
                                    placeholder="All Users"
                                    value={
                                        assignedToFilter === 'all'
                                            ? null
                                            : assignedToFilter
                                    }
                                    onChange={(val) => {
                                        const next = val ?? 'all';
                                        setAssignedToFilter(next);
                                        loadTasksData({
                                            assigned_to: next,
                                            page: 1,
                                        });
                                    }}
                                    data={[
                                        { value: 'all', label: 'All Users' },
                                        ...users.map((u) => ({
                                            value: u.id.toString(),
                                            label: u.name,
                                        })),
                                    ]}
                                    size="xs"
                                    w={160}
                                    clearable
                                    searchable
                                />
                                <MantineSelect
                                    placeholder="All Statuses"
                                    value={
                                        statusFilter === 'all'
                                            ? null
                                            : statusFilter
                                    }
                                    onChange={(val) => {
                                        const next = val ?? 'all';
                                        setStatusFilter(next);
                                        loadTasksData({
                                            status: next,
                                            page: 1,
                                        });
                                    }}
                                    data={[
                                        { value: 'all', label: 'All Statuses' },
                                        { value: 'pending', label: 'Pending' },
                                        {
                                            value: 'inprogress',
                                            label: 'In Progress',
                                        },
                                        {
                                            value: 'completed',
                                            label: 'Completed',
                                        },
                                    ]}
                                    size="xs"
                                    w={140}
                                    clearable
                                />
                                <Link href="/admin/tasks/create">
                                    <Button variant="outline" size="xs">
                                        <Plus className="mr-1 h-3 w-3" />
                                        Create Task
                                    </Button>
                                </Link>
                                <Button
                                    variant="outline"
                                    size="xs"
                                    onClick={() =>
                                        setIsExportModalOpen(true)
                                    }
                                    leftSection={<Download size={14} />}
                                >
                                    Export
                                </Button>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="space-y-4">
                                {Array.from({ length: 5 }).map((_, i) => (
                                    <div
                                        key={i}
                                        className="flex items-center space-x-4"
                                    >
                                        <Skeleton className="h-12 w-12 rounded-full" />
                                        <div className="flex-1 space-y-2">
                                            <Skeleton className="h-4 w-3/4" />
                                            <Skeleton className="h-4 w-1/2" />
                                        </div>
                                        <Skeleton className="h-6 w-20" />
                                    </div>
                                ))}
                            </div>
                        ) : (tasksData.data.length === 0) ? (
                            <div className="py-8 text-center">
                                <TicketIcon className="mx-auto h-12 w-12 text-gray-400" />
                                <h3 className="mt-2 text-sm font-semibold text-gray-900">
                                    No tasks found
                                </h3>
                                <p className="mt-1 text-sm text-gray-500">
                                    {searchQuery ||
                                        statusFilter !== 'all' ||
                                        assignedToFilter !== 'all'
                                        ? 'Try adjusting your search criteria'
                                        : 'Get started by creating a new task'}
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Task</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Priority</TableHead>
                                            <TableHead>Type</TableHead>
                                            <TableHead>Assigned To</TableHead>
                                            <TableHead>Due Date</TableHead>
                                            <TableHead className="text-right">
                                                Actions
                                            </TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {tasksData.data.map((task) => {
                                            const isDeleted = !!task.deleted_at;
                                            const canManageTask =
                                                !!task.can_manage_task;
                                            const statusConfig =
                                                getTaskStatusBadge(task.state);
                                            const StatusIcon =
                                                statusConfig.icon;

                                            return (
                                                <TableRow
                                                    key={task.id}
                                                    className={`${isDeleted ? 'bg-gray-50 opacity-60' : ''}`}
                                                >
                                                    <TableCell>
                                                        <div className="space-y-1">
                                                            <div className="flex items-center gap-2">
                                                                {isDeleted && (
                                                                    <Trash2 className="h-4 w-4 text-gray-400" />
                                                                )}
                                                                <Link
                                                                    href={`/admin/tasks/${task.id}`}
                                                                    className={
                                                                        isDeleted
                                                                            ? 'pointer-events-none'
                                                                            : ''
                                                                    }
                                                                    tabIndex={
                                                                        isDeleted
                                                                            ? -1
                                                                            : undefined
                                                                    }
                                                                >
                                                                    <p
                                                                        className={`text-sm leading-none font-medium ${isDeleted
                                                                                ? 'text-muted-foreground line-through'
                                                                                : ''
                                                                            }`}
                                                                    >
                                                                        {task.title ||
                                                                            `Task #${task.id}`}
                                                                    </p>
                                                                </Link>
                                                            </div>
                                                            <p className="text-sm text-muted-foreground">
                                                                {task.task_code ||
                                                                    `#${task.id}`}
                                                            </p>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <MantineBadge
                                                            className={`${isDeleted
                                                                    ? 'opacity-60'
                                                                    : ''
                                                                }`}
                                                            color={
                                                                mapTaskStateToStatus(
                                                                    task.state,
                                                                ) === 'pending'
                                                                    ? 'gray'
                                                                    : mapTaskStateToStatus(
                                                                        task.state,
                                                                    ) ===
                                                                        'inprogress'
                                                                        ? 'blue'
                                                                        : 'green'
                                                            }
                                                            leftSection={
                                                                <StatusIcon className="h-3 w-3" />
                                                            }
                                                        >
                                                            <div
                                                                className={`capitalize ${isDeleted
                                                                        ? 'line-through'
                                                                        : ''
                                                                    }`}
                                                            >
                                                                {
                                                                    statusConfig.label
                                                                }
                                                            </div>
                                                        </MantineBadge>
                                                    </TableCell>
                                                    <TableCell>
                                                        <MantineBadge
                                                            className={`${isDeleted
                                                                    ? 'opacity-60'
                                                                    : ''
                                                                }`}
                                                            color={getPriorityColor(
                                                                task.sla_policy
                                                                    ?.priority,
                                                            )}
                                                        >
                                                            <div className="flex items-center gap-1">
                                                                <AlertCircle className="h-3 w-3" />
                                                                <span
                                                                    className={`capitalize ${isDeleted
                                                                            ? 'line-through'
                                                                            : ''
                                                                        }`}
                                                                >
                                                                    {getPriorityLabel(
                                                                        task
                                                                            .sla_policy
                                                                            ?.priority,
                                                                    )}
                                                                </span>
                                                            </div>
                                                        </MantineBadge>
                                                    </TableCell>
                                                    <TableCell>
                                                        {task.task_type ? (
                                                            <div className="flex items-center gap-2">
                                                                <span
                                                                    className={`text-sm ${isDeleted
                                                                            ? 'text-muted-foreground line-through'
                                                                            : ''
                                                                        }`}
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
                                                            task.assigned_users
                                                                .length > 0 ? (
                                                            <div className="flex items-center gap-2">
                                                                <User className="h-4 w-4 text-muted-foreground" />
                                                                <span
                                                                    className={`text-sm ${isDeleted
                                                                            ? 'text-muted-foreground line-through'
                                                                            : ''
                                                                        }`}
                                                                >
                                                                    {task.assigned_users
                                                                        .map(
                                                                            (
                                                                                user,
                                                                            ) =>
                                                                                user.name,
                                                                        )
                                                                        .join(
                                                                            ', ',
                                                                        )}
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
                                                                    className={`text-sm ${isDeleted
                                                                            ? 'text-muted-foreground line-through'
                                                                            : ''
                                                                        }`}
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
                                                        <div className="flex items-center justify-end gap-2">
                                                            <DropdownMenu>
                                                                <DropdownMenuTrigger
                                                                    asChild
                                                                >
                                                                    <ActionIcon
                                                                        size={
                                                                            42
                                                                        }
                                                                        variant="default"
                                                                        aria-label="More"
                                                                    >
                                                                        <MoreHorizontal
                                                                            size={
                                                                                14
                                                                            }
                                                                        />
                                                                    </ActionIcon>
                                                                </DropdownMenuTrigger>
                                                                <DropdownMenuContent
                                                                    align="end"
                                                                    className="w-48"
                                                                >
                                                                    <DropdownMenuLabel>
                                                                        Actions
                                                                    </DropdownMenuLabel>
                                                                    <DropdownMenuSeparator />

                                                                    <DropdownMenuItem
                                                                        asChild
                                                                    >
                                                                        <Link
                                                                            href={`/admin/tasks/${task.id}`}
                                                                            className="flex cursor-pointer items-center gap-2"
                                                                        >
                                                                            <Eye className="h-4 w-4" />
                                                                            View
                                                                            Details
                                                                        </Link>
                                                                    </DropdownMenuItem>

                                                                    {!isDeleted && (
                                                                        <>
                                                                            <DropdownMenuItem
                                                                                onClick={() => {
                                                                                    setShowAssignmentModal(
                                                                                        true,
                                                                                    );
                                                                                    setSelectedTaskForAssignment(
                                                                                        task.id,
                                                                                    );
                                                                                }}
                                                                                className="flex cursor-pointer items-center gap-2"
                                                                            >
                                                                                <UserPlus className="h-4 w-4" />
                                                                                Assign
                                                                                Users
                                                                            </DropdownMenuItem>

                                                                            {canManageTask ? (
                                                                                <>
                                                                                    <DropdownMenuItem
                                                                                        asChild
                                                                                    >
                                                                                        <Link
                                                                                            href={`/admin/tasks/${task.id}/edit`}
                                                                                            className="flex cursor-pointer items-center gap-2"
                                                                                        >
                                                                                            <Edit className="h-4 w-4" />
                                                                                            Edit
                                                                                            Task
                                                                                        </Link>
                                                                                    </DropdownMenuItem>
                                                                                    <DropdownMenuSeparator />
                                                                                    <DropdownMenuItem
                                                                                        className="flex cursor-pointer items-center gap-2 text-red-600"
                                                                                        onClick={() =>
                                                                                            handleDeleteTask(
                                                                                                task,
                                                                                            )
                                                                                        }
                                                                                    >
                                                                                        <Trash2 className="h-4 w-4" />
                                                                                        Delete
                                                                                        Task
                                                                                    </DropdownMenuItem>
                                                                                </>
                                                                            ) : null}
                                                                        </>
                                                                    )}
                                                                </DropdownMenuContent>
                                                            </DropdownMenu>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Pagination */}
                {tasksData.total > 0 && (
                    <div className="mt-4 flex items-center justify-between gap-4">
                        <div className="text-sm text-muted-foreground">
                            Showing {tasksData.from || 0} to {tasksData.to || 0}{' '}
                            of {tasksData.total} tasks
                        </div>
                        <Pagination
                            total={tasksData.last_page}
                            value={tasksData.current_page}
                            siblings={1}
                            boundaries={1}
                            onChange={handlePageChange}
                        />
                    </div>
                )}
            </div>
            {selectedTaskForAssignment && (
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
            )}

            <ExportModal
                key={`${assignedToFilter}-${statusFilter}`}
                opened={isExportModalOpen}
                onClose={() => setIsExportModalOpen(false)}
                onExport={handleExport}
                title="Export Tasks"
                availableColumns={exportColumns}
                defaultColumns={defaultExportColumns}
                filterConfigs={exportFilterConfigs.map((filter) =>
                    filter.key === 'assigned_to'
                        ? {
                            ...filter,
                            options: users.map((user) => ({
                                value: user.id.toString(),
                                label: user.name,
                            })),
                        }
                        : filter,
                )}
                statusOptions={taskStateOptions}
                statusLabel="Task states"
                initialStatuses={
                    statusFilter === 'pending'
                        ? ['Draft', 'Assigned', 'Blocked']
                        : statusFilter === 'inprogress'
                            ? ['InProgress', 'InReview']
                            : statusFilter === 'completed'
                                ? ['Done', 'Cancelled', 'Rejected']
                                : taskStateOptions.map((state) => state.value)
                }
                initialFilters={{
                    assigned_to:
                        assignedToFilter !== 'all' ? assignedToFilter : '',
                    priority: '',
                }}
                isExporting={isExporting}
            />
        </AppLayout>
    );
}
