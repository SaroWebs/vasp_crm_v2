import { useState, useEffect, useCallback, useMemo } from 'react';
import { usePage } from '@inertiajs/react';
import axios from 'axios';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Paper, Text, Badge, Group, Stack, Divider, SimpleGrid, Skeleton, Button } from '@mantine/core';
import { Clock, MapPin, Monitor, Wifi, User, Calendar } from 'lucide-react';
import { MonthYearPicker } from './MonthYearPicker';
import { AttendanceCalendarGrid } from './AttendanceCalendarGrid';
import { PunchWidget } from './PunchWidget';
import { EmployeeSelector } from './EmployeeSelector';
import { type SharedData } from '@/types';

interface AttendanceRecord {
    id?: number;
    employee_id?: number;
    machine_id?: number;
    attendance_date: string;
    punch_in: string | null;
    punch_out: string | null;
    ip?: string;
    employee_name?: string;
    group_name?: string | null;
    is_live?: number;
    mode: string;
    created_at?: string;
    updated_at?: string;
}

interface Holiday {
    date: string;
    name: string;
    type?: string;
}

interface WorkingHoursConfig {
    workdays: Array<{
        day: string;
        start: string;
        end: string;
        break_start: string;
        break_end: string;
    }>;
    timezone: string;
}

interface AttendanceCalendarMeta {
    holidays: Holiday[];
    working_hours: WorkingHoursConfig;
}

interface AttendanceSummary {
    total_days: number;
    present_days: number;
    absent_days: number;
    late_days: number;
    total_hours: number;
}

const defaultSummary: AttendanceSummary = {
    total_days: 0,
    present_days: 0,
    absent_days: 0,
    late_days: 0,
    total_hours: 0,
};

interface AttendanceCalendarProps {
    auth?: any;
    employeeId?: number | null;
}

function formatTime(time: string | null) {
    if (!time) return '—';
    const [h, m] = time.split(':');
    const date = new Date();
    date.setHours(Number(h), Number(m));
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function calcDuration(punchIn: string | null, punchOut: string | null) {
    if (!punchIn || !punchOut) return null;
    const [ih, im, is_] = punchIn.split(':').map(Number);
    const [oh, om, os] = punchOut.split(':').map(Number);
    const inSec = ih * 3600 + im * 60 + (is_ || 0);
    const outSec = oh * 3600 + om * 60 + (os || 0);
    const diff = outSec - inSec;
    if (diff <= 0) return null;
    const hours = Math.floor(diff / 3600);
    const mins = Math.floor((diff % 3600) / 60);
    return `${hours}h ${mins}m`;
}

function DayDetailPanel({ date, records, close }: { date: string; records: AttendanceRecord[], close?: () => void }) {
    const formatted = new Date(date).toLocaleDateString('en-IN', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    });

    if (records.length === 0) {
        return (
            <Paper withBorder p="lg" radius="md">
                <Group gap="sm" mb="md">
                    <Calendar size={16} />
                    <Text fw={600} size="sm">{formatted}</Text>
                </Group>
                <Text size="sm" c="dimmed">No attendance record for this day.</Text>
            </Paper>
        );
    }

    return (
        <Card className='p-4'>
            <div className="flex justify-between items-center">
                <Group gap="sm" mb="md">
                    <Calendar size={16} />
                    <Text fw={600} size="sm">{formatted}</Text>
                    {records[0].is_live === 1 && (
                        <Badge color="green" size="xs" variant="dot">Live</Badge>
                    )}
                </Group>
                <div className="flex">
                    <Button variant="subtle" size="xs" onClick={close}>
                        Close
                    </Button>
                </div>
            </div>

            <Stack gap="md">
                {records.map((record, i) => {
                    const duration = calcDuration(record.punch_in, record.punch_out);
                    return (
                        <div key={record.id ?? i}>
                            {i > 0 && <Divider />}
                            <SimpleGrid cols={2} spacing="sm">
                                <Group gap="xs">
                                    <Clock size={14} style={{ color: 'var(--mantine-color-green-6)' }} />
                                    <div>
                                        <Text size="xs" c="dimmed">Punch In</Text>
                                        <Text size="sm" fw={500}>{formatTime(record.punch_in)}</Text>
                                    </div>
                                </Group>

                                <Group gap="xs">
                                    <Clock size={14} style={{ color: 'var(--mantine-color-red-6)' }} />
                                    <div>
                                        <Text size="xs" c="dimmed">Punch Out</Text>
                                        <Text size="sm" fw={500}>
                                            {record.punch_out ? formatTime(record.punch_out) : (
                                                <Badge color="yellow" size="xs">Not yet</Badge>
                                            )}
                                        </Text>
                                    </div>
                                </Group>

                                {duration && (
                                    <Group gap="xs">
                                        <Monitor size={14} style={{ color: 'var(--mantine-color-blue-6)' }} />
                                        <div>
                                            <Text size="xs" c="dimmed">Duration</Text>
                                            <Text size="sm" fw={500}>{duration}</Text>
                                        </div>
                                    </Group>
                                )}

                                <Group gap="xs">
                                    <MapPin size={14} style={{ color: 'var(--mantine-color-violet-6)' }} />
                                    <div>
                                        <Text size="xs" c="dimmed">Mode</Text>
                                        <Badge
                                            size="sm"
                                            color={record.mode === 'remote' ? 'blue' : 'gray'}
                                            variant="light"
                                            leftSection={record.mode === 'remote' ? <Wifi size={10} /> : <Monitor size={10} />}
                                        >
                                            {record.mode === 'remote' ? 'Remote' : 'Office'}
                                        </Badge>
                                    </div>
                                </Group>

                                {record.employee_name && (
                                    <Group gap="xs">
                                        <User size={14} style={{ color: 'var(--mantine-color-orange-6)' }} />
                                        <div>
                                            <Text size="xs" c="dimmed">Employee</Text>
                                            <Text size="sm" fw={500}>{record.employee_name}</Text>
                                        </div>
                                    </Group>
                                )}

                                {record.ip && (
                                    <Group gap="xs">
                                        <Wifi size={14} style={{ color: 'var(--mantine-color-teal-6)' }} />
                                        <div>
                                            <Text size="xs" c="dimmed">IP Address</Text>
                                            <Text size="sm" fw={500} ff="monospace">{record.ip}</Text>
                                        </div>
                                    </Group>
                                )}
                            </SimpleGrid>
                        </div>
                    );
                })}
            </Stack>
        </Card>
    );
}

export function AttendanceCalendar({ auth, employeeId = null }: AttendanceCalendarProps) {
    const pageAuth = usePage<SharedData>().props.auth;
    const currentAuth = auth ?? pageAuth;
    const employee = currentAuth?.user?.employee ?? null;
    const today = new Date();

    const userRoles = useMemo(() => {
        const roles = currentAuth?.user?.roles ?? [];
        if (!Array.isArray(roles)) {
            return [];
        }
        return roles
            .map((role: any) => {
                if (!role) return '';
                if (typeof role === 'string') return role.toLowerCase();
                return (role.slug || role.name || '').toString().toLowerCase();
            })
            .filter(Boolean);
    }, [currentAuth?.user?.roles]);

    const canManageAttendance = useMemo(
        () => userRoles.some((r: string) => ['super-admin', 'admin', 'manager', 'hr'].includes(r)),
        [userRoles]
    );

    const isOwnRecord = useMemo(() => {
        if (!employee) return false;
        // If an employeeId was passed as prop, check if it matches our employee id
        if (employeeId) {
            return employeeId === employee?.id;
        }

        // If we're a manager/admin viewing without an explicit employeeId, it's not "our own"
        if (canManageAttendance) {
            return false;
        }

        // For regular employees, if no employeeId is specified, it's their own record
        return true;
    }, [employeeId, employee?.id, canManageAttendance]);

    const [month, setMonth] = useState(today.getMonth() + 1);
    const [year, setYear] = useState(today.getFullYear());
    const [records, setRecords] = useState<AttendanceRecord[]>([]);
    const [calendarMeta, setCalendarMeta] = useState<AttendanceCalendarMeta | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | null>(
        employeeId || (canManageAttendance ? null : employee?.id)
    );
    const [employees, setEmployees] = useState<Array<{ id: number; name: string }>>([]);
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [punchesForDate, setPunchesForDate] = useState<AttendanceRecord[]>([]);

    const fetchAttendance = useCallback(async () => {
        if (!selectedEmployeeId) {
            setRecords([]);
            setCalendarMeta(null);
            setLoading(false);
            return;
        }
        setLoading(true);
        setError(null);
        let endpoint = (canManageAttendance && !isOwnRecord) ?
            `/admin/employee-attendance/${selectedEmployeeId}` :
            isOwnRecord ? `/api/attendance/${employee?.id}` : null;

        if (!endpoint) {
            setError('You do not have permission to access this record.');
            setLoading(false);
            return;
        }

        try {
            const response = await axios.get(endpoint, {
                params: { month, year },
            });
            if (response.data.status === 'success') {
                setRecords(response.data.data || []);
                setCalendarMeta(response.data.calendar || null);
            } else {
                setError(response.data.message || 'Failed to fetch attendance data.');
            }
        } catch (err: unknown) {
            const e = err as { response?: { data?: { message?: string }; status?: number } };
            setError(
                e.response?.status === 403 ? 'You do not have permission to access this record.' :
                    e.response?.status === 404 ? 'No attendance records found.' :
                        e.response?.data?.message || 'Failed to fetch attendance data.'
            );
            setRecords([]);
            setCalendarMeta(null);
        } finally {
            setLoading(false);
        }
    }, [selectedEmployeeId, month, year]);

    useEffect(() => { fetchAttendance(); }, [fetchAttendance]);

    useEffect(() => {
        if (!canManageAttendance) return;
        axios.get('/admin/api/employees').then(res => {
            if (res.data.length > 0) setEmployees(res.data || []);
        }).catch(() => { });
        if (isOwnRecord && employee?.id) setSelectedEmployeeId(employee.id);
    }, [canManageAttendance]);
    const handleDayClick = useCallback((date: string, record: AttendanceRecord | null) => {
        setSelectedDate(date);
        setPunchesForDate(record ? [record] : []);
    }, [canManageAttendance]);


    return (
        <div className="space-y-4">
            {error && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            <Card className="border-none shadow-sm">
                <CardHeader className="pb-4">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <MonthYearPicker
                            month={month}
                            year={year}
                            onChange={(m, y) => { setMonth(m); setYear(y); setSelectedDate(null); setPunchesForDate([]); }}
                        />
                        <div className="flex flex-col gap-2">
                            {canManageAttendance ? (
                                <EmployeeSelector
                                    employees={employees}
                                    selectedEmployeeId={selectedEmployeeId}
                                    onEmployeeChange={setSelectedEmployeeId}
                                />
                            ) : null}
                            {isOwnRecord ? (
                                <PunchWidget onPunchSuccess={fetchAttendance} />
                            ) : null}
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="space-y-6">
                    {loading ? (
                        <Stack gap="sm">
                            <Skeleton height={32} radius="sm" />
                            <SimpleGrid cols={7} spacing="xs">
                                {Array.from({ length: 35 }).map((_, i) => (
                                    <Skeleton key={i} height={64} radius="sm" />
                                ))}
                            </SimpleGrid>
                        </Stack>
                    ) : (
                        <AttendanceCalendarGrid
                            records={records}
                            month={month}
                            year={year}
                            calendar={calendarMeta || undefined}
                            onDayClick={handleDayClick}
                        />
                    )}
                </CardContent>
            </Card>

            {selectedDate && (
                <DayDetailPanel date={selectedDate} records={punchesForDate} close={() => setSelectedDate(null)} />
            )}
        </div>
    );
}