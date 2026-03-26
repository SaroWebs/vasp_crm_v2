import TicketComments from '@/components/ticket-comments';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ClientLayout from '@/layouts/client-layout';
import { Head, Link, router } from '@inertiajs/react';
import { CalendarClock, CircleAlert, FolderKanban, Ticket } from 'lucide-react';

interface ClientTicketShowProps {
    client: {
        id: number;
        name: string;
        code: string;
    };
    ticket: {
        id: number;
        ticket_number: string;
        title: string;
        description?: string | null;
        category: string;
        priority: string;
        status: string;
        assigned_to?: number | null;
        created_at: string;
        updated_at: string;
    };
}

export default function ClientTicketShow({
    client,
    ticket,
}: ClientTicketShowProps) {
    const handleReopen = () => {
        if (!confirm('Reopen this ticket?')) {
            return;
        }

        router.post(`/c/${client.code}/tickets/${ticket.id}/reopen`);
    };

    const handleDelete = () => {
        if (!confirm('Delete this ticket?')) {
            return;
        }

        router.delete(`/c/${client.code}/tickets/${ticket.id}`);
    };

    const statusBadgeClass = (status: string) => {
        const normalized = status.toLowerCase();
        if (normalized === 'open') {
            return 'bg-blue-50 text-blue-700 border-blue-200';
        }
        if (normalized === 'approved' || normalized === 'in-progress') {
            return 'bg-amber-50 text-amber-700 border-amber-200';
        }
        if (normalized === 'closed') {
            return 'bg-emerald-50 text-emerald-700 border-emerald-200';
        }

        return 'bg-muted text-muted-foreground';
    };

    const priorityBadgeClass = (priority: string) => {
        const normalized = priority.toLowerCase();
        if (normalized === 'critical') {
            return 'bg-rose-50 text-rose-700 border-rose-200';
        }
        if (normalized === 'high') {
            return 'bg-orange-50 text-orange-700 border-orange-200';
        }
        if (normalized === 'medium') {
            return 'bg-yellow-50 text-yellow-700 border-yellow-200';
        }

        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    };

    return (
        <ClientLayout client={client} title={ticket.ticket_number}>
            <Head title={`${client.name} - ${ticket.ticket_number}`} />

            <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                            <Badge
                                variant="outline"
                                className="font-mono text-[11px]"
                            >
                                {ticket.ticket_number}
                            </Badge>
                            <Badge
                                variant="outline"
                                className={`capitalize ${statusBadgeClass(ticket.status)}`}
                            >
                                {ticket.status}
                            </Badge>
                            <Badge
                                variant="outline"
                                className={`capitalize ${priorityBadgeClass(ticket.priority)}`}
                            >
                                {ticket.priority}
                            </Badge>
                            <Badge variant="outline" className="capitalize">
                                {ticket.category}
                            </Badge>
                        </div>
                        <h1 className="text-2xl font-semibold">
                            {ticket.title}
                        </h1>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <Link href={`/c/${client.code}/tickets`}>
                            <Button variant="outline">Back</Button>
                        </Link>
                        {ticket.status === 'closed' ||
                        ticket.status === 'cancelled' ? (
                            <Button variant="outline" onClick={handleReopen}>
                                <RotateCcw className="mr-2 h-4 w-4" />
                                Reopen
                            </Button>
                        ) : null}
                        {ticket.status === 'open' && !ticket.assigned_to ? (
                            <Link
                                href={`/c/${client.code}/tickets/${ticket.id}/edit`}
                            >
                                <Button variant="outline">Edit</Button>
                            </Link>
                        ) : null}
                        {ticket.status === 'open' && !ticket.assigned_to ? (
                            <Button
                                variant="destructive"
                                onClick={handleDelete}
                            >
                                Delete
                            </Button>
                        ) : null}
                    </div>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Ticket Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                            <div className="rounded-md border p-3">
                                <p className="mb-1 flex items-center gap-2 text-xs text-muted-foreground">
                                    <FolderKanban className="h-3.5 w-3.5" />
                                    Category
                                </p>
                                <p className="text-sm font-medium capitalize">
                                    {ticket.category}
                                </p>
                            </div>
                            <div className="rounded-md border p-3">
                                <p className="mb-1 flex items-center gap-2 text-xs text-muted-foreground">
                                    <CircleAlert className="h-3.5 w-3.5" />
                                    Priority
                                </p>
                                <p className="text-sm font-medium capitalize">
                                    {ticket.priority}
                                </p>
                            </div>
                            <div className="rounded-md border p-3">
                                <p className="mb-1 flex items-center gap-2 text-xs text-muted-foreground">
                                    <Ticket className="h-3.5 w-3.5" />
                                    Status
                                </p>
                                <p className="text-sm font-medium capitalize">
                                    {ticket.status}
                                </p>
                            </div>
                            <div className="rounded-md border p-3">
                                <p className="mb-1 flex items-center gap-2 text-xs text-muted-foreground">
                                    <CalendarClock className="h-3.5 w-3.5" />
                                    Last Updated
                                </p>
                                <p className="text-sm font-medium">
                                    {new Date(
                                        ticket.updated_at,
                                    ).toLocaleString()}
                                </p>
                            </div>
                        </div>

                        <div className="rounded-md border bg-muted/20 p-4">
                            <div className="mb-2 text-sm font-medium">
                                Description
                            </div>
                            <div className="text-sm whitespace-pre-wrap text-muted-foreground">
                                {ticket.description?.trim() ||
                                    'No additional details were provided for this ticket yet.'}
                            </div>
                        </div>

                        <p className="text-xs text-muted-foreground">
                            Created{' '}
                            {new Date(ticket.created_at).toLocaleString()}
                        </p>
                    </CardContent>
                </Card>

                <TicketComments
                    ticketId={ticket.id}
                    basePath={`/c/${client.code}`}
                />
            </div>
        </ClientLayout>
    );
}
