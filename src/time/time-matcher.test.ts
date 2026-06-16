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
    })
});