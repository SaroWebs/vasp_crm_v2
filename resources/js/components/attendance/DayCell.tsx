import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';

export type DayStatus = 'present' | 'absent' | 'late' | 'weekend' | 'holiday' | 'empty' | 'today';

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
    } | null;
    holiday?: Holiday;
    workingHours?: WorkingHoursForDay;
    onClick?: () => void;
}

const statusStyles: Record<DayStatus, string> = {
    present: 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-200 dark:border-emerald-900',
    absent: 'bg-red-50 text-red-800 border-red-200 dark:bg-red-950/40 dark:text-red-200 dark:border-red-900',
    late: 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-200 dark:border-amber-900',
    weekend: 'bg-muted/40 text-muted-foreground border-border/60',
    holiday: 'bg-purple-50 text-purple-800 border-purple-200 dark:bg-purple-950/40 dark:text-purple-200 dark:border-purple-900',
    empty: 'bg-transparent',
    today: '',
};

const dotStyles: Record<DayStatus, string> = {
    present: 'bg-emerald-600',
    absent: 'bg-red-600',
    late: 'bg-amber-600',
    weekend: 'bg-muted-foreground/40',
    holiday: 'bg-purple-600',
    empty: 'bg-transparent',
    today: 'bg-primary',
};

function formatTime(time: string | null): string | null {
    if (!time) {
        return null;
    }

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
    if (day === null) {
        return <div className="aspect-square w-full" />;
    }

    const buttonRef = useRef<HTMLButtonElement | null>(null);
    const [isCompact, setIsCompact] = useState(false);

    useEffect(() => {
        const element = buttonRef.current;
        if (!element) {
            return;
        }

        const COMPACT_THRESHOLD_PX = 56;

        const update = () => {
            const width = element.getBoundingClientRect().width;
            setIsCompact(width < COMPACT_THRESHOLD_PX);
        };

        update();

        const observer = new ResizeObserver(() => update());
        observer.observe(element);

        return () => {
            observer.disconnect();
        };
    }, []);

    const punchIn = formatTime(record?.punch_in ?? null);
    const punchOut = formatTime(record?.punch_out ?? null);
    const workingHoursLabel =
        workingHours?.start && workingHours?.end ? `${workingHours.start}-${workingHours.end}` : null;
    const metaLabel =
        holiday?.name ??
        workingHoursLabel ??
        (status === 'weekend' ? 'Off' : '-');

    const cell = (
        <button
            ref={buttonRef}
            type="button"
            onClick={onClick}
            disabled={!onClick}
            className={cn(
                '[container-type:inline-size]',
                'relative aspect-square w-full rounded-md border text-left transition-colors',
                'p-[clamp(4px,1.2cqw,10px)]',
                statusStyles[status],
                !isCurrentMonth && 'opacity-30',
                onClick && 'cursor-pointer hover:opacity-90',
                !onClick && 'cursor-default',
                isToday && 'ring-2 ring-primary ring-offset-2 ring-offset-background'
            )}
        >
            <div className="flex items-start justify-between gap-2">
                <div className="text-[clamp(10px,45cqw,72px)] font-semibold leading-none">
                    {day}
                </div>
            </div>

            {!isCompact && (
                <div className="mt-[clamp(2px,0.8cqw,6px)] space-y-0.5 text-[clamp(9px,10cqw,48px)] leading-tight text-muted-foreground">
                    <div className="truncate">{metaLabel}</div>

                    {(punchIn || punchOut) && (
                        <div className="truncate">
                            {punchIn ?? '--:--'} - {punchOut ?? '--:--'}
                        </div>
                    )}
                </div>
            )}
        </button>
    );

    if (!date) {
        return cell;
    }

    return (
        <TooltipProvider delayDuration={0}>
            <Tooltip>
                <TooltipTrigger asChild>{cell}</TooltipTrigger>
                <TooltipContent className="max-w-[240px] space-y-1">
                    <div className="text-xs font-semibold">{date}</div>
                    <div className="text-xs text-muted-foreground">{getStatusLabel(status)}</div>
                    {holiday?.name && <div className="text-xs">Holiday: {holiday.name}</div>}
                    {workingHoursLabel && (
                        <div className="text-xs text-muted-foreground">
                            Working hours: {workingHoursLabel}
                        </div>
                    )}
                    {(punchIn || punchOut) && (
                        <div className="text-xs">
                            {punchIn ?? '--:--'} - {punchOut ?? '--:--'}
                            {record?.mode ? (
                                <span className="text-muted-foreground"> ({record.mode})</span>
                            ) : null}
                        </div>
                    )}
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}
