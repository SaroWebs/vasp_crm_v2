import { useState } from 'react';
import { router } from '@inertiajs/react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ActionIcon } from '@mantine/core';
import { Eye, Edit, Trash2, Clock, ChevronDown, ChevronUp, Paperclip } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';
import {
    getEntryRangeOnReportDate,
    getSecondsOnReportDate,
} from '@/utils/reportDate';

interface ReportAttachment {
    id: number;
    file_name: string;
    file_path: string;
    file_type: string;
    file_size: number;
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
    total_working_seconds?: number;
    pivot?: {
        remarks?: string;
    };
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
    tasks: Task[];
    attachments: ReportAttachment[];
}

interface ReportCardProps {
    report: Report;
    authUser: { id: number; name: string };
    onDelete?: () => void;
    isLast?: boolean;
    showTimeEntries?: boolean;
}

const formatSeconds = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

const formatDuration = (hours: number): string => {
    const totalSeconds = Math.floor(hours * 3600);
    const hoursPart = Math.floor(totalSeconds / 3600);
    const minutesPart = Math.floor((totalSeconds % 3600) / 60);
    return `${hoursPart}h ${minutesPart}m`;
};

const getEntrySeconds = (
    entry: TaskTimeEntry,
    reportDate: string,
): number => {
    if (typeof entry.working_duration === 'number') {
        return entry.working_duration;
    }

    return getSecondsOnReportDate(entry.start_time, entry.end_time, reportDate);
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

export default function ReportCard({ report, authUser, onDelete, isLast, showTimeEntries = true }: ReportCardProps) {
    const [expandedTasks, setExpandedTasks] = useState<Record<number, boolean>>({});

    const toggleTaskExpand = (taskId: number) => {
        setExpandedTasks(prev => ({
            ...prev,
            [taskId]: !prev[taskId]
        }));
    };

    const canEditOrDelete = (): boolean => {
        const createdAt = new Date(report.created_at);
        const now = new Date();
        const diffHours = Math.abs(now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
        return report.user_id === authUser.id && diffHours <= 2;
    };

    const handleDelete = () => {
        if (window.confirm('Are you sure you want to delete this report?')) {
            axios.delete(`/admin/api/reports/${report.id}`)
                .then(() => {
                    toast.success('Report deleted successfully');
                    onDelete?.();
                })
                .catch((error) => {
                    console.error('Error deleting report:', error);
                    toast.error(error.response?.data?.error || 'Failed to delete report');
                });
        }
    };

    const getTotalTime = (): string => {
        if (report.tasks && report.tasks.length > 0) {
            const totalSeconds = report.tasks.reduce((acc, task) => {
                if (task.total_working_seconds) {
                    return acc + task.total_working_seconds;
                }
                const taskSeconds = task.time_entries?.reduce((entryAcc, entry) => {
                    return entryAcc + getEntrySeconds(entry, report.report_date);
                }, 0) || 0;
                return acc + taskSeconds;
            }, 0);
            return formatSeconds(totalSeconds);
        }
        return formatDuration(report.total_hours);
    };



    return (
        <div onClick={()=>console.log(isLast)} className={`flex items-start justify-between gap-4 ${!isLast ? 'border-b border-gray-200 pb-4' : ''}`}>
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">

                    <span className="text-sm font-medium text-gray-900">
                        {report.title}
                    </span>

                    <span className="flex items-center gap-1 text-sm font-medium text-indigo-600">
                        <Clock className="h-3 w-3" />
                        {getTotalTime()}
                    </span>
                </div>

                {report.tasks && report.tasks.length > 0 && (
                    <div className="mt-3 space-y-2">
                        {report.tasks.map((task) => {
                            const taskTotalSeconds = task.total_working_seconds
                                ? task.total_working_seconds
                                : task.time_entries?.reduce((entryAcc, entry) => {
                                    return entryAcc + getEntrySeconds(entry, report.report_date);
                                }, 0) || 0;
                            const isExpanded = expandedTasks[task.id];

                            return (
                                <div key={task.id} className="pl-3 py-1">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        {showTimeEntries && task.time_entries && task.time_entries.length > 0 ? (
                                            <button
                                                onClick={() => toggleTaskExpand(task.id)}
                                                className="flex items-center gap-1 text-sm font-medium text-gray-900 hover:text-indigo-600"
                                            >
                                                {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronUp className="h-3 w-3" />}
                                                {task.title}
                                            </button>
                                        ) : (
                                            <span className="text-sm font-medium text-gray-900">
                                                ├─ {task.title}
                                            </span>
                                        )}
                                        <Badge className={getStateColor(task.state)}>
                                            {task.state}
                                        </Badge>
                                        <span className="text-xs text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                                            {formatSeconds(taskTotalSeconds)}
                                        </span>
                                    </div>
                                    
                                    {showTimeEntries && task.time_entries && task.time_entries.length > 0 && isExpanded && (
                                        <div className="ml-4 mt-2 space-y-1 border-l-2 border-indigo-200 pl-3">
                                            {task.time_entries.map((entry) => {
                                                const range = getEntryRangeOnReportDate(
                                                    entry.start_time,
                                                    entry.end_time,
                                                    report.report_date,
                                                );

                                                if (!range) {
                                                    return null;
                                                }

                                                const entrySeconds = getEntrySeconds(
                                                    entry,
                                                    report.report_date,
                                                );

                                                return (
                                                    <div key={entry.id} className="flex items-center justify-between text-xs">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-gray-500">
                                                                {range.start.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                                                                -
                                                                {range.end.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                                                            </span>
                                                            {entry.description && (
                                                                <span className="text-gray-600">
                                                                    {entry.description}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <span className="text-indigo-600 font-medium">
                                                            {formatSeconds(entrySeconds)}
                                                        </span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                    
                                    {task.pivot?.remarks && !isExpanded && (
                                        <p className="mt-1 text-xs text-gray-600 ml-1">
                                            Remarks: {task.pivot.remarks.replace(/<[^>]*>/g, '')}
                                        </p>
                                    )}
                                </div>
                            );
                        })}

                        {report.description && (
                            <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                                Note: {report.description.replace(/<[^>]*>/g, '')}
                            </p>
                        )}
                    </div>
                )}

                {report.attachments && report.attachments.length > 0 && (
                    <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                        <Paperclip className="h-3 w-3" />
                        {report.attachments.length} attachment{report.attachments.length > 1 ? 's' : ''}
                    </div>
                )}
            </div>

            <div className="flex flex-col gap-2">
                <div className="flex items-center gap-1">
                    <ActionIcon
                        variant="filled"
                        color="gray"
                        size="sm"
                        aria-label="View Details"
                        onClick={() => router.visit(`/admin/reports/${report.id}`)}
                    >
                        <Eye className="w-4" />
                    </ActionIcon>
                    {canEditOrDelete() && (
                        <>
                            <ActionIcon
                                variant="filled"
                                color="blue"
                                size="sm"
                                aria-label="Edit"
                                onClick={() => router.visit(`/admin/reports/${report.id}/edit`)}
                            >
                                <Edit className="w-4" />
                            </ActionIcon>
                            <ActionIcon
                                variant="filled"
                                color="red"
                                size="sm"
                                aria-label="Delete"
                                onClick={handleDelete}
                            >
                                <Trash2 className="w-4" />
                            </ActionIcon>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
