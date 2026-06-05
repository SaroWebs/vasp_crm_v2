import { useEffect, useState, useCallback } from 'react';
import {
    Alert,
    Card,
    Grid,
    Group,
    Select,
    Skeleton,
    Stack,
    Text,
    Button as MantineButton,
    SegmentedControl,
} from '@mantine/core';
import { AlertCircle, LayoutGrid, Table2, RefreshCw } from 'lucide-react';
import axios from 'axios';
import { StatsBar } from './StatsBar';
import { EmployeeLeaveCards, EmployeeLeaveTable } from './EmployeeLeaveViews';

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

interface LeaveBalance {
    id: number;
    employee_id: number;
    employee?: Employee;
    leave_type_id: number;
    leave_type?: LeaveType;
    year: number;
    assigned_leaves: number;
    consumed_leaves: number;
    remaining_leaves: number;
    carried_over_leaves: number;
}

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

interface EmployeeLeaveSummary {
    employee: Employee;
    leaves: Record<string, GroupedLeaveStat>;
}

function getLeaveKey(name: string): string {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
}

function groupFlatBalances(balances: LeaveBalance[]): EmployeeLeaveSummary[] {
    return Object.values(
        balances.reduce<Record<number, EmployeeLeaveSummary>>((groups, balance) => {
            const employee = balance.employee || { id: balance.employee_id, name: 'Unknown', code: null };
            const leaveTypeName = balance.leave_type?.name || 'Unknown Leave';

            groups[balance.employee_id] ??= { employee, leaves: {} };
            groups[balance.employee_id].leaves[getLeaveKey(leaveTypeName)] = {
                id: balance.id,
                leave_type_id: balance.leave_type_id,
                leave_type_name: leaveTypeName,
                assigned: balance.assigned_leaves,
                used: balance.consumed_leaves,
                remaining: balance.remaining_leaves,
                carry_over: balance.carried_over_leaves,
                year: balance.year,
            };

            return groups;
        }, {})
    );
}

const YEAR_OPTIONS = ['2024', '2025', '2026', '2027'].map((y) => ({ value: y, label: y }));

const fieldStyles = {
    label: { fontWeight: 600 as const, fontSize: 13, marginBottom: 6 },
    input: { borderRadius: 8 },
};

export function AssignedLeaveList() {
    const [summaries, setSummaries] = useState<EmployeeLeaveSummary[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [selectedLeaveType, setSelectedLeaveType] = useState<string | null>(null);
    const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null);
    const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

    const fetchBalances = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                year: selectedYear.toString(),
                ...(selectedLeaveType && { leave_type_id: selectedLeaveType }),
                ...(selectedDepartment && { department_id: selectedDepartment }),
            });

            const response = await axios.get(`/api/leave-balances?${params}`);
            const balances = (response.data.data || []) as LeaveBalance[];
            const grouped = (Object.values(response.data.employees || {}) as EmployeeLeaveSummary[]);
            setSummaries(grouped.length > 0 ? grouped : groupFlatBalances(balances));
        } catch (err) {
            console.error('Error fetching leave balances:', err);
            setSummaries([]);
        } finally {
            setLoading(false);
        }
    }, [selectedYear, selectedLeaveType, selectedDepartment]);

    const fetchFilters = useCallback(async () => {
        try {
            const [typesRes, empRes] = await Promise.all([
                axios.get('/api/leave-types'),
                axios.get('/admin/employees', { headers: { Accept: 'application/json' } }),
            ]);
            setLeaveTypes(typesRes.data.leave_types || []);
            const empData = (empRes.data.data || []) as Employee[];
            const uniqueDepts = Array.from(
                new Map(
                    empData
                        .filter((e) => e.department)
                        .map((e) => [e.department!.id, e.department!])
                ).values()
            ) as Department[];
            setDepartments(uniqueDepts);
        } catch (err) {
            console.error('Error fetching filter data:', err);
        }
    }, []);

    useEffect(() => {
        fetchBalances();
        fetchFilters();
    }, [fetchBalances, fetchFilters]);

    const leaveStats = summaries.flatMap((s) => Object.values(s.leaves));
    const totalAssigned = leaveStats.reduce((s, l) => s + l.assigned, 0);
    const totalConsumed = leaveStats.reduce((s, l) => s + l.used, 0);
    const totalRemaining = leaveStats.reduce((s, l) => s + l.remaining, 0);
    const avgUtilization = totalAssigned > 0 ? (totalConsumed / totalAssigned) * 100 : 0;

    return (
        <Stack gap="lg" mt="xl">
            {/* Section heading */}
            <div>
                <Text fw={700} size="md" style={{ letterSpacing: '-0.02em' }}>
                    Leave Allocations
                </Text>
                <Text size="xs" c="dimmed">
                    Overview of assigned, used, and remaining leave days
                </Text>
            </div>

            {/* Stats */}
            <StatsBar
                totalAssigned={totalAssigned}
                totalConsumed={totalConsumed}
                totalRemaining={totalRemaining}
                totalEmployees={summaries.length}
                avgUtilization={avgUtilization}
            />

            {/* Filters */}
            <Card withBorder radius="md" p="md" style={{ borderColor: 'var(--mantine-color-gray-2)' }}>
                <Group justify="space-between" mb="md" wrap="wrap" gap="sm">
                    <Text fw={600} size="sm">
                        Filter & View
                    </Text>
                    <Group gap="xs">
                        <SegmentedControl
                            size="xs"
                            value={viewMode}
                            onChange={(v) => setViewMode(v as 'cards' | 'table')}
                            data={[
                                { value: 'cards', label: <Group gap={4}><LayoutGrid size={12} /><span>Cards</span></Group> },
                                { value: 'table', label: <Group gap={4}><Table2 size={12} /><span>Table</span></Group> },
                            ]}
                        />
                        <MantineButton
                            size="xs"
                            variant="subtle"
                            leftSection={<RefreshCw size={12} />}
                            onClick={fetchBalances}
                            loading={loading}
                        >
                            Refresh
                        </MantineButton>
                    </Group>
                </Group>

                <Grid>
                    <Grid.Col span={{ base: 12, sm: 4 }}>
                        <Select
                            label="Year"
                            value={selectedYear.toString()}
                            onChange={(val) => setSelectedYear(parseInt(val || String(new Date().getFullYear())))}
                            data={YEAR_OPTIONS}
                            styles={fieldStyles}
                        />
                    </Grid.Col>
                    <Grid.Col span={{ base: 12, sm: 4 }}>
                        <Select
                            label="Leave Type"
                            placeholder="All types"
                            clearable
                            value={selectedLeaveType}
                            onChange={setSelectedLeaveType}
                            data={leaveTypes.map((lt) => ({ value: lt.id.toString(), label: lt.name }))}
                            styles={fieldStyles}
                        />
                    </Grid.Col>
                    <Grid.Col span={{ base: 12, sm: 4 }}>
                        <Select
                            label="Department"
                            placeholder="All departments"
                            clearable
                            value={selectedDepartment}
                            onChange={setSelectedDepartment}
                            data={departments.map((d) => ({ value: d.id.toString(), label: d.name }))}
                            styles={fieldStyles}
                        />
                    </Grid.Col>
                </Grid>
            </Card>

            {/* Content */}
            {loading ? (
                <Stack gap="sm">
                    <Skeleton height={140} radius="md" />
                    <Skeleton height={140} radius="md" />
                    <Skeleton height={140} radius="md" />
                </Stack>
            ) : summaries.length === 0 ? (
                <Alert
                    icon={<AlertCircle size={16} />}
                    color="blue"
                    radius="md"
                    title="No allocations found"
                >
                    No leave allocations match the current filters. Try adjusting your selection.
                </Alert>
            ) : viewMode === 'cards' ? (
                <EmployeeLeaveCards summaries={summaries} />
            ) : (
                <EmployeeLeaveTable summaries={summaries} />
            )}

            {/* Footer */}
            {!loading && summaries.length > 0 && (
                <Group
                    justify="space-between"
                    p="sm"
                    style={{
                        background: 'var(--mantine-color-gray-0)',
                        borderRadius: 8,
                        border: '1px solid var(--mantine-color-gray-2)',
                    }}
                >
                    <Text size="xs" c="dimmed">
                        {leaveStats.length} allocation{leaveStats.length !== 1 ? 's' : ''} · {summaries.length} employee
                        {summaries.length !== 1 ? 's' : ''}
                    </Text>
                    <Text size="xs" fw={600} c="dimmed">
                        Overall utilization: {avgUtilization.toFixed(1)}%
                    </Text>
                </Group>
            )}
        </Stack>
    );
}
