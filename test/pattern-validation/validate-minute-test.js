'use strict';

var expect = require('expect.js');
var validate = require('../../src/pattern-validation');

describe('pattern-validation.js', () => {
  describe('validate minutes', () => {
    it('should fail with invalid minute', () => {
      expect(() => {
        validate('63 * * * *');
      }).to.throwException((e) => {
        expect('63 is a invalid expression for minute').to.equal(e);
      });
    });

    it('should not fail with valid minute', () => {
      expect(() => {
        validate('30 * * * *');
      }).to.not.throwException();
    });

    it('should not fail with *', () => {
      expect(() => {
        validate('* * * * *');
      }).to.not.throwException();
    });

    it('should not fail with */2', () => {
      expect(() => {
        validate('*/2 * * * *');
      }).to.not.throwException();
    });
  });
});
