import axios from 'axios';
import { useState } from 'react';
import { Trash2, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ProjectAttachment } from './types';
import { formatFileSize } from './utils';

interface ProjectFilesTabProps {
    projectId: number;
    attachments: ProjectAttachment[];
    canManageAttachments: boolean;
    onAttachmentsChange: (attachments: ProjectAttachment[]) => void;
    onSuccess: (message: string) => void;
    onError: (error: unknown, fallback: string) => void;
}

export default function ProjectFilesTab({
    projectId,
    attachments,
    canManageAttachments,
    onAttachmentsChange,
    onSuccess,
    onError,
}: ProjectFilesTabProps) {
    const [attachmentForm, setAttachmentForm] = useState({
        file: null as File | null,
        description: '',
    });

    const refreshAttachments = async () => {
        const response = await axios.get(`/admin/projects/${projectId}/attachments`);
        onAttachmentsChange(response.data ?? []);
    };

    const handleUploadAttachment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!attachmentForm.file) {
            onError(null, 'Select a file before upload.');
            return;
        }

        try {
            const formData = new FormData();
            formData.append('file', attachmentForm.file);
            formData.append('description', attachmentForm.description);

            await axios.post(`/admin/projects/${projectId}/attachments`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            setAttachmentForm({ file: null, description: '' });
            await refreshAttachments();
            onSuccess('Attachment uploaded.');
        } catch (error) {
            onError(error, 'Failed to upload attachment.');
        }
    };

    const handleDeleteAttachment = async (attachmentId: number) => {
        try {
            await axios.delete(`/admin/projects/${projectId}/attachments/${attachmentId}`);
            await refreshAttachments();
            onSuccess('Attachment deleted.');
        } catch (error) {
            onError(error, 'Failed to delete attachment.');
        }
    };

    return (
        <div className="space-y-4">
            {canManageAttachments && (
                <Card>
                    <CardHeader>
                        <CardTitle>Upload Attachment</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleUploadAttachment} className="grid gap-3 md:grid-cols-3">
                            <div className="space-y-2 md:col-span-2">
                                <Label>File</Label>
                                <Input
                                    type="file"
                                    onChange={(e) =>
                                        setAttachmentForm({
                                            ...attachmentForm,
                                            file: e.target.files?.[0] ?? null,
                                        })
                                    }
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Description</Label>
                                <Input value={attachmentForm.description} onChange={(e) => setAttachmentForm({ ...attachmentForm, description: e.target.value })} />
                            </div>
                            <div className="md:col-span-3">
                                <Button type="submit">
                                    <Upload className="mr-2 h-4 w-4" />
                                    Upload
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            )}

            <Card>
                <CardHeader>
                    <CardTitle>Attachments</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    {attachments.map((attachment) => (
                        <div key={attachment.id} className="flex items-center justify-between rounded border p-3">
                            <div>
                                <p className="font-medium">{attachment.original_filename}</p>
                                <p className="text-xs text-muted-foreground">
                                    {formatFileSize(attachment.size)} | by {attachment.uploader?.name ?? 'Unknown'}
                                </p>
                                {attachment.description && <p className="text-xs text-muted-foreground">{attachment.description}</p>}
                            </div>
                            <div className="flex gap-2">
                                <a href={`/admin/projects/${projectId}/attachments/${attachment.id}/download`}>
                                    <Button variant="outline" size="sm">
                                        Download
                                    </Button>
                                </a>
                                {canManageAttachments && (
                                    <Button variant="destructive" size="icon" onClick={() => handleDeleteAttachment(attachment.id)}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                )}
                            </div>
                        </div>
                    ))}
                    {attachments.length === 0 && <p className="text-sm text-muted-foreground">No attachments uploaded.</p>}
                </CardContent>
            </Card>
        </div>
    );
}
