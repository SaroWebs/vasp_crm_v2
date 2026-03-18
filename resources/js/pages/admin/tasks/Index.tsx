import AppLayout from '@/layouts/app-layout';
import { Task, type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import { format } from 'date-fns';
import {
    Plus,
    Search,
    Calendar,
    User,
    Building2,
    TicketIcon,
    AlertCircle,
    CheckCircle,
    Clock,
    XCircle,
    UserPlus,
    EllipsisVertical
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
import axios from 'axios';
import { BiSolidEdit } from 'react-icons/bi';
import { FiTrash } from 'react-icons/fi';
import { PiEye } from "react-icons/pi";
import { toast } from 'sonner';
import TaskAssignmentModal from '@/components/TaskAssignmentModal';
import { Badge } from '@mantine/core';

interface TasksIndexProps {
    tasks: {
        data: Task[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
        links: Array<{
            url: string | null;
            label: string;
            active: boolean;
        }>;
    };
    filters: {
        state?: string;
        assigned_to?: string;
        assigned_department_id?: string;
        search?: string;
    };
    users: Array<{ id: number; name: string }>;
    departments: Array<{ id: number; name: string }>;
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
  
    if(priority){
        return priority in map
          ? map[priority as keyof typeof map]
          : map.P4;
    }else{
        return map.P4;
    }
  };
  

export default function TasksIndex({
    tasks,
    filters = {},
    users,
    departments,
}: TasksIndexProps) {
    const [searchQuery, setSearchQuery] = useState(filters.search || '');
    const [isDeleting, setIsDeleting] = useState(false);
    const [selectedTaskForAssignment, setSelectedTaskForAssignment] = useState<number | null>(null);
    const [showAssignmentModal, setShowAssignmentModal] = useState(false);
    const filteredTasks = tasks.data;

    const stats = useMemo(() => {
        const allTasks: Task[] = tasks.data;
        return {
            total: allTasks.length,
            draft: allTasks.filter((t: Task) => t.state === 'Draft').length,
            assigned: allTasks.filter((t: Task) => t.state === 'Assigned')
                .length,
            inProgress: allTasks.filter((t: Task) => t.state === 'InProgress')
                .length,
            blocked: allTasks.filter((t: Task) => t.state === 'Blocked').length,
            inReview: allTasks.filter((t: Task) => t.state === 'InReview')
                .length,
            done: allTasks.filter((t: Task) => t.state === 'Done').length,
            cancelled: allTasks.filter((t: Task) => t.state === 'Cancelled')
                .length,
            rejected: allTasks.filter((t: Task) => t.state === 'Rejected')
                .length,
        };
    }, [tasks.data]);

    const handleFilterChange = (key: string, value: string) => {
        const params = new URLSearchParams(window.location.search);
        if (value && value !== 'all') {
            params.set(key, value);
        } else {
            params.delete(key);
        }
        // Reset to page 1 when filters change
        params.set('page', '1');
        router.get(`/admin/tasks?${params.toString()}`);
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        const params = new URLSearchParams(window.location.search);
        if (searchQuery.trim()) {
            params.set('search', searchQuery.trim());
        } else {
            params.delete('search');
        }
        // Reset to page 1 when search changes
        params.set('page', '1');
        router.get(`/admin/tasks?${params.toString()}`);
    };

    const handleDeleteTask = (task: any) => {
        if (
            confirm(
                'Are you sure you want to delete this task? It will be moved to trash and can be restored later.',
            )
        ) {
            setIsDeleting(true);
            axios
                .delete(`/admin/tasks/${task.id}`)
                .then((res) => {
                    const currentParams = window.location.search;
                    router.visit(`/admin/tasks${currentParams}`);
                })
                .catch((res) => {
                    console.log(res);
                })
                .finally(() => {
                    setIsDeleting(false);
                });
        }
    };

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
                    <Link href="/admin/tasks/create">
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Create Task
                        </Button>
                    </Link>
                </div>

                {/* Stats Cards */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Total Tasks
                            </CardTitle>
                            <TicketIcon className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {stats.total}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                All tasks in system
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Draft
                            </CardTitle>
                            <AlertCircle className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {stats.draft}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                New tasks being prepared
                            </p>
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
                                {stats.inProgress}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Currently being worked on
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Done
                            </CardTitle>
                            <CheckCircle className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {stats.done}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Completed tasks
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Filters and Search */}
                <Card>
                    <CardHeader>
                        <CardTitle>Filters</CardTitle>
                        <CardDescription>
                            Filter and search tasks by various criteria
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
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
                                    className="w-64"
                                />
                                <Button type="submit" variant="outline">
                                    <Search className="h-4 w-4" />
                                </Button>
                            </form>

                            <Select
                                value={filters.state || 'all'}
                                onValueChange={(value) =>
                                    handleFilterChange('state', value)
                                }
                            >
                                <SelectTrigger className="w-40">
                                    <SelectValue placeholder="State" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">
                                        All States
                                    </SelectItem>
                                    <SelectItem value="Draft">Draft</SelectItem>
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
                                    <SelectItem value="Done">Done</SelectItem>
                                    <SelectItem value="Cancelled">
                                        Cancelled
                                    </SelectItem>
                                    <SelectItem value="Rejected">
                                        Rejected
                                    </SelectItem>
                                </SelectContent>
                            </Select>

                            <Select
                                value={filters.assigned_to || 'all'}
                                onValueChange={(value) =>
                                    handleFilterChange('assigned_to', value)
                                }
                            >
                                <SelectTrigger className="w-48">
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
                                value={filters.assigned_department_id || 'all'}
                                onValueChange={(value) =>
                                    handleFilterChange(
                                        'assigned_department_id',
                                        value,
                                    )
                                }
                            >
                                <SelectTrigger className="w-48">
                                    <SelectValue placeholder="Department" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">
                                        All Departments
                                    </SelectItem>
                                    {departments.map((dept) => (
                                        <SelectItem
                                            key={dept.id}
                                            value={dept.id.toString()}
                                        >
                                            {dept.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>

                {/* Tasks Table */}
                <Card>
                    <CardHeader>
                        <CardTitle>All Tasks</CardTitle>
                        <CardDescription>
                            A list of all tasks in the system
                        </CardDescription>
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
                                        <TableHead>State</TableHead>
                                        <TableHead>Priority</TableHead>
                                        <TableHead>Type</TableHead>
                                        <TableHead>Assigned To</TableHead>
                                        <TableHead>Due Date</TableHead>
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
                                                        color={getStatusColor(task.state)}
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
                                                        color={({ P1: 'red', P2: 'orange', P3: 'teal', P4: 'cyan' })[task.sla_policy?.priority || 'P4']}
                                                    >
                                                        <div className="flex items-center gap-1">
                                                            <AlertCircle className="mr-1 h-3 w-3" />
                                                            <span
                                                                className={`capitalize${isDeleted ? 'line-through' : ''}`}
                                                            >
                                                                {getPriorityCheck(task.sla_policy?.priority)}
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
                                                    {task.assigned_users && task.assigned_users.length > 0 ? (
                                                        <div className="flex items-center gap-2">
                                                            <User className="h-4 w-4 text-muted-foreground" />
                                                            <span className={`text-sm${isDeleted ? ' text-muted-foreground line-through' : ''}`}>
                                                                {task.assigned_users.map(user => user.name).join(', ')}
                                                            </span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-sm text-muted-foreground">Unassigned</span>
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
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            setSelectedTaskForAssignment(task.id);
                                                                            setShowAssignmentModal(true);
                                                                        }}
                                                                    >
                                                                        <UserPlus className="mr-2 h-4 w-4" />
                                                                        Assign Users
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuItem asChild>
                                                                        <Link href={`/admin/tasks/${task.id}/edit`}>
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
                {tasks.last_page > 1 && (
                    <div className="flex justify-center mt-4">
                        <div className="flex items-center gap-2">
                            {tasks.links.map((link, index) => (
                                <Button
                                    key={index}
                                    variant={link.active ? 'default' : 'outline'}
                                    disabled={!link.url || link.active}
                                    onClick={() => {
                                        if (link.url) {
                                            router.visit(link.url);
                                        }
                                    }}
                                >
                                    <span dangerouslySetInnerHTML={{ __html: link.label }} />
                                </Button>
                            ))}
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
                }}
            />
        </AppLayout>
    );
}
