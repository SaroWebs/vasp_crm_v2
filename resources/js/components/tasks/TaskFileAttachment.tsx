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
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { TaskAttachment as BaseTaskAttachment, Task } from '@/types';
import { Badge } from '@mantine/core';
import axios from 'axios';
import { Download, Eye, Paperclip, Ticket, Trash, Upload } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

interface TaskAttachment extends BaseTaskAttachment {
    source?: 'task' | 'ticket';
}

interface Props {
    task: Task;
    readonly?: boolean;
}

export function TaskFileAttachment({ task, readonly = false }: Props) {
    const [attachments, setAttachments] = useState<TaskAttachment[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [dragActive, setDragActive] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const loadAttachmentsData = () => {
        setIsLoading(true);
        axios
            .get(`/data/tasks/${task.id}/attachments`)
            .then((res) => {
                if (res.data.success && Array.isArray(res.data.data)) {
                    setAttachments(res.data.data);
                } else if (res.data.attachments) {
                    setAttachments(res.data.attachments);
                } else if (Array.isArray(res.data)) {
                    setAttachments(res.data);
                }
            })
            .catch((err) => {
                console.error('Error loading attachments:', err);
                if (task.attachments) {
                    setAttachments(task.attachments);
                }
            })
            .finally(() => {
                setIsLoading(false);
            });
    };

    useEffect(() => {
        loadAttachmentsData();
    }, [task.id]);

    const handleFileManagement = () => {
        setIsModalOpen(true);
    };

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        const files = Array.from(e.dataTransfer.files);
        if (files.length > 0) {
            uploadFiles(files);
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length > 0) {
            uploadFiles(files);
        }
    };

    const uploadFiles = (files: File[]) => {
        if (readonly) return;

        const formData = new FormData();
        files.forEach((file) => {
            formData.append('file', file);
        });

        files.forEach((file) => {
            const singleFormData = new FormData();
            singleFormData.append('file', file);

            axios
                .post(`/data/tasks/${task.id}/attachments`, singleFormData, {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                })
                .then((res) => {
                    toast.success(`File ${file.name} uploaded successfully`);
                    loadAttachmentsData();
                })
                .catch((err) => {
                    console.error('File upload error:', err);
                    toast.error(`Failed to upload ${file.name}`);
                });
        });

        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const removeAttachment = (attachmentId: number) => {
        if (readonly) return;

        if (confirm('Are you sure you want to remove this attachment?')) {
            axios
                .delete(`/data/tasks/${task.id}/attachments/${attachmentId}`)
                .then(() => {
                    toast.success('Attachment removed successfully');
                    setAttachments((prev) =>
                        prev.filter((att) => att.id !== attachmentId),
                    );
                })
                .catch((err) => {
                    console.error('Error removing attachment:', err);
                    toast.error('Failed to remove attachment');
                });
        }
    };

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    return (
        <Card className="w-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="flex flex-col space-y-1.5">
                    <CardTitle className="flex items-center gap-2 text-base font-semibold">
                        <Paperclip className="h-5 w-5" />
                        Attachments
                    </CardTitle>
                    <CardDescription>
                        Files associated with this task
                    </CardDescription>
                </div>
                {/* {!readonly && (
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleFileManagement}
                    >
                        <Upload className="mr-2 h-4 w-4" />
                        Upload Files
                    </Button>
                )} */}
            </CardHeader>
            <CardContent>
                <div className="grid gap-4">
                    {attachments.length > 0 ? (
                        <div className="grid gap-2">
                            {attachments.map((attachment) => (
                                <div
                                    key={attachment.id}
                                    className="flex items-center justify-between rounded-md border p-2 transition-colors hover:bg-muted/50"
                                >
                                    <div className="flex items-center gap-3 overflow-hidden">
                                        <div className="flex h-9 w-9 items-center justify-center rounded-lg border bg-background">
                                            {attachment.source === 'ticket' ? (
                                                <Ticket className="h-4 w-4 text-blue-500" />
                                            ) : (
                                                <Paperclip className="h-4 w-4 text-muted-foreground" />
                                            )}
                                        </div>
                                        <div className="flex flex-col truncate">
                                            <div className="flex items-center gap-2">
                                                <span className="truncate text-sm font-medium">
                                                    {attachment.file_name}
                                                </span>
                                                {attachment.source ===
                                                    'ticket' && (
                                                    <Badge
                                                        variant="secondary"
                                                        className="h-4 px-1 text-[10px]"
                                                    >
                                                        Ticket
                                                    </Badge>
                                                )}
                                            </div>
                                            <span className="text-xs text-muted-foreground">
                                                {formatFileSize(
                                                    attachment.file_size,
                                                )}{' '}
                                                •{' '}
                                                {new Date(
                                                    attachment.created_at,
                                                ).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <a
                                            href={`/storage/${attachment.file_path}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        >
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8"
                                            >
                                                <Eye className="h-4 w-4" />
                                                <span className="sr-only">
                                                    View
                                                </span>
                                            </Button>
                                        </a>
                                        <a
                                            href={`/storage/${attachment.file_path}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            download
                                        >
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8"
                                            >
                                                <Download className="h-4 w-4" />
                                                <span className="sr-only">
                                                    Download
                                                </span>
                                            </Button>
                                        </a>
                                        {!readonly && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-destructive hover:text-destructive"
                                                onClick={() =>
                                                    removeAttachment(
                                                        attachment.id,
                                                    )
                                                }
                                            >
                                                <Trash className="h-4 w-4" />
                                                <span className="sr-only">
                                                    Delete
                                                </span>
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed py-6 text-center text-muted-foreground">
                            <Paperclip className="mb-2 h-8 w-8 opacity-50" />
                            <p className="text-sm">No attachments yet</p>
                        </div>
                    )}
                </div>

                {/* Upload Modal */}
                <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Upload Attachments</DialogTitle>
                        </DialogHeader>
                        <div
                            onDragEnter={handleDrag}
                            onDragLeave={handleDrag}
                            onDragOver={handleDrag}
                            onDrop={handleDrop}
                            onClick={() => fileInputRef.current?.click()}
                            className={`flex cursor-pointer flex-col items-center justify-center gap-4 rounded-lg border-2 border-dashed p-8 transition-colors ${dragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:bg-muted/50'} `}
                        >
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                                <Upload className="h-6 w-6 text-muted-foreground" />
                            </div>
                            <div className="text-center">
                                <p className="text-sm font-medium">
                                    Click or drag files to upload
                                </p>
                                <p className="mt-1 text-xs text-muted-foreground">
                                    Max file size 10MB
                                </p>
                            </div>
                            <input
                                ref={fileInputRef}
                                type="file"
                                className="hidden"
                                multiple
                                onChange={handleFileSelect}
                            />
                        </div>
                    </DialogContent>
                </Dialog>
            </CardContent>
        </Card>
    );
}
