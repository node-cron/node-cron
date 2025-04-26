import chai from 'chai';
const { expect } = chai;
import validate from '../pattern-validation/pattern-validation.js';

describe('pattern-validation.js',  function() {
    describe('validate month',  function() {
        it('should fail with invalid month',  function() {
            expect( () => {
                validate('* * * 13 *');
            }).to.throw('13 is a invalid expression for month');
        });

        it('should fail with invalid month name',  function() {
            expect( () => {
                validate('* * * foo *');
            }).to.throw('foo is a invalid expression for month');
        });

        it('should not fail with valid month',  function() {
            expect( () => {
                validate('* * * 10 *');
            }).to.not.throw();
        });

        it('should not fail with valid month name',  function() {
            expect( () => {
                validate('* * * September *');
            }).to.not.throw();
        });

        it('should not fail with * for month',  function() {
            expect( () => {
                validate('* * * * *');
            }).to.not.throw();
        });

        it('should not fail with */2 for month',  function() {
            expect( () => {
                validate('* * * */2 *');
            }).to.not.throw();
        });
    });
});
