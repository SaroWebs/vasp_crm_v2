import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import ClientLayout from '@/layouts/client-layout';
import { Head, Link, router } from '@inertiajs/react';
import { Search, TicketPlus } from 'lucide-react';
import { useState } from 'react';

interface ClientTicketsIndexProps {
    client: {
        id: number;
        name: string;
        code: string;
    };
    tickets: {
        data: Array<{
            id: number;
            ticket_number: string;
            title: string;
            status: string;
            priority: string;
            created_at: string;
        }>;
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
    filters: {
        search?: string | null;
    };
}

export default function ClientTicketsIndex({
    client,
    tickets,
    filters,
}: ClientTicketsIndexProps) {
    const [search, setSearch] = useState(filters.search ?? '');

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

    const applySearch = () => {
        router.get(
            `/c/${client.code}/tickets`,
            { search: search.trim() || undefined },
            { preserveScroll: true, preserveState: true },
        );
    };

    const clearSearch = () => {
        setSearch('');
        router.get(
            `/c/${client.code}/tickets`,
            { search: undefined },
            { preserveScroll: true, preserveState: true },
        );
    };

    return (
        <ClientLayout client={client} title="Tickets">
            <Head title={`${client.name} - Tickets`} />

            <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex w-full flex-col gap-2 sm:max-w-2xl sm:flex-row">
                        <div className="relative flex-1">
                            <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                value={search}
                                placeholder="Search by title or ticket number..."
                                className="pl-9"
                                onChange={(e) => setSearch(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        applySearch();
                                    }
                                }}
                            />
                        </div>
                        <Button variant="outline" onClick={applySearch}>
                            Search
                        </Button>
                        <Button variant="ghost" onClick={clearSearch}>
                            Clear
                        </Button>
                    </div>

                    <Link href={`/c/${client.code}/tickets/create`}>
                        <Button className="w-full sm:w-auto">
                            <TicketPlus className="mr-2 h-4 w-4" />
                            Create Ticket
                        </Button>
                    </Link>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Your Tickets</CardTitle>
                        <p className="text-sm text-muted-foreground">
                            Showing {tickets.data.length} of {tickets.total}{' '}
                            total tickets
                        </p>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {tickets.data.length === 0 ? (
                                <p className="text-sm text-muted-foreground">
                                    No tickets found.
                                </p>
                            ) : null}

                            {tickets.data.map((ticket) => (
                                <Link
                                    key={ticket.id}
                                    href={`/c/${client.code}/tickets/${ticket.id}`}
                                    className="block rounded-lg border p-4 transition-colors hover:bg-muted/50"
                                >
                                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                        <div className="space-y-2">
                                            <div className="text-sm font-semibold">
                                                {ticket.title}
                                            </div>
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
                                            </div>
                                        </div>
                                        <div className="text-xs text-muted-foreground sm:text-right">
                                            Created
                                            <br />
                                            {new Date(
                                                ticket.created_at,
                                            ).toLocaleString()}
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </ClientLayout>
    );
}
