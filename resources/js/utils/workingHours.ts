export interface WorkingHoursDayConfig {
    day: string;
    start: string;
    end: string;
    break_start: string;
    break_end: string;
}

export interface WorkingHoursConfig {
    workdays: WorkingHoursDayConfig[];
    timezone: string;
}

export interface HolidaysConfig {
    holidays: Array<{
        date: string;
        name?: string;
        type?: string;
    }>;
    year: number;
}

const getZonedDateParts = (date: Date, timeZone: string): {
    weekday: string;
    year: string;
    month: string;
    day: string;
    hour: number;
    minute: number;
} => {
    const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone,
        weekday: 'long',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
    });

    const parts = formatter.formatToParts(date);
    const getPart = (type: Intl.DateTimeFormatPartTypes): string =>
        parts.find((part) => part.type === type)?.value ?? '';

    return {
        weekday: getPart('weekday').toLowerCase(),
        year: getPart('year'),
        month: getPart('month'),
        day: getPart('day'),
        hour: Number.parseInt(getPart('hour'), 10),
        minute: Number.parseInt(getPart('minute'), 10),
    };
};

const parseMinutes = (value: string): number => {
    const [hours, minutes] = value.split(':').map((part) => Number.parseInt(part, 10));

    if (Number.isNaN(hours) || Number.isNaN(minutes)) {
        return NaN;
    }

    return hours * 60 + minutes;
};

export const isWithinWorkingHours = (
    date: Date,
    workingHoursConfig: WorkingHoursConfig | null,
    holidaysConfig: HolidaysConfig | null,
): boolean => {
    if (!workingHoursConfig) {
        return true;
    }

    const timeZone = workingHoursConfig.timezone || 'UTC';
    const zonedParts = getZonedDateParts(date, timeZone);
    const today = `${zonedParts.year}-${zonedParts.month}-${zonedParts.day}`;

    if (holidaysConfig?.holidays.some((holiday) => holiday.date === today)) {
        return false;
    }

    const workdayConfig = workingHoursConfig.workdays.find(
        (workday) => workday.day === zonedParts.weekday,
    );

    if (!workdayConfig || !workdayConfig.start || !workdayConfig.end) {
        return false;
    }

    const currentMinutes = zonedParts.hour * 60 + zonedParts.minute;
    const startMinutes = parseMinutes(workdayConfig.start);
    const endMinutes = parseMinutes(workdayConfig.end);

    if (
        Number.isNaN(startMinutes) ||
        Number.isNaN(endMinutes) ||
        currentMinutes < startMinutes ||
        currentMinutes > endMinutes
    ) {
        return false;
    }

    if (workdayConfig.break_start && workdayConfig.break_end) {
        const breakStartMinutes = parseMinutes(workdayConfig.break_start);
        const breakEndMinutes = parseMinutes(workdayConfig.break_end);

        if (
            !Number.isNaN(breakStartMinutes) &&
            !Number.isNaN(breakEndMinutes) &&
            currentMinutes >= breakStartMinutes &&
            currentMinutes <= breakEndMinutes
        ) {
            return false;
        }
    }

    return true;
};
