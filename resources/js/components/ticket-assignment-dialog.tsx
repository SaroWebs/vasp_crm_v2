import TaskDurationPicker from '@/components/tasks/TaskDurationPicker';
import {
    Badge,
    Button,
    Collapse,
    Group,
    Loader,
    Modal,
    Stack,
    Textarea,
    TextInput,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import axios from 'axios';
import { Calendar, CheckCircle2, ChevronDown, ChevronUp, Clock, UserRoundPlus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Workday {
    day: string;
    start: string;
    end: string;
    break_start: string;
    break_end: string;
}

interface WorkingHoursConfig {
    workdays: Workday[];
    timezone: string;
}

interface Holiday {
    date: string;
    name: string;
    type: string;
}

interface AssignmentUser {
    id: number;
    name: string;
    email: string;
    department_name?: string | null;
    active_task_count: number;
    in_progress_task_count: number;
    pending_task_count: number;
    planned_utilization_percent: number;
    availability_status: 'available' | 'balanced' | 'overloaded' | string;
    load_status: 'free' | 'busy' | string;
}

interface TicketData {
    id: number;
    title: string;
    description?: string | null;
}

// ─── Working-hours utilities ──────────────────────────────────────────────────

function toLocalISO(date: Date): string {
    const pad = (n: number) => String(n).padStart(2, '0');
    return (
        `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
        `T${pad(date.getHours())}:${pad(date.getMinutes())}`
    );
}

function parseDateFromISO(iso: string): Date {
    return new Date(iso);
}

function localDateStr(date: Date): string {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function isHoliday(date: Date, holidays: Holiday[]): boolean {
    const ds = localDateStr(date);
    return holidays.some((h) => h.date === ds);
}

function getWorkdayConfig(date: Date, config: WorkingHoursConfig): Workday | null {
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayName = dayNames[date.getDay()];
    const wd = config.workdays.find((w) => w.day === dayName);
    if (!wd || !wd.start || !wd.end) return null;
    return wd;
}

function isWorkingDay(date: Date, config: WorkingHoursConfig, holidays: Holiday[]): boolean {
    if (isHoliday(date, holidays)) return false;
    return getWorkdayConfig(date, config) !== null;
}

function getWorkingDayEnd(date: Date, config: WorkingHoursConfig): Date {
    const wd = getWorkdayConfig(date, config);
    if (!wd) return date;
    const [h, m] = wd.end.split(':').map(Number);
    const result = new Date(date);
    result.setHours(h, m, 0, 0);
    return result;
}

function getDefaultDueAt(now: Date, config: WorkingHoursConfig, holidays: Holiday[]): Date {
    const today = new Date(now);
    today.setSeconds(0, 0);

    if (isWorkingDay(today, config, holidays)) {
        const dayEnd = getWorkingDayEnd(today, config);
        if (now < dayEnd) return dayEnd;
    }

    const candidate = new Date(today);
    candidate.setDate(candidate.getDate() + 1);
    candidate.setHours(0, 0, 0, 0);

    for (let i = 0; i < 60; i++) {
        if (isWorkingDay(candidate, config, holidays)) {
            return getWorkingDayEnd(candidate, config);
        }
        candidate.setDate(candidate.getDate() + 1);
    }

    const fallback = new Date(now);
    fallback.setDate(fallback.getDate() + 1);
    return fallback;
}

function calcWorkingHours(
    start: Date,
    end: Date,
    config: WorkingHoursConfig,
    holidays: Holiday[],
): number {
    if (start >= end) return 0;

    let totalMs = 0;
    const cursor = new Date(start);
    cursor.setSeconds(0, 0);

    while (cursor < end) {
        const dayMidnight = new Date(cursor);
        dayMidnight.setHours(0, 0, 0, 0);

        if (!isWorkingDay(dayMidnight, config, holidays)) {
            cursor.setDate(cursor.getDate() + 1);
            cursor.setHours(0, 0, 0, 0);
            continue;
        }

        const wd = getWorkdayConfig(dayMidnight, config)!;
        const [startH, startM] = wd.start.split(':').map(Number);
        const [endH, endM] = wd.end.split(':').map(Number);

        const dayWorkStart = new Date(dayMidnight);
        dayWorkStart.setHours(startH, startM, 0, 0);
        const dayWorkEnd = new Date(dayMidnight);
        dayWorkEnd.setHours(endH, endM, 0, 0);

        const effectiveStart = cursor > dayWorkStart ? cursor : dayWorkStart;
        const effectiveEnd = end < dayWorkEnd ? end : dayWorkEnd;

        if (effectiveStart < effectiveEnd) {
            let workMs = effectiveEnd.getTime() - effectiveStart.getTime();

            if (wd.break_start && wd.break_end) {
                const [bSH, bSM] = wd.break_start.split(':').map(Number);
                const [bEH, bEM] = wd.break_end.split(':').map(Number);
                const breakStart = new Date(dayMidnight);
                breakStart.setHours(bSH, bSM, 0, 0);
                const breakEnd = new Date(dayMidnight);
                breakEnd.setHours(bEH, bEM, 0, 0);

                const overlapStart = effectiveStart > breakStart ? effectiveStart : breakStart;
                const overlapEnd = effectiveEnd < breakEnd ? effectiveEnd : breakEnd;
                if (overlapStart < overlapEnd) {
                    workMs -= overlapEnd.getTime() - overlapStart.getTime();
                }
            }

            totalMs += workMs;
        }

        cursor.setDate(cursor.getDate() + 1);
        cursor.setHours(0, 0, 0, 0);
    }

    return Math.round((totalMs / 3_600_000) * 100) / 100;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDateShort(iso: string): string {
    const d = parseDateFromISO(iso);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) +
        ', ' +
        d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false });
}

function getInitials(name: string): string {
    return name
        .split(' ')
        .slice(0, 2)
        .map((w) => w[0])
        .join('')
        .toUpperCase();
}

// ─── Avatar colours (deterministic by name) ──────────────────────────────────

const AVATAR_PALETTES = [
    { bg: 'bg-blue-100', text: 'text-blue-800' },
    { bg: 'bg-violet-100', text: 'text-violet-800' },
    { bg: 'bg-teal-100', text: 'text-teal-800' },
    { bg: 'bg-amber-100', text: 'text-amber-800' },
    { bg: 'bg-rose-100', text: 'text-rose-800' },
];

function avatarPalette(name: string) {
    const idx = name.charCodeAt(0) % AVATAR_PALETTES.length;
    return AVATAR_PALETTES[idx];
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function UserAvatar({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' }) {
    const { bg, text } = avatarPalette(name);
    const sizeClass = size === 'sm' ? 'w-7 h-7 text-[10px]' : 'w-8 h-8 text-xs';
    return (
        <div className={`${sizeClass} ${bg} ${text} rounded-full flex items-center justify-center font-medium flex-shrink-0`}>
            {getInitials(name)}
        </div>
    );
}

function LoadBadge({ user }: { user: AssignmentUser }) {
    if (user.load_status === 'busy') {
        return (
            <Badge color="red" variant="light" size="xs">
                {user.in_progress_task_count} running
            </Badge>
        );
    }
    return (
        <Badge color="green" variant="light" size="xs">
            Free
        </Badge>
    );
}

// ─── Schedule accordion ───────────────────────────────────────────────────────

interface ScheduleAccordionProps {
    startAt: string;
    dueAt: string;
    estimateHours: string;
    onStartChange: (v: string) => void;
    onDueChange: (v: string) => void;
    onEstimateChange: (v: string) => void;
}

function ScheduleAccordion({
    startAt,
    dueAt,
    estimateHours,
    onStartChange,
    onDueChange,
    onEstimateChange,
}: ScheduleAccordionProps) {
    const [open, setOpen] = useState(false);

    return (
        <div className="rounded-lg border border-gray-200 overflow-hidden">
            {/* Toggle header */}
            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
            >
                <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium text-gray-700">Schedule & duration</span>
                    {/* Summary pills when collapsed */}
                    {!open && (
                        <div className="flex flex-wrap gap-1.5 mt-1">
                            {startAt && (
                                <span className="inline-flex items-center gap-1 text-[11px] text-gray-500 bg-white border border-gray-200 rounded-full px-2 py-0.5">
                                    <Calendar className="w-2.5 h-2.5" />
                                    {formatDateShort(startAt)}
                                </span>
                            )}
                            {dueAt && (
                                <span className="inline-flex items-center gap-1 text-[11px] text-gray-500 bg-white border border-gray-200 rounded-full px-2 py-0.5">
                                    → {formatDateShort(dueAt)}
                                </span>
                            )}
                            {estimateHours && (
                                <span className="inline-flex items-center gap-1 text-[11px] text-gray-500 bg-white border border-gray-200 rounded-full px-2 py-0.5">
                                    <Clock className="w-2.5 h-2.5" />
                                    {estimateHours} hrs
                                </span>
                            )}
                        </div>
                    )}
                </div>
                {open
                    ? <ChevronUp className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    : <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
                }
            </button>

            {/* Collapsible body */}
            <Collapse in={open}>
                <div className="px-3 py-3 border-t border-gray-200 bg-white flex flex-col gap-3">
                    <div className="grid grid-cols-2 gap-3">
                        <TextInput
                            label="Start at"
                            type="datetime-local"
                            value={startAt}
                            onChange={(e) => onStartChange(e.target.value)}
                            size="xs"
                        />
                        <TextInput
                            label="Due at"
                            type="datetime-local"
                            value={dueAt}
                            min={startAt}
                            onChange={(e) => onDueChange(e.target.value)}
                            size="xs"
                        />
                    </div>
                    <TaskDurationPicker
                        id="assign-duration"
                        label="Estimated duration (working hours)"
                        value={estimateHours}
                        onChange={onEstimateChange}
                        helperText="Auto-calculated from working hours. You can adjust."
                    />
                </div>
            </Collapse>
        </div>
    );
}

// ─── Trigger button ───────────────────────────────────────────────────────────

interface TicketAssignmentDialogProps {
    ticketId: number;
    type?: 'button' | 'link' | 'icon';
    onSuccess?: () => void;
}

export default function TicketAssignmentDialog({
    ticketId,
    type = 'link',
    onSuccess,
}: TicketAssignmentDialogProps) {
    const [opened, { open, close }] = useDisclosure(false);
    const [loading, setLoading] = useState(false);
    const [ticket, setTicket] = useState<TicketData | null>(null);
    const [workingHours, setWorkingHours] = useState<WorkingHoursConfig | null>(null);
    const [holidays, setHolidays] = useState<Holiday[]>([]);
    const [employees, setEmployees] = useState<AssignmentUser[]>([]);

    const loadData = async () => {
        setLoading(true);
        try {
            const [ticketRes, usersRes] = await Promise.all([
                axios.get(`/admin/data/tickets/${ticketId}`),
                axios.get('/admin/data/users/assignment'),
            ]);
            setTicket(ticketRes.data.ticket);
            setWorkingHours(ticketRes.data.working_hours);
            setHolidays(ticketRes.data.holidays ?? []);
            if (usersRes.data.users?.length > 0) {
                setEmployees(usersRes.data.users);
            }
        } catch {
            toast.error('Failed to load assignment data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (opened) loadData();
    }, [opened]);

    const handleClose = () => {
        close();
        setTicket(null);
        setEmployees([]);
        setWorkingHours(null);
        setHolidays([]);
    };

    return (
        <>
            {type === 'button' && (
                <Button variant="outline" onClick={open} disabled={loading} size="xs">
                    {loading ? <Loader size="xs" /> : 'Assign Ticket'}
                </Button>
            )}
            {type === 'link' && (
                <span
                    className="flex cursor-pointer items-center gap-2 rounded px-2 py-1 text-sm font-medium my-1 hover:bg-gray-100"
                    onClick={() => !loading && open()}
                >
                    <UserRoundPlus className="h-3 w-3 text-gray-500" />
                    Assign Ticket
                </span>
            )}
            {type === 'icon' && (
                <button
                    onClick={open}
                    disabled={loading}
                    className="p-1.5 rounded hover:bg-gray-100 transition-colors disabled:opacity-50"
                    aria-label="Assign ticket"
                >
                    <UserRoundPlus className="h-4 w-4 text-gray-500" />
                </button>
            )}

            <Modal
                opened={opened}
                onClose={handleClose}
                title="Assign Ticket"
                size="900px"
                centered
                styles={{
                    body: { padding: 0 },
                    header: { paddingInline: '1.25rem', paddingTop: '1rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--mantine-color-gray-2)' },
                }}
            >
                {loading ? (
                    <div className="flex items-center justify-center py-16">
                        <Loader />
                    </div>
                ) : ticket && workingHours ? (
                    <AssignmentForm
                        ticket={ticket}
                        employees={employees}
                        workingHours={workingHours}
                        holidays={holidays}
                        onClose={handleClose}
                        onSuccess={onSuccess}
                    />
                ) : null}
            </Modal>
        </>
    );
}

// ─── Assignment form (V4 sidebar layout) ─────────────────────────────────────

interface AssignmentFormProps {
    ticket: TicketData;
    employees: AssignmentUser[];
    workingHours: WorkingHoursConfig;
    holidays: Holiday[];
    onClose: () => void;
    onSuccess?: () => void;
}

function AssignmentForm({
    ticket,
    employees,
    workingHours,
    holidays,
    onClose,
    onSuccess,
}: AssignmentFormProps) {
    const now = new Date();
    const defaultDueAt = getDefaultDueAt(now, workingHours, holidays);
    const defaultDuration = String(calcWorkingHours(now, defaultDueAt, workingHours, holidays));

    const [assignedTo, setAssignedTo] = useState<number | null>(null);
    const [taskTitle, setTaskTitle] = useState(ticket.title ?? '');
    const [taskDescription, setTaskDescription] = useState(ticket.description ?? '');
    const [startAt, setStartAt] = useState(toLocalISO(now));
    const [dueAt, setDueAt] = useState(toLocalISO(defaultDueAt));
    const [estimateHours, setEstimateHours] = useState(defaultDuration);
    const [assignmentNotes, setAssignmentNotes] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const selectedUser = assignedTo !== null
        ? (employees.find((u) => u.id === assignedTo) ?? null)
        : null;

    // ── Schedule handlers ────────────────────────────────────────────────────

    const recomputeDuration = (newStart: string, newDue: string) => {
        const s = parseDateFromISO(newStart);
        const d = parseDateFromISO(newDue);
        if (!isNaN(s.getTime()) && !isNaN(d.getTime()) && d > s) {
            const hrs = calcWorkingHours(s, d, workingHours, holidays);
            setEstimateHours(hrs > 0 ? String(hrs) : '');
        } else {
            setEstimateHours('');
        }
    };

    const handleStartChange = (value: string) => {
        setStartAt(value);
        const newStart = parseDateFromISO(value);
        const currentDue = parseDateFromISO(dueAt);
        if (!isNaN(newStart.getTime()) && currentDue <= newStart) {
            const newDue = getDefaultDueAt(newStart, workingHours, holidays);
            const newDueISO = toLocalISO(newDue);
            setDueAt(newDueISO);
            recomputeDuration(value, newDueISO);
        } else {
            recomputeDuration(value, dueAt);
        }
    };

    const handleDueChange = (value: string) => {
        setDueAt(value);
        recomputeDuration(startAt, value);
    };

    // ── Submit ───────────────────────────────────────────────────────────────

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!assignedTo) {
            toast.error('Please select an employee to assign');
            return;
        }
        if (!taskTitle.trim()) {
            toast.error('Task title is required');
            return;
        }

        setIsSubmitting(true);
        axios
            .post(`/admin/ticket/${ticket.id}/assign`, {
                assignedTo,
                task: {
                    title: taskTitle.trim(),
                    description: taskDescription,
                    start_at: startAt || undefined,
                    due_at: dueAt || undefined,
                    estimate_hours: estimateHours ? Number(estimateHours) : undefined,
                    assignment_notes: assignmentNotes || undefined,
                },
            })
            .then(() => {
                toast.success('Ticket assigned and task created successfully');
                onClose();
                if (onSuccess) {
                    onSuccess();
                } else {
                    window.location.reload();
                }
            })
            .catch((err) => {
                toast.error(
                    'Failed to assign ticket: ' +
                    (err.response?.data?.message ?? err.message),
                );
            })
            .finally(() => {
                setIsSubmitting(false);
            });
    };

    // ── Render ───────────────────────────────────────────────────────────────

    return (
        <form onSubmit={handleSubmit} className="flex min-h-0">

            {/* ── Sidebar ── */}
            <div className="w-56 flex-shrink-0 border-r border-gray-200 bg-gray-50 flex flex-col">

                {/* Ticket context */}
                <div className="px-4 pt-4 pb-3 border-b border-gray-200">
                    <p className="text-[10px] font-medium uppercase tracking-wide text-gray-400 mb-1.5">Ticket</p>
                    <div className="bg-white border border-gray-200 rounded-lg px-3 py-2">
                        <p className="text-[10px] text-gray-400 mb-0.5">#TKT-{ticket.id}</p>
                        <p className="text-xs font-medium text-gray-800 leading-snug line-clamp-3">
                            {ticket.title}
                        </p>
                    </div>
                </div>

                {/* Employee list */}
                <div className="flex-1 px-3 py-3">
                    <p className="text-[10px] font-medium uppercase tracking-wide text-gray-400 mb-2">
                        Pick assignee
                    </p>
                    {employees.length === 0 ? (
                        <p className="text-xs text-gray-400 px-1">No employees available.</p>
                    ) : (
                        <div className="flex flex-col gap-1.5 max-h-[350px] overflow-y-auto ">
                            {employees.map((user) => {
                                const isSelected = assignedTo === user.id;
                                return (
                                    <button
                                        key={user.id}
                                        type="button"
                                        onClick={() => setAssignedTo(isSelected ? null : user.id)}
                                        className={[
                                            'w-full flex items-center gap-2 px-2 py-2 rounded-lg border text-left transition-colors',
                                            isSelected
                                                ? 'border-blue-400 bg-blue-50'
                                                : 'border-gray-200 bg-white hover:bg-gray-50',
                                        ].join(' ')}
                                    >
                                        <UserAvatar name={user.name} size="sm" />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-medium text-gray-800 truncate">{user.name}</p>
                                            <p className="text-[10px] text-gray-400 truncate">
                                                {user.department_name ?? user.email}
                                            </p>
                                        </div>
                                        {isSelected && (
                                            <CheckCircle2 className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                                        )}
                                        {!isSelected && (
                                            <LoadBadge user={user} />
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* ── Main form area ── */}
            <div className="flex-1 flex flex-col min-w-0">

                {/* Selected user card — only shown when someone is picked */}
                {selectedUser && (
                    <div className="px-5 pt-4">
                        <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5">
                            <UserAvatar name={selectedUser.name} />
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-800">{selectedUser.name}</p>
                                <p className="text-xs text-gray-400">
                                    {selectedUser.department_name ?? selectedUser.email}
                                </p>
                            </div>
                            <LoadBadge user={selectedUser} />
                            <div className="flex gap-3 ml-2">
                                {[
                                    { label: 'Active', value: selectedUser.active_task_count },
                                    { label: 'Working', value: selectedUser.in_progress_task_count },
                                    { label: 'Pending', value: selectedUser.pending_task_count },
                                ].map(({ label, value }) => (
                                    <div key={label} className="text-center">
                                        <p className="text-[10px] text-gray-400">{label}</p>
                                        <p className="text-sm font-semibold text-gray-700">{value}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Fields */}
                <div className="flex-1 overflow-y-auto px-5 py-4">
                    <Stack gap="sm">

                        {!selectedUser && (
                            <div className="flex items-center gap-2 text-xs text-gray-400 border border-dashed border-gray-200 rounded-lg px-3 py-3">
                                <UserRoundPlus className="w-4 h-4 flex-shrink-0" />
                                Select an employee from the sidebar to assign this ticket.
                            </div>
                        )}

                        <TextInput
                            label="Task title"
                            placeholder="Enter task title"
                            value={taskTitle}
                            onChange={(e) => setTaskTitle(e.target.value)}
                            required
                            size="sm"
                        />

                        <Textarea
                            label="Task description"
                            placeholder="Enter task description"
                            value={taskDescription}
                            onChange={(e) => setTaskDescription(e.target.value)}
                            autosize
                            minRows={2}
                            maxRows={4}
                            size="sm"
                        />

                        {/* Schedule accordion */}
                        <ScheduleAccordion
                            startAt={startAt}
                            dueAt={dueAt}
                            estimateHours={estimateHours}
                            onStartChange={handleStartChange}
                            onDueChange={handleDueChange}
                            onEstimateChange={setEstimateHours}
                        />

                        <Textarea
                            label="Assignment notes"
                            placeholder="Optional notes for the assignee"
                            value={assignmentNotes}
                            onChange={(e) => setAssignmentNotes(e.target.value)}
                            autosize
                            minRows={2}
                            maxRows={3}
                            size="sm"
                        />

                    </Stack>
                </div>

                {/* Footer actions */}
                <div className="px-5 py-3 border-t border-gray-200 bg-gray-50">
                    <Group justify="flex-end" gap="sm">
                        <Button variant="default" onClick={onClose} disabled={isSubmitting} size="sm">
                            Cancel
                        </Button>
                        <Button type="submit" loading={isSubmitting} size="sm" disabled={!assignedTo}>
                            Assign Ticket
                        </Button>
                    </Group>
                </div>

            </div>
        </form>
    );
}