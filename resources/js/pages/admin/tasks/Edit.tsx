import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import TaskDurationPicker from '@/components/tasks/TaskDurationPicker';
import { Textarea } from '@/components/ui/textarea';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import axios from 'axios';
import {
    ArrowLeft,
    Calendar,
    Code,
    FileText,
    Info,
    Loader2,
    Save,
    X,
} from 'lucide-react';
import { useEffect, useState } from 'react';

interface TasksEditProps {
    task: any;
    tickets: Array<{ id: number; ticket_number: string; title: string }>;
    parentTasks: Array<{ id: number; task_code: string; title: string }>;
    taskTypes: Array<{
        id: number;
        name: string;
        code: string;
        description?: string;
    }>;
    slaPolicies: Array<{
        id: number;
        name: string;
        priority: string;
        description?: string;
        response_time_minutes: number;
        resolution_time_minutes: number;
    }>;
    projects: Array<{ id: number; name: string }>;
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
        title: 'Edit Task',
        href: '#',
    },
];

// Helper function to format ISO date for datetime-local input
const formatDateTimeLocal = (dateString: string | null | undefined): string => {
    if (!dateString) return '';
    try {
        const date = new Date(dateString);
        // Format as YYYY-MM-DDTHH:mm (local time format for datetime-local input)
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${year}-${month}-${day}T${hours}:${minutes}`;
    } catch {
        return '';
    }
};

export default function TasksEdit({
    task,
    tickets,
    parentTasks,
    taskTypes,
    slaPolicies,
    projects,
}: TasksEditProps) {
    const { data, setData, processing, errors, setError } = useForm({
        title: task.title || '',
        description: task.description || '',
        task_code: task.task_code || '',
        ticket_id: task.ticket_id ? task.ticket_id.toString() : '',
        parent_task_id: task.parent_task_id
            ? task.parent_task_id.toString()
            : '',
        task_type_id: task.task_type_id ? task.task_type_id.toString() : '',
        sla_policy_id: task.sla_policy_id ? task.sla_policy_id.toString() : '',
        project_id: task.project_id ? task.project_id.toString() : '',
        start_at: formatDateTimeLocal(task.start_at || task.created_at),
        due_at: formatDateTimeLocal(task.due_at),
        completed_at: formatDateTimeLocal(task.completed_at),
        estimate_hours: task.estimate_hours || '',
        tags: task.tags || [],
        version: task.version || 1,
        metadata:
            Array.isArray(task.metadata) && task.metadata.length === 0
                ? ''
                : typeof task.metadata === 'object'
                ? JSON.stringify(task.metadata)
                : task.metadata || '',
        completion_notes: task.completion_notes || '',
        attachments: [] as File[],
    });

    // State for minimum due date calculation
    const [minDueDate, setMinDueDate] = useState<string>(formatDateTimeLocal(task.due_at || task.start_at));
    const [loadingMinDueDate, setLoadingMinDueDate] = useState(false);

    // Calculate minimum due date based on estimated hours using API
    const fetchMinDueDate = async (estimateHours?: string, startAt?: string) => {
        const hours = parseFloat(estimateHours || '0');
        if (!hours || hours <= 0) {
            const baseDate = startAt ? new Date(startAt) : new Date();
            const now = formatDateTimeLocal(baseDate.toISOString());
            setMinDueDate(now);
            // Auto-set due_at if not set or if new min is greater
            if (!data.due_at || new Date(data.due_at).getTime() < new Date(now).getTime()) {
                setData('due_at', now);
            }
            return;
        }

        setLoadingMinDueDate(true);
        try {
            const baseDate = startAt ? new Date(startAt) : undefined;
            const res = await axios.get('/data/tasks/calculate-min-due-date', {
                params: { 
                    estimate_hours: hours,
                    start_at: baseDate ? baseDate.toISOString() : undefined
                }
            });
            if (res.data?.data?.min_due_date) {
                const minDate = formatDateTimeLocal(res.data.data.min_due_date);
                setMinDueDate(minDate);
                // Auto-set due_at if not set or if new min is greater
                if (!data.due_at || new Date(data.due_at).getTime() < new Date(minDate).getTime()) {
                    setData('due_at', minDate);
                }
            }
        } catch (err) {
            // Fallback to simple calculation if API fails
            console.warn('Failed to calculate min due date from API, using fallback');
            const baseDate = startAt ? new Date(startAt) : new Date();
            const fallbackDate = new Date(baseDate.getTime() + (hours * 60 * 60 * 1000));
            const minDate = formatDateTimeLocal(fallbackDate.toISOString());
            setMinDueDate(minDate);
            if (!data.due_at || new Date(data.due_at).getTime() < new Date(minDate).getTime()) {
                setData('due_at', minDate);
            }
        } finally {
            setLoadingMinDueDate(false);
        }
    };

    // Debounced effect to recalculate due date when estimate_hours or start_at changes
    useEffect(() => {
        console.log(task);
        
        const hours = parseFloat(data.estimate_hours || '0');
        if (hours > 0) {
            const handler = setTimeout(() => {
                fetchMinDueDate(data.estimate_hours, data.start_at);
            }, 2000);
            return () => clearTimeout(handler);
        } else {
            fetchMinDueDate(data.estimate_hours, data.start_at);
        }
    }, [data.estimate_hours, data.start_at]);

    // State to hold filtered SLA policies based on selected task type
    const [filteredSlaPolicies, setFilteredSlaPolicies] = useState(slaPolicies);

    // Effect to filter SLA policies when task type changes
    useEffect(() => {
        if (data.task_type_id) {
            fetch(`/admin/tasks/sla-policies/${data.task_type_id}`)
                .then((response) => response.json())
                .then((result) => {
                    setFilteredSlaPolicies(result.sla_policies || []);
                })
                .catch((error) => {
                    console.error('Error fetching SLA policies:', error);
                    setFilteredSlaPolicies(slaPolicies);
                });
        } else {
            setFilteredSlaPolicies([]);
        }
    }, [data.task_type_id, slaPolicies]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Prepare metadata
        let metadataObj: any = [];
        if (data.metadata) {
            try {
                metadataObj = JSON.parse(data.metadata);
            } catch (error) {
                console.error('Invalid JSON in metadata:', error);
                metadataObj = [];
            }
        }

        // Convert frontend special values to null for backend compatibility
        const formData = new FormData();

        // Add _method for Laravel to treat this POST as PATCH
        formData.append('_method', 'PATCH');

        // Add all form fields
        formData.append('title', data.title);
        formData.append('description', data.description);
        formData.append('task_code', data.task_code);
        formData.append(
            'ticket_id',
            data.ticket_id === 'none' ? '' : data.ticket_id || '',
        );
        formData.append(
            'parent_task_id',
            data.parent_task_id === 'no-parent'
                ? ''
                : data.parent_task_id || '',
        );
        formData.append('task_type_id', data.task_type_id || '');
        formData.append('sla_policy_id', data.sla_policy_id || '');
        formData.append('project_id', data.project_id || '');
        formData.append('start_at', data.start_at);
        formData.append('due_at', data.due_at);
        formData.append('completed_at', data.completed_at);
        formData.append('estimate_hours', data.estimate_hours || '');
        formData.append('tags', JSON.stringify(data.tags || []));
        formData.append('version', data.version.toString());
        formData.append('metadata', JSON.stringify(metadataObj));
        formData.append('completion_notes', data.completion_notes || '');

        // Add attachments
        if (data.attachments && data.attachments.length > 0) {
            data.attachments.forEach((file) => {
                formData.append('attachments[]', file);
            });
        }

        try {
            const response = await axios.post(
                `/admin/tasks/${task.id}`,
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                        Accept: 'application/json',
                    },
                },
            );

            console.log('Task updated successfully!', response.data);

            // Redirect to the updated task
            window.location.href = `/admin/tasks/${response.data.task.id}`;
        } catch (err) {
            console.error('Error updating task:', err);
            if (axios.isAxiosError(err) && err.response) {
                if (err.response.status === 422 && err.response.data.errors) {
                    setError(err.response.data.errors);
                }
                console.error(
                    'Server errors:',
                    err.response.data.errors || err.response.data.message,
                );
            }
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit Task: ${task.task_code || task.id}`} />

            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto p-6">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <Link href={`/admin/tasks/${task.id}`}>
                        <Button variant="outline" size="sm">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Task
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">
                            Edit Task
                        </h1>
                        <p className="text-muted-foreground">
                            Update task details and settings
                        </p>
                    </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-3">
                    {/* Main Form */}
                    <div className="lg:col-span-2">
                        <Card>
                            <CardHeader>
                                <CardTitle>Task Details</CardTitle>
                                <CardDescription>
                                    Update the information for this task
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form
                                    onSubmit={handleSubmit}
                                    className="space-y-6"
                                >
                                    {/* Task Information */}
                                    <div className="space-y-2">
                                        <Label htmlFor="task_code">
                                            Task Code
                                        </Label>
                                        <div className="flex items-center gap-2">
                                            <Input
                                                id="task_code"
                                                value={data.task_code}
                                                onChange={(e) =>
                                                    setData(
                                                        'task_code',
                                                        e.target.value,
                                                    )
                                                }
                                                placeholder="Enter task code"
                                                className="flex-1"
                                            />
                                        </div>
                                        {errors.task_code && (
                                            <p className="text-sm text-red-600">
                                                {errors.task_code}
                                            </p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="title">
                                            Task Title
                                        </Label>
                                        <Input
                                            id="title"
                                            value={data.title}
                                            onChange={(e) =>
                                                setData('title', e.target.value)
                                            }
                                            placeholder="Enter task title"
                                        />
                                        {errors.title && (
                                            <p className="text-sm text-red-600">
                                                {errors.title}
                                            </p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="description">
                                            Description
                                        </Label>
                                        <Textarea
                                            id="description"
                                            value={data.description}
                                            onChange={(e) =>
                                                setData(
                                                    'description',
                                                    e.target.value,
                                                )
                                            }
                                            placeholder="Enter task description"
                                            rows={4}
                                        />
                                        {errors.description && (
                                            <p className="text-sm text-red-600">
                                                {errors.description}
                                            </p>
                                        )}
                                    </div>

                                    {/* Task Relationships */}
                                    <div className="grid gap-4 md:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label htmlFor="ticket_id">
                                                Related Ticket(if any)
                                            </Label>
                                            <select
                                                value={data.ticket_id || ''}
                                                onChange={(e) =>
                                                    setData(
                                                        'ticket_id',
                                                        e.target.value,
                                                    )
                                                }
                                                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                            >
                                                <option value="">
                                                    No ticket
                                                </option>
                                                {tickets.map((ticket) => (
                                                    <option
                                                        key={ticket.id}
                                                        value={ticket.id.toString()}
                                                    >
                                                        #{ticket.ticket_number}{' '}
                                                        - {ticket.title}
                                                    </option>
                                                ))}
                                            </select>
                                            {errors.ticket_id && (
                                                <p className="text-sm text-red-600">
                                                    {errors.ticket_id}
                                                </p>
                                            )}
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="parent_task_id">
                                                Parent Task(if any)
                                            </Label>
                                            <select
                                                value={
                                                    data.parent_task_id || ''
                                                }
                                                onChange={(e) =>
                                                    setData(
                                                        'parent_task_id',
                                                        e.target.value,
                                                    )
                                                }
                                                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                            >
                                                <option value="">
                                                    No parent task
                                                </option>
                                                {parentTasks.map((taskItem) => (
                                                    <option
                                                        key={taskItem.id}
                                                        value={taskItem.id.toString()}
                                                    >
                                                        {taskItem.task_code} -{' '}
                                                        {taskItem.title}
                                                    </option>
                                                ))}
                                            </select>
                                            {errors.parent_task_id && (
                                                <p className="text-sm text-red-600">
                                                    {errors.parent_task_id}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Task Type and SLA */}
                                    <div className="grid gap-4 md:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label htmlFor="task_type_id">
                                                Task Type
                                            </Label>
                                            <select
                                                value={data.task_type_id || ''}
                                                onChange={(e) =>
                                                    setData(
                                                        'task_type_id',
                                                        e.target.value,
                                                    )
                                                }
                                                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                            >
                                                <option value="">
                                                    No type
                                                </option>
                                                {taskTypes.map((taskType) => (
                                                    <option
                                                        key={taskType.id}
                                                        value={taskType.id.toString()}
                                                    >
                                                        {taskType.name} (
                                                        {taskType.code})
                                                    </option>
                                                ))}
                                            </select>
                                            {errors.task_type_id && (
                                                <p className="text-sm text-red-600">
                                                    {errors.task_type_id}
                                                </p>
                                            )}
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="sla_policy_id">
                                                SLA Policy
                                            </Label>
                                            <select
                                                value={data.sla_policy_id || ''}
                                                onChange={(e) =>
                                                    setData(
                                                        'sla_policy_id',
                                                        e.target.value,
                                                    )
                                                }
                                                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                            >
                                                <option value="">No SLA</option>
                                                {filteredSlaPolicies.map(
                                                    (policy) => (
                                                        <option
                                                            key={policy.id}
                                                            value={policy.id.toString()}
                                                        >
                                                            {policy.description}
                                                        </option>
                                                    ),
                                                )}
                                            </select>
                                            {errors.sla_policy_id && (
                                                <p className="text-sm text-red-600">
                                                    {errors.sla_policy_id}
                                                </p>
                                            )}
                                        </div>

                                        <div className="space-y-2 hidden">
                                            <div className="flex justify-between">
                                                <Label htmlFor="project_id">
                                                    Project
                                                </Label>
                                                <NewProject />
                                            </div>
                                            <select
                                                value={data.project_id || ''}
                                                onChange={(e) =>
                                                    setData(
                                                        'project_id',
                                                        e.target.value,
                                                    )
                                                }
                                                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                            >
                                                <option value="">
                                                    No project
                                                </option>
                                                {projects.map((project) => (
                                                    <option
                                                        key={project.id}
                                                        value={project.id.toString()}
                                                    >
                                                        {project.name}
                                                    </option>
                                                ))}
                                            </select>
                                            {errors.project_id && (
                                                <p className="text-sm text-red-600">
                                                    {errors.project_id}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Time and Progress */}
                                    <div className="grid gap-4 md:grid-cols-3">
                                        <div className="space-y-2">
                                            <Label htmlFor="start_at">
                                                Start Time
                                            </Label>
                                            <Input
                                                id="start_at"
                                                type="datetime-local"
                                                value={data.start_at}
                                                onChange={(e) =>
                                                    setData(
                                                        'start_at',
                                                        e.target.value,
                                                    )
                                                }
                                            />
                                            <p className="text-xs text-muted-foreground">
                                                When the task work will begin
                                            </p>
                                            {errors.start_at && (
                                                <p className="text-sm text-red-600">
                                                    {errors.start_at}
                                                </p>
                                            )}
                                        </div>

                                        <TaskDurationPicker
                                            id="estimate_hours"
                                            label="Estimated Duration"
                                            value={data.estimate_hours}
                                            onChange={(value) =>
                                                setData('estimate_hours', value)
                                            }
                                            required
                                            error={errors.estimate_hours}
                                            helperText="Choose a duration using days, hours, and minutes."
                                        />

                                        <div className="space-y-2">
                                            <Label htmlFor="due_at">
                                                Due Date
                                            </Label>
                                            <Input
                                                id="due_at"
                                                type="datetime-local"
                                                value={data.due_at}
                                                onChange={(e) =>
                                                    setData(
                                                        'due_at',
                                                        e.target.value,
                                                    )
                                                }
                                                min={minDueDate}
                                            />
                                            {data.estimate_hours &&
                                                parseFloat(
                                                    data.estimate_hours,
                                                ) > 0 && (
                                                    <p className="text-sm text-muted-foreground">
                                                        {loadingMinDueDate ? (
                                                            <span className="flex items-center gap-1">
                                                                <Loader2 className="h-3 w-3 animate-spin" />
                                                                Calculating...
                                                            </span>
                                                        ) : (
                                                            `Min due date based on ${data.estimate_hours} hours from start: ${minDueDate ? new Date(minDueDate).toLocaleString() : 'N/A'}`
                                                        )}
                                                    </p>
                                                )}
                                            {errors.due_at && (
                                                <p className="text-sm text-red-600">
                                                    {errors.due_at}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="tags">Tags</Label>
                                        <Input
                                            id="tags"
                                            value={
                                                Array.isArray(data.tags)
                                                    ? data.tags.join(', ')
                                                    : ''
                                            }
                                            onChange={(e) =>
                                                setData(
                                                    'tags',
                                                    e.target.value
                                                        .split(',')
                                                        .map((tag) =>
                                                            tag.trim(),
                                                        ),
                                                )
                                            }
                                            placeholder="Enter tags separated by commas (e.g., frontend, bug, enhancement)"
                                        />
                                        {errors.tags && (
                                            <p className="text-sm text-red-600">
                                                {errors.tags}
                                            </p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="metadata">
                                            Metadata
                                        </Label>
                                        <Textarea
                                            id="metadata"
                                            value={data.metadata}
                                            onChange={(e) =>
                                                setData(
                                                    'metadata',
                                                    e.target.value,
                                                )
                                            }
                                            placeholder='Enter metadata as JSON (e.g., {"custom_field": "value"})'
                                            rows={3}
                                        />
                                        {errors.metadata && (
                                            <p className="text-sm text-red-600">
                                                {errors.metadata}
                                            </p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="completion_notes">
                                            Completion Notes
                                        </Label>
                                        <Textarea
                                            id="completion_notes"
                                            value={data.completion_notes}
                                            onChange={(e) =>
                                                setData(
                                                    'completion_notes',
                                                    e.target.value,
                                                )
                                            }
                                            placeholder="Enter completion notes (optional)"
                                            rows={3}
                                        />
                                        {errors.completion_notes && (
                                            <p className="text-sm text-red-600">
                                                {errors.completion_notes}
                                            </p>
                                        )}
                                    </div>

                                    {/* File Attachments */}
                                    <TaskAttachments
                                        attachments={data.attachments}
                                        setAttachments={(files) =>
                                            setData('attachments', files)
                                        }
                                        errors={errors.attachments}
                                    />

                                    {/* Submit Button */}
                                    <div className="flex justify-end space-x-2">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() =>
                                                window.history.back()
                                            }
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            type="submit"
                                            disabled={processing}
                                        >
                                            {processing ? (
                                                <div className="flex items-center gap-2">
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                    Updating...
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2">
                                                    <Save className="h-4 w-4" />
                                                    Update Task
                                                </div>
                                            )}
                                        </Button>
                                    </div>
                                </form>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Task Info Card */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Task Information</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-2">
                                        <Code className="h-4 w-4 text-muted-foreground" />
                                        <span className="text-sm text-muted-foreground">
                                            Task Code
                                        </span>
                                    </div>
                                    <span className="text-sm font-medium">
                                        {data.task_code || 'Not assigned'}
                                    </span>
                                </div>

                                <Separator />

                                {data.sla_policy_id && (
                                    <>
                                        <Separator />
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center space-x-2">
                                                <Info className="h-4 w-4 text-muted-foreground" />
                                                <span className="text-sm text-muted-foreground">
                                                    SLA Policy
                                                </span>
                                            </div>
                                            <Badge variant="default">
                                                {filteredSlaPolicies.find(
                                                    (p) =>
                                                        p.id.toString() ===
                                                        data.sla_policy_id,
                                                )?.name || 'Selected'}
                                            </Badge>
                                        </div>
                                    </>
                                )}
                            </CardContent>
                        </Card>

                        {/* Quick Tips */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Tips</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="flex items-start space-x-2">
                                    <FileText className="mt-0.5 h-4 w-4 text-muted-foreground" />
                                    <div className="text-sm">
                                        <p className="font-medium">Task Code</p>
                                        <p className="text-muted-foreground">
                                            Use the generate button to create a
                                            unique task code automatically.
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start space-x-2">
                                    <Calendar className="mt-0.5 h-4 w-4 text-muted-foreground" />
                                    <div className="text-sm">
                                        <p className="font-medium">Due Dates</p>
                                        <p className="text-muted-foreground">
                                            Setting due dates helps track task
                                            completion and deadlines.
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start space-x-2">
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Info className="mt-0.5 h-4 w-4 cursor-help text-muted-foreground" />
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                SLA policies define response and
                                                resolution time requirements for
                                                different task types and
                                                priorities.
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                    <div className="text-sm">
                                        <p className="font-medium">
                                            SLA Policies
                                        </p>
                                        <p className="text-muted-foreground">
                                            Choose appropriate SLA policies
                                            based on task urgency and
                                            requirements.
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}

const NewProject: React.FC = () => {
    const handleSubmit = (e: React.MouseEvent<HTMLButtonElement>) => {
        // stop propagation, prevent default
        e.stopPropagation();
        e.preventDefault();
        //
        alert('new project ');
        //
    };

    return (
        <>
            <button onClick={(e) => handleSubmit(e)}>New Project</button>
            {/* modal */}
        </>
    );
};

interface TaskAttachmentsProps {
    attachments: File[];
    setAttachments: (files: File[]) => void;
    errors?: string;
}

const TaskAttachments: React.FC<TaskAttachmentsProps> = ({
    attachments,
    setAttachments,
    errors,
}) => {
    const [isDragging, setIsDragging] = useState(false);
    const [validationError, setValidationError] = useState<string | null>(null);

    // Allowed file types: documents and images
    const allowedDocumentTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'text/plain',
        'text/csv',
    ];

    const allowedImageTypes = [
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
        'image/svg+xml',
    ];

    const isFileTypeValid = (file: File): boolean => {
        return (
            allowedDocumentTypes.includes(file.type) ||
            allowedImageTypes.includes(file.type)
        );
    };

    const handleDragEnter = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        setValidationError(null);

        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            const newFiles = Array.from(e.dataTransfer.files);

            // Check for invalid file types
            const invalidFiles = newFiles.filter(
                (file) => !isFileTypeValid(file),
            );
            if (invalidFiles.length > 0) {
                setValidationError(
                    'Only document and image files are allowed.',
                );
                return;
            }

            const uniqueNewFiles = newFiles.filter(
                (newFile) =>
                    !attachments.some(
                        (existingFile) =>
                            existingFile.name === newFile.name &&
                            existingFile.size === newFile.size,
                    ),
            );
            setAttachments([...attachments, ...uniqueNewFiles]);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newFiles = Array.from(e.target.files);

            // Check for invalid file types
            const invalidFiles = newFiles.filter(
                (file) => !isFileTypeValid(file),
            );
            if (invalidFiles.length > 0) {
                setValidationError(
                    'Only document and image files are allowed.',
                );
                return;
            }

            const uniqueNewFiles = newFiles.filter(
                (newFile) =>
                    !attachments.some(
                        (existingFile) =>
                            existingFile.name === newFile.name &&
                            existingFile.size === newFile.size,
                    ),
            );
            setAttachments([...attachments, ...uniqueNewFiles]);
        }
    };

    const removeFile = (index: number) => {
        const updatedAttachments = [...attachments];
        updatedAttachments.splice(index, 1);
        setAttachments(updatedAttachments);
    };

    return (
        <div className="space-y-2">
            <Label htmlFor="attachments">Attachments</Label>
            <div
                className={`rounded-lg border-2 border-dashed p-6 text-center ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}`}
                onDragEnter={handleDragEnter}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
            >
                <input
                    id="attachments"
                    type="file"
                    multiple
                    accept={
                        '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.jpg,.jpeg,.png,.gif,.webp,.svg'
                    }
                    onChange={handleFileChange}
                    className="hidden"
                />
                <label htmlFor="attachments" className="cursor-pointer">
                    <div className="flex flex-col items-center justify-center">
                        <svg
                            className="mb-2 h-8 w-8 text-gray-500"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"
                            ></path>
                        </svg>
                        <span className="text-sm text-gray-600">
                            Click to upload files or drag and drop
                        </span>
                        <span className="text-xs text-gray-500">
                            Max file size: 10MB per file
                        </span>
                    </div>
                </label>
            </div>
            {attachments.length > 0 && (
                <div className="mt-2 space-y-1">
                    {attachments.map((file, index) => (
                        <div
                            key={index}
                            className="flex items-center justify-between rounded bg-gray-50 p-2"
                        >
                            <div className="flex items-center space-x-2">
                                <FileText className="h-4 w-4 text-gray-500" />
                                <span className="max-w-[200px] truncate text-sm text-gray-700">
                                    {file.name}
                                </span>
                            </div>
                            <div className="flex items-center space-x-2">
                                <span className="text-xs text-gray-500">
                                    {(file.size / 1024).toFixed(1)} KB
                                </span>
                                <button
                                    type="button"
                                    onClick={() => removeFile(index)}
                                    className="text-red-500 hover:text-red-700"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
            {validationError && (
                <p className="text-sm text-red-600">{validationError}</p>
            )}
            {errors && <p className="text-sm text-red-600">{errors}</p>}
        </div>
    );
};
