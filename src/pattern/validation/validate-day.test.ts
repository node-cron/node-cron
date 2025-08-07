import * as chai from 'chai';
const { expect } = chai;

import validate from './pattern-validation.js';

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
    });
});
