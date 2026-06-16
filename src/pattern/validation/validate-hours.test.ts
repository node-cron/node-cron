import * as chai from 'chai';
const { expect } = chai;
import validate from './pattern-validation';

describe('pattern-validation', function() {
    describe('validate hour', function() {
        it('should fail with invalid hour', function() {
            expect(() => {
                validate('* 25 * * *');
            }).to.throw('25 is a invalid expression for hour');
        });

        it('should not fail with valid hour', function() {
            expect(() => {
                validate('* 12 * * *');
            }).to.not.throw();
        });

        it('should not fail with * for hour', function() {
            expect(() => {
                validate('* * * * * *');
            }).to.not.throw();
        });

        it('should not fail with */2 for hour', function() {
            expect(() => {
                validate('* */2 * * *');
            }).to.not.throw();
        });

        it('should accept range for hours', function() {
            expect(() => {
                validate('* 3-20 * * *');
            }).to.not.throw();
        });
    });
});
