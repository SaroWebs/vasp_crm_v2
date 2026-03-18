import TicketComments from '@/components/ticket-comments';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ClientLayout from '@/layouts/client-layout';
import { Head, Link, router } from '@inertiajs/react';

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

export default function ClientTicketShow({ client, ticket }: ClientTicketShowProps) {
    const handleDelete = () => {
        if (!confirm('Delete this ticket?')) {
            return;
        }

        router.delete(`/c/${client.code}/tickets/${ticket.id}`);
    };

    return (
        <ClientLayout client={client} title={ticket.ticket_number}>
            <Head title={`${client.name} • ${ticket.ticket_number}`} />

            <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold">{ticket.title}</h1>
                        <p className="text-sm text-muted-foreground">
                            {ticket.ticket_number} • {ticket.status} •{' '}
                            {ticket.priority}
                        </p>
                    </div>

                    <div className="flex gap-2">
                        <Link href={`/c/${client.code}/tickets`}>
                            <Button variant="outline">Back</Button>
                        </Link>
                        <Link href={`/c/${client.code}/tickets/${ticket.id}/edit`}>
                            <Button variant="outline">Edit</Button>
                        </Link>
                        <Button variant="destructive" onClick={handleDelete}>
                            Delete
                        </Button>
                    </div>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="text-sm">
                            <span className="text-muted-foreground">
                                Category:{' '}
                            </span>
                            {ticket.category}
                        </div>
                        <div className="text-sm">
                            <span className="text-muted-foreground">
                                Priority:{' '}
                            </span>
                            {ticket.priority}
                        </div>
                        <div className="text-sm">
                            <span className="text-muted-foreground">
                                Status:{' '}
                            </span>
                            {ticket.status}
                        </div>
                        <div className="text-sm">
                            <span className="text-muted-foreground">
                                Created:{' '}
                            </span>
                            {new Date(ticket.created_at).toLocaleString()}
                        </div>
                        <div className="pt-2">
                            <div className="text-sm font-medium">
                                Description
                            </div>
                            <div className="whitespace-pre-wrap text-sm text-muted-foreground">
                                {ticket.description || '—'}
                            </div>
                        </div>
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
