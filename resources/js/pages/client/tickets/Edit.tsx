import TicketComments from '@/components/ticket-comments';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import ClientLayout from '@/layouts/client-layout';
import { Head, Link, router, useForm } from '@inertiajs/react';

interface ClientTicketEditProps {
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

export default function ClientTicketEdit({ client, ticket }: ClientTicketEditProps) {
    const { data, setData, patch, processing, errors } = useForm({
        title: ticket.title,
        description: ticket.description ?? '',
        category: ticket.category,
        priority: ticket.priority,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        patch(`/c/${client.code}/tickets/${ticket.id}`);
    };

    const handleDelete = () => {
        if (!confirm('Delete this ticket?')) {
            return;
        }

        router.delete(`/c/${client.code}/tickets/${ticket.id}`);
    };

    return (
        <ClientLayout client={client} title={`Edit ${ticket.ticket_number}`}>
            <Head title={`${client.name} • Edit Ticket`} />

            <div className="flex flex-col gap-6">
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <h1 className="text-2xl font-semibold">Edit Ticket</h1>
                        <p className="text-sm text-muted-foreground">
                            {ticket.ticket_number}
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Link href={`/c/${client.code}/tickets/${ticket.id}`}>
                            <Button variant="outline">Back</Button>
                        </Link>
                        <Button variant="destructive" onClick={handleDelete}>
                            Delete
                        </Button>
                    </div>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Ticket Details</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="title">Title *</Label>
                                <Input
                                    id="title"
                                    value={data.title}
                                    onChange={(e) =>
                                        setData('title', e.target.value)
                                    }
                                    required
                                />
                                {errors.title ? (
                                    <p className="text-sm text-red-500">
                                        {errors.title}
                                    </p>
                                ) : null}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description">Description</Label>
                                <Textarea
                                    id="description"
                                    value={data.description}
                                    onChange={(e) =>
                                        setData('description', e.target.value)
                                    }
                                    rows={6}
                                />
                                {errors.description ? (
                                    <p className="text-sm text-red-500">
                                        {errors.description}
                                    </p>
                                ) : null}
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label>Category *</Label>
                                    <Select
                                        value={data.category}
                                        onValueChange={(value) =>
                                            setData('category', value)
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select category" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="general">
                                                General
                                            </SelectItem>
                                            <SelectItem value="support">
                                                Support
                                            </SelectItem>
                                            <SelectItem value="technical">
                                                Technical
                                            </SelectItem>
                                            <SelectItem value="billing">
                                                Billing
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                    {errors.category ? (
                                        <p className="text-sm text-red-500">
                                            {errors.category}
                                        </p>
                                    ) : null}
                                </div>

                                <div className="space-y-2">
                                    <Label>Priority *</Label>
                                    <Select
                                        value={data.priority}
                                        onValueChange={(value) =>
                                            setData('priority', value)
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select priority" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="low">Low</SelectItem>
                                            <SelectItem value="medium">
                                                Medium
                                            </SelectItem>
                                            <SelectItem value="high">High</SelectItem>
                                            <SelectItem value="critical">
                                                Critical
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                    {errors.priority ? (
                                        <p className="text-sm text-red-500">
                                            {errors.priority}
                                        </p>
                                    ) : null}
                                </div>
                            </div>

                            <div className="flex justify-end">
                                <Button type="submit" disabled={processing}>
                                    {processing ? 'Saving...' : 'Save Changes'}
                                </Button>
                            </div>
                        </form>
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

