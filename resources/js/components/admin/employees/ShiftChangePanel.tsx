import { useEffect, useState } from "react";
import { DateInput } from '@mantine/dates';
import axios from "axios";
import { Alert, Badge, Button, Card, Divider, Group, Loader, Select, Stack, Table, Tabs, Textarea, ThemeIcon, Tooltip } from "@mantine/core";
import { ExternalLink, AlertCircle, CheckCircle2, UserCog, Calendar, Clock, Info } from "lucide-react";

interface Employee {
    id: number;
    name: string;
    code: string | null;
    department?: {
        id: number;
        name: string;
    } | null;
}

interface Shift {
    id: number;
    name: string;
    start_time: string;
    end_time: string;
    grace_minutes?: number;
    is_active: boolean;
}

interface ShiftAssignment {
    id: number;
    employee_id: number;
    shift_id: number;
    effective_from: string;
    effective_to: string | null;
    is_active: boolean;
    shift?: Shift;
}

function formatDate(value: Date | string | null): string {
    if (!value) {
        return '';
    }

    const date = value instanceof Date ? value : new Date(value);

    if (Number.isNaN(date.getTime())) {
        return '';
    }

    return date.toISOString().slice(0, 10);
}

function formatDisplayDate(date: string | null): string {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function formatTime(time: string): string {
    return time.slice(0, 5);
}

function employeeOptions(employees: Employee[]) {
    return employees.map((employee) => ({
        value: String(employee.id),
        label: `${employee.name}${employee.code ? ` (${employee.code})` : ''}`,
    }));
}

function ShiftChangePanel({ employees = [], selectedId = null }: { employees: Employee[], selectedId: number | null }) {
    const [employeeId, setEmployeeId] = useState<string | null>(selectedId ? String(selectedId) : employees[0] ? String(employees[0].id) : null);
    const [shiftId, setShiftId] = useState<string | null>(null);
    const [effectiveFrom, setEffectiveFrom] = useState('');
    const [effectiveTo, setEffectiveTo] = useState('');
    const [notes, setNotes] = useState('');
    const [shifts, setShifts] = useState<Shift[]>([]);
    const [saving, setSaving] = useState(false);
    const [loadingShifts, setLoadingShifts] = useState(true);
    const [loadingHistory, setLoadingHistory] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [employeeList, setEmployeeList] = useState<Employee[]>(employees);
    const [currentShift, setCurrentShift] = useState<ShiftAssignment | null>(null);
    const [shiftHistory, setShiftHistory] = useState<ShiftAssignment[]>([]);

    useEffect(() => {
        const loadData = async () => {
            try {
                if (employees.length === 0) {
                    const empResponse = await axios.get('/admin/api/employees');
                    setEmployeeList(empResponse.data ?? []);
                }
                
                const shiftsResponse = await axios.get('/admin/api/shifts');
                setShifts(shiftsResponse.data.data ?? []);
            } catch (error) {
                console.error('Failed to load shifts:', error);
                setShifts([]);
            } finally {
                setLoadingShifts(false);
            }
        };

        loadData();
    }, [employees.length]);

    // Load current and history when employee changes
    useEffect(() => {
        if (!employeeId) {
            setCurrentShift(null);
            setShiftHistory([]);
            return;
        }

        const loadShiftData = async () => {
            setLoadingHistory(true);
            try {
                const response = await axios.get(`/admin/employees/${employeeId}`, {
                    headers: { Accept: 'application/json' },
                });
                const data = response.data.employee ?? response.data;
                setCurrentShift(data.currentShiftAssignment ?? null);
                setShiftHistory(data.shiftAssignmentHistory ?? []);
            } catch (error) {
                console.error('Failed to load shift data:', error);
                setCurrentShift(null);
                setShiftHistory([]);
            } finally {
                setLoadingHistory(false);
            }
        };

        loadShiftData();
    }, [employeeId]);

    const validate = (): string | null => {
        if (!employeeId) return 'Please select an employee.';
        if (!shiftId) return 'Please select a shift.';
        if (!effectiveFrom) return 'Effective date is required.';
        if (effectiveTo && new Date(effectiveTo) <= new Date(effectiveFrom)) {
            return 'Effective to date must be after effective from date.';
        }
        return null;
    };

    const submit = async () => {
        const error = validate();
        if (error) {
            setMessage({ type: 'error', text: error });
            return;
        }

        setSaving(true);
        setMessage(null);

        try {
            await axios.post(`/api/employees/${employeeId}/change-shift`, {
                shift_id: shiftId,
                effective_from: effectiveFrom,
                effective_to: effectiveTo || null,
                notes: notes || null,
            });

            // Reload shift data
            if (employeeId) {
                const response = await axios.get(`/admin/employees/${employeeId}`, {
                    headers: { Accept: 'application/json' },
                });
                const data = response.data.employee ?? response.data;
                setCurrentShift(data.currentShiftAssignment ?? null);
                setShiftHistory(data.shiftAssignmentHistory ?? []);
            }

            setMessage({ type: 'success', text: 'Shift changed successfully.' });
            setShiftId(null);
            setEffectiveFrom('');
            setEffectiveTo('');
            setNotes('');
        } catch (err: any) {
            setMessage({ type: 'error', text: err.response?.data?.message ?? 'Failed to change shift.' });
        } finally {
            setSaving(false);
        }
    };

    const selectedShift = shiftId ? shifts.find(s => String(s.id) === shiftId) : null;

    return (
        <Stack gap="lg">
            <Tabs defaultValue="change" orientation="vertical">
                <Tabs.List>
                    <Tabs.Tab value="change" leftSection={<UserCog size={16} />}>
                        Change Shift
                    </Tabs.Tab>
                    <Tabs.Tab value="current" leftSection={<Calendar size={16} />}>
                        Current Assignment
                    </Tabs.Tab>
                    <Tabs.Tab value="history" leftSection={<Clock size={16} />}>
                        History
                    </Tabs.Tab>
                </Tabs.List>

                <Tabs.Panel value="change" className="flex-1">
                    <Stack gap="md">
                        {/* Employee Selection */}
                        <Card withBorder>
                            <Stack gap="sm">
                                <Select
                                    label="Employee"
                                    placeholder="Select employee"
                                    searchable
                                    clearable
                                    value={employeeId}
                                    onChange={setEmployeeId}
                                    data={employeeOptions(employees.length > 0 ? employees : employeeList)}
                                    disabled={selectedId !== null}
                                />
                            </Stack>
                        </Card>

                        {/* Shift Selection */}
                        <Card withBorder>
                            <Stack gap="sm">
                                <Select
                                    label="New Shift"
                                    placeholder="Select shift"
                                    searchable
                                    value={shiftId}
                                    onChange={setShiftId}
                                    disabled={loadingShifts}
                                    rightSection={loadingShifts && <Loader size="xs" />}
                                    data={shifts.map((shift) => ({
                                        value: String(shift.id),
                                        label: `${shift.name} (${formatTime(shift.start_time)}-${formatTime(shift.end_time)})`,
                                    }))}
                                />

                                {/* Shift Preview */}
                                {selectedShift && (
                                    <div className="rounded-md bg-blue-50 border border-blue-200 p-3 space-y-2">
                                        <div className="flex items-start justify-between">
                                            <div className="text-sm font-medium text-blue-900">{selectedShift.name}</div>
                                            <Badge size="sm" variant="light" color={selectedShift.is_active ? 'green' : 'gray'}>
                                                {selectedShift.is_active ? 'Active' : 'Inactive'}
                                            </Badge>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2 text-xs text-blue-800">
                                            <div>
                                                <div className="text-blue-600 font-semibold">Time</div>
                                                {formatTime(selectedShift.start_time)} — {formatTime(selectedShift.end_time)}
                                            </div>
                                            <div>
                                                <div className="text-blue-600 font-semibold">Grace Period</div>
                                                {selectedShift.grace_minutes ?? 0} minutes
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </Stack>
                        </Card>

                        {/* Effective Dates */}
                        <Card withBorder>
                            <Stack gap="sm">
                                <div className="grid grid-cols-2 gap-3">
                                    <DateInput
                                        label="Effective From *"
                                        placeholder="YYYY-MM-DD"
                                        value={effectiveFrom ? new Date(effectiveFrom) : null}
                                        onChange={(date) => setEffectiveFrom(formatDate(date))}
                                    />
                                    <DateInput
                                        label="Effective To (Optional)"
                                        placeholder="YYYY-MM-DD"
                                        value={effectiveTo ? new Date(effectiveTo) : null}
                                        onChange={(date) => setEffectiveTo(formatDate(date))}
                                    />
                                </div>
                            </Stack>
                        </Card>

                        {/* Notes */}
                        <Card withBorder>
                            <Stack gap="sm">
                                <Textarea
                                    label="Notes (Optional)"
                                    placeholder="Add any notes about this shift change..."
                                    value={notes}
                                    onChange={(event) => setNotes(event.currentTarget.value)}
                                    minRows={2}
                                />
                            </Stack>
                        </Card>

                        {/* Messages */}
                        {message && (
                            <Alert
                                icon={message.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                                color={message.type === 'success' ? 'green' : 'red'}
                                title={message.type === 'success' ? 'Success' : 'Error'}
                            >
                                {message.text}
                            </Alert>
                        )}

                        {/* Actions */}
                        <Group grow>
                            <Button
                                onClick={submit}
                                loading={saving}
                                disabled={!employeeId}
                                leftSection={saving ? null : <UserCog size={16} />}
                            >
                                Change Shift
                            </Button>
                            <Button
                                variant="default"
                                component="a"
                                href="/admin/shifts"
                                leftSection={<ExternalLink size={16} />}
                            >
                                Manage Shifts
                            </Button>
                        </Group>
                    </Stack>
                </Tabs.Panel>

                <Tabs.Panel value="current" className="flex-1">
                    <Stack gap="md">
                        {loadingHistory ? (
                            <div className="flex justify-center py-8">
                                <Loader />
                            </div>
                        ) : currentShift?.shift ? (
                            <Card withBorder>
                                <Stack gap="md">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <h3 className="text-lg font-semibold">{currentShift.shift.name}</h3>
                                            <Badge size="sm" color="green" variant="light" className="mt-2">
                                                Currently Active
                                            </Badge>
                                        </div>
                                    </div>

                                    <Divider />

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <Group gap="xs" mb="xs">
                                                <Clock size={16} className="text-gray-600" />
                                                <span className="text-sm font-medium text-gray-700">Schedule</span>
                                            </Group>
                                            <div className="text-sm text-gray-900 ml-6">
                                                {formatTime(currentShift.shift.start_time)} — {formatTime(currentShift.shift.end_time)}
                                            </div>
                                        </div>

                                        <div>
                                            <Group gap="xs" mb="xs">
                                                <AlertCircle size={16} className="text-gray-600" />
                                                <span className="text-sm font-medium text-gray-700">Grace Period</span>
                                            </Group>
                                            <div className="text-sm text-gray-900 ml-6">
                                                {currentShift.shift.grace_minutes ?? 0} minutes
                                            </div>
                                        </div>
                                    </div>

                                    <Divider />

                                    <div>
                                        <Group gap="xs" mb="xs">
                                            <Calendar size={16} className="text-gray-600" />
                                            <span className="text-sm font-medium text-gray-700">Effective Period</span>
                                        </Group>
                                        <div className="text-sm text-gray-900 ml-6">
                                            From: <span className="font-mono font-semibold">{formatDisplayDate(currentShift.effective_from)}</span>
                                            <br />
                                            To: <span className="font-mono font-semibold">{formatDisplayDate(currentShift.effective_to)}</span>
                                        </div>
                                    </div>
                                </Stack>
                            </Card>
                        ) : (
                            <Alert icon={<Info size={16} />} color="yellow" title="No Active Shift">
                                This employee has no active shift assignment.
                            </Alert>
                        )}
                    </Stack>
                </Tabs.Panel>

                <Tabs.Panel value="history" className="flex-1">
                    <Stack gap="md">
                        {loadingHistory ? (
                            <div className="flex justify-center py-8">
                                <Loader />
                            </div>
                        ) : shiftHistory.length > 0 ? (
                            <div className="overflow-x-auto">
                                <Table striped highlightOnHover>
                                    <thead>
                                        <tr>
                                            <th>Shift</th>
                                            <th>Time</th>
                                            <th>Effective From</th>
                                            <th>Effective To</th>
                                            <th>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {shiftHistory.map((assignment) => (
                                            <tr key={assignment.id}>
                                                <td className="font-medium">{assignment.shift?.name || '—'}</td>
                                                <td>
                                                    {assignment.shift ? (
                                                        <div className="text-sm">
                                                            {formatTime(assignment.shift.start_time)} — {formatTime(assignment.shift.end_time)}
                                                        </div>
                                                    ) : (
                                                        '—'
                                                    )}
                                                </td>
                                                <td>{formatDisplayDate(assignment.effective_from)}</td>
                                                <td>{formatDisplayDate(assignment.effective_to)}</td>
                                                <td>
                                                    <Badge
                                                        size="sm"
                                                        color={assignment.is_active ? 'green' : 'gray'}
                                                        variant="light"
                                                    >
                                                        {assignment.is_active ? 'Active' : 'Inactive'}
                                                    </Badge>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </Table>
                            </div>
                        ) : (
                            <Alert icon={<Info size={16} />} color="gray" title="No History">
                                No shift assignment history available.
                            </Alert>
                        )}
                    </Stack>
                </Tabs.Panel>
            </Tabs>
        </Stack>
    );
}

export default ShiftChangePanel;