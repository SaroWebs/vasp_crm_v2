import { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Clock, Paperclip, FileText, Download, ExternalLink, Edit, Trash2, EyeIcon, ChevronDown, ChevronUp } from 'lucide-react';
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

interface ReportShowProps {
    report: Report;
    userPermissions: string[];
    isSuperAdmin: boolean;
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
        title: 'Report Details',
        href: '#',
    },
];

export default function ReportShow(props: ReportShowProps) {
    const { report, isSuperAdmin, authUser } = props;
    const [expandedTasks, setExpandedTasks] = useState<Record<number, boolean>>({});

    const formatDuration = (hours: number): string => {
        const totalSeconds = Math.floor(hours * 3600);
        const hoursPart = Math.floor(totalSeconds / 3600);
        const minutesPart = Math.floor((totalSeconds % 3600) / 60);
        const secondsPart = totalSeconds % 60;
        return `${hoursPart}h ${minutesPart}m ${secondsPart}s`;
    };

    const formatSeconds = (seconds: number): string => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const formatFileSize = (bytes: number): string => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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

    const getStatusColor = (status: string): string => {
        const statusColors: Record<string, string> = {
            'draft': 'bg-yellow-100 text-yellow-800',
            'submitted': 'bg-blue-100 text-blue-800',
            'approved': 'bg-green-100 text-green-800',
        };
        return statusColors[status] || 'bg-gray-100 text-gray-800';
    };

    const canEditOrDelete = (): boolean => {
        const createdAt = new Date(report.created_at);
        const now = new Date();
        const diffHours = Math.abs(now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
        return report.user_id === authUser.id && diffHours <= 2;
    };

    const handleDownloadAttachment = (attachment: ReportAttachment) => {
        window.open(`/storage/${attachment.file_path}`, '_blank');
    };

    const handleDelete = () => {
        if (window.confirm('Are you sure you want to delete this report?')) {
            axios.delete(`/admin/api/reports/${report.id}`)
                .then(() => {
                    toast.success('Report deleted successfully');
                    router.visit('/admin/reports');
                })
                .catch((error) => {
                    console.error('Error deleting report:', error);
                    toast.error(error.response?.data?.error || 'Failed to delete report');
                });
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
        return formatDuration(report.total_hours);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Report: ${report.title}`} />

            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto p-6">
                {/* Header */}
                <div className="actions">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.visit('/admin/reports')}
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back
                    </Button>
                </div>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight">Report Details</h1>
                            <p className="text-muted-foreground">
                                View complete information about the daily report
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {canEditOrDelete() && (
                            <>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => router.visit(`/admin/reports/${report.id}/edit`)}
                                >
                                    <Edit className="h-4 w-4" />
                                    Edit
                                </Button>
                                <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={handleDelete}
                                >
                                    <Trash2 className="h-4 w-4" />
                                    Delete
                                </Button>
                            </>
                        )}
                    </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-3">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Report Information */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-2xl capitalize">{report.title}</CardTitle>
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
                                    <Badge className={getStatusColor(report.status)}>
                                        {report.status}
                                    </Badge>
                                </div>

                                {report.description && (
                                    <div className="border-t pt-4">
                                        <label className="text-sm font-medium text-gray-700 mb-2 block">Description</label>
                                        <div
                                            className="reset-style prose prose-sm max-w-none"
                                            dangerouslySetInnerHTML={{ __html: report.description }}
                                        />
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Tasks Details */}
                        {report.tasks && report.tasks.length > 0 && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">Connected Tasks</CardTitle>
                                    <CardDescription>
                                        {report.tasks.length} task{report.tasks.length > 1 ? 's' : ''} reported
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
                                                        {task.pivot?.remarks && (
                                                            <div className="mt-2 text-sm text-gray-700 bg-yellow-50 p-2 rounded">
                                                                <strong>Remarks:</strong>
                                                                <span className='reset-style ml-2' dangerouslySetInnerHTML={{ __html: task.pivot.remarks }} />
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Task Time Tracking */}
                                                {task.time_entries && task.time_entries.length > 0 && (
                                                    <div className="mt-4 border-t pt-4">
                                                        <button
                                                            onClick={() => setExpandedTasks(prev => ({ ...prev, [task.id]: !prev[task.id] }))}
                                                            className="w-full flex items-center justify-between mb-3 hover:bg-gray-50 rounded-md p-1 -mx-1 transition-colors"
                                                        >
                                                            <h4 className="text-xs font-semibold text-gray-700 flex items-center gap-2">
                                                                <Clock className="h-3.5 w-3.5" />
                                                                Time Spent
                                                            </h4>
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                                                                    {formatSeconds(task.total_working_seconds || task.time_entries.reduce((acc, entry) => {
                                                                        const start = new Date(entry.start_time).getTime();
                                                                        const end = new Date(entry.end_time).getTime();
                                                                        return acc + (end - start);
                                                                    }, 0) / 1000)} total
                                                                </span>
                                                                <span className="text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                                                                    {task.time_entries.length} {task.time_entries.length === 1 ? 'entry' : 'entries'}
                                                                </span>
                                                                {expandedTasks[task.id] ? (
                                                                    <ChevronUp className="h-4 w-4 text-gray-400" />
                                                                ) : (
                                                                    <ChevronDown className="h-4 w-4 text-gray-400" />
                                                                )}
                                                            </div>
                                                        </button>
                                                        {expandedTasks[task.id] && (
                                                            <div className="space-y-2 mt-2 animate-in slide-in-from-top-2 duration-200">
                                                                {task.time_entries.map((timeEntry) => {
                                                                    const start = new Date(timeEntry.start_time);
                                                                    const end = new Date(timeEntry.end_time);
                                                                    const workingSeconds = timeEntry.working_duration || Math.floor((end.getTime() - start.getTime()) / 1000);

                                                                    return (
                                                                        <div key={timeEntry.id} className="flex items-center gap-3 p-2 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors group">
                                                                            <div className="flex-shrink-0 w-1.5 h-8 bg-indigo-500 rounded-full"></div>
                                                                            <div className="flex-1 min-w-0">
                                                                                <div className="flex items-center gap-2">
                                                                                    <span className="text-xs font-medium text-gray-900">
                                                                                        {start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                                    </span>
                                                                                    <span className="text-xs text-gray-400">→</span>
                                                                                    <span className="text-xs font-medium text-gray-900">
                                                                                        {end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                                    </span>
                                                                                </div>
                                                                                {timeEntry.description && (
                                                                                    <p className="text-xs text-gray-500 truncate mt-0.5">{timeEntry.description}</p>
                                                                                )}
                                                                            </div>
                                                                            <div className="flex-shrink-0 text-xs font-semibold text-indigo-600 bg-indigo-100 px-2 py-1 rounded">
                                                                                {formatSeconds(workingSeconds)}
                                                                            </div>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
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
                                    <div className="flex items-center gap-1 text-sm font-medium">
                                        <Clock className="h-4 w-4" />
                                        {totalTimeSpent()}
                                    </div>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-muted-foreground">Tasks</span>
                                    <span className="text-sm font-medium">{report.tasks?.length || 0}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-muted-foreground">Attachments</span>
                                    <span className="text-sm font-medium">{report.attachments?.length || 0}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-muted-foreground">Created</span>
                                    <span className="text-sm font-medium">
                                        {new Date(report.created_at).toLocaleDateString()}
                                    </span>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Attachments Card */}
                        {report.attachments && report.attachments.length > 0 && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        <Paperclip className="h-5 w-5" />
                                        Attachments
                                    </CardTitle>
                                    <CardDescription>
                                        {report.attachments.length} file{report.attachments.length > 1 ? 's' : ''}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-3">
                                        {report.attachments.map((attachment) => (
                                            <div key={attachment.id} className="border rounded-lg p-3 bg-white hover:bg-gray-50 transition-colors">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex-shrink-0">
                                                        {attachment.file_type.startsWith('image/') ? (
                                                            <img
                                                                src={`/storage/${attachment.file_path}`}
                                                                alt={attachment.file_name}
                                                                className="w-10 h-10 object-cover rounded border"
                                                            />
                                                        ) : (
                                                            <div className="w-10 h-10 bg-gray-100 rounded border flex items-center justify-center">
                                                                <FileText className="w-5 h-5 text-gray-400" />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <div className="text-sm font-medium text-gray-900 truncate">
                                                            {attachment.file_name}
                                                        </div>
                                                        <div className="text-xs text-gray-500">
                                                            {formatFileSize(attachment.file_size)}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex gap-2 mt-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="flex-1"
                                                        onClick={() => window.open(`/storage/${attachment.file_path}`, '_blank')}
                                                    >
                                                        <ExternalLink className="w-3 h-3 mr-1" />
                                                        View
                                                    </Button>
                                                    <Button
                                                        variant="default"
                                                        size="sm"
                                                        className="flex-1"
                                                        onClick={() => handleDownloadAttachment(attachment)}
                                                    >
                                                        <Download className="w-3 h-3 mr-1" />
                                                        Download
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
