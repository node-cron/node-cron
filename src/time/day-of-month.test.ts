import { lastDayOfMonth, matchesDayOfMonth } from './day-of-month';

describe('day-of-month', function () {
  describe('lastDayOfMonth', function () {
    it('returns 31 for January', function () {
      expect(lastDayOfMonth(2025, 1)).toBe(31);
    });
    it('returns 30 for April', function () {
      expect(lastDayOfMonth(2025, 4)).toBe(30);
    });
    it('returns 28 for a common-year February', function () {
      expect(lastDayOfMonth(2025, 2)).toBe(28);
    });
    it('returns 29 for a leap-year February', function () {
      expect(lastDayOfMonth(2024, 2)).toBe(29);
    });
  });

  describe('matchesDayOfMonth', function () {
    it('matches an explicit numeric day', function () {
      expect(matchesDayOfMonth([15], 2025, 1, 15)).toBe(true);
      expect(matchesDayOfMonth([15], 2025, 1, 16)).toBe(false);
    });

    it("matches the last day of the month for the 'L' token", function () {
      expect(matchesDayOfMonth(['L'], 2025, 1, 31)).toBe(true);   // Jan -> 31
      expect(matchesDayOfMonth(['L'], 2025, 2, 28)).toBe(true);   // Feb common year
      expect(matchesDayOfMonth(['L'], 2024, 2, 29)).toBe(true);   // Feb leap year
      expect(matchesDayOfMonth(['L'], 2025, 4, 30)).toBe(true);   // Apr -> 30
    });

    it("does not match a non-last day for 'L'", function () {
      expect(matchesDayOfMonth(['L'], 2025, 1, 30)).toBe(false);
      expect(matchesDayOfMonth(['L'], 2025, 2, 27)).toBe(false);
      expect(matchesDayOfMonth(['L'], 2024, 2, 28)).toBe(false); // 28 is not last in a leap Feb
    });

    it("supports 'L' combined with explicit days", function () {
      expect(matchesDayOfMonth([15, 'L'], 2025, 1, 15)).toBe(true);
      expect(matchesDayOfMonth([15, 'L'], 2025, 1, 31)).toBe(true);
      expect(matchesDayOfMonth([15, 'L'], 2025, 1, 20)).toBe(false);
    });

    describe("the 'nW' / 'LW' (nearest weekday) tokens", function () {
      // Anchor months (2025): Mar 1 = Sat, Mar 15 = Sat, Mar 31 = Mon;
      // Jun 1 = Sun, Jun 15 = Sun; May 31 = Sat; Aug 31 = Sun.

      it('fires on the same day when the target is a weekday', function () {
        // Jan 15 2025 is a Wednesday.
        expect(matchesDayOfMonth(['15W'], 2025, 1, 15)).toBe(true);
        expect(matchesDayOfMonth(['15W'], 2025, 1, 14)).toBe(false);
        expect(matchesDayOfMonth(['15W'], 2025, 1, 16)).toBe(false);
      });

      it('shifts a Saturday target to the previous Friday', function () {
        // Mar 15 2025 is a Saturday -> Fri 14.
        expect(matchesDayOfMonth(['15W'], 2025, 3, 14)).toBe(true);
        expect(matchesDayOfMonth(['15W'], 2025, 3, 15)).toBe(false);
      });

      it('shifts a Sunday target to the following Monday', function () {
        // Jun 15 2025 is a Sunday -> Mon 16.
        expect(matchesDayOfMonth(['15W'], 2025, 6, 16)).toBe(true);
        expect(matchesDayOfMonth(['15W'], 2025, 6, 15)).toBe(false);
      });

      it('keeps 1W inside the month when the 1st is a Saturday', function () {
        // Mar 1 2025 is a Saturday -> Mon 3 (not Feb 28).
        expect(matchesDayOfMonth(['1W'], 2025, 3, 3)).toBe(true);
        expect(matchesDayOfMonth(['1W'], 2025, 3, 1)).toBe(false);
      });

      it('keeps 1W inside the month when the 1st is a Sunday', function () {
        // Jun 1 2025 is a Sunday -> Mon 2.
        expect(matchesDayOfMonth(['1W'], 2025, 6, 2)).toBe(true);
        expect(matchesDayOfMonth(['1W'], 2025, 6, 1)).toBe(false);
      });

      it('resolves LW to the last weekday of the month', function () {
        // Mar 31 2025 = Mon (weekday) -> 31.
        expect(matchesDayOfMonth(['LW'], 2025, 3, 31)).toBe(true);
        // May 31 2025 = Sat -> Fri 30.
        expect(matchesDayOfMonth(['LW'], 2025, 5, 30)).toBe(true);
        expect(matchesDayOfMonth(['LW'], 2025, 5, 31)).toBe(false);
        // Aug 31 2025 = Sun -> Fri 29.
        expect(matchesDayOfMonth(['LW'], 2025, 8, 29)).toBe(true);
        expect(matchesDayOfMonth(['LW'], 2025, 8, 31)).toBe(false);
      });

      it('never fires for a target day that does not exist in the month', function () {
        // 31W in April (30 days) -> no day matches.
        for (let day = 1; day <= 30; day++) {
          expect(matchesDayOfMonth(['31W'], 2025, 4, day)).toBe(false);
        }
      });

      it('supports a list of W tokens', function () {
        // Mar 2025: 1W -> Mon 3, LW -> Mon 31.
        expect(matchesDayOfMonth(['1W', 'LW'], 2025, 3, 3)).toBe(true);
        expect(matchesDayOfMonth(['1W', 'LW'], 2025, 3, 31)).toBe(true);
        expect(matchesDayOfMonth(['1W', 'LW'], 2025, 3, 15)).toBe(false);
      });
    });

    describe("the 'L-n' (offset from last day) token", function () {
      it('resolves L-n relative to the last day of the month', function () {
        expect(matchesDayOfMonth(['L-3'], 2025, 1, 28)).toBe(true);  // Jan (31) -> 28
        expect(matchesDayOfMonth(['L-3'], 2025, 1, 27)).toBe(false);
        expect(matchesDayOfMonth(['L-3'], 2025, 1, 29)).toBe(false);
        expect(matchesDayOfMonth(['L-3'], 2025, 2, 25)).toBe(true);  // Feb (28) -> 25
        expect(matchesDayOfMonth(['L-3'], 2025, 4, 27)).toBe(true);  // Apr (30) -> 27
      });

      it('resolves L-30 to the 1st only in 31-day months', function () {
        expect(matchesDayOfMonth(['L-30'], 2025, 1, 1)).toBe(true); // Jan (31) -> 1
        for (let day = 1; day <= 30; day++) {
          expect(matchesDayOfMonth(['L-30'], 2025, 4, day)).toBe(false); // Apr (30) -> 0, no day
        }
      });

      it('never fires when the offset reaches before the 1st', function () {
        // Feb 2025 (28 days): L-29 -> -1, no day matches.
        for (let day = 1; day <= 28; day++) {
          expect(matchesDayOfMonth(['L-29'], 2025, 2, day)).toBe(false);
        }
      });
    });
  });
});
