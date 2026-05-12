import { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from '@inertiajs/react';
import {
    Card,
    Table,
    Badge,
    Text,
    Skeleton,
    Group,
    Stack,
} from '@mantine/core';
import { TicketIcon } from 'lucide-react';

type Ticket = {
    id: number;
    ticket_number: string;
    subject: string | null;
    status: 'open' | 'in-progress' | 'closed';
    priority: 'low' | 'medium' | 'high';
    client: string;
    created_at: string;
};

const statusColor: Record<string, string> = {
    open: 'blue',
    'in-progress': 'yellow',
    closed: 'gray',
};

const priorityColor: Record<string, string> = {
    low: 'green',
    medium: 'orange',
    high: 'red',
};

function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    const weeks = Math.floor(days / 7);
    const months = Math.floor(days / 30);

    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins} min${mins > 1 ? 's' : ''} ago`;
    if (hours < 24) return `${hours} hr${hours > 1 ? 's' : ''} ago`;
    if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (weeks < 5) return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
    return `${months} month${months > 1 ? 's' : ''} ago`;
}

export default function RecentTicketsWidget() {
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        axios
            .get('/admin/api/dashboard/tickets')
            .then((res) => setTickets(res.data.tickets || []))
            .catch((err) => console.error(err))
            .finally(() => setLoading(false));
    }, []);

    return (
        <Card withBorder radius="md">
            <Card.Section withBorder inheritPadding py="sm" mb="sm">
                <Group gap="xs">
                    <TicketIcon size={18} className="text-blue-500" />
                    <Text fw={600} size="sm">Recent Tickets</Text>
                </Group>
            </Card.Section>

            {loading ? (
                <Stack gap="xs">
                    {[...Array(4)].map((_, i) => (
                        <Skeleton key={i} height={36} radius="sm" />
                    ))}
                </Stack>
            ) : tickets.length === 0 ? (
                <Text size="sm" c="dimmed" ta="center" py="xl">
                    No recent tickets.
                </Text>
            ) : (
                <div className="max-h-90 overflow-y-auto">
                    <Table
                        striped
                        highlightOnHover
                        withTableBorder
                        withColumnBorders
                        verticalSpacing="xs"
                        horizontalSpacing="sm"
                        fz="sm"
                    >
                        <Table.Thead>
                            <Table.Tr>
                                <Table.Th>Subject</Table.Th>
                                <Table.Th>Client</Table.Th>
                            </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                            {tickets.map((ticket) => (
                                <Table.Tr key={ticket.id} className="cursor-pointer">
                                    <Table.Td maw={300} style={{ overflow: 'hidden' }}>
                                        <div className="flex flex-col">
                                            <Link
                                                href={`/admin/tickets/${ticket.id}`}
                                                className="text-gray-500 capitalize hover:underline block truncate"
                                            >
                                                {ticket.subject} {ticket.subject} {ticket.subject} 
                                            </Link>
                                            <div className="flex gap-2 items-center mt-1">
                                                <Badge
                                                    size="xs"
                                                    variant="outline"
                                                    color={priorityColor[ticket.priority] ?? 'gray'}
                                                >
                                                    {ticket.priority}
                                                </Badge>
                                                <span className="text-xs text-gray-200">
                                                    ●
                                                </span>
                                                <Badge
                                                    size="xs"
                                                    variant="outline"
                                                    color={statusColor[ticket.status] ?? 'gray'}
                                                >
                                                    {ticket.status}
                                                </Badge>
                                                <span className="text-xs text-gray-200">
                                                    ●
                                                </span>
                                                <Text size="xs" c="dimmed" className='font-mono text-xs'>
                                                    {timeAgo(ticket.created_at)}
                                                </Text>
                                            </div>
                                        </div>
                                    </Table.Td>

                                    <Table.Td maw={120} style={{ overflow: 'hidden' }}>
                                        <Text size="xs" fw={200} truncate className='font-mono text-xs'>
                                            {ticket.client}
                                        </Text>
                                    </Table.Td>
                                </Table.Tr>
                            ))}
                        </Table.Tbody>
                    </Table>
                </div>
            )}
        </Card>
    );
}