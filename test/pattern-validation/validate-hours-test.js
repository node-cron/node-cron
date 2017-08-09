'use strict';

var expect = require('expect.js');
var validate = require('../../src/pattern-validation');

describe('pattern-validation.js', function(){
  describe('validate hour', function(){
    it('should fail with invalid hour', function(){
      expect(function(){
        validate('* 25 * * *');
      }).to.throwException(function(e){
        expect('25 is a invalid expression for hour').to.equal(e);
      });
    });

    it('should not fail with valid hour', function(){
      expect(function(){
        validate('* 12 * * *');
      }).to.not.throwException();
    });

    it('should not fail with * for hour', function(){
      expect(function(){
        validate('* * * * * *');
      }).to.not.throwException();
    });

    it('should not fail with */2 for hour', function(){
      expect(function(){
        validate('* */2 * * *');
      }).to.not.throwException();
    });

    it('should accept range for hours', function(){
      expect(function(){
        validate('* 3-20 * * *');
      }).to.not.throwException();
    });
  });
});
