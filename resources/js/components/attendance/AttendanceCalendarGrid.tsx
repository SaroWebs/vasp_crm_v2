import { useMemo } from 'react';
import {
    DayCell,
    type DayStatus,
    type Holiday,
    type WorkingHoursForDay,
} from './DayCell';

interface AttendanceRecord {
    attendance_date: string;
    punch_in: string | null;
    punch_out: string | null;
    mode: string;
    status?: string;
    is_half_day?: boolean;
    late_minutes?: number;
    early_out_minutes?: number;
    employee_name?: string | null;
}

export interface AttendanceCalendarDay {
    day: number;
    date: string;
    status: DayStatus;
    record?: AttendanceRecord | null;
    holiday?: Holiday | null;
    shift_id?: number | null;
    shift_start?: string | null;
    shift_end?: string | null;
    shift_grace_minutes?: number | null;
    shift_source?: 'assigned_shift' | 'general_hours' | 'none';
    is_leave_day?: boolean;
    is_holiday?: boolean;
    is_field_work?: boolean;
    is_remote_work?: boolean;
}

interface CalendarPlaceholder {
    day: null;
    date: '';
    status: 'empty';
}

type CalendarGridItem = AttendanceCalendarDay | CalendarPlaceholder;

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
    days?: AttendanceCalendarDay[];
}

interface AttendanceCalendarGridProps {
    records: AttendanceRecord[];
    month: number;
    year: number;
    calendar?: AttendanceCalendarMeta;
    onDayClick?: (day: AttendanceCalendarDay) => void;
}

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function getDaysInMonth(month: number, year: number): number {
    return new Date(year, month, 0).getDate();
}

function getFirstDayOfMonth(month: number, year: number): number {
    const day = new Date(year, month - 1, 1).getDay();
    return day === 0 ? 6 : day - 1; // Convert Sunday=0 to Monday-first
}

function formatDate(day: number, month: number, year: number): string {
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function isDateToday(date: string): boolean {
    const today = new Date();
    const todayKey = formatDate(
        today.getDate(),
        today.getMonth() + 1,
        today.getFullYear(),
    );

    return date === todayKey;
}

function isCalendarDay(item: CalendarGridItem): item is AttendanceCalendarDay {
    return item.day !== null;
}

function getDayName(day: number, month: number, year: number): string {
    return new Date(year, month - 1, day)
        .toLocaleDateString('en-US', { weekday: 'long' })
        .toLowerCase();
}

function normalizeTime(time: string | null | undefined): string | null {
    if (!time) return null;
    return time.length === 5 ? `${time}:00` : time;
}

/**
 * ✅ FIX: Normalize attendance_date from ISO string to YYYY-MM-DD in the
 * correct timezone. The API stores dates as UTC midnight in IST
 * (e.g. "2026-04-19T18:30:00.000000Z" = "2026-04-20" in IST).
 * Using Intl.DateTimeFormat with the configured timezone ensures the
 * date matches the calendar day the employee actually worked.
 */
function normalizeAttendanceDate(isoDate: string, timezone = 'Asia/Calcutta'): string {
    if (/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) {
        return isoDate;
    }

    return new Intl.DateTimeFormat('en-CA', {
        timeZone: timezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    }).format(new Date(isoDate));
}

function getWorkingHoursForDate(
    day: number,
    month: number,
    year: number,
    workingHoursConfig: WorkingHoursConfig | undefined,
): WorkingHoursForDay {
    const dayName = getDayName(day, month, year);
    const workdayConfig = workingHoursConfig?.workdays?.find((w) => w.day === dayName);
    return {
        start: normalizeTime(workdayConfig?.start) ?? null,
        end: normalizeTime(workdayConfig?.end) ?? null,
    };
}

function getDayStatus(
    day: number,
    month: number,
    year: number,
    record: AttendanceRecord | undefined,
    isCurrentMonth: boolean,
    holiday: Holiday | undefined,
    workingHours: WorkingHoursForDay,
): DayStatus {
    if (!isCurrentMonth) return 'empty';

    const date = new Date(year, month - 1, day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (record) {
        // ✅ FIX: Check half_day before late check
        if (record.is_half_day) {
            return 'half_day';
        }
        if (record.status === 'late_in' || record.status === 'late') {
            return 'late';
        }
        if (record.status === 'early_out') {
            return 'early_out';
        }
        if (record.status === 'incomplete') {
            return 'incomplete';
        }
        if (
            record.punch_in &&
            workingHours.start &&
            record.punch_in > workingHours.start
        ) {
            return 'late';
        }
        return 'present';
    }

    if (holiday) return 'holiday';

    const isWorkingDay = Boolean(workingHours.start && workingHours.end);
    if (!isWorkingDay) return 'weekend';

    if (date > today) return 'upcoming';
    if (date.getTime() === today.getTime()) return 'pending';

    return 'absent';
}

export function AttendanceCalendarGrid({
    records,
    month,
    year,
    calendar,
    onDayClick,
}: AttendanceCalendarGridProps) {
    const timezone = calendar?.working_hours?.timezone ?? 'Asia/Calcutta';

    const recordMap = useMemo(() => {
        const map = new Map<string, AttendanceRecord>();

        records.forEach((record) => {
            // ✅ FIX: Normalize ISO date string → YYYY-MM-DD in the correct timezone
            // Previously used the raw ISO string as the map key, which never matched
            // the "YYYY-MM-DD" keys produced by formatDate().
            const normalizedDate = normalizeAttendanceDate(record.attendance_date, timezone);

            const existing = map.get(normalizedDate);
            if (!existing) {
                map.set(normalizedDate, { ...record, attendance_date: normalizedDate });
                return;
            }

            const earliestIn = [existing.punch_in, record.punch_in]
                .filter(Boolean)
                .sort() as string[];
            const latestOut = [existing.punch_out, record.punch_out]
                .filter(Boolean)
                .sort()
                .reverse() as string[];

            map.set(normalizedDate, {
                ...existing,
                attendance_date: normalizedDate,
                punch_in: earliestIn.length > 0 ? earliestIn[0] : existing.punch_in,
                punch_out: latestOut.length > 0 ? latestOut[0] : existing.punch_out,
                mode: existing.mode || record.mode,
                employee_name: existing.employee_name || record.employee_name,
                // Preserve half_day flag if either record is a half day
                is_half_day: existing.is_half_day || record.is_half_day,
            });
        });

        return map;
    }, [records, timezone]);

    const holidayMap = useMemo(() => {
        const map = new Map<string, Holiday>();
        (calendar?.holidays ?? []).forEach((holiday) => {
            map.set(holiday.date, holiday);
        });
        return map;
    }, [calendar?.holidays]);

    const daysInMonth = getDaysInMonth(month, year);
    const firstDay = getFirstDayOfMonth(month, year);

    const calendarDays = useMemo(() => {
        if (calendar?.days?.length) {
            const days: CalendarGridItem[] = [];

            for (let i = 0; i < firstDay; i++) {
                days.push({ day: null, date: '', status: 'empty' });
            }

            calendar.days.forEach((day) => {
                days.push(day);
            });

            return days;
        }

        const days: CalendarGridItem[] = [];

        for (let i = 0; i < firstDay; i++) {
            days.push({ day: null, date: '', status: 'empty' });
        }

        for (let day = 1; day <= daysInMonth; day++) {
            const date = formatDate(day, month, year);
            const record = recordMap.get(date);
            const holiday = holidayMap.get(date);
            const workingHours = getWorkingHoursForDate(
                day,
                month,
                year,
                calendar?.working_hours,
            );
            const status = getDayStatus(day, month, year, record, true, holiday, workingHours);

            days.push({
                day,
                date,
                status,
                record: record ?? null,
                holiday,
                shift_id: null,
                shift_start: workingHours.start,
                shift_end: workingHours.end,
                shift_grace_minutes: 0,
                shift_source: workingHours.start && workingHours.end ? 'general_hours' : 'none',
            });
        }

        return days;
    }, [calendar, daysInMonth, firstDay, month, year, recordMap, holidayMap]);

    return (
        <div className="w-full">
            {/* Weekday headers */}
            <div className="mb-2 grid grid-cols-7 gap-[clamp(2px,0.6cqw,6px)]">
                {WEEKDAYS.map((day) => (
                    <div
                        key={day}
                        className="flex h-8 items-center justify-center text-[clamp(10px,1.1cqw,12px)] font-semibold uppercase tracking-wide text-muted-foreground"
                    >
                        {day}
                    </div>
                ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-[clamp(2px,0.6cqw,6px)]">
                {calendarDays.map((item, index) => {
                    const isRealDay = isCalendarDay(item);

                    return (
                        <DayCell
                            key={isRealDay ? item.date : `blank-${index}`}
                            day={item.day}
                            status={item.status}
                            date={item.date}
                            isToday={isRealDay ? isDateToday(item.date) : false}
                            isCurrentMonth={true}
                            record={isRealDay ? item.record ?? null : null}
                            holiday={isRealDay ? item.holiday ?? undefined : undefined}
                            workingHours={
                                isRealDay && item.shift_start && item.shift_end
                                    ? { start: item.shift_start, end: item.shift_end }
                                    : undefined
                            }
                            dayMeta={isRealDay ? item : undefined}
                            timezone={timezone}
                            onClick={
                                isRealDay && onDayClick
                                    ? () => onDayClick(item)
                                    : undefined
                            }
                        />
                    );
                })}
            </div>
        </div>
    );
}
