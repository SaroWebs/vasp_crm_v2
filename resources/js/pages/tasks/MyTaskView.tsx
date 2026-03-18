import TaskComments from '@/components/tasks/task-comments';
import TaskTimeTracker from '@/components/tasks/TaskTimeTracker';
import { TaskMilestones } from '@/components/tasks/TaskMilestones';
import TaskAssignmentModal from '@/components/TaskAssignmentModal';
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
import AppLayout from '@/layouts/app-layout';
import { Task, type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import axios from 'axios';
import { format } from 'date-fns';
import {
    AlertCircle,
    Calendar,
    CheckCircle,
    Clock,
    Pause,
    Play,
    User,
    UserPlus,
    XCircle,
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

            if (response.data.data) {
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

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Task: ${taskData.title}`} />

            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto p-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">
                            {taskData.title}
                        </h1>
                        <p className="text-muted-foreground">
                            Task Code: {taskData.task_code} | Assigned to:{' '}
                            {taskData.assigned_to?.name || 'You'}
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Link href="/my/tasks">
                            <Button variant="outline">Back to My Tasks</Button>
                        </Link>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    {/* Main Task Details */}
                    <div className="space-y-6 lg:col-span-2">
                        {/* Task Overview */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Task Overview</CardTitle>
                                <CardDescription>
                                    Basic information and current status
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm font-medium text-gray-600">
                                            Status
                                        </label>
                                        <div className="mt-1">
                                            <Badge
                                                className={getStatusColor(
                                                    taskData.state,
                                                )}
                                            >
                                                <div className="flex items-center gap-1">
                                                    {getStatusIcon(
                                                        taskData.state,
                                                    )}
                                                    <span className="capitalize">
                                                        {taskData.state.replace(
                                                            '-',
                                                            ' ',
                                                        )}
                                                    </span>
                                                </div>
                                            </Badge>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-600">
                                            Priority
                                        </label>
                                        <div className="mt-1">
                                            <Badge
                                                className={getPriorityColor(
                                                    taskData.sla_policy
                                                        ?.priority || 'P4',
                                                )}
                                            >
                                                <AlertCircle className="mr-1 h-3 w-3" />
                                                <span className="capitalize">
                                                    {taskData.sla_policy
                                                        ?.priority || 'P4'}
                                                </span>
                                            </Badge>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm font-medium text-gray-600">
                                            Task Type
                                        </label>
                                        <p className="mt-1 text-sm">
                                            {taskData.task_type?.name ||
                                                'No Type'}
                                        </p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-600">
                                            Assigned By
                                        </label>
                                        <p className="mt-1 text-sm">
                                            {taskData.created_by?.name ||
                                                'System'}
                                        </p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm font-medium text-gray-600">
                                            Due Date
                                        </label>
                                        <div className="mt-1 flex items-center gap-2">
                                            <Calendar className="h-4 w-4 text-muted-foreground" />
                                            <span className="text-sm">
                                                {taskData.due_at
                                                    ? format(
                                                          new Date(
                                                              taskData.due_at,
                                                          ),
                                                          'MMM dd, yyyy',
                                                      )
                                                    : 'No due date'}
                                            </span>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-600">
                                            Estimated Hours
                                        </label>
                                        <p className="mt-1 text-sm">
                                            {taskData.estimate_hours ||
                                                'Not estimated'}
                                        </p>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-sm font-medium text-gray-600">
                                        Description
                                    </label>
                                    <p className="mt-1 text-sm text-gray-700">
                                        {taskData.description ||
                                            'No description provided.'}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>

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
                                                <TableHead>
                                                    Start Time
                                                </TableHead>
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
                                                            new Date(
                                                                entry.start_time,
                                                            ),
                                                            'MMM dd, yyyy HH:mm',
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        {entry.end_time
                                                            ? format(
                                                                  new Date(
                                                                      entry.end_time,
                                                                  ),
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
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Task Actions */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Task Actions</CardTitle>
                                <CardDescription>
                                    Manage your task status and time tracking
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-3">
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
                                {(isOwnTask || isSuperAdmin) && (
                                    <Button
                                        variant="outline"
                                        className="w-full"
                                        onClick={() => setIsAssignmentModalOpen(true)}
                                    >
                                        <UserPlus className="mr-2 h-4 w-4" />
                                        Manage Assignments
                                    </Button>
                                )}
                            </CardContent>
                        </Card>

                        <TaskComments taskId={taskId} />
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
