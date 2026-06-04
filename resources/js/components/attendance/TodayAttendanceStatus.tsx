import { useEffect, useState } from 'react';
import axios from 'axios';
import { Badge, Card, Group, SegmentedControl, Text, ThemeIcon, Stack } from '@mantine/core';
import {
    Clock,
    CalendarCheck,
    UserCheck,
    ShieldCheck,
    MapPin,
    Home,
    Briefcase,
} from 'lucide-react';

interface ShiftInfo {
    shift_id: number | null;
    start_time: string | null;
    end_time: string | null;
    grace_minutes: number;
    is_half_day: boolean;
    is_leave_day: boolean;
    is_holiday: boolean;
    is_field_work: boolean;
    is_remote_work: boolean;
}

interface TodayAttendanceData {
    attendance_date: string;
    punch_in: string | null;
    punch_out: string | null;
    mode: string;
    status: string;
    shift: ShiftInfo | null;
}

interface TodayAttendanceStatusProps {
    auth: any;
}

function getStatusConfig(status: string) {
    const configs: Record<string, { color: string; label: string; icon: React.ComponentType<{ className?: string }> }> = {
        present: { color: 'green', label: 'Present', icon: UserCheck },
        late_in: { color: 'yellow', label: 'Late In', icon: Clock },
        early_out: { color: 'orange', label: 'Early Out', icon: Clock },
        absent: { color: 'red', label: 'Absent', icon: ShieldCheck },
        incomplete: { color: 'blue', label: 'Incomplete', icon: Clock },
        on_leave: { color: 'purple', label: 'On Leave', icon: CalendarCheck },
        remote_work: { color: 'indigo', label: 'Remote Work', icon: Home },
        field_work: { color: 'teal', label: 'Field Work', icon: Briefcase },
        holiday: { color: 'pink', label: 'Holiday', icon: ShieldCheck },
        non_working_day: { color: 'gray', label: 'Non-Working Day', icon: ShieldCheck },
    };
    return configs[status] ?? { color: 'gray', label: status.replace('_', ' '), icon: Clock };
}

export function TodayAttendanceStatus({ auth }: TodayAttendanceStatusProps) {
    const [data, setData] = useState<TodayAttendanceData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchTodayAttendance = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await axios.get('/api/my/attendance/today');
                setData(response.data.data);
            } catch (err: any) {
                setError(err.response?.data?.message ?? 'Failed to fetch today\'s attendance');
            } finally {
                setLoading(false);
            }
        };

        fetchTodayAttendance();
    }, []);

    if (loading) {
        return (
            <Card withBorder>
                <Text size="sm" color="dimmed">Loading today's attendance...</Text>
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

    if (!data) {
        return null;
    }

    const statusConfig = getStatusConfig(data.status);
    const StatusIcon = statusConfig.icon;
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    return (
        <Card withBorder>
            <Group justify="space-between" align="flex-start">
                <Stack gap={4}>
                    <Text size="sm" color="dimmed">Today's Status</Text>
                    <Text size="lg">{today}</Text>
                </Stack>
                <ThemeIcon color={statusConfig.color} variant="light" size="lg">
                    <StatusIcon />
                </ThemeIcon>
            </Group>

            <Group mt="md">
                <div>
                    <Text size="xs" color="dimmed">Punch In</Text>
                    <Text>
                        {data.punch_in ? new Date(`2024-01-01T${data.punch_in}`).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '-'}
                    </Text>
                </div>
                <div>
                    <Text size="xs" color="dimmed">Punch Out</Text>
                    <Text>
                        {data.punch_out ? new Date(`2024-01-01T${data.punch_out}`).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '-'}
                    </Text>
                </div>
                <div>
                    <Text size="xs" color="dimmed">Mode</Text>
                    <Group >
                        {data.mode === 'remote' ? (
                            <Home size={16} />
                        ) : (
                            <Briefcase size={16} />
                        )}
                        <Text>{data.mode || 'office'}</Text>
                    </Group>
                </div>
            </Group>

            <Group mt="md">
                <Badge color={statusConfig.color} variant="light">
                    {statusConfig.label}
                </Badge>
                {data.shift?.is_remote_work && (
                    <Badge color="indigo" variant="light">Remote Work</Badge>
                )}
                {data.shift?.is_leave_day && (
                    <Badge color="purple" variant="light">Leave</Badge>
                )}
                {data.shift?.is_field_work && (
                    <Badge color="teal" variant="light">Field Work</Badge>
                )}
            </Group>
        </Card>
    );
}