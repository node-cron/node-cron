import chai from 'chai';
const { expect } = chai;
import validate from '../pattern-validation/pattern-validation.js';

describe('pattern-validation.js', () => {
    describe('validate seconds', () => {
        it('should fail with invalid second', () => {
            expect(() => {
                validate('63 * * * * *');
            }).to.throw('63 is a invalid expression for second');
        });

        it('should not fail with valid second', () => {
            expect(() => {
                validate('30 * * * * *');
            }).to.not.throw();
        });

        it('should not fail with * for second', () => {
            expect(() => {
                validate('* * * * * *');
            }).to.not.throw();
        });

        it('should not fail with */2 for second', () => {
            expect(() => {
                validate('*/2 * * * * *');
            }).to.not.throw();
        });
    });
});
