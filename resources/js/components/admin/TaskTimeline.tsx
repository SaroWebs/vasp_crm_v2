import TaskDetailsModalContent from '@/components/admin/TaskDetailsModalContent';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Task, type TaskAttachment, type TaskComment, type TimeEntry } from '@/types';
import axios from 'axios';
import { PlusIcon, RefreshCcw } from 'lucide-react';
import React, {
    startTransition,
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';

type SchedulerType =
    | 'active_entry'
    | 'completed_entry'
    | 'inactive_in_progress'
    | 'assigned'
    | 'review'
    | 'blocked'
    | 'ticket'
    | 'working'
    | 'other';

interface SchedulerTask {
    id: number;
    label: string;
    type: SchedulerType;
    task: Task;
    timeEntry: TimeEntry;
    isPlanned?: boolean;
}

interface SchedulerDailyTask extends SchedulerTask {
    startHour: number;
    endHour: number;
}

interface SchedulerEmployee {
    id: number;
    name: string;
    role: string;
    initials: string;
    avatarBg: string;
    avatarColor: string;
    tasks: Record<string, SchedulerTask[]>;
    dailyTasks: Record<string, SchedulerDailyTask[]>;
    allTasks: SchedulerTask[];
}

interface AssignmentEmployee {
    id: number;
    name: string;
    email?: string;
}

type ViewMode = 'daily' | 'weekly' | 'monthly';

const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DAY_START = 8;
const DAY_END = 19;
const HOURS = Array.from(
    { length: DAY_END - DAY_START },
    (_, index) => DAY_START + index,
);

const HOUR_W = 150;
const ROW_H = 56;
const DAILY_ROW_MIN_H = 64;
const NAME_W = 220;
const HEADER_H = 44;
const GANTT_BAR_H = 40;
const GANTT_BAR_GAP = 8;

const CHIP_STYLES: Record<
    SchedulerType,
    { bg: string; color: string; border: string }
> = {
    active_entry: { bg: '#dafbe1', color: '#1a7f37', border: '#82e09a' },
    completed_entry: { bg: '#f3d9fa', color: '#8250df', border: '#d2a8ff' },
    inactive_in_progress: { bg: '#d1ecf9', color: '#0969da', border: '#79c0ff' },
    assigned: { bg: '#eaeef2', color: '#57606a', border: '#c9d1d9' },
    review: { bg: '#fff3cd', color: '#9a6700', border: '#f1c40f' },
    blocked: { bg: '#ffdcd7', color: '#cf222e', border: '#ff9492' },
    ticket: { bg: '#ffeff7', color: '#bf3989', border: '#ff80c8' },
    working: { bg: '#d2f4ea', color: '#116329', border: '#56d364' },
    other: { bg: '#e8f4f8', color: '#0969a2', border: '#a0cfef' },
};

function startOfDay(date: Date): Date {
    const copy = new Date(date);
    copy.setHours(0, 0, 0, 0);
    return copy;
}

function endOfDay(date: Date): Date {
    const copy = new Date(date);
    copy.setHours(23, 59, 59, 999);
    return copy;
}

function addDays(date: Date, amount: number): Date {
    const copy = new Date(date);
    copy.setDate(copy.getDate() + amount);
    return copy;
}

function mondayOf(date: Date): Date {
    const copy = startOfDay(date);
    const day = copy.getDay();
    return addDays(copy, day === 0 ? -6 : 1 - day);
}

function formatDateKey(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function fmtShort(date: Date): string {
    return date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
    });
}

function fmtHeaderDate(date: Date): string {
    return date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });
}

function fmtHour(hour: number): string {
    const wholeHour = Math.floor(hour);
    const suffix = wholeHour >= 12 ? 'PM' : 'AM';
    const display =
        wholeHour > 12 ? wholeHour - 12 : wholeHour === 0 ? 12 : wholeHour;

    return `${display}${suffix}`;
}

function fmtHourFull(hour: number): string {
    const wholeHour = Math.floor(hour);
    const minutes = Math.round((hour - wholeHour) * 60);
    const suffix = wholeHour >= 12 ? 'PM' : 'AM';
    const display =
        wholeHour > 12 ? wholeHour - 12 : wholeHour === 0 ? 12 : wholeHour;

    return minutes > 0
        ? `${display}:${String(minutes).padStart(2, '0')} ${suffix}`
        : `${display} ${suffix}`;
}

function buildGanttLayout(
    tasks: SchedulerTask[],
    days: Date[],
): { bars: Array<SchedulerTask & { start: number; span: number; lane: number }>; rowHeight: number; } {
    if (tasks.length === 0) {
        return { bars: [], rowHeight: ROW_H };
    }

    const bars = tasks
        .map((task) => {
            const span = getEntrySpan(task.timeEntry, days);
            if (!span) {
                return null;
            }

            return { ...task, ...span };
        })
        .filter(
            (
                task,
            ): task is SchedulerTask & {
                start: number;
                span: number;
            } => Boolean(task),
        )
        .sort((left, right) => left.start - right.start);

    const lanes: number[] = [];
    const placed = bars.map((task) => {
        const taskEnd = task.start + task.span - 1;
        let lane = lanes.findIndex((endIndex) => task.start > endIndex);

        if (lane === -1) {
            lane = lanes.length;
            lanes.push(taskEnd);
        } else {
            lanes[lane] = taskEnd;
        }

        return { ...task, lane };
    });

    const rowHeight = Math.max(
        ROW_H,
        placed.length === 0
            ? ROW_H
            : (Math.max(...placed.map((task) => task.lane)) + 1) *
            (GANTT_BAR_H + GANTT_BAR_GAP) +
            GANTT_BAR_GAP,
    );

    return { bars: placed, rowHeight };
}

function parseDateValue(value?: string | null): Date | null {
    if (!value) {
        return null;
    }

    const parsed = new Date(value);

    if (Number.isNaN(parsed.getTime())) {
        return null;
    }

    return parsed;
}

function getEntryStart(entry: TimeEntry): Date {
    return parseDateValue(entry.start_time) ?? startOfDay(new Date());
}

function getEntryEnd(entry: TimeEntry): Date {
    const start = getEntryStart(entry);
    const end = parseDateValue(entry.end_time) ?? new Date();

    if (end.getTime() <= start.getTime()) {
        return new Date(start.getTime() + 30 * 60 * 1000);
    }

    return end;
}

function formatEntryRange(entry: TimeEntry): string {
    const start = getEntryStart(entry);
    const end = getEntryEnd(entry);

    const startLabel = start.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
    });
    const endLabel = end.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
    });

    return `${startLabel} -> ${endLabel}`;
}

function formatEntryDateTime(date: Date): string {
    return date.toLocaleString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

function formatEntryDuration(entry: TimeEntry): string {
    const start = getEntryStart(entry);
    const end = getEntryEnd(entry);
    return formatDurationFromRange(start, end);
}

function clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
}

function parseDayKey(dayKey?: string): Date | null {
    if (!dayKey) {
        return null;
    }

    const parsed = new Date(`${dayKey}T00:00:00`);
    if (Number.isNaN(parsed.getTime())) {
        return null;
    }

    return parsed;
}

function toDateTimeLocalValue(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function roundToQuarterHour(date: Date): Date {
    const copy = new Date(date);
    const minutes = copy.getMinutes();
    const roundedMinutes = Math.round(minutes / 15) * 15;
    copy.setMinutes(roundedMinutes, 0, 0);
    return copy;
}

function withHour(day: Date, hour: number): Date {
    const next = startOfDay(day);
    const wholeHour = Math.floor(hour);
    const minutes = Math.round((hour - wholeHour) * 60);
    next.setHours(wholeHour, minutes, 0, 0);
    return next;
}

function formatDurationFromRange(start: Date, end: Date): string {
    const totalMinutes = Math.max(
        1,
        Math.round((end.getTime() - start.getTime()) / (60 * 1000)),
    );

    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    if (hours <= 0) {
        return `${minutes}m`;
    }

    if (minutes === 0) {
        return `${hours}h`;
    }

    return `${hours}h ${minutes}m`;
}

function hasDailyWindow(
    task: SchedulerTask,
): task is SchedulerTask & Pick<SchedulerDailyTask, 'startHour' | 'endHour'> {
    return 'startHour' in task && 'endHour' in task;
}

function overlapsRangeEntry(
    entry: TimeEntry,
    rangeStart: Date,
    rangeEnd: Date,
): boolean {
    const entryStart = getEntryStart(entry);
    const entryEnd = getEntryEnd(entry);
    return entryStart <= rangeEnd && entryEnd >= rangeStart;
}

function intersectsDayEntry(entry: TimeEntry, day: Date): boolean {
    return overlapsRangeEntry(entry, startOfDay(day), endOfDay(day));
}

function getTaskScheduleStart(task: Task): Date {
    return (
        parseDateValue(task.start_at) ??
        parseDateValue(task.created_at) ??
        startOfDay(new Date())
    );
}

function getTaskScheduleEnd(task: Task): Date {
    return (
        parseDateValue(task.completed_at) ??
        parseDateValue(task.due_at) ??
        parseDateValue(task.start_at) ??
        parseDateValue(task.created_at) ??
        endOfDay(new Date())
    );
}

function overlapsTaskRange(
    task: Task,
    rangeStart: Date,
    rangeEnd: Date,
): boolean {
    const taskStart = getTaskScheduleStart(task);
    const taskEnd = getTaskScheduleEnd(task);
    return taskStart <= rangeEnd && taskEnd >= rangeStart;
}


function getSchedulerType(task: Task, entry: TimeEntry): SchedulerType {
    if (entry.is_active) {
        return 'active_entry';
    }

    if (['Done', 'Cancelled', 'Rejected'].includes(task.state)) {
        return 'completed_entry';
    }

    if (task.state === 'InProgress' || task.state === 'InReview') {
        return 'inactive_in_progress';
    }

    if (task.ticket) {
        return 'ticket';
    }

    switch (task.state) {
        case 'Assigned':
        case 'Draft':
            return 'assigned';
        case 'Blocked':
            return 'blocked';
        default:
            return 'other';
    }
}

function getInitials(name: string): string {
    return name
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() ?? '')
        .join('');
}

function getAvatarPalette(seed: number): { bg: string; color: string } {
    const palette = [
        { bg: '#E6F1FB', color: '#185FA5' },
        { bg: '#FBEAF0', color: '#993556' },
        { bg: '#EAF3DE', color: '#3B6D11' },
        { bg: '#FAEEDA', color: '#854F0B' },
        { bg: '#EEEDFE', color: '#534AB7' },
        { bg: '#EDF4F4', color: '#16606D' },
    ];

    return palette[seed % palette.length];
}

function buildTaskLabel(task: Task): string {
    const base = task.title;
    return base.length > 40 ? `${base.slice(0, 37)}...` : base;
}

function getDailyEntryWindow(
    entry: TimeEntry,
    day: Date,
): { startHour: number; endHour: number } | null {
    if (!intersectsDayEntry(entry, day)) {
        return null;
    }

    const entryStart = getEntryStart(entry);
    const entryEnd = getEntryEnd(entry);
    const dayStart = new Date(day);
    dayStart.setHours(DAY_START, 0, 0, 0);
    const dayEnd = new Date(day);
    dayEnd.setHours(DAY_END, 0, 0, 0);

    const clippedStart = entryStart > dayStart ? entryStart : dayStart;
    const clippedEnd = entryEnd < dayEnd ? entryEnd : dayEnd;

    let startHour = clippedStart.getHours() + clippedStart.getMinutes() / 60;
    let endHour = clippedEnd.getHours() + clippedEnd.getMinutes() / 60;

    if (endHour <= startHour) {
        endHour = Math.min(startHour + 1, DAY_END);
    }

    if (startHour < DAY_START) {
        startHour = DAY_START;
    }

    if (endHour > DAY_END) {
        endHour = DAY_END;
    }

    if (endHour <= DAY_START || startHour >= DAY_END) {
        return null;
    }

    return { startHour, endHour };
}

function buildDailyBarLayout(tasks: SchedulerDailyTask[]): { bars: Array<SchedulerDailyTask & { lane: number }>; rowHeight: number; } {
    if (tasks.length === 0) {
        return { bars: [], rowHeight: DAILY_ROW_MIN_H };
    }

    const sorted = [...tasks].sort(
        (left, right) => left.startHour - right.startHour,
    );
    const lanes: number[] = [];
    const placed = sorted.map((task) => {
        let lane = lanes.findIndex(
            (endHour) => task.startHour >= endHour + 0.1,
        );

        if (lane === -1) {
            lane = lanes.length;
            lanes.push(task.endHour);
        } else {
            lanes[lane] = task.endHour;
        }

        return { ...task, lane };
    });

    const rowHeight = Math.max(
        DAILY_ROW_MIN_H,
        (Math.max(...placed.map((task) => task.lane)) + 1) *
        (GANTT_BAR_H + GANTT_BAR_GAP) +
        GANTT_BAR_GAP,
    );

    return { bars: placed, rowHeight };
}

function getEntrySpan(
    entry: TimeEntry,
    days: Date[],
): { start: number; span: number } | null {
    let startIndex = -1;
    let endIndex = -1;

    days.forEach((day, index) => {
        if (intersectsDayEntry(entry, day)) {
            if (startIndex === -1) {
                startIndex = index;
            }
            endIndex = index;
        }
    });

    if (startIndex === -1 || endIndex === -1) {
        return null;
    }

    return { start: startIndex, span: endIndex - startIndex + 1 };
}

function DailyTaskBlock({
    task,
    lane,
    onSelect,
    isPlanned = false,
}: {
    task: SchedulerDailyTask;
    lane: number;
    onSelect: (task: SchedulerTask) => void;
    isPlanned?: boolean;
}) {
    const style = CHIP_STYLES[task.type];
    const totalHours = DAY_END - DAY_START;
    const leftPct = ((task.startHour - DAY_START) / totalHours) * 100;
    const widthPct = ((task.endHour - task.startHour) / totalHours) * 100;
    const showTime = task.endHour - task.startHour >= 0.75;
    const barHeight = isPlanned ? 18 : GANTT_BAR_H;
    const isActiveEntry = task.timeEntry.is_active;
    const titleSuffix = isPlanned
        ? ' (Planned)'
        : isActiveEntry
            ? ' (Active)'
            : '';

    return (
        <button
            data-scheduler-task="true"
            title={`${task.task.title} / ${fmtHourFull(task.startHour)} - ${fmtHourFull(task.endHour)}${titleSuffix}`}
            onClick={() => onSelect(task)}
            style={{
                top: GANTT_BAR_GAP + lane * (GANTT_BAR_H + GANTT_BAR_GAP),
                left: `calc(${leftPct}% + 2px)`,
                width: `calc(${widthPct}% - 4px)`,
                minWidth: `120px`,
                height: barHeight,
                background: style.bg,
                border: `0.5px solid ${style.border}`,
                opacity: isPlanned ? 0.55 : 1,
            }}
            className='absolute rounded-lg px-2 py-1 text-left flex flex-col justify-center gap-1 overflow-hidden cursor-pointer shadow-md'
        >
            <span
                className='capitalize'
                style={{
                    fontSize: 11,
                    fontWeight: 500,
                    color: style.color,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    lineHeight: 1.4,
                }}
            >
                {task.task.title}
            </span>
            {showTime ? (
                <span
                    style={{
                        fontSize: 10,
                        color: style.color,
                        opacity: 0.7,
                        lineHeight: 1.3,
                        whiteSpace: 'nowrap',
                    }}
                >
                    {fmtHourFull(task.startHour)} - {fmtHourFull(task.endHour)}
                </span>
            ) : null}
        </button>
    );
}

function GanttBar({
    task,
    lane,
    left,
    width,
    onSelect,
}: {
    task: SchedulerTask;
    lane: number;
    left: number;
    width: number;
    onSelect: (task: SchedulerTask) => void;
}) {
    const style = CHIP_STYLES[task.type];
    const rangeLabel = formatEntryRange(task.timeEntry);
    const isWorking = task.type === 'working';
    const titleSuffix = task.isPlanned ? ' - Planned' : isWorking ? ' - Working' : '';

    return (
        <button
            data-scheduler-task="true"
            title={`${task.task.title} (${rangeLabel})${titleSuffix}`}
            onClick={() => onSelect(task)}
            style={{
                position: 'absolute',
                top: GANTT_BAR_GAP + lane * (GANTT_BAR_H + GANTT_BAR_GAP),
                left,
                width,
                height: GANTT_BAR_H,
                background: style.bg,
                border: `1px solid ${style.border}`,
                borderRadius: 8,
                padding: '4px 10px',
                overflow: 'hidden',
                cursor: 'pointer',
                textAlign: 'left',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                boxShadow: '0 1px 2px rgba(16, 24, 40, 0.06)',
                opacity: task.isPlanned ? 0.55 : 1,
            }}
        >
            <span
                style={{
                    fontSize: 12,
                    fontWeight: 500,
                    color: 'var(--color-text-primary)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                }}
            >
                {task.task.title}
            </span>
        </button>
    );
}

function DailyView({
    day,
    today,
    employees,
    onSelectTask,
    scale = 1,
}: {
    day: Date;
    today: Date;
    employees: SchedulerEmployee[];
    onSelectTask: (task: SchedulerTask) => void;
    scale?: number;
}) {
    const colWidth = HOUR_W * scale;
    const isToday = day.getTime() === today.getTime();
    const totalHours = DAY_END - DAY_START;
    const now = new Date();
    const nowHour = now.getHours() + now.getMinutes() / 60;
    const showNowLine = isToday && nowHour >= DAY_START && nowHour <= DAY_END;
    const nowPct = ((nowHour - DAY_START) / totalHours) * 100;
    const timelineWidth = HOURS.length * colWidth;
    const dayKey = formatDateKey(day);
    const dailyLayouts = useMemo(
        () =>
            employees.map((employee) =>
                buildDailyBarLayout(employee.dailyTasks[dayKey] ?? []),
            ),
        [employees, dayKey],
    );

    return (
        <div style={{ display: 'flex', overflowX: 'auto' }}>
            <div
                style={{
                    minWidth: NAME_W,
                    width: NAME_W,
                    flexShrink: 0,
                    borderRight: '0.5px solid #e0e0d8',
                    background: 'var(--color-background-primary, #ffffff)',
                    position: 'sticky',
                    left: 0,
                    zIndex: 5,
                }}
            >
                <div
                    style={{
                        height: HEADER_H,
                        display: 'flex',
                        alignItems: 'center',
                        padding: '0 16px',
                        borderBottom: '0.5px solid #e0e0d8',
                        background:
                            'var(--color-background-secondary, #f9f9f7)',
                        gap: 8,
                        position: 'sticky',
                        top: 0,
                        zIndex: 6,
                    }}
                >
                    <span
                        style={{
                            fontSize: 13,
                            fontWeight: 500,
                            color: 'var(--color-text-primary)',
                        }}
                    >
                        {day.toLocaleDateString('en-GB', {
                            weekday: 'long',
                            day: 'numeric',
                            month: 'long',
                        })}
                    </span>
                    {isToday ? (
                        <span
                            style={{
                                fontSize: 10,
                                fontWeight: 500,
                                padding: '2px 7px',
                                borderRadius: 10,
                                background: '#378ADD',
                                color: '#fff',
                            }}
                        >
                            Today
                        </span>
                    ) : null}
                </div>

                {employees.map((employee, index) => (
                    <div
                        key={employee.id}
                        style={{
                            height: dailyLayouts[index]?.rowHeight ?? DAILY_ROW_MIN_H,
                            display: 'flex',
                            alignItems: 'center',
                            padding: '0 16px',
                            gap: 10,
                            borderBottom:
                                index < employees.length - 1
                                    ? '0.5px solid #e0e0d8'
                                    : 'none',
                            background: 'var(--color-background-primary, #fff)',
                        }}
                    >
                        <div
                            style={{
                                width: 28,
                                height: 28,
                                borderRadius: '50%',
                                flexShrink: 0,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: 11,
                                fontWeight: 500,
                                background: employee.avatarBg,
                                color: employee.avatarColor,
                            }}
                        >
                            {employee.initials}
                        </div>
                        <div>
                            <div
                                style={{
                                    fontSize: 13,
                                    fontWeight: 500,
                                    color: 'var(--color-text-primary)',
                                }}
                            >
                                {employee.name}
                            </div>
                            <div
                                style={{
                                    fontSize: 11,
                                    color: 'var(--color-text-secondary, #888)',
                                }}
                            >
                                {employee.role}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div style={{ flex: 1, minWidth: timelineWidth }}>
                <div
                    style={{
                        height: HEADER_H,
                        display: 'flex',
                        borderBottom: '0.5px solid #e0e0d8',
                        background:
                            'var(--color-background-secondary, #f9f9f7)',
                        minWidth: timelineWidth,
                        position: 'sticky',
                        top: 0,
                        zIndex: 2,
                    }}
                >
                    {HOURS.map((hour) => {
                        const isCurrent =
                            isToday && hour === Math.floor(nowHour);

                        return (
                            <div
                                key={hour}
                                style={{
                                    minWidth: colWidth,
                                    width: colWidth,
                                    height: '100%',
                                    flexShrink: 0,
                                    display: 'flex',
                                    alignItems: 'center',
                                    paddingLeft: 8,
                                    borderRight: '0.5px solid #e0e0d8',
                                }}
                            >
                                <span
                                    style={{
                                        fontSize: 11,
                                        fontWeight: 500,
                                        color: isCurrent
                                            ? '#185FA5'
                                            : 'var(--color-text-tertiary, #aaa)',
                                    }}
                                >
                                    {fmtHour(hour)}
                                </span>
                            </div>
                        );
                    })}
                </div>

                <div style={{ position: 'relative', minWidth: timelineWidth }}>
                    <div
                        style={{
                            position: 'absolute',
                            top: 0,
                            bottom: 0,
                            left: 0,
                            right: 0,
                            display: 'flex',
                            pointerEvents: 'none',
                            zIndex: 0,
                        }}
                    >
                        {HOURS.map((hour) => (
                            <div
                                key={hour}
                                style={{
                                    minWidth: colWidth,
                                    width: colWidth,
                                    flexShrink: 0,
                                    borderRight: '0.5px solid #e0e0d8',
                                    background:
                                        hour === 12
                                            ? 'rgba(0,0,0,0.012)'
                                            : 'transparent',
                                }}
                            />
                        ))}
                    </div>

                    {showNowLine ? (
                        <div
                            style={{
                                position: 'absolute',
                                top: 0,
                                bottom: 0,
                                left: `${nowPct}%`,
                                width: 1.5,
                                background: '#E24B4A',
                                zIndex: 10,
                                pointerEvents: 'none',
                            }}
                        >
                            <div
                                style={{
                                    position: 'absolute',
                                    top: 0,
                                    left: -3,
                                    width: 7,
                                    height: 7,
                                    borderRadius: '50%',
                                    background: '#E24B4A',
                                }}
                            />
                        </div>
                    ) : null}

                    {employees.map((employee, index) => {
                        const layout = dailyLayouts[index] ?? {
                            bars: [],
                            rowHeight: DAILY_ROW_MIN_H,
                        };

                        return (
                            <div
                                key={employee.id}
                                data-timeline-daily-row-key={dayKey}
                                data-timeline-employee-id={String(employee.id)}
                                style={{
                                    height: layout.rowHeight,
                                    position: 'relative',
                                    cursor: 'cell',
                                    borderBottom:
                                        index < employees.length - 1
                                            ? '0.5px solid #e0e0d8'
                                            : 'none',
                                    zIndex: 1,
                                }}
                            >
                                {layout.bars.map((task) => (
                                    <DailyTaskBlock
                                        key={`${employee.id}-${task.id}-${task.startHour}`}
                                        task={task}
                                        lane={task.lane}
                                        onSelect={onSelectTask}
                                        isPlanned={Boolean(task.isPlanned)}
                                    />
                                ))}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

function GridView({
    days,
    today,
    employees,
    onSelectTask,
    scale = 1,
}: {
    days: Date[];
    today: Date;
    employees: SchedulerEmployee[];
    onSelectTask: (task: SchedulerTask) => void;
    scale?: number;
}) {
    const colWidth = (days.length > 20 ? 190 : days.length > 10 ? 210 : 230) * scale;
    const gridMinWidth = NAME_W + days.length * colWidth;
    const now = new Date();
    const nowDayStart = startOfDay(now);
    const nowPct = Math.min(
        1,
        Math.max(0, (now.getTime() - nowDayStart.getTime()) / (24 * 60 * 60 * 1000)),
    );
    const todayIndex = days.findIndex(
        (date) => date.getTime() === today.getTime(),
    );
    const showNowLine = todayIndex >= 0;
    const ganttLayouts = useMemo(
        () =>
            employees.map((employee) =>
                buildGanttLayout(employee.allTasks, days),
            ),
        [employees, days],
    );

    return (
        <div style={{ width: '100%', overflowX: 'auto' }}>
            <div
                style={{
                    minWidth: gridMinWidth,
                    display: 'flex',
                    flexDirection: 'column',
                    position: 'relative',
                }}
            >
                {showNowLine ? (
                    <div
                        style={{
                            position: 'absolute',
                            top: 0,
                            bottom: 0,
                            left:
                                NAME_W +
                                todayIndex * colWidth +
                                nowPct * colWidth,
                            width: 2,
                            background: '#E24B4A',
                            zIndex: 5,
                            pointerEvents: 'none',
                        }}
                    >
                        <div
                            style={{
                                position: 'absolute',
                                top: HEADER_H + 4,
                                left: -3,
                                width: 8,
                                height: 8,
                                borderRadius: '50%',
                                background: '#E24B4A',
                            }}
                        />
                    </div>
                ) : null}
                <div
                    style={{
                        height: HEADER_H,
                        display: 'flex',
                        borderBottom: '0.5px solid #e0e0d8',
                        background:
                            'var(--color-background-secondary, #f9f9f7)',
                        position: 'sticky',
                        top: 0,
                        zIndex: 3,
                    }}
                >
                    <div
                        style={{
                            minWidth: NAME_W,
                            width: NAME_W,
                            flexShrink: 0,
                            display: 'flex',
                            alignItems: 'center',
                            padding: '0 16px',
                            borderRight: '0.5px solid #e0e0d8',
                            background:
                                'var(--color-background-secondary, #f9f9f7)',
                            position: 'sticky',
                            left: 0,
                            zIndex: 4,
                        }}
                    >
                        <span
                            style={{
                                fontSize: 11,
                                fontWeight: 500,
                                color: 'var(--color-text-secondary, #888)',
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em',
                            }}
                        >
                            Employee
                        </span>
                    </div>

                    {days.map((date) => {
                        const isToday = date.getTime() === today.getTime();
                        const isWeekend =
                            date.getDay() === 0 || date.getDay() === 6;

                        return (
                            <div
                                key={formatDateKey(date)}
                                style={{
                                    minWidth: colWidth,
                                    width: colWidth,
                                    height: '100%',
                                    flexShrink: 0,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    borderRight: '0.5px solid #e0e0d8',
                                    background: isWeekend
                                        ? 'var(--color-background-secondary, #f9f9f7)'
                                        : 'transparent',
                                }}
                            >
                                <span
                                    style={{
                                        fontSize: 10,
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.06em',
                                        color: isToday
                                            ? '#185FA5'
                                            : 'var(--color-text-tertiary, #aaa)',
                                    }}
                                >
                                    {DOW[date.getDay()]}
                                </span>
                                {isToday ? (
                                    <span
                                        style={{
                                            padding: '2px 8px',
                                            borderRadius: 999,
                                            background: '#378ADD',
                                            color: '#fff',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: 12,
                                            fontWeight: 600,
                                            marginTop: 2,
                                        }}
                                    >
                                        {fmtHeaderDate(date)}
                                    </span>
                                ) : (
                                    <span
                                        style={{
                                            fontSize: 12,
                                            fontWeight: 600,
                                            marginTop: 2,
                                            color: isWeekend
                                                ? 'var(--color-text-tertiary, #aaa)'
                                                : 'var(--color-text-primary)',
                                        }}
                                    >
                                        {fmtHeaderDate(date)}
                                    </span>
                                )}
                            </div>
                        );
                    })}
                </div>

                {employees.map((employee, index) => {
                    const layout = ganttLayouts[index] ?? {
                        bars: [],
                        rowHeight: ROW_H,
                    };

                    return (
                        <div
                            key={employee.id}
                            style={{
                                minHeight: ROW_H,
                                height: layout.rowHeight,
                                display: 'flex',
                                borderBottom:
                                    index < employees.length - 1
                                        ? '0.5px solid #e0e0d8'
                                        : 'none',
                            }}
                        >
                            <div
                                style={{
                                    minWidth: NAME_W,
                                    width: NAME_W,
                                    flexShrink: 0,
                                    display: 'flex',
                                    alignItems: 'center',
                                    padding: '12px 16px',
                                    gap: 10,
                                    borderRight: '0.5px solid #e0e0d8',
                                    background: '#fff',
                                    position: 'sticky',
                                    left: 0,
                                    zIndex: 2,
                                }}
                            >
                                <div
                                    style={{
                                        width: 28,
                                        height: 28,
                                        borderRadius: '50%',
                                        flexShrink: 0,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: 11,
                                        fontWeight: 500,
                                        background: employee.avatarBg,
                                        color: employee.avatarColor,
                                    }}
                                >
                                    {employee.initials}
                                </div>
                                <div>
                                    <div
                                        style={{
                                            fontSize: 13,
                                            fontWeight: 500,
                                            color: 'var(--color-text-primary)',
                                        }}
                                    >
                                        {employee.name}
                                    </div>
                                    <div
                                        style={{
                                            fontSize: 11,
                                            color: 'var(--color-text-secondary, #888)',
                                        }}
                                    >
                                        {employee.role}
                                    </div>
                                </div>
                            </div>

                            <div
                                data-timeline-grid-row="true"
                                data-timeline-employee-id={String(employee.id)}
                                data-timeline-days-count={String(days.length)}
                                style={{
                                    position: 'relative',
                                    width: days.length * colWidth,
                                    height: layout.rowHeight,
                                    cursor: 'cell',
                                }}
                            >
                                <div
                                    style={{
                                        position: 'absolute',
                                        inset: 0,
                                        display: 'flex',
                                    }}
                                >
                                    {days.map((date) => {
                                        const isWeekend =
                                            date.getDay() === 0 ||
                                            date.getDay() === 6;

                                        return (
                                            <div
                                                key={`${employee.id}-bg-${formatDateKey(date)}`}
                                                style={{
                                                    minWidth: colWidth,
                                                    width: colWidth,
                                                    flexShrink: 0,
                                                    borderRight:
                                                        '0.5px solid #e0e0d8',
                                                    background: isWeekend
                                                        ? 'var(--color-background-secondary, #f9f9f7)'
                                                        : 'transparent',
                                                }}
                                            />
                                        );
                                    })}
                                </div>

                                <div
                                    style={{
                                        position: 'absolute',
                                        inset: 0,
                                        zIndex: 1,
                                    }}
                                >
                                    {layout.bars.map((task) => (
                                        <GanttBar
                                            key={`${employee.id}-${task.id}-${task.start}`}
                                            task={task}
                                            lane={task.lane}
                                            left={task.start * colWidth + 8}
                                            width={task.span * colWidth - 16}
                                            onSelect={onSelectTask}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

const MIN_SCALE = 0.5;
const MAX_SCALE = 2.0;
const SCALE_STEP = 0.1;

const TaskTimeline = () => {
    const today = useMemo(() => startOfDay(new Date()), []);
    const [anchorDate, setAnchorDate] = useState<Date>(() => today);
    const [view, setView] = useState<ViewMode>('daily');
    const [gridScale, setGridScale] = useState(1);
    const [employees, setEmployees] = useState<AssignmentEmployee[]>([]);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);
    const [selectedSchedulerTask, setSelectedSchedulerTask] =
        useState<SchedulerTask | null>(null);
    const [selectedEntryWindow, setSelectedEntryWindow] = useState<{
        start: Date;
        end: Date;
    } | null>(null);
    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
    const [taskDetails, setTaskDetails] = useState<Task | null>(null);
    const [taskAttachments, setTaskAttachments] = useState<TaskAttachment[]>(
        [],
    );
    const [taskComments, setTaskComments] = useState<TaskComment[]>([]);
    const [detailsLoading, setDetailsLoading] = useState(false);
    const [detailsError, setDetailsError] = useState<string | null>(null);
    const [refreshToken, setRefreshToken] = useState(0);
    const detailsAbortRef = useRef<AbortController | null>(null);
    const gridContainerRef = useRef<HTMLDivElement>(null);
    const contextMenuRef = useRef<HTMLDivElement>(null);
    const [isCreateTaskModalOpen, setIsCreateTaskModalOpen] = useState(false);
    const [createTaskError, setCreateTaskError] = useState<string | null>(null);
    const [isCreatingTask, setIsCreatingTask] = useState(false);
    const [createTaskForm, setCreateTaskForm] = useState({
        title: '',
        description: '',
        start_at: '',
        due_at: '',
        employee_id: '',
    });
    const [gridContextMenu, setGridContextMenu] = useState<{
        isOpen: boolean;
        x: number;
        y: number;
        datetime: Date;
        employeeId: string | null;
    }>({
        isOpen: false,
        x: 0,
        y: 0,
        datetime: roundToQuarterHour(new Date()),
        employeeId: null,
    });

    const closeGridContextMenu = useCallback(() => {
        setGridContextMenu((prev) =>
            prev.isOpen ? { ...prev, isOpen: false } : prev,
        );
    }, []);

    const openGridContextMenu = useCallback(
        (x: number, y: number, datetime: Date, employeeId: string | null) => {
            setGridContextMenu({ isOpen: true, x, y, datetime, employeeId });
        },
        [],
    );

    const weekStart = useMemo(() => mondayOf(anchorDate), [anchorDate]);

    const days = useMemo<Date[]>(() => {
        if (view === 'daily') {
            return [anchorDate];
        }

        const count = view === 'monthly' ? 28 : 7;
        return Array.from({ length: count }, (_, index) =>
            addDays(weekStart, index),
        );
    }, [anchorDate, view, weekStart]);

    const rangeStart = useMemo(
        () => startOfDay(days[0] ?? today),
        [days, today],
    );
    const rangeEnd = useMemo(
        () => endOfDay(days[days.length - 1] ?? today),
        [days, today],
    );

    const resolveContextMenuTarget = useCallback(
        (
            event: React.MouseEvent<HTMLDivElement>,
        ): { datetime: Date; employeeId: string | null } => {
            const target = event.target as HTMLElement | null;
            const nowRounded = roundToQuarterHour(new Date());
            const fallbackDateTime = withHour(anchorDate, nowRounded.getHours() + nowRounded.getMinutes() / 60);

            if (!target) {
                return {
                    datetime: fallbackDateTime,
                    employeeId: null,
                };
            }

            const dayNode = target.closest('[data-timeline-day-key]') as
                | HTMLElement
                | null;

            if (dayNode) {
                const dayKey = dayNode.dataset.timelineDayKey;
                const hourValue = dayNode.dataset.timelineHour;
                const parsedDay = parseDayKey(dayKey);
                const employeeId =
                    dayNode.dataset.timelineEmployeeId ??
                    (dayNode.closest('[data-timeline-employee-id]') as HTMLElement | null)
                        ?.dataset.timelineEmployeeId ??
                    null;

                if (parsedDay) {
                    if (hourValue) {
                        const parsedHour = Number(hourValue);
                        if (!Number.isNaN(parsedHour)) {
                            return {
                                datetime: roundToQuarterHour(withHour(parsedDay, parsedHour)),
                                employeeId,
                            };
                        }
                    }

                    return {
                        datetime: roundToQuarterHour(withHour(parsedDay, 9)),
                        employeeId,
                    };
                }
            }

            const dailyRow = target.closest('[data-timeline-daily-row-key]') as
                | HTMLElement
                | null;

            if (dailyRow) {
                const dayKey = dailyRow.dataset.timelineDailyRowKey;
                const employeeId = dailyRow.dataset.timelineEmployeeId ?? null;
                const parsedDay = parseDayKey(dayKey);
                const rect = dailyRow.getBoundingClientRect();
                const x = clamp(event.clientX - rect.left, 0, rect.width);
                const totalHours = DAY_END - DAY_START;
                const hour = DAY_START + (x / Math.max(rect.width, 1)) * totalHours;

                if (parsedDay) {
                    return {
                        datetime: roundToQuarterHour(withHour(parsedDay, hour)),
                        employeeId,
                    };
                }
            }

            const gridRow = target.closest('[data-timeline-grid-row="true"]') as
                | HTMLElement
                | null;

            if (gridRow) {
                const employeeId = gridRow.dataset.timelineEmployeeId ?? null;
                const daysCount = Number(gridRow.dataset.timelineDaysCount);
                const rect = gridRow.getBoundingClientRect();
                const x = clamp(event.clientX - rect.left, 0, rect.width);
                if (!Number.isNaN(daysCount) && daysCount > 0) {
                    const dayWidth = rect.width / daysCount;
                    const dayIndex = clamp(Math.floor(x / dayWidth), 0, daysCount - 1);
                    const selectedDay = days[dayIndex] ?? anchorDate;
                    const dayProgress = (x - dayIndex * dayWidth) / dayWidth;
                    const hour = clamp(dayProgress, 0, 1) * 24;

                    return {
                        datetime: roundToQuarterHour(withHour(selectedDay, hour)),
                        employeeId,
                    };
                }
            }

            return {
                datetime: fallbackDateTime,
                employeeId:
                    (target.closest('[data-timeline-employee-id]') as HTMLElement | null)
                        ?.dataset.timelineEmployeeId ?? null,
            };
        },
        [anchorDate, days],
    );

    const handleGridMenuTrigger = useCallback(
        (event: React.MouseEvent<HTMLDivElement>) => {
            const target = event.target as HTMLElement | null;
            if (!target) {
                return;
            }

            if (target.closest('[data-scheduler-task="true"]')) {
                closeGridContextMenu();
                return;
            }

            const { datetime, employeeId } = resolveContextMenuTarget(event);
            openGridContextMenu(event.clientX, event.clientY, datetime, employeeId);
        },
        [closeGridContextMenu, openGridContextMenu, resolveContextMenuTarget],
    );

    useEffect(() => {
        const handleWheel = (e: WheelEvent) => {
            if (e.ctrlKey && gridContainerRef.current) {
                e.preventDefault();
                const delta = -Math.sign(e.deltaY) * SCALE_STEP;
                setGridScale((prev) =>
                    Math.max(MIN_SCALE, Math.min(MAX_SCALE, prev + delta)),
                );
            }
        };

        const container = gridContainerRef.current;
        if (container) {
            container.addEventListener('wheel', handleWheel, { passive: false });
        }

        return () => {
            if (container) {
                container.removeEventListener('wheel', handleWheel);
            }
        };
    }, []);

    useEffect(() => {
        if (!gridContextMenu.isOpen) {
            return;
        }

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                closeGridContextMenu();
            }
        };

        const handleResize = () => {
            closeGridContextMenu();
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('resize', handleResize);
        };
    }, [closeGridContextMenu, gridContextMenu.isOpen]);

    useEffect(() => {
        if (!gridContextMenu.isOpen) {
            return;
        }

        const frame = window.requestAnimationFrame(() => {
            const menu = contextMenuRef.current;
            if (!menu) {
                return;
            }

            const rect = menu.getBoundingClientRect();
            const padding = 8;
            const maxX = window.innerWidth - padding - rect.width;
            const maxY = window.innerHeight - padding - rect.height;

            const nextX = Math.max(padding, Math.min(gridContextMenu.x, maxX));
            const nextY = Math.max(padding, Math.min(gridContextMenu.y, maxY));

            if (nextX === gridContextMenu.x && nextY === gridContextMenu.y) {
                return;
            }

            setGridContextMenu((prev) =>
                prev.isOpen ? { ...prev, x: nextX, y: nextY } : prev,
            );
        });

        return () => {
            window.cancelAnimationFrame(frame);
        };
    }, [gridContextMenu.isOpen, gridContextMenu.x, gridContextMenu.y]);

    useEffect(() => {
        let active = true;

        axios
            .get('/admin/data/users/assignment')
            .then((response) => {
                if (!active) {
                    return;
                }

                setEmployees(response.data.users ?? []);
            })
            .catch(() => {
                if (!active) {
                    return;
                }

                setEmployees([]);
            });

        return () => {
            active = false;
        };
    }, []);

    useEffect(() => {
        let active = true;
        startTransition(() => {
            setLoading(true);
            setErrorMessage(null);
        });

        axios
            .get('/data/all/tasks', {
                params: {
                    from_date: formatDateKey(rangeStart),
                    to_date: formatDateKey(rangeEnd),
                },
            })
            .then((response) => {
                if (!active) {
                    return;
                }

                const nextTasks = response.data.data ?? [];
                const tasksWithEntries = nextTasks.filter((task: Task) =>
                    (task.time_entries ?? []).some((entry: TimeEntry) =>
                        overlapsRangeEntry(entry, rangeStart, rangeEnd),
                    ),
                );

                setTasks(nextTasks);
                if (tasksWithEntries.length > 0) {
                    setSelectedTaskId((current) =>
                        current &&
                            tasksWithEntries.some((task: Task) => task.id === current)
                            ? current
                            : tasksWithEntries[0].id,
                    );
                } else {
                    setSelectedTaskId(null);
                }
            })
            .catch(() => {
                if (!active) {
                    return;
                }

                setTasks([]);
                setSelectedTaskId(null);
                setErrorMessage('Unable to load task data for this period.');
            })
            .finally(() => {
                if (!active) {
                    return;
                }

                setLoading(false);
            });

        return () => {
            active = false;
        };
    }, [rangeEnd, rangeStart, refreshToken]);

    const schedulerEmployees = useMemo<SchedulerEmployee[]>(() => {
        const employeeMap = new Map<number, AssignmentEmployee>();
        employees.forEach((employee) => {
            employeeMap.set(employee.id, employee);
        });

        const timeEntryRows = tasks.flatMap((task) =>
            (task.time_entries ?? []).map((entry) => ({
                task,
                entry,
            })),
        );

        tasks.forEach((task) => {
            task.assigned_users?.forEach((user) => {
                if (!employeeMap.has(user.id)) {
                    employeeMap.set(user.id, {
                        id: user.id,
                        name: user.name,
                        email: user.email,
                    });
                }
            });
        });

        timeEntryRows.forEach(({ entry }) => {
            if (!employeeMap.has(entry.user_id)) {
                employeeMap.set(entry.user_id, {
                    id: entry.user_id,
                    name: `User ${entry.user_id}`,
                });
            }
        });

        return Array.from(employeeMap.values())
            .map((employee) => {
                const palette = getAvatarPalette(employee.id);
                const entryMap = new Map<number, SchedulerTask>();
                const scheduleEmployee: SchedulerEmployee = {
                    id: employee.id,
                    name: employee.name,
                    role: employee.email || 'Task Owner',
                    initials: getInitials(employee.name),
                    avatarBg: palette.bg,
                    avatarColor: palette.color,
                    tasks: {},
                    dailyTasks: {},
                    allTasks: [],
                };

                days.forEach((day) => {
                    const dayKey = formatDateKey(day);
                    scheduleEmployee.tasks[dayKey] = [];
                    scheduleEmployee.dailyTasks[dayKey] = [];
                });

                const employeeEntries = timeEntryRows.filter(
                    ({ entry }) => entry.user_id === employee.id,
                );

                if (view === 'daily') {
                    const taskIdsWithEntries = new Set<number>();

                    employeeEntries.forEach(({ task, entry }) => {
                        if (!overlapsRangeEntry(entry, rangeStart, rangeEnd)) {
                            return;
                        }

                        taskIdsWithEntries.add(task.id);

                        const schedulerEntry: SchedulerTask = {
                            id: entry.id,
                            label: buildTaskLabel(task),
                            type: getSchedulerType(task, entry),
                            task,
                            timeEntry: entry,
                        };

                        entryMap.set(entry.id, schedulerEntry);

                        days.forEach((day) => {
                            if (!intersectsDayEntry(entry, day)) {
                                return;
                            }

                            const dayKey = formatDateKey(day);
                            const window = getDailyEntryWindow(entry, day);
                            if (window) {
                                scheduleEmployee.dailyTasks[dayKey].push({
                                    ...schedulerEntry,
                                    ...window,
                                });
                            }
                        });
                    });

                    tasks.forEach((task) => {
                        if (task.state !== 'Draft') {
                            return;
                        }

                        const assignedToEmployee = task.assigned_users?.some(
                            (user) => user.id === employee.id,
                        );

                        if (!assignedToEmployee || taskIdsWithEntries.has(task.id)) {
                            return;
                        }

                        if (!overlapsTaskRange(task, rangeStart, rangeEnd)) {
                            return;
                        }

                        const plannedEntry: TimeEntry = {
                            id: task.id,
                            task_id: task.id,
                            user_id: employee.id,
                            start_time: getTaskScheduleStart(task).toISOString(),
                            end_time: getTaskScheduleEnd(task).toISOString(),
                            is_active: false,
                        };

                        const schedulerEntry: SchedulerTask = {
                            id: task.id,
                            label: buildTaskLabel(task),
                            type: 'assigned',
                            task,
                            timeEntry: plannedEntry,
                            isPlanned: true,
                        };

                        entryMap.set(task.id, schedulerEntry);

                        days.forEach((day) => {
                            const dayKey = formatDateKey(day);
                            const window = getDailyEntryWindow(plannedEntry, day);
                            if (window) {
                                scheduleEmployee.dailyTasks[dayKey].push({
                                    ...schedulerEntry,
                                    ...window,
                                });
                            }
                        });
                    });
                } else {
                    const groupedEntries = new Map<
                        number,
                        { task: Task; entries: TimeEntry[] }
                    >();

                    employeeEntries.forEach(({ task, entry }) => {
                        if (!overlapsRangeEntry(entry, rangeStart, rangeEnd)) {
                            return;
                        }

                        const bucket = groupedEntries.get(task.id) ?? {
                            task,
                            entries: [],
                        };
                        bucket.entries.push(entry);
                        groupedEntries.set(task.id, bucket);
                    });

                    groupedEntries.forEach(({ task, entries }) => {
                        const entryStarts = entries.map((entry) =>
                            getEntryStart(entry).getTime(),
                        );
                        const entryEnds = entries.map((entry) =>
                            getEntryEnd(entry).getTime(),
                        );

                        const aggregatedEntry: TimeEntry = {
                            id: task.id,
                            task_id: task.id,
                            user_id: employee.id,
                            start_time: new Date(
                                Math.min(...entryStarts),
                            ).toISOString(),
                            end_time: new Date(Math.max(...entryEnds)).toISOString(),
                            is_active: false,
                        };

                        const schedulerEntry: SchedulerTask = {
                            id: task.id,
                            label: buildTaskLabel(task),
                            type: getSchedulerType(task, aggregatedEntry),
                            task,
                            timeEntry: aggregatedEntry,
                        };

                        entryMap.set(task.id, schedulerEntry);
                    });

                    const taskIdsWithEntries = new Set(groupedEntries.keys());
                    const pendingStates = new Set([
                        'Draft',
                        'Assigned',
                        'Blocked',
                    ]);

                    tasks.forEach((task) => {
                        if (!pendingStates.has(task.state)) {
                            return;
                        }

                        const assignedToEmployee = task.assigned_users?.some(
                            (user) => user.id === employee.id,
                        );

                        if (!assignedToEmployee) {
                            return;
                        }

                        if (taskIdsWithEntries.has(task.id)) {
                            return;
                        }

                        if (!overlapsTaskRange(task, rangeStart, rangeEnd)) {
                            return;
                        }

                        const plannedEntry: TimeEntry = {
                            id: task.id,
                            task_id: task.id,
                            user_id: employee.id,
                            start_time: getTaskScheduleStart(task).toISOString(),
                            end_time: getTaskScheduleEnd(task).toISOString(),
                            is_active: false,
                        };

                        const schedulerEntry: SchedulerTask = {
                            id: task.id,
                            label: buildTaskLabel(task),
                            type: 'assigned',
                            task,
                            timeEntry: plannedEntry,
                            isPlanned: task.state === 'Draft',
                        };

                        entryMap.set(task.id, schedulerEntry);
                    });
                }

                scheduleEmployee.allTasks = Array.from(entryMap.values()).sort(
                    (left, right) =>
                        getEntryStart(left.timeEntry).getTime() -
                        getEntryStart(right.timeEntry).getTime(),
                );

                Object.keys(scheduleEmployee.tasks).forEach((dayKey) => {
                    scheduleEmployee.dailyTasks[dayKey].sort(
                        (left, right) => left.startHour - right.startHour,
                    );
                });

                return scheduleEmployee;
            });
    }, [days, employees, rangeEnd, rangeStart, tasks, view]);

    const schedulerEmployeeById = useMemo(() => {
        const map = new Map<number, SchedulerEmployee>();
        schedulerEmployees.forEach((employee) => map.set(employee.id, employee));
        return map;
    }, [schedulerEmployees]);

    function goToday(): void {
        setAnchorDate(today);
    }

    function shift(direction: -1 | 1): void {
        setAnchorDate((previous) => {
            if (view === 'daily') {
                return addDays(previous, direction);
            }

            return addDays(previous, direction * (view === 'monthly' ? 28 : 7));
        });
    }

    function selectTask(schedulerTask: SchedulerTask): void {
        setSelectedTaskId(schedulerTask.task.id);
        setSelectedSchedulerTask(schedulerTask);
        if (view === 'daily' && hasDailyWindow(schedulerTask)) {
            const dayStart = startOfDay(anchorDate);
            const start = new Date(dayStart);
            start.setHours(
                Math.floor(schedulerTask.startHour),
                Math.round((schedulerTask.startHour % 1) * 60),
                0,
                0,
            );

            const end = new Date(dayStart);
            end.setHours(
                Math.floor(schedulerTask.endHour),
                Math.round((schedulerTask.endHour % 1) * 60),
                0,
                0,
            );

            setSelectedEntryWindow({ start, end });
        } else {
            setSelectedEntryWindow(null);
        }
        setTaskDetails(null);
        setTaskAttachments([]);
        setTaskComments([]);
        setDetailsError(null);
        setDetailsLoading(true);
        setIsTaskModalOpen(true);
    }

    function closeTaskModal(): void {
        if (detailsAbortRef.current) {
            detailsAbortRef.current.abort();
            detailsAbortRef.current = null;
        }

        setSelectedSchedulerTask(null);
        setSelectedEntryWindow(null);
        setTaskDetails(null);
        setTaskAttachments([]);
        setTaskComments([]);
        setDetailsError(null);
        setDetailsLoading(false);
        setIsTaskModalOpen(false);
    }

    useEffect(() => {
        if (!isTaskModalOpen || !selectedTaskId) {
            return;
        }

        const controller = new AbortController();
        detailsAbortRef.current = controller;

        Promise.all([
            axios.get(`/data/tasks/${selectedTaskId}`, {
                signal: controller.signal,
            }),
            axios.get(`/data/tasks/${selectedTaskId}/attachments`, {
                signal: controller.signal,
            }),
            axios.get(`/data/tasks/${selectedTaskId}/comments`, {
                signal: controller.signal,
            }),
        ])
            .then(([taskResponse, attachmentResponse, commentResponse]) => {
                const responseTask =
                    taskResponse.data?.data ?? taskResponse.data;
                const responseAttachments =
                    attachmentResponse.data?.data ??
                    attachmentResponse.data ??
                    [];
                const responseComments =
                    commentResponse.data?.data ?? commentResponse.data ?? [];

                setTaskDetails(responseTask ?? null);
                setTaskAttachments(responseAttachments);
                setTaskComments(responseComments);
            })
            .catch((error) => {
                if (
                    error?.name === 'CanceledError' ||
                    error?.code === 'ERR_CANCELED'
                ) {
                    return;
                }

                setDetailsError('Unable to load task details.');
            })
            .finally(() => {
                if (!controller.signal.aborted) {
                    setDetailsLoading(false);
                }
            });

        return () => {
            controller.abort();
        };
    }, [isTaskModalOpen, selectedTaskId]);

    const dateLabel =
        view === 'daily'
            ? fmtShort(anchorDate)
            : `${fmtShort(days[0])} - ${fmtShort(days[days.length - 1])}`;

    const selectedTask = useMemo(() => {
        if (!selectedTaskId) {
            return null;
        }

        return tasks.find((task) => task.id === selectedTaskId) ?? null;
    }, [selectedTaskId, tasks]);

    const selectedEntryOwner = useMemo(() => {
        if (!selectedSchedulerTask) {
            return null;
        }

        const employee =
            schedulerEmployeeById.get(selectedSchedulerTask.timeEntry.user_id) ??
            null;

        if (employee) {
            return employee;
        }

        return {
            id: selectedSchedulerTask.timeEntry.user_id,
            name: `User ${selectedSchedulerTask.timeEntry.user_id}`,
            role: 'Task Owner',
            initials: 'U',
            avatarBg: '#eaeef2',
            avatarColor: '#57606a',
            tasks: {},
            dailyTasks: {},
            allTasks: [],
        } satisfies SchedulerEmployee;
    }, [schedulerEmployeeById, selectedSchedulerTask]);

    const selectedEntryStyle = selectedSchedulerTask
        ? CHIP_STYLES[selectedSchedulerTask.type]
        : null;
    const selectedEntryStart = selectedSchedulerTask
        ? (selectedEntryWindow?.start ?? getEntryStart(selectedSchedulerTask.timeEntry))
        : null;
    const selectedEntryEnd = selectedSchedulerTask
        ? (selectedEntryWindow?.end ?? getEntryEnd(selectedSchedulerTask.timeEntry))
        : null;
    const selectedEntryDuration = selectedSchedulerTask
        ? selectedEntryStart && selectedEntryEnd
            ? formatDurationFromRange(selectedEntryStart, selectedEntryEnd)
            : formatEntryDuration(selectedSchedulerTask.timeEntry)
        : null;
    const selectedEntrySubtitle =
        selectedEntryStart && selectedEntryEnd
            ? `${formatEntryDateTime(selectedEntryStart)} - ${formatEntryDateTime(selectedEntryEnd)}`
            : selectedSchedulerTask
                ? formatEntryRange(selectedSchedulerTask.timeEntry)
                : null;

    const buttonStyle: React.CSSProperties = {
        fontSize: 12,
        padding: '5px 12px',
        border: '0.5px solid #ccc',
        borderRadius: 8,
        background: 'var(--color-background-primary, #fff)',
        color: 'var(--color-text-secondary, #888)',
        cursor: 'pointer',
    };

    const contextTargetLabel = formatEntryDateTime(gridContextMenu.datetime);

    const resetCreateTaskForm = useCallback(
        (datetime: Date, employeeId: string | null = null) => {
            const roundedStart = roundToQuarterHour(datetime);
            const roundedEnd = new Date(roundedStart);
            roundedEnd.setHours(roundedEnd.getHours() + 1);

            setCreateTaskForm({
                title: '',
                description: '',
                start_at: toDateTimeLocalValue(roundedStart),
                due_at: toDateTimeLocalValue(roundedEnd),
                employee_id: employeeId ?? '',
            });
            setCreateTaskError(null);
        },
        [],
    );

    const handleCreateTaskSubmit = async (
        event: React.FormEvent<HTMLFormElement>,
    ): Promise<void> => {
        event.preventDefault();
        setCreateTaskError(null);

        if (!createTaskForm.title.trim()) {
            setCreateTaskError('Task title is required.');
            return;
        }

        if (!createTaskForm.due_at) {
            setCreateTaskError('Due date is required.');
            return;
        }

        if (!createTaskForm.employee_id) {
            setCreateTaskError('Please select an employee.');
            return;
        }

        setIsCreatingTask(true);

        try {
            const taskResponse = await axios.post('/admin/tasks', {
                title: createTaskForm.title.trim(),
                description: createTaskForm.description.trim() || null,
                start_at: createTaskForm.start_at || null,
                due_at: createTaskForm.due_at,
                state: 'Assigned',
            });

            const taskId = taskResponse.data.task?.id ?? taskResponse.data.id;
            if (taskId) {
                await axios.post(`/admin/tasks/${taskId}/assign`, {
                    user_id: Number(createTaskForm.employee_id),
                });
            }

            setIsCreateTaskModalOpen(false);
            setRefreshToken((previous) => previous + 1);
        } catch (error) {
            if (axios.isAxiosError(error) && error.response?.data?.message) {
                setCreateTaskError(String(error.response.data.message));
            } else {
                setCreateTaskError('Failed to create task. Please try again.');
            }
        } finally {
            setIsCreatingTask(false);
        }
    };

    const handleContextMenuAction = (action: string, datetime: Date) => {
        switch (action) {
            case 'refresh':
                setRefreshToken((previous) => previous + 1);
                break;
            case 'create':
                resetCreateTaskForm(datetime, gridContextMenu.employeeId);
                setIsCreateTaskModalOpen(true);
                break;
            case 'copy':
                void navigator.clipboard
                    .writeText(datetime.toISOString())
                    .catch(() => {
                        window.alert('Unable to copy datetime to clipboard.');
                    });
                break;
            default:
                break;
        }
        closeGridContextMenu();
    };


    return (
        <div
            style={{
                padding: '24px 20px',
                fontFamily: 'inherit',
                background: 'var(--color-background-tertiary, #f5f5f3)',
                minHeight: '100vh',
            }}
        >
            <style>{`
                @keyframes pulse {
                    0%, 100% { opacity: 1; transform: scale(1); }
                    50% { opacity: 0.5; transform: scale(1.2); }
                }
            `}</style>
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 16,
                    flexWrap: 'wrap',
                    gap: 8,
                }}
            >
                <div>
                    <p
                        style={{
                            fontSize: 18,
                            fontWeight: 500,
                            color: 'var(--color-text-primary)',
                            margin: 0,
                        }}
                    >
                        Timeline Schedule - In Progress Tasks
                    </p>
                    <p
                        style={{
                            fontSize: 12,
                            margin: '4px 0 0',
                            color: 'var(--color-text-secondary, #888)',
                        }}
                    >
                        Live time entry data in the sample scheduler, with real task cards for the visible period.
                    </p>
                    <p
                        style={{
                            fontSize: 12,
                            margin: '4px 0 0',
                            color: 'var(--color-text-secondary, #888)',
                        }}
                    >
                        Note: Please use <code>Shift + Scroll</code> to scroll horizontally and <code>Ctrl + Scroll</code> to zoom in/out the grid.
                    </p>
                </div>

                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        flexWrap: 'wrap',
                    }}
                >
                    <span
                        style={{
                            fontSize: 12,
                            color: 'var(--color-text-secondary, #888)',
                        }}
                    >
                        View
                    </span>
                    <select
                        style={{
                            fontSize: 13,
                            padding: '5px 10px',
                            border: '0.5px solid #ccc',
                            borderRadius: 8,
                            background: 'var(--color-background-primary, #fff)',
                            color: 'var(--color-text-primary)',
                            height: 32,
                        }}
                        value={view}
                        onChange={(event) =>
                            setView(event.target.value as ViewMode)
                        }
                    >
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                    </select>

                    <span
                        style={{
                            fontSize: 12,
                            color: 'var(--color-text-secondary, #888)',
                            marginLeft: 4,
                        }}
                    >
                        {dateLabel}
                    </span>

                    <div style={{ flex: 1 }} />
                    <button style={buttonStyle} onClick={goToday}>
                        Today
                    </button>
                    <button style={buttonStyle} onClick={() => shift(-1)}>
                        Prev
                    </button>
                    <button style={buttonStyle} onClick={() => shift(1)}>
                        Next
                    </button>
                </div>
            </div>

                <div
                    ref={gridContainerRef}
                    onClick={handleGridMenuTrigger}
                    onContextMenu={(event) => event.preventDefault()}
                    onScroll={closeGridContextMenu}
                    style={{
                        background: 'var(--color-background-primary, #fff)',
                        border: '0.5px solid #e0e0d8',
                        borderRadius: 12,
                        overflowX: 'auto',
                    overflowY: 'hidden',
                    cursor: 'cell',
                }}
            >
                <div
                    style={{
                        transform: `scaleX(${gridScale})`,
                        transformOrigin: 'top left',
                        width: gridScale === 1 ? '100%' : `${100 / gridScale}%`,
                    }}
                >
                    {loading ? (
                        <div
                            style={{
                                padding: '40px 20px',
                                textAlign: 'center',
                                color: 'var(--color-text-secondary, #888)',
                                fontSize: 14,
                            }}
                        >
                            Loading scheduler data...
                        </div>
                    ) : schedulerEmployees.length === 0 ? (
                        <div
                            style={{
                                padding: '40px 20px',
                                textAlign: 'center',
                                color: 'var(--color-text-secondary, #888)',
                                fontSize: 14,
                            }}
                        >
                            {errorMessage ?? 'No assigned tasks were found for the selected period.'}
                        </div>
                    ) : view === 'daily' ? (
                        <DailyView
                            day={anchorDate}
                            today={today}
                            employees={schedulerEmployees}
                            onSelectTask={selectTask}
                            scale={gridScale}
                        />
                    ) : (
                        <GridView
                            days={days}
                            today={today}
                            employees={schedulerEmployees}
                            onSelectTask={selectTask}
                            scale={gridScale}
                        />
                    )}
                </div>
            </div>

            {gridContextMenu.isOpen ? (
                <>
                    <div
                        className="fixed inset-0 z-[9998]"
                        onMouseDown={closeGridContextMenu}
                        onContextMenu={(event) => {
                            event.preventDefault();
                            closeGridContextMenu();
                        }}
                    />
                    <div
                        ref={contextMenuRef}
                        role="menu"
                        aria-label="Grid actions"
                        className="fixed z-[9999] min-w-[12rem] rounded-md border bg-background p-1 shadow-lg"
                        style={{ left: gridContextMenu.x, top: gridContextMenu.y }}
                        onMouseDown={(event) => event.stopPropagation()}
                        onContextMenu={(event) => event.preventDefault()}
                    >
                        <div className="px-2.5 py-2 text-[11px] font-medium text-muted-foreground">
                            {contextTargetLabel}
                        </div>
                        <div className="my-1 h-px bg-border" />
                        <button
                            type="button"
                            role="menuitem"
                            className="flex w-full items-center justify-between rounded px-2.5 py-2 text-left text-sm hover:bg-muted"
                            onClick={() => {
                                handleContextMenuAction('refresh', gridContextMenu.datetime);
                            }}
                        >
                            Refresh
                            <RefreshCcw className='h-4 w-4'/>
                        </button>
                        <button
                            type="button"
                            role="menuitem"
                            className="flex w-full items-center justify-between rounded px-2.5 py-2 text-left text-sm hover:bg-muted"
                            onClick={() => {
                                handleContextMenuAction('create', gridContextMenu.datetime);
                            }}
                        >
                            Create task
                            <PlusIcon className='h-4 w-4'/>
                        </button>
                        
                        <div className="my-1 h-px bg-border" />
                        <button
                            type="button"
                            role="menuitem"
                            className="flex w-full items-center justify-between rounded px-2.5 py-2 text-left text-sm hover:bg-muted"
                            onClick={()=>{
                                handleContextMenuAction('copy', gridContextMenu.datetime);
                            }}
                        >
                            Copy date time
                        </button>
                    </div>
                </>
            ) : null}

            {view === 'daily' ? (
                <div
                    style={{
                        display: 'flex',
                        gap: 12,
                        marginTop: 12,
                        flexWrap: 'wrap',
                        alignItems: 'center',
                    }}
                >
                    {(Object.keys(CHIP_STYLES) as SchedulerType[]).map(
                        (type) => (
                            <div
                                key={type}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 5,
                                }}
                            >
                                <div
                                    style={{
                                        width: 10,
                                        height: 10,
                                        borderRadius: 3,
                                        background: CHIP_STYLES[type].bg,
                                        border: `0.5px solid ${CHIP_STYLES[type].border}`,
                                    }}
                                />
                                <span
                                    style={{
                                        fontSize: 11,
                                        color: 'var(--color-text-secondary, #888)',
                                        textTransform: 'capitalize',
                                    }}
                                >
                                    {type.replace('_', ' ')}
                                </span>
                            </div>
                        ),
                    )}
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 5,
                        }}
                    >
                        <div
                            style={{
                                width: 10,
                                height: 10,
                                borderRadius: 3,
                                background: '#E24B4A',
                            }}
                        />
                        <span
                            style={{
                                fontSize: 11,
                                color: 'var(--color-text-secondary, #888)',
                            }}
                        >
                            current time
                        </span>
                    </div>
                </div>
            ) : null}

            <Dialog
                open={isCreateTaskModalOpen}
                onOpenChange={(open) => {
                    setIsCreateTaskModalOpen(open);
                    if (!open) {
                        setCreateTaskError(null);
                    }
                }}
            >
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Create Task</DialogTitle>
                        <DialogDescription>
                            Timeline target: {contextTargetLabel}
                        </DialogDescription>
                    </DialogHeader>

                    <form className="space-y-4" onSubmit={handleCreateTaskSubmit}>
                        {createTaskError ? (
                            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                                {createTaskError}
                            </div>
                        ) : null}

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Title *</label>
                            <Input
                                value={createTaskForm.title}
                                onChange={(event) => {
                                    setCreateTaskForm((previous) => ({
                                        ...previous,
                                        title: event.target.value,
                                    }));
                                }}
                                placeholder="Enter task title"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Description</label>
                            <Textarea
                                rows={3}
                                value={createTaskForm.description}
                                onChange={(event) => {
                                    setCreateTaskForm((previous) => ({
                                        ...previous,
                                        description: event.target.value,
                                    }));
                                }}
                                placeholder="Enter task description (optional)"
                            />
                        </div>

                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">
                                    Start Date & Time
                                </label>
                                <Input
                                    type="datetime-local"
                                    value={createTaskForm.start_at}
                                    onChange={(event) => {
                                        setCreateTaskForm((previous) => ({
                                            ...previous,
                                            start_at: event.target.value,
                                        }));
                                    }}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">
                                    Due Date & Time *
                                </label>
                                <Input
                                    type="datetime-local"
                                    value={createTaskForm.due_at}
                                    min={createTaskForm.start_at || undefined}
                                    onChange={(event) => {
                                        setCreateTaskForm((previous) => ({
                                            ...previous,
                                            due_at: event.target.value,
                                        }));
                                    }}
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Assign To *</label>
                            <select
                                value={createTaskForm.employee_id}
                                onChange={(event) => {
                                    setCreateTaskForm((previous) => ({
                                        ...previous,
                                        employee_id: event.target.value,
                                    }));
                                }}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                required
                            >
                                <option value="">Select an employee...</option>
                                {employees.map((employee) => (
                                    <option key={employee.id} value={String(employee.id)}>
                                        {employee.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="flex justify-end gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsCreateTaskModalOpen(false)}
                                disabled={isCreatingTask}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isCreatingTask}>
                                {isCreatingTask ? 'Creating...' : 'Create Task'}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog
                open={isTaskModalOpen}
                onOpenChange={(open) => {
                    if (!open) {
                        closeTaskModal();
                    }
                }}
            >
                <DialogContent className="max-w-6xl overflow-hidden p-0">
                    <div className="border-b bg-gradient-to-br from-muted/70 via-background to-background px-7 pb-6 pt-7">
                        <DialogHeader className="space-y-4">
                            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                                <div className="min-w-0 space-y-2">
                                    <div className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                                        {taskDetails?.task_code ??
                                            selectedTask?.task_code ??
                                            (taskDetails?.id || selectedTask?.id
                                                ? `Task #${taskDetails?.id ?? selectedTask?.id}`
                                                : 'Task details')}
                                    </div>
                                    <DialogTitle className="text-3xl font-semibold leading-tight tracking-tight">
                                        {taskDetails?.title ??
                                            selectedTask?.title ??
                                            'Task details'}
                                    </DialogTitle>
                                    {selectedSchedulerTask ? (
                                        <DialogDescription className="text-sm text-muted-foreground">
                                            {selectedSchedulerTask.label}{' '}
                                            |{' '}
                                            {selectedEntrySubtitle}
                                        </DialogDescription>
                                    ) : (
                                        <DialogDescription className="text-sm text-muted-foreground">
                                            Click a timeline bar to see the
                                            exact time entry details.
                                        </DialogDescription>
                                    )}
                                </div>

                                {selectedSchedulerTask ? (
                                    <div className="flex flex-wrap items-center justify-end gap-3">
                                        {selectedEntryOwner ? (
                                            <div className="flex items-center gap-3 rounded-xl border bg-background/80 px-3 py-2 shadow-sm">
                                                <span
                                                    className="inline-flex size-9 items-center justify-center rounded-full text-sm font-semibold"
                                                    style={{
                                                        background:
                                                            selectedEntryOwner.avatarBg,
                                                        color: selectedEntryOwner.avatarColor,
                                                    }}
                                                >
                                                    {selectedEntryOwner.initials}
                                                </span>
                                                <div className="hidden sm:block">
                                                    <div className="text-sm font-semibold leading-5 tracking-tight">
                                                        {selectedEntryOwner.name}
                                                    </div>
                                                    <div className="text-xs text-muted-foreground">
                                                        {selectedEntryOwner.role}
                                                    </div>
                                                </div>
                                            </div>
                                        ) : null}

                                        <span
                                            className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold capitalize"
                                            style={{
                                                background: selectedEntryStyle?.bg,
                                                borderColor:
                                                    selectedEntryStyle?.border,
                                                color: selectedEntryStyle?.color,
                                            }}
                                        >
                                            <span
                                                className="size-2 rounded-full"
                                                style={{
                                                    background:
                                                        selectedEntryStyle?.color,
                                                }}
                                            />
                                            {selectedSchedulerTask.type.replaceAll(
                                                '_',
                                                ' ',
                                            )}
                                            {selectedSchedulerTask.timeEntry
                                                .is_active ? (
                                                <span className="ml-1 inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide">
                                                    <span
                                                        className="size-1.5 rounded-full"
                                                        style={{
                                                            background: '#E24B4A',
                                                            animation:
                                                                'pulse 1.2s infinite',
                                                        }}
                                                    />
                                                    Live
                                                </span>
                                            ) : null}
                                        </span>
                                    </div>
                                ) : null}
                            </div>
                        </DialogHeader>

                        {selectedSchedulerTask ? (
                            <div className="mt-6 rounded-2xl border bg-background/85 p-5 shadow-sm">
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                    <div className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                                        Selected Time Entry
                                    </div>
                                    <div className="inline-flex items-center gap-2 rounded-full border bg-background px-3 py-1 text-xs font-semibold text-foreground">
                                        Entry #{selectedSchedulerTask.timeEntry.id}
                                        <span className="h-1 w-1 rounded-full bg-muted-foreground/60" />
                                        {selectedEntryDuration}
                                    </div>
                                </div>

                                <div className="mt-4 grid gap-4 md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] md:items-center">
                                    <div className="rounded-xl border bg-background p-4">
                                        <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                                            Start
                                        </div>
                                        <div className="mt-2 text-base font-semibold tracking-tight">
                                            {selectedEntryStart
                                                ? formatEntryDateTime(
                                                    selectedEntryStart,
                                                )
                                                : 'Not set'}
                                        </div>
                                    </div>

                                    <div className="hidden items-center gap-2 md:flex">
                                        <span
                                            className="size-2 rounded-full"
                                            style={{
                                                background:
                                                    selectedEntryStyle?.color,
                                            }}
                                        />
                                        <div className="h-[2px] w-20 rounded-full bg-muted-foreground/25" />

                                        <div className="h-[2px] w-20 rounded-full bg-muted-foreground/25" />
                                        <span className="size-2 rounded-full bg-[#E24B4A]" />
                                    </div>

                                    <div className="rounded-xl border bg-background p-4">
                                        <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                                            End
                                        </div>
                                        <div className="mt-2 text-base font-semibold tracking-tight">
                                            {selectedEntryWindow
                                                ? selectedEntryEnd
                                                    ? formatEntryDateTime(
                                                        selectedEntryEnd,
                                                    )
                                                    : 'Not set'
                                                : selectedSchedulerTask.timeEntry
                                                    .end_time
                                                    ? selectedEntryEnd
                                                        ? formatEntryDateTime(
                                                            selectedEntryEnd,
                                                        )
                                                        : 'Not set'
                                                    : selectedSchedulerTask
                                                        .timeEntry.is_active &&
                                                        selectedEntryEnd
                                                        ? `Now (${formatEntryDateTime(
                                                            selectedEntryEnd,
                                                        )})`
                                                        : 'Not set'}
                                        </div>
                                    </div>
                                </div>


                            </div>
                        ) : null}
                    </div>

                    <div className="max-h-[75vh] overflow-y-auto bg-background p-6">
                        <TaskDetailsModalContent
                            task={taskDetails ?? selectedTask}
                            attachments={taskAttachments}
                            comments={taskComments}
                            loading={detailsLoading}
                            errorMessage={detailsError}
                        />
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default TaskTimeline;
