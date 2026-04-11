export const parseReportDate = (reportDate) => {
    if (!reportDate) {
        return null;
    }

    const [year, month, day] = reportDate
        .split('-')
        .map((part) => Number(part));

    if (!year || !month || !day) {
        return null;
    }

    return new Date(year, month - 1, day);
};

export const getReportDateRange = (reportDate) => {
    const start = parseReportDate(reportDate);

    if (!start) {
        return null;
    }

    const end = new Date(start);
    end.setHours(23, 59, 59, 999);

    return { start, end };
};

export const getSecondsOnReportDate = (startTime, endTime, reportDate) => {
    const start = new Date(startTime);
    const end = new Date(endTime);
    const range = getReportDateRange(reportDate);

    if (!range || Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
        return 0;
    }

    const effectiveStart = start < range.start ? range.start : start;
    const effectiveEnd = end > range.end ? range.end : end;

    if (effectiveStart >= effectiveEnd) {
        return 0;
    }

    return (effectiveEnd.getTime() - effectiveStart.getTime()) / 1000;
};

export const getEntryRangeOnReportDate = (startTime, endTime, reportDate) => {
    const start = new Date(startTime);
    const end = new Date(endTime);
    const range = getReportDateRange(reportDate);

    if (!range || Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
        return null;
    }

    const effectiveStart = start < range.start ? range.start : start;
    const effectiveEnd = end > range.end ? range.end : end;

    if (effectiveStart >= effectiveEnd) {
        return null;
    }

    return { start: effectiveStart, end: effectiveEnd };
};
