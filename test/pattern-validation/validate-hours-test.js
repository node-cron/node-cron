'use strict';

const { expect } = require('chai');
const validate = require('../../src/pattern-validation');

describe('pattern-validation.js', () => {
    describe('validate hour', () => {
        it('should fail with invalid hour', () => {
            expect(() => {
                validate('* 25 * * *');
            }).to.throw('25 is a invalid expression for hour');
        });

        it('should not fail with valid hour', () => {
            expect(() => {
                validate('* 12 * * *');
            }).to.not.throw();
        });

        it('should not fail with * for hour', () => {
            expect(() => {
                validate('* * * * * *');
            }).to.not.throw();
        });

        it('should not fail with */2 for hour', () => {
            expect(() => {
                validate('* */2 * * *');
            }).to.not.throw();
        });

        it('should accept range for hours', () => {
            expect(() => {
                validate('* 3-20 * * *');
            }).to.not.throw();
        });
    });
});
