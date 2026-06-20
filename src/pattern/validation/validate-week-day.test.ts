import * as chai from 'chai';
const { expect } = chai;
import validate from './pattern-validation';

describe('pattern-validation', function() {
    describe('validate week day', function() {
        it('should fail with invalid week day', function() {
            expect(() => {
                validate('* * * * 9');
            }).to.throw('9 is a invalid expression for week day');
        });

        it('should fail with invalid week day name', function() {
            expect(() => {
                validate('* * * * foo');
            }).to.throw('foo is a invalid expression for week day');
        });

        it('should not fail with valid week day', function() {
            expect(() => {
                validate('* * * * 5');
            }).to.not.throw();
        });

        it('should not fail with valid week day name', function() {
            expect(() => {
                validate('* * * * Friday');
            }).to.not.throw();
        });

        it('should not fail with * for week day', function() {
            expect(() => {
                validate('* * * * *');
            }).to.not.throw();
        });

        it('should not fail with */2 for week day', function() {
            expect(() => {
                validate('* * * */2 *');
            }).to.not.throw();
        });

        it('should not fail with Monday-Sunday for week day', function() {
            expect(() => {
                validate('* * * * Monday-Sunday');
            }).to.not.throw();
        });

        it('should not fail with 1-7 for week day', function() {
            expect(() => {
                validate('0 0 1 1 1-7');
            }).to.not.throw();
        });

        describe('nth weekday (#) token', function() {
            it('should not fail with a valid <weekday>#<nth> token', function() {
                expect(() => {
                    validate('0 0 12 * * 2#3');
                }).to.not.throw();
            });

            it('should not fail with weekday 0 or 7 in a # token', function() {
                expect(() => {
                    validate('0 0 12 * * 0#1');
                }).to.not.throw();
                expect(() => {
                    validate('0 0 12 * * 7#5');
                }).to.not.throw();
            });

            it('should not fail with a weekday name in a # token', function() {
                expect(() => {
                    validate('0 0 12 * * Tuesday#3');
                }).to.not.throw();
            });

            it('should not fail with a # token combined with a numeric weekday', function() {
                expect(() => {
                    validate('0 0 12 * * 5,2#3');
                }).to.not.throw();
            });

            it('should fail when the weekday is out of range', function() {
                expect(() => {
                    validate('0 0 12 * * 8#1');
                }).to.throw('8#1 is a invalid expression for week day');
            });

            it('should fail when the nth occurrence is above 5', function() {
                expect(() => {
                    validate('0 0 12 * * 2#6');
                }).to.throw('2#6 is a invalid expression for week day');
            });

            it('should fail when the nth occurrence is 0', function() {
                expect(() => {
                    validate('0 0 12 * * 2#0');
                }).to.throw('2#0 is a invalid expression for week day');
            });

            it('should fail when the weekday is missing', function() {
                expect(() => {
                    validate('0 0 12 * * #3');
                }).to.throw('#3 is a invalid expression for week day');
            });

            it('should fail when the nth occurrence is missing', function() {
                expect(() => {
                    validate('0 0 12 * * 2#');
                }).to.throw('2# is a invalid expression for week day');
            });

            it('should fail when # is used outside the day-of-week field', function() {
                expect(() => {
                    validate('0 0 12 2#3 * *');
                }).to.throw('2#3 is a invalid expression for day of month');
            });
        });
    });
});
