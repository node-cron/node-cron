import * as chai from 'chai';
const { expect } = chai;
import validate from './pattern-validation';

describe('pattern-validation', function() {
    describe('validate day of month', function() {
        it('should fail with invalid day of month', function() {
            expect(() => {
                validate('* * 32 * *');
            }).to.throw('32 is a invalid expression for day of month');
        });

        it('should not fail with valid day of month', function() {
            expect(() => {
                validate('0 * * 15 * *');
            }).to.not.throw();
        });

        it('should not fail with * for day of month', function() {
            expect(() => {
                validate('* * * * * *');
            }).to.not.throw();
        });

        it('should not fail with */2 for day of month', function() {
            expect(() => {
                validate('* * */2 * *');
            }).to.not.throw();
        });

        it('should not fail with L (last day of month)', function() {
            expect(() => {
                validate('0 0 12 L * *');
            }).to.not.throw();
        });

        it('should not fail with lowercase l', function() {
            expect(() => {
                validate('0 0 12 l * *');
            }).to.not.throw();
        });

        it('should not fail with L combined with explicit days', function() {
            expect(() => {
                validate('0 0 12 15,L * *');
            }).to.not.throw();
        });

        it('should fail with L outside the day-of-month field', function() {
            expect(() => {
                validate('0 L * * * *');
            }).to.throw('L is a invalid expression for minute');
        });

        it('should fail with an unsupported L variant (LW)', function() {
            expect(() => {
                validate('0 0 12 LW * *');
            }).to.throw('LW is a invalid expression for day of month');
        });
    });

    describe('validate week day', function() {
        it('should not fail with <weekday>L (last weekday of month)', function() {
            expect(() => {
                validate('0 0 12 * * 5L');
            }).to.not.throw();
        });

        it('should not fail with 0L / 7L (last Sunday)', function() {
            expect(() => {
                validate('0 0 12 * * 0L');
            }).to.not.throw();
            expect(() => {
                validate('0 0 12 * * 7L');
            }).to.not.throw();
        });

        it('should not fail with a lowercase weekday L', function() {
            expect(() => {
                validate('0 0 12 * * 5l');
            }).to.not.throw();
        });

        it('should not fail with <weekday>L combined with explicit weekdays', function() {
            expect(() => {
                validate('0 0 12 * * 5L,1');
            }).to.not.throw();
        });

        it('should fail with an out-of-range weekday L (8L)', function() {
            expect(() => {
                validate('0 0 12 * * 8L');
            }).to.throw('8L is a invalid expression for week day');
        });

        it('should fail with a reversed token (L5)', function() {
            expect(() => {
                validate('0 0 12 * * L5');
            }).to.throw('L5 is a invalid expression for week day');
        });

        it('should fail with a bare L in the week-day field', function() {
            expect(() => {
                validate('0 0 12 * * L');
            }).to.throw('L is a invalid expression for week day');
        });
    });
});
