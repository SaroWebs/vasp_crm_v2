import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import ClientLayout from '@/layouts/client-layout';
import { Head, Link, router } from '@inertiajs/react';

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
    return (
        <ClientLayout client={client} title="Tickets">
            <Head title={`${client.name} • Tickets`} />

            <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex w-full max-w-md gap-2">
                        <Input
                            defaultValue={filters.search ?? ''}
                            placeholder="Search tickets..."
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    const value = (
                                        e.target as HTMLInputElement
                                    ).value;
                                    router.get(`/c/${client.code}/tickets`, {
                                        search: value || undefined,
                                    });
                                }
                            }}
                        />
                        <Button
                            variant="outline"
                            onClick={() =>
                                router.get(`/c/${client.code}/tickets`, {
                                    search: undefined,
                                })
                            }
                        >
                            Clear
                        </Button>
                    </div>

                    <Link href={`/c/${client.code}/tickets/create`}>
                        <Button>Create Ticket</Button>
                    </Link>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Your Tickets</CardTitle>
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
                                    className="block rounded-md border p-4 hover:bg-muted/50"
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="space-y-1">
                                            <div className="text-sm font-medium">
                                                {ticket.title}
                                            </div>
                                            <div className="text-xs text-muted-foreground">
                                                {ticket.ticket_number} •{' '}
                                                {ticket.status} •{' '}
                                                {ticket.priority}
                                            </div>
                                        </div>
                                        <div className="text-xs text-muted-foreground">
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

