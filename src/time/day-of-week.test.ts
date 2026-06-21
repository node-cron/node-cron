import { assert } from 'chai';
import {
  isNthWeekdayToken,
  parseNthWeekday,
  occurrenceInMonth,
  matchesNthWeekday,
  isLastWeekdayOfMonth,
  isLastWeekdayToken,
  parseLastWeekdayToken,
  matchesDayOfWeek,
} from './day-of-week';

describe('day-of-week', function () {
  describe('isNthWeekdayToken', function () {
    it('recognises valid <weekday>#<nth> tokens', function () {
      assert.isTrue(isNthWeekdayToken('2#3'));
      assert.isTrue(isNthWeekdayToken('0#1'));
      assert.isTrue(isNthWeekdayToken('7#5'));
    });

    it('rejects non-tokens', function () {
      assert.isFalse(isNthWeekdayToken(2));
      assert.isFalse(isNthWeekdayToken('2'));
      assert.isFalse(isNthWeekdayToken('8#1'));
      assert.isFalse(isNthWeekdayToken('2#6'));
      assert.isFalse(isNthWeekdayToken('2#0'));
      assert.isFalse(isNthWeekdayToken('#3'));
      assert.isFalse(isNthWeekdayToken('2#'));
    });
  });

  describe('parseNthWeekday', function () {
    it('parses weekday and nth', function () {
      assert.deepEqual(parseNthWeekday('2#3'), { weekday: 2, nth: 3 });
    });

    it('normalises weekday 7 to 0 (Sunday)', function () {
      assert.deepEqual(parseNthWeekday('7#1'), { weekday: 0, nth: 1 });
    });

    it('returns null for non-tokens', function () {
      assert.isNull(parseNthWeekday(2));
      assert.isNull(parseNthWeekday('2#6'));
    });
  });

  describe('occurrenceInMonth', function () {
    it('maps day numbers to their occurrence index', function () {
      assert.equal(occurrenceInMonth(1), 1);
      assert.equal(occurrenceInMonth(7), 1);
      assert.equal(occurrenceInMonth(8), 2);
      assert.equal(occurrenceInMonth(15), 3);
      assert.equal(occurrenceInMonth(22), 4);
      assert.equal(occurrenceInMonth(29), 5);
    });
  });

  describe('matchesNthWeekday', function () {
    // June 2026: Tuesdays fall on 2, 9, 16, 23, 30.
    it('matches the nth occurrence of the weekday', function () {
      assert.isTrue(matchesNthWeekday('2#3', 2026, 6, 16)); // 3rd Tuesday
      assert.isTrue(matchesNthWeekday('2#1', 2026, 6, 2)); // 1st Tuesday
      assert.isTrue(matchesNthWeekday('2#5', 2026, 6, 30)); // 5th Tuesday
    });

    it('does not match other occurrences of the weekday', function () {
      assert.isFalse(matchesNthWeekday('2#3', 2026, 6, 9)); // 2nd Tuesday
      assert.isFalse(matchesNthWeekday('2#3', 2026, 6, 23)); // 4th Tuesday
    });

    it('does not match a different weekday', function () {
      assert.isFalse(matchesNthWeekday('2#3', 2026, 6, 15)); // a Monday
    });

    it('returns false for non-token input', function () {
      assert.isFalse(matchesNthWeekday('2', 2026, 6, 16));
    });
  });

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
    function weekdayOf(year: number, month: number, day: number): number {
      return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
    }

    it('matches plain numeric weekdays', function () {
      // June 16 2026 is a Tuesday (2).
      assert.isTrue(matchesDayOfWeek([2], 2026, 6, 16, weekdayOf(2026, 6, 16)));
      assert.isFalse(matchesDayOfWeek([1], 2026, 6, 16, weekdayOf(2026, 6, 16)));
    });

    it('matches nth-weekday tokens', function () {
      assert.isTrue(matchesDayOfWeek(['2#3'], 2026, 6, 16, weekdayOf(2026, 6, 16)));
      assert.isFalse(matchesDayOfWeek(['2#3'], 2026, 6, 9, weekdayOf(2026, 6, 9)));
    });

    it('supports nth tokens mixed with numeric weekdays', function () {
      // 5 (Friday) or the 3rd Tuesday.
      assert.isTrue(matchesDayOfWeek([5, '2#3'], 2026, 6, 16, weekdayOf(2026, 6, 16)));
      assert.isTrue(matchesDayOfWeek([5, '2#3'], 2026, 6, 5, weekdayOf(2026, 6, 5))); // a Friday
      assert.isFalse(matchesDayOfWeek([5, '2#3'], 2026, 6, 9, weekdayOf(2026, 6, 9))); // 2nd Tuesday
    });

    it('never matches #5 in a month with only four occurrences', function () {
      // February 2026: Sundays fall on 1, 8, 15, 22 (only four).
      assert.isFalse(matchesDayOfWeek(['0#5'], 2026, 2, 22, weekdayOf(2026, 2, 22)));
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

    it('supports an L token combined with explicit weekdays', function () {
      // last Friday or any Monday (weekday 1).
      assert.isTrue(matchesDayOfWeek(['5L', 1], 2026, 6, 26, 5)); // last Friday
      assert.isTrue(matchesDayOfWeek(['5L', 1], 2026, 6, 22, 1)); // a Monday
      assert.isFalse(matchesDayOfWeek(['5L', 1], 2026, 6, 19, 5)); // non-last Friday, not Monday
    });
  });
});
