import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import {
    Building2,
    Clock,
    Edit,
    Eye,
    Mail,
    MapPin,
    Package,
    Phone,
    Ticket,
    TrendingUp,
    Users,
} from 'lucide-react';
import { useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Admin', href: '/admin/dashboard' },
    { title: 'Clients', href: '/admin/clients' },
    { title: 'Client Details', href: '' },
];

interface ClientShowProps {
    client: {
        id: number;
        name: string;
        email: string;
        phone?: string;
        code?: string;
        address?: string;
        status: string;
        product?: {
            id: number;
            name: string;
        } | null;
        created_at: string;
        updated_at: string;
        organization_users?: Array<{
            id: number;
            name: string;
            email?: string;
            designation?: string;
            phone?: string;
            status: string;
        }>;
        tickets?: Array<{
            id: number;
            ticket_number: string;
            title: string;
            description?: string;
            priority: string;
            status: string;
            created_at: string;
            organization_user?: {
                id: number;
                name: string;
            };
        }>;
    };
    stats: {
        total_organization_users: number;
        active_organization_users: number;
        total_tickets: number;
        open_tickets: number;
        approved_tickets: number;
        completed_tickets: number;
    };
    canEdit: boolean;
    canDelete: boolean;
    canRead: boolean;
}

export default function ClientShow(props: ClientShowProps) {
    const { client, stats, canEdit, canRead } = props;
    const [isApproving] = useState(false);

    const getStatusBadge = (status: string) => {
        const variants: Record<
            string,
            'default' | 'secondary' | 'destructive' | 'outline'
        > = {
            active: 'default',
            inactive: 'secondary',
            open: 'destructive',
            approved: 'default',
            'in-progress': 'secondary',
            closed: 'outline',
            rejected: 'destructive',
        };

        return (
            <Badge variant={variants[status] || 'secondary'}>{status}</Badge>
        );
    };

    const getPriorityBadge = (priority: string) => {
        const variants: Record<
            string,
            'default' | 'secondary' | 'destructive' | 'outline'
        > = {
            low: 'outline',
            medium: 'secondary',
            high: 'default',
            critical: 'destructive',
        };

        return (
            <Badge variant={variants[priority] || 'secondary'}>
                {priority}
            </Badge>
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Client: ${client.name}`} />

            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto p-6">
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <h1 className="text-3xl font-bold tracking-tight">
                            {client.name}
                        </h1>
                        <p className="text-muted-foreground">
                            Client overview and activity
                        </p>
                    </div>
                    <div className="flex items-center space-x-2">
                        {canRead && (
                            <Button variant="outline" asChild>
                                <Link href="/admin/clients">
                                    <Eye className="mr-2 h-4 w-4" />
                                    Back to Clients
                                </Link>
                            </Button>
                        )}
                        {canEdit && (
                            <Button asChild>
                                <Link href={`/admin/clients/${client.id}/edit`}>
                                    <Edit className="mr-2 h-4 w-4" />
                                    Edit Client
                                </Link>
                            </Button>
                        )}

                        <Button asChild disabled={isApproving}>
                            <Link
                                href={`/admin/tickets/create?client_id=${client.id}`}
                            >
                                <Ticket className="mr-2 h-4 w-4" />
                                Create Ticket
                            </Link>
                        </Button>
                    </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Users
                            </CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {stats.total_organization_users}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                {stats.active_organization_users} active
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Total Tickets
                            </CardTitle>
                            <Ticket className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {stats.total_tickets}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                All time tickets
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Open Tickets
                            </CardTitle>
                            <Clock className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {stats.open_tickets}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Requiring attention
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Resolution Rate
                            </CardTitle>
                            <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {stats.total_tickets > 0
                                    ? Math.round(
                                          (stats.completed_tickets /
                                              stats.total_tickets) *
                                              100,
                                      )
                                    : 0}
                                %
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Tickets resolved
                            </p>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Client Information</CardTitle>
                            <CardDescription>
                                Contact details and profile information
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-4">
                                <div className="flex items-center space-x-4">
                                    <div className="flex items-center space-x-2">
                                        <Building2 className="h-5 w-5 text-muted-foreground" />
                                        <span className="font-medium">
                                            Status:
                                        </span>
                                        {getStatusBadge(client.status)}
                                    </div>
                                </div>

                                {client.product && (
                                    <div className="flex items-center space-x-3">
                                        <Package className="h-4 w-4 text-muted-foreground" />
                                        <div>
                                            <p className="text-sm font-medium">
                                                Product
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                                {client.product.name}
                                            </p>
                                        </div>
                                    </div>
                                )}
                                {client.email && (
                                    <div className="flex items-center space-x-3">
                                        <Mail className="h-4 w-4 text-muted-foreground" />
                                        <div>
                                            <p className="text-sm font-medium">
                                                Email
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                                {client.email || 'No email'}
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {client.phone && (
                                    <div className="flex items-center space-x-3">
                                        <Phone className="h-4 w-4 text-muted-foreground" />
                                        <div>
                                            <p className="text-sm font-medium">
                                                Phone
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                                {client.phone}
                                            </p>
                                        </div>
                                    </div>
                                )}

                                <div className="flex items-start space-x-3">
                                    <Building2 className="mt-0.5 h-4 w-4 text-muted-foreground" />
                                    <div className="flex w-full items-start justify-between gap-4">
                                        <div>
                                            <p className="text-sm font-medium">
                                                Client Code
                                            </p>
                                            {client.code ? (
                                                <p className="text-sm text-muted-foreground">
                                                    {client.code}
                                                </p>
                                            ) : (
                                                <p className="text-sm text-muted-foreground">
                                                    No code assigned yet
                                                </p>
                                            )}
                                        </div>
                                        {canEdit && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                asChild
                                            >
                                                <Link
                                                    href={`/admin/clients/${client.id}/edit`}
                                                >
                                                    {client.code
                                                        ? 'Change Code'
                                                        : 'Add Code'}
                                                </Link>
                                            </Button>
                                        )}
                                    </div>
                                </div>

                                {client.address && (
                                    <div className="flex items-center space-x-3">
                                        <MapPin className="h-4 w-4 text-muted-foreground" />
                                        <div>
                                            <p className="text-sm font-medium">
                                                Address
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                                {client.address}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <div className="flex justify-between">
                                <div className="">
                                    <CardTitle>
                                        Users (
                                        {client.organization_users?.length || 0}
                                        )
                                    </CardTitle>
                                    <CardDescription>
                                        Users associated with this client
                                    </CardDescription>
                                </div>
                                <div className="">
                                    {canEdit && (
                                        <Button variant="outline" asChild>
                                            <Link
                                                href={`/admin/clients/${client.id}/organization-users/manage`}
                                            >
                                                <Users className="mr-2 h-4 w-4" />
                                                Manage Client Users
                                            </Link>
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {client.organization_users &&
                            client.organization_users.length > 0 ? (
                                <div className="space-y-3">
                                    {client.organization_users.map(
                                        (user: any) => (
                                            <div
                                                key={user.id}
                                                className="flex items-center justify-between rounded-lg border p-3"
                                            >
                                                <div className="space-y-1">
                                                    <p className="text-sm font-medium">
                                                        {user.name}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {user.designation ||
                                                            'No designation'}{' '}
                                                        ●{' '}
                                                        {user.email ||
                                                            'No email'}
                                                    </p>
                                                </div>
                                                <Badge
                                                    variant={
                                                        user.status === 'active'
                                                            ? 'default'
                                                            : 'secondary'
                                                    }
                                                >
                                                    {user.status}
                                                </Badge>
                                            </div>
                                        ),
                                    )}
                                </div>
                            ) : (
                                <p className="py-4 text-center text-sm text-muted-foreground">
                                    No client users found
                                </p>
                            )}
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>
                            Recent Tickets ({client.tickets?.length || 0})
                        </CardTitle>
                        <CardDescription>
                            Latest tickets from this client
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {client.tickets && client.tickets.length > 0 ? (
                                client.tickets.map((ticket) => (
                                    <div
                                        key={ticket.id}
                                        className="flex items-center justify-between rounded-lg border p-4"
                                    >
                                        <div className="space-y-1">
                                            <p className="text-sm leading-none font-medium">
                                                {ticket.title}
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                                #{ticket.ticket_number} ●{' '}
                                                {ticket.organization_user
                                                    ?.name ||
                                                    'Unknown requester'}
                                            </p>
                                            {ticket.description && (
                                                <p className="text-xs text-muted-foreground">
                                                    {ticket.description.substring(
                                                        0,
                                                        100,
                                                    )}
                                                    ...
                                                </p>
                                            )}
                                            <p className="text-xs text-muted-foreground">
                                                {new Date(
                                                    ticket.created_at,
                                                ).toLocaleDateString()}
                                            </p>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            {getPriorityBadge(ticket.priority)}
                                            {getStatusBadge(ticket.status)}

                                            <Button
                                                variant="outline"
                                                size="sm"
                                                asChild
                                            >
                                                <Link
                                                    href={`/admin/tickets/${ticket.id}`}
                                                >
                                                    <Eye className="mr-1 h-3 w-3" />
                                                    View
                                                </Link>
                                            </Button>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="py-4 text-center text-sm text-muted-foreground">
                                    No tickets found
                                </p>
                            )}
                        </div>

                        {client.tickets && client.tickets.length > 0 && (
                            <div className="mt-4 border-t pt-4">
                                <Button
                                    variant="outline"
                                    asChild
                                    className="w-full"
                                >
                                    <Link
                                        href={`/admin/tickets?client_id=${client.id}`}
                                    >
                                        View All Tickets
                                    </Link>
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
