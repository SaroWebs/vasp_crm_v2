import { Badge, Card, Group, Stack, Text, Button as MantineButton } from '@mantine/core';
import { Edit, Trash2, Clock, CheckCircle, XCircle, RefreshCw } from 'lucide-react';

interface LeaveType {
    id: number;
    name: string;
    description?: string;
    duration_type: 'full_day' | 'half_day' | 'custom_hours' | 'hourly';
    default_hours?: number | null;
    requires_approval: boolean;
    carry_over_allowed: boolean;
    is_paid: boolean;
    is_active: boolean;
}

interface LeaveTypeCardProps {
    leaveType: LeaveType;
    onEdit: (leaveType: LeaveType) => void;
    onDelete: (leaveType: LeaveType) => void;
}

const durationLabels: Record<LeaveType['duration_type'], string> = {
    full_day: 'Full Day',
    half_day: 'Half Day',
    custom_hours: 'Custom Hours',
    hourly: 'Hourly',
};

const durationColors: Record<LeaveType['duration_type'], string> = {
    full_day: '#3b82f6',
    half_day: '#8b5cf6',
    custom_hours: '#f59e0b',
    hourly: '#10b981',
};

export function LeaveTypeCard({ leaveType: lt, onEdit, onDelete }: LeaveTypeCardProps) {
    return (
        <Card
            withBorder
            radius="md"
            style={{
                borderColor: lt.is_active ? 'var(--mantine-color-gray-2)' : 'var(--mantine-color-gray-1)',
                opacity: lt.is_active ? 1 : 0.7,
                transition: 'box-shadow 0.2s ease, transform 0.2s ease',
                cursor: 'default',
            }}
            className="leave-type-card"
        >
            <style>{`
                .leave-type-card:hover {
                    box-shadow: 0 4px 20px rgba(0,0,0,0.08);
                    transform: translateY(-1px);
                }
            `}</style>

            <Stack gap="sm">
                {/* Header */}
                <Group justify="space-between" align="flex-start" wrap="nowrap">
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <Text
                            fw={700}
                            size="sm"
                            style={{
                                letterSpacing: '-0.01em',
                                color: 'var(--mantine-color-dark-7)',
                                lineHeight: 1.3,
                            }}
                        >
                            {lt.name}
                        </Text>
                        {lt.description && (
                            <Text size="xs" c="dimmed" mt={2} lineClamp={2} style={{ lineHeight: 1.5 }}>
                                {lt.description}
                            </Text>
                        )}
                    </div>
                    <Badge
                        size="xs"
                        radius="sm"
                        color={lt.is_active ? 'teal' : 'gray'}
                        variant="light"
                        style={{ flexShrink: 0 }}
                    >
                        {lt.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                </Group>

                {/* Duration type pill */}
                <div
                    style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        background: `${durationColors[lt.duration_type]}15`,
                        border: `1px solid ${durationColors[lt.duration_type]}30`,
                        borderRadius: 6,
                        padding: '3px 8px',
                        width: 'fit-content',
                    }}
                >
                    <Clock size={11} color={durationColors[lt.duration_type]} />
                    <Text size="xs" fw={600} style={{ color: durationColors[lt.duration_type] }}>
                        {durationLabels[lt.duration_type]}
                        {lt.default_hours ? ` · ${lt.default_hours}h` : ''}
                    </Text>
                </div>

                {/* Attributes row */}
                <Group gap={6} wrap="wrap">
                    <AttributePill
                        icon={lt.is_paid ? <CheckCircle size={10} /> : <XCircle size={10} />}
                        label={lt.is_paid ? 'Paid' : 'Unpaid'}
                        color={lt.is_paid ? 'teal' : 'gray'}
                    />
                    {lt.requires_approval && (
                        <AttributePill
                            icon={<CheckCircle size={10} />}
                            label="Needs Approval"
                            color="orange"
                        />
                    )}
                    {lt.carry_over_allowed && (
                        <AttributePill
                            icon={<RefreshCw size={10} />}
                            label="Carry Over"
                            color="blue"
                        />
                    )}
                </Group>

                {/* Divider */}
                <div style={{ height: 1, background: 'var(--mantine-color-gray-1)', margin: '2px 0' }} />

                {/* Actions */}
                <Group gap={6}>
                    <MantineButton
                        size="xs"
                        variant="subtle"
                        color="dark"
                        leftSection={<Edit size={12} />}
                        onClick={() => onEdit(lt)}
                        style={{ flex: 1 }}
                        radius="sm"
                    >
                        Edit
                    </MantineButton>
                    <MantineButton
                        size="xs"
                        variant="subtle"
                        color="red"
                        leftSection={<Trash2 size={12} />}
                        onClick={() => onDelete(lt)}
                        style={{ flex: 1 }}
                        radius="sm"
                    >
                        Delete
                    </MantineButton>
                </Group>
            </Stack>
        </Card>
    );
}

function AttributePill({
    icon,
    label,
    color,
}: {
    icon: React.ReactNode;
    label: string;
    color: string;
}) {
    return (
        <Badge
            size="xs"
            variant="light"
            color={color}
            radius="sm"
            leftSection={icon}
        >
            {label}
        </Badge>
    );
}
