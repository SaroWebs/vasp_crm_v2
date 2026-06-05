import { useEffect, useState, useCallback } from 'react';
import { Head, Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Plus, CalendarDays, Users } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import axios from 'axios';
import {
    Alert,
    Group,
    SimpleGrid,
    Skeleton,
    Stack,
    Tabs,
    Text
} from '@mantine/core';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

import { LeaveTypeCard } from '@/components/leave/LeaveTypeCard';
import { LeaveTypeModal } from '@/components/leave/LeaveTypeModal';
import { AssignLeavesPanel } from '@/components/leave/AssignLeavesPanel';
import { AssignedLeaveList } from '@/components/leave/AssignedLeaveList';

// ─── Types ────────────────────────────────────────────────────────────────────

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
    department?: { id: number; name: string };
}

interface Department {
    id: number;
    name: string;
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

// ─── Constants ────────────────────────────────────────────────────────────────

const DEFAULT_FORM: LeaveTypeFormData = {
    name: '',
    description: '',
    duration_type: 'full_day',
    default_hours: 8,
    requires_approval: false,
    is_paid: true,
    carry_over_allowed: false,
    is_active: true,
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Admin', href: '/admin/dashboard' },
    { title: 'Leaves', href: '/admin/leave-types' },
];

const getErrorMessage = (error: unknown, fallback: string): string =>
    axios.isAxiosError<{ message?: string }>(error)
        ? error.response?.data?.message || fallback
        : fallback;

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Index() {
    const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [loading, setLoading] = useState(true);
    const [assignLoading, setAssignLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    // Modal
    const [modalOpened, setModalOpened] = useState(false);
    const [editingLeaveType, setEditingLeaveType] = useState<LeaveType | null>(null);
    const [modalLoading, setModalLoading] = useState(false);
    const [formData, setFormData] = useState<LeaveTypeFormData>(DEFAULT_FORM);

    // Assignment form
    const [assignmentMode, setAssignmentMode] = useState<'all' | 'individual'>('all');
    const [selectedLeaveType, setSelectedLeaveType] = useState<string | null>(null);
    const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
    const [numberOfLeaves, setNumberOfLeaves] = useState(8);
    const [year, setYear] = useState(new Date().getFullYear());

    // ── Data fetching ──────────────────────────────────────────────────────────

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
            setDepartments(
                Array.from(
                    new Map(
                        empData
                            .filter((e) => e.department)
                            .map((e) => [e.department!.id, e.department!])
                    ).values()
                ) as Department[]
            );
        } catch (err) {
            console.error('Error fetching data:', err);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => { fetchData(); }, []);

    // ── Modal handlers ─────────────────────────────────────────────────────────

    const openCreateModal = () => {
        setEditingLeaveType(null);
        setFormData(DEFAULT_FORM);
        setModalOpened(true);
    };

    const openEditModal = (lt: LeaveType) => {
        setEditingLeaveType(lt);
        setFormData({
            name: lt.name,
            description: lt.description || '',
            duration_type: lt.duration_type || 'full_day',
            default_hours: lt.default_hours || 8,
            requires_approval: lt.requires_approval,
            is_paid: lt.is_paid,
            carry_over_allowed: lt.carry_over_allowed || false,
            is_active: lt.is_active,
        });
        setModalOpened(true);
    };

    const handleSave = async () => {
        if (!formData.name.trim()) {
            setMessage({ type: 'error', text: 'Leave type name is required.' });
            return;
        }
        setModalLoading(true);
        try {
            if (editingLeaveType) {
                await axios.put(`/api/leave-types/${editingLeaveType.id}`, formData);
                setMessage({ type: 'success', text: `"${formData.name}" updated successfully.` });
            } else {
                await axios.post('/api/leave-types', formData);
                setMessage({ type: 'success', text: `"${formData.name}" created successfully.` });
            }
            setModalOpened(false);
            await fetchData();
        } catch (err) {
            setMessage({
                type: 'error',
                text: getErrorMessage(err, `Failed to ${editingLeaveType ? 'update' : 'create'} leave type.`),
            });
        } finally {
            setModalLoading(false);
        }
    };

    const handleDelete = async (lt: LeaveType) => {
        if (!confirm(`Are you sure you want to delete "${lt.name}"?`)) return;
        setModalLoading(true);
        try {
            await axios.delete(`/api/leave-types/${lt.id}`);
            setMessage({ type: 'success', text: `"${lt.name}" deleted.` });
            await fetchData();
        } catch (err) {
            setMessage({ type: 'error', text: getErrorMessage(err, 'Failed to delete leave type.') });
        } finally {
            setModalLoading(false);
        }
    };

    // ── Assignment ─────────────────────────────────────────────────────────────

    const getEmployeesToAssign = useCallback(() => {
        if (assignmentMode === 'all') return employees.map((e) => e.id);
        return selectedEmployees.map(Number);
    }, [assignmentMode, selectedEmployees, employees]);

    const handleAssign = async () => {
        if (!selectedLeaveType) {
            setMessage({ type: 'error', text: 'Please select a leave type.' });
            return;
        }
        const ids = getEmployeesToAssign();
        if (ids.length === 0) {
            setMessage({ type: 'error', text: 'Please select at least one employee.' });
            return;
        }
        setAssignLoading(true);
        try {
            const res = await axios.post('/api/leave-balances/bulk-assign', {
                leave_type_id: parseInt(selectedLeaveType),
                employee_ids: ids,
                number_of_leaves: numberOfLeaves,
                year,
            });
            setMessage({
                type: 'success',
                text: `${res.data.results.created + res.data.results.updated} allocations updated for ${res.data.leave_type}.`,
            });
            setSelectedLeaveType(null);
            setSelectedEmployees([]);
            setNumberOfLeaves(8);
        } catch (err) {
            setMessage({ type: 'error', text: getErrorMessage(err, 'Failed to assign leaves.') });
        } finally {
            setAssignLoading(false);
        }
    };

    const employeesToAssignCount = getEmployeesToAssign().length;

    // ── Render ─────────────────────────────────────────────────────────────────

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Leave Management" />

            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                {/* Page header */}
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        justifyContent: 'space-between',
                        gap: 16,
                        flexWrap: 'wrap',
                    }}
                >
                    <div>
                        <Text
                            size="xl"
                            fw={800}
                            style={{ letterSpacing: '-0.03em', color: '#0f172a', lineHeight: 1.2 }}
                        >
                            Leave Management
                        </Text>
                        <Text size="sm" c="dimmed" mt={4}>
                            Configure leave types and allocate days across your team
                        </Text>
                    </div>
                    <Group gap="sm" wrap="nowrap">
                        <Button variant="outline" size="sm" asChild>
                            <Link href="/admin/holidays">
                                <CalendarDays className="mr-2 h-4 w-4" />
                                Holidays
                            </Link>
                        </Button>
                        <Button
                            size="sm"
                            onClick={openCreateModal}
                            style={{
                                background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
                                border: 'none',
                            }}
                        >
                            <Plus className="mr-2 h-4 w-4" />
                            Add Leave Type
                        </Button>
                    </Group>
                </div>

                {/* Status message */}
                {message && (
                    <Alert
                        icon={message.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                        color={message.type === 'success' ? 'teal' : 'red'}
                        radius="md"
                        withCloseButton
                        onClose={() => setMessage(null)}
                    >
                        {message.text}
                    </Alert>
                )}

                {/* Tabs */}
                <Tabs defaultValue="types" variant="pills">
                    <Tabs.List>
                        <Tabs.Tab value="types" leftSection={<CalendarDays size={14} />}>
                            Leave Types
                        </Tabs.Tab>
                        <Tabs.Tab value="assign" leftSection={<Users size={14} />}>
                            Assign & View
                        </Tabs.Tab>
                    </Tabs.List>

                    {/* ── Leave Types Tab ── */}
                    <Tabs.Panel value="types" pt="lg">
                        {loading ? (
                            <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="md">
                                {[1, 2, 3].map((i) => <Skeleton key={i} height={180} radius="md" />)}
                            </SimpleGrid>
                        ) : leaveTypes.length === 0 ? (
                            <Alert icon={<AlertCircle size={16} />} color="gray" radius="md">
                                No leave types yet. Click "Add Leave Type" to get started.
                            </Alert>
                        ) : (
                            <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="md">
                                {leaveTypes.map((lt) => (
                                    <LeaveTypeCard
                                        key={lt.id}
                                        leaveType={lt}
                                        onEdit={openEditModal}
                                        onDelete={handleDelete}
                                    />
                                ))}
                            </SimpleGrid>
                        )}
                    </Tabs.Panel>

                    {/* ── Assign & View Tab ── */}
                    <Tabs.Panel value="assign" pt="lg">
                        <Stack gap="xl">
                            <AssignLeavesPanel
                                leaveTypes={leaveTypes}
                                employees={employees}
                                departments={departments}
                                assignmentMode={assignmentMode}
                                setAssignmentMode={setAssignmentMode}
                                selectedLeaveType={selectedLeaveType}
                                setSelectedLeaveType={setSelectedLeaveType}
                                selectedEmployees={selectedEmployees}
                                setSelectedEmployees={setSelectedEmployees}
                                numberOfLeaves={numberOfLeaves}
                                setNumberOfLeaves={setNumberOfLeaves}
                                year={year}
                                setYear={setYear}
                                employeesToAssignCount={employeesToAssignCount}
                                onAssign={handleAssign}
                                loading={assignLoading}
                            />

                            <AssignedLeaveList />
                        </Stack>
                    </Tabs.Panel>
                </Tabs>
            </div>

            {/* Modal */}
            <LeaveTypeModal
                opened={modalOpened}
                onClose={() => setModalOpened(false)}
                editingLeaveType={editingLeaveType}
                formData={formData}
                setFormData={setFormData}
                onSave={handleSave}
                loading={modalLoading}
            />
        </AppLayout>
    );
}
