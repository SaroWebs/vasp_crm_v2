import { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from '@inertiajs/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function RecentTicketsWidget() {
    const [tickets, setTickets] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        axios.get('/admin/api/dashboard/tickets')
            .then(res => setTickets(res.data.tickets || []))
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Recent Tickets</CardTitle>
                    <CardDescription>Loading tickets...</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="h-48 animate-pulse bg-muted rounded-md" />
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Recent Tickets</CardTitle>
                <CardDescription>Latest ticket submissions</CardDescription>
            </CardHeader>
            <CardContent>
                {tickets.length > 0 ? tickets.map((ticket) => (
                    <Link
                        key={ticket.id}
                        href={`/admin/tickets/${ticket.id}`}
                        className="flex cursor-pointer items-center justify-between space-x-4"
                    >
                        <div className="flex w-full items-center justify-between pb-4">
                            <div className="flex-1 space-y-1">
                                <p className="text-sm leading-none font-medium">{ticket.subject || ticket.title}</p>
                                <p className="text-sm text-muted-foreground">
                                    {ticket.client || ticket.client?.name} • {ticket.ticket_number}
                                </p>
                            </div>
                            <Badge
                                variant={
                                    ticket.status === 'open'
                                        ? 'destructive'
                                        : ticket.status === 'approved'
                                            ? 'default'
                                            : 'secondary'
                                }
                                className="h-6"
                            >
                                {ticket.status}
                            </Badge>
                        </div>
                    </Link>
                )) : (
                    <p className="text-sm text-muted-foreground">No recent tickets.</p>
                )}
            </CardContent>
        </Card>
    );
}
