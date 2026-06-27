import TicketComments from '@/components/ticket-comments';
import TicketHistory from '@/components/ticket-history';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import AppLayout from '@/layouts/app-layout';
import { Attachment, Task, Ticket, type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import axios from 'axios';
import {
    AlertTriangle,
    ArrowLeft,
    Calendar,
    CheckCircle,
    Clock,
    Download,
    Edit,
    Eye,
    FileText,
    Paperclip,
    Settings,
    Trash,
    Trash2,
    User,
    XCircle,
    type LucideIcon,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import TicketAssignmentDialog from '@/components/ticket-assignment-dialog';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Admin',
        href: '/admin/dashboard',
    },
    {
        title: 'Tickets',
        href: '/admin/tickets',
    },
    {
        title: 'Ticket Details',
        href: '#',
    },
];

interface TicketsShowProps {
    ticket: Ticket;
}

export default function TicketsShow({ ticket }: TicketsShowProps) {
    const [, setIsApproving] = useState(false);

    const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
    const [
        showPermanentDeleteConfirmation,
        setShowPermanentDeleteConfirmation,
    ] = useState(false);
    const [showRejectConfirmation, setShowRejectConfirmation] = useState(false);

    // Task check modal state
    const [showTaskCheckModal, setShowTaskCheckModal] = useState(false);
    const [taskCheckData, setTaskCheckData] = useState<{
        can_close: boolean;
        total_tasks: number;
        completed_tasks: number;
        incomplete_tasks: number;
        tasks: Array<{
            id: number;
            task_code: string;
            title: string;
            state: string;
            due_at: string | null;
            assignees: Array<{ id: number; name: string }>;
            assigned_department: { id: number; name: string } | null;
            is_completed: boolean;
            activity_count: number;
        }>;
        has_task_activity: boolean;
        task_activity_task_count: number;
        task_activity_tasks: Array<{
            id: number;
            task_code: string;
            title: string;
            activity_count: number;
        }>;
        incomplete_task_details: Array<{
            id: number;
            task_code: string;
            title: string;
            state: string;
            due_at: string | null;
            assignee_name: string;
            assignee_id: number | null;
        }>;
    } | null>(null);
    const [pendingAction, setPendingAction] = useState<
        'close' | 'reject' | 'cancel' | null
    >(null);
    const [, setIsCheckingTasks] = useState(false);

    const getStatusBadge = (status: string) => {
        const variants: Record<
            string,
            'default' | 'secondary' | 'destructive' | 'outline'
        > = {
            open: 'destructive',
            approved: 'default',
            'in-progress': 'secondary',
            completed: 'outline',
            cancelled: 'destructive',
            closed: 'outline',
        };

        const icons: Record<string, LucideIcon> = {
            open: Clock,
            approved: CheckCircle,
            'in-progress': Clock,
            completed: CheckCircle,
            cancelled: XCircle,
            closed: CheckCircle,
        };

        const Icon = icons[status] || Clock;

        return (
            <Badge
                variant={variants[status] || 'secondary'}
                className="flex items-center gap-1"
            >
                <Icon className="h-3 w-3" />
                {(status || 'UNKNOWN').replace('-', ' ').toUpperCase()}
            </Badge>
        );
    };

    const getPriorityBadge = (priority: string) => {
        const variants: Record<
            string,
            'default' | 'secondary' | 'destructive' | 'outline'
        > = {
            low: 'outline',
            medium: 'secondary',
            high: 'destructive',
            critical: 'destructive',
        };

        const icons: Record<string, LucideIcon> = {
            low: AlertTriangle,
            medium: AlertTriangle,
            high: AlertTriangle,
            critical: AlertTriangle,
        };

        const Icon = icons[priority] || AlertTriangle;

        return (
            <Badge
                variant={variants[priority] || 'secondary'}
                className="flex items-center gap-1"
            >
                <Icon className="h-3 w-3" />
                {(priority || 'UNKNOWN').toUpperCase()}
            </Badge>
        );
    };

    const getTaskStatusBadge = (status: string) => {
        const variants: Record<
            string,
            'default' | 'secondary' | 'destructive' | 'outline'
        > = {
            pending: 'outline',
            'in-progress': 'secondary',
            completed: 'default',
            cancelled: 'destructive',
        };

        const icons: Record<string, LucideIcon> = {
            pending: Clock,
            'in-progress': Clock,
            completed: CheckCircle,
            cancelled: XCircle,
        };

        const Icon = icons[status] || Clock;

        return (
            <Badge
                variant={variants[status] || 'secondary'}
                className="flex items-center gap-1"
            >
                <Icon className="h-3 w-3" />
                {(status || 'UNKNOWN').replace('-', ' ').toUpperCase()}
            </Badge>
        );
    };

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase();
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const taskStats = useMemo(() => {
        const tasks = ticket.tasks || [];
        return {
            total: tasks.length,
            pending: tasks.filter((t: Task) => (t.state == 'Draft' || t.state == 'Assigned')).length,
            inProgress: tasks.filter((t: Task) => t.state == 'InProgress')
                .length,
            completed: tasks.filter((t: Task) => t.state == 'Done').length,
            cancelled: tasks.filter((t: Task) => t.state == 'Cancelled').length,
        };
    }, [ticket.tasks]);

    const handleApproveTicket = () => {
        setIsApproving(true);
        axios
            .post(`/admin/tickets/${ticket.id}/approve`)
            .then(() => {
                alert('Ticket approved successfully!');
                router.reload({ preserveScroll: true });
            })
            .catch((err) => {
                alert('Failed to approve ticket: ' + err.message);
            })
            .finally(() => {
                setIsApproving(false);
            });
    };



    const handleRejectTicket = () => {
        setShowRejectConfirmation(true);
    };

    const handleConfirmReject = () => {
        setIsApproving(true);
        axios
            .post(`/admin/tickets/${ticket.id}/reject`)
            .then(() => {
                alert('Ticket rejected successfully!');
                router.reload({ preserveScroll: true });
            })
            .catch((err) => {
                alert('Failed to reject ticket: ' + err.message);
            })
            .finally(() => {
                setIsApproving(false);
            });
    };

    const handleCancelReject = () => {
        setShowRejectConfirmation(false);
    };

    // Handle closing ticket (independent of task status)
    const handleCloseTicket = () => {
        setIsApproving(true);
        axios
            .patch(`/admin/tickets/${ticket.id}/status`, { status: 'closed' })
            .then(() => {
                toast.success('Ticket closed successfully!');
                router.reload({ preserveScroll: true });
            })
            .catch((err) => {
                toast.error(
                    'Failed to close ticket: ' +
                    (err.response?.data?.message || err.message),
                );
            })
            .finally(() => {
                setIsApproving(false);
            });
    };

    // Handle reopening ticket (independent of task status)
    const handleReopenTicket = () => {
        setIsApproving(true);
        axios
            .patch(`/admin/tickets/${ticket.id}/status`, {
                status: 'in-progress',
            })
            .then(() => {
                toast.success('Ticket reopened successfully!');
                router.reload({ preserveScroll: true });
            })
            .catch((err) => {
                toast.error(
                    'Failed to reopen ticket: ' +
                    (err.response?.data?.message || err.message),
                );
            })
            .finally(() => {
                setIsApproving(false);
            });
    };

    // Handle marking ticket as in progress
    const handleMarkInProgress = () => {
        setIsApproving(true);
        axios
            .patch(`/admin/tickets/${ticket.id}/status`, {
                status: 'in-progress',
            })
            .then(() => {
                toast.success('Ticket marked as in progress!');
                router.reload({ preserveScroll: true });
            })
            .catch((err) => {
                toast.error(
                    'Failed to update ticket: ' +
                    (err.response?.data?.message || err.message),
                );
            })
            .finally(() => {
                setIsApproving(false);
            });
    };

    // Check tasks before performing close/reject/cancel action
    const checkTasksBeforeAction = async (
        action: 'close' | 'reject' | 'cancel',
    ) => {
        setIsCheckingTasks(true);
        try {
            const response = await axios.get(
                `/admin/tickets/${ticket.id}/check-tasks`,
            );
            setTaskCheckData(response.data);
            setPendingAction(action);
            setShowTaskCheckModal(true);
        } catch (error) {
            console.error('Failed to check tasks:', error);
            toast.error('Failed to check task status');
        } finally {
            setIsCheckingTasks(false);
        }
    };

    // Handle confirmed action after task check
    const handleConfirmedAction = () => {
        if (!pendingAction) return;

        setShowTaskCheckModal(false);

        if (pendingAction === 'close') {
            handleCloseTicket();
        } else if (pendingAction === 'reject') {
            handleRejectTicket();
        } else if (pendingAction === 'cancel') {
            handleCancelTicket();
        }

        setPendingAction(null);
    };

    // Handle cancel ticket
    const handleCancelTicket = () => {
        setIsApproving(true);
        axios
            .patch(`/admin/tickets/${ticket.id}/status`, {
                status: 'cancelled',
            })
            .then(() => {
                toast.success('Ticket cancelled successfully!');
                router.reload({ preserveScroll: true });
            })
            .catch((err) => {
                toast.error(
                    'Failed to cancel ticket: ' +
                    (err.response?.data?.message || err.message),
                );
            })
            .finally(() => {
                setIsApproving(false);
            });
    };

    const handleDeleteTicket = () => {
        // Admin can delete ticket regardless of task status
        setShowDeleteConfirmation(true);
    };

    const handleConfirmDelete = () => {
        setIsApproving(true);
        axios
            .delete(`/admin/tickets/${ticket.id}`)
            .then(() => {
                alert('Ticket deleted successfully!');
                router.visit('/admin/tickets', { replace: true });
            })
            .catch((err) => {
                const errorMessage =
                    err.response?.data?.message ||
                    err.message ||
                    'Failed to delete ticket';
                alert(errorMessage);
            })
            .finally(() => {
                setIsApproving(false);
            });
    };

    const handleCancelDelete = () => {
        setShowDeleteConfirmation(false);
    };

    const handlePermanentDeleteTicket = () => {
        setShowPermanentDeleteConfirmation(true);
    };

    const handleConfirmPermanentDelete = () => {
        setIsApproving(true);
        axios
            .delete(`/admin/tickets/${ticket.id}`, {
                data: { force_delete: true },
            })
            .then(() => {
                alert('Ticket permanently deleted successfully!');
                router.visit('/admin/tickets', { replace: true });
            })
            .catch((err) => {
                const errorMessage =
                    err.response?.data?.message ||
                    err.message ||
                    'Failed to permanently delete ticket';
                alert(errorMessage);
            })
            .finally(() => {
                setIsApproving(false);
            });
    };

    const handleCancelPermanentDelete = () => {
        setShowPermanentDeleteConfirmation(false);
    };

    const ConfirmationModal = ({
        title,
        description,
        onConfirm,
        onCancel,
        confirmText = 'Confirm',
        cancelText = 'Cancel',
        isOpen,
        confirmButtonVariant = 'destructive',
    }: {
        title: string;
        description: string;
        onConfirm: () => void;
        onCancel: () => void;
        confirmText?: string;
        cancelText?: string;
        isOpen: boolean;
        confirmButtonVariant?:
        | 'default'
        | 'destructive'
        | 'outline'
        | 'secondary'
        | 'ghost'
        | 'link';
    }) => {
        return (
            <Dialog open={isOpen} onOpenChange={(open) => !open && onCancel()}>
                <DialogContent className="md:w-md">
                    <DialogHeader>
                        <DialogTitle>{title}</DialogTitle>
                        <DialogDescription>{description}</DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={onCancel}>
                            {cancelText}
                        </Button>
                        <Button
                            variant={confirmButtonVariant}
                            onClick={onConfirm}
                        >
                            {confirmText}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        );
    };

    // Check if ticket is deleted
    const isTicketDeleted = !!ticket.deleted_at;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Ticket ${ticket.ticket_number}`} />
            {isTicketDeleted ? (
                <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto p-6">
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <div className="flex items-center space-x-2">
                                <Button variant="outline" size="sm" asChild>
                                    <Link href="/admin/tickets">
                                        <ArrowLeft className="mr-2 h-4 w-4" />
                                        Back to Tickets
                                    </Link>
                                </Button>
                            </div>
                            <h1 className="text-3xl font-bold tracking-tight">
                                {ticket.title}
                            </h1>
                            <div className="flex items-center space-x-2">
                                <Badge
                                    variant="destructive"
                                    className="flex items-center gap-1"
                                >
                                    <XCircle className="h-3 w-3" />
                                    DELETED
                                </Badge>
                                <p className="text-muted-foreground">
                                    Ticket #{ticket.ticket_number} • Deleted{' '}
                                    {ticket.deleted_at
                                        ? formatDate(ticket.deleted_at)
                                        : 'N/A'}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="grid gap-6 lg:grid-cols-3">
                        <div className="space-y-6 lg:col-span-2">
                            <Card>
                                <CardHeader>
                                    <CardTitle>
                                        Deleted Ticket Information
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <h4 className="font-semibold">
                                            Basic Information
                                        </h4>
                                        <div className="grid gap-4 md:grid-cols-2">
                                            <div className="space-y-3">
                                                <div className="flex items-center space-x-2">
                                                    <User className="h-4 w-4 text-muted-foreground" />
                                                    <span className="text-sm font-medium">
                                                        Client
                                                    </span>
                                                </div>
                                                <p className="pl-6 text-sm text-muted-foreground">
                                                    {ticket.client?.name ||
                                                        'Unknown Client'}
                                                </p>
                                            </div>

                                            <div className="space-y-3">
                                                <div className="flex items-center space-x-2">
                                                    <Calendar className="h-4 w-4 text-muted-foreground" />
                                                    <span className="text-sm font-medium">
                                                        Created
                                                    </span>
                                                </div>
                                                <p className="pl-6 text-sm text-muted-foreground">
                                                    {formatDate(
                                                        ticket.created_at,
                                                    )}
                                                </p>
                                            </div>
                                        </div>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() =>
                                                router.post(
                                                    `/admin/tickets/${ticket.id}/restore`,
                                                )
                                            }
                                        >
                                            <Trash2 className="mr-2 h-4 w-4" />
                                            Restore
                                        </Button>
                                        <Button
                                            variant="destructive"
                                            size="sm"
                                            onClick={
                                                handlePermanentDeleteTicket
                                            }
                                        >
                                            <Trash2 className="mr-2 h-4 w-4" />
                                            Permanent Delete
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        <div className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Quick Info</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-3">
                                        <div className="flex justify-between">
                                            <span className="text-sm text-muted-foreground">
                                                Ticket ID
                                            </span>
                                            <span className="text-sm font-medium">
                                                #{ticket.id}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-sm text-muted-foreground">
                                                Status
                                            </span>
                                            <Badge variant="destructive">
                                                DELETED
                                            </Badge>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-sm text-muted-foreground">
                                                Deleted
                                            </span>
                                            <span className="text-sm font-medium">
                                                {ticket.deleted_at
                                                    ? formatDate(
                                                        ticket.deleted_at,
                                                    )
                                                    : 'N/A'}
                                            </span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto p-6">
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <div className="flex items-center space-x-2">
                                <Button variant="outline" size="sm" asChild>
                                    <Link href="/admin/tickets">
                                        <ArrowLeft className="mr-2 h-4 w-4" />
                                        Back to Tickets
                                    </Link>
                                </Button>
                            </div>
                            <h1 className="text-3xl font-bold tracking-tight">
                                {ticket.title}
                            </h1>
                            <p className="text-muted-foreground">
                                Ticket #{ticket.ticket_number} • Created{' '}
                                {formatDate(ticket.created_at)}
                            </p>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Button variant="outline" asChild>
                                <Link href={`/admin/tickets/${ticket.id}/edit`}>
                                    <Edit className="mr-2 h-4 w-4" />
                                    Edit
                                </Link>
                            </Button>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline">
                                        <Settings className="mr-2 h-4 w-4" />
                                        Actions
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuLabel>
                                        Ticket Actions
                                    </DropdownMenuLabel>
                                    <DropdownMenuSeparator />

                                    {/* Close Ticket - show for open, approved, in-progress status */}
                                    {[
                                        'open',
                                        'approved',
                                        'in-progress',
                                    ].includes(ticket.status) && (
                                            <DropdownMenuItem
                                                onClick={() =>
                                                    checkTasksBeforeAction('close')
                                                }
                                            >
                                                <CheckCircle className="mr-2 h-4 w-4" />
                                                Close Ticket
                                            </DropdownMenuItem>
                                        )}

                                    {/* Reopen Ticket - show for closed or cancelled status */}
                                    {['closed', 'cancelled'].includes(
                                        ticket.status,
                                    ) ? (
                                        <DropdownMenuItem
                                            onClick={handleReopenTicket}
                                        >
                                            <Clock className="mr-2 h-4 w-4" />
                                            Reopen Ticket
                                        </DropdownMenuItem>
                                    ) : (
                                        <TicketAssignmentDialog
                                            ticketId={ticket.id}
                                            type="link"
                                        />
                                    )}

                                    {/* Mark In Progress - show for approved status */}
                                    {ticket.status === 'approved' && (
                                        <DropdownMenuItem
                                            onClick={handleMarkInProgress}
                                        >
                                            <Clock className="mr-2 h-4 w-4" />
                                            Mark In Progress
                                        </DropdownMenuItem>
                                    )}

                                    {ticket.status === 'open' && (
                                        <DropdownMenuItem
                                            onClick={handleApproveTicket}
                                        >
                                            <CheckCircle className="mr-2 h-4 w-4" />
                                            Approve Ticket
                                        </DropdownMenuItem>
                                    )}

                                    {/* Edit action */}
                                    <DropdownMenuItem asChild>
                                        <Link
                                            href={`/admin/tickets/${ticket.id}/edit`}
                                        >
                                            <Edit className="mr-2 h-4 w-4" />
                                            Edit Ticket
                                        </Link>
                                    </DropdownMenuItem>

                                    {/* Cancel Ticket - show for open, approved, in-progress status */}
                                    {[
                                        'open',
                                        'approved',
                                        'in-progress',
                                    ].includes(ticket.status) && (
                                            <DropdownMenuItem
                                                className="text-orange-600"
                                                onClick={() =>
                                                    checkTasksBeforeAction('cancel')
                                                }
                                            >
                                                <XCircle className="mr-2 h-4 w-4" />
                                                Cancel Ticket
                                            </DropdownMenuItem>
                                        )}

                                    {/* Reject action */}
                                    {ticket.status !== 'cancelled' &&
                                        ticket.status !== 'closed' && (
                                            <DropdownMenuItem
                                                className="text-red-600"
                                                onClick={() =>
                                                    checkTasksBeforeAction(
                                                        'reject',
                                                    )
                                                }
                                            >
                                                <XCircle className="mr-2 h-4 w-4" />
                                                Reject Ticket
                                            </DropdownMenuItem>
                                        )}

                                    {/* Delete action - only show for open tickets with no tasks */}
                                    {ticket.status === 'open' &&
                                        (!ticket.tasks ||
                                            ticket.tasks.length === 0) && (
                                            <>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem
                                                    className="text-red-600 focus:bg-red-50"
                                                    onClick={handleDeleteTicket}
                                                >
                                                    <Trash className="mr-2 h-4 w-4" />
                                                    Delete Ticket
                                                </DropdownMenuItem>
                                            </>
                                        )}
                                    {/* Permanent Delete action - only show for soft-deleted tickets */}
                                    {ticket.deleted_at && (
                                        <DropdownMenuItem
                                            className="text-red-800 focus:bg-red-100"
                                            onClick={
                                                handlePermanentDeleteTicket
                                            }
                                        >
                                            <Trash2 className="mr-2 h-4 w-4" />
                                            Permanent Delete
                                        </DropdownMenuItem>
                                    )}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>

                    <div className="flex h-full flex-1 flex-col gap-6 lg:flex-row">
                        {/* Left Side - 2/3 width */}
                        <div className="flex-1 space-y-6 overflow-y-auto lg:w-2/3">
                            {/* 1. Title & Description */}
                            <Card>
                                <CardHeader>
                                    <div className="flex items-start justify-between">
                                        <div className="space-y-2">
                                            <h1 className="text-2xl font-bold">
                                                {ticket.title}
                                            </h1>
                                            <p className="text-sm text-muted-foreground">
                                                Ticket #{ticket.ticket_number} •
                                                Created{' '}
                                                {formatDate(ticket.created_at)}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {getStatusBadge(ticket.status)}
                                            {getPriorityBadge(ticket.priority)}
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {ticket.description && (
                                        <div className="space-y-2">
                                            <h4 className="font-semibold">
                                                Description
                                            </h4>
                                            <div className="rounded-lg bg-muted p-4">
                                                <p className="whitespace-pre-wrap">
                                                    {ticket.description}
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* 2. Priority and Status - Assignment/Status Change Actions */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Settings className="h-4 w-4" />
                                        Assignment & Status
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid gap-4 md:grid-cols-2">
                                        {/* Assignment */}
                                        <div className="space-y-3">
                                            <span className="text-sm font-medium">
                                                Assigned To
                                            </span>
                                            {ticket.assigned_to ? (
                                                <div className="flex items-center gap-3 rounded-lg border p-3">
                                                    <Avatar className="h-8 w-8">
                                                        <AvatarImage
                                                            src={
                                                                ticket
                                                                    .assigned_to
                                                                    .avatar
                                                            }
                                                        />
                                                        <AvatarFallback>
                                                            {getInitials(
                                                                ticket
                                                                    .assigned_to
                                                                    .name,
                                                            )}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <p className="text-sm font-medium">
                                                            {
                                                                ticket
                                                                    .assigned_to
                                                                    .name
                                                            }
                                                        </p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {
                                                                ticket
                                                                    .assigned_to
                                                                    .email
                                                            }
                                                        </p>
                                                    </div>
                                                </div>
                                            ) : (
                                                <p className="text-sm text-muted-foreground">
                                                    Unassigned
                                                </p>
                                            )}
                                            {[
                                                'open',
                                                'approved',
                                                'in-progress',
                                            ].includes(ticket.status) && (
                                                    <TicketAssignmentDialog
                                                        ticketId={ticket.id}
                                                        type="button"
                                                    />
                                                )}
                                        </div>
                                    </div>

                                    {/* Approval Info */}
                                    {(ticket.approved_by ||
                                        ticket.approved_at) && (
                                            <div className="border-t pt-4">
                                                <span className="text-sm font-medium">
                                                    Approval Information
                                                </span>
                                                <div className="mt-2 flex items-center gap-3">
                                                    {ticket.approved_by && (
                                                        <>
                                                            <Avatar className="h-8 w-8">
                                                                <AvatarImage
                                                                    src={
                                                                        ticket
                                                                            .approved_by
                                                                            .avatar
                                                                    }
                                                                />
                                                                <AvatarFallback>
                                                                    {getInitials(
                                                                        ticket
                                                                            .approved_by
                                                                            .name,
                                                                    )}
                                                                </AvatarFallback>
                                                            </Avatar>
                                                            <div>
                                                                <p className="text-sm font-medium">
                                                                    Approved by{' '}
                                                                    {
                                                                        ticket
                                                                            .approved_by
                                                                            .name
                                                                    }
                                                                </p>
                                                                {ticket.approved_at && (
                                                                    <p className="text-xs text-muted-foreground">
                                                                        {formatDate(
                                                                            ticket.approved_at,
                                                                        )}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    {/* Related Tasks Summary */}

                                    {ticket.tasks &&
                                        ticket.tasks.length > 0 && (
                                            <div className="space-y-3">
                                                <span className="text-sm font-medium">
                                                    Tasks Summary (
                                                    {ticket.tasks.length})
                                                </span>
                                                <div className="rounded-lg border p-3">
                                                    <div className="mb-3 flex flex-wrap gap-2">
                                                        <Badge variant="outline">
                                                            {
                                                                taskStats.total
                                                            }{' '}
                                                            Total
                                                        </Badge>
                                                        <Badge variant="secondary">
                                                            {
                                                                taskStats.pending
                                                            }{' '}
                                                            Pending
                                                        </Badge>
                                                        <Badge className="bg-blue-100 text-blue-700">
                                                            {
                                                                taskStats.inProgress
                                                            }{' '}
                                                            In Progress
                                                        </Badge>
                                                        <Badge className="bg-green-100 text-green-700">
                                                            {
                                                                taskStats.completed
                                                            }{' '}
                                                            Completed
                                                        </Badge>
                                                    </div>
                                                    <div className="space-y-2">
                                                        {ticket.tasks
                                                            .slice(0, 3)
                                                            .map(
                                                                (
                                                                    task: Task,
                                                                ) => (
                                                                    <div
                                                                        key={
                                                                            task.id
                                                                        }
                                                                        className="flex items-center justify-between text-sm"
                                                                    >
                                                                        <Link
                                                                            href={`/admin/tasks/${task.id}`}
                                                                            className="hover:underline"
                                                                        >
                                                                            <div className="">
                                                                                <h3>{task.title}</h3>
                                                                                <p className="text-xs text-muted-foreground">
                                                                                    {
                                                                                        task.task_code
                                                                                    }
                                                                                </p>
                                                                            </div>
                                                                        </Link>
                                                                        {getTaskStatusBadge(
                                                                            task.state,
                                                                        )}
                                                                    </div>
                                                                ),
                                                            )}
                                                        {ticket.tasks
                                                            .length > 3 && (
                                                                <p className="text-xs text-muted-foreground">
                                                                    +
                                                                    {ticket
                                                                        .tasks
                                                                        .length -
                                                                        3}{' '}
                                                                    more tasks
                                                                </p>
                                                            )}
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                </CardContent>

                            </Card>

                            {/* 3. Attachments */}
                            {ticket.attachments &&
                                ticket.attachments.length > 0 && (
                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="flex items-center gap-2">
                                                <Paperclip className="h-4 w-4" />
                                                Attachments (
                                                {ticket.attachments.length})
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
                                                {ticket.attachments.map(
                                                    (
                                                        attachment: Attachment,
                                                    ) => (
                                                        <div
                                                            key={attachment.id}
                                                            className="flex flex-col items-center rounded-lg border p-3"
                                                        >
                                                            <div className="space-y-2 text-center">
                                                                {attachment.file_type?.startsWith(
                                                                    'image/',
                                                                ) ? (
                                                                    <img
                                                                        src={`/storage/${attachment.file_path}`}
                                                                        alt=""
                                                                        className="h-24 w-full rounded object-cover"
                                                                    />
                                                                ) : (
                                                                    <FileText className="h-12 w-12 text-muted-foreground" />
                                                                )}
                                                                <p className="text-xs text-muted-foreground">
                                                                    {formatDate(
                                                                        attachment.created_at,
                                                                    )}
                                                                </p>
                                                            </div>
                                                            <div className="mt-2 flex gap-2">
                                                                <a
                                                                    href={`/storage/${attachment.file_path}`}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                >
                                                                    <Button
                                                                        variant="outline"
                                                                        size="sm"
                                                                    >
                                                                        <Eye className="h-4 w-4" />
                                                                    </Button>
                                                                </a>
                                                                <a
                                                                    href={`/storage/${attachment.file_path}`}
                                                                    download
                                                                >
                                                                    <Button
                                                                        variant="outline"
                                                                        size="sm"
                                                                    >
                                                                        <Download className="h-4 w-4" />
                                                                    </Button>
                                                                </a>
                                                            </div>
                                                        </div>
                                                    ),
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}

                            {/* 4. Histories (Timeline) */}
                            <TicketHistory ticketId={ticket.id} />

                            {/* 5. Overviews and Additional Information */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Eye className="h-4 w-4" />
                                        Overview & Additional Information
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid gap-4 md:grid-cols-2">
                                        {/* Client Info */}
                                        <div className="space-y-3">
                                            <span className="text-sm font-medium">
                                                Client
                                            </span>
                                            {ticket.client && (
                                                <div className="flex items-start gap-3 rounded-lg border p-3">
                                                    <Avatar className="h-10 w-10">
                                                        <AvatarFallback>
                                                            {getInitials(
                                                                ticket.client
                                                                    .name,
                                                            )}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <p className="font-medium">
                                                            {ticket.client.name}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {
                                                                ticket.client
                                                                    .email
                                                            }
                                                        </p>
                                                        {ticket.client
                                                            .phone && (
                                                                <p className="text-xs text-muted-foreground">
                                                                    {
                                                                        ticket
                                                                            .client
                                                                            .phone
                                                                    }
                                                                </p>
                                                            )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Organization User */}
                                        <div className="space-y-3">
                                            <span className="text-sm font-medium">
                                                Organization User
                                            </span>
                                            {ticket.organization_user && (
                                                <div className="rounded-lg border p-3">
                                                    <p className="font-medium">
                                                        {
                                                            ticket
                                                                .organization_user
                                                                .name
                                                        }
                                                    </p>
                                                    {ticket.organization_user
                                                        .designation && (
                                                            <p className="text-xs text-muted-foreground">
                                                                {
                                                                    ticket
                                                                        .organization_user
                                                                        .designation
                                                                }
                                                            </p>
                                                        )}
                                                    {ticket.organization_user
                                                        .email && (
                                                            <p className="text-xs text-muted-foreground">
                                                                {
                                                                    ticket
                                                                        .organization_user
                                                                        .email
                                                                }
                                                            </p>
                                                        )}
                                                </div>
                                            )}
                                        </div>

                                        {/* Ticket Details */}
                                        <div className="space-y-3">
                                            <span className="text-sm font-medium">
                                                Ticket Details
                                            </span>
                                            <div className="space-y-2 rounded-lg border p-3">
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-muted-foreground">
                                                        Ticket Number
                                                    </span>
                                                    <span className="font-medium">
                                                        {ticket.ticket_number}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-muted-foreground">
                                                        Created
                                                    </span>
                                                    <span>
                                                        {formatDate(
                                                            ticket.created_at,
                                                        )}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-muted-foreground">
                                                        Updated
                                                    </span>
                                                    <span>
                                                        {new Date(
                                                            ticket.updated_at,
                                                        ).toLocaleDateString()}
                                                    </span>
                                                </div>
                                                {ticket.approved_at && (
                                                    <div className="flex justify-between text-sm">
                                                        <span className="text-muted-foreground">
                                                            Approved
                                                        </span>
                                                        <span>
                                                            {formatDate(
                                                                ticket.approved_at,
                                                            )}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>


                                        {/* Rejection Reason */}
                                        {ticket.rejection_reason && (
                                            <div className="space-y-3 md:col-span-2">
                                                <span className="text-sm font-medium">
                                                    Rejection Reason
                                                </span>
                                                <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                                                    <p className="text-sm text-red-800">
                                                        {
                                                            ticket.rejection_reason
                                                        }
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Right Side - 1/3 width - Fixed Comments */}
                        <div className="flex h-[calc(100vh-180px)] flex-col lg:w-1/3">
                            <TicketComments ticketId={ticket.id} />
                        </div>
                    </div>
                </div>
            )}


            {/* Delete Confirmation Modal */}
            <ConfirmationModal
                title="Delete Ticket"
                description="Are you sure you want to delete this ticket? This action cannot be undone."
                onConfirm={handleConfirmDelete}
                onCancel={handleCancelDelete}
                confirmText="Delete"
                cancelText="Cancel"
                isOpen={showDeleteConfirmation}
                confirmButtonVariant="destructive"
            />
            {/* Permanent Delete Confirmation Modal */}
            <ConfirmationModal
                title="Permanently Delete Ticket"
                description="Are you sure you want to permanently delete this ticket? This action cannot be undone and the ticket will be removed from the system entirely."
                onConfirm={handleConfirmPermanentDelete}
                onCancel={handleCancelPermanentDelete}
                confirmText="Permanent Delete"
                cancelText="Cancel"
                isOpen={showPermanentDeleteConfirmation}
                confirmButtonVariant="destructive"
            />
            {/* Reject Confirmation Modal */}
            <ConfirmationModal
                title="Reject Ticket"
                description="Are you sure you want to reject this ticket?"
                onConfirm={handleConfirmReject}
                onCancel={handleCancelReject}
                confirmText="Reject"
                cancelText="Cancel"
                isOpen={showRejectConfirmation}
                confirmButtonVariant="destructive"
            />
            {/* Task Check Modal - Shows task details before closing/rejecting/cancelling ticket */}
            <Dialog
                open={showTaskCheckModal}
                onOpenChange={(open) => !open && setShowTaskCheckModal(false)}
            >
                <DialogContent className="max-h-[80vh] max-w-2xl overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>
                            {taskCheckData?.can_close
                                ? 'All Tasks Completed'
                                : 'Incomplete Tasks Found'}
                        </DialogTitle>
                        <DialogDescription>
                            {taskCheckData?.can_close
                                ? 'All tasks associated with this ticket have been completed. You can proceed with the action.'
                                : 'There are incomplete tasks. Please complete them before proceeding.'}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        {/* Task Summary */}
                        <div className="flex items-center justify-between rounded-lg bg-muted p-4">
                            <div className="flex items-center gap-4">
                                <div className="text-center">
                                    <div className="text-2xl font-bold">
                                        {taskCheckData?.total_tasks || 0}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                        Total
                                    </div>
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-green-600">
                                        {taskCheckData?.completed_tasks || 0}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                        Completed
                                    </div>
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-orange-600">
                                        {taskCheckData?.incomplete_tasks || 0}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                        Incomplete
                                    </div>
                                </div>
                            </div>
                        </div>

                        {taskCheckData?.has_task_activity ? (
                            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm">
                                <div className="flex items-start gap-2">
                                    <AlertTriangle className="mt-0.5 h-4 w-4 text-amber-600" />
                                    <div className="space-y-1">
                                        <div className="font-medium text-amber-800">
                                            Task activity exists for this ticket
                                        </div>
                                        <div className="text-amber-800/80">
                                            {taskCheckData.task_activity_task_count}{' '}
                                            {taskCheckData.task_activity_task_count === 1
                                                ? 'task has'
                                                : 'tasks have'}{' '}
                                            activity (comments, time entries, history, etc.). Please review before proceeding.
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : null}

                        {/* Task Details */}
                        <div className="space-y-2">
                            {taskCheckData?.tasks?.map((task) => (
                                <div
                                    key={task.id}
                                    className={`flex items-center justify-between rounded-lg border p-3 ${task.is_completed
                                        ? 'border-green-200 bg-green-50'
                                        : 'border-orange-200 bg-orange-50'
                                        }`}
                                >
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium">
                                                {task.title}
                                            </span>
                                            <Badge
                                                variant={
                                                    task.is_completed
                                                        ? 'default'
                                                        : 'secondary'
                                                }
                                            >
                                                {task.state}
                                            </Badge>
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                            {task.task_code}
                                        </div>
                                    </div>
                                    <div className="text-right text-sm">
                                        {task.is_completed ? (
                                            <span className="text-green-600">
                                                ✓ Completed
                                            </span>
                                        ) : (
                                            <div>
                                                <span className="text-orange-600">
                                                    Please ask{' '}
                                                    {task.assignees?.[0]
                                                        ?.name ||
                                                        task.assigned_department
                                                            ?.name ||
                                                        'the assignee'}{' '}
                                                    to complete the task
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <DialogFooter className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
                        <Button
                            variant="outline"
                            onClick={() => setShowTaskCheckModal(false)}
                        >
                            Cancel
                        </Button>
                        {taskCheckData?.can_close ? (
                            <Button
                                variant="default"
                                onClick={handleConfirmedAction}
                            >
                                Proceed
                            </Button>
                        ) : null}
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
