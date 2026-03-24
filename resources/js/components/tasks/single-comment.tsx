import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { TaskComment, TicketComment } from '@/types';
import axios from 'axios';
import {
    Check,
    Edit2,
    ExternalLink,
    Loader2,
    Paperclip,
    Trash2,
    X,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface SingleCommentProps {
    basePath?: string;
    comment: TicketComment | TaskComment;
    ticketId?: number;
    taskId?: number;
    isOwn: boolean;
    onUpdate: (updatedComment: TicketComment | TaskComment) => void;
    onDelete: (commentId: number) => void;
    onError: (message: string) => void;
    onAttachmentDelete?: (attachmentId: number) => void;
}

export default function SingleComment({
    basePath,
    comment,
    ticketId,
    taskId,
    isOwn,
    onUpdate,
    onDelete,
    onError,
    onAttachmentDelete,
}: SingleCommentProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [editText, setEditText] = useState(comment.comment_text);
    const [submitting, setSubmitting] = useState(false);
    const [isClicked, setIsClicked] = useState(false);
    const commentRef = useRef<HTMLDivElement>(null);

    const getInitials = (name: string) => {
        return (
            name
                ?.split(' ')
                .map((n) => n[0])
                .join('')
                .toUpperCase() || '?'
        );
    };

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const formatFileSize = (bytes?: number) => {
        if (!bytes) {
            return null;
        }

        const sizes = ['B', 'KB', 'MB', 'GB'];
        const power = Math.min(
            Math.floor(Math.log(bytes) / Math.log(1024)),
            sizes.length - 1,
        );

        return `${(bytes / 1024 ** power).toFixed(power === 0 ? 0 : 1)} ${sizes[power]}`;
    };

    const isImageAttachment = (fileType?: string | null) => {
        if (!fileType) {
            return false;
        }

        return fileType.startsWith('image/');
    };

    const handleEdit = async () => {
        if (!editText.trim() || submitting) {
            return;
        }

        try {
            setSubmitting(true);
            const endpoint = ticketId
                ? `${basePath ?? '/admin'}/tickets/${ticketId}/comments/${comment.id}`
                : `/data/tasks/${taskId}/comments/${comment.id}`;

            const response = await axios.patch(endpoint, {
                comment_text: editText.trim(),
            });

            if (response.data.success) {
                onUpdate(response.data.data);
                setIsEditing(false);
            }
        } catch (err: any) {
            onError(err.response?.data?.message || 'Failed to update comment');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this comment?')) {
            return;
        }

        try {
            setSubmitting(true);
            const endpoint = ticketId
                ? `${basePath ?? '/admin'}/tickets/${ticketId}/comments/${comment.id}`
                : `/data/tasks/${taskId}/comments/${comment.id}`;

            const response = await axios.delete(endpoint);
            if (response.data.success) {
                onDelete(comment.id);
            }
        } catch (err: any) {
            onError(err.response?.data?.message || 'Failed to delete comment');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteAttachment = async (attachmentId: number) => {
        if (!confirm('Are you sure you want to delete this attachment?')) {
            return;
        }

        try {
            setSubmitting(true);
            const endpoint = ticketId
                ? `${basePath ?? '/admin'}/tickets/${ticketId}/comments/${comment.id}/attachments/${attachmentId}`
                : `/data/tasks/${taskId}/comments/${comment.id}/attachments/${attachmentId}`;

            const response = await axios.delete(endpoint);
            if (response.data.success) {
                onAttachmentDelete?.(attachmentId);
            }
        } catch (err: any) {
            onError(
                err.response?.data?.message || 'Failed to delete attachment',
            );
        } finally {
            setSubmitting(false);
        }
    };

    const startEditing = () => {
        setEditText(comment.comment_text);
        setIsEditing(true);
    };

    const cancelEditing = () => {
        setIsEditing(false);
        setEditText(comment.comment_text);
    };

    const handleCommentClick = () => {
        if (isOwn && !isEditing) {
            setIsClicked(!isClicked);
        }
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                commentRef.current &&
                !commentRef.current.contains(event.target as Node)
            ) {
                setIsClicked(false);
            }
        };

        if (isClicked) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isClicked]);

    const commenterName = comment.commenter?.name || 'Unknown';

    const isEdited =
        comment.updated_at && comment.updated_at !== comment.created_at
            ? true
            : false;

    return (
        <div
            className={`flex gap-3 ${isOwn ? 'flex-row-reverse' : ''}`}
            ref={commentRef}
        >
            <Avatar className="h-8 w-8 shrink-0">
                <AvatarFallback
                    className={
                        isOwn ? 'bg-primary text-primary-foreground' : ''
                    }
                >
                    {getInitials(commenterName)}
                </AvatarFallback>
            </Avatar>
            <div
                className={`flex max-w-[85%] flex-col ${isOwn ? 'items-end' : ''}`}
            >
                <div className="mb-1 flex items-center gap-2">
                    <span className="text-xs font-medium">{commenterName}</span>
                    <span className="text-xs text-muted-foreground">
                        {formatTime(comment.created_at)}
                    </span>
                    {isEdited && !comment.deleted_at && (
                        <span className="text-xs font-medium text-orange-600">
                            Edited
                        </span>
                    )}
                    {comment.commented_by_type === 'organization_user' && (
                        <span className="rounded bg-blue-100 px-1.5 py-0.5 text-xs text-blue-700">
                            Client
                        </span>
                    )}
                </div>

                {isEditing ? (
                    <div className="w-full space-y-2">
                        <Textarea
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                            className="min-h-[60px]"
                            disabled={submitting}
                        />
                        <div className="flex gap-2">
                            <Button
                                size="sm"
                                onClick={handleEdit}
                                disabled={submitting}
                            >
                                {submitting ? (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                    <Check className="h-3 w-3" />
                                )}
                            </Button>
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={cancelEditing}
                                disabled={submitting}
                            >
                                <X className="h-3 w-3" />
                            </Button>
                        </div>
                    </div>
                ) : comment.comment_text ? (
                    <div
                        className={`rounded-lg px-3 py-2 transition-colors ${
                            comment.deleted_at
                                ? 'bg-gray-100 text-gray-500 italic'
                                : isOwn
                                  ? 'cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90'
                                  : 'cursor-pointer bg-muted'
                        }`}
                        onClick={
                            comment.deleted_at ? undefined : handleCommentClick
                        }
                    >
                        <p className="text-sm break-words whitespace-pre-wrap">
                            {comment.comment_text}
                        </p>
                    </div>
                ) : null}

                {!comment.deleted_at &&
                    comment.attachments &&
                    comment.attachments.length > 0 && (
                        <div className="mt-2 grid w-full gap-2 sm:grid-cols-2">
                            {comment.attachments.map((attachment) => {
                                const fileName =
                                    attachment.original_filename ||
                                    'Attachment';
                                const fileSize = formatFileSize(
                                    attachment.file_size,
                                );
                                const isImage = isImageAttachment(
                                    attachment.file_type,
                                );

                                return (
                                    <div
                                        key={attachment.id}
                                        className="group relative rounded-md border bg-background"
                                    >
                                        {isImage ? (
                                            <button
                                                type="button"
                                                className="w-full"
                                                onClick={() =>
                                                    window.open(
                                                        attachment.file_url,
                                                        '_blank',
                                                    )
                                                }
                                            >
                                                <img
                                                    src={attachment.file_url}
                                                    alt={fileName}
                                                    className="h-28 w-full rounded-t-md object-cover"
                                                />
                                            </button>
                                        ) : (
                                            <button
                                                type="button"
                                                className="flex w-full items-center gap-2 p-2 text-left"
                                                onClick={() =>
                                                    window.open(
                                                        attachment.file_url,
                                                        '_blank',
                                                    )
                                                }
                                            >
                                                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted text-muted-foreground">
                                                    <Paperclip className="h-4 w-4" />
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <p className="truncate text-xs font-medium">
                                                        {fileName}
                                                    </p>
                                                    <p className="text-[11px] text-muted-foreground">
                                                        {fileSize ||
                                                            'Unknown size'}
                                                    </p>
                                                </div>
                                                <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                                            </button>
                                        )}

                                        {isImage && (
                                            <div className="flex items-center justify-between gap-2 px-2 py-1.5">
                                                <p className="truncate text-xs font-medium">
                                                    {fileName}
                                                </p>
                                                {fileSize && (
                                                    <span className="text-[11px] text-muted-foreground">
                                                        {fileSize}
                                                    </span>
                                                )}
                                            </div>
                                        )}

                                        {isOwn && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    void handleDeleteAttachment(
                                                        attachment.id,
                                                    );
                                                }}
                                                className="absolute top-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white opacity-0 transition-opacity group-hover:opacity-100"
                                                disabled={submitting}
                                                type="button"
                                            >
                                                <X className="h-3 w-3" />
                                            </button>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}

                {isOwn && !isEditing && isClicked && !comment.deleted_at && (
                    <div className="mt-1 flex gap-1">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2"
                            onClick={startEditing}
                            disabled={submitting}
                        >
                            <Edit2 className="h-3 w-3" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 text-destructive hover:text-destructive"
                            onClick={handleDelete}
                            disabled={submitting}
                        >
                            {submitting ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                                <Trash2 className="h-3 w-3" />
                            )}
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
