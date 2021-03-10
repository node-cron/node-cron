'use strict';

const { expect } = require('chai');
const validate = require('../../src/pattern-validation');

describe('pattern-validation.js', () => {
    describe('validate day of month', () => {
        it('should fail with invalid day of month', () => {
            expect(() => {
                validate('* * 32 * *');
            }).to.throw('32 is a invalid expression for day of month');
        });

        it('should not fail with valid day of month', () => {
            expect(() => {
                validate('0 * * 15 * *');
            }).to.not.throw();
        });

        it('should not fail with * for day of month', () => {
            expect(() => {
                validate('* * * * * *');
            }).to.not.throw();
        });

        it('should not fail with */2 for day of month', () => {
            expect(() => {
                validate('* * */2 * *');
            }).to.not.throw();
        });
    });
});
