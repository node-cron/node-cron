import * as chai from 'chai';
const { expect } = chai;
import validate from '../pattern-validation/pattern-validation';

describe('pattern-validation', function() {
    describe('validate seconds', function() {
        it('should fail with invalid second', function() {
            expect(() => {
                validate('63 * * * * *');
            }).to.throw('63 is a invalid expression for second');
        });

        it('should not fail with valid second', function() {
            expect(() => {
                validate('30 * * * * *');
            }).to.not.throw();
        });

        it('should not fail with * for second', function() {
            expect(() => {
                validate('* * * * * *');
            }).to.not.throw();
        });

        it('should not fail with */2 for second', function() {
            expect(() => {
                validate('*/2 * * * * *');
            }).to.not.throw();
        });
    });
});
