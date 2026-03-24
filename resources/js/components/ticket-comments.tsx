import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { TaskComment, TicketComment } from '@/types';
import { usePage } from '@inertiajs/react';
import axios from 'axios';
import {
    Eye,
    EyeOff,
    Loader2,
    MessageCircle,
    Paperclip,
    RotateCcw,
    Send,
    Trash2,
    X,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import SingleComment from './tasks/single-comment';

interface TicketCommentsProps {
    ticketId: number;
    basePath?: string;
}

export default function TicketComments({
    ticketId,
    basePath: providedBasePath,
}: TicketCommentsProps) {
    const { auth } = usePage().props as any;
    const [comments, setComments] = useState<TicketComment[]>([]);
    const [deletedComments, setDeletedComments] = useState<TicketComment[]>([]);
    const [showDeletedComments, setShowDeletedComments] = useState(false);
    const [newComment, setNewComment] = useState('');
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const scrollRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const currentUserId = auth?.user?.id;
    const isAdmin = auth?.guard === 'admin';
    const isClient = auth?.guard === 'organization';
    const adminRoleSlug = String(auth?.user?.role?.slug ?? '').toLowerCase();
    const isSuperAdmin =
        isAdmin &&
        (adminRoleSlug === 'superadmin' || adminRoleSlug === 'super-admin');

    const apiBasePath = providedBasePath ?? (isAdmin ? '/admin' : '');

    const formatFileSize = (bytes: number): string => {
        if (!bytes) {
            return '0 B';
        }

        const units = ['B', 'KB', 'MB', 'GB'];
        const size = Math.max(bytes, 0);
        const power = Math.min(
            Math.floor(Math.log(size) / Math.log(1024)),
            units.length - 1,
        );

        return `${(size / 1024 ** power).toFixed(power === 0 ? 0 : 1)} ${units[power]}`;
    };

    const fetchComments = async (showLoading = true) => {
        try {
            if (showLoading) {
                setLoading(true);
            }
            setError(null);

            const response = await axios.get(
                `${apiBasePath}/tickets/${ticketId}/comments`,
            );
            if (response.data.success) {
                setComments(response.data.data);
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to load comments');
        } finally {
            if (showLoading) {
                setLoading(false);
            }
        }
    };

    const fetchDeletedComments = async () => {
        if (!isSuperAdmin) {
            return;
        }

        try {
            const response = await axios.get(
                `${apiBasePath}/tickets/${ticketId}/comments/deleted`,
            );
            if (response.data.success) {
                setDeletedComments(response.data.data);
            }
        } catch (err: any) {
            setError(
                err.response?.data?.message ||
                    'Failed to load deleted comments',
            );
        }
    };

    const handleRestoreComment = async (commentId: number) => {
        try {
            const response = await axios.patch(
                `${apiBasePath}/tickets/${ticketId}/comments/${commentId}/restore`,
            );
            if (response.data.success) {
                const restoredComment = response.data.data;
                setDeletedComments((prev) =>
                    prev.filter((c) => c.id !== commentId),
                );
                setComments((prev) => [...prev, restoredComment]);
            }
        } catch (err: any) {
            setError(
                err.response?.data?.message || 'Failed to restore comment',
            );
        }
    };

    const handleForceDeleteComment = async (commentId: number) => {
        if (
            !confirm(
                'Are you sure you want to permanently delete this comment? This action cannot be undone.',
            )
        ) {
            return;
        }

        try {
            const response = await axios.delete(
                `${apiBasePath}/tickets/${ticketId}/comments/${commentId}/force-delete`,
            );
            if (response.data.success) {
                setDeletedComments((prev) =>
                    prev.filter((c) => c.id !== commentId),
                );
            }
        } catch (err: any) {
            setError(
                err.response?.data?.message ||
                    'Failed to permanently delete comment',
            );
        }
    };

    useEffect(() => {
        fetchComments();

        if (window.Echo) {
            const channel = window.Echo.private(`ticket.${ticketId}`);

            channel.listen(
                '.comment.created',
                (event: { comment: TicketComment }) => {
                    setComments((prevComments) => {
                        if (
                            prevComments.some((c) => c.id === event.comment.id)
                        ) {
                            return prevComments;
                        }
                        return [...prevComments, event.comment];
                    });
                },
            );

            channel.listen('.comment.updated', () => {
                fetchComments(false);
            });

            channel.listen('.comment.deleted', () => {
                fetchComments(false);
            });

            return () => {
                channel.stopListening('.comment.created');
                channel.stopListening('.comment.updated');
                channel.stopListening('.comment.deleted');
                window.Echo.leave(`ticket.${ticketId}`);
            };
        }
    }, [ticketId]);

    useEffect(() => {
        if (showDeletedComments) {
            fetchDeletedComments();
        }
    }, [showDeletedComments]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [comments]);

    const submitComment = async () => {
        if (submitting) {
            return;
        }

        if (!newComment.trim() && selectedFiles.length === 0) {
            setError('Comment text or attachments are required');
            return;
        }

        try {
            setSubmitting(true);
            setError(null);

            const formData = new FormData();
            formData.append('comment_text', newComment.trim());
            formData.append('is_internal', '0');

            selectedFiles.forEach((file) => {
                formData.append('attachments[]', file);
            });

            const response = await axios.post(
                `${apiBasePath}/tickets/${ticketId}/comments`,
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                },
            );

            if (response.data.success) {
                setComments((prev) => [...prev, response.data.data]);
                setNewComment('');
                setSelectedFiles([]);
                setSuccessMessage(
                    response.data.message || 'Comment added successfully',
                );

                setTimeout(() => {
                    setSuccessMessage(null);
                }, 2000);
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to add comment');
        } finally {
            setSubmitting(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await submitComment();
    };

    const handleCommentUpdate = (
        updatedComment: TicketComment | TaskComment,
    ) => {
        if (!('ticket_id' in updatedComment)) {
            return;
        }

        setComments((prev) =>
            prev.map((c) => (c.id === updatedComment.id ? updatedComment : c)),
        );
    };

    const handleCommentDelete = (commentId: number) => {
        setComments((prev) => prev.filter((c) => c.id !== commentId));
    };

    const handleError = (message: string) => {
        setError(message);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files) {
            return;
        }

        const incomingFiles = Array.from(e.target.files);
        setSelectedFiles((prev) => {
            const all = [...prev];

            incomingFiles.forEach((incomingFile) => {
                const exists = all.some(
                    (existing) =>
                        existing.name === incomingFile.name &&
                        existing.size === incomingFile.size &&
                        existing.lastModified === incomingFile.lastModified,
                );

                if (!exists) {
                    all.push(incomingFile);
                }
            });

            return all;
        });

        e.target.value = '';
    };

    const removeFile = (index: number) => {
        setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    };

    const handleAttachmentDelete = (attachmentId: number) => {
        setComments((prev) =>
            prev.map((comment) => ({
                ...comment,
                attachments: comment.attachments?.filter(
                    (attachment) => attachment.id !== attachmentId,
                ),
            })),
        );
    };

    const isOwnComment = (comment: TicketComment) => {
        if (isAdmin && comment.commented_by_type === 'user') {
            return comment.commented_by === currentUserId;
        }

        if (isClient && comment.commented_by_type === 'organization_user') {
            return comment.commented_by === currentUserId;
        }

        return false;
    };

    return (
        <Card className="flex h-[560px] flex-col">
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between gap-2">
                    <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                        <MessageCircle className="h-5 w-5" />
                        Conversation
                        <Badge variant="outline">{comments.length}</Badge>
                        {isSuperAdmin && deletedComments.length > 0 && (
                            <span className="text-xs text-muted-foreground sm:text-sm">
                                + {deletedComments.length} deleted
                            </span>
                        )}
                    </CardTitle>
                    {isSuperAdmin && deletedComments.length > 0 && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                                setShowDeletedComments(!showDeletedComments)
                            }
                            className="flex items-center gap-2"
                        >
                            {showDeletedComments ? (
                                <>
                                    <EyeOff className="h-4 w-4" />
                                    Hide Deleted
                                </>
                            ) : (
                                <>
                                    <Eye className="h-4 w-4" />
                                    Show Deleted ({deletedComments.length})
                                </>
                            )}
                        </Button>
                    )}
                </div>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col overflow-hidden p-0">
                {error && (
                    <div className="mx-4 mb-2 rounded-md border border-destructive/30 bg-destructive/10 p-2 text-sm text-destructive">
                        {error}
                    </div>
                )}
                {successMessage && (
                    <div className="mx-4 mb-2 rounded-md border border-emerald-200 bg-emerald-50 p-2 text-sm text-emerald-700">
                        {successMessage}
                    </div>
                )}

                <ScrollArea className="flex-1 px-4" ref={scrollRef}>
                    {loading ? (
                        <div className="flex h-full items-center justify-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                    ) : comments.length === 0 ? (
                        <div className="flex h-full flex-col items-center justify-center gap-2 py-8 text-center text-muted-foreground">
                            <MessageCircle className="h-10 w-10 opacity-50" />
                            <p className="text-sm font-medium">
                                No messages yet
                            </p>
                            <p className="text-xs">
                                Share details, screenshots, or documents to
                                speed up support.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4 py-4">
                            {comments.map((comment) => (
                                <SingleComment
                                    key={comment.id}
                                    comment={comment}
                                    ticketId={ticketId}
                                    basePath={apiBasePath || undefined}
                                    isOwn={isOwnComment(comment)}
                                    onUpdate={handleCommentUpdate}
                                    onDelete={handleCommentDelete}
                                    onError={handleError}
                                    onAttachmentDelete={handleAttachmentDelete}
                                />
                            ))}
                        </div>
                    )}

                    {showDeletedComments && deletedComments.length > 0 && (
                        <div className="mt-8 border-t pt-4">
                            <div className="mb-4 flex items-center gap-2">
                                <Trash2 className="h-4 w-4 text-muted-foreground" />
                                <h3 className="text-sm font-medium text-muted-foreground">
                                    Deleted Comments ({deletedComments.length})
                                </h3>
                            </div>
                            <div className="space-y-4">
                                {deletedComments.map((comment) => (
                                    <div
                                        key={comment.id}
                                        className="flex gap-3 opacity-70"
                                    >
                                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-200">
                                            <span className="text-xs text-gray-500">
                                                {comment.commenter?.name
                                                    ?.split(' ')
                                                    .map((n) => n[0])
                                                    .join('')
                                                    .toUpperCase() || '?'}
                                            </span>
                                        </div>
                                        <div className="flex max-w-[75%] flex-col">
                                            <div className="mb-1 flex items-center gap-2">
                                                <span className="text-xs font-medium text-gray-500">
                                                    {comment.commenter?.name ||
                                                        'Unknown'}
                                                </span>
                                                <span className="text-xs text-gray-400">
                                                    {new Date(
                                                        comment.deleted_at ||
                                                            '',
                                                    ).toLocaleString()}
                                                </span>
                                                <span className="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-600">
                                                    Deleted by{' '}
                                                    {comment.deleted_by_user
                                                        ?.name || 'Unknown'}
                                                </span>
                                            </div>
                                            <div className="rounded-lg border border-gray-200 bg-gray-100 px-3 py-2">
                                                <p className="text-sm break-words whitespace-pre-wrap text-gray-600 line-through">
                                                    {comment.comment_text}
                                                </p>
                                            </div>
                                            <div className="mt-1 flex gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-6 px-2 text-xs"
                                                    onClick={() =>
                                                        handleRestoreComment(
                                                            comment.id,
                                                        )
                                                    }
                                                >
                                                    <RotateCcw className="mr-1 h-3 w-3" />
                                                    Restore
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-6 px-2 text-xs text-destructive hover:text-destructive"
                                                    onClick={() =>
                                                        handleForceDeleteComment(
                                                            comment.id,
                                                        )
                                                    }
                                                >
                                                    <Trash2 className="mr-1 h-3 w-3" />
                                                    Delete Permanently
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </ScrollArea>

                <form
                    onSubmit={handleSubmit}
                    className="border-t bg-background p-4"
                >
                    {selectedFiles.length > 0 && (
                        <div className="mb-3 space-y-2 rounded-md border bg-muted/20 p-2">
                            <div className="flex items-center justify-between">
                                <p className="text-xs font-medium text-muted-foreground">
                                    Attachments ({selectedFiles.length})
                                </p>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 px-2 text-xs"
                                    onClick={() => setSelectedFiles([])}
                                >
                                    Clear all
                                </Button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {selectedFiles.map((file, index) => (
                                    <div
                                        key={`${file.name}-${file.lastModified}-${index}`}
                                        className="flex max-w-full items-center gap-2 rounded border bg-background px-2 py-1 text-xs"
                                    >
                                        <Paperclip className="h-3.5 w-3.5 text-muted-foreground" />
                                        <span className="max-w-[180px] truncate">
                                            {file.name}
                                        </span>
                                        <span className="text-muted-foreground">
                                            {formatFileSize(file.size)}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => removeFile(index)}
                                            className="text-muted-foreground transition-colors hover:text-destructive"
                                            aria-label={`Remove ${file.name}`}
                                        >
                                            <X className="h-3.5 w-3.5" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="space-y-3">
                        <Textarea
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            placeholder="Type your message..."
                            className="max-h-[140px] min-h-[56px] resize-none"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    void submitComment();
                                }
                            }}
                            disabled={submitting}
                        />

                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                        fileInputRef.current?.click()
                                    }
                                    disabled={submitting}
                                >
                                    <Paperclip className="mr-2 h-4 w-4" />
                                    Attach Files
                                </Button>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    multiple
                                    onChange={handleFileChange}
                                    className="hidden"
                                    accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
                                    disabled={submitting}
                                />
                                <span className="text-xs text-muted-foreground">
                                    Enter to send, Shift+Enter for a new line
                                </span>
                            </div>

                            <Button
                                type="submit"
                                disabled={
                                    (!newComment.trim() &&
                                        selectedFiles.length === 0) ||
                                    submitting
                                }
                            >
                                {submitting ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <>
                                        <Send className="mr-2 h-4 w-4" />
                                        Send
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}
