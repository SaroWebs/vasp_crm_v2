export const parseReportDate: (reportDate: string) => Date | null;
export const getReportDateRange: (reportDate: string) => { start: Date; end: Date } | null;
export const getSecondsOnReportDate: (
    startTime: string,
    endTime: string,
    reportDate: string,
) => number;
export const getEntryRangeOnReportDate: (
    startTime: string,
    endTime: string,
    reportDate: string,
) => { start: Date; end: Date } | null;
