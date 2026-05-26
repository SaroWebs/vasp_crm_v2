import { CheckCircle, XCircle, Clock, Timer, AlertTriangle, TrendingUp } from 'lucide-react';

interface AttendanceSummaryCardsProps {
    summary: {
        present_days: number;
        absent_days: number;
        late_days: number;
        early_out_days?: number;
        total_late_minutes?: number;
        total_early_out_minutes?: number;
        total_hours: number;
    };
}

interface StatCard {
    label: string;
    value: string | number;
    icon: React.ComponentType<{ className?: string }>;
    iconColor: string;
    valueColor: string;
    borderColor: string;
    bg: string;
    subLabel?: string;
}

function formatMinutes(mins: number): string {
    if (mins < 60) return `${Math.round(mins)}m`;
    const h = Math.floor(mins / 60);
    const m = Math.round(mins % 60);
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export function AttendanceSummaryCards({ summary }: AttendanceSummaryCardsProps) {
    const stats: StatCard[] = [
        {
            label: 'Present',
            value: summary.present_days,
            icon: CheckCircle,
            iconColor: 'text-emerald-500',
            valueColor: 'text-emerald-700 dark:text-emerald-400',
            borderColor: 'border-l-emerald-400',
            bg: 'bg-emerald-50 dark:bg-emerald-950/30',
        },
        {
            label: 'Absent',
            value: summary.absent_days,
            icon: XCircle,
            iconColor: 'text-red-500',
            valueColor: 'text-red-700 dark:text-red-400',
            borderColor: 'border-l-red-400',
            bg: 'bg-red-50 dark:bg-red-950/30',
        },
        {
            label: 'Late Arrivals',
            value: summary.late_days,
            icon: Clock,
            iconColor: 'text-amber-500',
            valueColor: 'text-amber-700 dark:text-amber-400',
            borderColor: 'border-l-amber-400',
            bg: 'bg-amber-50 dark:bg-amber-950/30',
            subLabel:
                summary.total_late_minutes
                    ? formatMinutes(summary.total_late_minutes)
                    : undefined,
        },
        {
            label: 'Early Out',
            value: summary.early_out_days ?? 0,
            icon: AlertTriangle,
            iconColor: 'text-orange-500',
            valueColor: 'text-orange-700 dark:text-orange-400',
            borderColor: 'border-l-orange-400',
            bg: 'bg-orange-50 dark:bg-orange-950/30',
            subLabel:
                summary.total_early_out_minutes
                    ? formatMinutes(summary.total_early_out_minutes)
                    : undefined,
        },
    ];

    return (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {stats.map((stat) => (
                <div
                    key={stat.label}
                    className={`
                        relative overflow-hidden rounded-xl border border-l-4 p-4 shadow-sm transition-shadow hover:shadow-md
                        ${stat.bg} ${stat.borderColor}
                    `}
                >
                    <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-muted-foreground truncate">
                                {stat.label}
                            </p>
                            <p className={`mt-1 text-2xl font-bold tabular-nums leading-none ${stat.valueColor}`}>
                                {stat.value}
                            </p>
                            {stat.subLabel && (
                                <p className="mt-1 text-[10px] text-muted-foreground/70 truncate">
                                    {stat.subLabel}
                                </p>
                            )}
                        </div>
                        <div className={`ml-2 shrink-0 rounded-lg p-1.5 ${stat.bg}`}>
                            <stat.icon className={`h-4 w-4 ${stat.iconColor}`} />
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}