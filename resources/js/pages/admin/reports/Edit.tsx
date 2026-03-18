import { useState, useEffect } from 'react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import TiptapEditor from '@/components/ui/TiptapEditor';
import { ArrowLeft, Clock, Save, X } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

interface ReportAttachment {
    id: number;
    file_name: string;
    file_path: string;
    file_type: string;
    file_size: number;
    metadata: any;
}

interface TaskTimeEntry {
    id: number;
    start_time: string;
    end_time: string;
    description: string;
    working_duration?: number;
}

interface Task {
    id: number;
    title: string;
    task_code: string;
    description: string;
    state: string;
    time_entries: TaskTimeEntry[];
    estimate_hours?: string;
    project_id?: number;
    department_id?: number;
    pivot?: {
        remarks?: string;
    };
    total_working_seconds?: number;
}

interface Report {
    id: number;
    user_id: number;
    user: { id: number; name: string };
    report_date: string;
    title: string;
    description: string;
    total_hours: number;
    status: string;
    created_at: string;
    metadata?: {
        time_spent?: string;
    };
    tasks: Task[];
    attachments: ReportAttachment[];
}

interface ReportEditProps {
    report: Report;
    authUser: { id: number; name: string };
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Admin',
        href: '/admin/dashboard',
    },
    {
        title: 'Reports',
        href: '/admin/reports',
    },
    {
        title: 'Edit Report',
        href: '#',
    },
];

export default function ReportEdit(props: ReportEditProps) {
    const { report, authUser } = props;
    
    const [formData, setFormData] = useState({
        title: report.title,
        description: report.description || '',
    });
    
    const [taskRemarks, setTaskRemarks] = useState<Record<number, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);
    
    // Initialize task remarks from existing data
    useEffect(() => {
        const initialRemarks: Record<number, string> = {};
        report.tasks.forEach((task) => {
            initialRemarks[task.id] = task.pivot?.remarks || '';
        });
        setTaskRemarks(initialRemarks);
    }, [report.tasks]);

    // Strip HTML tags for comparison
    const stripHtml = (html: string): string => {
        const tmp = document.createElement('div');
        tmp.innerHTML = html;
        return tmp.textContent || tmp.innerText || '';
    };

    // Track changes
    useEffect(() => {
        const titleChanged = formData.title !== report.title;
        const descriptionChanged = stripHtml(formData.description) !== stripHtml(report.description || '');
        const remarksChanged = Object.keys(taskRemarks).some(
            (taskId) => stripHtml(taskRemarks[parseInt(taskId)]) !== stripHtml(report.tasks.find(t => t.id === parseInt(taskId))?.pivot?.remarks || '')
        );
        
        setHasChanges(titleChanged || descriptionChanged || remarksChanged);
    }, [formData, taskRemarks, report]);

    const formatSeconds = (seconds: number): string => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const getStateColor = (state: string): string => {
        const stateColors: Record<string, string> = {
            'InProgress': 'bg-blue-100 text-blue-800',
            'Completed': 'bg-green-100 text-green-800',
            'Pending': 'bg-yellow-100 text-yellow-800',
            'OnHold': 'bg-gray-100 text-gray-800',
            'Cancelled': 'bg-red-100 text-red-800',
        };
        return stateColors[state] || 'bg-gray-100 text-gray-800';
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleTaskRemarkChange = (taskId: number, value: string) => {
        setTaskRemarks(prev => ({ ...prev, [taskId]: value }));
    };

    const handleSubmit = async () => {
        if (!hasChanges) {
            toast.info('No changes to save');
            return;
        }

        setIsSubmitting(true);
        
        try {
            await axios.patch(`/admin/api/reports/${report.id}`, {
                title: formData.title,
                description: formData.description,
                tasks_remarks: taskRemarks,
            });
            
            toast.success('Report updated successfully');
            router.visit(`/admin/reports/${report.id}`);
        } catch (error: any) {
            console.error('Error updating report:', error);
            toast.error(error.response?.data?.error || 'Failed to update report');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCancel = () => {
        if (hasChanges) {
            if (window.confirm('You have unsaved changes. Are you sure you want to leave?')) {
                router.visit(`/admin/reports/${report.id}`);
            }
        } else {
            router.visit(`/admin/reports/${report.id}`);
        }
    };

    const totalTimeSpent = (): string => {
        if (report.tasks && report.tasks.length > 0) {
            const totalSeconds = report.tasks.reduce((acc, task) => {
                if (task.total_working_seconds) {
                    return acc + task.total_working_seconds;
                }
                const taskSeconds = task.time_entries?.reduce((entryAcc, entry) => {
                    const start = new Date(entry.start_time).getTime();
                    const end = new Date(entry.end_time).getTime();
                    return entryAcc + (end - start);
                }, 0) / 1000 || 0;
                return acc + taskSeconds;
            }, 0);
            return formatSeconds(totalSeconds);
        }
        return formatSeconds(report.total_hours * 3600);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit: ${report.title}`} />

            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto p-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleCancel}
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Back
                        </Button>
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight">Edit Report</h1>
                            <p className="text-muted-foreground">
                                Update your daily report
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleCancel}
                            disabled={isSubmitting}
                        >
                            <X className="h-4 w-4" />
                            Cancel
                        </Button>
                        <Button
                            size="sm"
                            onClick={handleSubmit}
                            disabled={isSubmitting || !hasChanges}
                        >
                            <Save className="h-4 w-4" />
                            {isSubmitting ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-3">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Report Information */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Report Details</CardTitle>
                                <CardDescription>
                                    {new Date(report.report_date).toLocaleDateString('en-US', {
                                        weekday: 'long',
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric',
                                    })}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center gap-4">
                                    <div className="text-sm text-muted-foreground">
                                        Reported by{' '}
                                        <span className="font-semibold text-foreground">
                                            {report.user?.name || 'N/A'}
                                        </span>
                                    </div>
                                    <Badge className={
                                        report.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                                        report.status === 'submitted' ? 'bg-blue-100 text-blue-800' :
                                        'bg-green-100 text-green-800'
                                    }>
                                        {report.status}
                                    </Badge>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <label htmlFor="title" className="text-sm font-medium text-gray-700 mb-2 block">
                                            Title *
                                        </label>
                                        <input
                                            type="text"
                                            id="title"
                                            name="title"
                                            value={formData.title}
                                            onChange={handleInputChange}
                                            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <Label htmlFor="description" className="text-sm font-medium text-gray-700 mb-2 block">
                                            Description
                                        </Label>
                                        <TiptapEditor
                                            content={formData.description}
                                            onChange={(value) => setFormData(prev => ({ ...prev, description: value }))}
                                            placeholder="Describe what you worked on today"
                                            className="bg-white rounded-md min-h-[120px]"
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Tasks Details with Editable Remarks */}
                        {report.tasks && report.tasks.length > 0 && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">Connected Tasks</CardTitle>
                                    <CardDescription>
                                        {report.tasks.length} task{report.tasks.length > 1 ? 's' : ''} reported • Total: {totalTimeSpent()}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        {report.tasks.map((task) => (
                                            <div key={task.id} className="border rounded-lg p-4">
                                                <div className="flex justify-between items-start">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2">
                                                            <div className="text-sm font-medium text-gray-900">{task.title}</div>
                                                            <Badge className={getStateColor(task.state)}>
                                                                {task.state}
                                                            </Badge>
                                                        </div>
                                                        <div className="text-xs text-gray-500 mt-1">{task.task_code}</div>
                                                        {task.description && (
                                                            <div className="mt-2 text-sm text-gray-600">{task.description}</div>
                                                        )}
                                                        
                                                        {/* Time Spent Display */}
                                                        {task.time_entries && task.time_entries.length > 0 && (
                                                            <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
                                                                <Clock className="h-3.5 w-3.5" />
                                                                <span className="font-medium text-indigo-600">
                                                                    {formatSeconds(task.total_working_seconds || task.time_entries.reduce((acc, entry) => {
                                                                        const start = new Date(entry.start_time).getTime();
                                                                        const end = new Date(entry.end_time).getTime();
                                                                        return acc + (end - start);
                                                                    }, 0) / 1000)}
                                                                </span>
                                                                <span>({task.time_entries.length} {task.time_entries.length === 1 ? 'entry' : 'entries'})</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Editable Remarks */}
                                                <div className="mt-4 border-t pt-4">
                                                    <Label htmlFor={`remarks-${task.id}`} className="text-sm font-medium text-gray-700 mb-2 block">
                                                        Remarks
                                                    </Label>
                                                    <TiptapEditor
                                                        content={taskRemarks[task.id] || ''}
                                                        onChange={(value) => handleTaskRemarkChange(task.id, value)}
                                                        placeholder="Add remarks for this task..."
                                                        className="bg-white rounded-md text-sm min-h-20"
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* No Tasks Message */}
                        {(!report.tasks || report.tasks.length === 0) && (
                            <Card>
                                <CardContent className="py-8 text-center text-muted-foreground">
                                    No tasks connected to this report.
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Summary Card */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Summary</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-muted-foreground">Total Time</span>
                                    <span className="font-medium">{totalTimeSpent()}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-muted-foreground">Tasks</span>
                                    <span className="font-medium">{report.tasks?.length || 0}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-muted-foreground">Attachments</span>
                                    <span className="font-medium">{report.attachments?.length || 0}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-muted-foreground">Status</span>
                                    <Badge className={
                                        report.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                                        report.status === 'submitted' ? 'bg-blue-100 text-blue-800' :
                                        'bg-green-100 text-green-800'
                                    }>
                                        {report.status}
                                    </Badge>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Info Card */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Editing Info</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2 text-sm text-muted-foreground">
                                <p>
                                    You can only edit reports within 2 hours of creation.
                                </p>
                                <p>
                                    You can update the report title, description, and task remarks.
                                </p>
                                {hasChanges && (
                                    <p className="text-amber-600 font-medium">
                                        You have unsaved changes.
                                    </p>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
