import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import DailyAttendancePanel from '@/components/admin/employees/DailyAttendancePanel';
import { LeavePanel } from '@/components/admin/employees/LeavePanel';
import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import {
    Alert,
    Badge,
    Button,
    Group,
    Loader,
    Select,
    Stack,
    Tabs,
    Table,
    Text,
} from '@mantine/core';
import { CalendarClock, CheckCircle2, ListChecks, RotateCcw, UserCog, XCircle } from 'lucide-react';
import ShiftChangePanel from '@/components/admin/employees/ShiftChangePanel';
import { AttendanceSummaryTab } from '@/components/attendance';


interface Employee {
    id: number;
    name: string;
    code: string | null;
    department?: {
        id: number;
        name: string;
    } | null;
}

interface AdminAttendancePageProps {
    employees: Employee[];
}

interface QueueItem {
    id: number;
    type: 'leave' | 'remote' | 'field';
    employee_name: string;
    start_date: string;
    end_date: string;
    status: string;
    title: string;
    detail: string | null;
}

interface QueueRequest {
    id: number;
    employee?: {
        name?: string | null;
    } | null;
    start_date: string;
    end_date: string;
    status: string;
    leave_type?: {
        name?: string | null;
    } | null;
    reason?: string | null;
    location?: string | null;
    description?: string | null;
}


const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/admin/dashboard' },
    { title: 'Attendance', href: '/admin/attendance' },
];

const statusColor: Record<string, string> = {
    pending: 'yellow',
    approved: 'green',
    rejected: 'red',
    cancelled: 'gray',
};


function employeeOptions(employees: Employee[]) {
    return employees.map((employee) => ({
        value: String(employee.id),
        label: `${employee.name}${employee.code ? ` (${employee.code})` : ''}`,
    }));
}

function RequestQueue() {
    const [items, setItems] = useState<QueueItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [status, setStatus] = useState<string | null>('pending');
    const [type, setType] = useState<string | null>('all');
    const [actingId, setActingId] = useState<string | null>(null);

    const fetchQueue = async () => {
        setLoading(true);
        setError('');

        try {
            const params = status && status !== 'all' ? { status } : {};
            const [leaveResponse, remoteResponse, fieldResponse] = await Promise.all([
                axios.get('/api/leave-requests', { params }),
                axios.get('/api/remote-work-requests', { params }),
                axios.get('/api/field-work-requests', { params }),
            ]);

            const leaveItems = ((leaveResponse.data.data ?? []) as QueueRequest[]).map((request): QueueItem => ({
                id: request.id,
                type: 'leave',
                employee_name: request.employee?.name ?? 'Unknown',
                start_date: request.start_date,
                end_date: request.end_date,
                status: request.status,
                title: request.leave_type?.name ?? 'Leave',
                detail: request.reason,
            }));

            const remoteItems = ((remoteResponse.data.data ?? []) as QueueRequest[]).map((request): QueueItem => ({
                id: request.id,
                type: 'remote',
                employee_name: request.employee?.name ?? 'Unknown',
                start_date: request.start_date,
                end_date: request.end_date,
                status: request.status,
                title: 'Remote Work',
                detail: request.reason,
            }));

            const fieldItems = ((fieldResponse.data.data ?? []) as QueueRequest[]).map((request): QueueItem => ({
                id: request.id,
                type: 'field',
                employee_name: request.employee?.name ?? 'Unknown',
                start_date: request.start_date,
                end_date: request.end_date,
                status: request.status,
                title: request.location,
                detail: request.description,
            }));

            setItems([...leaveItems, ...remoteItems, ...fieldItems].sort((a, b) => b.start_date.localeCompare(a.start_date)));
        } catch (err: unknown) {
            setError(
                axios.isAxiosError(err)
                    ? err.response?.data?.message ?? 'Failed to load request queue.'
                    : 'Failed to load request queue.',
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchQueue();
    }, [status]);

    const filteredItems = useMemo(() => {
        if (!type || type === 'all') {
            return items;
        }

        return items.filter((item) => item.type === type);
    }, [items, type]);

    const act = async (item: QueueItem, decision: 'approve' | 'reject') => {
        setActingId(`${item.type}-${item.id}-${decision}`);

        try {
            const endpoint = item.type === 'leave'
                ? `/api/leave-requests/${item.id}/${decision}`
                : item.type === 'remote'
                    ? `/api/remote-work-requests/${item.id}/${decision}`
                    : `/api/field-work-requests/${item.id}/${decision}`;

            await axios.post(endpoint, decision === 'reject' ? { notes: 'Rejected by admin.' } : {});
            await fetchQueue();
        } finally {
            setActingId(null);
        }
    };

    return (
        <Stack>
            <Group justify="space-between">
                <Group>
                    <Select
                        label="Status"
                        value={status}
                        onChange={setStatus}
                        data={[
                            { value: 'pending', label: 'Pending' },
                            { value: 'approved', label: 'Approved' },
                            { value: 'rejected', label: 'Rejected' },
                            { value: 'cancelled', label: 'Cancelled' },
                            { value: 'all', label: 'All' },
                        ]}
                    />
                    <Select
                        label="Type"
                        value={type}
                        onChange={setType}
                        data={[
                            { value: 'all', label: 'All' },
                            { value: 'leave', label: 'Leave' },
                            { value: 'remote', label: 'Remote Work' },
                            { value: 'field', label: 'Field Work' },
                        ]}
                    />
                </Group>
                <Button variant="default" leftSection={<RotateCcw size={16} />} onClick={fetchQueue}>
                    Refresh
                </Button>
            </Group>

            {error && <Alert color="red">{error}</Alert>}

            <div className="rounded-lg border">
                <Table striped highlightOnHover>
                    <thead>
                        <tr>
                            <th>Employee</th>
                            <th>Type</th>
                            <th>Dates</th>
                            <th>Details</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={6} className="py-10 text-center">
                                    <Loader size="sm" />
                                </td>
                            </tr>
                        ) : filteredItems.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="py-10 text-center">
                                    <Text c="dimmed">No requests found.</Text>
                                </td>
                            </tr>
                        ) : (
                            filteredItems.map((item) => (
                                <tr key={`${item.type}-${item.id}`}>
                                    <td>{item.employee_name}</td>
                                    <td className="capitalize">{item.type === 'field' ? 'Field Work' : item.type}</td>
                                    <td>{new Date(item.start_date).toLocaleDateString()} - {new Date(item.end_date).toLocaleDateString()}</td>
                                    <td>
                                        <Text size="sm" fw={600}>{item.title}</Text>
                                        <Text size="xs" c="dimmed" lineClamp={2}>{item.detail || '-'}</Text>
                                    </td>
                                    <td>
                                        <Badge color={statusColor[item.status] ?? 'gray'} variant="light">
                                            {item.status}
                                        </Badge>
                                    </td>
                                    <td>
                                        {item.status === 'pending' ? (
                                            <Group gap="xs">
                                                <Button
                                                    size="xs"
                                                    color="green"
                                                    leftSection={<CheckCircle2 size={14} />}
                                                    loading={actingId === `${item.type}-${item.id}-approve`}
                                                    onClick={() => act(item, 'approve')}
                                                >
                                                    Approve
                                                </Button>
                                                <Button
                                                    size="xs"
                                                    color="red"
                                                    variant="outline"
                                                    leftSection={<XCircle size={14} />}
                                                    loading={actingId === `${item.type}-${item.id}-reject`}
                                                    onClick={() => act(item, 'reject')}
                                                >
                                                    Reject
                                                </Button>
                                            </Group>
                                        ) : (
                                            <Text size="xs" c="dimmed">Reviewed</Text>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </Table>
            </div>
        </Stack>
    );
}

function AssignmentPanel({ employees }: { employees: Employee[] }) {
    const [employeeId, setEmployeeId] = useState<string | null>(employees[0] ? String(employees[0].id) : null);

    return (
        <Stack>
            <Select
                label="Employee"
                searchable
                value={employeeId}
                onChange={setEmployeeId}
                data={employeeOptions(employees)}
                placeholder="Select employee"
                maw={420}
            />
            {employeeId ? (
                <LeavePanel employeeId={employeeId} />
            ) : (
                <Alert color="yellow">Select an employee to assign leave, remote work, or field work.</Alert>
            )}
        </Stack>
    );
}


export default function AdminAttendancePage({ employees }: AdminAttendancePageProps) {
    const [activeTab, setActiveTab] = useState<string | null>('summary');

    return (
        <>
            <Head title="Attendance Management" />
            <AppLayout breadcrumbs={breadcrumbs}>
                <div className="space-y-4 p-4">
                    <Tabs
                        value={activeTab}
                        onChange={setActiveTab}
                        keepMounted={false}
                        className="w-full"
                    >
                        <Tabs.List>
                            <Tabs.Tab value="summary" leftSection={<ListChecks size={16} />}>Summary</Tabs.Tab>
                            <Tabs.Tab value="daily" leftSection={<CalendarClock size={16} />}>Daily Attendance</Tabs.Tab>
                            <Tabs.Tab value="requests" leftSection={<ListChecks size={16} />}>Requests</Tabs.Tab>
                            <Tabs.Tab value="assignments" leftSection={<UserCog size={16} />}>Assignments</Tabs.Tab>
                            <Tabs.Tab value="shifts" leftSection={<UserCog size={16} />}>Shifts</Tabs.Tab>
                        </Tabs.List>
                        <Tabs.Panel value="summary" pt="md">
                            {activeTab === 'summary' && <AttendanceSummaryTab />}
                        </Tabs.Panel>
                        <Tabs.Panel value="daily" pt="md">
                            {activeTab === 'daily' && <DailyAttendancePanel />}
                        </Tabs.Panel>

                        <Tabs.Panel value="requests" pt="md">
                            {activeTab === 'requests' && <RequestQueue />}
                        </Tabs.Panel>

                        <Tabs.Panel value="assignments" pt="md">
                            {activeTab === 'assignments' && <AssignmentPanel employees={employees} />}
                        </Tabs.Panel>

                        <Tabs.Panel value="shifts" pt="md">
                            {activeTab === 'shifts' && <ShiftChangePanel employees={employees} selectedId={null} />}
                        </Tabs.Panel>

                    </Tabs>
                </div>
            </AppLayout>
        </>
    );
}
