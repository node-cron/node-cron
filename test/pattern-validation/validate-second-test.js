'use strict';

var expect = require('expect.js');
var validate = require('../../src/pattern-validation');

describe('pattern-validation.js', () => {
  describe('validate seconds', () => {
    it('should fail with invalid second', () => {
      expect(() => {
        validate('63 * * * * *');
      }).to.throwException((e) => {
        expect('63 is a invalid expression for second').to.equal(e);
      });
    });

    it('should not fail with valid second', () => {
      expect(() => {
        validate('30 * * * * *');
      }).to.not.throwException();
    });

    it('should not fail with * for second', () => {
      expect(() => {
        validate('* * * * * *');
      }).to.not.throwException();
    });

    it('should not fail with */2 for second', () => {
      expect(() => {
        validate('*/2 * * * * *');
      }).to.not.throwException();
    });
  });
});
