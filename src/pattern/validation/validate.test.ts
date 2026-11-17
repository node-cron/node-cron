import validate, { validateDetailed } from './pattern-validation';

describe('pattern-validation', function() {
    it('should succeed with a valid expression', function() {
        expect(() => {
            validate('59 * * * *');
        }).not.toThrow();
    });

    it('should fail with an invalid expression', function() {
        expect(() => {
            validate('60 * * * *');
        }).toThrow('60 is a invalid expression for minute');
    });

    it('should fail with invalid separator character', function() {
        expect(() => {
            validate('1;2;3 * * * *');
        }).toThrow('pattern includes illegal characters!');
    });

    it('should not fail with valid separator character', function() {
        expect(() => {
            validate('1,2,3 * * * *');
        }).not.toThrow();
    });

    it('should fail without a string', function() {
        expect(() => {
            validate(50);
        }).toThrow('pattern must be a string!');
    });

    describe('rejects malformed tokens instead of silently truncating', function() {
        // Previously these slipped through because the parser fell back to a
        // lenient parseInt (`15abc` -> 15, `0x1f` -> 31) or because range
        // expansion mangled multi-dash forms (`1-2-3` -> 1,2,3).
        const garbage = [
            '15abc', '0x1f', '1e2', '15/x', '5/2', '1-', '15--3',
            '1-2-3', '1-2-3-4', '15-L', '1-L', '15L-3', '1-5/0',
        ];

        garbage.forEach((token) => {
            it(`rejects "${token}" in the day-of-month field`, function() {
                expect(() => {
                    validate(`0 0 0 ${token} * *`);
                }).toThrow(/invalid expression|illegal characters/);
            });
        });

        it('rejects garbage in a non-day field too', function() {
            expect(() => {
                validate('0 5min * * * *');
            }).toThrow('5min is a invalid expression for minute');
        });

        it('still accepts the valid forms it resembles', function() {
            ['0 0 0 1-5 * *', '0 0 0 */2 * *', '0 0 0 5-3 * *', '0 0 0 1,15,L * *', '0 0 0 1-10/2 * *']
                .forEach((expr) => expect(() => validate(expr), expr).not.toThrow());
        });
    });

    describe('rejects an inverted range with an out-of-range endpoint', function() {
        // Wrapping an inverted range must not turn an out-of-range endpoint
        // into valid values (hours `25-2` used to become 1,2 and silently drop
        // 23:00 and 0:00).
        const cases = [
            ['60-5 * * * *', '60-5 is a invalid expression for minute'],
            ['0 25-2 * * *', '25-2 is a invalid expression for hour'],
            ['0 0 32-2 * *', '32-2 is a invalid expression for day of month'],
            ['0 0 5-0 * *', '5-0 is a invalid expression for day of month'],
            ['0 0 * 13-2 *', '13-2 is a invalid expression for month'],
            ['0 0 * 5-0 *', '5-0 is a invalid expression for month'],
            ['0 0 * * 8-2', '8-2 is a invalid expression for week day'],
            ['0 22-25/2 * * *', '22-25/2 is a invalid expression for hour'],
            ['0 25-2/2 * * *', '25-2/2 is a invalid expression for hour'],
        ];

        cases.forEach(([expr, message]) => {
            it(`rejects "${expr}"`, function() {
                expect(() => validate(expr)).toThrow(message);
            });
        });

        it('still accepts inverted ranges inside the field, and 7 as Sunday', function() {
            ['50-10 * * * *', '0 22-2 * * *', '0 0 28-2 * *', '0 0 * 11-2 *', '0 0 * * 7-2', '0 0 * * 6-0', '0 0 * * sat-mon']
                .forEach((expr) => expect(() => validate(expr), expr).not.toThrow());
        });
    });

    describe('agreement with validateDetailed', function() {
        it('rejects a 7-field expression, same as validateDetailed', function() {
            expect(() => validate('* * * * * * *')).toThrow(/5 or 6 fields/);
            expect(validateDetailed('* * * * * * *').valid).toBe(false);
        });

        it('rejects a 3-field expression, same as validateDetailed', function() {
            expect(() => validate('* * *')).toThrow(/5 or 6 fields/);
            expect(validateDetailed('* * *').valid).toBe(false);
        });

        it('normalizes double spaces before splitting, so field indexing matches validateDetailed', function() {
            expect(() => validate('60  9 * * *')).toThrow('60 is a invalid expression for minute');
        });
    });

    describe('nicknames', function() {
        const valid = ['@yearly', '@annually', '@monthly', '@weekly', '@daily', '@midnight', '@hourly'];

        valid.forEach((nickname) => {
            it(`accepts ${nickname}`, function() {
                expect(() => validate(nickname)).not.toThrow();
            });
        });

        it('is case-insensitive', function() {
            expect(() => validate('@Daily')).not.toThrow();
            expect(() => validate('@YEARLY')).not.toThrow();
        });

        it('rejects unknown nicknames', function() {
            expect(() => validate('@every_second')).toThrow();
        });
    });
});
