import { useEffect, useMemo, useState } from 'react';
import { Head } from '@inertiajs/react';
import axios from 'axios';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import {
    Button,
    Card,
    Checkbox,
    Group,
    Modal,
    NumberInput,
    Select,
    Stack,
    Switch,
    Table,
    Text,
    TextInput,
} from '@mantine/core';
import { DateInput, TimeInput } from '@mantine/dates';
import dayjs from 'dayjs';

type Shift = {
    id: number;
    name: string;
    start_time: string;
    end_time: string;
    grace_minutes: number;
    is_active: boolean;
    assignments_count?: number;
};

type Employee = {
    id: number;
    name: string;
    code: string;
};

type Assignment = {
    id: number;
    employee_id: number;
    shift_id: number;
    effective_from: string;
    effective_to: string | null;
    is_active: boolean;
    employee?: Employee;
    shift?: Shift;
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/admin/dashboard' },
    { title: 'Shifts', href: '/admin/shifts' },
];

function hhmmFromTime(time: string): string {
    return time.slice(0, 5);
}

function toDateValue(value: string | null): Date | null {
    if (!value) {
        return null;
    }

    const d = new Date(`${value}T00:00:00`);
    return Number.isNaN(d.getTime()) ? null : d;
}

function toDateString(value: Date | null): string | null {
    if (!value) {
        return null;
    }

    return value.toISOString().split('T')[0];
}

function normalizeDateInputValue(value: string | Date | null): Date | null {
    if (!value) {
        return null;
    }

    if (value instanceof Date) {
        return Number.isNaN(value.getTime()) ? null : value;
    }

    return toDateValue(value);
}

export default function ShiftsPage() {
    const [loading, setLoading] = useState(false);
    const [shifts, setShifts] = useState<Shift[]>([]);
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [employees, setEmployees] = useState<Employee[]>([]);

    const [shiftModalOpen, setShiftModalOpen] = useState(false);
    const [assignmentModalOpen, setAssignmentModalOpen] = useState(false);

    const [editingShift, setEditingShift] = useState<Shift | null>(null);
    const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null);

    const [shiftForm, setShiftForm] = useState({
        name: '',
        start_time: '09:00',
        end_time: '18:00',
        grace_minutes: 10,
        is_active: true,
    });

    const [assignmentForm, setAssignmentForm] = useState({
        employee_ids: [] as string[],
        employee_id: '',
        shift_id: '',
        effective_from: null as Date | null,
        effective_to: null as Date | null,
        is_active: true,
    });

    const employeeOptions = useMemo(
        () => employees.map((e) => ({ value: String(e.id), label: `${e.name} (${e.code})` })),
        [employees]
    );

    const shiftOptions = useMemo(
        () => shifts.map((s) => ({ value: String(s.id), label: `${s.name} (${hhmmFromTime(s.start_time)}-${hhmmFromTime(s.end_time)})` })),
        [shifts]
    );

    const fetchAll = async () => {
        setLoading(true);
        try {
            const [shiftsRes, assignmentsRes, employeesRes] = await Promise.all([
                axios.get('/admin/api/shifts'),
                axios.get('/admin/api/shift-assignments'),
                axios.get('/admin/api/shifts/employees'),
            ]);
            setShifts(shiftsRes.data.data || []);
            setAssignments(assignmentsRes.data.data || []);
            setEmployees(employeesRes.data.data || []);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void fetchAll();
    }, []);

    const openNewShiftModal = () => {
        setEditingShift(null);
        setShiftForm({
            name: '',
            start_time: '09:00',
            end_time: '18:00',
            grace_minutes: 10,
            is_active: true,
        });
        setShiftModalOpen(true);
    };

    const openEditShiftModal = (shift: Shift) => {
        setEditingShift(shift);
        setShiftForm({
            name: shift.name,
            start_time: hhmmFromTime(shift.start_time),
            end_time: hhmmFromTime(shift.end_time),
            grace_minutes: shift.grace_minutes,
            is_active: shift.is_active,
        });
        setShiftModalOpen(true);
    };

    const saveShift = async () => {
        const payload = {
            ...shiftForm,
            grace_minutes: Number(shiftForm.grace_minutes || 0),
        };

        if (editingShift) {
            await axios.patch(`/admin/api/shifts/${editingShift.id}`, payload);
        } else {
            await axios.post('/admin/api/shifts', payload);
        }

        setShiftModalOpen(false);
        await fetchAll();
    };

    const deleteShift = async (shiftId: number) => {
        await axios.delete(`/admin/api/shifts/${shiftId}`);
        await fetchAll();
    };

    const openNewAssignmentModal = () => {
        setEditingAssignment(null);
        setAssignmentForm({
            employee_ids: [],
            employee_id: '',
            shift_id: '',
            effective_from: new Date(),
            effective_to: null,
            is_active: true,
        });
        setAssignmentModalOpen(true);
    };

    const openEditAssignmentModal = (assignment: Assignment) => {
        setEditingAssignment(assignment);
        setAssignmentForm({
            employee_ids: [String(assignment.employee_id)],
            employee_id: String(assignment.employee_id),
            shift_id: String(assignment.shift_id),
            effective_from: toDateValue(assignment.effective_from),
            effective_to: toDateValue(assignment.effective_to),
            is_active: assignment.is_active,
        });
        setAssignmentModalOpen(true);
    };

    const saveAssignment = async () => {
        const payload = {
            shift_id: Number(assignmentForm.shift_id),
            effective_from: toDateString(assignmentForm.effective_from),
            effective_to: toDateString(assignmentForm.effective_to),
            is_active: assignmentForm.is_active,
            ...(editingAssignment
                ? { employee_id: Number(assignmentForm.employee_id) }
                : { employee_ids: assignmentForm.employee_ids.map(Number) }),
        };

        if (editingAssignment) {
            await axios.patch(`/admin/api/shift-assignments/${editingAssignment.id}`, payload);
        } else {
            await axios.post('/admin/api/shift-assignments', payload);
        }

        setAssignmentModalOpen(false);
        await fetchAll();
    };

    const deleteAssignment = async (assignmentId: number) => {
        await axios.delete(`/admin/api/shift-assignments/${assignmentId}`);
        await fetchAll();
    };

    return (
        <>
            <Head title="Shift Management" />
            <AppLayout breadcrumbs={breadcrumbs}>
                <Stack p="md" gap="md">
                    <Group justify="space-between">
                        <Text fw={700} size="xl">Manage Shifts & Assignments</Text>
                    </Group>

                    <Card withBorder>
                        <Group justify="space-between" mb="sm">
                            <Text fw={600}>Shifts</Text>
                            <Button onClick={openNewShiftModal}>Add Shift</Button>
                        </Group>

                        <Table striped withTableBorder withColumnBorders>
                            <Table.Thead>
                                <Table.Tr>
                                    <Table.Th>Name</Table.Th>
                                    <Table.Th>Start</Table.Th>
                                    <Table.Th>End</Table.Th>
                                    <Table.Th>Grace (min)</Table.Th>
                                    <Table.Th>Active</Table.Th>
                                    <Table.Th>Assignments</Table.Th>
                                    <Table.Th>Actions</Table.Th>
                                </Table.Tr>
                            </Table.Thead>
                            <Table.Tbody>
                                {shifts.map((s) => (
                                    <Table.Tr key={s.id}>
                                        <Table.Td>{s.name}</Table.Td>
                                        <Table.Td>{hhmmFromTime(s.start_time)}</Table.Td>
                                        <Table.Td>{hhmmFromTime(s.end_time)}</Table.Td>
                                        <Table.Td>{s.grace_minutes}</Table.Td>
                                        <Table.Td>{s.is_active ? 'Yes' : 'No'}</Table.Td>
                                        <Table.Td>{s.assignments_count ?? 0}</Table.Td>
                                        <Table.Td>
                                            <Group gap="xs">
                                                <Button size="xs" variant="light" onClick={() => openEditShiftModal(s)}>Edit</Button>
                                                <Button size="xs" color="red" variant="light" onClick={() => deleteShift(s.id)}>Delete</Button>
                                            </Group>
                                        </Table.Td>
                                    </Table.Tr>
                                ))}
                            </Table.Tbody>
                        </Table>
                    </Card>

                    <Card withBorder>
                        <Group justify="space-between" mb="sm">
                            <Text fw={600}>Employee Shift Assignments</Text>
                            <Button onClick={openNewAssignmentModal}>Assign Shift</Button>
                        </Group>

                        <Table striped withTableBorder withColumnBorders>
                            <Table.Thead>
                                <Table.Tr>
                                    <Table.Th>Employee</Table.Th>
                                    <Table.Th>Shift</Table.Th>
                                    <Table.Th>Effective From</Table.Th>
                                    <Table.Th>Effective To</Table.Th>
                                    <Table.Th>Active</Table.Th>
                                    <Table.Th>Actions</Table.Th>
                                </Table.Tr>
                            </Table.Thead>
                            <Table.Tbody>
                                {assignments.map((a) => (
                                    <Table.Tr key={a.id}>
                                        <Table.Td>{a.employee ? `${a.employee.name} (${a.employee.code})` : a.employee_id}</Table.Td>
                                        <Table.Td>{a.shift ? `${a.shift.name} (${hhmmFromTime(a.shift.start_time)}-${hhmmFromTime(a.shift.end_time)})` : a.shift_id}</Table.Td>
                                        <Table.Td>{dayjs(a.effective_from).format('YYYY-MM-DD HH:mm')}</Table.Td>
                                        <Table.Td>{a.effective_to ? dayjs(a.effective_to).format('YYYY-MM-DD HH:mm') : 'Open'}</Table.Td>
                                        <Table.Td>{a.is_active ? 'Yes' : 'No'}</Table.Td>
                                        <Table.Td>
                                            <Group gap="xs">
                                                <Button size="xs" variant="light" onClick={() => openEditAssignmentModal(a)}>Edit</Button>
                                                <Button size="xs" color="red" variant="light" onClick={() => deleteAssignment(a.id)}>Delete</Button>
                                            </Group>
                                        </Table.Td>
                                    </Table.Tr>
                                ))}
                            </Table.Tbody>
                        </Table>
                    </Card>

                    <Modal opened={shiftModalOpen} onClose={() => setShiftModalOpen(false)} title={editingShift ? 'Edit Shift' : 'Add Shift'}>
                        <Stack>
                            <TextInput
                                label="Shift Name"
                                value={shiftForm.name}
                                onChange={(e) => setShiftForm((prev) => ({ ...prev, name: e.target.value }))}
                                required
                            />

                            <Group grow>
                                <TimeInput
                                    label="Start Time"
                                    value={shiftForm.start_time}
                                    onChange={(e) => setShiftForm((prev) => ({ ...prev, start_time: e.target.value }))}
                                    required
                                />
                                <TimeInput
                                    label="End Time"
                                    value={shiftForm.end_time}
                                    onChange={(e) => setShiftForm((prev) => ({ ...prev, end_time: e.target.value }))}
                                    required
                                />
                            </Group>
                            <NumberInput
                                label="Grace Minutes"
                                min={0}
                                max={180}
                                value={shiftForm.grace_minutes}
                                onChange={(value) => setShiftForm((prev) => ({ ...prev, grace_minutes: Number(value || 0) }))}
                            />
                            <Switch
                                label="Active"
                                checked={shiftForm.is_active}
                                onChange={(e) => setShiftForm((prev) => ({ ...prev, is_active: e.target.checked }))}
                            />
                            <Group justify="flex-end">
                                <Button variant="default" onClick={() => setShiftModalOpen(false)}>Cancel</Button>
                                <Button onClick={saveShift}>Save</Button>
                            </Group>
                        </Stack>
                    </Modal>

                    <Modal
                        opened={assignmentModalOpen}
                        onClose={() => setAssignmentModalOpen(false)}
                        title={editingAssignment ? 'Edit Assignment' : 'Assign Shift'}
                        size="xl"
                    >
                        <Stack>
                            <div className="grid md:grid-cols-5 gap-2">
                                <div className="md:col-span-2">
                                    {editingAssignment ? (
                                        <Select
                                            label="Employee"
                                            data={employeeOptions}
                                            value={assignmentForm.employee_id}
                                            onChange={(value) => setAssignmentForm((prev) => ({ ...prev, employee_id: value || '' }))}
                                            searchable
                                            required
                                        />
                                    ) : (
                                        <div>
                                            <Text fw={600} size="sm">Employees</Text>
                                            <Checkbox.Group
                                                value={assignmentForm.employee_ids}
                                                onChange={(values) => setAssignmentForm((prev) => ({ ...prev, employee_ids: values }))}
                                                required
                                            >
                                                <Stack style={{ maxHeight: 280, overflowY: 'auto' }}>
                                                    {employees.map((employee) => (
                                                        <Checkbox
                                                            key={employee.id}
                                                            value={String(employee.id)}
                                                            label={`${employee.name} (${employee.code})`}
                                                        />
                                                    ))}
                                                </Stack>
                                            </Checkbox.Group>
                                        </div>
                                    )}
                                </div>
                                <div className="md:col-span-3">
                                    <div className="flex justify-end mb-2">
                                        <Switch
                                            label="Active"
                                            checked={assignmentForm.is_active}
                                            onChange={(e) => setAssignmentForm((prev) => ({ ...prev, is_active: e.target.checked }))}
                                        />
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <Select
                                            label="Shift"
                                            data={shiftOptions}
                                            value={assignmentForm.shift_id}
                                            onChange={(value) => setAssignmentForm((prev) => ({ ...prev, shift_id: value || '' }))}
                                            searchable
                                            required
                                        />
                                        <Group grow>
                                            <DateInput
                                                label="Effective From"
                                                value={assignmentForm.effective_from}
                                                onChange={(value) => setAssignmentForm((prev) => ({ ...prev, effective_from: normalizeDateInputValue(value) }))}
                                                required
                                            />
                                            <DateInput
                                                label="Effective To"
                                                value={assignmentForm.effective_to}
                                                onChange={(value) => setAssignmentForm((prev) => ({ ...prev, effective_to: normalizeDateInputValue(value) }))}
                                            />
                                        </Group>
                                    </div>

                                </div>
                            </div>
                            <Group justify="flex-end">
                                <Button variant="default" onClick={() => setAssignmentModalOpen(false)}>Cancel</Button>
                                <Button onClick={saveAssignment}>Save</Button>
                            </Group>

                        </Stack>
                    </Modal>

                    {loading ? <Text c="dimmed" size="sm">Loading...</Text> : null}
                </Stack>
            </AppLayout>
        </>
    );
}
