import { assert } from 'chai';
import {
  isLastWeekdayOfMonth,
  isLastWeekdayToken,
  matchesDayOfWeek,
  parseLastWeekdayToken,
} from './day-of-week';

describe('day-of-week', function () {
  describe('parseLastWeekdayToken', function () {
    it('parses a numeric weekday token', function () {
      assert.equal(parseLastWeekdayToken('5L'), 5);
      assert.equal(parseLastWeekdayToken('0L'), 0);
    });

    it('normalises 7L to Sunday (0)', function () {
      assert.equal(parseLastWeekdayToken('7L'), 0);
    });

    it('accepts a lowercase l', function () {
      assert.equal(parseLastWeekdayToken('5l'), 5);
    });

    it('returns null for non-tokens', function () {
      assert.isNull(parseLastWeekdayToken(5));
      assert.isNull(parseLastWeekdayToken('L'));
      assert.isNull(parseLastWeekdayToken('L5'));
      assert.isNull(parseLastWeekdayToken('8L'));
    });
  });

  describe('isLastWeekdayToken', function () {
    it('is true for a valid token and false otherwise', function () {
      assert.isTrue(isLastWeekdayToken('5L'));
      assert.isTrue(isLastWeekdayToken('7L'));
      assert.isFalse(isLastWeekdayToken(5));
      assert.isFalse(isLastWeekdayToken('L'));
    });
  });

  describe('isLastWeekdayOfMonth', function () {
    // June 2026: Fridays fall on 5, 12, 19, 26.
    it('is true for the last occurrence of the weekday', function () {
      assert.isTrue(isLastWeekdayOfMonth(2026, 6, 26)); // last Friday
    });

    it('is false for an earlier occurrence of the weekday', function () {
      assert.isFalse(isLastWeekdayOfMonth(2026, 6, 19)); // 2nd-to-last Friday
      assert.isFalse(isLastWeekdayOfMonth(2026, 6, 5));
    });

    it('handles a month-end weekday across a month boundary', function () {
      // Jan 31 2025 is a Friday and the last Friday of January.
      assert.isTrue(isLastWeekdayOfMonth(2025, 1, 31));
    });
  });

  describe('matchesDayOfWeek', function () {
    it('matches an explicit numeric weekday', function () {
      // 2026-06-26 is a Friday (weekday 5).
      assert.isTrue(matchesDayOfWeek([5], 2026, 6, 26, 5));
      assert.isFalse(matchesDayOfWeek([5], 2026, 6, 25, 4));
    });

    it("matches only the last weekday for a '<weekday>L' token", function () {
      assert.isTrue(matchesDayOfWeek(['5L'], 2026, 6, 26, 5));  // last Friday
      assert.isFalse(matchesDayOfWeek(['5L'], 2026, 6, 19, 5)); // earlier Friday
    });

    it('matches the last Sunday for 0L / 7L (both normalise to 0)', function () {
      // June 2026: Sundays fall on 7, 14, 21, 28. Last Sunday = 28.
      assert.isTrue(matchesDayOfWeek(['0L'], 2026, 6, 28, 0));
      assert.isFalse(matchesDayOfWeek(['0L'], 2026, 6, 21, 0));
    });

    it('supports a token combined with explicit weekdays', function () {
      // last Friday or any Monday (weekday 1).
      assert.isTrue(matchesDayOfWeek(['5L', 1], 2026, 6, 26, 5)); // last Friday
      assert.isTrue(matchesDayOfWeek(['5L', 1], 2026, 6, 22, 1)); // a Monday
      assert.isFalse(matchesDayOfWeek(['5L', 1], 2026, 6, 19, 5)); // non-last Friday, not Monday
    });
  });
});
