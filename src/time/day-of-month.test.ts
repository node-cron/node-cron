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
  });
});
