'use strict';

const { expect } = require('chai');
const validate = require('../../src/pattern-validation');

describe('pattern-validation.js',  () => {
    describe('validate month',  () => {
        it('should fail with invalid month',  () => {
            expect( () => {
                validate('* * * 13 *');
            }).to.throw('13 is a invalid expression for month');
        });

        it('should fail with invalid month name',  () => {
            expect( () => {
                validate('* * * foo *');
            }).to.throw('foo is a invalid expression for month');
        });

        it('should not fail with valid month',  () => {
            expect( () => {
                validate('* * * 10 *');
            }).to.not.throw();
        });

        it('should not fail with valid month name',  () => {
            expect( () => {
                validate('* * * September *');
            }).to.not.throw();
        });

        it('should not fail with * for month',  () => {
            expect( () => {
                validate('* * * * *');
            }).to.not.throw();
        });

        it('should not fail with */2 for month',  () => {
            expect( () => {
                validate('* * * */2 *');
            }).to.not.throw();
        });
    });
});
