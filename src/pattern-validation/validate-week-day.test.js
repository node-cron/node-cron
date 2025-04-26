import chai from 'chai';
const { expect } = chai;
import validate from '../pattern-validation/pattern-validation.js';

describe('pattern-validation.js', function() {
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
    });
});
