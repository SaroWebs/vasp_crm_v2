import ReportCard from './ReportCard';

interface ReportAttachment {
    id: number;
    file_name: string;
    file_path: string;
    file_type: string;
    file_size: number;
}

interface TaskTimeEntry {
    id: number;
    start_time: string;
    end_time: string;
    description: string;
    working_duration?: number;
}

interface Task {
    id: number;
    title: string;
    task_code: string;
    description: string;
    state: string;
    time_entries: TaskTimeEntry[];
    total_working_seconds?: number;
    pivot?: {
        remarks?: string;
    };
}

interface Report {
    id: number;
    user_id: number;
    user: { id: number; name: string };
    report_date: string;
    title: string;
    description: string;
    total_hours: number;
    status: string;
    created_at: string;
    tasks: Task[];
    attachments: ReportAttachment[];
}

interface ReportGroupProps {
    reports: Report[];
    authUser: { id: number; name: string };
    groupBy: 'date' | 'employee';
    showEmployee?: boolean;
    showDate?: boolean;
    onDelete?: () => void;
    showTimeEntries?: boolean;
}

const formatSeconds = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

const getSecondsOnDate = (startTime: string, endTime: string, reportDate: string): number => {
    const start = new Date(startTime);
    const end = new Date(endTime);
    const reportDateObj = new Date(reportDate);
    const reportDateStart = new Date(reportDateObj);
    reportDateStart.setHours(0, 0, 0, 0);
    const reportDateEnd = new Date(reportDateObj);
    reportDateEnd.setHours(23, 59, 59, 999);

    const effectiveStart = start < reportDateStart ? reportDateStart : start;
    const effectiveEnd = end > reportDateEnd ? reportDateEnd : end;

    if (effectiveStart >= effectiveEnd) {
        return 0;
    }

    return (effectiveEnd.getTime() - effectiveStart.getTime()) / 1000;
};

const getReportTotalSeconds = (report: Report): number => {
    if (report.tasks && report.tasks.length > 0) {
        return report.tasks.reduce((taskAcc, task) => {
            if (task.total_working_seconds) {
                return taskAcc + task.total_working_seconds;
            }
            const taskSeconds = task.time_entries?.reduce((entryAcc, entry) => {
                return entryAcc + getSecondsOnDate(entry.start_time, entry.end_time, report.report_date);
            }, 0) || 0;
            return taskAcc + taskSeconds;
        }, 0);
    }
    return report.total_hours * 3600;
};

const getGroupTotalTime = (reports: Report[]): string => {
    const totalSeconds = reports.reduce((acc, report) => {
        return acc + getReportTotalSeconds(report);
    }, 0);
    return formatSeconds(totalSeconds);
};

export default function ReportGroup({ reports, authUser, groupBy, showEmployee = true, showDate = true, onDelete, showTimeEntries = true }: ReportGroupProps) {
    if (reports.length === 0) return null;

    const getGroupHeader = () => {
        if (groupBy === 'date') {
            const date = new Date(reports[0].report_date);
            return date.toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        } else {
            return reports[0].user?.name || 'Unknown Employee';
        }
    };

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between px-2">
                <h3 className="text-lg font-semibold text-foreground">
                    {groupBy === 'date' ? '📅' : '👤'} {getGroupHeader()}
                </h3>
                <span className="text-sm font-medium text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
                    {reports.length} report{reports.length > 1 ? 's' : ''} • {getGroupTotalTime(reports)}
                </span>
            </div>
            <div className="space-y-2 border rounded-lg bg-card p-4">
                {reports.map((report,i) => (
                    <ReportCard
                        key={report.id}
                        report={report}
                        authUser={authUser}
                        isLast={i === reports.length - 1}
                        onDelete={onDelete}
                        showTimeEntries={showTimeEntries}
                    />
                ))}
            </div>
        </div>
    );
}

export function groupReportsByDate(reports: Report[]): Map<string, Report[]> {
    const grouped = new Map<string, Report[]>();
    
    reports.forEach((report) => {
        const dateKey = report.report_date;
        const existing = grouped.get(dateKey) || [];
        grouped.set(dateKey, [...existing, report]);
    });

    return new Map([...grouped.entries()].sort((a, b) => b[0].localeCompare(a[0])));
}

export function groupReportsByEmployee(reports: Report[]): Map<string, Report[]> {
    const grouped = new Map<string, Report[]>();
    
    reports.forEach((report) => {
        const employeeKey = report.user?.name || 'Unknown';
        const existing = grouped.get(employeeKey) || [];
        grouped.set(employeeKey, [...existing, report]);
    });

    return grouped;
}
