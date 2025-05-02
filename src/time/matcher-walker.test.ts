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
});