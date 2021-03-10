const { assert } = require('chai');
const TimeMatcher = require('../src/time-matcher');
const moment = require('moment-timezone');

describe('TimeMatcher', () => {
    describe('wildcard', () => {
        it('should accept wildcard for second', () => {
            let matcher = new TimeMatcher('* * * * * *');
            assert.isTrue(matcher.match(new Date()));
        });

        it('should accept wildcard for minute', () => {
            let matcher = new TimeMatcher('0 * * * * *');
            assert.isTrue(matcher.match(new Date(2018, 0, 1, 10, 20, 0)));
            assert.isFalse(matcher.match(new Date(2018, 0, 1, 10, 20, 1)));
        });

        it('should accept wildcard for hour', () => {
            let matcher = new TimeMatcher('0 0 * * * *');
            assert.isTrue(matcher.match(new Date(2018, 0, 1, 10, 0, 0)));
            assert.isFalse(matcher.match(new Date(2018, 0, 1, 10, 1, 0)));
        });

        it('should accept wildcard for day', () => {
            let matcher = new TimeMatcher('0 0 0 * * *');
            assert.isTrue(matcher.match(new Date(2018, 0, 1, 0, 0, 0)));
            assert.isFalse(matcher.match(new Date(2018, 0, 1, 1, 0, 0)));
        });

        it('should accept wildcard for month', () => {
            let matcher = new TimeMatcher('0 0 0 1 * *');
            assert.isTrue(matcher.match(new Date(2018, 0, 1, 0, 0, 0)));
            assert.isFalse(matcher.match(new Date(2018, 0, 2, 0, 0, 0)));
        });

        it('should accept wildcard for week day', () => {
            let matcher = new TimeMatcher('0 0 0 1 4 *');
            assert.isTrue(matcher.match(new Date(2018, 3, 1, 0, 0, 0)));
            assert.isFalse(matcher.match(new Date(2018, 3, 2, 0, 0, 0)));
        });
    });

    describe('single value', () => {
        it('should accept single value for second', () => {
            let matcher = new TimeMatcher('5 * * * * *');
            assert.isTrue(matcher.match(new Date(2018, 0, 1, 0, 0, 5)));
            assert.isFalse(matcher.match(new Date(2018, 0, 1, 0, 0, 6)));
        });

        it('should accept single value for minute', () => {
            let matcher = new TimeMatcher('0 5 * * * *');
            assert.isTrue(matcher.match(new Date(2018, 0, 1, 0, 5, 0)));
            assert.isFalse(matcher.match(new Date(2018, 0, 1, 0, 6, 0)));
        });

        it('should accept single value for hour', () => {
            let matcher = new TimeMatcher('0 0 5 * * *');
            assert.isTrue(matcher.match(new Date(2018, 0, 1, 5, 0, 0)));
            assert.isFalse(matcher.match(new Date(2018, 0, 1, 6, 0, 0)));
        });

        it('should accept single value for day', () => {
            let matcher = new TimeMatcher('0 0 0 5 * *');
            assert.isTrue(matcher.match(new Date(2018, 0, 5, 0, 0, 0)));
            assert.isFalse(matcher.match(new Date(2018, 0, 6, 0, 0, 0)));
        });

        it('should accept single value for month', () => {
            let matcher = new TimeMatcher('0 0 0 1 5 *');
            assert.isTrue(matcher.match(new Date(2018, 4, 1, 0, 0, 0)));
            assert.isFalse(matcher.match(new Date(2018, 5, 1, 0, 0, 0)));
        });

        it('should accept single value for week day', () => {
            let matcher = new TimeMatcher('0 0 0 * * monday');
            assert.isTrue(matcher.match(new Date(2018, 4, 7, 0, 0, 0)));
            assert.isFalse(matcher.match(new Date(2018, 4, 8, 0, 0, 0)));
        });
    });

    describe('multiple values', () => {
        it('should accept multiple values for second', () => {
            let matcher = new TimeMatcher('5,6 * * * * *');
            assert.isTrue(matcher.match(new Date(2018, 0, 1, 0, 0, 5)));
            assert.isTrue(matcher.match(new Date(2018, 0, 1, 0, 0, 6)));
            assert.isFalse(matcher.match(new Date(2018, 0, 1, 0, 0, 7)));
        });

        it('should accept multiple values for minute', () => {
            let matcher = new TimeMatcher('0 5,6 * * * *');
            assert.isTrue(matcher.match(new Date(2018, 0, 1, 0, 5, 0)));
            assert.isTrue(matcher.match(new Date(2018, 0, 1, 0, 6, 0)));
            assert.isFalse(matcher.match(new Date(2018, 0, 1, 0, 7, 0)));
        });
        
        it('should accept multiple values for hour', () => {
            let matcher = new TimeMatcher('0 0 5,6 * * *');
            assert.isTrue(matcher.match(new Date(2018, 0, 1, 5, 0, 0)));
            assert.isTrue(matcher.match(new Date(2018, 0, 1, 6, 0, 0)));
            assert.isFalse(matcher.match(new Date(2018, 0, 1, 7, 0, 0)));
        });

        it('should accept multiple values for day', () => {
            let matcher = new TimeMatcher('0 0 0 5,6 * *');
            assert.isTrue(matcher.match(new Date(2018, 0, 5, 0, 0, 0)));
            assert.isTrue(matcher.match(new Date(2018, 0, 6, 0, 0, 0)));
            assert.isFalse(matcher.match(new Date(2018, 0, 7, 0, 0, 0)));
        });

        it('should accept multiple values for month', () => {
            let matcher = new TimeMatcher('0 0 0 1 may,june *');
            assert.isTrue(matcher.match(new Date(2018, 4, 1, 0, 0, 0)));
            assert.isTrue(matcher.match(new Date(2018, 5, 1, 0, 0, 0)));
            assert.isFalse(matcher.match(new Date(2018, 6, 1, 0, 0, 0)));
        });

        it('should accept multiple values for week day', () => {
            let matcher = new TimeMatcher('0 0 0 * * monday,tue');
            assert.isTrue(matcher.match(new Date(2018, 4, 7, 0, 0, 0)));
            assert.isTrue(matcher.match(new Date(2018, 4, 8, 0, 0, 0)));
            assert.isFalse(matcher.match(new Date(2018, 4, 9, 0, 0, 0)));
        });
    });

    describe('range', () => {
        it('should accept range for second', () => {
            let matcher = new TimeMatcher('5-7 * * * * *');
            assert.isTrue(matcher.match(new Date(2018, 0, 1, 0, 0, 5)));
            assert.isTrue(matcher.match(new Date(2018, 0, 1, 0, 0, 6)));
            assert.isTrue(matcher.match(new Date(2018, 0, 1, 0, 0, 7)));
            assert.isFalse(matcher.match(new Date(2018, 0, 1, 0, 0, 8)));
        });

        it('should accept range for minute', () => {
            let matcher = new TimeMatcher('0 5-7 * * * *');
            assert.isTrue(matcher.match(new Date(2018, 0, 1, 0, 5, 0)));
            assert.isTrue(matcher.match(new Date(2018, 0, 1, 0, 6, 0)));
            assert.isTrue(matcher.match(new Date(2018, 0, 1, 0, 7, 0)));
            assert.isFalse(matcher.match(new Date(2018, 0, 1, 0, 8, 0)));
        });

        it('should accept range for hour', () => {
            let matcher = new TimeMatcher('0 0 5-7 * * *');
            assert.isTrue(matcher.match(new Date(2018, 0, 1, 5, 0, 0)));
            assert.isTrue(matcher.match(new Date(2018, 0, 1, 6, 0, 0)));
            assert.isTrue(matcher.match(new Date(2018, 0, 1, 7, 0, 0)));
            assert.isFalse(matcher.match(new Date(2018, 0, 1, 8, 0, 0)));
        });

        it('should accept range for day', () => {
            let matcher = new TimeMatcher('0 0 0 5-7 * *');
            assert.isTrue(matcher.match(new Date(2018, 0, 5, 0, 0, 0)));
            assert.isTrue(matcher.match(new Date(2018, 0, 6, 0, 0, 0)));
            assert.isTrue(matcher.match(new Date(2018, 0, 7, 0, 0, 0)));
            assert.isFalse(matcher.match(new Date(2018, 0, 8, 0, 0, 0)));
        });

        it('should accept range for month', () => {
            let matcher = new TimeMatcher('0 0 0 1 may-july *');
            assert.isTrue(matcher.match(new Date(2018, 4, 1, 0, 0, 0)));
            assert.isTrue(matcher.match(new Date(2018, 5, 1, 0, 0, 0)));
            assert.isTrue(matcher.match(new Date(2018, 6, 1, 0, 0, 0)));
            assert.isFalse(matcher.match(new Date(2018, 7, 1, 0, 0, 0)));
        });

        it('should accept range for week day', () => {
            let matcher = new TimeMatcher('0 0 0 * * monday-wed');
            assert.isTrue(matcher.match(new Date(2018, 4, 7, 0, 0, 0)));
            assert.isTrue(matcher.match(new Date(2018, 4, 8, 0, 0, 0)));
            assert.isTrue(matcher.match(new Date(2018, 4, 9, 0, 0, 0)));
            assert.isFalse(matcher.match(new Date(2018, 4, 10, 0, 0, 0)));
        });
    });

    describe('step values', () => {
        it('should accept step values for second', () => {
            let matcher = new TimeMatcher('*/2 * * * * *');
            assert.isTrue(matcher.match(new Date(2018, 0, 1, 0, 0, 2)));
            assert.isTrue(matcher.match(new Date(2018, 0, 1, 0, 0, 6)));
            assert.isFalse(matcher.match(new Date(2018, 0, 1, 0, 0, 7)));
        });

        it('should accept step values for minute', () => {
            let matcher = new TimeMatcher('0 */2 * * * *');
            assert.isTrue(matcher.match(new Date(2018, 0, 1, 0, 2, 0)));
            assert.isTrue(matcher.match(new Date(2018, 0, 1, 0, 6, 0)));
            assert.isFalse(matcher.match(new Date(2018, 0, 1, 0, 7, 0)));
        });
        
        it('should accept step values for hour', () => {
            let matcher = new TimeMatcher('0 0 */2 * * *');
            assert.isTrue(matcher.match(new Date(2018, 0, 1, 2, 0, 0)));
            assert.isTrue(matcher.match(new Date(2018, 0, 1, 6, 0, 0)));
            assert.isFalse(matcher.match(new Date(2018, 0, 1, 7, 0, 0)));
        });

        it('should accept step values for day', () => {
            let matcher = new TimeMatcher('0 0 0 */2 * *');
            assert.isTrue(matcher.match(new Date(2018, 0, 2, 0, 0, 0)));
            assert.isTrue(matcher.match(new Date(2018, 0, 6, 0, 0, 0)));
            assert.isFalse(matcher.match(new Date(2018, 0, 7, 0, 0, 0)));
        });

        it('should accept step values for month', () => {
            let matcher = new TimeMatcher('0 0 0 1 */2 *');
            assert.isTrue(matcher.match(new Date(2018, 1, 1, 0, 0, 0)));
            assert.isTrue(matcher.match(new Date(2018, 5, 1, 0, 0, 0)));
            assert.isFalse(matcher.match(new Date(2018, 6, 1, 0, 0, 0)));
        });

        it('should accept step values for week day', () => {
            let matcher = new TimeMatcher('0 0 0 * * */2');
            assert.isTrue(matcher.match(new Date(2018, 4, 6, 0, 0, 0)));
            assert.isTrue(matcher.match(new Date(2018, 4, 8, 0, 0, 0)));
            assert.isFalse(matcher.match(new Date(2018, 4, 9, 0, 0, 0)));
        });
    });

    describe('timezone', ()=>{
        it('should match with timezone America/Sao_Paulo', () => {
            let matcher = new TimeMatcher('0 0 0 * * *', 'America/Sao_Paulo');
            let utcTime = new Date('Thu Oct 11 2018 03:00:00Z');
            assert.isTrue(matcher.match(utcTime));
        });

        it('should match with timezone Europe/Rome', () => {
            let matcher = new TimeMatcher('0 0 0 * * *', 'Europe/Rome');
            let utcTime = new Date('Thu Oct 11 2018 22:00:00Z');
            assert.isTrue(matcher.match(utcTime));
        });

        it('should match with all available timezone of moment-timezone', () => {
            const allTimeZone = moment.tz.names();
            for (let zone in allTimeZone) {
                const tmp = moment();
                const expected = moment.tz(tmp,allTimeZone[zone]);
                const pattern = expected.second() + ' ' + expected.minute() + ' ' + expected.hour() + ' ' + expected.date() + ' ' + (expected.month()+1) + ' ' + expected.day();
                const matcher = new TimeMatcher(pattern, allTimeZone[zone]);
                const utcTime = new Date(tmp.year(), tmp.month(), tmp.date(), tmp.hour(), tmp.minute(), tmp.second(), tmp.millisecond());
                assert.isTrue(matcher.match(utcTime));
            }
        });
    });
});