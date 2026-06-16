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
});
