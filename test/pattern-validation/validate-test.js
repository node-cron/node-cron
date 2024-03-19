'use strict';

const { expect } = require('chai');
const validate = require('../../src/pattern-validation');

describe('pattern-validation', () => {
    it('should succeed with a valid expression', () =>  {
        expect(() => {
            validate('59 * * * *');
        }).to.not.throw();
    });

    it('should fail with an invalid expression', () =>  {
        expect(() => {
            validate('60 * * * *');
        }).to.throw('60 is a invalid expression for minute');
    });

    it('should fail with invalid separator character', () =>  {
        expect(() => {
            validate('1;2;3 * * * *');
        }).to.throw('pattern includes illegal characters!');
    });

    it('should not fail with valid separator character', () =>  {
        expect(() => {
            validate('1,2,3 * * * *');
        }).to.not.throw();
    });

    it('should fail without a string', () =>  {
        expect(() => {
            validate(50);
        }).to.throw('pattern must be a string!');
    });
});
