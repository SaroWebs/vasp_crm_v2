import { type Task as AppTask } from '@/types';
import axios from 'axios';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import React, { useEffect, useMemo, useState } from 'react';

type SchedulerType =
    | 'assigned'
    | 'in_progress'
    | 'review'
    | 'blocked'
    | 'done'
    | 'ticket'
    | 'other';

interface SchedulerTask {
    id: number;
    label: string;
    type: SchedulerType;
    task: AppTask;
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

const HOUR_W = 72;
const ROW_H = 56;
const DAILY_ROW_H = 64;
const NAME_W = 220;
const COL_W = 88;
const HEADER_H = 44;
const MAX_TASK_CARDS = 6;

const CHIP_STYLES: Record<
    SchedulerType,
    { bg: string; color: string; border: string }
> = {
    assigned: { bg: '#EEEDFE', color: '#534AB7', border: '#CECBF6' },
    in_progress: { bg: '#E6F1FB', color: '#185FA5', border: '#B5D4F4' },
    review: { bg: '#FAEEDA', color: '#854F0B', border: '#FAC775' },
    blocked: { bg: '#FCEDEA', color: '#9E2F2F', border: '#F6C8C2' },
    done: { bg: '#EAF3DE', color: '#3B6D11', border: '#C0DD97' },
    ticket: { bg: '#FBEAF0', color: '#993556', border: '#F4C0D1' },
    other: { bg: '#EDF4F4', color: '#16606D', border: '#B9DDE0' },
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

function getTaskStart(task: AppTask): Date {
    return (
        parseDateValue(task.start_at) ??
        parseDateValue(task.created_at) ??
        startOfDay(new Date())
    );
}

function getTaskEnd(task: AppTask): Date {
    return (
        parseDateValue(task.completed_at) ??
        parseDateValue(task.due_at) ??
        parseDateValue(task.start_at) ??
        parseDateValue(task.created_at) ??
        endOfDay(new Date())
    );
}

function overlapsRange(task: AppTask, rangeStart: Date, rangeEnd: Date): boolean {
    const taskStart = getTaskStart(task);
    const taskEnd = getTaskEnd(task);
    return taskStart <= rangeEnd && taskEnd >= rangeStart;
}

function intersectsDay(task: AppTask, day: Date): boolean {
    return overlapsRange(task, startOfDay(day), endOfDay(day));
}

function getSchedulerType(task: AppTask): SchedulerType {
    if (task.ticket) {
        return 'ticket';
    }

    switch (task.state) {
        case 'Assigned':
        case 'Draft':
            return 'assigned';
        case 'InProgress':
            return 'in_progress';
        case 'InReview':
            return 'review';
        case 'Blocked':
            return 'blocked';
        case 'Done':
            return 'done';
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

function buildTaskLabel(task: AppTask): string {
    const base = task.task_code ? `${task.task_code}` : task.title;
    return base.length > 24 ? `${base.slice(0, 21)}...` : base;
}

function getDailyWindow(task: AppTask, day: Date): {
    startHour: number;
    endHour: number;
} | null {
    if (!intersectsDay(task, day)) {
        return null;
    }

    const taskStart = getTaskStart(task);
    const taskEnd = getTaskEnd(task);
    const dayStart = new Date(day);
    dayStart.setHours(DAY_START, 0, 0, 0);
    const dayEnd = new Date(day);
    dayEnd.setHours(DAY_END, 0, 0, 0);

    const clippedStart = taskStart > dayStart ? taskStart : dayStart;
    const clippedEnd = taskEnd < dayEnd ? taskEnd : dayEnd;

    let startHour =
        clippedStart.getHours() + clippedStart.getMinutes() / 60;
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

function TaskChip({
    task,
    onSelect,
}: {
    task: SchedulerTask;
    onSelect: (task: AppTask) => void;
}) {
    const style = CHIP_STYLES[task.type];

    return (
        <button
            title={task.task.title}
            onClick={() => onSelect(task.task)}
            style={{
                display: 'block',
                width: '100%',
                textAlign: 'left',
                fontSize: 10,
                fontWeight: 500,
                padding: '2px 6px',
                borderRadius: 4,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                lineHeight: 1.6,
                background: style.bg,
                color: style.color,
                border: `0.5px solid ${style.border}`,
                cursor: 'pointer',
            }}
        >
            {task.label}
        </button>
    );
}

function DailyTaskBlock({
    task,
    onSelect,
}: {
    task: SchedulerDailyTask;
    onSelect: (task: AppTask) => void;
}) {
    const style = CHIP_STYLES[task.type];
    const totalHours = DAY_END - DAY_START;
    const leftPct = ((task.startHour - DAY_START) / totalHours) * 100;
    const widthPct = ((task.endHour - task.startHour) / totalHours) * 100;
    const showTime = task.endHour - task.startHour >= 0.75;

    return (
        <button
            title={`${task.task.title} / ${fmtHourFull(task.startHour)} - ${fmtHourFull(task.endHour)}`}
            onClick={() => onSelect(task.task)}
            style={{
                position: 'absolute',
                top: 6,
                bottom: 6,
                left: `calc(${leftPct}% + 2px)`,
                width: `calc(${widthPct}% - 4px)`,
                background: style.bg,
                border: `0.5px solid ${style.border}`,
                borderRadius: 6,
                padding: '4px 7px',
                overflow: 'hidden',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                gap: 1,
                textAlign: 'left',
            }}
        >
            <span
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
                {task.label}
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

function DailyView({
    day,
    today,
    employees,
    onSelectTask,
}: {
    day: Date;
    today: Date;
    employees: SchedulerEmployee[];
    onSelectTask: (task: AppTask) => void;
}) {
    const isToday = day.getTime() === today.getTime();
    const totalHours = DAY_END - DAY_START;
    const now = new Date();
    const nowHour = now.getHours() + now.getMinutes() / 60;
    const showNowLine = isToday && nowHour >= DAY_START && nowHour <= DAY_END;
    const nowPct = ((nowHour - DAY_START) / totalHours) * 100;
    const timelineWidth = HOURS.length * HOUR_W;
    const dayKey = formatDateKey(day);

    return (
        <div style={{ display: 'flex' }}>
            <div
                style={{
                    minWidth: NAME_W,
                    width: NAME_W,
                    flexShrink: 0,
                    borderRight: '0.5px solid #e0e0d8',
                }}
            >
                <div
                    style={{
                        height: HEADER_H,
                        display: 'flex',
                        alignItems: 'center',
                        padding: '0 16px',
                        borderBottom: '0.5px solid #e0e0d8',
                        background: 'var(--color-background-secondary, #f9f9f7)',
                        gap: 8,
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
                            height: DAILY_ROW_H,
                            display: 'flex',
                            alignItems: 'center',
                            padding: '0 16px',
                            gap: 10,
                            borderBottom:
                                index < employees.length - 1
                                    ? '0.5px solid #e0e0d8'
                                    : 'none',
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

            <div style={{ flex: 1, overflowX: 'auto' }}>
                <div
                    style={{
                        height: HEADER_H,
                        display: 'flex',
                        borderBottom: '0.5px solid #e0e0d8',
                        background: 'var(--color-background-secondary, #f9f9f7)',
                        minWidth: timelineWidth,
                        position: 'sticky',
                        top: 0,
                        zIndex: 2,
                    }}
                >
                    {HOURS.map((hour) => {
                        const isCurrent = isToday && hour === Math.floor(nowHour);

                        return (
                            <div
                                key={hour}
                                style={{
                                    minWidth: HOUR_W,
                                    width: HOUR_W,
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
                                    minWidth: HOUR_W,
                                    width: HOUR_W,
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
                        const dayTasks = employee.dailyTasks[dayKey] ?? [];

                        return (
                            <div
                                key={employee.id}
                                style={{
                                    height: DAILY_ROW_H,
                                    position: 'relative',
                                    borderBottom:
                                        index < employees.length - 1
                                            ? '0.5px solid #e0e0d8'
                                            : 'none',
                                    zIndex: 1,
                                }}
                            >
                                {dayTasks.map((task) => (
                                    <DailyTaskBlock
                                        key={`${employee.id}-${task.id}`}
                                        task={task}
                                        onSelect={onSelectTask}
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
}: {
    days: Date[];
    today: Date;
    employees: SchedulerEmployee[];
    onSelectTask: (task: AppTask) => void;
}) {
    return (
        <div style={{ display: 'flex' }}>
            <div
                style={{
                    minWidth: NAME_W,
                    width: NAME_W,
                    flexShrink: 0,
                    borderRight: '0.5px solid #e0e0d8',
                }}
            >
                <div
                    style={{
                        height: HEADER_H,
                        display: 'flex',
                        alignItems: 'center',
                        padding: '0 16px',
                        borderBottom: '0.5px solid #e0e0d8',
                        background: 'var(--color-background-secondary, #f9f9f7)',
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

                {employees.map((employee, index) => (
                    <div
                        key={employee.id}
                        style={{
                            height: ROW_H,
                            display: 'flex',
                            alignItems: 'center',
                            padding: '0 16px',
                            gap: 10,
                            borderBottom:
                                index < employees.length - 1
                                    ? '0.5px solid #e0e0d8'
                                    : 'none',
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

            <div style={{ flex: 1, overflowX: 'auto' }}>
                <div
                    style={{
                        height: HEADER_H,
                        display: 'flex',
                        borderBottom: '0.5px solid #e0e0d8',
                        background: 'var(--color-background-secondary, #f9f9f7)',
                        position: 'sticky',
                        top: 0,
                        zIndex: 1,
                    }}
                >
                    {days.map((date) => {
                        const isToday = date.getTime() === today.getTime();
                        const isWeekend =
                            date.getDay() === 0 || date.getDay() === 6;

                        return (
                            <div
                                key={formatDateKey(date)}
                                style={{
                                    minWidth: COL_W,
                                    width: COL_W,
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
                                            width: 26,
                                            height: 26,
                                            borderRadius: '50%',
                                            background: '#378ADD',
                                            color: '#fff',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: 13,
                                            fontWeight: 500,
                                            marginTop: 2,
                                        }}
                                    >
                                        {date.getDate()}
                                    </span>
                                ) : (
                                    <span
                                        style={{
                                            fontSize: 14,
                                            fontWeight: 500,
                                            marginTop: 2,
                                            color: isWeekend
                                                ? 'var(--color-text-tertiary, #aaa)'
                                                : 'var(--color-text-primary)',
                                        }}
                                    >
                                        {date.getDate()}
                                    </span>
                                )}
                            </div>
                        );
                    })}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    {employees.map((employee, index) => (
                        <div
                            key={employee.id}
                            style={{
                                height: ROW_H,
                                display: 'flex',
                                borderBottom:
                                    index < employees.length - 1
                                        ? '0.5px solid #e0e0d8'
                                        : 'none',
                            }}
                        >
                            {days.map((date) => {
                                const isWeekend =
                                    date.getDay() === 0 || date.getDay() === 6;
                                const dayTasks =
                                    employee.tasks[formatDateKey(date)] ?? [];

                                return (
                                    <div
                                        key={`${employee.id}-${formatDateKey(date)}`}
                                        style={{
                                            minWidth: COL_W,
                                            width: COL_W,
                                            height: '100%',
                                            flexShrink: 0,
                                            borderRight: '0.5px solid #e0e0d8',
                                            padding: '6px 5px',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: 3,
                                            background: isWeekend
                                                ? 'var(--color-background-secondary, #f9f9f7)'
                                                : 'transparent',
                                        }}
                                    >
                                        {dayTasks.map((task) => (
                                            <TaskChip
                                                key={`${employee.id}-${task.id}`}
                                                task={task}
                                                onSelect={onSelectTask}
                                            />
                                        ))}
                                    </div>
                                );
                            })}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

type Props = {};

const SamplePage = (_props: Props) => {
    const today = useMemo(() => startOfDay(new Date()), []);
    const [anchorDate, setAnchorDate] = useState<Date>(() => today);
    const [view, setView] = useState<ViewMode>('weekly');
    const [employees, setEmployees] = useState<AssignmentEmployee[]>([]);
    const [tasks, setTasks] = useState<AppTask[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);

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

    const rangeStart = useMemo(() => startOfDay(days[0] ?? today), [days, today]);
    const rangeEnd = useMemo(
        () => endOfDay(days[days.length - 1] ?? today),
        [days, today],
    );

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
        setLoading(true);
        setErrorMessage(null);

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
                setTasks(nextTasks);
                if (nextTasks.length > 0) {
                    setSelectedTaskId((current) =>
                        current && nextTasks.some((task: AppTask) => task.id === current)
                            ? current
                            : nextTasks[0].id,
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
    }, [rangeEnd, rangeStart]);

    const schedulerEmployees = useMemo<SchedulerEmployee[]>(() => {
        const employeeMap = new Map<number, AssignmentEmployee>();
        employees.forEach((employee) => {
            employeeMap.set(employee.id, employee);
        });

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

        return Array.from(employeeMap.values())
            .map((employee) => {
                const palette = getAvatarPalette(employee.id);
                const scheduleEmployee: SchedulerEmployee = {
                    id: employee.id,
                    name: employee.name,
                    role: employee.email || 'Task Owner',
                    initials: getInitials(employee.name),
                    avatarBg: palette.bg,
                    avatarColor: palette.color,
                    tasks: {},
                    dailyTasks: {},
                };

                days.forEach((day) => {
                    const dayKey = formatDateKey(day);
                    scheduleEmployee.tasks[dayKey] = [];
                    scheduleEmployee.dailyTasks[dayKey] = [];
                });

                tasks.forEach((task) => {
                    const assignedToEmployee = task.assigned_users?.some(
                        (user) => user.id === employee.id,
                    );

                    if (!assignedToEmployee) {
                        return;
                    }

                    days.forEach((day) => {
                        if (!intersectsDay(task, day)) {
                            return;
                        }

                        const dayKey = formatDateKey(day);
                        const schedulerTask: SchedulerTask = {
                            id: task.id,
                            label: buildTaskLabel(task),
                            type: getSchedulerType(task),
                            task,
                        };

                        scheduleEmployee.tasks[dayKey].push(schedulerTask);

                        const window = getDailyWindow(task, day);
                        if (window) {
                            scheduleEmployee.dailyTasks[dayKey].push({
                                ...schedulerTask,
                                ...window,
                            });
                        }
                    });
                });

                Object.keys(scheduleEmployee.tasks).forEach((dayKey) => {
                    scheduleEmployee.tasks[dayKey] = scheduleEmployee.tasks[
                        dayKey
                    ].slice(0, 3);
                    scheduleEmployee.dailyTasks[dayKey].sort(
                        (left, right) => left.startHour - right.startHour,
                    );
                });

                return scheduleEmployee;
            })
            .filter((employee) => {
                return days.some((day) => {
                    const dayKey = formatDateKey(day);
                    return (
                        (employee.tasks[dayKey] ?? []).length > 0 ||
                        (employee.dailyTasks[dayKey] ?? []).length > 0
                    );
                });
            });
    }, [days, employees, tasks]);

    const visibleTasks = useMemo(() => {
        return tasks
            .filter((task) => overlapsRange(task, rangeStart, rangeEnd))
            .sort((left, right) => getTaskStart(left).getTime() - getTaskStart(right).getTime());
    }, [rangeEnd, rangeStart, tasks]);

    const featuredTasks = useMemo(() => {
        const prioritized = [...visibleTasks].sort((left, right) => {
            if (left.id === selectedTaskId) {
                return -1;
            }
            if (right.id === selectedTaskId) {
                return 1;
            }
            return 0;
        });

        return prioritized.slice(0, MAX_TASK_CARDS);
    }, [selectedTaskId, visibleTasks]);

    const selectedTask = useMemo(() => {
        return visibleTasks.find((task) => task.id === selectedTaskId) ?? null;
    }, [selectedTaskId, visibleTasks]);

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

    function selectTask(task: AppTask): void {
        setSelectedTaskId(task.id);
    }

    const dateLabel =
        view === 'daily'
            ? fmtShort(anchorDate)
            : `${fmtShort(days[0])} - ${fmtShort(days[days.length - 1])}`;

    const buttonStyle: React.CSSProperties = {
        fontSize: 12,
        padding: '5px 12px',
        border: '0.5px solid #ccc',
        borderRadius: 8,
        background: 'var(--color-background-primary, #fff)',
        color: 'var(--color-text-secondary, #888)',
        cursor: 'pointer',
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
                        Operations Schedule
                    </p>
                    <p
                        style={{
                            fontSize: 12,
                            margin: '4px 0 0',
                            color: 'var(--color-text-secondary, #888)',
                        }}
                    >
                        Live task data in the sample scheduler, with real task cards for the visible period.
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
                style={{
                    background: 'var(--color-background-primary, #fff)',
                    border: '0.5px solid #e0e0d8',
                    borderRadius: 12,
                    overflow: 'hidden',
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
                    />
                ) : (
                    <GridView
                        days={days}
                        today={today}
                        employees={schedulerEmployees}
                        onSelectTask={selectTask}
                    />
                )}
            </div>

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
                    {(Object.keys(CHIP_STYLES) as SchedulerType[]).map((type) => (
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
                    ))}
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

        </div>
    );
};

export default SamplePage;
