import { assert } from 'chai';
import { lastDayOfMonth, matchesDayOfMonth } from './day-of-month';

describe('day-of-month', function () {
  describe('lastDayOfMonth', function () {
    it('returns 31 for January', function () {
      assert.equal(lastDayOfMonth(2025, 1), 31);
    });
    it('returns 30 for April', function () {
      assert.equal(lastDayOfMonth(2025, 4), 30);
    });
    it('returns 28 for a common-year February', function () {
      assert.equal(lastDayOfMonth(2025, 2), 28);
    });
    it('returns 29 for a leap-year February', function () {
      assert.equal(lastDayOfMonth(2024, 2), 29);
    });
  });

  describe('matchesDayOfMonth', function () {
    it('matches an explicit numeric day', function () {
      assert.isTrue(matchesDayOfMonth([15], 2025, 1, 15));
      assert.isFalse(matchesDayOfMonth([15], 2025, 1, 16));
    });

    it("matches the last day of the month for the 'L' token", function () {
      assert.isTrue(matchesDayOfMonth(['L'], 2025, 1, 31));   // Jan -> 31
      assert.isTrue(matchesDayOfMonth(['L'], 2025, 2, 28));   // Feb common year
      assert.isTrue(matchesDayOfMonth(['L'], 2024, 2, 29));   // Feb leap year
      assert.isTrue(matchesDayOfMonth(['L'], 2025, 4, 30));   // Apr -> 30
    });

    it("does not match a non-last day for 'L'", function () {
      assert.isFalse(matchesDayOfMonth(['L'], 2025, 1, 30));
      assert.isFalse(matchesDayOfMonth(['L'], 2025, 2, 27));
      assert.isFalse(matchesDayOfMonth(['L'], 2024, 2, 28)); // 28 is not last in a leap Feb
    });

    it("supports 'L' combined with explicit days", function () {
      assert.isTrue(matchesDayOfMonth([15, 'L'], 2025, 1, 15));
      assert.isTrue(matchesDayOfMonth([15, 'L'], 2025, 1, 31));
      assert.isFalse(matchesDayOfMonth([15, 'L'], 2025, 1, 20));
    });

    describe("the 'nW' / 'LW' (nearest weekday) tokens", function () {
      // Anchor months (2025): Mar 1 = Sat, Mar 15 = Sat, Mar 31 = Mon;
      // Jun 1 = Sun, Jun 15 = Sun; May 31 = Sat; Aug 31 = Sun.

      it('fires on the same day when the target is a weekday', function () {
        // Jan 15 2025 is a Wednesday.
        assert.isTrue(matchesDayOfMonth(['15W'], 2025, 1, 15));
        assert.isFalse(matchesDayOfMonth(['15W'], 2025, 1, 14));
        assert.isFalse(matchesDayOfMonth(['15W'], 2025, 1, 16));
      });

      it('shifts a Saturday target to the previous Friday', function () {
        // Mar 15 2025 is a Saturday -> Fri 14.
        assert.isTrue(matchesDayOfMonth(['15W'], 2025, 3, 14));
        assert.isFalse(matchesDayOfMonth(['15W'], 2025, 3, 15));
      });

      it('shifts a Sunday target to the following Monday', function () {
        // Jun 15 2025 is a Sunday -> Mon 16.
        assert.isTrue(matchesDayOfMonth(['15W'], 2025, 6, 16));
        assert.isFalse(matchesDayOfMonth(['15W'], 2025, 6, 15));
      });

      it('keeps 1W inside the month when the 1st is a Saturday', function () {
        // Mar 1 2025 is a Saturday -> Mon 3 (not Feb 28).
        assert.isTrue(matchesDayOfMonth(['1W'], 2025, 3, 3));
        assert.isFalse(matchesDayOfMonth(['1W'], 2025, 3, 1));
      });

      it('keeps 1W inside the month when the 1st is a Sunday', function () {
        // Jun 1 2025 is a Sunday -> Mon 2.
        assert.isTrue(matchesDayOfMonth(['1W'], 2025, 6, 2));
        assert.isFalse(matchesDayOfMonth(['1W'], 2025, 6, 1));
      });

      it('resolves LW to the last weekday of the month', function () {
        // Mar 31 2025 = Mon (weekday) -> 31.
        assert.isTrue(matchesDayOfMonth(['LW'], 2025, 3, 31));
        // May 31 2025 = Sat -> Fri 30.
        assert.isTrue(matchesDayOfMonth(['LW'], 2025, 5, 30));
        assert.isFalse(matchesDayOfMonth(['LW'], 2025, 5, 31));
        // Aug 31 2025 = Sun -> Fri 29.
        assert.isTrue(matchesDayOfMonth(['LW'], 2025, 8, 29));
        assert.isFalse(matchesDayOfMonth(['LW'], 2025, 8, 31));
      });

      it('never fires for a target day that does not exist in the month', function () {
        // 31W in April (30 days) -> no day matches.
        for (let day = 1; day <= 30; day++) {
          assert.isFalse(matchesDayOfMonth(['31W'], 2025, 4, day));
        }
      });

      it('supports a list of W tokens', function () {
        // Mar 2025: 1W -> Mon 3, LW -> Mon 31.
        assert.isTrue(matchesDayOfMonth(['1W', 'LW'], 2025, 3, 3));
        assert.isTrue(matchesDayOfMonth(['1W', 'LW'], 2025, 3, 31));
        assert.isFalse(matchesDayOfMonth(['1W', 'LW'], 2025, 3, 15));
      });
    });

    describe("the 'L-n' (offset from last day) token", function () {
      it('resolves L-n relative to the last day of the month', function () {
        assert.isTrue(matchesDayOfMonth(['L-3'], 2025, 1, 28));  // Jan (31) -> 28
        assert.isFalse(matchesDayOfMonth(['L-3'], 2025, 1, 27));
        assert.isFalse(matchesDayOfMonth(['L-3'], 2025, 1, 29));
        assert.isTrue(matchesDayOfMonth(['L-3'], 2025, 2, 25));  // Feb (28) -> 25
        assert.isTrue(matchesDayOfMonth(['L-3'], 2025, 4, 27));  // Apr (30) -> 27
      });

      it('resolves L-30 to the 1st only in 31-day months', function () {
        assert.isTrue(matchesDayOfMonth(['L-30'], 2025, 1, 1)); // Jan (31) -> 1
        for (let day = 1; day <= 30; day++) {
          assert.isFalse(matchesDayOfMonth(['L-30'], 2025, 4, day)); // Apr (30) -> 0, no day
        }
      });

      it('never fires when the offset reaches before the 1st', function () {
        // Feb 2025 (28 days): L-29 -> -1, no day matches.
        for (let day = 1; day <= 28; day++) {
          assert.isFalse(matchesDayOfMonth(['L-29'], 2025, 2, day));
        }
      });
    });
  });
});
