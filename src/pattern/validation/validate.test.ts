import * as chai from 'chai';
const { expect } = chai;
import validate from './pattern-validation';

describe('pattern-validation', function() {
    it('should succeed with a valid expression', function() {
        expect(() => {
            validate('59 * * * *');
        }).to.not.throw();
    });

    it('should fail with an invalid expression', function() {
        expect(() => {
            validate('60 * * * *');
        }).to.throw('60 is a invalid expression for minute');
    });

    it('should fail with invalid separator character', function() {
        expect(() => {
            validate('1;2;3 * * * *');
        }).to.throw('pattern includes illegal characters!');
    });

    it('should not fail with valid separator character', function() {
        expect(() => {
            validate('1,2,3 * * * *');
        }).to.not.throw();
    });

    it('should fail without a string', function() {
        expect(() => {
            validate(50);
        }).to.throw('pattern must be a string!');
    });
});
