import { useState, useEffect, useCallback } from 'react';
import axios, { AxiosInstance } from 'axios';
import { ChevronLeft, ChevronRight, Calendar, RefreshCw, AlertCircle } from 'lucide-react';
import { AttendanceCalendarGrid, type AttendanceCalendarDay } from './AttendanceCalendarGrid';
import { OpMonthSelector, type OpMonth } from './OpMonthSelector';
import { AttendanceSummaryCards } from './AttendanceSummaryCards';
import { Auth } from '@/types';
import { Button } from '@/components/ui/button';
import { AttendanceOverrideModal } from './AttendanceOverrideModal';

interface AttendanceRecord {
    id: number;
    attendance_date: string;
    punch_in: string | null;
    punch_out: string | null;
    mode: string;
    is_half_day?: boolean;
    employee_name?: string | null;
    group_name?: string;
    shift_id?: number | null;
    shift_start?: string | null;
    shift_end?: string | null;
    shift_grace_minutes?: number | null;
    shift_source?: 'assigned_shift' | 'general_hours' | 'none';
    status?: string;
    late_minutes?: number;
    early_out_minutes?: number;
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

interface AttendanceSummary {
    total_days?: number;
    total_working_days?: number;
    present_days: number;
    absent_days: number;
    late_days: number;
    early_out_days?: number;
    total_late_minutes?: number;
    total_early_out_minutes?: number;
    total_hours: number;
}

interface AttendanceApiResponse {
    status: string;
    message?: string;
    data: AttendanceRecord[];
    summary: AttendanceSummary;
    calendar?: {
        holidays: Array<{ date: string; name: string; type?: string }>;
        working_hours: WorkingHoursConfig;
        days?: AttendanceCalendarDay[];
    };
    month: string;
    year: string;
}

interface AttendanceCalendarProps {
    auth?: Auth | null;
    /** Override the API base URL. Defaults to /api/attendance */
    employeeId?: number;
    employeeName?: string;
    axiosInstance?: AxiosInstance;
    /** Initial month (1–12). Defaults to current month. */
    defaultMonth?: number;
    /** Initial year. Defaults to current year. */
    defaultYear?: number;
    onDayClick?: (date: string) => void;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
];

const LEGEND_ITEMS = [
    { label: 'Present', className: 'bg-emerald-100 border border-emerald-300' },
    { label: 'Late', className: 'bg-amber-100  border border-amber-300' },
    { label: 'Early Out', className: 'bg-orange-100 border border-orange-300' },
    { label: 'Incomplete', className: 'bg-blue-100 border border-blue-300' },
    { label: 'Half Day', className: 'bg-sky-100    border border-sky-300' },
    { label: 'Leave', className: 'bg-violet-100 border border-violet-300' },
    { label: 'Absent', className: 'bg-red-100    border border-red-300' },
    { label: 'Holiday', className: 'bg-purple-100 border border-purple-300' },
    { label: 'Weekend', className: 'bg-muted/60   border border-border' },
    { label: 'Pending', className: 'bg-slate-100 border border-slate-300' },
    { label: 'Upcoming', className: 'bg-background border border-dashed border-border' },
];

function formatDateLabel(date: string): string {
    return new Date(`${date}T00:00:00`).toLocaleDateString('en-IN', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });
}

function formatTimeLabel(
    time: string | null | undefined,
    timezone: string,
): string {
    if (!time) {
        return '--:--';
    }

    const timeOnly = time.match(/^(\d{1,2}):(\d{2})/);
    if (timeOnly) {
        return `${timeOnly[1].padStart(2, '0')}:${timeOnly[2]}`;
    }

    const parsed = new Date(time);
    if (Number.isNaN(parsed.getTime())) {
        return time;
    }

    return new Intl.DateTimeFormat('en-IN', {
        timeZone: timezone,
        hour: '2-digit',
        minute: '2-digit',
        hourCycle: 'h23',
    }).format(parsed);
}

function getStatusLabel(status: string | undefined): string {
    switch (status) {
        case 'present':
            return 'Present';
        case 'late':
            return 'Late';
        case 'early_out':
            return 'Early Out';
        case 'incomplete':
            return 'Incomplete';
        case 'half_day':
            return 'Half Day';
        case 'leave':
            return 'Leave';
        case 'holiday':
            return 'Holiday';
        case 'field_work':
            return 'Field Work';
        case 'remote_work':
            return 'Remote Work';
        case 'weekend':
            return 'Weekend';
        case 'absent':
            return 'Absent';
        case 'pending':
            return 'Pending';
        case 'upcoming':
            return 'Upcoming';
        default:
            return 'No Data';
    }
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function SummarySkeleton() {
    return (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {Array.from({ length: 5 }).map((_, i) => (
                <div
                    key={i}
                    className="h-[72px] animate-pulse rounded-xl border border-l-4 border-l-muted bg-muted/30"
                />
            ))}
        </div>
    );
}

function CalendarSkeleton() {
    return (
        <div className="rounded-xl border bg-background/60 p-3 sm:p-4">
            {/* Weekday headers */}
            <div className="mb-2 grid grid-cols-7 gap-1">
                {Array.from({ length: 7 }).map((_, i) => (
                    <div key={i} className="mx-auto h-5 w-8 animate-pulse rounded bg-muted/50" />
                ))}
            </div>
            {/* Day cells */}
            <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: 35 }).map((_, i) => (
                    <div
                        key={i}
                        className="aspect-square animate-pulse rounded-lg bg-muted/30"
                        style={{ animationDelay: `${(i % 7) * 40}ms` }}
                    />
                ))}
            </div>
        </div>
    );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function AttendanceCalendar({
    auth,
    employeeId = 0,
    employeeName,
    axiosInstance,
    defaultMonth,
    defaultYear,
    onDayClick,
}: AttendanceCalendarProps) {
    const now = new Date();

    const [currentMonth, setCurrentMonth] = useState(defaultMonth ?? now.getMonth() + 1);
    const [currentYear, setCurrentYear] = useState(defaultYear ?? now.getFullYear());

    const [opMonths, setOpMonths] = useState<OpMonth[]>([]);
    const [selectedOpMonth, setSelectedOpMonth] = useState<OpMonth | null>(null);
    const [opMonthsLoading, setOpMonthsLoading] = useState(true);

    const [attendanceData, setAttendanceData] = useState<AttendanceRecord[]>([]);
    const [summary, setSummary] = useState<AttendanceSummary | null>(null);
    const [calendarMeta, setCalendarMeta] = useState<AttendanceApiResponse['calendar']>();
    const [selectedDay, setSelectedDay] = useState<AttendanceCalendarDay | null>(null);
    const [overrideModalOpen, setOverrideModalOpen] = useState(false);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const empId = employeeId ? employeeId : auth?.user?.employee?.id ?? auth?.user?.id;
    const empName = employeeName || auth?.user?.name || 'Employee';
    const url = employeeId
        ? `/admin/employee-attendance/${employeeId}`
        : `/api/my/attendance`;

    // ── Fetch derived op months on mount ──
    useEffect(() => {
        const fetchOpMonths = async () => {
            setOpMonthsLoading(true);
            try {
                const http = axiosInstance ?? axios;
                const token = auth?.token ?? auth?.user?.token;
                const { data } = await http.get('/admin/api/attendance/op-months', {
                    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
                });
                if (data.status === 'success' && data.data?.length) {
                    setOpMonths(data.data);
                    
                    let defaultMatch = null;
                    if (defaultMonth && defaultYear) {
                        const targetMonthStr = `-${String(defaultMonth).padStart(2, '0')}-`;
                        defaultMatch = data.data.find((om: OpMonth) => om.start_date.includes(targetMonthStr) || om.end_date.includes(targetMonthStr));
                    }
                    setSelectedOpMonth(defaultMatch ?? data.data[0]);
                }
            } catch (err) {
                console.error('Failed to fetch op months', err);
            } finally {
                setOpMonthsLoading(false);
            }
        };
        fetchOpMonths();
    }, [axiosInstance, auth, defaultMonth, defaultYear]);

    // ── Fetch Attendance ──
    const fetchAttendance = useCallback(
        async (startDate: string, endDate: string) => {
            setLoading(true);
            setError(null);

            try {
                const http = axiosInstance ?? axios;
                const token = auth?.token ?? auth?.user?.token;

                const { data } = await http.get<AttendanceApiResponse>(url, {
                    params: {
                        employee_id: empId,
                        start_date: startDate,
                        end_date: endDate,
                    },
                    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
                });

                if (data.status !== 'success') {
                    throw new Error(data.message ?? 'Failed to fetch attendance.');
                }

                setAttendanceData(data.data ?? []);
                setSummary(data.summary);
                setCalendarMeta(data.calendar);
            } catch (err: unknown) {
                if (axios.isAxiosError(err)) {
                    setError(
                        err.response?.data?.message
                        ?? err.message
                        ?? 'Network error. Please try again.',
                    );
                } else {
                    setError('An unexpected error occurred.');
                }
            } finally {
                setLoading(false);
            }
        },
        [axiosInstance, auth, empId, url],
    );

    useEffect(() => {
        if (selectedOpMonth) {
            fetchAttendance(selectedOpMonth.start_date, selectedOpMonth.end_date);
        }
    }, [selectedOpMonth, fetchAttendance]);

    useEffect(() => {
        if (!calendarMeta?.days?.length) {
            setSelectedDay(null);
            return;
        }

        const today = new Date();
        const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
        const match =
            calendarMeta.days.find((day) => day.date === todayKey)
            ?? calendarMeta.days.find((day) => day.record)
            ?? calendarMeta.days[0]
            ?? null;

        setSelectedDay(match);
    }, [calendarMeta]);

    // ── Navigation ──
    const selectedIndex = selectedOpMonth
        ? opMonths.findIndex(om => om.start_date === selectedOpMonth.start_date)
        : -1;

    function goToPreviousMonth() {
        if (selectedIndex !== -1 && selectedIndex < opMonths.length - 1) {
            setSelectedOpMonth(opMonths[selectedIndex + 1]);
        }
    }

    function goToNextMonth() {
        if (selectedIndex > 0) {
            setSelectedOpMonth(opMonths[selectedIndex - 1]);
        }
    }

    const handleDayClick = useCallback((day: AttendanceCalendarDay) => {
        setSelectedDay(day);
        onDayClick?.(day.date);
    }, [onDayClick]);

    const isCurrentMonth = selectedIndex === 0;
    const timezone = calendarMeta?.working_hours.timezone ?? 'Asia/Calcutta';

    // ── Render ───────────────────────────────────────────────────────────────

    return (
        <div className="flex flex-col gap-5 rounded-2xl border bg-card p-4 shadow-sm sm:p-6">

            {/* ── Header ── */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                        <Calendar className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                        <h2 className="text-base font-semibold leading-tight">
                            Attendance Calendar
                        </h2>
                        {empName && (
                            <p className="text-xs text-muted-foreground">{empName}</p>
                        )}
                    </div>
                </div>

                {/* Month navigation */}
                <div className="flex items-center gap-1 self-start rounded-lg border bg-muted/40 p-1 sm:self-auto">
                    <button
                        type="button"
                        onClick={goToPreviousMonth}
                        disabled={loading || opMonthsLoading || selectedIndex === -1 || selectedIndex === opMonths.length - 1}
                        className="flex h-7 w-7 items-center justify-center rounded-md transition-colors hover:bg-background hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-40"
                        aria-label="Previous month"
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </button>

                    <OpMonthSelector
                        opMonths={opMonths}
                        selected={selectedOpMonth}
                        onChange={setSelectedOpMonth}
                        loading={loading || opMonthsLoading}
                    />

                    <button
                        type="button"
                        onClick={goToNextMonth}
                        disabled={loading || opMonthsLoading || selectedIndex <= 0}
                        className="flex h-7 w-7 items-center justify-center rounded-md transition-colors hover:bg-background hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-40"
                        aria-label="Next month"
                    >
                        <ChevronRight className="h-4 w-4" />
                    </button>
                </div>
            </div>

            {/* ── Error banner ── */}
            {error && (
                <div className="flex items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 dark:border-red-900 dark:bg-red-950/30">
                    <div className="flex items-center gap-2 text-sm text-red-700 dark:text-red-400">
                        <AlertCircle className="h-4 w-4 shrink-0" />
                        <span>{error}</span>
                    </div>
                    <button
                        type="button"
                        onClick={() => {
                            if (selectedOpMonth) {
                                void fetchAttendance(selectedOpMonth.start_date, selectedOpMonth.end_date);
                            }
                        }}
                        className="flex shrink-0 items-center gap-1.5 rounded-md border border-red-300 bg-white px-3 py-1 text-xs font-medium text-red-700 transition-colors hover:bg-red-50 dark:border-red-800 dark:bg-transparent dark:text-red-400 dark:hover:bg-red-950/50"
                    >
                        <RefreshCw className="h-3 w-3" />
                        Retry
                    </button>
                </div>
            )}

            {/* ── Summary cards ── */}
            {loading || !summary ? (
                <SummarySkeleton />
            ) : (
                <AttendanceSummaryCards summary={summary} />
            )}

            {/* ── Calendar grid ── */}
            {loading ? (
                <CalendarSkeleton />
            ) : (
                <div className="rounded-xl border bg-background/60 p-3 sm:p-4">
                    <AttendanceCalendarGrid
                        records={attendanceData}
                        month={selectedOpMonth ? new Date(selectedOpMonth.start_date + 'T00:00:00').getMonth() + 1 : currentMonth}
                        year={selectedOpMonth ? new Date(selectedOpMonth.start_date + 'T00:00:00').getFullYear() : currentYear}
                        calendar={calendarMeta}
                        onDayClick={handleDayClick}
                    />
                </div>
            )}

            {/* ── Selected day details ── */}
            {selectedDay && (
                <div className="rounded-xl border bg-background/80 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                            <p className="text-sm font-semibold">{formatDateLabel(selectedDay.date)}</p>
                            <p className="text-xs text-muted-foreground">
                                {getStatusLabel(selectedDay.status)}{selectedDay.shift_source === 'assigned_shift' ? ' - assigned shift' : selectedDay.shift_source === 'general_hours' ? ' - general hours' : ''}
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="rounded-full border bg-muted/60 px-2 py-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                                {selectedDay.shift_grace_minutes != null ? `${selectedDay.shift_grace_minutes} min grace` : 'No grace'}
                            </div>
                            {employeeId > 0 && (
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setOverrideModalOpen(true)}
                                    className="h-7 px-3 text-xs"
                                >
                                    Override
                                </Button>
                            )}
                        </div>
                    </div>

                    <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        <div className="rounded-lg border p-3">
                            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Schedule</p>
                            <p className="mt-1 text-sm font-medium">
                                {selectedDay.shift_start && selectedDay.shift_end
                                    ? `${formatTimeLabel(selectedDay.shift_start, timezone)} - ${formatTimeLabel(selectedDay.shift_end, timezone)}`
                                    : 'No fixed schedule'}
                            </p>
                        </div>
                        <div className="rounded-lg border p-3">
                            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Punch</p>
                            <p className="mt-1 text-sm font-medium">
                                {selectedDay.record?.punch_in || selectedDay.record?.punch_out
                                    ? `${formatTimeLabel(selectedDay.record?.punch_in, timezone)} - ${formatTimeLabel(selectedDay.record?.punch_out, timezone)}`
                                    : 'No punch recorded'}
                            </p>
                        </div>
                        <div className="rounded-lg border p-3">
                            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Mode</p>
                            <p className="mt-1 text-sm font-medium capitalize">
                                {selectedDay.record?.mode ?? 'N/A'}
                            </p>
                        </div>
                        <div className="rounded-lg border p-3">
                            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Notes</p>
                            <p className="mt-1 text-sm font-medium">
                                {selectedDay.holiday?.name
                                    ?? (selectedDay.status === 'leave' ? 'Approved leave' : selectedDay.status === 'weekend' ? 'Weekly off' : 'Attendance day')}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Legend ── */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                {LEGEND_ITEMS.map((item) => (
                    <div key={item.label} className="flex items-center gap-1.5">
                        <span className={`h-3 w-3 rounded-sm ${item.className}`} />
                        <span className="text-xs text-muted-foreground">{item.label}</span>
                    </div>
                ))}
            </div>

            {employeeId > 0 && (
                <AttendanceOverrideModal
                    open={overrideModalOpen}
                    onOpenChange={setOverrideModalOpen}
                    employeeId={empId}
                    employeeName={empName}
                    selectedDate={selectedDay?.date}
                    existingRecord={selectedDay?.record ? {
                        attendance_date: selectedDay.date,
                        punch_in: selectedDay.record.punch_in,
                        punch_out: selectedDay.record.punch_out,
                        mode: selectedDay.record.mode,
                        status: selectedDay.record.status,
                    } : null}
                    onSuccess={() => {
                        if (selectedOpMonth) {
                            void fetchAttendance(selectedOpMonth.start_date, selectedOpMonth.end_date);
                        }
                    }}
                />
            )}
        </div>
    );
}
