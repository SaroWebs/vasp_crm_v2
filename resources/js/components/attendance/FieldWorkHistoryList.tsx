import { useEffect, useState } from 'react';
import axios from 'axios';
import { Alert, Badge, Group, Loader, Pagination, Table, Text } from '@mantine/core';
import { Info } from 'lucide-react';

interface FieldWorkRequest {
    id: number;
    start_date: string;
    end_date: string;
    location: string;
    description: string | null;
    status: string;
    requested_at: string;
}

interface FieldWorkHistoryListProps {
    auth: any;
    month?: number;
    year?: number;
    refreshKey?: number;
}

const statusConfig: Record<string, { color: string; label: string }> = {
    pending: { color: 'yellow', label: 'Pending' },
    approved: { color: 'green', label: 'Approved' },
    rejected: { color: 'red', label: 'Rejected' },
    cancelled: { color: 'gray', label: 'Cancelled' },
};

export function FieldWorkHistoryList({ auth: _auth, month, year, refreshKey = 0 }: FieldWorkHistoryListProps) {
    const [requests, setRequests] = useState<FieldWorkRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const targetMonth = month ?? new Date().getMonth() + 1;
    const targetYear = year ?? new Date().getFullYear();

    useEffect(() => {
        const fetchFieldWorkRequests = async () => {
            setLoading(true);
            setError(null);

            try {
                const response = await axios.get('/api/my/field-work', {
                    params: { month: targetMonth, year: targetYear, page },
                });
                setRequests(response.data.data ?? []);
                setTotalPages(response.data.meta?.last_page ?? 1);
            } catch (err: any) {
                setError(err.response?.data?.message ?? 'Failed to fetch field work requests');
            } finally {
                setLoading(false);
            }
        };

        fetchFieldWorkRequests();
    }, [targetMonth, targetYear, page, refreshKey]);

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
                <Loader />
            </div>
        );
    }

    if (error) {
        return (
            <Alert color="red" icon={<Info size={16} />}>
                {error}
            </Alert>
        );
    }

    return (
        <>
            <Table striped highlightOnHover>
                <thead>
                    <tr>
                        <th>Duration</th>
                        <th>Location</th>
                        <th>Description</th>
                        <th>Status</th>
                        <th>Requested</th>
                    </tr>
                </thead>
                <tbody>
                    {requests.length === 0 ? (
                        <tr>
                            <td colSpan={5} style={{ textAlign: 'center', padding: '2rem' }}>
                                <Text color="dimmed">No field work requests found</Text>
                            </td>
                        </tr>
                    ) : (
                        requests.map((request) => {
                            const config = statusConfig[request.status] ?? { color: 'gray', label: request.status };

                            return (
                                <tr key={request.id}>
                                    <td>
                                        <Text size="sm">
                                            {new Date(request.start_date).toLocaleDateString()} - {new Date(request.end_date).toLocaleDateString()}
                                        </Text>
                                    </td>
                                    <td>
                                        <Text size="sm">{request.location}</Text>
                                    </td>
                                    <td>
                                        <Text size="sm" color="dimmed" truncate>
                                            {request.description || '-'}
                                        </Text>
                                    </td>
                                    <td>
                                        <Badge color={config.color} variant="light">
                                            {config.label}
                                        </Badge>
                                    </td>
                                    <td>
                                        <Text size="sm" color="dimmed">
                                            {new Date(request.requested_at).toLocaleDateString()}
                                        </Text>
                                    </td>
                                </tr>
                            );
                        })
                    )}
                </tbody>
            </Table>

            {totalPages > 1 && (
                <Group mt="md">
                    <Pagination value={page} onChange={setPage} total={totalPages} siblings={1} />
                </Group>
            )}
        </>
    );
}
