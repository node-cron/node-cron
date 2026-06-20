import { assert } from 'chai';
import { TimeMatcher } from './time-matcher';

describe('TimeMatcher', function() {
    describe('wildcard', function() {
        it('should accept wildcard for second', function() {
            const matcher = new TimeMatcher('* * * * * *');
            assert.isTrue(matcher.match(new Date()));
        });

        it('should accept wildcard for minute', function() {
            const matcher = new TimeMatcher('0 * * * * *');
            assert.isTrue(matcher.match(new Date(2018, 0, 1, 10, 20, 0)));
            assert.isFalse(matcher.match(new Date(2018, 0, 1, 10, 20, 1)));
        });

        it('should accept wildcard for hour', function() {
            const matcher = new TimeMatcher('0 0 * * * *');
            assert.isTrue(matcher.match(new Date(2018, 0, 1, 10, 0, 0)));
            assert.isFalse(matcher.match(new Date(2018, 0, 1, 10, 1, 0)));
        });

        it('should accept wildcard for day', function() {
            const matcher = new TimeMatcher('0 0 0 * * *');
            assert.isTrue(matcher.match(new Date(2018, 0, 1, 0, 0, 0)));
            assert.isFalse(matcher.match(new Date(2018, 0, 1, 1, 0, 0)));
        });

        it('should accept wildcard for month', function() {
            const matcher = new TimeMatcher('0 0 0 1 * *');
            assert.isTrue(matcher.match(new Date(2018, 0, 1, 0, 0, 0)));
            assert.isFalse(matcher.match(new Date(2018, 0, 2, 0, 0, 0)));
        });

        it('should accept wildcard for week day', function() {
            const matcher = new TimeMatcher('0 0 0 1 4 *');
            assert.isTrue(matcher.match(new Date(2018, 3, 1, 0, 0, 0)));
            assert.isFalse(matcher.match(new Date(2018, 3, 2, 0, 0, 0)));
        });
    });

    describe('single value', function() {
        it('should accept single value for second', function() {
            const matcher = new TimeMatcher('5 * * * * *');
            assert.isTrue(matcher.match(new Date(2018, 0, 1, 0, 0, 5)));
            assert.isFalse(matcher.match(new Date(2018, 0, 1, 0, 0, 6)));
        });

        it('should accept single value for minute', function() {
            const matcher = new TimeMatcher('0 5 * * * *');
            assert.isTrue(matcher.match(new Date(2018, 0, 1, 0, 5, 0)));
            assert.isFalse(matcher.match(new Date(2018, 0, 1, 0, 6, 0)));
        });

        it('should accept single value for hour', function() {
            const matcher = new TimeMatcher('0 0 5 * * *');
            assert.isTrue(matcher.match(new Date(2018, 0, 1, 5, 0, 0)));
            assert.isFalse(matcher.match(new Date(2018, 0, 1, 6, 0, 0)));
        });

        it('should accept single value for day', function() {
            const matcher = new TimeMatcher('0 0 0 5 * *');
            assert.isTrue(matcher.match(new Date(2018, 0, 5, 0, 0, 0)));
            assert.isFalse(matcher.match(new Date(2018, 0, 6, 0, 0, 0)));
        });

        it('should accept single value for month', function() {
            const matcher = new TimeMatcher('0 0 0 1 5 *');
            assert.isTrue(matcher.match(new Date(2018, 4, 1, 0, 0, 0)));
            assert.isFalse(matcher.match(new Date(2018, 5, 1, 0, 0, 0)));
        });

        it('should accept single value for week day', function() {
            const matcher = new TimeMatcher('0 0 0 * * monday');
            assert.isTrue(matcher.match(new Date(2018, 4, 7, 0, 0, 0)));
            assert.isFalse(matcher.match(new Date(2018, 4, 8, 0, 0, 0)));
        });
    });

    describe('multiple values', function() {
        it('should accept multiple values for second', function() {
            const matcher = new TimeMatcher('5,6 * * * * *');
            assert.isTrue(matcher.match(new Date(2018, 0, 1, 0, 0, 5)));
            assert.isTrue(matcher.match(new Date(2018, 0, 1, 0, 0, 6)));
            assert.isFalse(matcher.match(new Date(2018, 0, 1, 0, 0, 7)));
        });

        it('should accept multiple values for minute', function() {
            const matcher = new TimeMatcher('0 5,6 * * * *');
            assert.isTrue(matcher.match(new Date(2018, 0, 1, 0, 5, 0)));
            assert.isTrue(matcher.match(new Date(2018, 0, 1, 0, 6, 0)));
            assert.isFalse(matcher.match(new Date(2018, 0, 1, 0, 7, 0)));
        });
        
        it('should accept multiple values for hour', function() {
            const matcher = new TimeMatcher('0 0 5,6 * * *');
            assert.isTrue(matcher.match(new Date(2018, 0, 1, 5, 0, 0)));
            assert.isTrue(matcher.match(new Date(2018, 0, 1, 6, 0, 0)));
            assert.isFalse(matcher.match(new Date(2018, 0, 1, 7, 0, 0)));
        });

        it('should accept multiple values for day', function() {
            const matcher = new TimeMatcher('0 0 0 5,6 * *');
            assert.isTrue(matcher.match(new Date(2018, 0, 5, 0, 0, 0)));
            assert.isTrue(matcher.match(new Date(2018, 0, 6, 0, 0, 0)));
            assert.isFalse(matcher.match(new Date(2018, 0, 7, 0, 0, 0)));
        });

        it('should accept multiple values for month', function() {
            const matcher = new TimeMatcher('0 0 0 1 may,june *');
            assert.isTrue(matcher.match(new Date(2018, 4, 1, 0, 0, 0)));
            assert.isTrue(matcher.match(new Date(2018, 5, 1, 0, 0, 0)));
            assert.isFalse(matcher.match(new Date(2018, 6, 1, 0, 0, 0)));
        });

        it('should accept multiple values for week day', function() {
            const matcher = new TimeMatcher('0 0 0 * * monday,tue');
            assert.isTrue(matcher.match(new Date(2018, 4, 7, 0, 0, 0)));
            assert.isTrue(matcher.match(new Date(2018, 4, 8, 0, 0, 0)));
            assert.isFalse(matcher.match(new Date(2018, 4, 9, 0, 0, 0)));
        });
    });

    describe('range', function() {
        it('should accept range for second', function() {
            const matcher = new TimeMatcher('5-7 * * * * *');
            assert.isTrue(matcher.match(new Date(2018, 0, 1, 0, 0, 5)));
            assert.isTrue(matcher.match(new Date(2018, 0, 1, 0, 0, 6)));
            assert.isTrue(matcher.match(new Date(2018, 0, 1, 0, 0, 7)));
            assert.isFalse(matcher.match(new Date(2018, 0, 1, 0, 0, 8)));
        });

        it('should accept range for minute', function() {
            const matcher = new TimeMatcher('0 5-7 * * * *');
            assert.isTrue(matcher.match(new Date(2018, 0, 1, 0, 5, 0)));
            assert.isTrue(matcher.match(new Date(2018, 0, 1, 0, 6, 0)));
            assert.isTrue(matcher.match(new Date(2018, 0, 1, 0, 7, 0)));
            assert.isFalse(matcher.match(new Date(2018, 0, 1, 0, 8, 0)));
        });

        it('should accept range for hour', function() {
            const matcher = new TimeMatcher('0 0 5-7 * * *');
            assert.isTrue(matcher.match(new Date(2018, 0, 1, 5, 0, 0)));
            assert.isTrue(matcher.match(new Date(2018, 0, 1, 6, 0, 0)));
            assert.isTrue(matcher.match(new Date(2018, 0, 1, 7, 0, 0)));
            assert.isFalse(matcher.match(new Date(2018, 0, 1, 8, 0, 0)));
        });

        it('should accept range for day', function() {
            const matcher = new TimeMatcher('0 0 0 5-7 * *');
            assert.isTrue(matcher.match(new Date(2018, 0, 5, 0, 0, 0)));
            assert.isTrue(matcher.match(new Date(2018, 0, 6, 0, 0, 0)));
            assert.isTrue(matcher.match(new Date(2018, 0, 7, 0, 0, 0)));
            assert.isFalse(matcher.match(new Date(2018, 0, 8, 0, 0, 0)));
        });

        it('should accept range for month', function() {
            const matcher = new TimeMatcher('0 0 0 1 may-july *');
            assert.isTrue(matcher.match(new Date(2018, 4, 1, 0, 0, 0)));
            assert.isTrue(matcher.match(new Date(2018, 5, 1, 0, 0, 0)));
            assert.isTrue(matcher.match(new Date(2018, 6, 1, 0, 0, 0)));
            assert.isFalse(matcher.match(new Date(2018, 7, 1, 0, 0, 0)));
        });

        it('should accept range for week day', function() {
            const matcher = new TimeMatcher('0 0 0 * * monday-wed');
            assert.isTrue(matcher.match(new Date(2018, 4, 7, 0, 0, 0)));
            assert.isTrue(matcher.match(new Date(2018, 4, 8, 0, 0, 0)));
            assert.isTrue(matcher.match(new Date(2018, 4, 9, 0, 0, 0)));
            assert.isFalse(matcher.match(new Date(2018, 4, 10, 0, 0, 0)));
        });
    });

    describe('step values', function() {
        it('should accept step values for second', function() {
            const matcher = new TimeMatcher('*/2 * * * * *');
            assert.isTrue(matcher.match(new Date(2018, 0, 1, 0, 0, 2)));
            assert.isTrue(matcher.match(new Date(2018, 0, 1, 0, 0, 6)));
            assert.isFalse(matcher.match(new Date(2018, 0, 1, 0, 0, 7)));
        });

        it('should accept step values for minute', function() {
            const matcher = new TimeMatcher('0 */2 * * * *');
            assert.isTrue(matcher.match(new Date(2018, 0, 1, 0, 2, 0)));
            assert.isTrue(matcher.match(new Date(2018, 0, 1, 0, 6, 0)));
            assert.isFalse(matcher.match(new Date(2018, 0, 1, 0, 7, 0)));
        });
        
        it('should accept step values for hour', function() {
            const matcher = new TimeMatcher('0 0 */2 * * *');
            assert.isTrue(matcher.match(new Date(2018, 0, 1, 2, 0, 0)));
            assert.isTrue(matcher.match(new Date(2018, 0, 1, 6, 0, 0)));
            assert.isFalse(matcher.match(new Date(2018, 0, 1, 7, 0, 0)));
        });

        it('should accept step values for day', function() {
            const matcher = new TimeMatcher('0 0 0 */2 * *');
            assert.isTrue(matcher.match(new Date(2018, 0, 1, 0, 0, 0)));
            assert.isTrue(matcher.match(new Date(2018, 0, 3, 0, 0, 0)));
            assert.isTrue(matcher.match(new Date(2018, 0, 5, 0, 0, 0)));
            assert.isFalse(matcher.match(new Date(2018, 0, 6, 0, 0, 0)));
        });

        it('should accept step values for month', function() {
            const matcher = new TimeMatcher('0 0 0 1 */2 *');
            assert.isTrue(matcher.match(new Date(2018, 0, 1, 0, 0, 0)));
            assert.isTrue(matcher.match(new Date(2018, 2, 1, 0, 0, 0)));
            assert.isFalse(matcher.match(new Date(2018, 5, 1, 0, 0, 0)));
        });

        it('should accept step values for week day', function() {
            const matcher = new TimeMatcher('0 0 0 * * */2');
            assert.isTrue(matcher.match(new Date(2018, 4, 6, 0, 0, 0)));
            assert.isTrue(matcher.match(new Date(2018, 4, 8, 0, 0, 0)));
            assert.isFalse(matcher.match(new Date(2018, 4, 9, 0, 0, 0)));
        });
    });

    describe('timezone', function() {
        it('should match with timezone America/Sao_Paulo', function() {
            const matcher = new TimeMatcher('0 0 0 * * *', 'America/Sao_Paulo');
            const utcTime = new Date('Thu Oct 11 2018 03:00:00Z');
            assert.isTrue(matcher.match(utcTime));
        });

        it('should match with timezone Europe/Rome', function() {
            const matcher = new TimeMatcher('0 0 0 * * *', 'Europe/Rome');
            const utcTime = new Date('Thu Oct 11 2018 22:00:00Z');
            assert.isTrue(matcher.match(utcTime));
        });
    });

    describe('getNextMatch', ()=> {
      it('should return next match', ()=>{
        const matcher = new TimeMatcher('1 0 * * *', 'Etc/UTC');
        const nextMatch = matcher.getNextMatch(new Date(Date.UTC(2025, 4, 20, 18, 0, 0)));
        const expected = new Date(Date.UTC(2025, 4, 21, 0, 1, 0))
        assert.deepEqual(nextMatch, expected)
      })

      it('should return a future date near DST spring-forward boundary', ()=>{
        // 2026-03-07 22:32:42 EST (night before US spring-forward on March 8)
        const baseDate = new Date('2026-03-08T03:32:42Z');

        const everyMinute = new TimeMatcher('* * * * *');
        const next1 = everyMinute.getNextMatch(baseDate);
        assert.isTrue(next1 > baseDate, 'every-minute next match must be in the future');

        const every5 = new TimeMatcher('*/5 * * * *');
        const next2 = every5.getNextMatch(baseDate);
        assert.isTrue(next2 > baseDate, 'every-5-min next match must be in the future');
      })

      it('should return next day for daily schedule across DST boundary with timezone', ()=>{
        // 2026-03-07 22:32:42 EST — next 7am ET should be ~8.5 hours away, not months
        const baseDate = new Date('2026-03-08T03:32:42Z');
        const matcher = new TimeMatcher('0 7 * * *', 'America/New_York');
        const next = matcher.getNextMatch(baseDate);
        const hoursAway = (next.getTime() - baseDate.getTime()) / (1000 * 60 * 60);
        assert.isTrue(next > baseDate, 'next match must be in the future');
        assert.isTrue(hoursAway < 48, `next 7am should be within 48 hours, got ${hoursAway.toFixed(1)}h`);
      })

      it('should never return a past date during the spring-forward skipped hour', ()=>{
        // The local hour 02:00-02:59 does not exist on 2026-03-08 in New York
        // (clocks jump 02:00 EST -> 03:00 EDT at 07:00Z). A base anywhere in the
        // hour right before the jump must still yield a future match, not a past one.
        const expressions = ['* * * * *', '*/5 * * * *', '0 * * * *'];
        const bases = [
          '2026-03-08T06:30:00Z',
          '2026-03-08T06:58:00Z',
          '2026-03-08T06:59:00Z',
          '2026-03-08T06:59:30Z',
        ];

        for (const expression of expressions) {
          for (const base of bases) {
            const baseDate = new Date(base);
            const next = new TimeMatcher(expression, 'America/New_York').getNextMatch(baseDate);
            assert.isTrue(
              next > baseDate,
              `"${expression}" at ${base} must return a future date, got ${next.toISOString()}`
            );
          }
        }
      })

      it('should return a future date during the fall-back repeated hour', ()=>{
        // 2026-11-01: clocks fall back 02:00 EDT -> 01:00 EST at 06:00Z.
        const baseDate = new Date('2026-11-01T05:30:00Z');
        const next = new TimeMatcher('* * * * *', 'America/New_York').getNextMatch(baseDate);
        assert.isTrue(next > baseDate, `expected future date, got ${next.toISOString()}`);
      })

      it('should skip the day when the scheduled time falls in the spring-forward gap', ()=>{
        // 2026-03-08 New York: 02:00-02:59 do not exist. "30 2 * * *" cannot run
        // that day, so the next run is 02:30 the following day, not next year.
        const next = new TimeMatcher('30 2 * * *', 'America/New_York').getNextMatch(new Date('2026-03-08T06:30:00Z'));
        assert.equal(next.toISOString(), '2026-03-09T06:30:00.000Z');
      })

      it('should return the next occurrence for weekday-constrained schedules without overshooting', ()=>{
        // base 2026-06-15 (Mon). Each weekday should resolve to its next
        // occurrence within a week, never years ahead.
        const base = new Date('2026-06-15T18:47:58Z');
        const expected: Record<string, string> = {
          '0 18 * * 3': '2026-06-17T22:00:00.000Z', // Wed
          '0 18 * * 4': '2026-06-18T22:00:00.000Z', // Thu
          '0 18 * * 0': '2026-06-21T22:00:00.000Z', // Sun
        };
        for (const [expr, want] of Object.entries(expected)) {
          const next = new TimeMatcher(expr, 'America/New_York').getNextMatch(base);
          assert.equal(next.toISOString(), want, `expr ${expr}`);
        }
      })

      it('should jump across years for a Feb 29 schedule', ()=>{
        const next = new TimeMatcher('0 0 29 2 *', 'Etc/UTC').getNextMatch(new Date('2026-03-01T00:00:00Z'));
        assert.equal(next.toISOString(), '2028-02-29T00:00:00.000Z');
      })

      it('should skip months that do not have day 31', ()=>{
        const next = new TimeMatcher('0 0 31 * *', 'Etc/UTC').getNextMatch(new Date('2026-04-15T00:00:00Z'));
        assert.equal(next.toISOString(), '2026-05-31T00:00:00.000Z');
      })

      it('should throw for an expression that can never match', ()=>{
        // Feb 31 does not exist, so there is no next run.
        assert.throws(
          () => new TimeMatcher('0 0 31 2 *', 'Etc/UTC').getNextMatch(new Date('2026-01-01T00:00:00Z')),
          'Could not find next matching date within reasonable time range'
        );
      })

      it('should return the first occurrence of a time in the fall-back repeated hour', ()=>{
        // 2026-11-01 New York: 01:00-01:59 happen twice (02:00 EDT -> 01:00 EST at 06:00Z).
        // 01:30 daily resolves to the first occurrence (EDT), strictly after the base.
        const next = new TimeMatcher('30 1 * * *', 'America/New_York').getNextMatch(new Date('2026-11-01T04:00:00Z'));
        assert.equal(next.toISOString(), '2026-11-01T05:30:00.000Z');
      })
    })

    describe('last day of month (L)', function() {
      it('matches the last day of each month', function() {
        const matcher = new TimeMatcher('0 0 12 L * *');
        assert.isTrue(matcher.match(new Date(2025, 0, 31, 12, 0, 0)));  // Jan 31
        assert.isTrue(matcher.match(new Date(2025, 1, 28, 12, 0, 0)));  // Feb 28 (common year)
        assert.isTrue(matcher.match(new Date(2024, 1, 29, 12, 0, 0)));  // Feb 29 (leap year)
        assert.isTrue(matcher.match(new Date(2025, 3, 30, 12, 0, 0)));  // Apr 30
      });

      it('does not match a non-last day', function() {
        const matcher = new TimeMatcher('0 0 12 L * *');
        assert.isFalse(matcher.match(new Date(2025, 0, 30, 12, 0, 0)));  // Jan 30
        assert.isFalse(matcher.match(new Date(2025, 1, 27, 12, 0, 0)));  // Feb 27
        assert.isFalse(matcher.match(new Date(2024, 1, 28, 12, 0, 0)));  // Feb 28 in a leap year
      });

      it('accepts a lowercase l', function() {
        const matcher = new TimeMatcher('0 0 12 l * *');
        assert.isTrue(matcher.match(new Date(2025, 0, 31, 12, 0, 0)));
      });

      it('supports L combined with explicit days', function() {
        const matcher = new TimeMatcher('0 0 12 15,L * *');
        assert.isTrue(matcher.match(new Date(2025, 0, 15, 12, 0, 0)));
        assert.isTrue(matcher.match(new Date(2025, 0, 31, 12, 0, 0)));
        assert.isFalse(matcher.match(new Date(2025, 0, 20, 12, 0, 0)));
      });

      it('getNextMatch finds the last day of the current month', function() {
        const next = new TimeMatcher('0 0 12 L * *', 'Etc/UTC').getNextMatch(new Date('2025-01-10T00:00:00Z'));
        assert.equal(next.toISOString(), '2025-01-31T12:00:00.000Z');
      });

      it('getNextMatch rolls over to the next month-end', function() {
        const next = new TimeMatcher('0 0 12 L * *', 'Etc/UTC').getNextMatch(new Date('2025-02-01T00:00:00Z'));
        assert.equal(next.toISOString(), '2025-02-28T12:00:00.000Z');
      });

      it('getNextMatch resolves Feb 29 on a leap year', function() {
        const next = new TimeMatcher('0 0 12 L * *', 'Etc/UTC').getNextMatch(new Date('2024-02-01T00:00:00Z'));
        assert.equal(next.toISOString(), '2024-02-29T12:00:00.000Z');
      });
    })

    describe('nth weekday (#) token', function() {
      // June 2026: Tuesdays fall on 2, 9, 16, 23, 30 (the 16th is the 3rd).
      it('matches only the 3rd Tuesday at 12:00 for 2#3', function() {
        const matcher = new TimeMatcher('0 0 12 * * 2#3', 'Etc/UTC');
        assert.isTrue(matcher.match(new Date(Date.UTC(2026, 5, 16, 12, 0, 0))));
        assert.isFalse(matcher.match(new Date(Date.UTC(2026, 5, 2, 12, 0, 0))));  // 1st Tuesday
        assert.isFalse(matcher.match(new Date(Date.UTC(2026, 5, 9, 12, 0, 0))));  // 2nd Tuesday
        assert.isFalse(matcher.match(new Date(Date.UTC(2026, 5, 23, 12, 0, 0)))); // 4th Tuesday
        assert.isFalse(matcher.match(new Date(Date.UTC(2026, 5, 30, 12, 0, 0)))); // 5th Tuesday
      });

      it('does not match the right occurrence at the wrong time', function() {
        const matcher = new TimeMatcher('0 0 12 * * 2#3', 'Etc/UTC');
        assert.isFalse(matcher.match(new Date(Date.UTC(2026, 5, 16, 11, 0, 0))));
        assert.isFalse(matcher.match(new Date(Date.UTC(2026, 5, 16, 13, 0, 0))));
      });

      it('matches the first Monday for 1#1', function() {
        // Weekday numbering follows cron: 0/7 = Sunday, so 1 = Monday.
        const matcher = new TimeMatcher('0 0 12 * * 1#1', 'Etc/UTC');
        // June 2026: first Monday is the 1st.
        assert.isTrue(matcher.match(new Date(Date.UTC(2026, 5, 1, 12, 0, 0))));
        assert.isFalse(matcher.match(new Date(Date.UTC(2026, 5, 8, 12, 0, 0)))); // 2nd Monday
      });

      it('matches the first Sunday for 0#1', function() {
        const matcher = new TimeMatcher('0 0 12 * * 0#1', 'Etc/UTC');
        // June 2026: first Sunday is the 7th.
        assert.isTrue(matcher.match(new Date(Date.UTC(2026, 5, 7, 12, 0, 0))));
        assert.isFalse(matcher.match(new Date(Date.UTC(2026, 5, 14, 12, 0, 0)))); // 2nd Sunday
      });

      it('treats 7#1 as the first Sunday (7 = Sunday)', function() {
        const matcher = new TimeMatcher('0 0 12 * * 7#1', 'Etc/UTC');
        assert.isTrue(matcher.match(new Date(Date.UTC(2026, 5, 7, 12, 0, 0))));
      });

      it('never matches #5 in a month with only four occurrences', function() {
        // February 2026: Sundays fall on 1, 8, 15, 22 (only four).
        const matcher = new TimeMatcher('0 0 12 * * 0#5', 'Etc/UTC');
        assert.isFalse(matcher.match(new Date(Date.UTC(2026, 1, 22, 12, 0, 0)))); // 4th & last Sunday
        assert.isFalse(matcher.match(new Date(Date.UTC(2026, 1, 1, 12, 0, 0))));
      });

      it('getNextMatch advances across months', function() {
        const matcher = new TimeMatcher('0 0 12 * * 2#3', 'Etc/UTC');
        // Starting before the 3rd Tuesday of January 2026 (the 20th).
        const jan = matcher.getNextMatch(new Date('2026-01-01T00:00:00Z'));
        assert.equal(jan.toISOString(), '2026-01-20T12:00:00.000Z');
        // From just after, it rolls to February's 3rd Tuesday (the 17th).
        const feb = matcher.getNextMatch(jan);
        assert.equal(feb.toISOString(), '2026-02-17T12:00:00.000Z');
        const mar = matcher.getNextMatch(feb);
        assert.equal(mar.toISOString(), '2026-03-17T12:00:00.000Z');
      });

      it('getNextMatch skips months without a 5th occurrence', function() {
        const matcher = new TimeMatcher('0 0 12 * * 0#5', 'Etc/UTC');
        // February 2026 has only four Sundays, so the next 5th Sunday is in March.
        const next = matcher.getNextMatch(new Date('2026-02-01T00:00:00Z'));
        assert.equal(next.toISOString(), '2026-03-29T12:00:00.000Z');
      });

      it('matches when combined with a plain weekday', function() {
        // Either any Friday (5) or the 3rd Tuesday.
        const matcher = new TimeMatcher('0 0 12 * * 5,2#3', 'Etc/UTC');
        assert.isTrue(matcher.match(new Date(Date.UTC(2026, 5, 5, 12, 0, 0))));  // a Friday
        assert.isTrue(matcher.match(new Date(Date.UTC(2026, 5, 16, 12, 0, 0)))); // 3rd Tuesday
        assert.isFalse(matcher.match(new Date(Date.UTC(2026, 5, 9, 12, 0, 0))));  // 2nd Tuesday, not Friday
      });
    })
});