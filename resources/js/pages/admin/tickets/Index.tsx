import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { Ticket, type BreadcrumbItem } from '@/types';
import { Select as MantineSelect, TextInput } from '@mantine/core';
import { useDebouncedValue } from '@mantine/hooks';
import { Head, Link, router } from '@inertiajs/react';
import {
    AlertTriangle,
    ArrowDown,
    ArrowUp,
    Calendar,
    CheckCircle,
    ChevronLeft,
    ChevronRight,
    Clock,
    Edit,
    Eye,
    ListChecks,
    MoreHorizontal,
    Search,
    TicketIcon,
    Trash2,
    User,
    XCircle,
    X,
    UserIcon,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import AdminRaiseTicket from './AdminRaiseTicket';
import WizCardDesign1 from '@/components/wizards/WizCardDesign1';
import TicketAssignmentDialog from '@/components/ticket-assignment-dialog';

type SortField =
    | 'title'
    | 'client'
    | 'priority'
    | 'assignee'
    | 'status'
    | 'created_at';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Admin',
        href: '/admin/dashboard',
    },
    {
        title: 'Tickets',
        href: '/admin/tickets',
    },
];

interface TicketsIndexProps {
    tickets: {
        data: Ticket[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
        from: number;
        to: number;
    };
    filters?: {
        status?: string;
        priority?: string;
        client_id?: string;
        search?: string;
        order_by?: SortField;
        order_direction?: 'asc' | 'desc';
    };
    userPermissions?: string[];
    clients?: Array<{ id: number; name: string }>;
    stats: {
        total_open: number;
        open_today: number;
        in_progress: number;
        completed: number;
    };
}



export default function TicketsIndex(props: TicketsIndexProps) {
    const {
        tickets,
        filters = {},
        userPermissions = [],
        clients = [],
        stats,
    } = props;

    const [searchQuery, setSearchQuery] = useState(filters.search || '');
    const [statusFilter, setStatusFilter] = useState(filters.status || 'all');
    const [clientFilter, setClientFilter] = useState(
        filters.client_id || 'all',
    );
    const [orderBy, setOrderBy] = useState<SortField>(
        filters.order_by || 'created_at',
    );
    const [orderDirection, setOrderDirection] = useState<'asc' | 'desc'>(
        filters.order_direction || 'desc',
    );

    const [isLoading, setIsLoading] = useState(false);
    const [closingTicketId, setClosingTicketId] = useState<number | null>(null);
    const [mounted, setMounted] = useState(false);

    const handleCloseTicket = (ticketId: number) => {
        setClosingTicketId(ticketId);
        axios
            .patch(`/admin/tickets/${ticketId}/status`, { status: 'closed' })
            .then(() => {
                toast.success('Ticket closed successfully!');
                window.location.reload();
            })
            .catch((err) => {
                toast.error(
                    'Failed to close ticket: ' +
                    (err.response?.data?.message || err.message),
                );
            })
            .finally(() => {
                setClosingTicketId(null);
            });
    };

    const [debouncedSearch] = useDebouncedValue(searchQuery, 800);

    const applyFilters = (overrides: { search?: string; status?: string; client_id?: string; order_by?: SortField; order_direction?: 'asc' | 'desc' } = {}) => {
        setIsLoading(true);
        const search = 'search' in overrides ? overrides.search : debouncedSearch;
        const status = 'status' in overrides ? overrides.status : statusFilter;
        const client = 'client_id' in overrides ? overrides.client_id : clientFilter;
        const nextOrderBy = 'order_by' in overrides ? overrides.order_by : orderBy;
        const nextOrderDirection = 'order_direction' in overrides ? overrides.order_direction : orderDirection;
        router.get(
            '/admin/tickets',
            {
                search: search || undefined,
                status: status !== 'all' ? status : undefined,
                client_id: client !== 'all' ? client : undefined,
                order_by: nextOrderBy,
                order_direction: nextOrderDirection,
            },
            {
                preserveScroll: true,
                preserveState: true,
                onFinish: () => setIsLoading(false),
            },
        );
    };

    // Auto-fire when debounced search changes (skip on mount)
    useEffect(() => {
        if (!mounted) { setMounted(true); return; }
        applyFilters({ search: debouncedSearch });
    }, [debouncedSearch]);

    // Handle pagination
    const handlePageChange = (page: number) => {
        setIsLoading(true);
        router.get(
            '/admin/tickets',
            {
                page,
                search: searchQuery || undefined,
                status: statusFilter !== 'all' ? statusFilter : undefined,
                client_id: clientFilter !== 'all' ? clientFilter : undefined,
                order_by: orderBy,
                order_direction: orderDirection,
            },
            {
                preserveScroll: true,
                preserveState: true,
                onFinish: () => setIsLoading(false),
            },
        );
    };

    const toggleSort = (field: SortField) => {
        const isSameField = orderBy === field;
        const nextDirection = isSameField && orderDirection === 'asc' ? 'desc' : 'asc';
        setOrderBy(field);
        setOrderDirection(nextDirection);
        applyFilters({ order_by: field, order_direction: nextDirection });  
    };

    const renderSortIcon = (field: SortField) => {
        if (orderBy !== field) {
            return null;
        }

        const SortIcon = orderDirection === 'asc' ? ArrowUp : ArrowDown;

        return <SortIcon className="h-3.5 w-3.5" aria-hidden="true" />;
    };

    // tickets.data is already server-filtered; use directly
    const filteredTickets = tickets.data;

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

        const icons: Record<string, any> = {
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
                {priority.toUpperCase()}
            </Badge>
        );
    };

    // Get work status badge based on task status - with dropdown showing tasks
    const getWorkStatusBadge = (
        workStatus: TicketsIndexProps['tickets']['data'][0]['work_status'],
        ticketTasks: Ticket['tasks']
    ) => {
        if (!workStatus) {
            return (
                <Badge variant="outline" className="flex items-center gap-1">
                    <ListChecks className="h-3 w-3" />
                    No Tasks
                </Badge>
            );
        }

        const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
            'no-tasks': 'outline',
            'pending': 'outline',
            'in-progress': 'default',
            'partial': 'default',
            'blocked': 'destructive',
            'completed': 'secondary',
        };

        const colors: Record<string, string> = {
            'no-tasks': 'text-gray-500',
            'pending': 'text-gray-600',
            'in-progress': 'text-blue-600 bg-blue-50',
            'partial': 'text-yellow-600 bg-yellow-50',
            'blocked': 'text-red-600 bg-red-50',
            'completed': 'text-green-600 bg-green-50',
        };

        const icons: Record<string, any> = {
            'no-tasks': ListChecks,
            'pending': Clock,
            'in-progress': Clock,
            'partial': Clock,
            'blocked': AlertTriangle,
            'completed': CheckCircle,
        };

        const Icon = icons[workStatus.status] || ListChecks;

        // Get state badge color for tasks
        const getTaskStateBadge = (state: string) => {
            const stateColors: Record<string, string> = {
                'Draft': 'bg-gray-100 text-gray-600',
                'Assigned': 'bg-blue-100 text-blue-600',
                'InProgress': 'bg-blue-100 text-blue-600',
                'Blocked': 'bg-red-100 text-red-600',
                'InReview': 'bg-yellow-100 text-yellow-600',
                'Done': 'bg-green-100 text-green-600',
                'Cancelled': 'bg-gray-100 text-gray-600',
                'Rejected': 'bg-red-100 text-red-600',
            };
            return stateColors[state] || 'bg-gray-100 text-gray-600';
        };

        return (
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <div className="flex flex-col gap-1 cursor-pointer hover:opacity-80">
                        <Badge
                            variant={variants[workStatus.status] || 'outline'}
                            className={`flex items-center gap-1 w-fit ${colors[workStatus.status] || ''}`}
                        >
                            <Icon className="h-3 w-3" />
                            {workStatus.label}
                        </Badge>
                        {workStatus.total > 0 && (
                            <div className="flex items-center gap-1">
                                <div className="h-1.5 w-16 rounded-full bg-gray-200 overflow-hidden">
                                    <div
                                        className="h-full rounded-full transition-all"
                                        style={{
                                            width: `${workStatus.progress}%`,
                                            backgroundColor:
                                                workStatus.status === 'completed' ? '#22c55e' :
                                                    workStatus.status === 'blocked' ? '#ef4444' :
                                                        workStatus.status === 'partial' ? '#eab308' :
                                                            '#3b82f6',
                                        }}
                                    />
                                </div>
                                <span className="text-xs text-muted-foreground">
                                    {workStatus.completed}/{workStatus.total}
                                </span>
                            </div>
                        )}
                    </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-72 max-h-80 overflow-y-auto">
                    <DropdownMenuLabel onClick={() => console.log(ticketTasks)} className="flex items-center gap-2">
                        <ListChecks className="h-4 w-4" />
                        Tasks ({workStatus.total})
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {ticketTasks && ticketTasks.length > 0 ? (
                        ticketTasks.map((task) => (
                            <DropdownMenuItem key={task.id} asChild>
                                <Link
                                    href={`/admin/tasks/${task.id}`}
                                    className="flex flex-col gap-1 p-2 cursor-pointer"
                                >
                                    <div className="flex items-center justify-between w-full">
                                        <span className="font-medium text-sm truncate max-w-[180px]">
                                            {task.title}
                                        </span>
                                        <span className={`text-xs px-1.5 py-0.5 rounded ${getTaskStateBadge(task.state)}`}>
                                            {task.state}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between w-full text-xs text-muted-foreground">
                                        <span>{task.task_code}</span>
                                        {task.assigned_users && task.assigned_users.length > 0 ? (
                                            <span>{task.assigned_users[0].name}</span>
                                        ) : (
                                            <span>Unassigned</span>
                                        )}
                                    </div>
                                </Link>
                            </DropdownMenuItem>
                        ))
                    ) : (
                        <div className="p-2 text-sm text-muted-foreground text-center">
                            No tasks connected to this ticket
                        </div>
                    )}
                </DropdownMenuContent>
            </DropdownMenu>
        );
    };

    // Get ticket status badge with icon and color
    const getTicketStatusBadge = (status: Ticket['status']) => {
        if (!status) {
            return (
                <Badge variant="outline" className="flex items-center gap-1">
                    Unknown
                </Badge>
            );
        }

        const statusConfig: Record<
            Ticket['status'],
            { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: typeof CheckCircle; bgColor: string; textColor: string }
        > = {
            open: {
                label: 'Open',
                variant: 'default',
                icon: TicketIcon,
                bgColor: 'bg-blue-50',
                textColor: 'text-blue-700',
            },
            approved: {
                label: 'Approved',
                variant: 'secondary',
                icon: CheckCircle,
                bgColor: 'bg-green-50',
                textColor: 'text-green-700',
            },
            'in-progress': {
                label: 'In Progress',
                variant: 'default',
                icon: Clock,
                bgColor: 'bg-yellow-50',
                textColor: 'text-yellow-700',
            },
            closed: {
                label: 'Closed',
                variant: 'secondary',
                icon: CheckCircle,
                bgColor: 'bg-gray-50',
                textColor: 'text-gray-700',
            },
            cancelled: {
                label: 'Cancelled',
                variant: 'destructive',
                icon: XCircle,
                bgColor: 'bg-red-50',
                textColor: 'text-red-700',
            },
        };

        const config = statusConfig[status];
        const Icon = config?.icon || TicketIcon;

        return (
            <Badge variant={config?.variant || 'outline'} className={`flex items-center gap-1 ${config?.bgColor || ''} ${config?.textColor || ''}`}>
                <Icon className="h-3 w-3" />
                {config?.label || status}
            </Badge>
        );
    };

    const wizCards = [
        { title: "Total Open", text: "All active tickets", stats: stats.total_open, icon: TicketIcon, color: "orange", link: '/admin/tickets?status=open' },
        { title: "Open Today", text: "Today's opened tickets", stats: stats.open_today, icon: Clock, color: "blue", link: '/admin/tickets?status=open' },
        { title: "In Progress", text: "In-progress tickets", stats: stats.in_progress, icon: Clock, color: "purple", link: '/admin/tickets?status=in-progress' },
        { title: "Completed", text: "Closed tickets", stats: stats.completed, icon: CheckCircle, color: "green", link: '/admin/tickets?status=closed' },
    ] as const;

    useEffect(() => {
        console.log(filteredTickets);
    }, [filteredTickets]);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Tickets" />

            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto p-6">

                <div className="grid gap-2 md:grid-cols-4">
                    {wizCards.map((card) => (
                        <WizCardDesign1 key={card.title} {...card} />
                    ))}
                </div>
                {/* Ticket Table */}
                <Card>
                    <CardHeader>
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <CardTitle>All Tickets</CardTitle>
                                <CardDescription>
                                    {tickets.total} ticket{tickets.total !== 1 ? 's' : ''} in the system
                                </CardDescription>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                                <TextInput
                                    placeholder="Search tickets..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    leftSection={<Search size={14} />}
                                    size="xs"
                                    w={180}
                                    rightSection={isLoading ? <span className="animate-spin text-xs">⏳</span> : undefined}
                                />
                                <MantineSelect
                                    placeholder="All Clients"
                                    value={clientFilter === 'all' ? null : clientFilter}
                                    onChange={(val) => {
                                        const next = val ?? 'all';
                                        setClientFilter(next);
                                        applyFilters({ client_id: next });
                                    }}
                                    data={[
                                        { value: 'all', label: 'All Clients' },
                                        ...clients.map((c) => ({ value: c.id.toString(), label: c.name })),
                                    ]}
                                    size="xs"
                                    w={160}
                                    clearable
                                    searchable
                                />
                                <MantineSelect
                                    placeholder="All Statuses"
                                    value={statusFilter === 'all' ? null : statusFilter}
                                    onChange={(val) => {
                                        const next = val ?? 'all';
                                        setStatusFilter(next);
                                        applyFilters({ status: next });
                                    }}
                                    data={[
                                        { value: 'all', label: 'All Statuses' },
                                        { value: 'open', label: 'Open' },
                                        { value: 'approved', label: 'Approved' },
                                        { value: 'in-progress', label: 'In Progress' },
                                        { value: 'closed', label: 'Closed' },
                                        { value: 'cancelled', label: 'Cancelled' },
                                    ]}
                                    size="xs"
                                    w={140}
                                    clearable
                                />
                                <AdminRaiseTicket
                                    clients={clients}
                                />
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="space-y-4">
                                {Array.from({ length: 5 }).map((_, i) => (
                                    <div
                                        key={i}
                                        className="flex items-center space-x-4"
                                    >
                                        <Skeleton className="h-12 w-12 rounded-full" />
                                        <div className="flex-1 space-y-2">
                                            <Skeleton className="h-4 w-3/4" />
                                            <Skeleton className="h-4 w-1/2" />
                                        </div>
                                        <Skeleton className="h-6 w-20" />
                                    </div>
                                ))}
                            </div>
                        ) : filteredTickets.length === 0 ? (
                            <div className="py-8 text-center">
                                <TicketIcon className="mx-auto h-12 w-12 text-gray-400" />
                                <h3 className="mt-2 text-sm font-semibold text-gray-900">
                                    No tickets found
                                </h3>
                                <p className="mt-1 text-sm text-gray-500">
                                    {searchQuery ||
                                        statusFilter !== 'all' ||
                                        clientFilter !== 'all'
                                        ? 'Try adjusting your search criteria'
                                        : 'Get started by creating a new ticket'}
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead onClick={() => {toggleSort('title')}} className="cursor-pointer">
                                                <div className="flex items-center justify-start gap-3">
                                                    Ticket {renderSortIcon('title')}
                                                </div>
                                            </TableHead>
                                            <TableHead onClick={() => {toggleSort('client')}} className="cursor-pointer">
                                                <div className="flex items-center justify-start gap-3">
                                                    Client
                                                    {renderSortIcon('client')}
                                                </div>
                                            </TableHead>
                                            <TableHead onClick={() => {toggleSort('priority')}} className="cursor-pointer">
                                                <div className="flex items-center justify-start gap-3">
                                                    Priority
                                                    {renderSortIcon('priority')}
                                                </div>
                                            </TableHead>
                                            <TableHead onClick={() => {toggleSort('assignee')}} className="cursor-pointer">
                                                <div className="flex items-center justify-start gap-3">
                                                    Assignee
                                                    {renderSortIcon('assignee')}
                                                </div>
                                            </TableHead>
                                            <TableHead onClick={() => {toggleSort('status')}} className="cursor-pointer">
                                                <div className="flex items-center justify-start gap-3">
                                                    Status {renderSortIcon('status')}
                                                </div>
                                            </TableHead>
                                            <TableHead onClick={() => {toggleSort('created_at')}} className="cursor-pointer">
                                                <div className="flex items-center justify-start gap-3">
                                                    Created
                                                    {renderSortIcon('created_at')}
                                                </div>
                                            </TableHead>
                                            <TableHead>
                                                Work
                                            </TableHead>
                                            <TableHead className='text-right'>Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredTickets.map((ticket) => (
                                            <TableRow
                                                key={ticket.id}
                                                className={`${ticket.deleted_at ? 'bg-gray-50 opacity-60' : ''}`}
                                            >
                                                <TableCell>
                                                    <div className="space-y-1">
                                                        <div className="flex items-center gap-2">
                                                            {ticket.deleted_at && (
                                                                <Trash2 className="h-4 w-4 text-gray-400" />
                                                            )}
                                                            <p
                                                                className={`text-sm leading-none font-medium ${ticket.deleted_at ? 'line-through' : ''}`}
                                                            >
                                                                {ticket.title || `Ticket #${ticket.id}`}
                                                            </p>
                                                        </div>
                                                        <p className="text-sm text-muted-foreground">
                                                            {ticket.ticket_number}
                                                        </p>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="space-y-1">
                                                        <p
                                                            className={`text-sm font-medium ${ticket.deleted_at ? 'line-through' : ''}`}
                                                        >
                                                            {ticket.client
                                                                ?.name ||
                                                                'Unknown Client'}
                                                        </p>
                                                        {ticket.organization_user && (
                                                            <p className="text-xs text-muted-foreground">
                                                                {ticket.organization_user.name}
                                                            </p>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    {getPriorityBadge(
                                                        ticket.priority,
                                                    )}
                                                </TableCell>

                                                <TableCell>
                                                    {ticket.assigned_to ? (
                                                        <div className="flex items-center space-x-2">
                                                            <User className="h-4 w-4" />
                                                            <span
                                                                className={`text-sm ${ticket.deleted_at ? 'line-through' : ''}`}
                                                            >
                                                                {
                                                                    ticket
                                                                        .assigned_to
                                                                        .name
                                                                }
                                                            </span>
                                                        </div>
                                                    ) : (
                                                        <TicketAssignmentDialog type="button" ticketId={ticket.id} />
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    {getTicketStatusBadge(ticket.status)}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col gap-1">
                                                        <div className="flex items-center space-x-1">
                                                            <Calendar className="h-4 w-4" />
                                                            <span className="text-sm">
                                                                {new Date(
                                                                    ticket.created_at,
                                                                ).toLocaleDateString()}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center space-x-1">
                                                            <UserIcon className="h-4 w-4" />
                                                            <span className="text-sm text-muted-foreground">
                                                                {ticket.created_by?.name || 'Unknown'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </TableCell>

                                                <TableCell>
                                                    {getWorkStatusBadge(
                                                        ticket.work_status,
                                                        ticket.tasks,
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center justify-end gap-2">
                                                        {/* Actions Dropdown - View and manage ticket */}
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-8 w-8"
                                                                    aria-label="Ticket actions"
                                                                >
                                                                    <MoreHorizontal className="h-4 w-4" />
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end" className="w-48">
                                                                <DropdownMenuLabel>
                                                                    Ticket Actions
                                                                </DropdownMenuLabel>
                                                                <DropdownMenuSeparator />

                                                                {/* View Ticket */}
                                                                <DropdownMenuItem asChild>
                                                                    <Link
                                                                        href={`/admin/tickets/${ticket.id}`}
                                                                        className="flex items-center gap-2 cursor-pointer"
                                                                    >
                                                                        <Eye className="h-4 w-4" />
                                                                        View Details
                                                                    </Link>
                                                                </DropdownMenuItem>
                                                                {(ticket.status != "closed" && ticket.status != "cancelled") && (
                                                                    <DropdownMenuItem asChild>
                                                                        <TicketAssignmentDialog type="link" ticketId={ticket.id} />
                                                                    </DropdownMenuItem>
                                                                )}

                                                                {/* Close Ticket */}
                                                                {(['open', 'approved', 'in-progress'] as Ticket['status'][]).includes(ticket.status) && (
                                                                    <DropdownMenuItem
                                                                        onClick={() => handleCloseTicket(ticket.id)}
                                                                        disabled={closingTicketId === ticket.id}
                                                                        className="flex items-center gap-2 cursor-pointer text-orange-600 focus:text-orange-600"
                                                                    >
                                                                        <X className="h-4 w-4" />
                                                                        {closingTicketId === ticket.id ? 'Closing...' : 'Close Ticket'}
                                                                    </DropdownMenuItem>
                                                                )}

                                                                {/* Edit Ticket */}
                                                                <DropdownMenuItem asChild>
                                                                    <Link
                                                                        href={`/admin/tickets/${ticket.id}/edit`}
                                                                        className="flex items-center gap-2 cursor-pointer"
                                                                    >
                                                                        <Edit className="h-4 w-4" />
                                                                        Edit Ticket
                                                                    </Link>
                                                                </DropdownMenuItem>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>

                                {/* Pagination */}
                                {tickets.last_page > 1 && (
                                    <div className="flex items-center justify-between">
                                        <p className="text-sm text-muted-foreground">
                                            Showing {tickets.from} to{' '}
                                            {tickets.to} of {tickets.total}{' '}
                                            results
                                        </p>
                                        <div className="flex items-center space-x-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() =>
                                                    handlePageChange(
                                                        tickets.current_page -
                                                        1,
                                                    )
                                                }
                                                disabled={
                                                    tickets.current_page <= 1 ||
                                                    isLoading
                                                }
                                            >
                                                <ChevronLeft className="h-4 w-4" />
                                                Previous
                                            </Button>
                                            <div className="flex items-center space-x-1">
                                                {Array.from(
                                                    {
                                                        length: Math.min(
                                                            5,
                                                            tickets.last_page,
                                                        ),
                                                    },
                                                    (_, i) => {
                                                        const page = i + 1;
                                                        return (
                                                            <Button
                                                                key={page}
                                                                variant={
                                                                    tickets.current_page ===
                                                                        page
                                                                        ? 'default'
                                                                        : 'outline'
                                                                }
                                                                size="sm"
                                                                onClick={() =>
                                                                    handlePageChange(
                                                                        page,
                                                                    )
                                                                }
                                                                disabled={
                                                                    isLoading
                                                                }
                                                            >
                                                                {page}
                                                            </Button>
                                                        );
                                                    },
                                                )}
                                            </div>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() =>
                                                    handlePageChange(
                                                        tickets.current_page +
                                                        1,
                                                    )
                                                }
                                                disabled={
                                                    tickets.current_page >=
                                                    tickets.last_page ||
                                                    isLoading
                                                }
                                            >
                                                Next
                                                <ChevronRight className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
