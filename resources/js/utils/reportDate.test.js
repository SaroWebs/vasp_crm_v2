import assert from 'node:assert/strict';
import {
    getEntryRangeOnReportDate,
    getSecondsOnReportDate,
    parseReportDate,
} from './reportDate.js';

const parsed = parseReportDate('2026-04-10');
assert.ok(parsed);
assert.equal(parsed?.getFullYear(), 2026);
assert.equal(parsed?.getMonth(), 3);
assert.equal(parsed?.getDate(), 10);

const seconds = getSecondsOnReportDate(
    '2026-04-09T00:00:00',
    '2026-04-11T00:00:00',
    '2026-04-10',
);
assert.equal(Math.round(seconds), 24 * 60 * 60);

const range = getEntryRangeOnReportDate(
    '2026-04-10T05:00:00',
    '2026-04-10T06:30:00',
    '2026-04-10',
);
assert.ok(range);
assert.equal(range?.start.getHours(), 5);
assert.equal(range?.end.getHours(), 6);

const skippedRange = getEntryRangeOnReportDate(
    '2026-04-11T05:00:00',
    '2026-04-11T06:30:00',
    '2026-04-10',
);
assert.equal(skippedRange, null);

console.log('reportDate tests passed');
