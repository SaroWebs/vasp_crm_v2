import TaskDetailsModalContent from '@/components/admin/TaskDetailsModalContent';
import { Task, type TaskAttachment, type TaskComment } from '@/types';
import axios from 'axios';
import { Modal } from '@mantine/core';
import React, { startTransition, useEffect, useMemo, useRef, useState } from 'react';

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
    task: Task;
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
const DAILY_TILE_MIN_W = 180;
const DAILY_TILE_GAP = 12;
const DAILY_TILE_V_GAP = 12;
const NAME_W = 220;
const HEADER_H = 44;
const GRID_CARD_MIN_H = 118;

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

function buildDailyTileLayout(
    tasks: SchedulerTask[],
    day: Date,
    timelineWidth: number,
): {
    tiles: Array<SchedulerTask & { left: number; width: number; lane: number }>;
    rowHeight: number;
} {
    if (tasks.length === 0) {
        return { tiles: [], rowHeight: DAILY_ROW_MIN_H };
    }

    const totalHours = DAY_END - DAY_START;
    const tiles = tasks
        .map((task) => {
            const window = getDailyWindow(task.task, day);
            if (!window) {
                return null;
            }

            const left = Math.max(
                0,
                ((window.startHour - DAY_START) / totalHours) * timelineWidth,
            );
            const right = Math.min(
                timelineWidth,
                ((window.endHour - DAY_START) / totalHours) * timelineWidth,
            );
            const width = Math.max(DAILY_TILE_MIN_W, right - left);
            const clampedLeft = Math.min(
                left,
                Math.max(0, timelineWidth - width),
            );

            return { ...task, left: clampedLeft, width };
        })
        .filter((task): task is SchedulerTask & { left: number; width: number } => Boolean(task))
        .sort((left, right) => left.left - right.left);

    const lanes: number[] = [];
    const placed = tiles.map((task) => {
        let lane = lanes.findIndex(
            (rightEdge) => task.left >= rightEdge + DAILY_TILE_GAP,
        );

        if (lane === -1) {
            lane = lanes.length;
            lanes.push(task.left + task.width);
        } else {
            lanes[lane] = task.left + task.width;
        }

        return { ...task, lane };
    });

    const rowHeight = Math.max(
        DAILY_ROW_MIN_H,
        lanes.length * GRID_CARD_MIN_H + (lanes.length + 1) * DAILY_TILE_V_GAP,
    );

    return { tiles: placed, rowHeight };
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

function getTaskStart(task: Task): Date {
    return (
        parseDateValue(task.start_at) ??
        parseDateValue(task.created_at) ??
        startOfDay(new Date())
    );
}

function getTaskEnd(task: Task): Date {
    return (
        parseDateValue(task.completed_at) ??
        parseDateValue(task.due_at) ??
        parseDateValue(task.start_at) ??
        parseDateValue(task.created_at) ??
        endOfDay(new Date())
    );
}

function overlapsRange(task: Task, rangeStart: Date, rangeEnd: Date): boolean {
    const taskStart = getTaskStart(task);
    const taskEnd = getTaskEnd(task);
    return taskStart <= rangeEnd && taskEnd >= rangeStart;
}

function intersectsDay(task: Task, day: Date): boolean {
    return overlapsRange(task, startOfDay(day), endOfDay(day));
}

function getSchedulerType(task: Task): SchedulerType {
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

function buildTaskLabel(task: Task): string {
    const base = task.task_code ? `${task.task_code}` : task.title;
    return base.length > 24 ? `${base.slice(0, 21)}...` : base;
}

function formatTaskDate(date?: string | null): string | null {
    const parsedDate = parseDateValue(date);

    if (!parsedDate) {
        return null;
    }

    return parsedDate.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
    });
}

function formatTaskDateTime(date?: string | null): string | null {
    const parsedDate = parseDateValue(date);

    if (!parsedDate) {
        return null;
    }

    return parsedDate.toLocaleString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

function getPriorityLabel(priority?: string | null): string | null {
    if (!priority) {
        return null;
    }

    const labels: Record<string, string> = {
        P1: 'Critical',
        P2: 'High',
        P3: 'Medium',
        P4: 'Low',
    };

    const normalized = priority.toUpperCase();

    return labels[normalized] ?? priority;
}

function getDailyWindow(task: Task, day: Date): {startHour: number; endHour: number;} | null {
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

function getTaskSpan(task: Task, days: Date[]): { start: number; span: number } | null {
    let startIndex = -1;
    let endIndex = -1;

    days.forEach((day, index) => {
        if (intersectsDay(task, day)) {
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

function TaskTile({task, isSelected, onSelect}: {
        task: SchedulerTask;
        isSelected: boolean;
        onSelect: (task: Task) => void;
    }){
    const style = CHIP_STYLES[task.type];
    const taskPriority = getPriorityLabel(task.task.priority);
    const dueDate = formatTaskDate(task.task.due_at);
    const assigneeCount = task.task.assigned_users?.length ?? 0;

    return (
        <button
            title={task.task.title}
            onClick={() => onSelect(task.task)}
            style={{
                display: 'flex',
                width: '100%',
                minHeight: GRID_CARD_MIN_H,
                flexDirection: 'column',
                gap: 8,
                padding: 10,
                borderRadius: 10,
                background: isSelected ? '#bcccf1ea' : style.bg,
                border: `1px solid ${isSelected ? '#378ADD' : style.border}`,
                boxShadow: isSelected
                    ? '0 0 0 1px rgba(55, 138, 221, 0.18), 0 1px 2px rgba(16, 24, 40, 0.06)'
                    : '0 1px 2px rgba(16, 24, 40, 0.06)',
                cursor: 'pointer',
                textAlign: 'left',
                overflow: 'hidden',
            }}
        >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                <div style={{ minWidth: 0, flex: 1 }}>
                    <div
                        style={{
                            fontSize: 10,
                            fontWeight: 600,
                            color: style.color,
                            textTransform: 'uppercase',
                            letterSpacing: '0.06em',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                        }}
                    >
                        {task.task.task_code || task.label}
                    </div>
                    <div
                        style={{
                            marginTop: 4,
                            fontSize: 13,
                            fontWeight: 600,
                            color: 'var(--color-text-primary)',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            lineHeight: 1.35,
                        }}
                    >
                        {task.task.title}
                    </div>
                </div>

                <span
                    style={{
                        flexShrink: 0,
                        fontSize: 10,
                        fontWeight: 600,
                        padding: '3px 7px',
                        borderRadius: 999,
                        background: style.bg,
                        color: style.color,
                        border: `1px solid ${style.border}`,
                        textTransform: 'capitalize',
                        whiteSpace: 'nowrap',
                    }}
                >
                    {task.type.replace('_', ' ')}
                </span>
            </div>

            <div
                style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 6,
                    marginTop: 'auto',
                }}
            >
                {taskPriority ? (
                    <span
                        style={{
                            fontSize: 10,
                            fontWeight: 500,
                            padding: '2px 6px',
                            borderRadius: 999,
                            background: style.bg,
                            color: style.color,
                            border: `1px solid ${style.border}`,
                        }}
                    >
                        {taskPriority}
                    </span>
                ) : null}
                {dueDate ? (
                    <span
                        style={{
                            fontSize: 10,
                            fontWeight: 500,
                            padding: '2px 6px',
                            borderRadius: 999,
                            background: 'rgba(0, 0, 0, 0.04)',
                            color: 'var(--color-text-secondary, #666)',
                        }}
                    >
                        Due {dueDate}
                    </span>
                ) : null}
                {task.task.estimate_hours ? (
                    <span
                        style={{
                            fontSize: 10,
                            fontWeight: 500,
                            padding: '2px 6px',
                            borderRadius: 999,
                            background: 'rgba(0, 0, 0, 0.04)',
                            color: 'var(--color-text-secondary, #666)',
                        }}
                    >
                        {task.task.estimate_hours}h
                    </span>
                ) : null}
                {assigneeCount > 0 ? (
                    <span
                        style={{
                            fontSize: 10,
                            fontWeight: 500,
                            padding: '2px 6px',
                            borderRadius: 999,
                            background: 'rgba(0, 0, 0, 0.04)',
                            color: 'var(--color-text-secondary, #666)',
                        }}
                    >
                        {assigneeCount} assignee{assigneeCount === 1 ? '' : 's'}
                    </span>
                ) : null}
            </div>
        </button>
    );
}

function DailyTaskBlock({task,onSelect}: {
        task: SchedulerDailyTask;
        onSelect: (task: Task) => void;
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
        onSelectTask: (task: Task) => void;
    }) {
    const isToday = day.getTime() === today.getTime();
    const totalHours = DAY_END - DAY_START;
    const now = new Date();
    const nowHour = now.getHours() + now.getMinutes() / 60;
    const showNowLine = isToday && nowHour >= DAY_START && nowHour <= DAY_END;
    const nowPct = ((nowHour - DAY_START) / totalHours) * 100;
    const timelineWidth = HOURS.length * HOUR_W;
    const dayKey = formatDateKey(day);
    const dailyLayouts = useMemo(
        () =>
            employees.map((employee) =>
                buildDailyTileLayout(
                    employee.tasks[dayKey] ?? [],
                    day,
                    timelineWidth,
                ),
            ),
        [employees, dayKey, day, timelineWidth],
    );

    return (
        <div style={{ display: 'flex', overflowX: 'auto' }}>
            <div
                style={{
                    minWidth: NAME_W,
                    width: NAME_W,
                    flexShrink: 0,
                    borderRight: '0.5px solid #e0e0d8',
                    background: 'var(--color-background-primary, #fff)',
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
                        background: 'var(--color-background-secondary, #f9f9f7)',
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
                        const layout = dailyLayouts[index] ?? {
                            tiles: [],
                            rowHeight: DAILY_ROW_MIN_H,
                        };

                        return (
                            <div
                                key={employee.id}
                                style={{
                                    height: layout.rowHeight,
                                    position: 'relative',
                                    borderBottom:
                                        index < employees.length - 1
                                            ? '0.5px solid #e0e0d8'
                                            : 'none',
                                    zIndex: 1,
                                }}
                            >
                                {layout.tiles.map((task) => (
                                    <div
                                        key={`${employee.id}-${task.id}`}
                                        style={{
                                            position: 'absolute',
                                            top:
                                                DAILY_TILE_V_GAP +
                                                task.lane *
                                                    (GRID_CARD_MIN_H +
                                                        DAILY_TILE_V_GAP),
                                            left: task.left,
                                            width: task.width,
                                        }}
                                    >
                                        <TaskTile
                                            task={task}
                                            isSelected={false}
                                            onSelect={onSelectTask}
                                        />
                                    </div>
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
        selectedTaskId,
        onSelectTask,
    }: {
        days: Date[];
        today: Date;
        employees: SchedulerEmployee[];
        selectedTaskId: number | null;
        onSelectTask: (task: Task) => void;
    }) {
    const colWidth = days.length > 20 ? 190 : days.length > 10 ? 210 : 230;
    const gridMinWidth = NAME_W + days.length * colWidth;

    return (
        <div style={{ width: '100%', overflowX: 'auto' }}>
            <div
                style={{
                    minWidth: gridMinWidth,
                    display: 'flex',
                    flexDirection: 'column',
                }}
            >
                <div
                    style={{
                        height: HEADER_H,
                        display: 'flex',
                        borderBottom: '0.5px solid #e0e0d8',
                        background: 'var(--color-background-secondary, #f9f9f7)',
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
                            background: 'var(--color-background-secondary, #f9f9f7)',
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

                {employees.map((employee, index) => (
                    <div
                        key={employee.id}
                        style={{
                            minHeight: ROW_H,
                            height: 'auto',
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
                            style={{
                                position: 'relative',
                                width: days.length * colWidth,
                                minHeight: ROW_H,
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
                                    position: 'relative',
                                    display: 'grid',
                                    gridTemplateColumns: `repeat(${days.length}, ${colWidth}px)`,
                                    gap: 0,
                                    padding: 0,
                                    zIndex: 1,
                                }}
                            >
                                {employee.allTasks
                                    .map((task) => {
                                        const span = getTaskSpan(
                                            task.task,
                                            days,
                                        );

                                        if (!span) {
                                            return null;
                                        }

                                        return (
                                            <div
                                                key={`${employee.id}-${task.id}`}
                                                className='m-2'
                                                style={{
                                                    gridColumn: `${span.start + 1} / span ${span.span}`,
                                                }}
                                            >
                                                <TaskTile
                                                    task={task}
                                                    isSelected={
                                                        task.id ===
                                                        selectedTaskId
                                                    }
                                                    onSelect={onSelectTask}
                                                />
                                            </div>
                                        );
                                    })
                                    .filter(Boolean)}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

const TaskTimeline = () => {
    const today = useMemo(() => startOfDay(new Date()), []);
    const [anchorDate, setAnchorDate] = useState<Date>(() => today);
    const [view, setView] = useState<ViewMode>('weekly');
    const [employees, setEmployees] = useState<AssignmentEmployee[]>([]);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);
    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
    const [taskDetails, setTaskDetails] = useState<Task | null>(null);
    const [taskAttachments, setTaskAttachments] = useState<TaskAttachment[]>([]);
    const [taskComments, setTaskComments] = useState<TaskComment[]>([]);
    const [detailsLoading, setDetailsLoading] = useState(false);
    const [detailsError, setDetailsError] = useState<string | null>(null);
    const detailsAbortRef = useRef<AbortController | null>(null);

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
                setTasks(nextTasks);
                if (nextTasks.length > 0) {
                    setSelectedTaskId((current) =>
                        current && nextTasks.some((task: Task) => task.id === current)
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
                const taskMap = new Map<number, SchedulerTask>();
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

                tasks.forEach((task) => {
                    const assignedToEmployee = task.assigned_users?.some(
                        (user) => user.id === employee.id,
                    );

                    if (!assignedToEmployee) {
                        return;
                    }

                    if (!taskMap.has(task.id)) {
                        taskMap.set(task.id, {
                            id: task.id,
                            label: buildTaskLabel(task),
                            type: getSchedulerType(task),
                            task,
                        });
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

                scheduleEmployee.allTasks = Array.from(taskMap.values()).sort(
                    (left, right) =>
                        getTaskStart(left.task).getTime() -
                        getTaskStart(right.task).getTime(),
                );

                Object.keys(scheduleEmployee.tasks).forEach((dayKey) => {
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

    function selectTask(task: Task): void {
        setSelectedTaskId(task.id);
        setIsTaskModalOpen(true);
    }

    function closeTaskModal(): void {
        if (detailsAbortRef.current) {
            detailsAbortRef.current.abort();
            detailsAbortRef.current = null;
        }

        setIsTaskModalOpen(false);
    }

    useEffect(() => {
        if (!isTaskModalOpen) {
            setTaskDetails(null);
            setTaskAttachments([]);
            setTaskComments([]);
            setDetailsError(null);
            setDetailsLoading(false);
        }
    }, [isTaskModalOpen]);

    useEffect(() => {
        if (!isTaskModalOpen || !selectedTaskId) {
            return;
        }

        const controller = new AbortController();
        detailsAbortRef.current = controller;
        setDetailsLoading(true);
        setDetailsError(null);

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
                const responseTask = taskResponse.data?.data ?? taskResponse.data;
                const responseAttachments =
                    attachmentResponse.data?.data ?? attachmentResponse.data ?? [];
                const responseComments =
                    commentResponse.data?.data ?? commentResponse.data ?? [];

                setTaskDetails(responseTask ?? null);
                setTaskAttachments(responseAttachments);
                setTaskComments(responseComments);
                if(responseTask){
                    console.log(responseTask);
                }
            })
            .catch((error) => {
                if (error?.name === 'CanceledError' || error?.code === 'ERR_CANCELED') {
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
                        Timeline Schedule
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
                    overflowX: 'auto',
                    overflowY: 'hidden',
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
                        selectedTaskId={selectedTaskId}
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

            <Modal
                opened={isTaskModalOpen}
                onClose={closeTaskModal}
                title={taskDetails?.title ?? selectedTask?.title ?? 'Task details'}
                size="xl"
            >
                <TaskDetailsModalContent
                    task={taskDetails ?? selectedTask}
                    attachments={taskAttachments}
                    comments={taskComments}
                    loading={detailsLoading}
                    errorMessage={detailsError}
                />
            </Modal>
        </div>
    );
};

export default TaskTimeline;
