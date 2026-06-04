import { useEffect, useState } from 'react';
import axios from 'axios';
import { Table, Text, Badge, Group, Pagination, Loader, Alert } from '@mantine/core';
import { Info } from 'lucide-react';

interface LeaveRequest {
    id: number;
    leave_type: { id: number; name: string } | null;
    start_date: string;
    end_date: string;
    reason: string;
    status: string;
    requested_at: string;
}

interface LeaveHistoryListProps {
    auth: any;
    month?: number;
    year?: number;
}

const statusConfig: Record<string, { color: string; label: string }> = {
    pending: { color: 'yellow', label: 'Pending' },
    approved: { color: 'green', label: 'Approved' },
    rejected: { color: 'red', label: 'Rejected' },
};

export function LeaveHistoryList({ auth, month, year }: LeaveHistoryListProps) {
    const [requests, setRequests] = useState<LeaveRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const targetMonth = month ?? new Date().getMonth() + 1;
    const targetYear = year ?? new Date().getFullYear();

    useEffect(() => {
        const fetchLeaveRequests = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await axios.get('/api/my/leaves', {
                    params: { month: targetMonth, year: targetYear, page },
                });
                setRequests(response.data.data ?? []);
                setTotalPages(response.data.meta?.last_page ?? 1);
            } catch (err: any) {
                setError(err.response?.data?.message ?? 'Failed to fetch leave requests');
            } finally {
                setLoading(false);
            }
        };

        fetchLeaveRequests();
    }, [targetMonth, targetYear, page]);

    const rows = requests.map((request) => {
        const config = statusConfig[request.status] ?? { color: 'gray', label: request.status };
        return (
            <tr key={request.id}>
                <td>
                    <Text size="sm">
                        {request.leave_type?.name ?? 'N/A'}
                    </Text>
                </td>
                <td>
                    <Text size="sm">
                        {new Date(request.start_date).toLocaleDateString()} - {' '}
                        {new Date(request.end_date).toLocaleDateString()}
                    </Text>
                </td>
                <td>
                    <Text size="sm" color="dimmed" truncate>
                        {request.reason}
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
    });

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
                        <th>Leave Type</th>
                        <th>Duration</th>
                        <th>Reason</th>
                        <th>Status</th>
                        <th>Requested</th>
                    </tr>
                </thead>
                <tbody>
                    {rows.length === 0 ? (
                        <tr>
                            <td colSpan={5} style={{ textAlign: 'center', padding: '2rem' }}>
                                <Text color="dimmed">No leave requests found</Text>
                            </td>
                        </tr>
                    ) : (
                        rows
                    )}
                </tbody>
            </Table>

            {totalPages > 1 && (
                <Group mt="md">
                    <Pagination
                        value={page}
                        onChange={setPage}
                        total={totalPages}
                        siblings={1}
                    />
                </Group>
            )}
        </>
    );
}