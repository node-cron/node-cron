import { assert } from 'chai';
import { TimeMatcher } from './time-matcher';

// utcOffset: a fixed numeric offset in minutes (negative = west of UTC), used
// as an alternative to a timezone name. It never observes DST, so it behaves
// like a zone with no transitions, computed arithmetically (no Intl).

describe('utcOffset', function () {
  describe('match', function () {
    it('matches the wall-clock in a negative (west) offset (UTC-3)', function () {
      const m = new TimeMatcher('30 14 * * *', undefined, -180);
      // 14:30 at UTC-3 is 17:30 UTC
      assert.isTrue(m.match(new Date('2025-06-15T17:30:00Z')));
      assert.isFalse(m.match(new Date('2025-06-15T14:30:00Z')));
      assert.isFalse(m.match(new Date('2025-06-15T17:31:00Z')));
    });

    it('matches a half-hour offset (UTC+5:30)', function () {
      const m = new TimeMatcher('0 9 * * *', undefined, 330);
      // 09:00 at UTC+5:30 is 03:30 UTC
      assert.isTrue(m.match(new Date('2025-06-15T03:30:00Z')));
      assert.isFalse(m.match(new Date('2025-06-15T09:00:00Z')));
    });

    it('offset 0 behaves like UTC', function () {
      const m = new TimeMatcher('0 12 * * *', undefined, 0);
      assert.isTrue(m.match(new Date('2025-06-15T12:00:00Z')));
    });

    it('matches the weekday in the offset, not UTC', function () {
      // 2025-06-15 is a Sunday. At UTC-3, 23:30 local on Sun = 02:30 UTC Mon.
      // `0 30 23 * * 0` (Sunday 23:30) must match the Sunday-local instant.
      const m = new TimeMatcher('0 23 * * 0', undefined, -180);
      assert.isTrue(m.match(new Date('2025-06-16T02:00:00Z')));  // Sun 23:00 local
      assert.isFalse(m.match(new Date('2025-06-15T23:00:00Z'))); // that's Sun 20:00 local
    });
  });

  describe('getNextMatch', function () {
    it('finds the next daily instant in a fixed offset', function () {
      const next = new TimeMatcher('30 14 * * *', undefined, -180)
        .getNextMatch(new Date('2025-06-15T00:00:00Z'));
      assert.equal(next.toISOString(), '2025-06-15T17:30:00.000Z');
    });

    it('does not drift across a DST boundary (fixed offset, no transitions)', function () {
      // Across the US spring-forward, a real America/New_York would shift; a
      // fixed UTC-3 must stay exactly 24h apart every day.
      const m = new TimeMatcher('30 14 * * *', undefined, -180);
      let d = new Date('2025-03-08T00:00:00Z');
      const a = m.getNextMatch(d);
      const b = m.getNextMatch(a);
      assert.equal(a.toISOString(), '2025-03-08T17:30:00.000Z');
      assert.equal(b.getTime() - a.getTime(), 24 * 60 * 60 * 1000);
    });

    it('half-hour offset getNextMatch', function () {
      const next = new TimeMatcher('0 9 * * *', undefined, 330)
        .getNextMatch(new Date('2025-06-15T00:00:00Z'));
      assert.equal(next.toISOString(), '2025-06-15T03:30:00.000Z');
    });
  });
});
