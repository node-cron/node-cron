'use strict';

const { expect } = require('chai');
const validate = require('../../src/pattern-validation');

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
