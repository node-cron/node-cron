'use strict';

var expect = require('expect.js');
var validate = require('../../src/pattern-validation');

describe('pattern-validation.js', () => {
  describe('validate week day', () => {
    it('should fail with invalid week day', () => {
      expect(() => {
        validate('* * * * 9');
      }).to.throwException((e) => {
        expect('9 is a invalid expression for week day').to.equal(e);
      });
    });

    it('should fail with invalid week day name', () => {
      expect(() => {
        validate('* * * * foo');
      }).to.throwException((e) => {
        expect('foo is a invalid expression for week day').to.equal(e);
      });
    });

    it('should not fail with valid week day', () => {
      expect(() => {
        validate('* * * * 5');
      }).to.not.throwException();
    });

    it('should not fail with valid week day name', () => {
      expect(() => {
        validate('* * * * Friday');
      }).to.not.throwException();
    });

    it('should not fail with * for week day', () => {
      expect(() => {
        validate('* * * * *');
      }).to.not.throwException();
    });

    it('should not fail with */2 for week day', () => {
      expect(() => {
        validate('* * * */2 *');
      }).to.not.throwException();
    });

    it('should not fail with Monday-Sunday for week day', () => {
      expect(() => {
        validate('* * * * Monday-Sunday');
      }).to.not.throwException();
    });

    it('should not fail with 1-7 for week day', () => {
      expect(() => {
        validate('0 0 1 1 1-7');
      }).to.not.throwException();
    });
  });
});
