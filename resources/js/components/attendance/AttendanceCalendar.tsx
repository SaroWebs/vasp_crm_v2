import { useState, useEffect, useCallback } from 'react';
import axios, { AxiosInstance } from 'axios';
import { ChevronLeft, ChevronRight, Calendar, RefreshCw, AlertCircle } from 'lucide-react';
import { AttendanceCalendarGrid } from './AttendanceCalendarGrid';
import { AttendanceSummaryCards } from './AttendanceSummaryCards';
import { Auth } from '@/types';

interface AttendanceRecord {
    id: number;
    attendance_date: string;
    punch_in: string | null;
    punch_out: string | null;
    mode: string;
    is_half_day?: boolean;
    employee_name?: string | null;
    group_name?: string;
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
    };
    month: string;
    year: string;
}

interface AttendanceCalendarProps {
    auth: Auth;
    /** Override the API base URL. Defaults to /api/attendance */
    employeeId?: number;
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
    { label: 'Half Day', className: 'bg-sky-100    border border-sky-300' },
    { label: 'Absent', className: 'bg-red-100    border border-red-300' },
    { label: 'Holiday', className: 'bg-purple-100 border border-purple-300' },
    { label: 'Weekend', className: 'bg-muted/60   border border-border' },
];

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
    axiosInstance,
    defaultMonth,
    defaultYear,
    onDayClick,
}: AttendanceCalendarProps) {
    const now = new Date();

    const [currentMonth, setCurrentMonth] = useState(defaultMonth ?? now.getMonth() + 1);
    const [currentYear, setCurrentYear] = useState(defaultYear ?? now.getFullYear());

    const [attendanceData, setAttendanceData] = useState<AttendanceRecord[]>([]);
    const [summary, setSummary] = useState<AttendanceSummary | null>(null);
    const [calendarMeta, setCalendarMeta] = useState<AttendanceApiResponse['calendar']>();

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const empId = employeeId ? employeeId : auth.user?.employee?.id ?? auth.user.id;
    const employeeName = auth.user.name;
    let url = `/my-attendance`;
    if(employeeId){
        url = `/admin/employee-attendance/${employeeId}`;
    }else{
        url = `/api/my/attendance`;
    }

    // ── Fetch ────────────────────────────────────────────────────────────────

    const fetchAttendance = useCallback(
        async (month: number, year: number) => {
            setLoading(true);
            setError(null);

            try {
                const http = axiosInstance ?? axios;

                // Resolve the bearer token from auth
                const token = auth.token ?? auth.user.token;

                const { data } = await http.get<AttendanceApiResponse>(url, {
                    params: { employee_id: empId, month, year },
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
                // Keep previous data visible on error so the UI isn't blank
            } finally {
                setLoading(false);
            }
        },
        [axiosInstance, auth, empId],
    );

    useEffect(() => {
        fetchAttendance(currentMonth, currentYear);
    }, [currentMonth, currentYear, fetchAttendance]);

    // ── Navigation ───────────────────────────────────────────────────────────

    function goToPreviousMonth() {
        setCurrentMonth((m) => {
            const newMonth = m === 1 ? 12 : m - 1;
            const newYear = m === 1 ? currentYear - 1 : currentYear;
            if (m === 1) setCurrentYear(newYear);
            return newMonth;
        });
    }

    function goToNextMonth() {
        setCurrentMonth((m) => {
            const newMonth = m === 12 ? 1 : m + 1;
            const newYear = m === 12 ? currentYear + 1 : currentYear;
            if (m === 12) setCurrentYear(newYear);
            return newMonth;
        });
    }

    const isCurrentMonth =
        currentMonth === now.getMonth() + 1 && currentYear === now.getFullYear();

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
                        {employeeName && (
                            <p className="text-xs text-muted-foreground">{employeeName}</p>
                        )}
                    </div>
                </div>

                {/* Month navigation */}
                <div className="flex items-center gap-1 self-start rounded-lg border bg-muted/40 p-1 sm:self-auto">
                    <button
                        type="button"
                        onClick={goToPreviousMonth}
                        disabled={loading}
                        className="flex h-7 w-7 items-center justify-center rounded-md transition-colors hover:bg-background hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-40"
                        aria-label="Previous month"
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </button>

                    <span className="min-w-[130px] text-center text-sm font-medium">
                        {loading ? (
                            <span className="inline-block h-4 w-24 animate-pulse rounded bg-muted/60 align-middle" />
                        ) : (
                            `${MONTH_NAMES[currentMonth - 1]} ${currentYear}`
                        )}
                    </span>

                    <button
                        type="button"
                        onClick={goToNextMonth}
                        disabled={isCurrentMonth || loading}
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
                        onClick={() => fetchAttendance(currentMonth, currentYear)}
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
                        month={currentMonth}
                        year={currentYear}
                        calendar={calendarMeta}
                        onDayClick={onDayClick}
                    />
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
        </div>
    );
}