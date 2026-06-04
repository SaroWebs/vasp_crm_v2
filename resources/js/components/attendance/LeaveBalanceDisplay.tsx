import { useEffect, useState } from 'react';
import axios from 'axios';
import { Card, Grid, Text, Badge, Stack, Loader } from '@mantine/core';
import { Calendar, CalendarDays, Clock } from 'lucide-react';

interface LeaveTypeBalance {
    leave_type: { id: number; name: string };
    opening_balance: number;
    allocated_hours: number;
    used_hours: number;
    closing_balance: number;
    available_balance: number;
}

interface LeaveBalanceDisplayProps {
    auth: any;
    year?: number;
}

export function LeaveBalanceDisplay({ auth, year }: LeaveBalanceDisplayProps) {
    const [balances, setBalances] = useState<LeaveTypeBalance[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const targetYear = year ?? new Date().getFullYear();

    useEffect(() => {
        const fetchLeaveBalances = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await axios.get(`/api/my/leave-balances?year=${targetYear}`);
                setBalances(response.data.data ?? []);
            } catch (err: any) {
                setError(err.response?.data?.message ?? 'Failed to fetch leave balances');
            } finally {
                setLoading(false);
            }
        };

        fetchLeaveBalances();
    }, [targetYear]);

    if (loading) {
        return (
            <Card withBorder>
                <Stack align="center">
                    <Loader size="sm" />
                    <Text size="sm" color="dimmed">Loading leave balances...</Text>
                </Stack>
            </Card>
        );
    }

    if (error) {
        return (
            <Card withBorder>
                <Text color="red">{error}</Text>
            </Card>
        );
    }

    if (balances.length === 0) {
        return (
            <Card withBorder>
                <Text color="dimmed">No leave balances found for this year.</Text>
            </Card>
        );
    }

    return (
        <Card withBorder>
            <Text mb="sm">Leave Balances ({targetYear})</Text>
            <Grid gutter="sm">
                {balances.map((balance) => (
                    <Grid.Col span={6} key={balance.leave_type.id}>
                        <Card withBorder padding="sm">
                            <Stack >
                                <Text size="sm" truncate>
                                    {balance.leave_type.name}
                                </Text>
                                <Text size="xs" color="dimmed">Available</Text>
                                <Text size="lg">
                                    {balance.available_balance.toFixed(1)} hrs
                                </Text>
                                <Badge size="xs" color="blue" variant="light">
                                    Allocated: {balance.allocated_hours}
                                </Badge>
                            </Stack>
                        </Card>
                    </Grid.Col>
                ))}
            </Grid>
        </Card>
    );
}