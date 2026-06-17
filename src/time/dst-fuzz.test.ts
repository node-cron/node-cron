import { assert } from 'chai';
import { TimeMatcher } from './time-matcher';

// Fuzz testing (spec 05-spec-dst, section 3.6).
//
// The RNG is seeded so a CI failure is fully reproducible: the same seed
// replays the same expressions, timezones and base dates. Override the seed
// with FUZZ_SEED to explore further locally.

const SEED = Number(process.env.FUZZ_SEED) || 0xC0FFEE;

// Small deterministic PRNG (mulberry32).
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const ZONES = [
  'America/New_York', 'America/Sao_Paulo', 'Europe/London', 'Europe/Berlin',
  'Australia/Lord_Howe', 'Pacific/Chatham', 'America/Havana', 'Asia/Tokyo',
  'Etc/UTC', 'Pacific/Auckland', 'America/Chicago',
];

const intBetween = (rng: () => number, min: number, max: number) =>
  min + Math.floor(rng() * (max - min + 1));

// Produces a valid cron field for [min, max], biased towards '*' so most
// expressions are satisfiable and exercise real matches across DST.
function field(rng: () => number, min: number, max: number): string {
  const r = rng();
  if (r < 0.45) return '*';
  if (r < 0.65) return String(intBetween(rng, min, max));
  if (r < 0.80) { // step
    return `*/${intBetween(rng, 1, Math.max(2, Math.floor((max - min) / 2)))}`;
  }
  if (r < 0.92) { // range
    const a = intBetween(rng, min, max);
    const b = intBetween(rng, a, max);
    return `${a}-${b}`;
  }
  // list
  const a = intBetween(rng, min, max);
  const b = intBetween(rng, min, max);
  return `${a},${b}`;
}

function randomExpression(rng: () => number): string {
  // Day biased to 1-28 so the expression is usually satisfiable; month/weekday
  // full range. Impossible combinations still occur and are handled.
  return [
    field(rng, 0, 59),   // second
    field(rng, 0, 59),   // minute
    field(rng, 0, 23),   // hour
    field(rng, 1, 28),   // day of month
    field(rng, 1, 12),   // month
    field(rng, 0, 6),    // day of week
  ].join(' ');
}

function randomDate(rng: () => number): Date {
  // somewhere in 2020-2030
  const start = Date.UTC(2020, 0, 1);
  const end = Date.UTC(2030, 0, 1);
  return new Date(start + Math.floor(rng() * (end - start)));
}

describe('DST fuzz (spec 3.6)', function () {
  it('FZ-1: getNextMatch always returns a timestamp strictly after the reference', function () {
    const rng = mulberry32(SEED);
    let matched = 0;
    for (let i = 0; i < 3000; i++) {
      const expr = randomExpression(rng);
      const tz = ZONES[intBetween(rng, 0, ZONES.length - 1)];
      const base = randomDate(rng);
      let next: Date;
      try {
        next = new TimeMatcher(expr, tz).getNextMatch(base);
      } catch (err: any) {
        // An impossible expression must fail in finite time, not loop forever.
        assert.match(err.message, /reasonable time range/, `unexpected error for "${expr}" @ ${tz}`);
        continue;
      }
      assert.isAbove(
        next.getTime(), base.getTime(),
        `seed=${SEED} "${expr}" @ ${tz} from ${base.toISOString()} returned ${next.toISOString()} (not in the future)`
      );
      matched++;
    }
    // sanity: the generator should mostly produce satisfiable expressions
    assert.isAbove(matched, 2500, 'most fuzzed expressions should be satisfiable');
  });

  it('FZ-2: 10,000 chained getNextMatch stay strictly monotonic across DST', function () {
    const matcher = new TimeMatcher('* * * * *', 'America/New_York');
    let prev = new Date('2025-01-01T00:00:00Z'); // crosses both 2025 transitions
    for (let i = 0; i < 10000; i++) {
      const next = matcher.getNextMatch(prev);
      assert.isAbove(next.getTime(), prev.getTime(), `iteration ${i} did not advance`);
      assert.isAtLeast(next.getTime() - prev.getTime(), 60000, `iteration ${i} fired faster than the 1-minute interval`);
      prev = next;
    }
  });

  it('FZ-4: a dense expression with a day-of-month + weekday constraint resolves fast', function () {
    // Regression: `* * * 15 * 1` (the 15th only when it is a Monday) used to
    // scan all 86,400 times of day on every non-Monday 15th (~5 minutes). The
    // weekday pre-check in the walker skips those days outright.
    const start = Date.now();
    const next = new TimeMatcher('* * * 15 * 1', 'America/New_York')
      .getNextMatch(new Date('2025-01-01T00:00:00Z'));
    assert.equal(next.toISOString(), '2025-09-15T04:00:00.000Z'); // first Monday the 15th
    assert.isBelow(Date.now() - start, 1000, 'must skip weekday-mismatched days instead of scanning each one');
  });

  it('FZ-3: impossible expressions throw in finite time (<= the walk bound)', function () {
    for (const expr of ['0 0 31 2 *', '0 0 30 2 *', '0 0 31 4 *', '0 0 31 6 *']) {
      const start = Date.now();
      assert.throws(
        () => new TimeMatcher(expr, 'America/New_York').getNextMatch(new Date('2025-01-01T00:00:00Z')),
        /reasonable time range/,
        `"${expr}" should be reported impossible`
      );
      assert.isBelow(Date.now() - start, 5000, `"${expr}" took too long to give up`);
    }
  });
});
