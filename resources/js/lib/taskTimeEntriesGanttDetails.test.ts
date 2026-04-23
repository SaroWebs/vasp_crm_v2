import assert from 'node:assert/strict';
import test from 'node:test';

import { formatDurationMs } from './taskTimeEntriesGanttDetails.js';

test('formats sub-minute durations in seconds', () => {
    assert.equal(formatDurationMs(43_000), '43s');
});

test('formats minute durations', () => {
    assert.equal(formatDurationMs(60_000), '1m');
    assert.equal(formatDurationMs(75_000), '1m 15s');
});

test('formats hour durations', () => {
    assert.equal(formatDurationMs(60 * 60 * 1000), '1h');
    assert.equal(formatDurationMs(60 * 60 * 1000 + 15 * 60 * 1000), '1h 15m');
});

