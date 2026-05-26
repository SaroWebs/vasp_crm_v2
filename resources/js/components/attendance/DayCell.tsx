import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';

export type DayStatus =
    | 'present'
    | 'absent'
    | 'late'
    | 'half_day'
    | 'weekend'
    | 'holiday'
    | 'empty'
    | 'today';

export interface WorkingHoursForDay {
    start: string | null;
    end: string | null;
}

export interface Holiday {
    date: string;
    name: string;
    type?: string;
}

interface DayCellProps {
    day: number | null;
    date?: string;
    status: DayStatus;
    isCurrentMonth: boolean;
    isToday?: boolean;
    record?: {
        punch_in: string | null;
        punch_out: string | null;
        mode: string;
        is_half_day?: boolean;
    } | null;
    holiday?: Holiday;
    workingHours?: WorkingHoursForDay;
    onClick?: () => void;
}

const statusStyles: Record<DayStatus, string> = {
    present:
        'bg-emerald-50 text-emerald-900 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-200 dark:border-emerald-900',
    absent:
        'bg-red-50 text-red-900 border-red-200 dark:bg-red-950/40 dark:text-red-200 dark:border-red-900',
    late: 'bg-amber-50 text-amber-900 border-amber-200 dark:bg-amber-950/40 dark:text-amber-200 dark:border-amber-900',
    half_day:
        'bg-sky-50 text-sky-900 border-sky-200 dark:bg-sky-950/40 dark:text-sky-200 dark:border-sky-900',
    weekend: 'bg-muted/40 text-muted-foreground border-border/60',
    holiday:
        'bg-purple-50 text-purple-900 border-purple-200 dark:bg-purple-950/40 dark:text-purple-200 dark:border-purple-900',
    empty: 'bg-transparent border-transparent',
    today: '',
};

const dotStyles: Record<DayStatus, string> = {
    present: 'bg-emerald-500',
    absent: 'bg-red-500',
    late: 'bg-amber-500',
    half_day: 'bg-sky-500',
    weekend: 'bg-muted-foreground/40',
    holiday: 'bg-purple-500',
    empty: 'bg-transparent',
    today: 'bg-primary',
};

const statusBadge: Partial<Record<DayStatus, string>> = {
    present: 'P',
    absent: 'A',
    late: 'L',
    half_day: '½',
    holiday: 'H',
};

function formatTime(time: string | null): string | null {
    if (!time) return null;
    return time.slice(0, 5);
}

function getStatusLabel(status: DayStatus): string {
    switch (status) {
        case 'present':
            return 'Present';
        case 'absent':
            return 'Absent';
        case 'late':
            return 'Late';
        case 'half_day':
            return 'Half Day';
        case 'weekend':
            return 'Non-working day';
        case 'holiday':
            return 'Holiday';
        case 'today':
            return 'Today';
        case 'empty':
        default:
            return '—';
    }
}

export function DayCell({
    day,
    date,
    status,
    isCurrentMonth,
    isToday,
    record,
    holiday,
    workingHours,
    onClick,
}: DayCellProps) {
    // ✅ FIX: All hooks must be called unconditionally before any early returns
    const buttonRef = useRef<HTMLButtonElement | null>(null);
    const [isCompact, setIsCompact] = useState(false);

    useEffect(() => {
        const element = buttonRef.current;
        if (!element) return;

        const COMPACT_THRESHOLD_PX = 56;

        const update = () => {
            const width = element.getBoundingClientRect().width;
            setIsCompact(width < COMPACT_THRESHOLD_PX);
        };

        update();
        const observer = new ResizeObserver(() => update());
        observer.observe(element);
        return () => observer.disconnect();
    }, []);

    if (day === null) {
        return <div className="aspect-square w-full" />;
    }

    const punchIn = formatTime(record?.punch_in ?? null);
    const punchOut = formatTime(record?.punch_out ?? null);
    const workingHoursLabel =
        workingHours?.start && workingHours?.end
            ? `${workingHours.start.slice(0, 5)}–${workingHours.end.slice(0, 5)}`
            : null;
    const metaLabel = holiday?.name ?? (status === 'weekend' ? 'Off' : null);
    const badge = statusBadge[status];

    const cell = (
        <button
            ref={buttonRef}
            type="button"
            onClick={onClick}
            disabled={!onClick}
            className={cn(
                '[container-type:inline-size]',
                'relative aspect-square w-full rounded-lg border text-left transition-all duration-150',
                'p-[clamp(3px,1.2cqw,10px)]',
                statusStyles[status],
                !isCurrentMonth && 'opacity-30',
                onClick && 'cursor-pointer hover:brightness-95 hover:shadow-sm',
                !onClick && 'cursor-default',
                isToday &&
                    'ring-2 ring-primary ring-offset-1 ring-offset-background shadow-sm',
                status === 'empty' && 'pointer-events-none',
            )}
        >
            {/* Day number + badge row */}
            <div className="flex items-start justify-between">
                <span className="text-[clamp(10px,40cqw,60px)] font-bold leading-none tabular-nums">
                    {day}
                </span>
                {badge && !isCompact && (
                    <span
                        className={cn(
                            'flex h-[clamp(10px,14cqw,18px)] w-[clamp(10px,14cqw,18px)] items-center justify-center rounded-full text-[clamp(7px,8cqw,10px)] font-semibold text-white leading-none',
                            dotStyles[status],
                        )}
                    >
                        {badge}
                    </span>
                )}
            </div>

            {/* Meta info — only when not compact */}
            {!isCompact && (
                <div className="mt-[clamp(2px,0.8cqw,6px)] space-y-0.5">
                    {metaLabel && (
                        <div className="truncate text-[clamp(8px,9cqw,11px)] leading-tight opacity-70">
                            {metaLabel}
                        </div>
                    )}
                    {(punchIn || punchOut) && (
                        <div className="truncate text-[clamp(8px,8cqw,10px)] leading-tight tabular-nums opacity-60">
                            {punchIn ?? '--:--'}–{punchOut ?? '--:--'}
                        </div>
                    )}
                </div>
            )}

            {/* Today dot indicator */}
            {isToday && (
                <span className="absolute bottom-[clamp(2px,0.6cqw,4px)] right-[clamp(2px,0.6cqw,4px)] h-[clamp(4px,1cqw,6px)] w-[clamp(4px,1cqw,6px)] rounded-full bg-primary" />
            )}
        </button>
    );

    if (!date) return cell;

    return (
        <TooltipProvider delayDuration={100}>
            <Tooltip>
                <TooltipTrigger asChild>{cell}</TooltipTrigger>
                <TooltipContent
                    side="top"
                    className="max-w-[220px] rounded-lg border bg-popover p-3 shadow-md space-y-1.5"
                >
                    <div className="flex items-center justify-between gap-3">
                        <span className="text-xs font-semibold">{date}</span>
                        <span
                            className={cn(
                                'rounded px-1.5 py-0.5 text-[10px] font-medium text-white',
                                dotStyles[status],
                            )}
                        >
                            {getStatusLabel(status)}
                        </span>
                    </div>

                    {holiday?.name && (
                        <div className="text-xs text-purple-600 dark:text-purple-400">
                            🎉 {holiday.name}
                            {holiday.type && (
                                <span className="ml-1 opacity-60">({holiday.type})</span>
                            )}
                        </div>
                    )}

                    {workingHoursLabel && (
                        <div className="text-xs text-muted-foreground">
                            Schedule: {workingHoursLabel}
                        </div>
                    )}

                    {(punchIn || punchOut) && (
                        <div className="text-xs font-medium tabular-nums">
                            {punchIn ?? '--:--'} → {punchOut ?? '--:--'}
                            {record?.mode && (
                                <span className="ml-1 text-muted-foreground capitalize">
                                    · {record.mode}
                                </span>
                            )}
                        </div>
                    )}

                    {record?.is_half_day && (
                        <div className="text-xs text-sky-600 dark:text-sky-400">
                            Half day
                        </div>
                    )}
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}