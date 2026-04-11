import { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import TiptapEditor from '@/components/ui/TiptapEditor';
import { Upload, X, FileText, Tag } from 'lucide-react';
import { format } from 'date-fns';
import { Task } from '@/types';

interface ReportFormProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    tasks: Task[];
}

type ApiTaskTimeEntry = {
    start_time: string;
    end_time: string | null;
    duration_seconds_for_date?: number;
};

type ApiTimelineEvent = {
    event_date: string;
    event_type?: string | null;
    event_name?: string | null;
    event_description?: string | null;
    is_completed?: boolean;
};

type ApiTaskWithEntries = {
    id: number;
    title?: string | null;
    task_code?: string | null;
    total_hours_for_date?: number;
    time_entries?: ApiTaskTimeEntry[];
    default_remarks?: string | null;
    timeline_events?: ApiTimelineEvent[];
};

interface ReportFormData {
    title: string;
    description: string;
    selected_tasks: number[];
    report_date: string;
    tasks_remarks: Record<number, string>;
    total_hours:number;
}

export default function ReportForm({ open, onOpenChange, tasks }: ReportFormProps) {
    const allowedAttachmentMimeTypes = [
        'image/jpeg',
        'image/png',
        'image/gif',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/plain',
    ];
    
    const [reportFormData, setReportFormData] = useState<ReportFormData>({
        title: `Daily Report - ${format(new Date(), 'yyyy-MM-dd')}`,
        description: 'Completed tasks and work details for the day.',
        selected_tasks: [],
        report_date: format(new Date(), 'yyyy-MM-dd'),
        tasks_remarks: {},
        total_hours:0,
    });
    const [tasksWithTimeEntries, setTasksWithTimeEntries] = useState<Array<{
        id: number;
        title: string;
        task_code?: string;
        total_hours: number;
    }>>([]);
    const [attachments, setAttachments] = useState<File[]>([]);
    const [formSubmitting, setFormSubmitting] = useState(false);

    const tasksById = useMemo(() => {
        return new Map(tasks.map((task) => [task.id, task]));
    }, [tasks]);

    const buildDefaultRemarks = useCallback((task: ApiTaskWithEntries): string => {
        if (typeof task?.default_remarks === 'string') {
            return task.default_remarks;
        }

        const timelineEvents = task?.timeline_events;
        if (!Array.isArray(timelineEvents) || timelineEvents.length === 0) {
            return '';
        }

        const escapeHtml = (value: string): string => {
            return value
                .replaceAll('&', '&amp;')
                .replaceAll('<', '&lt;')
                .replaceAll('>', '&gt;')
                .replaceAll('"', '&quot;')
                .replaceAll("'", '&#039;');
        };

        const listItemsHtml = timelineEvents
            .map((event) => {
                if (!event?.event_date || !event?.event_name) {
                    return null;
                }

                const time = format(new Date(event.event_date), 'HH:mm');
                const status = event.is_completed ? 'Completed' : 'Pending';
                const eventType = String(event.event_type ?? '').trim();
                const eventName = String(event.event_name ?? '').trim();
                const eventDescription = String(event.event_description ?? '').trim();

                if (eventName === '') {
                    return null;
                }

                const eventTypeHtml = eventType !== '' ? ` <span>[${escapeHtml(eventType)}]</span>` : '';
                const descriptionHtml = eventDescription !== '' ? ` <span>: ${escapeHtml(eventDescription)}</span>` : '';

                return `<li><span>${escapeHtml(time)}</span> <strong>[${escapeHtml(status)}]</strong>${eventTypeHtml} <span>${escapeHtml(eventName)}</span>${descriptionHtml}</li>`;
            })
            .filter(Boolean)
            .join('');

        return listItemsHtml === '' ? '' : `<ul>${listItemsHtml}</ul>`;
    }, []);

    const fetchTasksWithTimeEntries = useCallback(async (date: string) => {
        try {
            const response = await axios.get(`/my/tasks/time-entries?date=${date}`);
            const tasksFromResponse: unknown = response.data.tasks;
            const tasksWithEntries: ApiTaskWithEntries[] = Array.isArray(tasksFromResponse)
                ? tasksFromResponse
                : tasksFromResponse && typeof tasksFromResponse === 'object'
                    ? Object.values(tasksFromResponse as Record<string, ApiTaskWithEntries>)
                    : [];
            const calculateTimeDifference = (startTime: string, endTime: string | null): number => {
                if (!endTime) {
                    return 0;
                }

                const start = new Date(startTime);
                const end = new Date(endTime);
                const diffInMs = end.getTime() - start.getTime();

                return diffInMs / (1000 * 60 * 60);
            };

            const tasksWithTime = tasksWithEntries.map((task) => {
                const taskSummary = tasksById.get(task.id);
                const title = taskSummary?.title ?? task.title ?? `Task #${task.id}`;
                const taskCode = taskSummary?.task_code ?? task.task_code ?? undefined;
                const totalHours =
                    typeof task.total_hours_for_date === 'number'
                        ? task.total_hours_for_date
                        : task.time_entries?.reduce((sum: number, entry: ApiTaskTimeEntry) => {
                              if (typeof entry.duration_seconds_for_date === 'number') {
                                  return sum + entry.duration_seconds_for_date / (60 * 60);
                              }

                              return sum + calculateTimeDifference(entry.start_time, entry.end_time);
                          }, 0) || 0;
                
                return {
                    id: task.id,
                    title,
                    task_code: taskCode,
                    total_hours: totalHours,
                };
            });
            
            setTasksWithTimeEntries(tasksWithTime);
            
            setReportFormData(prev => ({
                ...prev,
                selected_tasks: tasksWithEntries.map((task) => task.id),
                tasks_remarks: Object.fromEntries(
                    tasksWithEntries.map((task) => {
                        const existingValue = prev.tasks_remarks[task.id];
                        const nextValue = buildDefaultRemarks(task);

                        return [
                            task.id,
                            typeof existingValue === 'string' && existingValue.trim() !== '' ? existingValue : nextValue,
                        ];
                    })
                ),
                total_hours: Number(
                    tasksWithTime
                        .reduce((sum: number, task) => sum + Number(task.total_hours), 0)
                        .toFixed(2)
                ),
            }));
        } catch (error) {
            console.error('Failed to fetch tasks with time entries:', error);
        }
    }, [buildDefaultRemarks, tasksById]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const files = Array.from(e.target.files);
            // Validate file types and sizes
            const validFiles = files.filter(file => {
                const isValidType = allowedAttachmentMimeTypes.includes(file.type);
                const isValidSize = file.size <= 5 * 1024 * 1024; // 5MB

                if (!isValidType) {
                    alert(`File type ${file.type} is not supported`);
                }
                if (!isValidSize) {
                    alert(`File ${file.name} exceeds the 5MB limit`);
                }

                return isValidType && isValidSize;
            });

            setAttachments(prev => [...prev, ...validFiles]);
        }
    };

    const removeAttachment = (index: number) => {
        const newAttachments = [...attachments];
        newAttachments.splice(index, 1);
        setAttachments(newAttachments);
    };

    const handleReportSubmit = () => {
        if (!reportFormData.title) {
            alert('Please fill in the report title');
            return;
        }
        setFormSubmitting(true);
        // Create new report
        axios.post(`/admin/api/reports`, reportFormData)
            .then(reportRes => {
                const report = reportRes.data;
                
                // Add attachments
                if (attachments.length > 0) {
                    const addAttachmentsPromises = attachments.map(file => {
                        const formData = new FormData();
                        formData.append('file', file);
                        return axios.post(`/admin/api/reports/${report.id}/attachments`, formData, {
                            headers: {
                                'Content-Type': 'multipart/form-data',
                            },
                        });
                    });
                    
                    Promise.all(addAttachmentsPromises)
                        .then(() => {
                            alert('Report submitted successfully!');
                            onOpenChange(false);
                            setReportFormData({
                                title: `Daily Report - ${format(new Date(), 'yyyy-MM-dd')}`,
                                description: 'Completed tasks and work details for the day.',
                                selected_tasks: [],
                                report_date: format(new Date(), 'yyyy-MM-dd'),
                                tasks_remarks: {},
                                total_hours:0,
                            });
                            setAttachments([]);
                        })
                        .catch(err => {
                            console.error(err);
                            alert('Failed to add attachments');
                        });
                } else {
                    alert('Report submitted successfully!');
                    onOpenChange(false);
                    setReportFormData({
                        title: `Daily Report - ${format(new Date(), 'yyyy-MM-dd')}`,
                        description: 'Completed tasks and work details for the day.',
                        selected_tasks: [],
                        report_date: format(new Date(), 'yyyy-MM-dd'),
                        tasks_remarks: {},
                        total_hours:0,
                    });
                    setAttachments([]);
                }
            })
            .catch(err => {
                console.error(err);
                alert('Failed to create report');
            })
            .finally(() => {
                setFormSubmitting(false);
            });
    };

    // Reset form when dialog opens
    useEffect(() => {
        if (open) {
            Promise.resolve().then(() => {
                setReportFormData({
                    title: `Daily Report - ${format(new Date(), 'yyyy-MM-dd')}`,
                    description: 'Completed tasks and work details for the day.',
                    selected_tasks: [],
                    report_date: format(new Date(), 'yyyy-MM-dd'),
                    tasks_remarks: {},
                    total_hours:0,
                });
                setAttachments([]);
                setTasksWithTimeEntries([]);
                fetchTasksWithTimeEntries(format(new Date(), 'yyyy-MM-dd'));
            });
        }
    }, [fetchTasksWithTimeEntries, open]);

    const formatHours = (hours: number) => {
        const h = Math.floor(hours);
        const m = Math.round((hours - h) * 60);
        if(h === 0) return `${m}m`;
        return `${h}h ${m}m`;
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent 
                className="max-w-4xl max-h-[500px] overflow-y-auto"
                onInteractOutside={(e) => e.preventDefault()}
            >
                <DialogHeader>
                    <DialogTitle>Submit Daily Report</DialogTitle>
                    <DialogDescription>
                        Fill in the details of your work for today ({format(new Date(), 'yyyy-MM-dd')})
                    </DialogDescription>
                </DialogHeader>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-2">
                        <Label htmlFor="title">Report Title</Label>
                        <Input
                            id="title"
                            value={reportFormData.title}
                            onChange={(e) => setReportFormData({ ...reportFormData, title: e.target.value })}
                            placeholder="Enter a title for your report"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="report_date">Report Date</Label>
                        <Input
                            id="report_date"
                            type="date"
                            value={reportFormData.report_date}
                            onChange={(e) => {
                                const newDate = e.target.value;
                                setReportFormData((prev) => ({
                                    ...prev,
                                    report_date: newDate,
                                    selected_tasks: [],
                                    tasks_remarks: {},
                                    total_hours: 0,
                                }));
                                setTasksWithTimeEntries([]);
                                fetchTasksWithTimeEntries(newDate);
                            }}
                            max={format(new Date(), 'yyyy-MM-dd')}
                        />
                    </div>
                    <div className="col-span-1 md:col-span-2 space-y-2">
                        <Label>Tasks Worked On ({reportFormData.selected_tasks.length})</Label>
                        <div className="border rounded-lg p-3">
                            {reportFormData.selected_tasks.length > 0 ? (
                                reportFormData.selected_tasks.map((taskId) => {
                                    const task = tasksWithTimeEntries.find(t => t.id === taskId);
                                    return (
                                        <div key={taskId} className="flex flex-col p-3 border-b last:border-b-0">
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center space-x-3">
                                                    <Tag className="h-5 w-5 text-gray-500" />
                                                    <div>
                                                        <p className="text-sm font-medium">{task?.title || `Task #${taskId}`}</p>
                                                        {task?.task_code && (
                                                            <p className="text-xs text-gray-500">Code: {task.task_code}</p>
                                                        )}
                                                    </div>
                                                </div>
                                                {task && (
                                                    <div className="text-right">
                                                        <p className="text-sm font-medium text-blue-600">
                                                            {formatHours(Number(task.total_hours))}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="mt-2">
                                                <Label className="text-xs text-gray-500 mb-1 block">Work details</Label>
                                                <TiptapEditor
                                                    content={reportFormData.tasks_remarks[taskId] || ''}
                                                    onChange={(value) => setReportFormData(prev => ({
                                                        ...prev,
                                                        tasks_remarks: {
                                                            ...prev.tasks_remarks,
                                                            [taskId]: value
                                                        }
                                                    }))}
                                                    className="text-sm"
                                                />
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <p className="text-sm text-gray-500 text-center py-4">
                                    No tasks with time entries found for the selected date.
                                </p>
                            )}
                        </div>
                        {/* Total Hours Summary */}
                        <div className="flex justify-between items-center p-2 bg-blue-50 rounded-lg">
                            <span className="text-sm font-medium text-blue-900">Total Working Hours:</span>
                            <span className="text-lg font-bold text-blue-900">
                                {tasksWithTimeEntries.reduce((sum, task) => sum + Number(task.total_hours), 0).toFixed(2)} hrs
                            </span>
                        </div>
                    </div>

                    <div className="col-span-1 md:col-span-2 space-y-2">
                        <Label htmlFor="description">Overall Details</Label>
                        <TiptapEditor
                            content={reportFormData.description}
                            onChange={(value) => setReportFormData({ ...reportFormData, description: value })}
                            placeholder="Describe what you worked on today"
                            className="bg-white rounded-md"
                        />
                    </div>

                    <div className="col-span-1 md:col-span-2 ">
                        {/* Attachments Section */}
                        <div className="space-y-4">
                            <Label>Attachments</Label>
                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                                <input
                                    type="file"
                                    multiple
                                    onChange={handleFileChange}
                                    className="hidden"
                                    id="file-upload"
                                    accept=".jpg,.jpeg,.png,.gif,.pdf,.doc,.docx,.xls,.xlsx,.txt"
                                />
                                <label htmlFor="file-upload" className="cursor-pointer">
                                    <div className="flex flex-col items-center">
                                        <Upload className="h-8 w-8 mb-2 text-gray-500" />
                                        <p className="text-sm text-gray-600">
                                            Drag & drop files here or click to browse
                                        </p>
                                        <p className="text-xs text-gray-500 mt-1">
                                            Supports: JPG, PNG, GIF, PDF, DOC, DOCX, XLS, XLSX, TXT (Max 5MB each)
                                        </p>
                                    </div>
                                </label>
                            </div>

                            {/* File preview list */}
                            {attachments.length > 0 && (
                                <div className="space-y-2">
                                    <Label>Selected Files ({attachments.length})</Label>
                                    <div className="border rounded-lg p-3">
                                        {attachments.map((file, index) => (
                                            <div key={index} className="flex items-center justify-between p-2 border-b last:border-b-0">
                                                <div className="flex items-center space-x-3">
                                                    <FileText className="h-5 w-5 text-gray-500" />
                                                    <div>
                                                        <p className="text-sm font-medium">{file.name}</p>
                                                        <p className="text-xs text-gray-500">
                                                            {(file.size / 1024).toFixed(2)} KB
                                                        </p>
                                                    </div>
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => removeAttachment(index)}
                                                >
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleReportSubmit}
                        className={formSubmitting ? 'pointer-events-none opacity-50' : ''}
                        disabled={formSubmitting}
                    >
                        Submit Report
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
