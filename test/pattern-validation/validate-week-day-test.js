'use strict';

const { expect } = require('chai');
const validate = require('../../src/pattern-validation');

describe('pattern-validation.js', () => {
    describe('validate week day', () => {
        it('should fail with invalid week day', () => {
            expect(() => {
                validate('* * * * 9');
            }).to.throw('9 is a invalid expression for week day');
        });

        it('should fail with invalid week day name', () => {
            expect(() => {
                validate('* * * * foo');
            }).to.throw('foo is a invalid expression for week day');
        });

        it('should not fail with valid week day', () => {
            expect(() => {
                validate('* * * * 5');
            }).to.not.throw();
        });

        it('should not fail with valid week day name', () => {
            expect(() => {
                validate('* * * * Friday');
            }).to.not.throw();
        });

        it('should not fail with * for week day', () => {
            expect(() => {
                validate('* * * * *');
            }).to.not.throw();
        });

        it('should not fail with */2 for week day', () => {
            expect(() => {
                validate('* * * */2 *');
            }).to.not.throw();
        });

        it('should not fail with Monday-Sunday for week day', () => {
            expect(() => {
                validate('* * * * Monday-Sunday');
            }).to.not.throw();
        });

        it('should not fail with 1-7 for week day', () => {
            expect(() => {
                validate('0 0 1 1 1-7');
            }).to.not.throw();
        });
    });
});
