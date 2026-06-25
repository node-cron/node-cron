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
      expect(isNthWeekdayToken('2#3')).toBe(true);
      expect(isNthWeekdayToken('0#1')).toBe(true);
      expect(isNthWeekdayToken('7#5')).toBe(true);
    });

    it('rejects non-tokens', function () {
      expect(isNthWeekdayToken(2)).toBe(false);
      expect(isNthWeekdayToken('2')).toBe(false);
      expect(isNthWeekdayToken('8#1')).toBe(false);
      expect(isNthWeekdayToken('2#6')).toBe(false);
      expect(isNthWeekdayToken('2#0')).toBe(false);
      expect(isNthWeekdayToken('#3')).toBe(false);
      expect(isNthWeekdayToken('2#')).toBe(false);
    });
  });

  describe('parseNthWeekday', function () {
    it('parses weekday and nth', function () {
      expect(parseNthWeekday('2#3')).toEqual({ weekday: 2, nth: 3 });
    });

    it('normalises weekday 7 to 0 (Sunday)', function () {
      expect(parseNthWeekday('7#1')).toEqual({ weekday: 0, nth: 1 });
    });

    it('returns null for non-tokens', function () {
      expect(parseNthWeekday(2)).toBeNull();
      expect(parseNthWeekday('2#6')).toBeNull();
    });
  });

  describe('occurrenceInMonth', function () {
    it('maps day numbers to their occurrence index', function () {
      expect(occurrenceInMonth(1)).toBe(1);
      expect(occurrenceInMonth(7)).toBe(1);
      expect(occurrenceInMonth(8)).toBe(2);
      expect(occurrenceInMonth(15)).toBe(3);
      expect(occurrenceInMonth(22)).toBe(4);
      expect(occurrenceInMonth(29)).toBe(5);
    });
  });

  describe('matchesNthWeekday', function () {
    // June 2026: Tuesdays fall on 2, 9, 16, 23, 30.
    it('matches the nth occurrence of the weekday', function () {
      expect(matchesNthWeekday('2#3', 2026, 6, 16)).toBe(true); // 3rd Tuesday
      expect(matchesNthWeekday('2#1', 2026, 6, 2)).toBe(true); // 1st Tuesday
      expect(matchesNthWeekday('2#5', 2026, 6, 30)).toBe(true); // 5th Tuesday
    });

    it('does not match other occurrences of the weekday', function () {
      expect(matchesNthWeekday('2#3', 2026, 6, 9)).toBe(false); // 2nd Tuesday
      expect(matchesNthWeekday('2#3', 2026, 6, 23)).toBe(false); // 4th Tuesday
    });

    it('does not match a different weekday', function () {
      expect(matchesNthWeekday('2#3', 2026, 6, 15)).toBe(false); // a Monday
    });

    it('returns false for non-token input', function () {
      expect(matchesNthWeekday('2', 2026, 6, 16)).toBe(false);
    });
  });

  describe('parseLastWeekdayToken', function () {
    it('parses a numeric weekday token', function () {
      expect(parseLastWeekdayToken('5L')).toBe(5);
      expect(parseLastWeekdayToken('0L')).toBe(0);
    });

    it('normalises 7L to Sunday (0)', function () {
      expect(parseLastWeekdayToken('7L')).toBe(0);
    });

    it('accepts a lowercase l', function () {
      expect(parseLastWeekdayToken('5l')).toBe(5);
    });

    it('returns null for non-tokens', function () {
      expect(parseLastWeekdayToken(5)).toBeNull();
      expect(parseLastWeekdayToken('L')).toBeNull();
      expect(parseLastWeekdayToken('L5')).toBeNull();
      expect(parseLastWeekdayToken('8L')).toBeNull();
    });
  });

  describe('isLastWeekdayToken', function () {
    it('is true for a valid token and false otherwise', function () {
      expect(isLastWeekdayToken('5L')).toBe(true);
      expect(isLastWeekdayToken('7L')).toBe(true);
      expect(isLastWeekdayToken(5)).toBe(false);
      expect(isLastWeekdayToken('L')).toBe(false);
    });
  });

  describe('isLastWeekdayOfMonth', function () {
    // June 2026: Fridays fall on 5, 12, 19, 26.
    it('is true for the last occurrence of the weekday', function () {
      expect(isLastWeekdayOfMonth(2026, 6, 26)).toBe(true); // last Friday
    });

    it('is false for an earlier occurrence of the weekday', function () {
      expect(isLastWeekdayOfMonth(2026, 6, 19)).toBe(false); // 2nd-to-last Friday
      expect(isLastWeekdayOfMonth(2026, 6, 5)).toBe(false);
    });

    it('handles a month-end weekday across a month boundary', function () {
      // Jan 31 2025 is a Friday and the last Friday of January.
      expect(isLastWeekdayOfMonth(2025, 1, 31)).toBe(true);
    });
  });

  describe('matchesDayOfWeek', function () {
    function weekdayOf(year: number, month: number, day: number): number {
      return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
    }

    it('matches plain numeric weekdays', function () {
      // June 16 2026 is a Tuesday (2).
      expect(matchesDayOfWeek([2], 2026, 6, 16, weekdayOf(2026, 6, 16))).toBe(true);
      expect(matchesDayOfWeek([1], 2026, 6, 16, weekdayOf(2026, 6, 16))).toBe(false);
    });

    it('matches nth-weekday tokens', function () {
      expect(matchesDayOfWeek(['2#3'], 2026, 6, 16, weekdayOf(2026, 6, 16))).toBe(true);
      expect(matchesDayOfWeek(['2#3'], 2026, 6, 9, weekdayOf(2026, 6, 9))).toBe(false);
    });

    it('supports nth tokens mixed with numeric weekdays', function () {
      // 5 (Friday) or the 3rd Tuesday.
      expect(matchesDayOfWeek([5, '2#3'], 2026, 6, 16, weekdayOf(2026, 6, 16))).toBe(true);
      expect(matchesDayOfWeek([5, '2#3'], 2026, 6, 5, weekdayOf(2026, 6, 5))).toBe(true); // a Friday
      expect(matchesDayOfWeek([5, '2#3'], 2026, 6, 9, weekdayOf(2026, 6, 9))).toBe(false); // 2nd Tuesday
    });

    it('never matches #5 in a month with only four occurrences', function () {
      // February 2026: Sundays fall on 1, 8, 15, 22 (only four).
      expect(matchesDayOfWeek(['0#5'], 2026, 2, 22, weekdayOf(2026, 2, 22))).toBe(false);
    });

    it("matches only the last weekday for a '<weekday>L' token", function () {
      expect(matchesDayOfWeek(['5L'], 2026, 6, 26, 5)).toBe(true);  // last Friday
      expect(matchesDayOfWeek(['5L'], 2026, 6, 19, 5)).toBe(false); // earlier Friday
    });

    it('matches the last Sunday for 0L / 7L (both normalise to 0)', function () {
      // June 2026: Sundays fall on 7, 14, 21, 28. Last Sunday = 28.
      expect(matchesDayOfWeek(['0L'], 2026, 6, 28, 0)).toBe(true);
      expect(matchesDayOfWeek(['0L'], 2026, 6, 21, 0)).toBe(false);
    });

    it('supports an L token combined with explicit weekdays', function () {
      // last Friday or any Monday (weekday 1).
      expect(matchesDayOfWeek(['5L', 1], 2026, 6, 26, 5)).toBe(true); // last Friday
      expect(matchesDayOfWeek(['5L', 1], 2026, 6, 22, 1)).toBe(true); // a Monday
      expect(matchesDayOfWeek(['5L', 1], 2026, 6, 19, 5)).toBe(false); // non-last Friday, not Monday
    });
  });
});
