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
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
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
import { Head, Link, router } from '@inertiajs/react';
import {
    AlertTriangle,
    Calendar,
    CheckCircle,
    ChevronLeft,
    ChevronRight,
    Clock,
    Edit,
    Eye,
    Filter,
    ListChecks,
    MoreHorizontal,
    Search,
    TicketIcon,
    Trash2,
    User,
    XCircle,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import AdminRaiseTicket from './AdminRaiseTicket';

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
    };
    userPermissions?: string[];
    clients?: Array<{ id: number; name: string }>;
}

export default function TicketsIndex(props: TicketsIndexProps) {
    const ticket_number = '';
    const {
        tickets,
        filters = {},
        userPermissions = [],
        clients = [],
    } = props;

    const [searchQuery, setSearchQuery] = useState(filters.search || '');
    const [statusFilter, setStatusFilter] = useState(filters.status || 'all');
    const [priorityFilter, setPriorityFilter] = useState(
        filters.priority || 'all',
    );
    const [clientFilter, setClientFilter] = useState(
        filters.client_id || 'all',
    );
    const [isLoading, setIsLoading] = useState(false);

    // Filter tickets based on search query
    const filteredTickets = useMemo(() => {
        if (!searchQuery.trim()) return tickets.data;

        const query = searchQuery.toLowerCase();
        return tickets.data.filter(
            (ticket: Ticket) =>
                ticket.title.toLowerCase().includes(query) ||
                ticket.ticket_number.toLowerCase().includes(query) ||
                (ticket.description?.toLowerCase().includes(query) ?? false) ||
                (ticket.client?.name?.toLowerCase().includes(query) ?? false),
        );
    }, [tickets.data, searchQuery]);

    // Handle filter changes
    const handleFilterChange = () => {
        setIsLoading(true);
        router.get(
            '/admin/tickets',
            {
                search: searchQuery || undefined,
                status: statusFilter !== 'all' ? statusFilter : undefined,
                priority: priorityFilter !== 'all' ? priorityFilter : undefined,
                client_id: clientFilter !== 'all' ? clientFilter : undefined,
            },
            {
                preserveScroll: true,
                preserveState: true,
                onFinish: () => setIsLoading(false),
            },
        );
    };

    // Handle pagination
    const handlePageChange = (page: number) => {
        setIsLoading(true);
        router.get(
            `/admin/tickets?page=${page}`,
            {
                search: searchQuery || undefined,
                status: statusFilter !== 'all' ? statusFilter : undefined,
                priority: priorityFilter !== 'all' ? priorityFilter : undefined,
                client_id: clientFilter !== 'all' ? clientFilter : undefined,
            },
            {
                preserveScroll: true,
                preserveState: true,
                onFinish: () => setIsLoading(false),
            },
        );
    };

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

        const icons: Record<string, any> = {
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
                {status.replace('-', ' ').toUpperCase()}
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

    // Calculate statistics
    const stats = useMemo(() => {
        const allTickets: Ticket[] = tickets.data;
        return {
            total: allTickets.length,
            open: allTickets.filter((t: Ticket) => t.status === 'open').length,
            approved: allTickets.filter((t: Ticket) => t.status === 'approved')
                .length,
            inProgress: allTickets.filter(
                (t: Ticket) => t.status === 'in-progress',
            ).length,
            completed: allTickets.filter((t: Ticket) => t.status === 'closed')
                .length,
            cancelled: allTickets.filter(
                (t: Ticket) => t.status === 'cancelled',
            ).length,
        };
    }, [tickets.data]);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Tickets" />

            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto p-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">
                            Tickets
                        </h1>
                        <p className="text-muted-foreground">
                            Manage support tickets from clients
                        </p>
                    </div>
                    {/* {userPermissions.includes('ticket.create') && (
                    )} */}
                    <AdminRaiseTicket
                        clients={clients}
                        ticket_number={ticket_number}
                    />
                </div>

                {/* Stats Cards */}
                <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-6">
                    
                    {/* {Object.entries(stats).map(([key, value]) => (
                        <WizCard
                            key={key}
                            title={key.charAt(0).toUpperCase() + key.slice(1)}
                            text={`All ${key} tickets`}
                            stats={value}
                            icon={TicketIcon}
                        />
                    ))} */}
                    <WizCard title="Total Tickets" text="All tickets in system" stats={stats.total} icon={TicketIcon} />
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Open
                            </CardTitle>
                            <Clock className="h-4 w-4 text-red-500" />
                        </CardHeader>
                        <CardContent className="pt-2">
                            <div className="text-2xl font-bold text-red-600">
                                {stats.open}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Pending review
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Approved
                            </CardTitle>
                            <CheckCircle className="h-4 w-4 text-green-500" />
                        </CardHeader>
                        <CardContent className="pt-2">
                            <div className="text-2xl font-bold text-green-600">
                                {stats.approved}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Ready for tasks
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                In Progress
                            </CardTitle>
                            <Clock className="h-4 w-4 text-blue-500" />
                        </CardHeader>
                        <CardContent className="pt-2">
                            <div className="text-2xl font-bold text-blue-600">
                                {stats.inProgress}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Currently being worked on
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Completed
                            </CardTitle>
                            <CheckCircle className="h-4 w-4 text-green-500" />
                        </CardHeader>
                        <CardContent className="pt-2">
                            <div className="text-2xl font-bold text-green-600">
                                {stats.completed}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Resolved tickets
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Cancelled
                            </CardTitle>
                            <XCircle className="h-4 w-4 text-gray-500" />
                        </CardHeader>
                        <CardContent className="pt-2">
                            <div className="text-2xl font-bold text-gray-600">
                                {stats.cancelled}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Cancelled tickets
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Filters */}
                <Card>
                    <CardHeader>
                        <CardTitle>Filter & Search</CardTitle>
                        <CardDescription>
                            Search and filter tickets by various criteria
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">
                                    Search
                                </label>
                                <div className="relative">
                                    <Search className="absolute top-2.5 left-2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Search tickets..."
                                        value={searchQuery}
                                        onChange={(e) =>
                                            setSearchQuery(e.target.value)
                                        }
                                        onKeyDown={(e) =>
                                            e.key === 'Enter' &&
                                            handleFilterChange()
                                        }
                                        className="pl-8"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">
                                    Status
                                </label>
                                <Select
                                    value={statusFilter}
                                    onValueChange={setStatusFilter}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">
                                            All Statuses
                                        </SelectItem>
                                        <SelectItem value="open">
                                            Open
                                        </SelectItem>
                                        <SelectItem value="approved">
                                            Approved
                                        </SelectItem>
                                        <SelectItem value="in-progress">
                                            In Progress
                                        </SelectItem>
                                        <SelectItem value="closed">
                                            Closed
                                        </SelectItem>
                                        <SelectItem value="cancelled">
                                            Cancelled
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">
                                    Priority
                                </label>
                                <Select
                                    value={priorityFilter}
                                    onValueChange={setPriorityFilter}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select priority" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">
                                            All Priorities
                                        </SelectItem>
                                        <SelectItem value="low">Low</SelectItem>
                                        <SelectItem value="medium">
                                            Medium
                                        </SelectItem>
                                        <SelectItem value="high">
                                            High
                                        </SelectItem>
                                        <SelectItem value="critical">
                                            Critical
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">
                                    Client
                                </label>
                                <Select
                                    value={clientFilter}
                                    onValueChange={setClientFilter}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select client" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">
                                            All Clients
                                        </SelectItem>
                                        {clients.map((client) => (
                                            <SelectItem
                                                key={client.id}
                                                value={client.id.toString()}
                                            >
                                                {client.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">
                                    &nbsp;
                                </label>
                                <Button
                                    onClick={handleFilterChange}
                                    className="w-full"
                                    disabled={isLoading}
                                >
                                    <Filter className="mr-2 h-4 w-4" />
                                    Apply Filters
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Ticket Table */}
                <Card>
                    <CardHeader>
                        <CardTitle>All Tickets</CardTitle>
                        <CardDescription>
                            Complete list of all tickets in the system (
                            {tickets.total} total)
                        </CardDescription>
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
                                        priorityFilter !== 'all' ||
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
                                            <TableHead>Ticket</TableHead>
                                            <TableHead>Client</TableHead>
                                            <TableHead>Priority</TableHead>
                                            <TableHead>Assignee</TableHead>
                                            <TableHead>Created</TableHead>
                                            <TableHead>Work</TableHead>
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
                                                        <span className="text-sm text-muted-foreground">
                                                            Unassigned
                                                        </span>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center space-x-1">
                                                        <Calendar className="h-4 w-4" />
                                                        <span className="text-sm">
                                                            {new Date(
                                                                ticket.created_at,
                                                            ).toLocaleDateString()}
                                                        </span>
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
                                                        {/* Status Badge - Shows ticket status with icon and color */}
                                                        {getTicketStatusBadge(ticket.status)}

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


const WizCard = ({ title, text, stats, icon: Icon }: { title: string; text: string; stats: any; icon: React.ElementType }) => {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                    {title}
                </CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="pt-2">
                <div className="text-2xl font-bold">
                    {stats}
                </div>
                <p className="text-xs text-muted-foreground">
                    {text}
                </p>
            </CardContent>
        </Card>
    );
};
