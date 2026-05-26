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
    is_half_day?: boolean;
    employee_name?: string | null;
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

interface AttendanceCalendarGridProps {
    records: AttendanceRecord[];
    month: number;
    year: number;
    calendar?: AttendanceCalendarMeta;
    onDayClick?: (date: string) => void;
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

function isToday(day: number, month: number, year: number): boolean {
    const today = new Date();
    return (
        today.getDate() === day &&
        today.getMonth() + 1 === month &&
        today.getFullYear() === year
    );
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

    if (date > today) return 'empty';

    if (record) {
        // ✅ FIX: Check half_day before late check
        if (record.is_half_day) {
            return 'half_day';
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
        const days: Array<{
            day: number | null;
            date: string;
            status: DayStatus;
            isToday?: boolean;
            record?: AttendanceRecord | null;
            holiday?: Holiday;
            workingHours?: WorkingHoursForDay;
        }> = [];

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
            const isTodayDate = isToday(day, month, year);

            days.push({
                day,
                date,
                status,
                isToday: isTodayDate,
                record: record ?? null,
                holiday,
                workingHours,
            });
        }

        return days;
    }, [daysInMonth, firstDay, month, year, recordMap, holidayMap, calendar?.working_hours]);

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
                {calendarDays.map((item, index) => (
                    <DayCell
                        key={index}
                        day={item.day}
                        status={item.status}
                        date={item.date}
                        isToday={item.isToday}
                        isCurrentMonth={true}
                        record={item.record ?? null}
                        holiday={item.holiday}
                        workingHours={item.workingHours}
                        onClick={
                            item.date && onDayClick
                                ? () => onDayClick(item.date)
                                : undefined
                        }
                    />
                ))}
            </div>
        </div>
    );
}