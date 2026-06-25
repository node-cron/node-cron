import { MatcherWalker } from './matcher-walker';
import { TimeMatcher } from './time-matcher';

function createWalker(expression: string, baseDate: Date, timezone?: string) {
  const tm = new TimeMatcher(expression, timezone);
  return new MatcherWalker(tm, baseDate, timezone);
}

describe('matcher-walker', function(){
  it('get next second', function(){
    const baseDate = new Date(Date.UTC(2025, 0, 1, 0, 0, 0));

    const mw = createWalker("* * * * * *", baseDate, 'Etc/UTC');

    const m = mw.matchNext();
    expect(m.toISO()).toBe('2025-01-01T00:00:01.000Z');
  });

  it('match on next next minute', function(){
    const baseDate = new Date(Date.UTC(2025, 0, 1, 0, 0, 11));

    const mw = createWalker("10 * * * * *", baseDate, 'Etc/UTC');

    expect(mw.isMatching()).toBe(false);
    const m = mw.matchNext();
    expect(m.toISO()).toBe('2025-01-01T00:01:10.000Z');
  });

  it('match on next hour', function(){
    const baseDate = new Date(Date.UTC(2025, 0, 1, 0, 11, 0));

    const mw = createWalker("0 10 * * * *", baseDate, 'Etc/UTC');

    expect(mw.isMatching()).toBe(false);
    const m = mw.matchNext();
    expect(m.toISO()).toBe('2025-01-01T01:10:00.000Z');
  });

  it('match on next day', function(){
    const baseDate = new Date(Date.UTC(2025, 0, 1, 11, 0, 0));

    const mw = createWalker("0 0 10 * * *", baseDate, 'Etc/UTC');

    expect(mw.isMatching()).toBe(false);
    const m = mw.matchNext();
    expect(m.toISO()).toBe('2025-01-02T10:00:00.000Z');
  });

  it('match on next month', function(){
    const baseDate = new Date(Date.UTC(2025, 0, 11, 0, 0, 0));

    const mw = createWalker("0 0 0 10 * *", baseDate, 'Etc/UTC');

    expect(mw.isMatching()).toBe(false);
    const m = mw.matchNext();
    expect(m.toISO()).toBe('2025-02-10T00:00:00.000Z');
  });

  it('match on next on year', function(){
    const baseDate = new Date(Date.UTC(2025, 10, 1, 0, 0, 0));

    const mw = createWalker("0 0 0 1 10 *", baseDate, 'Etc/UTC');

    expect(mw.isMatching()).toBe(false);
    const m = mw.matchNext();
    expect(m.toISO()).toBe('2026-10-01T00:00:00.000Z');
  });

  it('match on next weekday', function(){
    const baseDate = new Date(Date.UTC(2025, 4, 2, 0, 0, 0));

    const mw = createWalker("0 0 0 2 may wednesday", baseDate, 'Etc/UTC');

    expect(mw.isMatching()).toBe(false);
    const m = mw.matchNext();
    expect(m.toISO()).toBe('2029-05-02T00:00:00.000Z');
  });

  it('should match next Sunday at 03:43 from Aug 4th 2025', function(){
    const baseDate = new Date(Date.UTC(2025, 7, 4, 0, 0, 0));

    const mw = createWalker("43 3 * * Sun", baseDate, 'Etc/UTC');

    expect(mw.isMatching()).toBe(false);
    const m = mw.matchNext();
    expect(m.toISO()).toBe('2025-08-10T03:43:00.000Z');
  });

  it('should match next Sunday in September or January from Aug 4th 2025', function(){
    const baseDate = new Date(Date.UTC(2025, 7, 4, 0, 0, 0));

    const mw = createWalker("* * * January,September Sunday", baseDate, 'Etc/UTC');

    expect(mw.isMatching()).toBe(false);
    const m = mw.matchNext();
    expect(m.toISO()).toBe('2025-09-07T00:00:00.000Z');
  });

  it('should match next Sunday in January or March from Aug 4th 2025 (crossing year boundary)', function(){
    const baseDate = new Date(Date.UTC(2025, 7, 4, 0, 0, 0));

    const mw = createWalker("* * * January,March Sunday", baseDate, 'Etc/UTC');

    expect(mw.isMatching()).toBe(false);
    const m = mw.matchNext();
    expect(m.toISO()).toBe('2026-01-04T00:00:00.000Z');
  });

  it('should find the 3rd Tuesday of the month with #', function(){
    const baseDate = new Date(Date.UTC(2026, 5, 1, 0, 0, 0));

    const mw = createWalker("0 0 9 * * 2#3", baseDate, 'Etc/UTC');

    const m = mw.matchNext();
    expect(m.toISO()).toBe('2026-06-16T09:00:00.000Z');
  });

  it('should skip months where the 5th occurrence does not exist', function(){
    const baseDate = new Date(Date.UTC(2026, 1, 1, 0, 0, 0));

    const mw = createWalker("0 0 0 * * 0#5", baseDate, 'Etc/UTC');

    const m = mw.matchNext();
    expect(m.toISO()).toBe('2026-03-29T00:00:00.000Z');
  });

  it('should enumerate multiple months correctly with #', function(){
    const baseDate = new Date(Date.UTC(2026, 0, 1, 0, 0, 0));

    const mw = createWalker("0 0 12 * * 5#2", baseDate, 'Etc/UTC');

    const m1 = mw.matchNext();
    expect(m1.toISO()).toBe('2026-01-09T12:00:00.000Z');

    const mw2 = createWalker("0 0 12 * * 5#2", m1.toDate(), 'Etc/UTC');
    const m2 = mw2.matchNext();
    expect(m2.toISO()).toBe('2026-02-13T12:00:00.000Z');

    const mw3 = createWalker("0 0 12 * * 5#2", m2.toDate(), 'Etc/UTC');
    const m3 = mw3.matchNext();
    expect(m3.toISO()).toBe('2026-03-13T12:00:00.000Z');
  });

  it('should find the last Friday of the month with L', function(){
    const baseDate = new Date(Date.UTC(2026, 5, 1, 0, 0, 0));

    const mw = createWalker("0 0 18 * * 5L", baseDate, 'Etc/UTC');

    const m = mw.matchNext();
    expect(m.toISO()).toBe('2026-06-26T18:00:00.000Z');
  });

  it('should advance across months with L', function(){
    const baseDate = new Date(Date.UTC(2026, 5, 1, 0, 0, 0));

    const mw = createWalker("0 0 8 * * 1L", baseDate, 'Etc/UTC');

    const m1 = mw.matchNext();
    expect(m1.toISO()).toBe('2026-06-29T08:00:00.000Z');

    const mw2 = createWalker("0 0 8 * * 1L", m1.toDate(), 'Etc/UTC');
    const m2 = mw2.matchNext();
    expect(m2.toISO()).toBe('2026-07-27T08:00:00.000Z');
  });
});
