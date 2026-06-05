import {
    Alert,
    Card,
    Group,
    MultiSelect,
    NumberInput,
    Select,
    Stack,
    Text,
    Button as MantineButton,
    SimpleGrid,
    ThemeIcon,
    Badge,
} from '@mantine/core';
import { Users, Building2, User, Info, Zap } from 'lucide-react';

interface LeaveType {
    id: number;
    name: string;
    is_active: boolean;
}

interface Employee {
    id: number;
    name: string;
    code: string | null;
    department?: { id: number; name: string };
}

interface Department {
    id: number;
    name: string;
}

type AssignmentMode = 'all' | 'individual';

interface AssignLeavesPanelProps {
    leaveTypes: LeaveType[];
    employees: Employee[];
    departments: Department[];
    assignmentMode: AssignmentMode;
    setAssignmentMode: (mode: AssignmentMode) => void;
    selectedLeaveType: string | null;
    setSelectedLeaveType: (val: string | null) => void;
    selectedEmployees: string[];
    setSelectedEmployees: (val: string[]) => void;
    numberOfLeaves: number;
    setNumberOfLeaves: (val: number) => void;
    year: number;
    setYear: (val: number) => void;
    employeesToAssignCount: number;
    onAssign: () => void;
    loading: boolean;
}

const modeOptions: { value: AssignmentMode; label: string; icon: React.ReactNode; description: string }[] = [
    {
        value: 'all',
        label: 'All Employees',
        icon: <Users size={16} />,
        description: 'Apply to everyone',
    },
    {
        value: 'individual',
        label: 'Individual',
        icon: <User size={16} />,
        description: 'Pick specific people',
    },
];

export function AssignLeavesPanel({
    leaveTypes,
    employees,
    departments,
    assignmentMode,
    setAssignmentMode,
    selectedLeaveType,
    setSelectedLeaveType,
    selectedEmployees,
    setSelectedEmployees,
    numberOfLeaves,
    setNumberOfLeaves,
    year,
    setYear,
    employeesToAssignCount,
    onAssign,
    loading,
}: AssignLeavesPanelProps) {
    const isReady = selectedLeaveType && employeesToAssignCount > 0;

    return (
        <Card withBorder radius="md" maw={760} style={{ borderColor: 'var(--mantine-color-gray-2)' }}>
            <Stack gap="xl">
                {/* Header */}
                <div>
                    <Text fw={700} size="md" style={{ letterSpacing: '-0.02em' }}>
                        Assign Leave Allocation
                    </Text>
                    <Text size="xs" c="dimmed" mt={2}>
                        Bulk assign leave days to employees for a specific year
                    </Text>
                </div>

                {/* Assignment Scope */}
                <div>
                    <Text size="xs" fw={700} tt="uppercase" c="dimmed" mb="xs" style={{ letterSpacing: '0.06em' }}>
                        Scope
                    </Text>
                    <SimpleGrid cols={3} spacing="sm">
                        {modeOptions.map((opt) => (
                            <ModeCard
                                key={opt.value}
                                {...opt}
                                active={assignmentMode === opt.value}
                                onClick={() => {
                                    setAssignmentMode(opt.value);
                                    setSelectedEmployees([]);
                                }}
                            />
                        ))}
                    </SimpleGrid>
                </div>

                {assignmentMode === 'individual' && (
                    <MultiSelect
                        label="Employees"
                        placeholder="Search and select employees"
                        data={employees.map((e) => ({
                            value: e.id.toString(),
                            label: `${e.name}${e.code ? ` (${e.code})` : ''}`,
                        }))}
                        value={selectedEmployees}
                        onChange={setSelectedEmployees}
                        searchable
                        styles={fieldStyles}
                    />
                )}

                {/* Leave Config */}
                <div>
                    <Text size="xs" fw={700} tt="uppercase" c="dimmed" mb="xs" style={{ letterSpacing: '0.06em' }}>
                        Leave Configuration
                    </Text>
                    <SimpleGrid cols={3} spacing="sm">
                        <Select
                            label="Leave Type"
                            placeholder="Select type"
                            data={leaveTypes
                                .filter((lt) => lt.is_active)
                                .map((lt) => ({ value: lt.id.toString(), label: lt.name }))}
                            value={selectedLeaveType}
                            onChange={setSelectedLeaveType}
                            searchable
                            styles={fieldStyles}
                        />
                        <NumberInput
                            label="Number of Days"
                            placeholder="0"
                            value={numberOfLeaves}
                            onChange={(val) => setNumberOfLeaves(Number(val) || 0)}
                            min={0}
                            step={1}
                            suffix=" days"
                            styles={fieldStyles}
                        />
                        <Select
                            label="Year"
                            value={year.toString()}
                            onChange={(val) => setYear(parseInt(val || String(new Date().getFullYear())))}
                            data={['2024', '2025', '2026', '2027', '2028'].map((y) => ({ value: y, label: y }))}
                            styles={fieldStyles}
                        />
                    </SimpleGrid>
                </div>

                {/* Summary + Action */}
                <div
                    style={{
                        padding: '14px 16px',
                        borderRadius: 10,
                        background: isReady
                            ? 'linear-gradient(135deg, #f0fdf4, #dcfce7)'
                            : 'var(--mantine-color-gray-0)',
                        border: `1px solid ${isReady ? '#86efac' : 'var(--mantine-color-gray-2)'}`,
                        transition: 'all 0.2s ease',
                    }}
                >
                    <Group justify="space-between" align="center">
                        <Group gap="sm">
                            <ThemeIcon
                                size="sm"
                                radius="sm"
                                color={isReady ? 'teal' : 'gray'}
                                variant="light"
                            >
                                <Info size={12} />
                            </ThemeIcon>
                            <div>
                                <Text size="sm" fw={600} c={isReady ? 'teal.8' : 'dimmed'}>
                                    {isReady
                                        ? `${numberOfLeaves} days → ${employeesToAssignCount} employee${employeesToAssignCount !== 1 ? 's' : ''} for ${year}`
                                        : 'Select a leave type and scope to continue'}
                                </Text>
                                {isReady && (
                                    <Text size="xs" c="dimmed">
                                        This will create or update existing allocations
                                    </Text>
                                )}
                            </div>
                        </Group>

                        <MantineButton
                            onClick={onAssign}
                            loading={loading}
                            disabled={!isReady}
                            leftSection={<Zap size={14} />}
                            radius="sm"
                            size="sm"
                            style={{
                                background: isReady
                                    ? 'linear-gradient(135deg, #1e293b 0%, #334155 100%)'
                                    : undefined,
                                flexShrink: 0,
                            }}
                        >
                            Assign Leaves
                        </MantineButton>
                    </Group>
                </div>
            </Stack>
        </Card>
    );
}

function ModeCard({
    value,
    label,
    icon,
    description,
    active,
    onClick,
}: {
    value: string;
    label: string;
    icon: React.ReactNode;
    description: string;
    active: boolean;
    onClick: () => void;
}) {
    return (
        <div
            onClick={onClick}
            style={{
                padding: '12px 14px',
                borderRadius: 8,
                border: `1.5px solid ${active ? '#1e293b' : 'var(--mantine-color-gray-2)'}`,
                background: active ? '#1e293b' : 'white',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
            }}
        >
            <Group gap={8} align="center" wrap="nowrap">
                <div style={{ color: active ? 'white' : 'var(--mantine-color-gray-6)' }}>{icon}</div>
                <div>
                    <Text size="xs" fw={700} c={active ? 'white' : 'dark'} style={{ lineHeight: 1.2 }}>
                        {label}
                    </Text>
                    <Text size="xs" c={active ? 'rgba(255,255,255,0.6)' : 'dimmed'} style={{ lineHeight: 1.3 }}>
                        {description}
                    </Text>
                </div>
            </Group>
        </div>
    );
}

const fieldStyles = {
    label: { fontWeight: 600, fontSize: 13, marginBottom: 6 },
    input: { borderRadius: 8 },
};
