import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { useForm } from '@inertiajs/react';
import axios from 'axios';
import {
    ArrowLeft,
    Save,
    Ticket as TicketIcon,
    AlertCircle,
    Calendar,
    User,
    Users,
    Building2,
    Code,
    FileText,
    Loader2,
    Info,
    X,
    UserPlus
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';
import { FiRefreshCcw } from "react-icons/fi";
import UserAssignmentForm from '@/components/UserAssignmentForm';
import { useDisclosure } from '@mantine/hooks';
import { Modal } from '@mantine/core';

interface TasksCreateProps {
    tickets: Array<{ id: number; ticket_number: string; title: string }>;
    parentTasks: Array<{ id: number; task_code: string; title: string }>;
    taskTypes: Array<{ id: number; name: string; code: string; description?: string }>;
    slaPolicies: Array<{ id: number; name: string; priority: string; description?: string; response_time_minutes: number; resolution_time_minutes: number }>;
    projects: Array<{ id: number; name: string }>;
    departments: Array<{ id: number; name: string }>;
    managers: Array<{ id: number; name: string }>;
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
        title: 'Create Task',
        href: '#',
    },
];

export default function TasksCreate({ tickets, parentTasks, taskTypes, slaPolicies, projects, departments, managers }: TasksCreateProps) {
    const today = new Date().toLocaleString("sv-SE", {
        timeZone: "Asia/Kolkata",
        hour12: false
    }).slice(0, 16);

    const { data, setData, processing, errors } = useForm({
        title: '',
        description: '',
        task_code: '',
        ticket_id: '',
        parent_task_id: '',
        task_type_id: '',
        sla_policy_id: '',
        project_id: '',
        state: 'Draft',
        start_at: today,
        due_at: today, // Default due_at to same as start_at, will be updated based on estimate_hours
        completed_at: '',
        estimate_hours: '',
        tags: [] as string[],
        version: 1,
        metadata: '',
        completion_notes: '',
        attachments: [] as File[],
    });

    // State for advanced options toggle
    const [showAdvanced, setShowAdvanced] = useState(false);

    // State for minimum due date calculation
    const [minDueDate, setMinDueDate] = useState<string>(today);
    const [loadingMinDueDate, setLoadingMinDueDate] = useState(false);

    // Calculate minimum due date based on estimated hours using API
    const fetchMinDueDate = async (estimateHours?: string, startAt?: string) => {
        const hours = parseFloat(estimateHours || '0');
        if (!hours || hours <= 0) {
            const baseDate = startAt ? new Date(startAt) : new Date();
            const now = baseDate.toISOString().slice(0, 16);
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
                const minDate = res.data.data.min_due_date.slice(0, 16);
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
            const minDate = fallbackDate.toISOString().slice(0, 16);
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

    // State to track if ProjectWork task type is selected
    const [showProjectSelect, setShowProjectSelect] = useState(false);

    // Effect to filter SLA policies and check task type when task type changes
    useEffect(() => {
        if (data.task_type_id) {
            fetch(`/admin/tasks/sla-policies/${data.task_type_id}`)
                .then(response => response.json())
                .then(result => {
                    setFilteredSlaPolicies(result.sla_policies || []);
                })
                .catch(error => {
                    console.error('Error fetching SLA policies:', error);
                    setFilteredSlaPolicies(slaPolicies);
                });

            // Check if the selected task type is ProjectWork
            const selectedTaskType = taskTypes.find(type => type.id.toString() === data.task_type_id);
            if (selectedTaskType && selectedTaskType.code === 'ProjectWork') {
                setShowProjectSelect(true);
            } else {
                setShowProjectSelect(false);
            }
        } else {
            setFilteredSlaPolicies([]);
            setShowProjectSelect(false);
        }
    }, [data.task_type_id, slaPolicies, taskTypes]);


    const [generatedTaskCode, setGeneratedTaskCode] = useState('');

    const generateTaskCode = () => {
        const prefix = 'TASK';
        const timestamp = Date.now().toString().slice(-6);
        const random = Math.random().toString(36).substr(2, 3).toUpperCase();
        const code = `${prefix}-${timestamp}-${random}`;
        setGeneratedTaskCode(code);
        setData('task_code', code);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Prepare metadata for multiple users assignment
        let metadataObj = {};
        if (data.metadata) {
            try {
                metadataObj = JSON.parse(data.metadata);
            } catch (error) {
                console.error('Invalid JSON in metadata:', error);
                metadataObj = {};
            }
        }

        // Convert frontend special values to null for backend compatibility
        const formData = new FormData();

        // Add all form fields
        formData.append('title', data.title);
        formData.append('description', data.description);
        formData.append('task_code', data.task_code);
        formData.append('ticket_id', data.ticket_id === 'none' ? '' : (data.ticket_id || ''));
        formData.append('parent_task_id', data.parent_task_id === 'no-parent' ? '' : (data.parent_task_id || ''));
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
            const response = await axios.post('/admin/tasks', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'Accept': 'application/json'
                }
            });

            console.log("Task created successfully!", response.data);

            // Redirect to the newly created task
            window.location.href = `/admin/tasks/${response.data.task.id}`;

        } catch (err) {
            console.error("Error creating task:", err);
            if (axios.isAxiosError(err) && err.response) {
                console.error("Server errors:", err.response.data.errors || err.response.data.message);
            }
            generateTaskCode();
        }
    };

    useEffect(() => {
        generateTaskCode();
    }, [])

    useEffect(() => {
        if (typeof window === 'undefined') {
            return;
        }
        const preselectedProjectId = new URLSearchParams(window.location.search).get('project_id');
        if (preselectedProjectId) {
            setData('project_id', preselectedProjectId);
        }
    }, [setData]);


    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Create Task" />

            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto p-6">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <Link href="/admin/tasks">
                        <Button variant="outline" size="sm">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Tasks
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Create New Task</h1>
                        <p className="text-muted-foreground">
                            Fill in the details to create a new task
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
                                    Enter the basic information for this task
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    {/* Task Information */}
                                    <div className="space-y-2">
                                        <Label htmlFor="task_code">Task Code</Label>
                                        <div className="flex gap-2 items-center">
                                            <Input
                                                id="task_code"
                                                value={data.task_code}
                                                onChange={(e) => setData('task_code', e.target.value)}
                                                placeholder="Enter task code or generate one"
                                                className="flex-1"
                                                readOnly
                                            />

                                            <FiRefreshCcw onClick={() => generateTaskCode()} />
                                        </div>
                                        {generatedTaskCode && (
                                            <p className="text-sm text-muted-foreground">
                                                Generated: {generatedTaskCode}
                                            </p>
                                        )}
                                        {errors.task_code && (
                                            <p className="text-sm text-red-600">{errors.task_code}</p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="title">Task Title</Label>
                                        <Input
                                            id="title"
                                            value={data.title}
                                            onChange={(e) => setData('title', e.target.value)}
                                            placeholder="Enter task title"
                                        />
                                        {errors.title && (
                                            <p className="text-sm text-red-600">{errors.title}</p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="description">Description</Label>
                                        <Textarea
                                            id="description"
                                            value={data.description}
                                            onChange={(e) => setData('description', e.target.value)}
                                            placeholder="Enter task description"
                                            rows={4}
                                        />
                                        {errors.description && (
                                            <p className="text-sm text-red-600">{errors.description}</p>
                                        )}
                                    </div>

                                    {/* Time and Progress - Basic Fields */}
                                    <div className="grid gap-4 md:grid-cols-3">
                                        <div className="space-y-2">
                                            <Label htmlFor="start_at">Start Time</Label>
                                            <Input
                                                id="start_at"
                                                type="datetime-local"
                                                value={data.start_at}
                                                onChange={(e) => setData('start_at', e.target.value)}
                                            />
                                            <p className="text-xs text-muted-foreground">
                                                When the task work will begin
                                            </p>
                                            {errors.start_at && (
                                                <p className="text-sm text-red-600">{errors.start_at}</p>
                                            )}
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="estimate_hours">Estimated Hours</Label>
                                            <Input
                                                id="estimate_hours"
                                                type="number"
                                                step="0.5"
                                                value={data.estimate_hours || ''}
                                                onChange={(e) => setData('estimate_hours', e.target.value)}
                                                placeholder="Enter estimated hours"
                                                required
                                            />
                                            {errors.estimate_hours && (
                                                <p className="text-sm text-red-600">{errors.estimate_hours}</p>
                                            )}
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="due_at">Due Date</Label>
                                            <Input
                                                id="due_at"
                                                type="datetime-local"
                                                value={data.due_at}
                                                onChange={(e) => setData('due_at', e.target.value)}
                                                min={minDueDate}
                                            />
                                            {data.estimate_hours && parseFloat(data.estimate_hours) > 0 && (
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
                                                <p className="text-sm text-red-600">{errors.due_at}</p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Advanced Options Toggle */}
                                    <div className="flex items-center space-x-2 py-2">
                                        <input
                                            type="checkbox"
                                            id="showAdvanced"
                                            checked={showAdvanced}
                                            onChange={(e) => setShowAdvanced(e.target.checked)}
                                            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                        />
                                        <Label htmlFor="showAdvanced" className="text-sm font-medium cursor-pointer">
                                            Show Advanced Options
                                        </Label>
                                    </div>

                                    {/* Advanced Fields */}
                                    {showAdvanced && (
                                    <div className="space-y-4">
                                        {/* Task Relationships */}
                                        <div className="grid gap-4 md:grid-cols-2">
                                            <div className="space-y-2">
                                                <Label htmlFor="ticket_id">Related Ticket(if any)</Label>
                                                <select
                                                    value={data.ticket_id || ''}
                                                    onChange={(e) => setData('ticket_id', e.target.value)}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                >
                                                    <option value="">No ticket</option>
                                                    {tickets.map((ticket) => (
                                                        <option key={ticket.id} value={ticket.id.toString()}>
                                                            #{ticket.ticket_number} - {ticket.title}
                                                        </option>
                                                    ))}
                                                </select>
                                                {errors.ticket_id && (
                                                    <p className="text-sm text-red-600">{errors.ticket_id}</p>
                                                )}
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="parent_task_id">Parent Task(if any)</Label>
                                                <select
                                                    value={data.parent_task_id || ''}
                                                    onChange={(e) => setData('parent_task_id', e.target.value)}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                >
                                                    <option value="">No parent task</option>
                                                    {parentTasks.map((task) => (
                                                        <option key={task.id} value={task.id.toString()}>
                                                            {task.task_code} - {task.title}
                                                        </option>
                                                    ))}
                                                </select>
                                                {errors.parent_task_id && (
                                                    <p className="text-sm text-red-600">{errors.parent_task_id}</p>
                                                )}
                                            </div>
                                        </div>

                                        {/* Task Type and SLA */}
                                        <div className="grid gap-4 md:grid-cols-2">
                                            <div className="space-y-2">
                                                <Label htmlFor="task_type_id">Task Type</Label>
                                                <select
                                                    value={data.task_type_id || ''}
                                                    onChange={(e) => setData('task_type_id', e.target.value)}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                >
                                                    <option value="">No type</option>
                                                    {taskTypes.map((taskType) => (
                                                        <option key={taskType.id} value={taskType.id.toString()}>
                                                            {taskType.name} ({taskType.code})
                                                        </option>
                                                    ))}
                                                </select>
                                                {errors.task_type_id && (
                                                    <p className="text-sm text-red-600">{errors.task_type_id}</p>
                                                )}
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="sla_policy_id">SLA Policy</Label>
                                                <select
                                                    value={data.sla_policy_id || ''}
                                                    onChange={(e) => setData('sla_policy_id', e.target.value)}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                >
                                                    <option value="">No SLA</option>
                                                    {filteredSlaPolicies.map((policy) => (
                                                        <option key={policy.id} value={policy.id.toString()}>
                                                            {policy.description}
                                                        </option>
                                                    ))}
                                                </select>
                                                {errors.sla_policy_id && (
                                                    <p className="text-sm text-red-600">{errors.sla_policy_id}</p>
                                                )}
                                            </div>
                                        </div>

                                        {/* Tags */}
                                        <div className="space-y-2">
                                            <Label htmlFor="tags">Tags</Label>
                                            <Input
                                                id="tags"
                                                value={Array.isArray(data.tags) ? data.tags.join(', ') : ''}
                                                onChange={(e) => setData('tags', e.target.value.split(',').map(tag => tag.trim()))}
                                                placeholder="Enter tags separated by commas (e.g., frontend, bug, enhancement)"
                                            />
                                            {errors.tags && (
                                                <p className="text-sm text-red-600">{errors.tags}</p>
                                            )}
                                        </div>

                                        {/* Metadata */}
                                        <div className="space-y-2">
                                            <Label htmlFor="metadata">Metadata</Label>
                                            <Textarea
                                                id="metadata"
                                                value={data.metadata}
                                                onChange={(e) => setData('metadata', e.target.value)}
                                                placeholder='Enter metadata as JSON (e.g., {"custom_field": "value"})'
                                                rows={3}
                                            />
                                            {errors.metadata && (
                                                <p className="text-sm text-red-600">{errors.metadata}</p>
                                            )}
                                        </div>

                                        {/* Completion Notes */}
                                        <div className="space-y-2">
                                            <Label htmlFor="completion_notes">Completion Notes</Label>
                                            <Textarea
                                                id="completion_notes"
                                                value={data.completion_notes}
                                                onChange={(e) => setData('completion_notes', e.target.value)}
                                                placeholder="Enter completion notes (optional)"
                                                rows={3}
                                            />
                                            {errors.completion_notes && (
                                                <p className="text-sm text-red-600">{errors.completion_notes}</p>
                                            )}
                                        </div>

                                        {/* File Attachments */}
                                        <TaskAttachments
                                            attachments={data.attachments}
                                            setAttachments={(files) => setData('attachments', files)}
                                            errors={errors.attachments}
                                        />
                                    </div>
                                    )} {/* End Advanced Fields */}



                                    {/* Submit Button */}
                                    <div className="flex justify-end space-x-2">
                                        <Button type="button" variant="outline" onClick={() => window.history.back()}>
                                            Cancel
                                        </Button>
                                        <Button type="submit" disabled={processing}>
                                            {processing ? (
                                                <div className="flex items-center gap-2">
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                    Creating...
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2">
                                                    <Save className="h-4 w-4" />
                                                    Create Task
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
                                        <span className="text-sm text-muted-foreground">Task Code</span>
                                    </div>
                                    <span className="text-sm font-medium">
                                        {data.task_code || 'Not assigned'}
                                    </span>
                                </div>

                                <Separator />

                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-2">
                                        <TicketIcon className="h-4 w-4 text-muted-foreground" />
                                        <span className="text-sm text-muted-foreground">Status</span>
                                    </div>
                                    <Badge variant={data.state === 'Draft' ? "outline" : "default"} className="capitalize">
                                        {data.state || 'Draft'}
                                    </Badge>
                                </div>


                                {data.sla_policy_id && (
                                    <>
                                        <Separator />
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center space-x-2">
                                                <Info className="h-4 w-4 text-muted-foreground" />
                                                <span className="text-sm text-muted-foreground">SLA Policy</span>
                                            </div>
                                            <Badge variant="default">
                                                {filteredSlaPolicies.find(p => p.id.toString() === data.sla_policy_id)?.name || 'Selected'}
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
                                    <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                                    <div className="text-sm">
                                        <p className="font-medium">Task Code</p>
                                        <p className="text-muted-foreground">Use the generate button to create a unique task code automatically.</p>
                                    </div>
                                </div>

                                <div className="flex items-start space-x-2">
                                    <UserPlus className="h-4 w-4 text-muted-foreground mt-0.5" />
                                    <div className="text-sm">
                                        <p className="font-medium">Task Assignment</p>
                                        <p className="text-muted-foreground">Assign users to this task directly during creation.</p>
                                    </div>
                                </div>

                                <div className="flex items-start space-x-2">
                                    <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                                    <div className="text-sm">
                                        <p className="font-medium">Due Dates</p>
                                        <p className="text-muted-foreground">Setting due dates helps track task completion and deadlines.</p>
                                    </div>
                                </div>

                                <div className="flex items-start space-x-2">
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Info className="h-4 w-4 text-muted-foreground mt-0.5 cursor-help" />
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                SLA policies define response and resolution time requirements for different task types and priorities.
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                    <div className="text-sm">
                                        <p className="font-medium">SLA Policies</p>
                                        <p className="text-muted-foreground">Choose appropriate SLA policies based on task urgency and requirements.</p>
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



const NewProject: React.FC<{ departments: Array<{ id: number; name: string }>; managers: Array<{ id: number; name: string }> }> = ({ departments, managers }) => {

    const [opened, { open, close }] = useDisclosure(false);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        department_id: '',
        manager_id: '',
        status: 'active',
        start_date: '',
        end_date: ''
    });

    const handleInputChange = (e: any) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: any) => {
        e.stopPropagation();
        e.preventDefault();
        axios.post('/admin/projects', formData)
            .then(res => {
                console.log("Project created successfully!", res.data);
                close();
                window.location.reload();
            })
            .catch(err => {
                console.error("Error creating project:", err);
            });
    };

    return (
        <>
            <button onClick={open} className="text-sm text-blue-600 hover:underline">New Project</button>
            <Modal
                opened={opened}
                onClose={close}
                title="Create New Project"
                size="lg"
            >
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Project Name</Label>
                        <Input
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleInputChange}
                            placeholder="Enter project name"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                            id="description"
                            name="description"
                            value={formData.description}
                            onChange={handleInputChange}
                            placeholder="Enter project description"
                            rows={3}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="department_id">Department</Label>
                        <select
                            id="department_id"
                            name="department_id"
                            value={formData.department_id}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        >
                            <option value="">Select Department</option>
                            {departments.map((department) => (
                                <option key={department.id} value={department.id.toString()}>
                                    {department.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="manager_id">Manager</Label>
                        <select
                            id="manager_id"
                            name="manager_id"
                            value={formData.manager_id}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">Select Manager</option>
                            {managers.map((manager) => (
                                <option key={manager.id} value={manager.id.toString()}>
                                    {manager.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="status">Status</Label>
                        <select
                            id="status"
                            name="status"
                            value={formData.status}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="planning">Planning</option>
                            <option value="active">Active</option>
                            <option value="on_hold">On Hold</option>
                            <option value="completed">Completed</option>
                            <option value="cancelled">Cancelled</option>
                        </select>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="start_date">Start Date</Label>
                            <Input
                                id="start_date"
                                name="start_date"
                                type="date"
                                value={formData.start_date}
                                onChange={handleInputChange}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="end_date">End Date</Label>
                            <Input
                                id="end_date"
                                name="end_date"
                                type="date"
                                value={formData.end_date}
                                onChange={handleInputChange}
                            />
                        </div>
                    </div>

                    <div className="flex justify-end space-x-2 pt-4">
                        <Button type="button" variant="outline" onClick={close}>
                            Cancel
                        </Button>
                        <Button onClick={handleSubmit} className="bg-blue-600 hover:bg-blue-700">
                            Create Project
                        </Button>
                    </div>
                </div>
            </Modal>
        </>
    );
}



interface TaskAttachmentsProps {
    attachments: File[];
    setAttachments: (files: File[]) => void;
    errors?: string;
}

const TaskAttachments: React.FC<TaskAttachmentsProps> = ({ attachments, setAttachments, errors }) => {
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
        'text/csv'
    ];

    const allowedImageTypes = [
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
        'image/svg+xml'
    ];

    const isFileTypeValid = (file: File): boolean => {
        return allowedDocumentTypes.includes(file.type) || allowedImageTypes.includes(file.type);
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
            const invalidFiles = newFiles.filter(file => !isFileTypeValid(file));
            if (invalidFiles.length > 0) {
                setValidationError('Only document and image files are allowed.');
                return;
            }

            const uniqueNewFiles = newFiles.filter(newFile =>
                !attachments.some(existingFile =>
                    existingFile.name === newFile.name && existingFile.size === newFile.size
                )
            );
            setAttachments([...attachments, ...uniqueNewFiles]);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newFiles = Array.from(e.target.files);

            // Check for invalid file types
            const invalidFiles = newFiles.filter(file => !isFileTypeValid(file));
            if (invalidFiles.length > 0) {
                setValidationError('Only document and image files are allowed.');
                return;
            }

            const uniqueNewFiles = newFiles.filter(newFile =>
                !attachments.some(existingFile =>
                    existingFile.name === newFile.name && existingFile.size === newFile.size
                )
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
                className={`border-2 border-dashed rounded-lg p-6 text-center ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}`}
                onDragEnter={handleDragEnter}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
            >
                <input
                    id="attachments"
                    type="file"
                    multiple
                    accept={".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.jpg,.jpeg,.png,.gif,.webp,.svg"}
                    onChange={handleFileChange}
                    className="hidden"
                />
                <label htmlFor="attachments" className="cursor-pointer">
                    <div className="flex flex-col items-center justify-center">
                        <svg className="w-8 h-8 mb-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"></path>
                        </svg>
                        <span className="text-sm text-gray-600">Click to upload files or drag and drop</span>
                        <span className="text-xs text-gray-500">Max file size: 10MB per file</span>
                    </div>
                </label>
            </div>
            {attachments.length > 0 && (
                <div className="mt-2 space-y-1">
                    {attachments.map((file, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <div className="flex items-center space-x-2">
                                <FileText className="h-4 w-4 text-gray-500" />
                                <span className="text-sm text-gray-700 truncate max-w-[200px]">{file.name}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                                <span className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB</span>
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
            {errors && (
                <p className="text-sm text-red-600">{errors}</p>
            )}
        </div>
    );
};
