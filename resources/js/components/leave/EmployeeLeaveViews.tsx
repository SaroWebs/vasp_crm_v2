import {
    Badge,
    Card,
    Group,
    Progress,
    SimpleGrid,
    Stack,
    Table,
    Text,
    ThemeIcon,
} from '@mantine/core';
import { User } from 'lucide-react';

interface GroupedLeaveStat {
    id: number;
    leave_type_id: number;
    leave_type_name: string;
    assigned: number;
    used: number;
    remaining: number;
    carry_over: number;
    year: number;
}

interface Employee {
    id: number;
    name: string;
    code: string | null;
    department?: { id: number; name: string };
}

interface EmployeeLeaveSummary {
    employee: Employee;
    leaves: Record<string, GroupedLeaveStat>;
}

interface EmployeeLeaveCardsProps {
    summaries: EmployeeLeaveSummary[];
}

interface EmployeeLeaveTableProps {
    summaries: EmployeeLeaveSummary[];
}

function getUtilizationColor(pct: number): string {
    if (pct < 40) return 'teal';
    if (pct < 70) return 'blue';
    if (pct < 90) return 'orange';
    return 'red';
}

function getUtilization(leave: GroupedLeaveStat): number {
    return leave.assigned > 0 ? (leave.used / leave.assigned) * 100 : 0;
}

function formatCarryOver(n: number): string {
    if (n === 0) return '';
    return `${n > 0 ? '+' : ''}${n} co`;
}

function EmployeeAvatar({ name }: { name: string }) {
    const initials = name
        .split(' ')
        .slice(0, 2)
        .map((w) => w[0])
        .join('')
        .toUpperCase();

    // Deterministic color from name
    const colors = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#f97316'];
    const idx = name.charCodeAt(0) % colors.length;

    return (
        <div
            style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                background: `${colors[idx]}20`,
                border: `2px solid ${colors[idx]}30`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
            }}
        >
            <Text size="xs" fw={700} style={{ color: colors[idx] }}>
                {initials}
            </Text>
        </div>
    );
}

export function EmployeeLeaveCards({ summaries }: EmployeeLeaveCardsProps) {
    return (
        <SimpleGrid cols={{ base: 1, sm: 2, md: 3, lg:4 }} spacing="md">
            {summaries.map((summary) => {
                const leaves = Object.values(summary.leaves);
                const totalAssigned = leaves.reduce((s, l) => s + l.assigned, 0);
                const totalUsed = leaves.reduce((s, l) => s + l.used, 0);
                const overallPct = totalAssigned > 0 ? (totalUsed / totalAssigned) * 100 : 0;

                return (
                    <Card
                        key={summary.employee.id}
                        withBorder
                        radius="md"
                        p="md"
                        style={{
                            borderColor: 'var(--mantine-color-gray-2)',
                            transition: 'box-shadow 0.15s ease',
                        }}
                        className="emp-leave-card"
                    >
                        <style>{`.emp-leave-card:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.07); }`}</style>

                        <Stack gap="sm">
                            {/* Employee header */}
                            <Group justify="space-between" align="center" wrap="nowrap">
                                <Group gap="sm" wrap="nowrap" style={{ minWidth: 0 }}>
                                    <EmployeeAvatar name={summary.employee.name || 'U'} />
                                    <div style={{ minWidth: 0 }}>
                                        <Text fw={700} size="sm" truncate style={{ letterSpacing: '-0.01em' }}>
                                            {summary.employee.name || 'Unknown'}
                                        </Text>
                                        <Group gap={6} wrap="nowrap">
                                            {summary.employee.code && (
                                                <Text size="xs" c="dimmed" style={{ fontFamily: 'monospace' }}>
                                                    {summary.employee.code}
                                                </Text>
                                            )}
                                            {summary.employee.department && (
                                                <Badge
                                                    size="xs"
                                                    variant="light"
                                                    color="blue"
                                                    radius="sm"
                                                >
                                                    {summary.employee.department.name}
                                                </Badge>
                                            )}
                                        </Group>
                                    </div>
                                </Group>
                                <Badge
                                    size="xs"
                                    variant="light"
                                    color={getUtilizationColor(overallPct)}
                                    radius="sm"
                                    style={{ flexShrink: 0 }}
                                >
                                    {overallPct.toFixed(0)}% used
                                </Badge>
                            </Group>

                            {/* Divider */}
                            <div style={{ height: 1, background: 'var(--mantine-color-gray-1)' }} />

                            {/* Leave breakdown */}
                            <Stack gap="xs">
                                {leaves.map((leave) => {
                                    const pct = getUtilization(leave);
                                    const co = formatCarryOver(leave.carry_over);

                                    return (
                                        <div key={leave.id}>
                                            <Group justify="space-between" mb={4} wrap="nowrap">
                                                <Text size="xs" fw={600} style={{ flex: 1, minWidth: 0 }} truncate>
                                                    {leave.leave_type_name}
                                                </Text>
                                                <Group gap={4} wrap="nowrap">
                                                    {co && (
                                                        <Text size="xs" c="blue" fw={600} style={{ fontFamily: 'monospace' }}>
                                                            {co}
                                                        </Text>
                                                    )}
                                                    <Text
                                                        size="xs"
                                                        fw={700}
                                                        style={{ fontFamily: 'monospace', whiteSpace: 'nowrap' }}
                                                    >
                                                        {Number(leave.used)}/{Number(leave.assigned)}
                                                    </Text>
                                                    <Text size="xs" c="dimmed">
                                                        ({Number(leave.remaining)} left)
                                                    </Text>
                                                </Group>
                                            </Group>
                                            <Progress
                                                value={pct}
                                                color={getUtilizationColor(pct)}
                                                size="xs"
                                                radius="xl"
                                                style={{ height: 6 }}
                                            />
                                        </div>
                                    );
                                })}
                            </Stack>
                        </Stack>
                    </Card>
                );
            })}
        </SimpleGrid>
    );
}

export function EmployeeLeaveTable({ summaries }: EmployeeLeaveTableProps) {
    return (
        <Card withBorder radius="md" p={0} style={{ overflow: 'hidden', borderColor: 'var(--mantine-color-gray-2)' }}>
            <Table striped highlightOnHover verticalSpacing="sm" horizontalSpacing="md">
                <Table.Thead
                    style={{
                        background: 'var(--mantine-color-gray-0)',
                        borderBottom: '1px solid var(--mantine-color-gray-2)',
                    }}
                >
                    <Table.Tr>
                        <Table.Th>
                            <Text size="xs" fw={700} tt="uppercase" c="dimmed" style={{ letterSpacing: '0.06em' }}>
                                Employee
                            </Text>
                        </Table.Th>
                        <Table.Th>
                            <Text size="xs" fw={700} tt="uppercase" c="dimmed" style={{ letterSpacing: '0.06em' }}>
                                Department
                            </Text>
                        </Table.Th>
                        <Table.Th>
                            <Text size="xs" fw={700} tt="uppercase" c="dimmed" style={{ letterSpacing: '0.06em' }}>
                                Leave Allocations
                            </Text>
                        </Table.Th>
                        <Table.Th style={{ textAlign: 'right' }}>
                            <Text size="xs" fw={700} tt="uppercase" c="dimmed" style={{ letterSpacing: '0.06em' }}>
                                Overall
                            </Text>
                        </Table.Th>
                    </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                    {summaries.map((summary) => {
                        const leaves = Object.values(summary.leaves);
                        const totalAssigned = leaves.reduce((s, l) => s + l.assigned, 0);
                        const totalUsed = leaves.reduce((s, l) => s + l.used, 0);
                        const overallPct = totalAssigned > 0 ? (totalUsed / totalAssigned) * 100 : 0;

                        return (
                            <Table.Tr key={summary.employee.id}>
                                <Table.Td>
                                    <Group gap="sm" wrap="nowrap">
                                        <EmployeeAvatar name={summary.employee.name || 'U'} />
                                        <div>
                                            <Text size="sm" fw={600}>
                                                {summary.employee.name || 'Unknown'}
                                            </Text>
                                            {summary.employee.code && (
                                                <Text
                                                    size="xs"
                                                    c="dimmed"
                                                    style={{ fontFamily: 'monospace' }}
                                                >
                                                    {summary.employee.code}
                                                </Text>
                                            )}
                                        </div>
                                    </Group>
                                </Table.Td>
                                <Table.Td>
                                    {summary.employee.department ? (
                                        <Badge size="sm" variant="light" color="blue" radius="sm">
                                            {summary.employee.department.name}
                                        </Badge>
                                    ) : (
                                        <Text size="sm" c="dimmed">
                                            —
                                        </Text>
                                    )}
                                </Table.Td>
                                <Table.Td>
                                    <Stack gap={6}>
                                        {leaves.map((leave) => {
                                            const pct = getUtilization(leave);
                                            return (
                                                <Group key={leave.id} gap="sm" wrap="nowrap" align="center">
                                                    <Badge
                                                        size="xs"
                                                        variant="light"
                                                        color={getUtilizationColor(pct)}
                                                        radius="sm"
                                                        style={{ minWidth: 80, textAlign: 'center' }}
                                                    >
                                                        {leave.leave_type_name}
                                                    </Badge>
                                                    <Text
                                                        size="xs"
                                                        fw={600}
                                                        style={{ fontFamily: 'monospace', whiteSpace: 'nowrap' }}
                                                    >
                                                        {Number(leave.used)}/{Number(leave.assigned)}
                                                    </Text>
                                                    <Text size="xs" c="dimmed" style={{ whiteSpace: 'nowrap' }}>
                                                        {Number(leave.remaining)} remaining
                                                    </Text>
                                                </Group>
                                            );
                                        })}
                                    </Stack>
                                </Table.Td>
                                <Table.Td style={{ textAlign: 'right' }}>
                                    <Badge
                                        color={getUtilizationColor(overallPct)}
                                        variant="filled"
                                        size="sm"
                                        radius="sm"
                                    >
                                        {overallPct.toFixed(0)}%
                                    </Badge>
                                </Table.Td>
                            </Table.Tr>
                        );
                    })}
                </Table.Tbody>
            </Table>
        </Card>
    );
}
