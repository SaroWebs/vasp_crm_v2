import {
    Checkbox,
    Group,
    Modal,
    NumberInput,
    Select,
    Stack,
    Textarea,
    TextInput,
    Text,
    Divider,
    SimpleGrid,
    Button as MantineButton,
} from '@mantine/core';
import { Clock, DollarSign, ShieldCheck, RotateCcw, ToggleRight } from 'lucide-react';

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

interface LeaveTypeFormData {
    name: string;
    description: string;
    duration_type: LeaveType['duration_type'];
    default_hours: number;
    requires_approval: boolean;
    is_paid: boolean;
    carry_over_allowed: boolean;
    is_active: boolean;
}

interface LeaveTypeModalProps {
    opened: boolean;
    onClose: () => void;
    editingLeaveType: LeaveType | null;
    formData: LeaveTypeFormData;
    setFormData: (data: LeaveTypeFormData) => void;
    onSave: () => void;
    loading: boolean;
}

const toggleStyle = {
    padding: '12px 14px',
    borderRadius: 8,
    border: '1px solid var(--mantine-color-gray-2)',
    background: 'var(--mantine-color-gray-0)',
    cursor: 'pointer',
    transition: 'background 0.15s ease, border-color 0.15s ease',
};

export function LeaveTypeModal({
    opened,
    onClose,
    editingLeaveType,
    formData,
    setFormData,
    onSave,
    loading,
}: LeaveTypeModalProps) {
    const update = <K extends keyof LeaveTypeFormData>(key: K, value: LeaveTypeFormData[K]) =>
        setFormData({ ...formData, [key]: value });

    return (
        <Modal
            opened={opened}
            onClose={onClose}
            title={
                <Stack gap={2}>
                    <Text fw={700} size="md" style={{ letterSpacing: '-0.02em' }}>
                        {editingLeaveType ? 'Edit Leave Type' : 'Create Leave Type'}
                    </Text>
                    <Text size="xs" c="dimmed">
                        {editingLeaveType
                            ? `Updating "${editingLeaveType.name}"`
                            : 'Add a new leave category for your team'}
                    </Text>
                </Stack>
            }
            size="md"
            radius="md"
            styles={{
                header: { borderBottom: '1px solid var(--mantine-color-gray-2)', paddingBottom: 16 },
                body: { paddingTop: 20 },
            }}
        >
            <Stack gap="md">
                {/* Basic Info */}
                <TextInput
                    label="Leave Type Name"
                    placeholder="e.g., Annual Leave, Sick Leave, Paternity Leave"
                    value={formData.name}
                    onChange={(e) => update('name', e.currentTarget.value)}
                    required
                    styles={{
                        label: { fontWeight: 600, fontSize: 13, marginBottom: 6 },
                        input: { borderRadius: 8 },
                    }}
                />

                <Textarea
                    label="Description"
                    placeholder="Optional — briefly describe when this leave applies"
                    value={formData.description}
                    onChange={(e) => update('description', e.currentTarget.value)}
                    rows={2}
                    autosize
                    maxRows={4}
                    styles={{
                        label: { fontWeight: 600, fontSize: 13, marginBottom: 6 },
                        input: { borderRadius: 8 },
                    }}
                />

                <Divider label={<Text size="xs" c="dimmed" fw={600}>Duration Settings</Text>} />

                <SimpleGrid cols={2} spacing="sm">
                    <Select
                        label="Duration Type"
                        leftSection={<Clock size={14} />}
                        value={formData.duration_type}
                        onChange={(val) =>
                            update('duration_type', (val || 'full_day') as LeaveType['duration_type'])
                        }
                        data={[
                            { value: 'full_day', label: 'Full Day' },
                            { value: 'half_day', label: 'Half Day' },
                            { value: 'custom_hours', label: 'Custom Hours' },
                            { value: 'hourly', label: 'Hourly' },
                        ]}
                        styles={{ label: { fontWeight: 600, fontSize: 13, marginBottom: 6 }, input: { borderRadius: 8 } }}
                    />

                    <NumberInput
                        label="Default Hours"
                        placeholder="8"
                        value={formData.default_hours}
                        onChange={(val) => update('default_hours', Number(val) || 8)}
                        min={0}
                        step={0.5}
                        suffix="h"
                        styles={{ label: { fontWeight: 600, fontSize: 13, marginBottom: 6 }, input: { borderRadius: 8 } }}
                    />
                </SimpleGrid>

                <Divider label={<Text size="xs" c="dimmed" fw={600}>Policy Settings</Text>} />

                {/* Policy toggles */}
                <SimpleGrid cols={2} spacing="sm">
                    <PolicyToggle
                        icon={<ShieldCheck size={14} color="#f59e0b" />}
                        label="Requires Approval"
                        description="Manager must approve"
                        checked={formData.requires_approval}
                        onChange={(v) => update('requires_approval', v)}
                    />
                    <PolicyToggle
                        icon={<DollarSign size={14} color="#10b981" />}
                        label="Paid Leave"
                        description="Employee is compensated"
                        checked={formData.is_paid}
                        onChange={(v) => update('is_paid', v)}
                    />
                    <PolicyToggle
                        icon={<RotateCcw size={14} color="#3b82f6" />}
                        label="Allow Carry Over"
                        description="Unused days roll forward"
                        checked={formData.carry_over_allowed}
                        onChange={(v) => update('carry_over_allowed', v)}
                    />
                    <PolicyToggle
                        icon={<ToggleRight size={14} color="#8b5cf6" />}
                        label="Active"
                        description="Visible for assignment"
                        checked={formData.is_active}
                        onChange={(v) => update('is_active', v)}
                    />
                </SimpleGrid>

                {/* Actions */}
                <Group justify="flex-end" gap="sm" pt="xs">
                    <MantineButton
                        variant="subtle"
                        color="gray"
                        onClick={onClose}
                        radius="sm"
                        size="sm"
                    >
                        Cancel
                    </MantineButton>
                    <MantineButton
                        onClick={onSave}
                        loading={loading}
                        radius="sm"
                        size="sm"
                        style={{
                            background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
                        }}
                    >
                        {editingLeaveType ? 'Save Changes' : 'Create Leave Type'}
                    </MantineButton>
                </Group>
            </Stack>
        </Modal>
    );
}

function PolicyToggle({
    icon,
    label,
    description,
    checked,
    onChange,
}: {
    icon: React.ReactNode;
    label: string;
    description: string;
    checked: boolean;
    onChange: (v: boolean) => void;
}) {
    return (
        <div
            style={{
                ...toggleStyle,
                background: checked ? 'var(--mantine-color-blue-0)' : 'var(--mantine-color-gray-0)',
                borderColor: checked ? 'var(--mantine-color-blue-3)' : 'var(--mantine-color-gray-2)',
            }}
            onClick={() => onChange(!checked)}
        >
            <Group gap={8} align="flex-start" wrap="nowrap">
                <Checkbox
                    checked={checked}
                    onChange={(e) => onChange(e.currentTarget.checked)}
                    size="xs"
                    styles={{ root: { cursor: 'pointer' } }}
                    onClick={(e) => e.stopPropagation()}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                    <Group gap={4} align="center">
                        {icon}
                        <Text size="xs" fw={600} style={{ lineHeight: 1 }}>
                            {label}
                        </Text>
                    </Group>
                    <Text size="xs" c="dimmed" mt={2} style={{ lineHeight: 1.4 }}>
                        {description}
                    </Text>
                </div>
            </Group>
        </div>
    );
}
