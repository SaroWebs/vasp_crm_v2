import TaskAssignmentModal from '@/components/TaskAssignmentModal';
import TaskComments from '@/components/tasks/task-comments';
import { TaskFileAttachment } from '@/components/tasks/TaskFileAttachment';
import { TaskMetrics } from '@/components/tasks/TaskMetrics';
import { TaskMilestones } from '@/components/tasks/TaskMilestones';
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
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import AppLayout from '@/layouts/app-layout';
import { Task, type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import axios from 'axios';
import { format } from 'date-fns';
import {
    AlertCircle,
    ArrowLeft,
    Building2,
    Calendar,
    CalendarPlus,
    CheckCircle,
    Clock,
    Clock3,
    Edit,
    FileText,
    RotateCcw,
    Target,
    TicketIcon,
    Trash,
    UserIcon,
    UserPlus,
    XCircle,
} from 'lucide-react';
import { useState } from 'react';

interface TasksShowProps {
    task: Task;
    authUser?: {
        id: number;
        is_super_admin: boolean;
    };
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
    {
        title: 'Task Details',
        href: '#',
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

const getStatusColor = (status: Task['state']) => {
    switch (status) {
        case 'Done':
            return 'bg-green-100 text-green-800 border-green-200';
        case 'InProgress':
            return 'bg-blue-100 text-blue-800 border-blue-200';
        case 'Draft':
            return 'bg-gray-100 text-gray-800 border-gray-200';
        case 'Cancelled':
        case 'Rejected':
            return 'bg-red-100 text-red-800 border-red-200';
        case 'Blocked':
            return 'bg-purple-100 text-purple-800 border-purple-200';
        case 'InReview':
            return 'bg-yellow-100 text-yellow-800 border-yellow-200';
        case 'Assigned':
            return 'bg-indigo-100 text-indigo-800 border-indigo-200';
        default:
            return 'bg-gray-100 text-gray-800 border-gray-200';
    }
};

const getStatusIcon = (status: Task['state']) => {
    switch (status) {
        case 'Done':
            return <CheckCircle className="h-4 w-4" />;
        case 'InProgress':
            return <Clock className="h-4 w-4" />;
        case 'Draft':
            return <AlertCircle className="h-4 w-4" />;
        case 'Cancelled':
        case 'Rejected':
            return <XCircle className="h-4 w-4" />;
        case 'Blocked':
            return <XCircle className="h-4 w-4" />;
        case 'InReview':
            return <Clock3 className="h-4 w-4" />;
        case 'Assigned':
            return <UserIcon className="h-4 w-4" />;
        default:
            return <XCircle className="h-4 w-4" />;
    }
};

export default function Show({ task, authUser }: TasksShowProps) {
    console.log(task);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isRestoring, setIsRestoring] = useState(false);
    const [isForceDeleting, setIsForceDeleting] = useState(false);
    const [isAssignmentModalOpen, setIsAssignmentModalOpen] = useState(false);
    const [isExtendDueDateOpen, setIsExtendDueDateOpen] = useState(false);
    const [newDueDate, setNewDueDate] = useState<string>('');
    const [isExtending, setIsExtending] = useState(false);

    // Local task state to reflect updates
    const [localTask, setLocalTask] = useState(task);

    const isDeleted = task.deleted_at;

    // Determine if current user is the task creator (own task)
    const isOwnTask =
        task.created_by?.id === authUser?.id ||
        task.createdBy?.id === authUser?.id;
    const isSuperAdmin = authUser?.is_super_admin ?? false;

    // Define valid state transitions based on current task state
    const getValidStateTransitions = (
        currentState: Task['state'],
    ): Task['state'][] => {
        switch (currentState) {
            case 'Draft':
                return ['Assigned', 'Blocked', 'Cancelled', 'Rejected'];
            case 'Assigned':
                return [
                    'InProgress',
                    'Blocked',
                    'Cancelled',
                    'Rejected',
                    'Draft',
                ];
            case 'InProgress':
                return [
                    'InReview',
                    'Blocked',
                    'Cancelled',
                    'Rejected',
                    'Assigned',
                ];
            case 'InReview':
                return [
                    'Done',
                    'Blocked',
                    'Cancelled',
                    'Rejected',
                    'InProgress',
                ];
            case 'Done':
                return ['InReview', 'Cancelled', 'Rejected'];
            case 'Blocked':
                return [
                    'Assigned',
                    'InProgress',
                    'Cancelled',
                    'Rejected',
                    'Draft',
                ];
            case 'Cancelled':
                return ['Draft', 'Assigned'];
            case 'Rejected':
                return ['Draft', 'Assigned'];
            default:
                return [];
        }
    };

    const handleDeleteTask = () => {
        if (isDeleted) {
            if (
                confirm(
                    'This task is already deleted. Do you want to permanently delete it? This action cannot be undone.',
                )
            ) {
                setIsForceDeleting(true);
                axios
                    .delete(`/admin/tasks/${task.id}/force-delete`)
                    .then((res) => {
                        console.log(res);
                        router.visit('/admin/tasks');
                    })
                    .catch((res) => {
                        console.log(res);
                    })
                    .finally(() => {
                        setIsForceDeleting(false);
                    });
            }
        } else {
            if (
                confirm(
                    'Are you sure you want to delete this task? It will be moved to trash and can be restored later.',
                )
            ) {
                setIsDeleting(true);
                axios
                    .delete(`/admin/tasks/${task.id}`)
                    .then((res) => {
                        router.visit('/admin/tasks');
                    })
                    .catch((res) => {
                        console.log(res);
                    })
                    .finally(() => {
                        setIsDeleting(false);
                    });
            }
        }
    };

    const handleRestoreTask = () => {
        if (confirm('Are you sure you want to restore this task?')) {
            setIsRestoring(true);

            axios
                .post(`/admin/tasks/${task.id}/restore`)
                .then((res) => {
                    console.log(res);
                    router.visit(`/admin/tasks/${task.id}`);
                })
                .catch((err) => {
                    console.log(err);
                })
                .finally(() => {
                    setIsRestoring(false);
                });
        }
    };

    const handleExtendDueDate = () => {
        if (!newDueDate) {
            alert('Please select a new due date');
            return;
        }

        setIsExtending(true);
        axios
            .patch(`/data/tasks/${task.id}/extend-due-date`, {
                due_at: newDueDate,
            })
            .then((res) => {
                console.log(res);
                setLocalTask((prev: Task) => ({
                    ...prev,
                    due_at: newDueDate,
                    is_overdue: false,
                    overdue_time: null,
                }));
                setIsExtendDueDateOpen(false);
                setNewDueDate('');
            })
            .catch((err) => {
                console.error(err);
                alert(
                    err.response?.data?.message || 'Failed to extend due date',
                );
            })
            .finally(() => {
                setIsExtending(false);
            });
    };

    const handleStatusChange = (newStatus: Task['state']) => {
        axios
            .patch(`/admin/tasks/${task.id}/status`, { state: newStatus })
            .then((res) => {
                console.log(res);
                router.visit(`/admin/tasks/${task.id}`);
            })
            .catch((err) => {
                console.log(err);
            });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Task ${task.task_code || task.id}`} />

            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto p-6">
                {/* Header */}
                <Link href="/admin/tasks">
                    <Button variant="outline" size="sm">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Tasks
                    </Button>
                </Link>
                <div className="flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl font-bold tracking-tight">
                                {task.title || `Task #${task.id}`}
                            </h1>
                            {isDeleted && (
                                <Badge
                                    variant="destructive"
                                    className="text-xs"
                                >
                                    <Trash className="mr-1 h-3 w-3" />
                                    Deleted
                                </Badge>
                            )}
                        </div>
                        <p className="text-muted-foreground">
                            Task {task.task_code && `• ${task.task_code}`} •
                            Created{' '}
                            {format(new Date(task.created_at), 'MMM dd, yyyy')}
                            {isDeleted &&
                                task.deleted_at &&
                                ` • Deleted ${format(new Date(task.deleted_at), 'MMM dd, yyyy')}`}
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        {!isDeleted && (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" size="sm">
                                        <Target className="mr-2 h-4 w-4" />
                                        Change State
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuLabel>
                                        Update State
                                    </DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    {getValidStateTransitions(task.state).map(
                                        (newState) => (
                                            <DropdownMenuItem
                                                key={newState}
                                                onClick={() =>
                                                    handleStatusChange(newState)
                                                }
                                            >
                                                {getStatusIcon(newState)}
                                                <span className="ml-2 capitalize">
                                                    {newState === 'InProgress'
                                                        ? 'Mark as In Progress'
                                                        : newState ===
                                                            'InReview'
                                                          ? 'Mark as In Review'
                                                          : `Mark as ${newState}`}
                                                </span>
                                            </DropdownMenuItem>
                                        ),
                                    )}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        )}

                        {isDeleted && (
                            <Button
                                onClick={handleRestoreTask}
                                disabled={isRestoring}
                                className="bg-green-600 hover:bg-green-700"
                            >
                                <RotateCcw className="mr-2 h-4 w-4" />
                                {isRestoring ? 'Restoring...' : 'Restore Task'}
                            </Button>
                        )}

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="24"
                                        height="24"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        className="h-4 w-4"
                                    >
                                        <circle cx="12" cy="12" r="1" />
                                        <circle cx="12" cy="5" r="1" />
                                        <circle cx="12" cy="19" r="1" />
                                    </svg>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuLabel>
                                    Task Actions
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                {!isDeleted && (
                                    <DropdownMenuItem
                                        className="text-blue-600"
                                        onClick={() =>
                                            setIsAssignmentModalOpen(true)
                                        }
                                        disabled={isDeleting || isForceDeleting}
                                    >
                                        <UserPlus className="mr-2 h-4 w-4" />
                                        Manage Assignments
                                    </DropdownMenuItem>
                                )}
                                {!isDeleted && (
                                    <DropdownMenuItem asChild>
                                        <Link
                                            href={`/admin/tasks/${task.id}/edit`}
                                        >
                                            <Edit className="mr-2 h-4 w-4" />
                                            Edit Task
                                        </Link>
                                    </DropdownMenuItem>
                                )}
                                <DropdownMenuItem
                                    className="text-red-600"
                                    onClick={handleDeleteTask}
                                    disabled={isDeleting || isForceDeleting}
                                >
                                    <Trash className="mr-2 h-4 w-4" />
                                    {isDeleted
                                        ? isForceDeleting
                                            ? 'Force Deleting...'
                                            : 'Force Delete'
                                        : isDeleting
                                          ? 'Deleting...'
                                          : 'Delete Task'}
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-3">
                    {/* Task Overview */}
                    <div className="space-y-6 lg:col-span-2">
                        {/* Task Details */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center justify-between">
                                    <span>Task Overview</span>
                                    <div className="flex items-center space-x-2">
                                        <Badge
                                            className={getStatusColor(
                                                task.state,
                                            )}
                                        >
                                            <div className="flex items-center gap-1">
                                                {getStatusIcon(task.state)}
                                                <span className="capitalize">
                                                    {task.state.replace(
                                                        '-',
                                                        ' ',
                                                    )}
                                                </span>
                                            </div>
                                        </Badge>
                                        <Badge
                                            className={getPriorityColor(
                                                task.sla_policy?.priority ||
                                                    'P2',
                                            )}
                                        >
                                            <AlertCircle className="mr-1 h-3 w-3" />
                                            <span className="capitalize">
                                                {task.sla_policy?.priority ||
                                                    'P2'}
                                            </span>
                                        </Badge>
                                    </div>
                                </CardTitle>
                            </CardHeader>

                            <CardContent className="space-y-6">
                                {/* Task Description */}
                                <div>
                                    <h4 className="mb-2 text-sm font-medium">
                                        Description
                                    </h4>
                                    <div className="text-sm text-muted-foreground">
                                        {task.description ? (
                                            <div className="whitespace-pre-wrap">
                                                {task.description}
                                            </div>
                                        ) : (
                                            <span>No description provided</span>
                                        )}
                                    </div>
                                </div>
                                <Separator />
                                {/* Basic Information */}
                                <div>
                                    <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold">
                                        <FileText className="h-4 w-4 text-muted-foreground" />
                                        Basic Information
                                    </h4>
                                    <div className="grid gap-4 md:grid-cols-2">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                <TicketIcon className="h-4 w-4" />
                                                <span>Associated Ticket</span>
                                            </div>
                                            <div className="text-sm font-medium">
                                                {task.ticket ? (
                                                    <div className="space-y-1">
                                                        <Link
                                                            href={`/admin/tickets/${task.ticket.id}`}
                                                            className="text-blue-600 hover:underline"
                                                        >
                                                            {
                                                                task.ticket
                                                                    .ticket_number
                                                            }{' '}
                                                            -{' '}
                                                            {task.ticket.title}
                                                        </Link>
                                                        {task.ticket.client
                                                            ?.name && (
                                                            <p className="text-xs font-normal text-muted-foreground">
                                                                Client:{' '}
                                                                {
                                                                    task.ticket
                                                                        .client
                                                                        .name
                                                                }
                                                            </p>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <span className="text-muted-foreground">
                                                        Not associated
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="my-4 grid gap-4 md:grid-cols-3">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                <Calendar className="h-4 w-4" />
                                                <span>Start Date</span>
                                            </div>
                                            <div className="text-sm font-medium">
                                                {localTask.start_at ? (
                                                    <div className="flex flex-col gap-2">
                                                        <div className="flex items-center gap-2">
                                                            <span>
                                                                {format(
                                                                    new Date(
                                                                        localTask.start_at,
                                                                    ),
                                                                    'MMM dd, yyyy',
                                                                )}
                                                            </span>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <span className="text-muted-foreground">
                                                        No start date
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                <Calendar className="h-4 w-4" />
                                                <span>Due Date</span>
                                            </div>
                                            <div className="text-sm font-medium">
                                                {localTask.due_at ? (
                                                    <div className="flex flex-col gap-2">
                                                        <div className="flex items-center gap-2">
                                                            <span>
                                                                {format(
                                                                    new Date(
                                                                        localTask.due_at,
                                                                    ),
                                                                    'MMM dd, yyyy',
                                                                )}
                                                            </span>
                                                            {localTask.is_overdue &&
                                                                localTask.overdue_time && (
                                                                    <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800">
                                                                        Overdue
                                                                        by{' '}
                                                                        {
                                                                            localTask.overdue_time
                                                                        }
                                                                    </span>
                                                                )}
                                                        </div>
                                                        {!localTask.is_overdue &&
                                                            localTask.state !==
                                                                'Done' && (
                                                                <Dialog
                                                                    open={
                                                                        isExtendDueDateOpen
                                                                    }
                                                                    onOpenChange={
                                                                        setIsExtendDueDateOpen
                                                                    }
                                                                >
                                                                    <DialogTrigger
                                                                        asChild
                                                                    >
                                                                        <Button
                                                                            variant="outline"
                                                                            size="sm"
                                                                            className="h-7 w-fit text-xs"
                                                                        >
                                                                            <CalendarPlus className="mr-1 h-3 w-3" />
                                                                            Extend
                                                                            Due
                                                                            Date
                                                                        </Button>
                                                                    </DialogTrigger>
                                                                    <DialogContent className="sm:max-w-[400px]">
                                                                        <DialogHeader>
                                                                            <DialogTitle>
                                                                                Extend
                                                                                Due
                                                                                Date
                                                                            </DialogTitle>
                                                                            <DialogDescription>
                                                                                Set
                                                                                a
                                                                                new
                                                                                due
                                                                                date
                                                                                for
                                                                                this
                                                                                task.
                                                                            </DialogDescription>
                                                                        </DialogHeader>
                                                                        <div className="grid gap-4 py-4">
                                                                            <div className="grid gap-2">
                                                                                <Label htmlFor="new-due-date">
                                                                                    New
                                                                                    Due
                                                                                    Date
                                                                                </Label>
                                                                                <Input
                                                                                    id="new-due-date"
                                                                                    type="datetime-local"
                                                                                    value={
                                                                                        newDueDate
                                                                                    }
                                                                                    onChange={(
                                                                                        e,
                                                                                    ) =>
                                                                                        setNewDueDate(
                                                                                            e
                                                                                                .target
                                                                                                .value,
                                                                                        )
                                                                                    }
                                                                                    min={format(
                                                                                        new Date(),
                                                                                        "yyyy-MM-dd'T'HH:mm",
                                                                                    )}
                                                                                />
                                                                            </div>
                                                                        </div>
                                                                        <DialogFooter>
                                                                            <Button
                                                                                variant="outline"
                                                                                onClick={() =>
                                                                                    setIsExtendDueDateOpen(
                                                                                        false,
                                                                                    )
                                                                                }
                                                                            >
                                                                                Cancel
                                                                            </Button>
                                                                            <Button
                                                                                onClick={
                                                                                    handleExtendDueDate
                                                                                }
                                                                                disabled={
                                                                                    isExtending
                                                                                }
                                                                            >
                                                                                {isExtending
                                                                                    ? 'Extending...'
                                                                                    : 'Extend Due Date'}
                                                                            </Button>
                                                                        </DialogFooter>
                                                                    </DialogContent>
                                                                </Dialog>
                                                            )}
                                                    </div>
                                                ) : (
                                                    <div className="flex flex-col gap-2">
                                                        <span className="text-muted-foreground">
                                                            No due date
                                                        </span>
                                                        {localTask.state !==
                                                            'Done' && (
                                                            <Dialog
                                                                open={
                                                                    isExtendDueDateOpen
                                                                }
                                                                onOpenChange={
                                                                    setIsExtendDueDateOpen
                                                                }
                                                            >
                                                                <DialogTrigger
                                                                    asChild
                                                                >
                                                                    <Button
                                                                        variant="outline"
                                                                        size="sm"
                                                                        className="h-7 w-fit text-xs"
                                                                    >
                                                                        <CalendarPlus className="mr-1 h-3 w-3" />
                                                                        Set Due
                                                                        Date
                                                                    </Button>
                                                                </DialogTrigger>
                                                                <DialogContent className="sm:max-w-[400px]">
                                                                    <DialogHeader>
                                                                        <DialogTitle>
                                                                            Set
                                                                            Due
                                                                            Date
                                                                        </DialogTitle>
                                                                        <DialogDescription>
                                                                            Set
                                                                            a
                                                                            due
                                                                            date
                                                                            for
                                                                            this
                                                                            task.
                                                                        </DialogDescription>
                                                                    </DialogHeader>
                                                                    <div className="grid gap-4 py-4">
                                                                        <div className="grid gap-2">
                                                                            <Label htmlFor="new-due-date">
                                                                                Due
                                                                                Date
                                                                            </Label>
                                                                            <Input
                                                                                id="new-due-date"
                                                                                type="datetime-local"
                                                                                value={
                                                                                    newDueDate
                                                                                }
                                                                                onChange={(
                                                                                    e,
                                                                                ) =>
                                                                                    setNewDueDate(
                                                                                        e
                                                                                            .target
                                                                                            .value,
                                                                                    )
                                                                                }
                                                                                min={format(
                                                                                    new Date(),
                                                                                    "yyyy-MM-dd'T'HH:mm",
                                                                                )}
                                                                            />
                                                                        </div>
                                                                    </div>
                                                                    <DialogFooter>
                                                                        <Button
                                                                            variant="outline"
                                                                            onClick={() =>
                                                                                setIsExtendDueDateOpen(
                                                                                    false,
                                                                                )
                                                                            }
                                                                        >
                                                                            Cancel
                                                                        </Button>
                                                                        <Button
                                                                            onClick={
                                                                                handleExtendDueDate
                                                                            }
                                                                            disabled={
                                                                                isExtending
                                                                            }
                                                                        >
                                                                            {isExtending
                                                                                ? 'Setting...'
                                                                                : 'Set Due Date'}
                                                                        </Button>
                                                                    </DialogFooter>
                                                                </DialogContent>
                                                            </Dialog>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                <Clock3 className="h-4 w-4" />
                                                <span>Estimated Time</span>
                                            </div>
                                            <div className="text-sm font-medium">
                                                {task.estimate_hours ? (
                                                    `${task.estimate_hours} hours`
                                                ) : (
                                                    <span className="text-muted-foreground">
                                                        Not estimated
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <Separator />

                                {/* People & Assignment */}
                                <div>
                                    <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold">
                                        <UserIcon className="h-4 w-4 text-muted-foreground" />
                                        People & Assignment
                                    </h4>
                                    <div className="grid gap-4 md:grid-cols-2">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                <UserIcon className="h-4 w-4" />
                                                <span>Created By</span>
                                            </div>
                                            <div className="text-sm font-medium">
                                                {task.created_by ? (
                                                    task.created_by.name
                                                ) : (
                                                    <span className="text-muted-foreground">
                                                        Unknown
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                <UserIcon className="h-4 w-4" />
                                                <span>Assigned To</span>
                                            </div>
                                            <div className="text-sm font-medium">
                                                {(() => {
                                                    const assignedUsers =
                                                        task.assigned_users ||
                                                        [];
                                                    return assignedUsers.length >
                                                        0 ? (
                                                        <div className="flex flex-wrap gap-1">
                                                            {assignedUsers.map(
                                                                (
                                                                    user,
                                                                    index,
                                                                ) => (
                                                                    <span
                                                                        key={
                                                                            user.id
                                                                        }
                                                                        className="text-sm"
                                                                    >
                                                                        {
                                                                            user.name
                                                                        }
                                                                        {index <
                                                                        assignedUsers.length -
                                                                            1
                                                                            ? ', '
                                                                            : ''}
                                                                    </span>
                                                                ),
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <span className="text-muted-foreground">
                                                            Unassigned
                                                        </span>
                                                    );
                                                })()}
                                            </div>
                                        </div>
                                        {task.assigned_department ? (
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                    <Building2 className="h-4 w-4" />
                                                    <span>Department</span>
                                                </div>
                                                <div className="text-sm font-medium">
                                                    {
                                                        task.assigned_department
                                                            .name
                                                    }
                                                </div>
                                            </div>
                                        ) : null}
                                    </div>
                                </div>

                                <Separator />

                                {/* Milestones */}
                                <TaskMilestones
                                    taskId={task.id}
                                    taskStartAt={task.start_at}
                                    taskDueAt={task.due_at}
                                    initialMilestones={
                                        task.timeline_events?.filter(
                                            (e: any) => e.is_milestone,
                                        ) || []
                                    }
                                    isOwnTask={isOwnTask}
                                    isSuperAdmin={isSuperAdmin}
                                    taskState={task.state}
                                />

                                {/* Metrics & Progress */}
                                <TaskMetrics taskId={task.id} />

                                <Separator />

                                {/* Configuration */}
                                <div>
                                    <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold">
                                        <FileText className="h-4 w-4 text-muted-foreground" />
                                        Configuration
                                    </h4>
                                    <div className="grid gap-4 md:grid-cols-2">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                <FileText className="h-4 w-4" />
                                                <span>Task Type</span>
                                            </div>
                                            <div className="text-sm font-medium">
                                                {task.task_type ? (
                                                    task.task_type.name
                                                ) : (
                                                    <span className="text-muted-foreground">
                                                        No type
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                <Target className="h-4 w-4" />
                                                <span>SLA Policy</span>
                                            </div>
                                            <div className="text-sm font-medium">
                                                {task.sla_policy ? (
                                                    task.sla_policy.name
                                                ) : (
                                                    <span className="text-muted-foreground">
                                                        No SLA
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                <CheckCircle className="h-4 w-4" />
                                                <span>SLA Status</span>
                                            </div>
                                            <div>
                                                <Badge className="border-gray-200 bg-gray-100 text-gray-800">
                                                    <span className="capitalize">
                                                        {(
                                                            task.sla_status ||
                                                            'on_track'
                                                        ).replace('_', ' ')}
                                                    </span>
                                                </Badge>
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                <FileText className="h-4 w-4" />
                                                <span>Workflow Definition</span>
                                            </div>
                                            <div className="text-sm font-medium">
                                                <span className="text-muted-foreground">
                                                    Not available
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Metadata */}
                                {task.metadata && (
                                    <>
                                        <Separator />
                                        <div>
                                            <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold">
                                                <FileText className="h-4 w-4 text-muted-foreground" />
                                                Metadata
                                            </h4>
                                            <div className="rounded-lg border bg-gray-50 p-3">
                                                <pre className="overflow-x-auto font-mono text-xs text-muted-foreground">
                                                    {JSON.stringify(
                                                        task.metadata,
                                                        null,
                                                        2,
                                                    )}
                                                </pre>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </CardContent>
                        </Card>

                        {/* Parent and Child Tasks */}
                        {task.parent_task ||
                        (task.child_tasks && task.child_tasks.length > 0) ? (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Task Hierarchy</CardTitle>
                                    <CardDescription>
                                        Parent and child task relationships
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {task.parent_task && (
                                        <div>
                                            <h4 className="mb-2 text-sm font-medium">
                                                Parent Task
                                            </h4>
                                            <Link
                                                href={`/admin/tasks/${task.parent_task.id}`}
                                                className="text-sm text-blue-600 hover:underline"
                                            >
                                                {task.parent_task.title ||
                                                    `Task #${task.parent_task.id}`}
                                                {task.parent_task.task_code &&
                                                    ` (${task.parent_task.task_code})`}
                                            </Link>
                                        </div>
                                    )}

                                    {task.child_tasks &&
                                        task.child_tasks.length > 0 && (
                                            <div>
                                                <h4 className="mb-2 text-sm font-medium">
                                                    Child Tasks (
                                                    {task.child_tasks.length})
                                                </h4>
                                                <div className="space-y-2">
                                                    {task.child_tasks.map(
                                                        (childTask) => (
                                                            <Link
                                                                key={
                                                                    childTask.id
                                                                }
                                                                href={`/admin/tasks/${childTask.id}`}
                                                                className="block text-sm text-blue-600 hover:underline"
                                                            >
                                                                {childTask.title ||
                                                                    `Task #${childTask.id}`}
                                                                {childTask.task_code &&
                                                                    ` (${childTask.task_code})`}
                                                            </Link>
                                                        ),
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                </CardContent>
                            </Card>
                        ) : null}

                        <TaskFileAttachment task={task} />

                        {/* Task Audit Events - Collapsed by default */}
                        {task.audit_events && task.audit_events.length > 0 && (
                            <details className="group">
                                <summary className="flex cursor-pointer list-none items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground">
                                    <svg
                                        className="h-4 w-4 transition-transform group-open:rotate-90"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M9 5l7 7-7 7"
                                        />
                                    </svg>
                                    Task Audit Events (
                                    {task.audit_events.length})
                                </summary>
                                <div className="mt-4 max-h-[300px] space-y-4 overflow-y-auto border-l-2 pl-4">
                                    {task.audit_events.map((event) => (
                                        <div
                                            key={event.id}
                                            className="rounded-lg border p-3"
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="text-sm">
                                                    Task{' '}
                                                    {event.action?.toLowerCase()}{' '}
                                                    by{' '}
                                                    <span className="font-semibold">
                                                        {event.actor_user
                                                            ?.name ||
                                                            'Unknown User'}
                                                    </span>
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    {new Date(
                                                        event.occurred_at,
                                                    ).toLocaleString()}
                                                </div>
                                            </div>
                                            {event.reason && (
                                                <div className="mt-1 text-xs text-gray-600">
                                                    Reason: {event.reason}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </details>
                        )}
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Comments Section */}
                        <TaskComments taskId={task.id} />
                    </div>
                </div>

                {/* Task Assignment Modal */}
                <TaskAssignmentModal
                    taskId={task.id}
                    isOpen={isAssignmentModalOpen}
                    onClose={() => setIsAssignmentModalOpen(false)}
                />
            </div>
        </AppLayout>
    );
}
