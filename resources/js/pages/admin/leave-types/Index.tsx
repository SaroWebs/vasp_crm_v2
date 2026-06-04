import { useEffect, useState, useCallback } from 'react';
import { Head, Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Plus, CalendarDays, ArrowLeft, Users, AlertCircle, CheckCircle2, Edit, Trash2, TrendingUp, Calendar, User, Clock } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import axios from 'axios';
import {
    Alert,
    Badge,
    Card,
    Checkbox,
    Group,
    Loader,
    MultiSelect,
    NumberInput,
    Select,
    Stack,
    Tabs,
    Table,
    Text,
    Button as MantineButton,
    Modal,
    TextInput,
    Textarea,
    Grid,
    Progress,
    SimpleGrid,
    Skeleton,
} from '@mantine/core';

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

interface Employee {
    id: number;
    name: string;
    code: string | null;
    department?: {
        id: number;
        name: string;
    };
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
    allocated_hours: number;
    used_hours: number;
    remaining_hours: number;
    carried_over_hours: number;
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Admin',
        href: '/admin/dashboard',
    },
    {
        title: 'Leaves',
        href: '/admin/leave-types',
    },
];

export default function Index() {
    const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [loading, setLoading] = useState(true);
    const [assignLoading, setAssignLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    // Modal state for create/edit leave type
    const [modalOpened, setModalOpened] = useState(false);
    const [editingLeaveType, setEditingLeaveType] = useState<LeaveType | null>(null);
    const [modalLoading, setModalLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        duration_type: 'full_day',
        default_hours: 8,
        requires_approval: false,
        is_paid: true,
        carry_over_allowed: false,
        is_active: true,
    });

    // Assignment form state
    const [assignmentMode, setAssignmentMode] = useState<'all' | 'department' | 'individual'>('all');
    const [selectedLeaveType, setSelectedLeaveType] = useState<string | null>(null);
    const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);
    const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
    const [allocatedHours, setAllocatedHours] = useState<number>(8);
    const [year, setYear] = useState(new Date().getFullYear());

    useEffect(() => {
        fetchData();
    }, []);

    async function fetchData() {
        setLoading(true);
        try {
            const [typesRes, empRes] = await Promise.all([
                axios.get('/api/leave-types'),
                axios.get('/admin/employees', { headers: { Accept: 'application/json' } }),
            ]);

            setLeaveTypes(typesRes.data.leave_types || []);
            const empData = (empRes.data.data || []) as Employee[];
            setEmployees(empData);

            // Extract unique departments from employees
            const uniqueDepts = Array.from(
                new Map(
                    empData
                        .filter((e: Employee) => e.department)
                        .map((e: Employee) => [e.department!.id, e.department!])
                ).values()
            ) as Department[];
            setDepartments(uniqueDepts);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    }

    const openCreateModal = () => {
        setEditingLeaveType(null);
        setFormData({
            name: '',
            description: '',
            duration_type: 'full_day',
            default_hours: 8,
            requires_approval: false,
            is_paid: true,
            carry_over_allowed: false,
            is_active: true,
        });
        setModalOpened(true);
    };

    const openEditModal = (leaveType: LeaveType) => {
        setEditingLeaveType(leaveType);
        setFormData({
            name: leaveType.name,
            description: leaveType.description || '',
            duration_type: leaveType.duration_type || 'full_day',
            default_hours: leaveType.default_hours || 8,
            requires_approval: leaveType.requires_approval,
            is_paid: leaveType.is_paid,
            carry_over_allowed: leaveType.carry_over_allowed || false,
            is_active: leaveType.is_active,
        });
        setModalOpened(true);
    };

    const handleSaveLeaveType = async () => {
        if (!formData.name.trim()) {
            setMessage({ type: 'error', text: 'Leave type name is required.' });
            return;
        }

        setModalLoading(true);
        try {
            if (editingLeaveType) {
                // Update
                await axios.put(`/api/leave-types/${editingLeaveType.id}`, formData);
                setMessage({ type: 'success', text: `Leave type "${formData.name}" updated successfully.` });
            } else {
                // Create
                await axios.post('/api/leave-types', formData);
                setMessage({ type: 'success', text: `Leave type "${formData.name}" created successfully.` });
            }

            setModalOpened(false);
            await fetchData();
        } catch (error: any) {
            const errorMsg = error.response?.data?.message || `Failed to ${editingLeaveType ? 'update' : 'create'} leave type.`;
            setMessage({ type: 'error', text: errorMsg });
        } finally {
            setModalLoading(false);
        }
    };

    const handleDeleteLeaveType = async (leaveType: LeaveType) => {
        if (!confirm(`Are you sure you want to delete "${leaveType.name}"?`)) {
            return;
        }

        setModalLoading(true);
        try {
            await axios.delete(`/api/leave-types/${leaveType.id}`);
            setMessage({ type: 'success', text: `Leave type "${leaveType.name}" deleted successfully.` });
            await fetchData();
        } catch (error: any) {
            const errorMsg = error.response?.data?.message || 'Failed to delete leave type.';
            setMessage({ type: 'error', text: errorMsg });
        } finally {
            setModalLoading(false);
        }
    };

    const getEmployeesToAssign = useCallback(() => {
        if (assignmentMode === 'all') {
            return employees.map((e) => e.id);
        } else if (assignmentMode === 'department') {
            const deptIds = selectedDepartments.map(Number);
            return employees
                .filter((e) => e.department && deptIds.includes(e.department.id))
                .map((e) => e.id);
        } else {
            return selectedEmployees.map(Number);
        }
    }, [assignmentMode, selectedDepartments, selectedEmployees, employees]);

    const handleAssignLeaves = async () => {
        if (!selectedLeaveType) {
            setMessage({ type: 'error', text: 'Please select a leave type.' });
            return;
        }

        const employeeIds = getEmployeesToAssign();
        if (employeeIds.length === 0) {
            setMessage({ type: 'error', text: 'Please select at least one employee.' });
            return;
        }

        setAssignLoading(true);
        try {
            const response = await axios.post('/api/leave-balances/bulk-assign', {
                leave_type_id: parseInt(selectedLeaveType),
                employee_ids: employeeIds,
                allocated_hours: allocatedHours,
                year: year,
            });

            setMessage({
                type: 'success',
                text: `${response.data.results.created + response.data.results.updated} leave allocations completed for ${response.data.leave_type}.`,
            });

            // Reset form
            setSelectedLeaveType(null);
            setSelectedDepartments([]);
            setSelectedEmployees([]);
            setAllocatedHours(8);
        } catch (error: any) {
            setMessage({
                type: 'error',
                text: error.response?.data?.message || 'Failed to assign leaves.',
            });
        } finally {
            setAssignLoading(false);
        }
    };

    const employeesToAssignCount = getEmployeesToAssign().length;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Leave Types" />

            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Leave Management</h1>
                        <p className="text-muted-foreground">Manage leave types and allocations for employees</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" asChild>
                            <Link href="/admin/holidays">
                                <CalendarDays className="mr-2 h-4 w-4" />
                                Holidays
                            </Link>
                        </Button>
                        <Button size="sm" onClick={openCreateModal}>
                            <Plus className="mr-2 h-4 w-4" />
                            Add Leave Type
                        </Button>
                    </div>
                </div>

                {message && (
                    <Alert
                        icon={message.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                        color={message.type === 'success' ? 'green' : 'red'}
                        title={message.type === 'success' ? 'Success' : 'Error'}
                    >
                        {message.text}
                    </Alert>
                )}

                <Tabs defaultValue="types">
                    <Tabs.List>
                        <Tabs.Tab value="types" leftSection={<CalendarDays size={16} />}>
                            Leave Types
                        </Tabs.Tab>
                        <Tabs.Tab value="assign" leftSection={<Users size={16} />}>
                            Assign Leaves
                        </Tabs.Tab>
                    </Tabs.List>

                    {/* Leave Types Tab */}
                    <Tabs.Panel value="types" pt="md">
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {loading ? (
                                <p className="text-sm text-muted-foreground">Loading leave types...</p>
                            ) : leaveTypes.length === 0 ? (
                                <p className="text-sm text-muted-foreground">No leave types found.</p>
                            ) : (
                                leaveTypes.map((lt) => (
                                    <Card key={lt.id} withBorder>
                                        <Stack gap="sm">
                                            <div className="flex items-start justify-between">
                                                <h3 className="font-semibold">{lt.name}</h3>
                                                <Badge color={lt.is_active ? 'green' : 'gray'} variant="light">
                                                    {lt.is_active ? 'Active' : 'Inactive'}
                                                </Badge>
                                            </div>
                                            {lt.description && (
                                                <Text size="xs" c="dimmed">
                                                    {lt.description}
                                                </Text>
                                            )}
                                            <div className="flex flex-wrap gap-2 text-xs">
                                                <Badge variant="outline" size="sm">
                                                    {lt.duration_type.replace('_', ' ')}
                                                </Badge>
                                                <Badge
                                                    color={lt.is_paid ? 'green' : 'gray'}
                                                    variant="light"
                                                    size="sm"
                                                >
                                                    {lt.is_paid ? 'Paid' : 'Unpaid'}
                                                </Badge>
                                                {lt.requires_approval && (
                                                    <Badge color="yellow" variant="light" size="sm">
                                                        Approval Required
                                                    </Badge>
                                                )}
                                            </div>
                                            <div className="flex gap-2 pt-2">
                                                <MantineButton
                                                    size="xs"
                                                    variant="light"
                                                    onClick={() => openEditModal(lt)}
                                                    leftSection={<Edit size={14} />}
                                                >
                                                    Edit
                                                </MantineButton>
                                                <MantineButton
                                                    size="xs"
                                                    color="red"
                                                    variant="light"
                                                    onClick={() => handleDeleteLeaveType(lt)}
                                                    leftSection={<Trash2 size={14} />}
                                                >
                                                    Delete
                                                </MantineButton>
                                            </div>
                                        </Stack>
                                    </Card>
                                ))
                            )}
                        </div>
                    </Tabs.Panel>

                    {/* Assign Leaves Tab */}
                    <Tabs.Panel value="assign" pt="md">
                        <Card withBorder maw={800}>
                            <Stack gap="md">
                                {/* Mode Selection */}
                                <div>
                                    <Text fw={500} mb="xs">
                                        Who to assign leaves to?
                                    </Text>
                                    <Group grow>
                                        <Checkbox
                                            label="All Employees"
                                            checked={assignmentMode === 'all'}
                                            onChange={() => {
                                                setAssignmentMode('all');
                                                setSelectedDepartments([]);
                                                setSelectedEmployees([]);
                                            }}
                                        />
                                        <Checkbox
                                            label="By Department"
                                            checked={assignmentMode === 'department'}
                                            onChange={() => {
                                                setAssignmentMode('department');
                                                setSelectedEmployees([]);
                                            }}
                                        />
                                        <Checkbox
                                            label="Individual Selection"
                                            checked={assignmentMode === 'individual'}
                                            onChange={() => {
                                                setAssignmentMode('individual');
                                                setSelectedDepartments([]);
                                            }}
                                        />
                                    </Group>
                                </div>

                                {/* Department Selection */}
                                {assignmentMode === 'department' && (
                                    <MultiSelect
                                        label="Select Departments"
                                        placeholder="Choose departments"
                                        data={departments.map((d) => ({
                                            value: d.id.toString(),
                                            label: d.name,
                                        }))}
                                        value={selectedDepartments}
                                        onChange={setSelectedDepartments}
                                        searchable
                                    />
                                )}

                                {/* Employee Selection */}
                                {assignmentMode === 'individual' && (
                                    <MultiSelect
                                        label="Select Employees"
                                        placeholder="Choose employees"
                                        data={employees.map((e) => ({
                                            value: e.id.toString(),
                                            label: `${e.name}${e.code ? ` (${e.code})` : ''}`,
                                        }))}
                                        value={selectedEmployees}
                                        onChange={setSelectedEmployees}
                                        searchable
                                    />
                                )}

                                {/* Leave Type Selection */}
                                <Select
                                    label="Leave Type"
                                    placeholder="Select a leave type"
                                    data={leaveTypes
                                        .filter((lt) => lt.is_active)
                                        .map((lt) => ({
                                            value: lt.id.toString(),
                                            label: lt.name,
                                        }))}
                                    value={selectedLeaveType}
                                    onChange={setSelectedLeaveType}
                                    searchable
                                />

                                {/* Hours Input */}
                                <NumberInput
                                    label="Allocated Hours/Days"
                                    placeholder="8"
                                    value={allocatedHours}
                                    onChange={(val) => setAllocatedHours(Number(val) || 8)}
                                    min={0}
                                    step={0.5}
                                />

                                {/* Year Selection */}
                                <Select
                                    label="Year"
                                    value={year.toString()}
                                    onChange={(val) => setYear(parseInt(val || '2026'))}
                                    data={[
                                        { value: '2024', label: '2024' },
                                        { value: '2025', label: '2025' },
                                        { value: '2026', label: '2026' },
                                        { value: '2027', label: '2027' },
                                        { value: '2028', label: '2028' },
                                    ]}
                                />

                                {/* Summary */}
                                <Alert color="blue" title="Assignment Summary">
                                    Will assign {allocatedHours} hours to {employeesToAssignCount} employee
                                    {employeesToAssignCount !== 1 ? 's' : ''} for {year}
                                </Alert>

                                {/* Submit Button */}
                                <MantineButton
                                    onClick={handleAssignLeaves}
                                    loading={assignLoading}
                                    disabled={!selectedLeaveType || employeesToAssignCount === 0}
                                >
                                    Assign Leaves
                                </MantineButton>
                            </Stack>
                        </Card>
                        <Card>
                            <AssignedLeaveList />
                        </Card>
                    </Tabs.Panel>
                </Tabs>

                {/* Create/Edit Leave Type Modal */}
                <Modal
                    opened={modalOpened}
                    onClose={() => setModalOpened(false)}
                    title={editingLeaveType ? 'Edit Leave Type' : 'Create Leave Type'}
                    size="md"
                >
                    <Stack gap="md">
                        <TextInput
                            label="Leave Type Name"
                            placeholder="e.g., Annual Leave, Sick Leave"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.currentTarget.value })}
                            required
                        />

                        <Textarea
                            label="Description"
                            placeholder="Optional description"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.currentTarget.value })}
                            rows={3}
                        />

                        <Select
                            label="Duration Type"
                            placeholder="Select duration type"
                            value={formData.duration_type}
                            onChange={(val) =>
                                setFormData({ ...formData, duration_type: (val || 'full_day') as any })
                            }
                            data={[
                                { value: 'full_day', label: 'Full Day' },
                                { value: 'half_day', label: 'Half Day' },
                                { value: 'custom_hours', label: 'Custom Hours' },
                                { value: 'hourly', label: 'Hourly' },
                            ]}
                        />

                        <NumberInput
                            label="Default Hours (if applicable)"
                            placeholder="8"
                            value={formData.default_hours}
                            onChange={(val) => setFormData({ ...formData, default_hours: Number(val) || 8 })}
                            min={0}
                            step={0.5}
                        />

                        <Group grow>
                            <Checkbox
                                label="Requires Approval"
                                checked={formData.requires_approval}
                                onChange={(e) =>
                                    setFormData({ ...formData, requires_approval: e.currentTarget.checked })
                                }
                            />
                            <Checkbox
                                label="Paid Leave"
                                checked={formData.is_paid}
                                onChange={(e) =>
                                    setFormData({ ...formData, is_paid: e.currentTarget.checked })
                                }
                            />
                            <Checkbox
                                label="Allow Carry Over"
                                checked={formData.carry_over_allowed}
                                onChange={(e) =>
                                    setFormData({ ...formData, carry_over_allowed: e.currentTarget.checked })
                                }
                            />
                        </Group>

                        <Checkbox
                            label="Active"
                            checked={formData.is_active}
                            onChange={(e) => setFormData({ ...formData, is_active: e.currentTarget.checked })}
                        />

                        <Group justify="flex-end" gap="md">
                            <MantineButton variant="light" onClick={() => setModalOpened(false)}>
                                Cancel
                            </MantineButton>
                            <MantineButton onClick={handleSaveLeaveType} loading={modalLoading}>
                                {editingLeaveType ? 'Update' : 'Create'} Leave Type
                            </MantineButton>
                        </Group>
                    </Stack>
                </Modal>
            </div>
        </AppLayout>
    );
}

const AssignedLeaveList = () => {
    const [leaveBalances, setLeaveBalances] = useState<LeaveBalance[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [selectedLeaveType, setSelectedLeaveType] = useState<string | null>(null);
    const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null);
    const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

    useEffect(() => {
        fetchBalances();
        fetchFiltersData();
    }, [selectedYear, selectedLeaveType, selectedDepartment]);

    async function fetchBalances() {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                year: selectedYear.toString(),
                ...(selectedLeaveType && { leave_type_id: selectedLeaveType }),
                ...(selectedDepartment && { department_id: selectedDepartment }),
            });

            const response = await axios.get(`/api/leave-balances?${params}`);
            setLeaveBalances(response.data.data || []);
        } catch (error) {
            console.error('Error fetching leave balances:', error);
            setLeaveBalances([]);
        } finally {
            setLoading(false);
        }
    }

    async function fetchFiltersData() {
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
                        .filter((e: Employee) => e.department)
                        .map((e: Employee) => [e.department!.id, e.department!])
                ).values()
            ) as Department[];
            setDepartments(uniqueDepts);
        } catch (error) {
            console.error('Error fetching filter data:', error);
        }
    }

    const getUtilizationColor = (utilized: number) => {
        if (utilized < 25) return 'green';
        if (utilized < 50) return 'blue';
        if (utilized < 75) return 'yellow';
        return 'red';
    };

    const stats = {
        totalAllocated: leaveBalances.reduce((sum, lb) => sum + lb.allocated_hours, 0),
        totalUsed: leaveBalances.reduce((sum, lb) => sum + lb.used_hours, 0),
        totalRemaining: leaveBalances.reduce((sum, lb) => sum + lb.remaining_hours, 0),
        totalEmployees: new Set(leaveBalances.map((lb) => lb.employee_id)).size,
    };

    const avgUtilization = stats.totalAllocated > 0 ? (stats.totalUsed / stats.totalAllocated) * 100 : 0;

    return (
        <Stack gap="lg">
            {/* Statistics Cards */}
            <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing="md">
                <Card withBorder p="md" bg="var(--mantine-color-blue-0)">
                    <Group justify="space-between">
                        <div>
                            <Text size="xs" c="dimmed" fw={700} tt="uppercase">
                                Total Allocated
                            </Text>
                            <Text fw={700} size="lg">
                                {Number(stats.totalAllocated).toFixed(1)} hrs
                            </Text>
                        </div>
                        <Calendar size={32} color="var(--mantine-color-blue-6)" />
                    </Group>
                </Card>

                <Card withBorder p="md" bg="var(--mantine-color-yellow-0)">
                    <Group justify="space-between">
                        <div>
                            <Text size="xs" c="dimmed" fw={700} tt="uppercase">
                                Hours Used
                            </Text>
                            <Text fw={700} size="lg">
                                {Number(stats.totalUsed).toFixed(1)} hrs
                            </Text>
                        </div>
                        <Clock size={32} color="var(--mantine-color-yellow-6)" />
                    </Group>
                </Card>

                <Card withBorder p="md" bg="var(--mantine-color-green-0)">
                    <Group justify="space-between">
                        <div>
                            <Text size="xs" c="dimmed" fw={700} tt="uppercase">
                                Remaining
                            </Text>
                            <Text fw={700} size="lg">
                                {Number(stats.totalRemaining).toFixed(1)} hrs
                            </Text>
                        </div>
                        <TrendingUp size={32} color="var(--mantine-color-green-6)" />
                    </Group>
                </Card>

                <Card withBorder p="md" bg="var(--mantine-color-grape-0)">
                    <Group justify="space-between">
                        <div>
                            <Text size="xs" c="dimmed" fw={700} tt="uppercase">
                                Avg Utilization
                            </Text>
                            <Text fw={700} size="lg">
                                {Number(avgUtilization).toFixed(0)}%
                            </Text>
                        </div>
                        <Users size={32} color="var(--mantine-color-grape-6)" />
                    </Group>
                </Card>
            </SimpleGrid>

            {/* Filters & Controls */}
            <Card withBorder p="md">
                <Stack gap="md">
                    <Group justify="space-between">
                        <Text fw={600}>Filters & View</Text>
                        <Group gap="xs">
                            <MantineButton
                                size="xs"
                                variant={viewMode === 'cards' ? 'filled' : 'light'}
                                onClick={() => setViewMode('cards')}
                            >
                                Cards
                            </MantineButton>
                            <MantineButton
                                size="xs"
                                variant={viewMode === 'table' ? 'filled' : 'light'}
                                onClick={() => setViewMode('table')}
                            >
                                Table
                            </MantineButton>
                        </Group>
                    </Group>

                    <Grid>
                        <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
                            <Select
                                label="Year"
                                value={selectedYear.toString()}
                                onChange={(val) => setSelectedYear(parseInt(val || new Date().getFullYear().toString()))}
                                data={[
                                    { value: '2024', label: '2024' },
                                    { value: '2025', label: '2025' },
                                    { value: '2026', label: '2026' },
                                    { value: '2027', label: '2027' },
                                ]}
                            />
                        </Grid.Col>
                        <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
                            <Select
                                label="Leave Type"
                                placeholder="All leave types"
                                clearable
                                value={selectedLeaveType}
                                onChange={setSelectedLeaveType}
                                data={leaveTypes.map((lt) => ({
                                    value: lt.id.toString(),
                                    label: lt.name,
                                }))}
                            />
                        </Grid.Col>
                        <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
                            <Select
                                label="Department"
                                placeholder="All departments"
                                clearable
                                value={selectedDepartment}
                                onChange={setSelectedDepartment}
                                data={departments.map((d) => ({
                                    value: d.id.toString(),
                                    label: d.name,
                                }))}
                            />
                        </Grid.Col>
                        <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
                            <Group gap="xs" mt="xl">
                                <MantineButton variant="light" size="sm" onClick={fetchBalances} fullWidth>
                                    Refresh
                                </MantineButton>
                            </Group>
                        </Grid.Col>
                    </Grid>
                </Stack>
            </Card>

            {/* Content */}
            {loading ? (
                <Stack gap="md">
                    <Skeleton height={200} radius="md" />
                    <Skeleton height={200} radius="md" />
                </Stack>
            ) : leaveBalances.length === 0 ? (
                <Alert icon={<AlertCircle size={16} />} color="blue" title="No Data">
                    No leave allocations found for the selected filters.
                </Alert>
            ) : viewMode === 'cards' ? (
                <SimpleGrid cols={{ base: 1, sm: 2, md: 2 }} spacing="md">
                    {leaveBalances.map((balance) => (
                        <Card key={balance.id} withBorder p="md" className="hover:shadow-md transition-shadow">
                            <Stack gap="md">
                                {/* Header */}
                                <Group justify="space-between">
                                    <div>
                                        <Text fw={600} size="sm">
                                            {balance.employee?.name || 'Unknown Employee'}
                                        </Text>
                                        <Text size="xs" c="dimmed">
                                            {balance.leave_type?.name || 'Unknown Leave Type'}
                                        </Text>
                                    </div>
                                    <Badge>{selectedYear}</Badge>
                                </Group>

                                {/* Stats */}
                                <Grid gutter="xs">
                                    <Grid.Col span={6}>
                                        <Stack gap={0}>
                                            <Text size="xs" c="dimmed">
                                                Allocated
                                            </Text>
                                            <Text fw={700}>{Number(balance.allocated_hours).toFixed(1)} hrs</Text>
                                        </Stack>
                                    </Grid.Col>
                                    <Grid.Col span={6}>
                                        <Stack gap={0}>
                                            <Text size="xs" c="dimmed">
                                                Used
                                            </Text>
                                            <Text fw={700} c="orange">
                                                {Number(balance.used_hours).toFixed(1)} hrs
                                            </Text>
                                        </Stack>
                                    </Grid.Col>
                                    <Grid.Col span={6}>
                                        <Stack gap={0}>
                                            <Text size="xs" c="dimmed">
                                                Remaining
                                            </Text>
                                            <Text fw={700} c="green">
                                                {Number(balance.remaining_hours || 0).toFixed(1)} hrs
                                            </Text>
                                        </Stack>
                                    </Grid.Col>
                                    <Grid.Col span={6}>
                                        <Stack gap={0}>
                                            <Text size="xs" c="dimmed">
                                                Carry Over
                                            </Text>
                                            <Text fw={700} c="blue">
                                                {Number(balance.carried_over_hours || 0).toFixed(1)} hrs
                                            </Text>
                                        </Stack>
                                    </Grid.Col>
                                </Grid>

                                {/* Progress Bar */}
                                <Stack gap="xs">
                                    <Group justify="space-between">
                                        <Text size="xs" fw={500}>
                                            Utilization
                                        </Text>
                                        <Text size="xs" fw={700}>
                                            {Number(((balance.used_hours / balance.allocated_hours) * 100)).toFixed(0)}%
                                        </Text>
                                    </Group>
                                    <Progress
                                        value={Number((balance.used_hours / balance.allocated_hours) * 100)}
                                        color={getUtilizationColor(
                                            (balance.used_hours / balance.allocated_hours) * 100
                                        )}
                                        size="md"
                                        radius="md"
                                    />
                                </Stack>

                                {/* Department Badge */}
                                {balance.employee?.department && (
                                    <Badge variant="light" size="sm">
                                        {balance.employee.department.name}
                                    </Badge>
                                )}
                            </Stack>
                        </Card>
                    ))}
                </SimpleGrid>
            ) : (
                <Card withBorder>
                    <Table striped highlightOnHover>
                        <Table.Thead>
                            <Table.Tr>
                                <Table.Th>Employee</Table.Th>
                                <Table.Th>Leave Type</Table.Th>
                                <Table.Th>Department</Table.Th>
                                <Table.Th align="right">Allocated</Table.Th>
                                <Table.Th align="right">Used</Table.Th>
                                <Table.Th align="right">Remaining</Table.Th>
                                <Table.Th align="right">Utilization</Table.Th>
                            </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                            {leaveBalances.map((balance) => {
                                const utilization = (balance.used_hours / balance.allocated_hours) * 100;
                                return (
                                    <Table.Tr key={balance.id}>
                                        <Table.Td>
                                            <Group gap="xs">
                                                <User size={16} />
                                                <div>
                                                    <Text size="sm" fw={500}>
                                                        {balance.employee?.name || 'Unknown'}
                                                    </Text>
                                                    {balance.employee?.code && (
                                                        <Text size="xs" c="dimmed">
                                                            {balance.employee.code}
                                                        </Text>
                                                    )}
                                                </div>
                                            </Group>
                                        </Table.Td>
                                        <Table.Td>
                                            <Badge variant="light">{balance.leave_type?.name || 'Unknown'}</Badge>
                                        </Table.Td>
                                        <Table.Td>
                                            <Text size="sm">{balance.employee?.department?.name || '-'}</Text>
                                        </Table.Td>
                                        <Table.Td align="right">
                                            <Text fw={600}>{Number(balance.allocated_hours).toFixed(1)}</Text>
                                        </Table.Td>
                                        <Table.Td align="right">
                                            <Text fw={600} c="orange">
                                                {Number(balance.used_hours).toFixed(1)}
                                            </Text>
                                        </Table.Td>
                                        <Table.Td align="right">
                                            <Text fw={600} c="green">
                                                {Number(balance.allocated_hours - balance.used_hours).toFixed(1)}
                                            </Text>
                                        </Table.Td>
                                        <Table.Td align="right">
                                            <Badge color={getUtilizationColor(utilization)} size="sm">
                                                {Number(utilization).toFixed(0)}%
                                            </Badge>
                                        </Table.Td>
                                    </Table.Tr>
                                );
                            })}
                        </Table.Tbody>
                    </Table>
                </Card>
            )}

            {/* Summary */}
            <Card withBorder p="md" bg="var(--mantine-color-gray-0)">
                <Group justify="space-between">
                    <Text size="sm" c="dimmed">
                        Showing {leaveBalances.length} leave allocation{leaveBalances.length !== 1 ? 's' : ''} for{' '}
                        {stats.totalEmployees} employee{stats.totalEmployees !== 1 ? 's' : ''}
                    </Text>
                    <Text size="sm" fw={500}>
                        Overall Utilization: {Number(avgUtilization).toFixed(1)}%
                    </Text>
                </Group>
            </Card>
        </Stack>
    );
};