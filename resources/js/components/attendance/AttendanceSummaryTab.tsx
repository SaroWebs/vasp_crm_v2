import { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { OpMonthSelector, type OpMonth } from './OpMonthSelector';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Loader2, Download, Eye, Users, TrendingUp, Clock, Timer, AlertCircle, CalendarCheck2, Palmtree, Umbrella, ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';
import { Link } from '@inertiajs/react';

// ── Types ─────────────────────────────────────────────────────────────────────

interface EmployeeSummary {
    id: number;
    name: string;
    code: string;
    department?: string;
    summary: {
        total_days: number;
        total_working_days: number;
        present_days: number;
        absent_days: number;
        paid_leave_days?: number;
        unpaid_leave_days?: number;
        leave_days?: number;
        holiday_days?: number;
        remote_days?: number;
        field_days?: number;
        late_days: number;
        early_out_days: number;
        total_late_minutes: number;
        total_early_in_minutes: number;
        total_early_out_minutes: number;
        total_late_out_minutes: number;
        total_overtime_minutes: number;
        total_hours: number;
    };
}

interface DayRecord {
    day: number;
    date: string;
    status: string;
    is_today: boolean;
    record: {
        punch_in?: string | null;
        punch_out?: string | null;
        late_minutes?: number;
        early_in_minutes?: number;
        early_out_minutes?: number;
        late_out_minutes?: number;
        overtime_minutes?: number;
        total_work_minutes?: number | null;
        is_late?: boolean;
        is_early_in?: boolean;
        is_early_out?: boolean;
        is_late_out?: boolean;
    } | null;
    holiday: { name: string; type?: string } | null;
    shift_start?: string | null;
    shift_end?: string | null;
    is_holiday?: boolean;
    is_leave_day?: boolean;
}

// ── Status helpers ────────────────────────────────────────────────────────────

const STATUS_META: Record<string, { label: string; badge: string }> = {
    present: { label: 'Present', badge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300' },
    late: { label: 'Late', badge: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' },
    early_out: { label: 'Early Out', badge: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300' },
    half_day: { label: 'Half Day', badge: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' },
    absent: { label: 'Absent', badge: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' },
    leave: { label: 'Leave', badge: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300' },
    holiday: { label: 'Holiday', badge: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300' },
    weekend: { label: 'Weekend', badge: 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400' },
    upcoming: { label: 'Upcoming', badge: 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500' },
    pending: { label: 'Pending', badge: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300' },
    incomplete: { label: 'Incomplete', badge: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300' },
    remote_work: { label: 'Remote', badge: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300' },
    field_work: { label: 'Field', badge: 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300' },
};

function StatusBadge({ status }: { status: string }) {
    const meta = STATUS_META[status] ?? { label: status, badge: 'bg-slate-100 text-slate-600' };
    return (
        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${meta.badge}`}>
            {meta.label}
        </span>
    );
}

function fmtTime(t: string | null | undefined): string {
    if (!t) return '—';
    try {
        const normalized = /^\d{2}:\d{2}(:\d{2})?$/.test(t) ? `1970-01-01T${t}` : t;
        const d = new Date(normalized);
        if (isNaN(d.getTime())) return t;
        return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
    } catch {
        return t;
    }
}

function fmtMinutes(m: number | null | undefined): string {
    if (m === null || m === undefined || m === 0) return '—';
    const total = Math.round(m);
    if (total < 60) return `${total}m`;
    return `${Math.floor(total / 60)}h ${total % 60}m`;
}

function StatCard({ label, value, color = '' }: { label: string; value: string | number; color?: string }) {
    return (
        <Card className="border-none shadow-sm">
            <CardContent className="px-2.5 py-1.5">
                <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
                <p className={`mt-0.5 text-lg font-bold ${color}`}>{value}</p>
            </CardContent>
        </Card>
    );
}

interface BreakdownItem {
    label: string;
    value: string | number;
    color?: string;
}

function BreakdownMenu({ label, value, color = '', items }: { label: string; value: string | number; color?: string; items: BreakdownItem[] }) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button
                    type="button"
                    className={`group inline-flex min-h-9 items-center gap-1 rounded-md px-1.5 py-0.5 text-left font-semibold transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${color}`}
                    aria-label={`${label} breakdown`}
                >
                    <span>{value}</span>
                    <ChevronDown className="h-3.5 w-3.5 opacity-55 transition-opacity group-hover:opacity-100" />
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-64">
                <DropdownMenuLabel>{label} Breakdown</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <div className="space-y-1 px-2 py-1">
                    {items.map((item) => (
                        <div key={item.label} className="flex items-center justify-between gap-4 rounded-sm py-1 text-sm">
                            <span className="text-muted-foreground">{item.label}</span>
                            <span className={`font-medium tabular-nums ${item.color ?? ''}`}>{item.value}</span>
                        </div>
                    ))}
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

function CalculatedStatCard({ label, value, color = '', items }: { label: string; value: string | number; color?: string; items: BreakdownItem[] }) {
    return (
        <Card className="border-none shadow-sm">
            <CardContent className="px-2.5 py-1.5">
                <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
                <BreakdownMenu label={label} value={value} color={`mt-0.5 text-lg ${color}`} items={items} />
            </CardContent>
        </Card>
    );
}

function topEmployeeBreakdown(summaries: EmployeeSummary[], selector: (employee: EmployeeSummary) => number, formatter: (value: number) => string = String): BreakdownItem[] {
    const items = summaries
        .map((employee) => ({ label: employee.name, value: selector(employee) }))
        .filter((item) => item.value > 0)
        .sort((a, b) => b.value - a.value)
        .slice(0, 5)
        .map((item) => ({ label: item.label, value: formatter(item.value) }));

    return items.length > 0 ? items : [{ label: 'No matching records', value: '-' }];
}

function EmployeeDetailTab({ emp, opMonth }: { emp: EmployeeSummary; opMonth: OpMonth }) {
    const [days, setDays] = useState<DayRecord[]>([]);
    const [loading, setLoading] = useState(false);
    const fetchedRef = useRef<string>('');

    const cacheKey = `${emp.id}:${opMonth.start_date}:${opMonth.end_date}`;

    useEffect(() => {
        if (fetchedRef.current === cacheKey) return;
        fetchedRef.current = cacheKey;

        queueMicrotask(() => setLoading(true));
        axios
            .get(`/admin/employee-attendance/${emp.id}`, {
                params: { start_date: opMonth.start_date, end_date: opMonth.end_date },
            })
            .then((res) => {
                if (res.data.status === 'success') {
                    setDays(res.data.calendar?.days ?? []);
                }
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [cacheKey, emp.id, opMonth]);

    const s = emp.summary;

    return (
        <div className="space-y-5">
            <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4 lg:grid-cols-8">
                <StatCard label="Working Days" value={s.total_working_days ?? s.total_days} />
                <StatCard label="Present" value={s.present_days} color="text-emerald-600" />
                <StatCard label="Absent" value={s.absent_days} color="text-red-600" />
                <StatCard label="Paid Leave" value={s.paid_leave_days ?? 0} color="text-purple-600" />
                <StatCard label="Unpaid Leave" value={s.unpaid_leave_days ?? 0} color="text-orange-600" />
                <StatCard label="Holidays" value={s.holiday_days ?? 0} color="text-indigo-600" />
                <CalculatedStatCard
                    label="Late Time"
                    value={fmtMinutes(s.total_late_minutes)}
                    color="text-yellow-600"
                    items={[
                        { label: 'Late-in minutes', value: fmtMinutes(s.total_late_minutes), color: 'text-yellow-700' },
                        { label: 'Late instances', value: s.late_days, color: 'text-yellow-700' },
                    ]}
                />
                <CalculatedStatCard
                    label="Overtime"
                    value={fmtMinutes(s.total_overtime_minutes)}
                    color="text-cyan-600"
                    items={[
                        { label: 'Early-in minutes', value: fmtMinutes(s.total_early_in_minutes), color: 'text-cyan-700' },
                        { label: 'Late-out minutes', value: fmtMinutes(s.total_late_out_minutes), color: 'text-cyan-700' },
                    ]}
                />
                <StatCard label="Total Hours" value={`${s.total_hours.toFixed(1)}h`} color="text-blue-600" />
            </div>

            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                        Day-by-Day Breakdown — {opMonth.label}
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    {loading ? (
                        <div className="flex items-center justify-center py-16">
                            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                        </div>
                    ) : days.length === 0 ? (
                        <p className="py-10 text-center text-sm text-muted-foreground">No data for this period.</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-muted/40">
                                        <TableHead className="w-20">Date</TableHead>
                                        <TableHead className="w-24">Day</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Holiday</TableHead>
                                        <TableHead className="text-center">Punch In</TableHead>
                                        <TableHead className="text-center">Punch Out</TableHead>
                                        <TableHead className="text-center">Work Time</TableHead>
                                        <TableHead className="text-center">Late</TableHead>
                                        <TableHead className="text-center">Early Out</TableHead>
                                        <TableHead className="text-center">Overtime</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {days.map((d) => {
                                        const isNonWork = d.status === 'weekend' || d.status === 'holiday' || d.status === 'upcoming';
                                        return (
                                            <TableRow
                                                key={d.date}
                                                className={`
                                                    ${d.is_today ? 'bg-blue-50/60 dark:bg-blue-950/20' : ''}
                                                    ${isNonWork ? 'opacity-60' : ''}
                                                `}
                                            >
                                                <TableCell className="font-mono text-xs font-medium">
                                                    {new Date(d.date + 'T00:00:00').toLocaleDateString('en-IN', {
                                                        day: '2-digit',
                                                        month: 'short',
                                                    })}
                                                </TableCell>
                                                <TableCell className="text-xs text-muted-foreground">
                                                    {new Date(d.date + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'short' })}
                                                    {d.is_today && (
                                                        <span className="ml-1.5 rounded bg-blue-100 px-1 py-0.5 text-[10px] font-semibold text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                                                            Today
                                                        </span>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <StatusBadge status={d.status} />
                                                </TableCell>
                                                <TableCell className="text-xs text-muted-foreground">
                                                    {d.holiday?.name ?? '—'}
                                                </TableCell>
                                                <TableCell className="text-center font-mono text-xs">
                                                    {fmtTime(d.record?.punch_in)}
                                                </TableCell>
                                                <TableCell className="text-center font-mono text-xs">
                                                    {fmtTime(d.record?.punch_out)}
                                                </TableCell>
                                                <TableCell className="text-center text-xs">
                                                    {d.record?.total_work_minutes != null
                                                        ? fmtMinutes(d.record.total_work_minutes)
                                                        : '—'}
                                                </TableCell>
                                                <TableCell className="text-center text-xs">
                                                    {d.record?.is_late
                                                        ? <span className="text-yellow-600 font-medium">{fmtMinutes(d.record.late_minutes)}</span>
                                                        : '—'}
                                                </TableCell>
                                                <TableCell className="text-center text-xs">
                                                    {d.record?.is_early_out
                                                        ? <span className="text-orange-600 font-medium">{fmtMinutes(d.record.early_out_minutes)}</span>
                                                        : '—'}
                                                </TableCell>
                                                <TableCell className="text-center text-xs">
                                                    {(d.record?.overtime_minutes ?? 0) > 0 ? (
                                                        <BreakdownMenu
                                                            label="Overtime"
                                                            value={fmtMinutes(d.record?.overtime_minutes)}
                                                            color="text-cyan-700"
                                                            items={[
                                                                { label: 'Early-in minutes', value: fmtMinutes(d.record?.early_in_minutes), color: 'text-cyan-700' },
                                                                { label: 'Late-out minutes', value: fmtMinutes(d.record?.late_out_minutes), color: 'text-cyan-700' },
                                                            ]}
                                                        />
                                                    ) : '-'}
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

function OverallTab({ summaries, loading }: { summaries: EmployeeSummary[]; loading: boolean }) {
    const totalPresent = summaries.reduce((s, e) => s + e.summary.present_days, 0);
    const totalAbsent = summaries.reduce((s, e) => s + e.summary.absent_days, 0);
    const totalHolidays = summaries.reduce((s, e) => s + (e.summary.holiday_days ?? 0), 0);
    const totalPaidLeave = summaries.reduce((s, e) => s + (e.summary.paid_leave_days ?? 0), 0);
    const totalUnpaidLeave = summaries.reduce((s, e) => s + (e.summary.unpaid_leave_days ?? 0), 0);
    const totalLate = summaries.reduce((s, e) => s + e.summary.late_days, 0);
    const totalEarlyOut = summaries.reduce((s, e) => s + e.summary.early_out_days, 0);
    const totalLateMinutes = summaries.reduce((s, e) => s + e.summary.total_late_minutes, 0);
    const totalEarlyInMinutes = summaries.reduce((s, e) => s + e.summary.total_early_in_minutes, 0);
    const totalEarlyOutMinutes = summaries.reduce((s, e) => s + e.summary.total_early_out_minutes, 0);
    const totalLateOutMinutes = summaries.reduce((s, e) => s + e.summary.total_late_out_minutes, 0);
    const totalOvertimeMinutes = summaries.reduce((s, e) => s + e.summary.total_overtime_minutes, 0);
    const totalHours = summaries.reduce((s, e) => s + e.summary.total_hours, 0);

    const tableSummaries = summaries.filter((e) => e.summary.present_days > 0);

    return (
        <div className="space-y-5">
            <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4 xl:grid-cols-6">
                <Card className="border-none shadow-sm">
                    <CardContent className="flex items-center gap-2 px-2.5 py-1.5">
                        <Users className="h-5 w-5 shrink-0 text-slate-400" />
                        <div>
                            <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Employees</p>
                            <p className="text-lg font-bold">{summaries.length}</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-sm">
                    <CardContent className="flex items-center gap-2 px-2.5 py-1.5">
                        <CalendarCheck2 className="h-5 w-5 shrink-0 text-emerald-500" />
                        <div>
                            <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Total Present</p>
                            <p className="text-lg font-bold text-emerald-600">{totalPresent}</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-sm">
                    <CardContent className="flex items-center gap-2 px-2.5 py-1.5">
                        <AlertCircle className="h-5 w-5 shrink-0 text-red-400" />
                        <div>
                            <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Total Absent</p>
                            <p className="text-lg font-bold text-red-600">{totalAbsent}</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-sm">
                    <CardContent className="flex items-center gap-2 px-2.5 py-1.5">
                        <TrendingUp className="h-5 w-5 shrink-0 text-yellow-500" />
                        <div>
                            <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Late Instances</p>
                            <BreakdownMenu
                                label="Late Instances"
                                value={totalLate}
                                color="text-lg text-yellow-600"
                                items={topEmployeeBreakdown(summaries, (employee) => employee.summary.late_days)}
                            />
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-sm">
                    <CardContent className="flex items-center gap-2 px-2.5 py-1.5">
                        <Clock className="h-5 w-5 shrink-0 text-blue-400" />
                        <div>
                            <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Total Hours</p>
                            <p className="text-lg font-bold text-blue-600">{totalHours.toFixed(1)}</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-sm">
                    <CardContent className="flex items-center gap-2 px-2.5 py-1.5">
                        <Palmtree className="h-5 w-5 shrink-0 text-indigo-400" />
                        <div>
                            <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Holidays</p>
                            <p className="text-lg font-bold text-indigo-600">{totalHolidays}</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-sm">
                    <CardContent className="flex items-center gap-2 px-2.5 py-1.5">
                        <Umbrella className="h-5 w-5 shrink-0 text-purple-400" />
                        <div>
                            <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Paid Leaves</p>
                            <p className="text-lg font-bold text-purple-600">{totalPaidLeave}</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-sm">
                    <CardContent className="flex items-center gap-2 px-2.5 py-1.5">
                        <Umbrella className="h-5 w-5 shrink-0 text-orange-400" />
                        <div>
                            <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Unpaid Leaves</p>
                            <p className="text-lg font-bold text-orange-600">{totalUnpaidLeave}</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-sm">
                    <CardContent className="px-2.5 py-1.5">
                        <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Early Out Days</p>
                        <BreakdownMenu
                            label="Early Out Days"
                            value={totalEarlyOut}
                            color="text-lg text-orange-600"
                            items={topEmployeeBreakdown(summaries, (employee) => employee.summary.early_out_days)}
                        />
                    </CardContent>
                </Card>
                <Card className="border-none shadow-sm">
                    <CardContent className="px-2.5 py-1.5">
                        <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Late Minutes</p>
                        <BreakdownMenu
                            label="Late Minutes"
                            value={totalLateMinutes}
                            color="text-lg text-yellow-700"
                            items={topEmployeeBreakdown(summaries, (employee) => employee.summary.total_late_minutes)}
                        />
                    </CardContent>
                </Card>
                <Card className="border-none shadow-sm">
                    <CardContent className="px-2.5 py-1.5">
                        <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Early-Out Min.</p>
                        <BreakdownMenu
                            label="Early-Out Minutes"
                            value={totalEarlyOutMinutes}
                            color="text-lg text-amber-700"
                            items={topEmployeeBreakdown(summaries, (employee) => employee.summary.total_early_out_minutes)}
                        />
                    </CardContent>
                </Card>
                <Card className="border-none shadow-sm">
                    <CardContent className="flex items-center gap-2 px-2.5 py-1.5">
                        <Timer className="h-5 w-5 shrink-0 text-cyan-500" />
                        <div>
                            <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Overtime</p>
                            <BreakdownMenu
                                label="Overtime"
                                value={fmtMinutes(totalOvertimeMinutes)}
                                color="text-lg text-cyan-700"
                                items={[
                                    { label: 'Early-in minutes', value: fmtMinutes(totalEarlyInMinutes), color: 'text-cyan-700' },
                                    { label: 'Late-out minutes', value: fmtMinutes(totalLateOutMinutes), color: 'text-cyan-700' },
                                    ...topEmployeeBreakdown(summaries, (employee) => employee.summary.total_overtime_minutes, fmtMinutes),
                                ]}
                            />
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>
                        Employees with Attendance
                        {tableSummaries.length !== summaries.length && (
                            <span className="ml-2 text-sm font-normal text-muted-foreground">
                                ({tableSummaries.length} of {summaries.length} shown)
                            </span>
                        )}
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    {loading ? (
                        <div className="flex items-center justify-center py-16">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-muted/40">
                                        <TableHead>Employee</TableHead>
                                        <TableHead>Dept.</TableHead>
                                        <TableHead className="text-center">Work Days</TableHead>
                                        <TableHead className="text-center">Present</TableHead>
                                        <TableHead className="text-center">Absent</TableHead>
                                        <TableHead className="text-center">Holidays</TableHead>
                                        <TableHead className="text-center">Paid Leave</TableHead>
                                        <TableHead className="text-center">Unpaid Leave</TableHead>
                                        <TableHead className="text-center">Late</TableHead>
                                        <TableHead className="text-center">Early Out</TableHead>
                                        <TableHead className="text-center">Late Min.</TableHead>
                                        <TableHead className="text-center">EO Min.</TableHead>
                                        <TableHead className="text-center">OT</TableHead>
                                        <TableHead className="text-center">Hours</TableHead>
                                        <TableHead className="text-right">Detail</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {summaries.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={15} className="py-12 text-center text-muted-foreground">
                                                No attendance data for this period.
                                            </TableCell>
                                        </TableRow>
                                    ) : tableSummaries.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={15} className="py-12 text-center text-muted-foreground">
                                                No employees with attendance records in this period.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        tableSummaries.map((emp) => (
                                            <TableRow key={emp.id}>
                                                <TableCell className="font-medium">{emp.name}</TableCell>
                                                <TableCell className="text-muted-foreground">{emp.department || '—'}</TableCell>
                                                <TableCell className="text-center text-sm">
                                                    {emp.summary.total_working_days ?? emp.summary.total_days}
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <span className="font-medium text-emerald-600">{emp.summary.present_days}</span>
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <span className="font-medium text-red-600">{emp.summary.absent_days}</span>
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <span className="font-medium text-indigo-600">{emp.summary.holiday_days ?? 0}</span>
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <span className="font-medium text-purple-600">{emp.summary.paid_leave_days ?? 0}</span>
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <span className="font-medium text-orange-600">{emp.summary.unpaid_leave_days ?? 0}</span>
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <BreakdownMenu
                                                        label="Late Instances"
                                                        value={emp.summary.late_days}
                                                        color="text-yellow-600"
                                                        items={[
                                                            { label: 'Late-in minutes', value: emp.summary.total_late_minutes, color: 'text-yellow-700' },
                                                        ]}
                                                    />
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <BreakdownMenu
                                                        label="Early Out Days"
                                                        value={emp.summary.early_out_days}
                                                        color="text-orange-600"
                                                        items={[
                                                            { label: 'Early-out minutes', value: emp.summary.total_early_out_minutes, color: 'text-amber-700' },
                                                        ]}
                                                    />
                                                </TableCell>
                                                <TableCell className="text-center text-sm text-yellow-700">
                                                    <BreakdownMenu
                                                        label="Late Minutes"
                                                        value={emp.summary.total_late_minutes}
                                                        color="text-yellow-700"
                                                        items={[
                                                            { label: 'Late instances', value: emp.summary.late_days, color: 'text-yellow-700' },
                                                        ]}
                                                    />
                                                </TableCell>
                                                <TableCell className="text-center text-sm text-amber-700">
                                                    <BreakdownMenu
                                                        label="Early-Out Minutes"
                                                        value={emp.summary.total_early_out_minutes}
                                                        color="text-amber-700"
                                                        items={[
                                                            { label: 'Early out days', value: emp.summary.early_out_days, color: 'text-orange-600' },
                                                        ]}
                                                    />
                                                </TableCell>
                                                <TableCell className="text-center text-sm text-cyan-700">
                                                    <BreakdownMenu
                                                        label="Overtime"
                                                        value={fmtMinutes(emp.summary.total_overtime_minutes)}
                                                        color="text-cyan-700"
                                                        items={[
                                                            { label: 'Early-in minutes', value: fmtMinutes(emp.summary.total_early_in_minutes), color: 'text-cyan-700' },
                                                            { label: 'Late-out minutes', value: fmtMinutes(emp.summary.total_late_out_minutes), color: 'text-cyan-700' },
                                                        ]}
                                                    />
                                                </TableCell>
                                                <TableCell className="text-center text-sm">
                                                    {emp.summary.total_hours.toFixed(1)}h
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Link href={`/admin/attendance?employee=${emp.id}`}>
                                                        <Button variant="ghost" size="sm">
                                                            <Eye className="h-4 w-4" />
                                                        </Button>
                                                    </Link>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

export function AttendanceSummaryTab() {
    const [opMonths, setOpMonths] = useState<OpMonth[]>([]);
    const [selectedOpMonth, setSelectedOpMonth] = useState<OpMonth | null>(null);
    const [opMonthsLoading, setOpMonthsLoading] = useState(true);
    const [summaries, setSummaries] = useState<EmployeeSummary[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overall');
    const [moreStep, setMoreStep] = useState(1);

    useEffect(() => {
        setOpMonthsLoading(true);
        axios
            .get('/admin/api/attendance/op-months')
            .then((res) => {
                if (res.data.status === 'success' && res.data.data?.length) {
                    setOpMonths(res.data.data);
                    setSelectedOpMonth(res.data.data[0]);
                }
            })
            .catch(console.error)
            .finally(() => setOpMonthsLoading(false));
    }, []);

    const fetchSummaries = useCallback(async () => {
        if (!selectedOpMonth) return;
        setLoading(true);
        try {
            const res = await axios.get('/admin/api/attendance/summary', {
                params: { start_date: selectedOpMonth.start_date, end_date: selectedOpMonth.end_date },
            });
            if (res.data.status === 'success') {
                setSummaries(res.data.data ?? []);
                setActiveTab('overall');
                setMoreStep(1);
            }
        } catch (e) {
            console.error(e);
            setSummaries([]);
        } finally {
            setLoading(false);
        }
    }, [selectedOpMonth]);

    useEffect(() => { void fetchSummaries(); }, [fetchSummaries]);

    const handleExportCSV = () => {
        if (!selectedOpMonth) return;
        const headers = [
            'Employee', 'Code', 'Department', 'Work Days', 'Present', 'Absent',
            'Holidays', 'Paid Leave', 'Unpaid Leave', 'Late', 'Early Out',
            'Late Min', 'Early-Out Min', 'Total Hours',
        ];
        const rows = summaries.map((emp) => [
            emp.name,
            emp.code,
            emp.department ?? 'N/A',
            emp.summary.total_working_days ?? emp.summary.total_days,
            emp.summary.present_days,
            emp.summary.absent_days,
            emp.summary.holiday_days ?? 0,
            emp.summary.paid_leave_days ?? 0,
            emp.summary.unpaid_leave_days ?? 0,
            emp.summary.late_days,
            emp.summary.early_out_days,
            emp.summary.total_late_minutes,
            emp.summary.total_early_out_minutes,
            emp.summary.total_hours.toFixed(1),
        ]);

        const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `attendance_${selectedOpMonth.label.replace(/\s+/g, '_')}.csv`;
        a.click();
    };

    const visibleSummaries = summaries.filter((e) => e.summary.present_days > 0);
    const tabCount = 15;
    const totalPages = Math.max(1, Math.ceil(visibleSummaries.length / tabCount));
    const tabEmployees = visibleSummaries.slice((moreStep - 1) * tabCount, moreStep * tabCount);
    const hasPrev = moreStep > 1;
    const hasNext = moreStep < totalPages;
    const prevPage = () => setMoreStep((p) => Math.max(1, p - 1));
    const nextPage = () => setMoreStep((p) => Math.min(totalPages, p + 1));

    return (
        <div className="space-y-4 pt-2">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-xl font-semibold">Attendance Summary</h2>
                <div className="flex items-center gap-3">
                    <OpMonthSelector
                        opMonths={opMonths}
                        selected={selectedOpMonth}
                        onChange={setSelectedOpMonth}
                        loading={loading || opMonthsLoading}
                    />
                    <Button variant="outline" onClick={handleExportCSV} className="gap-2">
                        <Download className="h-4 w-4" />
                        Export CSV
                    </Button>
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <div className="flex items-center gap-1">
                    <div className="min-w-0 flex-1 overflow-x-auto pb-1 [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-thumb]:rounded [&::-webkit-scrollbar-thumb]:bg-muted-foreground/30">
                        <TabsList className="inline-flex h-auto w-max gap-1 rounded-lg bg-muted p-1">
                            <TabsTrigger value="overall" id="tab-overall" className="shrink-0">
                                <Users className="mr-1.5 h-3.5 w-3.5" />
                                Overall
                            </TabsTrigger>
                            {tabEmployees.map((emp) => (
                                <TabsTrigger
                                    key={emp.id}
                                    value={`emp-${emp.id}`}
                                    id={`tab-emp-${emp.id}`}
                                    className="shrink-0 max-w-[160px] truncate border border-white text-xs font-medium text-muted-foreground hover:bg-muted/50 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:dark:border-primary/50 data-[state=active]:dark:bg-primary/10 data-[state=active]:dark:text-primary-foreground dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-700/50"
                                    title={emp.name}
                                >
                                    {emp.name.length > 15
                                        ? `${emp.name.split(' ')[0]} ${emp.name.split(' ')[1] ?? ''}`.trim()
                                        : emp.name}
                                </TabsTrigger>
                            ))}
                        </TabsList>
                    </div>
                    {visibleSummaries.length > tabCount && (
                        <div className="shrink-0 flex items-center gap-1">
                            <button
                                type="button"
                                onClick={prevPage}
                                disabled={!hasPrev}
                                title="Previous page"
                                className="shrink-0 inline-flex h-8 w-8 items-center justify-center rounded-md border border-input bg-background text-muted-foreground shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-40"
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </button>
                            {totalPages > 1 && (
                                <span className="px-1 text-xs tabular-nums text-muted-foreground">
                                    {moreStep}&nbsp;/&nbsp;{totalPages}
                                </span>
                            )}
                            <button
                                type="button"
                                onClick={nextPage}
                                disabled={!hasNext}
                                title="Next page"
                                className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-input bg-background text-muted-foreground shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-40"
                            >
                                <ChevronRight className="h-4 w-4" />
                            </button>
                        </div>
                    )}
                </div>

                <TabsContent value="overall">
                    <OverallTab summaries={summaries} loading={loading} />
                </TabsContent>

                {tabEmployees.map((emp) =>
                    selectedOpMonth ? (
                        <TabsContent key={emp.id} value={`emp-${emp.id}`}>
                            <div className="mb-3 flex items-center justify-between">
                                <div>
                                    <h2 className="text-lg font-semibold">{emp.name}</h2>
                                    <p className="text-sm text-muted-foreground">
                                        {emp.department ?? 'No Department'} · Code: {emp.code}
                                    </p>
                                </div>
                                <Link href={`/admin/attendance?employee=${emp.id}`}>
                                    <Button variant="outline" size="sm" className="gap-1.5">
                                        <Eye className="h-4 w-4" />
                                        Full Calendar
                                    </Button>
                                </Link>
                            </div>
                            <EmployeeDetailTab emp={emp} opMonth={selectedOpMonth} />
                        </TabsContent>
                    ) : null,
                )}
            </Tabs>
        </div>
    );
}
