import assert from 'node:assert/strict';
import test from 'node:test';

import { computeClippedMinuteRange } from './taskTimeEntriesGanttMath.js';

test('does not drop sub-minute entries', () => {
    const dayStart = new Date('2026-04-23T00:00:00.000Z');
    const dayEnd = new Date('2026-04-23T23:59:59.999Z');

    const range = computeClippedMinuteRange({
        dayStart,
        dayEnd,
        start: new Date('2026-04-23T05:04:45.000Z'),
        end: new Date('2026-04-23T05:05:28.000Z'),
        totalMinutes: 24 * 60,
    });

    assert.deepEqual(range, { startMin: 304, endMin: 305 });
});

test('keeps normal durations intact', () => {
    const dayStart = new Date('2026-04-23T00:00:00.000Z');
    const dayEnd = new Date('2026-04-23T23:59:59.999Z');

    const range = computeClippedMinuteRange({
        dayStart,
        dayEnd,
        start: new Date('2026-04-23T02:30:00.000Z'),
        end: new Date('2026-04-23T03:15:00.000Z'),
        totalMinutes: 24 * 60,
    });

    assert.deepEqual(range, { startMin: 150, endMin: 195 });
});

