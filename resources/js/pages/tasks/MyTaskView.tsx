import TaskComments from '@/components/tasks/task-comments';
import TaskTimeTracker from '@/components/tasks/TaskTimeTracker';
import { TaskMilestones } from '@/components/tasks/TaskMilestones';
import TaskAssignmentModal from '@/components/TaskAssignmentModal';
import { TaskFileAttachment } from '@/components/tasks/TaskFileAttachment';
import { TaskMetrics } from '@/components/tasks/TaskMetrics';
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
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
import AppLayout from '@/layouts/app-layout';
import { Task, type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import axios from 'axios';
import { format } from 'date-fns';
import {
    AlertCircle,
    ArrowLeft,
    Calendar,
    CheckCircle,
    Clock,
    Edit,
    FileText,
    Pause,
    Play,
    RotateCcw,
    Target,
    Trash,
    User,
    UserPlus,
    XCircle,
    Clock3,
} from 'lucide-react';
import { useEffect, useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/my/dashboard',
    },
    {
        title: 'My Tasks',
        href: '/my/tasks',
    },
    {
        title: 'Task Details',
        href: '',
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

interface MyTaskViewProps {
    taskId: number;
}

export default function MyTaskView({ taskId }: MyTaskViewProps) {
    const [taskData, setTaskData] = useState<Task | null>(null);
    const [loading, setLoading] = useState(false);
    const [timeEntries, setTimeEntries] = useState<any[]>([]);
    const [authUser, setAuthUser] = useState<{id: number; is_super_admin: boolean} | null>(null);
    const [isAssignmentModalOpen, setIsAssignmentModalOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        loadTaskData();
        loadTimeEntries();
    }, [taskId]);

    const loadTaskData = async () => {
        try {
            const response = await axios.get(`/data/tasks/${taskId}`);
            setTaskData(response.data.data);
            setAuthUser(response.data.authUser || null);
        } catch (error) {
            console.error('Error loading task data:', error);
        }
    };

    const loadTimeEntries = async () => {
        try {
            const response = await axios.get(
                `/data/tasks/${taskId}/time-entries`,
            );
            setTimeEntries(response.data.data || response.data || []);
        } catch (error) {
            console.error('Error loading time entries:', error);
        }
    };

    const handleTaskAction = async (
        action: 'start' | 'resume' | 'pause' | 'end',
    ) => {
        setLoading(true);
        try {
            let response;
            switch (action) {
                case 'start':
                    response = await axios.post(`/my/tasks/${taskId}/start`);
                    break;
                case 'resume':
                    response = await axios.post(`/my/tasks/${taskId}/resume`);
                    break;
                case 'pause':
                    response = await axios.post(`/my/tasks/${taskId}/pause`);
                    break;
                case 'end':
                    response = await axios.post(`/my/tasks/${taskId}/end`);
                    break;
            }

            if (response?.data?.data) {
                console.log(`${action} action applied.`);
                console.log(response.data);

                setTaskData(response.data.data);
            }

            loadTimeEntries();
        } catch (error) {
            console.error('Error performing task action:', error);
        } finally {
            setLoading(false);
        }
    };

    // Handle delete task
    const handleDeleteTask = () => {
        if (confirm('Are you sure you want to delete this task?')) {
            setIsDeleting(true);
            axios
                .delete(`/admin/tasks/${taskId}`)
                .then(() => {
                    router.visit('/my/tasks');
                })
                .catch((err) => {
                    console.error('Error deleting task:', err);
                    alert('Failed to delete task');
                })
                .finally(() => {
                    setIsDeleting(false);
                });
        }
    };

    // Handle status change
    const handleStatusChange = (newStatus: string) => {
        axios
            .patch(`/admin/tasks/${taskId}/status`, { state: newStatus })
            .then(() => {
                loadTaskData();
            })
            .catch((err) => {
                console.error('Error changing status:', err);
                alert('Failed to change task status');
            });
    };

    // Get valid state transitions
    const getValidStateTransitions = (currentState: string): string[] => {
        switch (currentState) {
            case 'Draft':
                return ['Assigned', 'Blocked', 'Cancelled', 'Rejected'];
            case 'Assigned':
                return ['InProgress', 'Blocked', 'Cancelled', 'Rejected', 'Draft'];
            case 'InProgress':
                return ['InReview', 'Blocked', 'Cancelled', 'Rejected', 'Assigned'];
            case 'InReview':
                return ['Done', 'Blocked', 'Cancelled', 'Rejected', 'InProgress'];
            case 'Done':
                return ['InReview', 'Cancelled', 'Rejected'];
            case 'Blocked':
                return ['Assigned', 'InProgress', 'Cancelled', 'Rejected', 'Draft'];
            case 'Cancelled':
                return ['Draft', 'Assigned'];
            case 'Rejected':
                return ['Draft', 'Assigned'];
            default:
                return [];
        }
    };

    if (!taskData) {
        return (
            <AppLayout breadcrumbs={breadcrumbs}>
                <Head title="Loading Task..." />
                <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto p-6">
                    <div className="py-8 text-center">
                        <p className="text-gray-500">Loading task details...</p>
                    </div>
                </div>
            </AppLayout>
        );
    }

    // Determine if current user is the task creator (own task) or super admin
    const isOwnTask = taskData.created_by?.id === authUser?.id || taskData.createdBy?.id === authUser?.id;
    const isSuperAdmin = authUser?.is_super_admin ?? false;
    
    // Permission check: can edit/delete only own tasks or super admin
    const canEdit = isOwnTask || isSuperAdmin;
    const canDelete = isOwnTask || isSuperAdmin;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Task: ${taskData.title}`} />

            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto p-6">
                {/* Header */}
                <Link href="/my/tasks">
                    <Button variant="outline" size="sm">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to My Tasks
                    </Button>
                </Link>
                
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">
                            {taskData.title}
                        </h1>
                        <p className="text-muted-foreground">
                            Task {taskData.task_code && `• ${taskData.task_code}`} • 
                            Created {format(new Date(taskData.created_at), 'MMM dd, yyyy')}
                        </p>
                    </div>
                    
                    {/* State Change Dropdown */}
                    <div className="flex items-center gap-2">
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
                                {getValidStateTransitions(taskData.state).map((newState) => (
                                    <DropdownMenuItem
                                        key={newState}
                                        onClick={() => handleStatusChange(newState)}
                                    >
                                        {getStatusIcon(newState)}
                                        <span className="ml-2 capitalize">
                                            {newState === 'InProgress'
                                                ? 'Mark as In Progress'
                                                : newState === 'InReview'
                                                    ? 'Mark as In Review'
                                                    : `Mark as ${newState}`}
                                        </span>
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>

                        {/* More Actions Dropdown */}
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
                                {canEdit && (
                                    <DropdownMenuItem asChild>
                                        <Link href={`/admin/tasks/${taskId}/edit`}>
                                            <Edit className="mr-2 h-4 w-4" />
                                            Edit Task
                                        </Link>
                                    </DropdownMenuItem>
                                )}
                                {canDelete && (
                                    <DropdownMenuItem
                                        className="text-red-600"
                                        onClick={handleDeleteTask}
                                        disabled={isDeleting}
                                    >
                                        <Trash className="mr-2 h-4 w-4" />
                                        {isDeleting ? 'Deleting...' : 'Delete Task'}
                                    </DropdownMenuItem>
                                )}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-3">
                    {/* Main Content - Task Details */}
                    <div className="space-y-6 lg:col-span-2">
                        {/* Task Overview Card */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center justify-between">
                                    <span>Task Overview</span>
                                    <div className="flex items-center space-x-2">
                                        <Badge
                                            className={getStatusColor(taskData.state)}
                                        >
                                            <div className="flex items-center gap-1">
                                                {getStatusIcon(taskData.state)}
                                                <span className="capitalize">
                                                    {taskData.state.replace('-', ' ')}
                                                </span>
                                            </div>
                                        </Badge>
                                        <Badge
                                            className={getPriorityColor(
                                                taskData.sla_policy?.priority || 'P4',
                                            )}
                                        >
                                            <AlertCircle className="mr-1 h-3 w-3" />
                                            <span className="capitalize">
                                                {taskData.sla_policy?.priority || 'P4'}
                                            </span>
                                        </Badge>
                                    </div>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {/* Basic Information */}
                                <div>
                                    <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold">
                                        <FileText className="h-4 w-4 text-muted-foreground" />
                                        Basic Information
                                    </h4>
                                    <div className="grid gap-4 md:grid-cols-2">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                <span>Task Code</span>
                                            </div>
                                            <div className="text-sm font-medium">
                                                {taskData.task_code || (
                                                    <span className="text-muted-foreground">
                                                        Not assigned
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                <span>Task Type</span>
                                            </div>
                                            <div className="text-sm font-medium">
                                                {taskData.task_type?.name || 'No Type'}
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="mt-4 grid gap-4 md:grid-cols-2">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                <Calendar className="h-4 w-4" />
                                                <span>Created Date</span>
                                            </div>
                                            <div className="text-sm font-medium">
                                                {format(new Date(taskData.created_at), 'MMM dd, yyyy h:mm a')}
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                <Calendar className="h-4 w-4" />
                                                <span>Due Date</span>
                                            </div>
                                            <div className="text-sm font-medium">
                                                {taskData.due_at ? (
                                                    <div className="flex items-center gap-2">
                                                        <span>
                                                            {format(new Date(taskData.due_at), 'MMM dd, yyyy')}
                                                        </span>
                                                        {taskData.is_overdue && taskData.state !== 'Done' && (
                                                            <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800">
                                                                Overdue
                                                            </span>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <span className="text-muted-foreground">No due date</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <Separator />

                                {/* People & Assignment */}
                                <div>
                                    <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold">
                                        <User className="h-4 w-4 text-muted-foreground" />
                                        People & Assignment
                                    </h4>
                                    <div className="grid gap-4 md:grid-cols-2">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                <User className="h-4 w-4" />
                                                <span>Created By</span>
                                            </div>
                                            <div className="text-sm font-medium">
                                                {taskData.created_by?.name || 'Unknown'}
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                <User className="h-4 w-4" />
                                                <span>Assigned To</span>
                                            </div>
                                            <div className="text-sm font-medium">
                                                {taskData.assigned_users && taskData.assigned_users.length > 0 ? (
                                                    <div className="flex flex-wrap gap-1">
                                                        {taskData.assigned_users.map((user: any, index: number) => (
                                                            <span key={user.id}>
                                                                {user.name}
                                                                {index < (taskData.assigned_users?.length || 0) - 1 ? ', ' : ''}
                                                            </span>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <span className="text-muted-foreground">Unassigned</span>
                                                )}
                                            </div>
                                        </div>
                                        {taskData.assigned_department && (
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                    <span>Department</span>
                                                </div>
                                                <div className="text-sm font-medium">
                                                    {taskData.assigned_department.name}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <Separator />

                                {/* Metrics */}
                                <TaskMetrics taskId={taskData.id} />

                                {/* Milestones */}
                                <TaskMilestones
                                    taskId={taskData.id}
                                    taskStartAt={taskData.start_at}
                                    taskDueAt={taskData.due_at}
                                    initialMilestones={taskData.timeline_events?.filter((e: any) => e.is_milestone) || []}
                                    isOwnTask={isOwnTask}
                                    isSuperAdmin={isSuperAdmin}
                                    taskState={taskData.state}
                                />

                                <Separator />

                                {/* Task Audit Events */}
                                {taskData.audit_events && taskData.audit_events.length > 0 && (
                                    <>
                                        <Separator />
                                        <div>
                                            <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold">
                                                <Clock3 className="h-4 w-4 text-muted-foreground" />
                                                Task Audit Events
                                            </h4>
                                            <div className="space-y-4 max-h-[300px] overflow-y-auto">
                                                {taskData.audit_events.map((event: any) => (
                                                    <div
                                                        key={event.id}
                                                        className="rounded-lg border p-4"
                                                    >
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center space-x-2">
                                                                <div className="text-sm">
                                                                    Task {event.action?.toLowerCase()} by{' '}
                                                                    <span className="font-semibold italic">
                                                                        {event.actor_user?.name || 'Unknown User'}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                            <div className="text-xs text-gray-500">
                                                                {new Date(event.occurred_at).toLocaleString()}
                                                            </div>
                                                        </div>
                                                        {event.reason && (
                                                            <div className="mt-2 text-xs text-gray-600">
                                                                Reason: {event.reason}
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </>
                                )}

                                <Separator />

                                {/* Description */}
                                <div>
                                    <h4 className="mb-2 text-sm font-medium">
                                        Description
                                    </h4>
                                    <div className="text-sm text-muted-foreground">
                                        {taskData.description ? (
                                            <div className="whitespace-pre-wrap">
                                                {taskData.description}
                                            </div>
                                        ) : (
                                            <span>No description provided</span>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* File Attachments */}
                        <TaskFileAttachment task={taskData} />

                        {/* Time Tracking */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Time Tracking</CardTitle>
                                <CardDescription>
                                    Track your time spent on this task
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <TaskTimeTracker
                                        taskId={taskData.id}
                                        onTimeUpdate={() => loadTimeEntries()}
                                        onTaskAction={handleTaskAction}
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        {/* Time Entries History */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Time Entries</CardTitle>
                                <CardDescription>
                                    History of time tracking for this task
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {timeEntries.length > 0 ? (
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Start Time</TableHead>
                                                <TableHead>End Time</TableHead>
                                                <TableHead>Duration</TableHead>
                                                <TableHead>Status</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {timeEntries.map((entry) => (
                                                <TableRow key={entry.id}>
                                                    <TableCell>
                                                        {format(
                                                            new Date(entry.start_time),
                                                            'MMM dd, yyyy HH:mm',
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        {entry.end_time
                                                            ? format(
                                                                  new Date(entry.end_time),
                                                                  'MMM dd, yyyy HH:mm',
                                                              )
                                                            : 'Active'}
                                                    </TableCell>
                                                    <TableCell>
                                                        {entry.duration_hours
                                                            ? `${entry.duration_hours} hours`
                                                            : 'Active'}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge
                                                            variant={
                                                                entry.is_active
                                                                    ? 'secondary'
                                                                    : 'outline'
                                                            }
                                                        >
                                                            {entry.is_active
                                                                ? 'Active'
                                                                : 'Completed'}
                                                        </Badge>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                ) : (
                                    <p className="text-sm text-gray-500">
                                        No time entries yet.
                                    </p>
                                )}
                            </CardContent>
                        </Card>

                        {/* Task Comments */}
                        <TaskComments taskId={taskId} />
                    </div>

                    {/* Sidebar - Quick Actions & Task Info */}
                    <div className="space-y-6">
                        {/* Quick Actions */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Quick Actions</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                {canEdit && (
                                    <Button
                                        asChild
                                        className="w-full"
                                    >
                                        <Link href={`/admin/tasks/${taskId}/edit`}>
                                            <Edit className="mr-2 h-4 w-4" />
                                            Edit Task
                                        </Link>
                                    </Button>
                                )}
                                
                                {canEdit && (
                                    <Button 
                                        variant="outline" 
                                        className="w-full"
                                        onClick={() => setIsAssignmentModalOpen(true)}
                                    >
                                        <UserPlus className="mr-2 h-4 w-4" />
                                        Manage Assignments
                                    </Button>
                                )}

                                <Button
                                    className="w-full"
                                    onClick={() => handleTaskAction('start')}
                                    disabled={
                                        loading ||
                                        taskData.state === 'InProgress'
                                    }
                                >
                                    <Play className="mr-2 h-4 w-4" />
                                    Start Task
                                </Button>
                                <Button
                                    variant="outline"
                                    className="w-full"
                                    onClick={() => handleTaskAction('resume')}
                                    disabled={
                                        loading || taskData.state !== 'Blocked'
                                    }
                                >
                                    <Play className="mr-2 h-4 w-4" />
                                    Resume Task
                                </Button>
                                <Button
                                    variant="outline"
                                    className="w-full"
                                    onClick={() => handleTaskAction('pause')}
                                    disabled={
                                        loading ||
                                        taskData.state !== 'InProgress'
                                    }
                                >
                                    <Pause className="mr-2 h-4 w-4" />
                                    Pause Task
                                </Button>
                                <Button
                                    variant="outline"
                                    className="w-full"
                                    onClick={() => handleTaskAction('end')}
                                    disabled={
                                        loading ||
                                        taskData.state !== 'InProgress'
                                    }
                                >
                                    <CheckCircle className="mr-2 h-4 w-4" />
                                    Complete Task
                                </Button>

                                {canDelete && (
                                    <>
                                        <Separator />
                                        <Button
                                            variant="destructive"
                                            className="w-full"
                                            onClick={handleDeleteTask}
                                            disabled={isDeleting}
                                        >
                                            <Trash className="mr-2 h-4 w-4" />
                                            {isDeleting ? 'Deleting...' : 'Delete Task'}
                                        </Button>
                                    </>
                                )}
                            </CardContent>
                        </Card>

                        {/* Task Information Card */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Task Information</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex justify-between">
                                    <span className="text-sm text-muted-foreground">
                                        Task ID
                                    </span>
                                    <span className="text-sm font-medium">
                                        #{taskData.id}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-muted-foreground">
                                        Status
                                    </span>
                                    <Badge
                                        className={getStatusColor(taskData.state)}
                                    >
                                        {taskData.state.replace('-', ' ')}
                                    </Badge>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-muted-foreground">
                                        Priority
                                    </span>
                                    <Badge
                                        className={getPriorityColor(
                                            taskData.sla_policy?.priority || 'P4',
                                        )}
                                    >
                                        {taskData.sla_policy?.priority || 'P4'}
                                    </Badge>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-muted-foreground">
                                        Created
                                    </span>
                                    <span className="text-sm">
                                        {format(
                                            new Date(taskData.created_at),
                                            'MMM dd, yyyy',
                                        )}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-muted-foreground">
                                        Updated
                                    </span>
                                    <span className="text-sm">
                                        {format(
                                            new Date(taskData.updated_at),
                                            'MMM dd, yyyy',
                                        )}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-muted-foreground">
                                        Estimated Hours
                                    </span>
                                    <span className="text-sm">
                                        {taskData.estimate_hours || 'N/A'}
                                    </span>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Task Assignment Modal */}
                <TaskAssignmentModal
                    taskId={taskId}
                    isOpen={isAssignmentModalOpen}
                    onClose={() => setIsAssignmentModalOpen(false)}
                />
            </div>
        </AppLayout>
    );
}
