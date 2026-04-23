function clamp(value: number, min: number, max: number): number {
    return Math.min(max, Math.max(min, value));
}

function diffMinutesFloor(from: Date, to: Date): number {
    return Math.floor((to.getTime() - from.getTime()) / (60 * 1000));
}

function diffMinutesCeil(from: Date, to: Date): number {
    return Math.ceil((to.getTime() - from.getTime()) / (60 * 1000));
}

export function computeClippedMinuteRange(options: {
    dayStart: Date;
    dayEnd: Date;
    start: Date;
    end: Date;
    totalMinutes: number;
}): { startMin: number; endMin: number } | null {
    const { dayStart, dayEnd, start, end, totalMinutes } = options;

    if (end < dayStart || start > dayEnd) {
        return null;
    }

    const clippedStart = start < dayStart ? dayStart : start;
    const clippedEnd = end > dayEnd ? dayEnd : end;
    const durationMs = clippedEnd.getTime() - clippedStart.getTime();

    const startMin = clamp(diffMinutesFloor(dayStart, clippedStart), 0, totalMinutes);
    let endMin = clamp(diffMinutesCeil(dayStart, clippedEnd), 0, totalMinutes);

    if (durationMs > 0 && durationMs < 60 * 1000) {
        endMin = Math.min(totalMinutes, startMin + 1);
    }

    if (endMin <= startMin) {
        return null;
    }

    return { startMin, endMin };
}
