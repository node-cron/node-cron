import { assert } from 'chai';
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
    assert.isTrue(matcher.match(sequence[i]),
      `${wall(sequence[i], tz)} (${sequence[i].toISOString()}) must satisfy ${expr} — a skipped gap time would fail here`);
    if (i > 0) {
      const delta = sequence[i].getTime() - sequence[i - 1].getTime();
      assert.isAbove(delta, 0, `run ${i} must be strictly after run ${i - 1} (monotonic)`);
      assert.isAtLeast(delta, intervalMs, `gap before run ${i} must be >= the interval (no rapid-fire)`);
    }
  }
}

describe('DST guarantees', function () {
  describe('3.1 spring-forward (gap)', function () {
    it('SF-1: a daily time inside the gap skips that day', function () {
      // 2025-03-09 New York: 02:00 -> 03:00, so 02:45 does not exist that day.
      const seq = runs('45 2 * * *', 'America/New_York', '2025-03-07T12:00:00Z', 3);
      assert.equal(wall(seq[0], 'America/New_York'), '2025-03-08 02:45');
      assert.equal(wall(seq[1], 'America/New_York'), '2025-03-10 02:45'); // 03-09 skipped
      assert.equal(wall(seq[2], 'America/New_York'), '2025-03-11 02:45');
    });

    it('SF-2: hourly crosses the gap (02:00 skipped)', function () {
      const seq = runs('0 * * * *', 'America/New_York', '2025-03-09T05:30:00Z', 4);
      assertGuarantees('0 * * * *', 'America/New_York', seq, HOUR);
      assert.equal(wall(seq[0], 'America/New_York'), '2025-03-09 01:00');
      assert.equal(wall(seq[1], 'America/New_York'), '2025-03-09 03:00'); // not 02:00
    });

    it('SF-3: */15 crosses the gap (02:00-02:45 skipped)', function () {
      const seq = runs('*/15 * * * *', 'America/New_York', '2025-03-09T06:40:00Z', 3);
      assertGuarantees('*/15 * * * *', 'America/New_York', seq, 15 * MINUTE);
      assert.equal(wall(seq[0], 'America/New_York'), '2025-03-09 01:45');
      assert.equal(wall(seq[1], 'America/New_York'), '2025-03-09 03:00');
    });

    it('SF-4: per-minute crosses the gap', function () {
      const seq = runs('* * * * *', 'America/New_York', '2025-03-09T06:58:00Z', 4);
      assertGuarantees('* * * * *', 'America/New_York', seq, MINUTE);
      assert.equal(wall(seq[0], 'America/New_York'), '2025-03-09 01:59');
      assert.equal(wall(seq[1], 'America/New_York'), '2025-03-09 03:00');
    });

    it('SF-5: per-second crosses the gap', function () {
      const seq = runs('* * * * * *', 'America/New_York', '2025-03-09T06:59:58Z', 4);
      assertGuarantees('* * * * * *', 'America/New_York', seq, SECOND);
    });

    it('SF-6: 30-minute gap (Lord Howe 02:00 -> 02:30)', function () {
      const seq = runs('*/15 * * * *', 'Australia/Lord_Howe', '2025-10-05T15:40:00Z', 5);
      assertGuarantees('*/15 * * * *', 'Australia/Lord_Howe', seq, 15 * MINUTE);
      // no run falls in the 02:00-02:29 gap
      for (const d of seq) assert.notMatch(wall(d, 'Australia/Lord_Howe'), /2025-10-06 02:(00|15)$/);
    });

    it('SF-7: gap at midnight (Havana 00:00 -> 01:00) skips that day', function () {
      const seq = runs('30 0 * * *', 'America/Havana', '2025-03-07T12:00:00Z', 3);
      assert.equal(wall(seq[0], 'America/Havana'), '2025-03-08 00:30');
      assert.equal(wall(seq[1], 'America/Havana'), '2025-03-10 00:30'); // 03-09 00:30 does not exist
    });

    it('SF-8: 45-minute base offset stays correct hourly (Chatham)', function () {
      const seq = runs('0 * * * *', 'Pacific/Chatham', '2025-04-06T01:40:00Z', 6);
      assertGuarantees('0 * * * *', 'Pacific/Chatham', seq, HOUR);
    });

    it('SF-9: target exactly at the start of the gap (02:00) is skipped', function () {
      const seq = runs('0 2 * * *', 'America/New_York', '2025-03-08T12:00:00Z', 1);
      assert.equal(wall(seq[0], 'America/New_York'), '2025-03-10 02:00'); // 03-09 02:00 skipped
    });

    it('SF-10: target exactly at the end of the gap (03:00) fires', function () {
      const seq = runs('0 3 * * *', 'America/New_York', '2025-03-08T12:00:00Z', 1);
      assert.equal(wall(seq[0], 'America/New_York'), '2025-03-09 03:00');
    });
  });

  describe('3.2 fall-back (overlap)', function () {
    it('FB-1: a daily time inside the overlap fires on the first occurrence', function () {
      // 2025-11-02 New York: 02:00 -> 01:00. 01:15 happens twice; fire EDT (first).
      const seq = runs('15 1 * * *', 'America/New_York', '2025-11-01T12:00:00Z', 1);
      assert.equal(seq[0].toISOString(), '2025-11-02T05:15:00.000Z'); // 01:15 EDT, not 06:15Z (EST)
    });

    it('FB-2: hourly during overlap ignores the repeated hour', function () {
      const seq = runs('0 * * * *', 'America/New_York', '2025-11-02T04:30:00Z', 3);
      assertGuarantees('0 * * * *', 'America/New_York', seq, HOUR);
      assert.equal(seq[0].toISOString(), '2025-11-02T05:00:00.000Z'); // 01:00 EDT
      assert.equal(seq[1].toISOString(), '2025-11-02T07:00:00.000Z'); // 02:00 EST (01:00 EST skipped)
    });

    it('FB-3: per-minute advances monotonically through the overlap', function () {
      const seq = runs('* * * * *', 'America/New_York', '2025-11-02T05:57:00Z', 5);
      assertGuarantees('* * * * *', 'America/New_York', seq, MINUTE);
    });

    it('FB-4: per-second advances monotonically through the overlap', function () {
      const seq = runs('* * * * * *', 'America/New_York', '2025-11-02T05:59:57Z', 6);
      assertGuarantees('* * * * * *', 'America/New_York', seq, SECOND);
    });

    it('FB-5: per-minute rapid-fire prevention (Chicago)', function () {
      const seq = runs('* * * * *', 'America/Chicago', '2025-11-02T06:57:00Z', 6);
      assertGuarantees('* * * * *', 'America/Chicago', seq, MINUTE);
    });

    it('FB-6: per-second rapid-fire prevention (Chicago)', function () {
      const seq = runs('* * * * * *', 'America/Chicago', '2025-11-02T06:59:57Z', 6);
      assertGuarantees('* * * * * *', 'America/Chicago', seq, SECOND);
    });

    it('FB-7: 30-minute overlap (Lord Howe) advances monotonically', function () {
      // 2025-04-06 Lord Howe: 02:00 -> 01:30 (ends DST, 30-minute overlap).
      const seq = runs('*/15 * * * *', 'Australia/Lord_Howe', '2025-04-05T15:00:00Z', 8);
      assertGuarantees('*/15 * * * *', 'Australia/Lord_Howe', seq, 15 * MINUTE);
    });

    it('FB-8: overlap with a 45-minute base offset (Chatham) fires once', function () {
      const seq = runs('0 * * * *', 'Pacific/Chatham', '2025-04-05T12:00:00Z', 6);
      assertGuarantees('0 * * * *', 'Pacific/Chatham', seq, HOUR);
    });

    it('FB-9: the exact transition second (02:00 EST) fires normally', function () {
      const seq = runs('0 2 * * *', 'America/New_York', '2025-11-02T05:00:00Z', 1);
      assert.equal(seq[0].toISOString(), '2025-11-02T07:00:00.000Z'); // 02:00 EST
    });

    it('FB-10: getNextMatch during the second occurrence returns the next day', function () {
      // base = 01:20 during the EST repeat; the first 01:15 already passed.
      const seq = runs('15 1 * * *', 'America/New_York', '2025-11-02T06:20:00Z', 1);
      assert.equal(wall(seq[0], 'America/New_York'), '2025-11-03 01:15');
    });
  });

  describe('3.3 negative controls (no DST)', function () {
    it('CN-1: a zone without DST fires every day, no skip or double (Tokyo)', function () {
      const seq = runs('30 2 * * *', 'Asia/Tokyo', '2025-03-07T00:00:00Z', 5);
      assertGuarantees('30 2 * * *', 'Asia/Tokyo', seq, 23 * HOUR);
      for (const d of seq) assert.equal(wall(d, 'Asia/Tokyo').slice(11), '02:30');
    });

    it('CN-2: pure UTC is immune to DST (24 hourly fires per day)', function () {
      const seq = runs('0 * * * *', 'Etc/UTC', '2025-03-09T00:00:00Z', 24);
      assertGuarantees('0 * * * *', 'Etc/UTC', seq, HOUR);
      assert.equal(seq[0].toISOString(), '2025-03-09T01:00:00.000Z');
      assert.equal(seq[23].toISOString(), '2025-03-10T00:00:00.000Z'); // 24 fires, no gap
    });
  });

  describe('3.4 stress (long enumeration)', function () {
    it('ST-1: 400 daily iterations crossing both transitions stay monotonic (NY 04:00)', function () {
      const seq = runs('0 4 * * *', 'America/New_York', '2025-01-01T00:00:00Z', 400);
      assertGuarantees('0 4 * * *', 'America/New_York', seq, 23 * HOUR);
    });

    it('ST-2: a year of a gap-time daily skips exactly the spring-forward day', function () {
      // 45 2 in NY: every day except the spring-forward day (2025-03-09).
      const seq = runs('45 2 * * *', 'America/New_York', '2025-01-01T00:00:00Z', 400);
      assertGuarantees('45 2 * * *', 'America/New_York', seq, 23 * HOUR);
      const skipped = seq.find(d => wall(d, 'America/New_York').startsWith('2025-03-09'));
      assert.isUndefined(skipped, 'no run should land on the spring-forward day');
    });

    it('ST-3: a year of an overlap-time daily never duplicates a day', function () {
      const seq = runs('15 1 * * *', 'America/New_York', '2025-01-01T00:00:00Z', 400);
      assertGuarantees('15 1 * * *', 'America/New_York', seq, 23 * HOUR);
      const days = seq.map(d => wall(d, 'America/New_York').slice(0, 10));
      assert.equal(new Set(days).size, days.length, 'each day appears at most once');
    });

    it('ST-5: 365 iterations in the southern hemisphere (Auckland)', function () {
      const seq = runs('30 2 * * *', 'Pacific/Auckland', '2025-01-01T00:00:00Z', 365);
      assertGuarantees('30 2 * * *', 'Pacific/Auckland', seq, 23 * HOUR);
    });

    it('ST-6: 365 iterations with a 30-minute DST (Lord Howe)', function () {
      const seq = runs('0 2 * * *', 'Australia/Lord_Howe', '2025-01-01T00:00:00Z', 365);
      assertGuarantees('0 2 * * *', 'Australia/Lord_Howe', seq, 23 * HOUR);
    });

    it('ST-7: 365 iterations with a 45-minute offset (Chatham) without drift', function () {
      const seq = runs('0 12 * * *', 'Pacific/Chatham', '2025-01-01T00:00:00Z', 365);
      assertGuarantees('0 12 * * *', 'Pacific/Chatham', seq, 23 * HOUR);
      for (const d of seq) assert.equal(wall(d, 'Pacific/Chatham').slice(11), '12:00');
    });

    it('ST-8: 1000 per-minute iterations stay monotonic (NY)', function () {
      const seq = runs('* * * * *', 'America/New_York', '2025-03-09T05:00:00Z', 1000);
      assertGuarantees('* * * * *', 'America/New_York', seq, MINUTE);
    });

    it('ST-9: 1000 per-second iterations stay monotonic (NY)', function () {
      const seq = runs('* * * * * *', 'America/New_York', '2025-03-09T06:55:00Z', 1000);
      assertGuarantees('* * * * * *', 'America/New_York', seq, SECOND);
    });
  });
});
