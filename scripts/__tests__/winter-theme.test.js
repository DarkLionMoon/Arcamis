import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { test } from 'vitest';
const win = {};
vm.runInNewContext(fs.readFileSync(new URL('../js/winter-theme.js', import.meta.url), 'utf8'), { window: win, Intl, Date });
const winter = win.ArcWinter;
test('annual season follows Italian date including all of January 6', () => {
  for (const [instant,expected] of [
    ['2026-11-30T22:59:59Z',false],['2026-11-30T23:00:00Z',true],
    ['2026-12-25T12:00:00Z',true],['2027-01-06T22:59:59Z',true],
    ['2027-01-06T23:00:00Z',false],['2027-12-01T00:00:00Z',true],
    ['2028-01-06T23:00:00Z',false],['2026-07-01T12:00:00Z',false]
  ]) assert.equal(winter.isSeason(new Date(instant)), expected, instant);
});
test('next check lands at Italian midnight, including daylight saving changes', () => {
  for (const [now,next] of [
    ['2026-11-30T22:59:00Z','2026-11-30T23:00:00Z'],
    ['2027-01-06T12:00:00Z','2027-01-06T23:00:00Z'],
    ['2027-03-28T00:30:00Z','2027-03-28T22:00:00Z'],
    ['2027-10-31T00:30:00Z','2027-10-31T23:00:00Z']
  ]) assert.equal(winter.nextMidnightDelay(new Date(now)), Date.parse(next)-Date.parse(now), now);
});
