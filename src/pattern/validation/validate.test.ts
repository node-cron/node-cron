import * as chai from 'chai';
const { expect } = chai;
import validate from './pattern-validation';

describe('pattern-validation', function() {
    it('should succeed with a valid expression', function() {
        expect(() => {
            validate('59 * * * *');
        }).to.not.throw();
    });

    it('should fail with an invalid expression', function() {
        expect(() => {
            validate('60 * * * *');
        }).to.throw('60 is a invalid expression for minute');
    });

    it('should fail with invalid separator character', function() {
        expect(() => {
            validate('1;2;3 * * * *');
        }).to.throw('pattern includes illegal characters!');
    });

    it('should not fail with valid separator character', function() {
        expect(() => {
            validate('1,2,3 * * * *');
        }).to.not.throw();
    });

    it('should fail without a string', function() {
        expect(() => {
            validate(50);
        }).to.throw('pattern must be a string!');
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
                }).to.throw(/invalid expression|illegal characters/);
            });
        });

        it('rejects garbage in a non-day field too', function() {
            expect(() => {
                validate('0 5min * * * *');
            }).to.throw('5min is a invalid expression for minute');
        });

        it('still accepts the valid forms it resembles', function() {
            ['0 0 0 1-5 * *', '0 0 0 */2 * *', '0 0 0 5-3 * *', '0 0 0 1,15,L * *', '0 0 0 1-10/2 * *']
                .forEach((expr) => expect(() => validate(expr), expr).to.not.throw());
        });
    });

    describe('nicknames', function() {
        const valid = ['@yearly', '@annually', '@monthly', '@weekly', '@daily', '@midnight', '@hourly'];

        valid.forEach((nickname) => {
            it(`accepts ${nickname}`, function() {
                expect(() => validate(nickname)).to.not.throw();
            });
        });

        it('is case-insensitive', function() {
            expect(() => validate('@Daily')).to.not.throw();
            expect(() => validate('@YEARLY')).to.not.throw();
        });

        it('rejects unknown nicknames', function() {
            expect(() => validate('@every_second')).to.throw();
        });
    });
});
