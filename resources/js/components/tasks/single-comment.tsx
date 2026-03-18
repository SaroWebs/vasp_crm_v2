import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { TaskComment, TicketComment } from '@/types';
import axios from 'axios';
import { Check, Edit2, Loader2, Paperclip, Trash2, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface SingleCommentProps {
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

    const handleEdit = async () => {
        if (!editText.trim() || submitting) return;

        try {
            setSubmitting(true);
            const endpoint = ticketId
                ? `/admin/tickets/${ticketId}/comments/${comment.id}`
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
        if (!confirm('Are you sure you want to delete this comment?')) return;

        try {
            setSubmitting(true);
            const endpoint = ticketId
                ? `/admin/tickets/${ticketId}/comments/${comment.id}`
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
        if (!confirm('Are you sure you want to delete this attachment?'))
            return;

        try {
            setSubmitting(true);
            const endpoint = ticketId
                ? `/admin/tickets/${ticketId}/comments/${comment.id}/attachments/${attachmentId}`
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
                className={`flex max-w-[75%] flex-col ${isOwn ? 'items-end' : ''}`}
            >
                <div className="mb-1 flex items-center gap-2">
                    <span className="text-xs font-medium">{commenterName}</span>
                    <span
                        className="text-xs text-muted-foreground"
                        onClick={() => console.log(comment.created_at)}
                    >
                        {formatTime(comment.created_at)}
                    </span>
                    {isEdited && !comment.deleted_at && (
                        <span className="text-xs font-medium text-orange-600">
                            Edited
                        </span>
                    )}
                    {comment.commented_by_type === 'client' && (
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
                        className={`rounded-lg px-3 py-2 transition-colors ${comment.deleted_at ? 'bg-gray-100 text-gray-500 italic' : isOwn ? 'cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90' : 'cursor-pointer bg-muted'} }`}
                        onClick={
                            comment.deleted_at ? undefined : handleCommentClick
                        }
                    >
                        <p className="text-sm wrap-break-word whitespace-pre-wrap">
                            {comment.comment_text}
                        </p>
                    </div>
                ) : null}

                {/* Attachments display - hide for deleted comments */}
                {!comment.deleted_at &&
                    comment.attachments &&
                    comment.attachments.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-2">
                            {comment.attachments.map((attachment) => (
                                <div
                                    key={attachment.id}
                                    className="group relative"
                                >
                                    {attachment.file_type == 'image/png' ||
                                    attachment.file_type == 'image/jpeg' ||
                                    attachment.file_type == 'image/webp' ? (
                                        <img
                                            src={attachment.file_url}
                                            alt={attachment.original_filename}
                                            className="h-20 w-20 cursor-pointer rounded border object-cover hover:opacity-80"
                                            onClick={() =>
                                                window.open(
                                                    attachment.file_url,
                                                    '_blank',
                                                )
                                            }
                                        />
                                    ) : (
                                        <div
                                            className="flex h-20 w-20 cursor-pointer items-center justify-center rounded border bg-gray-100 hover:bg-gray-200"
                                            onClick={() =>
                                                window.open(
                                                    attachment.file_url,
                                                    '_blank',
                                                )
                                            }
                                        >
                                            <div className="px-1 text-center text-xs">
                                                <Paperclip className="mx-auto mb-1 h-4 w-4" />
                                                <div className="truncate">
                                                    {
                                                        attachment.original_filename
                                                    }
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Delete button for own attachments */}
                                    {isOwn && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDeleteAttachment(
                                                    attachment.id,
                                                );
                                            }}
                                            className="absolute -top-2 -right-2 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-white opacity-0 transition-opacity group-hover:opacity-100"
                                            disabled={submitting}
                                        >
                                            <X className="h-2 w-2" />
                                        </button>
                                    )}
                                </div>
                            ))}
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
