'use strict';

var expect = require('expect.js');
var validate = require('../../src/pattern-validation');

describe('pattern-validation.js', () => {
  describe('validate day of month', () => {
    it('should fail with invalid day of month', () => {
      expect(() => {
        validate('* * 32 * *');
      }).to.throwException((e) =>{
        expect('32 is a invalid expression for day of month').to.equal(e);
      });
    });

    it('should not fail with valid day of month', () => {
      expect(() => {
        validate('0 * * 15 * *');
      }).to.not.throwException();
    });

    it('should not fail with * for day of month', () => {
      expect(() => {
        validate('* * * * * *');
      }).to.not.throwException();
    });

    it('should not fail with */2 for day of month', () => {
      expect(() => {
        validate('* * */2 * *');
      }).to.not.throwException();
    });
  });
});
