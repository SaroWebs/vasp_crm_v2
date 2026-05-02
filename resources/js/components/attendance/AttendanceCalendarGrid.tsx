import { useMemo } from 'react';
import { DayCell, type DayStatus, type Holiday, type WorkingHoursForDay } from './DayCell';

interface AttendanceRecord {
    attendance_date: string;
    punch_in: string | null;
    punch_out: string | null;
    mode: string;
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
    onDayClick?: (date: string, record: AttendanceRecord | null) => void;
}

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function getDaysInMonth(month: number, year: number): number {
    return new Date(year, month, 0).getDate();
}

function getFirstDayOfMonth(month: number, year: number): number {
    const day = new Date(year, month - 1, 1).getDay();
    return day === 0 ? 6 : day - 1; // Convert Sunday=0 to Monday=0
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
    return new Date(year, month - 1, day).toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
}

function normalizeTime(time: string | null | undefined): string | null {
    if (!time) {
        return null;
    }

    return time.length === 5 ? `${time}:00` : time;
}

function getWorkingHoursForDate(
    day: number,
    month: number,
    year: number,
    workingHoursConfig: WorkingHoursConfig | undefined
): WorkingHoursForDay {
    const dayName = getDayName(day, month, year);
    const workdayConfig = workingHoursConfig?.workdays?.find((w) => w.day === dayName);

    const start = normalizeTime(workdayConfig?.start);
    const end = normalizeTime(workdayConfig?.end);

    return {
        start,
        end,
    };
}

function getDayStatus(
    day: number,
    month: number,
    year: number,
    record: AttendanceRecord | undefined,
    isCurrentMonth: boolean,
    holiday: Holiday | undefined,
    workingHours: WorkingHoursForDay
): DayStatus {
    if (!isCurrentMonth) {
        return 'empty';
    }

    const date = new Date(year, month - 1, day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (date > today) {
        return 'empty';
    }

    if (holiday && !record) {
        return 'holiday';
    }

    const isWorkingDay = Boolean(workingHours.start && workingHours.end);
    if (!isWorkingDay) {
        return 'weekend';
    }

    if (!record) {
        return 'absent';
    }

    // if (record.punch_in) {
    //     const threshold = workingHours.start ?? '09:00:00';
    //     if (record.punch_in > threshold) {
    //         return 'late';
    //     }
    // }

    return 'present';
}

export function AttendanceCalendarGrid({
    records,
    month,
    year,
    calendar,
    onDayClick,
}: AttendanceCalendarGridProps) {
    const recordMap = useMemo(() => {
        const map = new Map<string, AttendanceRecord>();
        records.forEach((record) => {
            map.set(record.attendance_date, record);
        });
        return map;
    }, [records]);

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

        // Add empty cells for days before the first day of the month
        for (let i = 0; i < firstDay; i++) {
            days.push({ day: null, date: '', status: 'empty' });
        }

        // Add days of the month
        for (let day = 1; day <= daysInMonth; day++) {
            const date = formatDate(day, month, year);
            const record = recordMap.get(date);
            const holiday = holidayMap.get(date);
            const workingHours = getWorkingHoursForDate(day, month, year, calendar?.working_hours);
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
            <div className="grid grid-cols-7 gap-[clamp(2px,0.6cqw,6px)] mb-2">
                {WEEKDAYS.map((day) => (
                    <div
                        key={day}
                        className="h-[clamp(24px,2.2cqw,32px)] flex items-center justify-center text-[clamp(10px,1.1cqw,12px)] font-medium text-muted-foreground"
                    >
                        {day}
                    </div>
                ))}
            </div>
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
                                ? () => onDayClick(item.date, recordMap.get(item.date) || null)
                                : undefined
                        }
                    />
                ))}
            </div>
        </div>
    );
}
