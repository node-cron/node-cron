import * as chai from 'chai';
const { expect } = chai;
import validate from '../pattern-validation/pattern-validation.js';

describe('pattern-validation.js', function() {
    describe('validate minutes', function() {
        it('should fail with invalid minute', function() {
            expect(() => {
                validate('63 * * * *');
            }).to.throw('63 is a invalid expression for minute');
        });

        it('should not fail with valid minute', function() {
            expect(() => {
                validate('30 * * * *');
            }).to.not.throw();
        });

        it('should not fail with *', function() {
            expect(() => {
                validate('* * * * *');
            }).to.not.throw();
        });

        it('should not fail with */2', function() {
            expect(() => {
                validate('*/2 * * * *');
            }).to.not.throw();
        });
    });
});
