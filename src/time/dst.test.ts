import { TimeMatcher } from './time-matcher';

// DST & timezone guarantees (spec 05-spec-dst, sections 3.1-3.4).
//
// Every assertion uses an explicit timezone, so results are independent of the
// machine's TZ. Sequences are checked against the spec's invariants rather than
// magic numbers where possible:
//   - strictly monotonic in absolute time (never past, never twice)
//   - consecutive gap >= the expression's interval (no rapid-fire)
//   - every returned instant actually matches the expression, which by
//     construction proves no non-existent (spring-forward gap) wall-clock fired
//     (a gap time materializes to a different instant whose fields don't match).

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;

function runs(expr: string, tz: string, baseISO: string, count: number): Date[] {
  const matcher = new TimeMatcher(expr, tz);
  let date = new Date(baseISO);
  const out: Date[] = [];
  for (let i = 0; i < count; i++) {
    date = matcher.getNextMatch(date);
    out.push(date);
  }
  return out;
}

function wall(date: Date, tz: string): string {
  const p: any = new Intl.DateTimeFormat('en-GB', {
    timeZone: tz, hour12: false,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  }).formatToParts(date).reduce((a: any, x) => { a[x.type] = x.value; return a; }, {});
  return `${p.year}-${p.month}-${p.day} ${p.hour}:${p.minute}`;
}

// The three core invariants for any enumerated sequence.
function assertGuarantees(expr: string, tz: string, sequence: Date[], intervalMs: number) {
  const matcher = new TimeMatcher(expr, tz);
  for (let i = 0; i < sequence.length; i++) {
    expect(matcher.match(sequence[i])).toBe(true);
    if (i > 0) {
      const delta = sequence[i].getTime() - sequence[i - 1].getTime();
      expect(delta).toBeGreaterThan(0);
      expect(delta).toBeGreaterThanOrEqual(intervalMs);
    }
  }
}

describe('DST & timezone guarantees', function () {
  describe('spring-forward (gap)', function () {
    it('a daily time inside the gap skips that day', function () {
      // 2025-03-09 New York: 02:00 -> 03:00, so 02:45 does not exist that day.
      const seq = runs('45 2 * * *', 'America/New_York', '2025-03-07T12:00:00Z', 3);
      expect(wall(seq[0], 'America/New_York')).toBe('2025-03-08 02:45');
      expect(wall(seq[1], 'America/New_York')).toBe('2025-03-10 02:45'); // 03-09 skipped
      expect(wall(seq[2], 'America/New_York')).toBe('2025-03-11 02:45');
    });

    it('hourly crosses the gap (02:00 skipped)', function () {
      const seq = runs('0 * * * *', 'America/New_York', '2025-03-09T05:30:00Z', 4);
      assertGuarantees('0 * * * *', 'America/New_York', seq, HOUR);
      expect(wall(seq[0], 'America/New_York')).toBe('2025-03-09 01:00');
      expect(wall(seq[1], 'America/New_York')).toBe('2025-03-09 03:00'); // not 02:00
    });

    it('*/15 crosses the gap (02:00-02:45 skipped)', function () {
      const seq = runs('*/15 * * * *', 'America/New_York', '2025-03-09T06:40:00Z', 3);
      assertGuarantees('*/15 * * * *', 'America/New_York', seq, 15 * MINUTE);
      expect(wall(seq[0], 'America/New_York')).toBe('2025-03-09 01:45');
      expect(wall(seq[1], 'America/New_York')).toBe('2025-03-09 03:00');
    });

    it('per-minute crosses the gap', function () {
      const seq = runs('* * * * *', 'America/New_York', '2025-03-09T06:58:00Z', 4);
      assertGuarantees('* * * * *', 'America/New_York', seq, MINUTE);
      expect(wall(seq[0], 'America/New_York')).toBe('2025-03-09 01:59');
      expect(wall(seq[1], 'America/New_York')).toBe('2025-03-09 03:00');
    });

    it('per-second crosses the gap', function () {
      const seq = runs('* * * * * *', 'America/New_York', '2025-03-09T06:59:58Z', 4);
      assertGuarantees('* * * * * *', 'America/New_York', seq, SECOND);
    });

    it('30-minute gap (Lord Howe 02:00 -> 02:30)', function () {
      const seq = runs('*/15 * * * *', 'Australia/Lord_Howe', '2025-10-05T15:40:00Z', 5);
      assertGuarantees('*/15 * * * *', 'Australia/Lord_Howe', seq, 15 * MINUTE);
      // no run falls in the 02:00-02:29 gap
      for (const d of seq) expect(wall(d, 'Australia/Lord_Howe')).not.toMatch(/2025-10-06 02:(00|15)$/);
    });

    it('gap at midnight (Havana 00:00 -> 01:00) skips that day', function () {
      const seq = runs('30 0 * * *', 'America/Havana', '2025-03-07T12:00:00Z', 3);
      expect(wall(seq[0], 'America/Havana')).toBe('2025-03-08 00:30');
      expect(wall(seq[1], 'America/Havana')).toBe('2025-03-10 00:30'); // 03-09 00:30 does not exist
    });

    it('45-minute base offset stays correct hourly (Chatham)', function () {
      const seq = runs('0 * * * *', 'Pacific/Chatham', '2025-04-06T01:40:00Z', 6);
      assertGuarantees('0 * * * *', 'Pacific/Chatham', seq, HOUR);
    });

    it('target exactly at the start of the gap (02:00) is skipped', function () {
      const seq = runs('0 2 * * *', 'America/New_York', '2025-03-08T12:00:00Z', 1);
      expect(wall(seq[0], 'America/New_York')).toBe('2025-03-10 02:00'); // 03-09 02:00 skipped
    });

    it('target exactly at the end of the gap (03:00) fires', function () {
      const seq = runs('0 3 * * *', 'America/New_York', '2025-03-08T12:00:00Z', 1);
      expect(wall(seq[0], 'America/New_York')).toBe('2025-03-09 03:00');
    });
  });

  describe('fall-back (overlap)', function () {
    it('a daily time inside the overlap fires on the first occurrence', function () {
      // 2025-11-02 New York: 02:00 -> 01:00. 01:15 happens twice; fire EDT (first).
      const seq = runs('15 1 * * *', 'America/New_York', '2025-11-01T12:00:00Z', 1);
      expect(seq[0].toISOString()).toBe('2025-11-02T05:15:00.000Z'); // 01:15 EDT, not 06:15Z (EST)
    });

    it('hourly during overlap ignores the repeated hour', function () {
      const seq = runs('0 * * * *', 'America/New_York', '2025-11-02T04:30:00Z', 3);
      assertGuarantees('0 * * * *', 'America/New_York', seq, HOUR);
      expect(seq[0].toISOString()).toBe('2025-11-02T05:00:00.000Z'); // 01:00 EDT
      expect(seq[1].toISOString()).toBe('2025-11-02T07:00:00.000Z'); // 02:00 EST (01:00 EST skipped)
    });

    it('per-minute advances monotonically through the overlap', function () {
      const seq = runs('* * * * *', 'America/New_York', '2025-11-02T05:57:00Z', 5);
      assertGuarantees('* * * * *', 'America/New_York', seq, MINUTE);
    });

    it('per-second advances monotonically through the overlap', function () {
      const seq = runs('* * * * * *', 'America/New_York', '2025-11-02T05:59:57Z', 6);
      assertGuarantees('* * * * * *', 'America/New_York', seq, SECOND);
    });

    it('per-minute rapid-fire prevention (Chicago)', function () {
      const seq = runs('* * * * *', 'America/Chicago', '2025-11-02T06:57:00Z', 6);
      assertGuarantees('* * * * *', 'America/Chicago', seq, MINUTE);
    });

    it('per-second rapid-fire prevention (Chicago)', function () {
      const seq = runs('* * * * * *', 'America/Chicago', '2025-11-02T06:59:57Z', 6);
      assertGuarantees('* * * * * *', 'America/Chicago', seq, SECOND);
    });

    it('30-minute overlap (Lord Howe) advances monotonically', function () {
      // 2025-04-06 Lord Howe: 02:00 -> 01:30 (ends DST, 30-minute overlap).
      const seq = runs('*/15 * * * *', 'Australia/Lord_Howe', '2025-04-05T15:00:00Z', 8);
      assertGuarantees('*/15 * * * *', 'Australia/Lord_Howe', seq, 15 * MINUTE);
    });

    it('overlap with a 45-minute base offset (Chatham) fires once', function () {
      const seq = runs('0 * * * *', 'Pacific/Chatham', '2025-04-05T12:00:00Z', 6);
      assertGuarantees('0 * * * *', 'Pacific/Chatham', seq, HOUR);
    });

    it('the exact transition second (02:00 EST) fires normally', function () {
      const seq = runs('0 2 * * *', 'America/New_York', '2025-11-02T05:00:00Z', 1);
      expect(seq[0].toISOString()).toBe('2025-11-02T07:00:00.000Z'); // 02:00 EST
    });

    it('getNextMatch during the second occurrence returns the next day', function () {
      // base = 01:20 during the EST repeat; the first 01:15 already passed.
      const seq = runs('15 1 * * *', 'America/New_York', '2025-11-02T06:20:00Z', 1);
      expect(wall(seq[0], 'America/New_York')).toBe('2025-11-03 01:15');
    });
  });

  describe('negative controls (no DST)', function () {
    it('a zone without DST fires every day, no skip or double (Tokyo)', function () {
      const seq = runs('30 2 * * *', 'Asia/Tokyo', '2025-03-07T00:00:00Z', 5);
      assertGuarantees('30 2 * * *', 'Asia/Tokyo', seq, 23 * HOUR);
      for (const d of seq) expect(wall(d, 'Asia/Tokyo').slice(11)).toBe('02:30');
    });

    it('pure UTC is immune to DST (24 hourly fires per day)', function () {
      const seq = runs('0 * * * *', 'Etc/UTC', '2025-03-09T00:00:00Z', 24);
      assertGuarantees('0 * * * *', 'Etc/UTC', seq, HOUR);
      expect(seq[0].toISOString()).toBe('2025-03-09T01:00:00.000Z');
      expect(seq[23].toISOString()).toBe('2025-03-10T00:00:00.000Z'); // 24 fires, no gap
    });
  });

  describe('stress (long enumeration)', function () {
    it('400 daily iterations crossing both transitions stay monotonic (NY 04:00)', function () {
      const seq = runs('0 4 * * *', 'America/New_York', '2025-01-01T00:00:00Z', 400);
      assertGuarantees('0 4 * * *', 'America/New_York', seq, 23 * HOUR);
    });

    it('a year of a gap-time daily skips exactly the spring-forward day', function () {
      // 45 2 in NY: every day except the spring-forward day (2025-03-09).
      const seq = runs('45 2 * * *', 'America/New_York', '2025-01-01T00:00:00Z', 400);
      assertGuarantees('45 2 * * *', 'America/New_York', seq, 23 * HOUR);
      const skipped = seq.find(d => wall(d, 'America/New_York').startsWith('2025-03-09'));
      expect(skipped).toBeUndefined();
    });

    it('a year of an overlap-time daily never duplicates a day', function () {
      const seq = runs('15 1 * * *', 'America/New_York', '2025-01-01T00:00:00Z', 400);
      assertGuarantees('15 1 * * *', 'America/New_York', seq, 23 * HOUR);
      const days = seq.map(d => wall(d, 'America/New_York').slice(0, 10));
      expect(new Set(days).size).toBe(days.length);
    });

    it('365 iterations in the southern hemisphere (Auckland)', function () {
      const seq = runs('30 2 * * *', 'Pacific/Auckland', '2025-01-01T00:00:00Z', 365);
      assertGuarantees('30 2 * * *', 'Pacific/Auckland', seq, 23 * HOUR);
    });

    it('365 iterations with a 30-minute DST (Lord Howe)', function () {
      const seq = runs('0 2 * * *', 'Australia/Lord_Howe', '2025-01-01T00:00:00Z', 365);
      assertGuarantees('0 2 * * *', 'Australia/Lord_Howe', seq, 23 * HOUR);
    });

    it('365 iterations with a 45-minute offset (Chatham) without drift', function () {
      const seq = runs('0 12 * * *', 'Pacific/Chatham', '2025-01-01T00:00:00Z', 365);
      assertGuarantees('0 12 * * *', 'Pacific/Chatham', seq, 23 * HOUR);
      for (const d of seq) expect(wall(d, 'Pacific/Chatham').slice(11)).toBe('12:00');
    });

    it('1000 per-minute iterations stay monotonic (NY)', function () {
      const seq = runs('* * * * *', 'America/New_York', '2025-03-09T05:00:00Z', 1000);
      assertGuarantees('* * * * *', 'America/New_York', seq, MINUTE);
    });

    it('1000 per-second iterations stay monotonic (NY)', function () {
      const seq = runs('* * * * * *', 'America/New_York', '2025-03-09T06:55:00Z', 1000);
      assertGuarantees('* * * * * *', 'America/New_York', seq, SECOND);
    });
  });
});
