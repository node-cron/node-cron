import { assert } from 'chai';
import { MatcherWalker } from './matcher-walker';

describe('matcher-walker', function(){
  it('get next second', function(){
    const baseDate = new Date(Date.UTC(2025, 0, 1, 0, 0, 0));

    const mw = new MatcherWalker("* * * * * *", baseDate, 'Etc/UTC');

    const m = mw.matchNext();
    assert.equal(m.toISO(), '2025-01-01T00:00:01.000Z')
  });

  it('match on next next minute', function(){
    const baseDate = new Date(Date.UTC(2025, 0, 1, 0, 0, 11));

    const mw = new MatcherWalker("10 * * * * *", baseDate, 'Etc/UTC');

    assert.isFalse(mw.isMatching())
    const m = mw.matchNext();
    assert.equal(m.toISO(), '2025-01-01T00:01:10.000Z')
  });

  it('match on next hour', function(){
    const baseDate = new Date(Date.UTC(2025, 0, 1, 0, 11, 0));

    const mw = new MatcherWalker("0 10 * * * *", baseDate, 'Etc/UTC');

    assert.isFalse(mw.isMatching())
    const m = mw.matchNext();
    assert.equal(m.toISO(), '2025-01-01T01:10:00.000Z')
  });

  it('match on next day', function(){
    const baseDate = new Date(Date.UTC(2025, 0, 1, 11, 0, 0));

    const mw = new MatcherWalker("0 0 10 * * *", baseDate, 'Etc/UTC');

    assert.isFalse(mw.isMatching())
    const m = mw.matchNext();
    assert.equal(m.toISO(), '2025-01-02T10:00:00.000Z')
  });

  it('match on next month', function(){
    const baseDate = new Date(Date.UTC(2025, 0, 11, 0, 0, 0));

    const mw = new MatcherWalker("0 0 0 10 * *", baseDate, 'Etc/UTC');

    assert.isFalse(mw.isMatching())
    const m = mw.matchNext();
    assert.equal(m.toISO(), '2025-02-10T00:00:00.000Z')
  });

  it('match on next on year', function(){
    const baseDate = new Date(Date.UTC(2025, 10, 1, 0, 0, 0));

    const mw = new MatcherWalker("0 0 0 1 10 *", baseDate, 'Etc/UTC');

    assert.isFalse(mw.isMatching())
    const m = mw.matchNext();
    assert.equal(m.toISO(), '2026-10-01T00:00:00.000Z')
  });

  it('match on next weekday', function(){
    const baseDate = new Date(Date.UTC(2025, 4, 2, 0, 0, 0));

    const mw = new MatcherWalker("0 0 0 2 may wednesday", baseDate, 'Etc/UTC');

    assert.isFalse(mw.isMatching())
    const m = mw.matchNext();
    assert.equal(m.toISO(), '2029-05-02T00:00:00.000Z')
  });

  it('should match next Sunday at 03:43 from Aug 4th 2025', function(){
    const baseDate = new Date(Date.UTC(2025, 7, 4, 0, 0, 0));
  
    const mw = new MatcherWalker("43 3 * * Sun", baseDate, 'Etc/UTC');
  
    assert.isFalse(mw.isMatching())
    const m = mw.matchNext();
    assert.equal(m.toISO(), '2025-08-10T03:43:00.000Z')
  });
  
  it('should match next Sunday in September or January from Aug 4th 2025', function(){
    const baseDate = new Date(Date.UTC(2025, 7, 4, 0, 0, 0));
  
    const mw = new MatcherWalker("* * * January,September Sunday", baseDate, 'Etc/UTC');
  
    assert.isFalse(mw.isMatching())
    const m = mw.matchNext();
    assert.equal(m.toISO(), '2025-09-07T00:00:00.000Z')
  });
  
  it('should match next Sunday in January or March from Aug 4th 2025 (crossing year boundary)', function(){
    const baseDate = new Date(Date.UTC(2025, 7, 4, 0, 0, 0));

    const mw = new MatcherWalker("* * * January,March Sunday", baseDate, 'Etc/UTC');

    assert.isFalse(mw.isMatching())
    const m = mw.matchNext();
    assert.equal(m.toISO(), '2026-01-04T00:00:00.000Z')
  });

  it('should find the 3rd Tuesday of the month with #', function(){
    const baseDate = new Date(Date.UTC(2026, 5, 1, 0, 0, 0));

    const mw = new MatcherWalker("0 0 9 * * 2#3", baseDate, 'Etc/UTC');

    const m = mw.matchNext();
    assert.equal(m.toISO(), '2026-06-16T09:00:00.000Z');
  });

  it('should skip months where the 5th occurrence does not exist', function(){
    // Feb 2026 has only 4 Sundays (1, 8, 15, 22). The 5th Sunday
    // does not exist, so the walker must advance to March (29th).
    const baseDate = new Date(Date.UTC(2026, 1, 1, 0, 0, 0));

    const mw = new MatcherWalker("0 0 0 * * 0#5", baseDate, 'Etc/UTC');

    const m = mw.matchNext();
    assert.equal(m.toISO(), '2026-03-29T00:00:00.000Z');
  });

  it('should enumerate multiple months correctly with #', function(){
    // 2nd Friday at noon, starting Jan 2026.
    // Jan: Fri 9 → 2nd is 9. Feb: Fri 6,13 → 2nd is 13. Mar: Fri 6,13 → 2nd is 13.
    const baseDate = new Date(Date.UTC(2026, 0, 1, 0, 0, 0));

    const mw = new MatcherWalker("0 0 12 * * 5#2", baseDate, 'Etc/UTC');

    const m1 = mw.matchNext();
    assert.equal(m1.toISO(), '2026-01-09T12:00:00.000Z');

    const mw2 = new MatcherWalker("0 0 12 * * 5#2", m1.toDate(), 'Etc/UTC');
    const m2 = mw2.matchNext();
    assert.equal(m2.toISO(), '2026-02-13T12:00:00.000Z');

    const mw3 = new MatcherWalker("0 0 12 * * 5#2", m2.toDate(), 'Etc/UTC');
    const m3 = mw3.matchNext();
    assert.equal(m3.toISO(), '2026-03-13T12:00:00.000Z');
  });

  it('should find the last Friday of the month with L', function(){
    // June 2026: Fridays on 5, 12, 19, 26. Last = 26.
    const baseDate = new Date(Date.UTC(2026, 5, 1, 0, 0, 0));

    const mw = new MatcherWalker("0 0 18 * * 5L", baseDate, 'Etc/UTC');

    const m = mw.matchNext();
    assert.equal(m.toISO(), '2026-06-26T18:00:00.000Z');
  });

  it('should advance across months with L', function(){
    // Last Monday at 8am. June 2026: last Mon = 29. July 2026: last Mon = 27.
    const baseDate = new Date(Date.UTC(2026, 5, 1, 0, 0, 0));

    const mw = new MatcherWalker("0 0 8 * * 1L", baseDate, 'Etc/UTC');

    const m1 = mw.matchNext();
    assert.equal(m1.toISO(), '2026-06-29T08:00:00.000Z');

    const mw2 = new MatcherWalker("0 0 8 * * 1L", m1.toDate(), 'Etc/UTC');
    const m2 = mw2.matchNext();
    assert.equal(m2.toISO(), '2026-07-27T08:00:00.000Z');
  });
});