'use strict';

var expect = require('expect.js');
var validate = require('../src/pattern-validation');

describe('pattern-validation.js', function(){
  describe('validate day of month', function(){
    it('should fail with invalid day of month', function(){
      expect(function(){
        validate('* * 32 * *');
      }).to.throwException(function(e){
        expect('32 is a invalid expression for day of month').to.equal(e);
      });
    });

    it('should not fail with valid day of month', function(){
      expect(function(){
        validate('* * 15 * *');
      }).to.not.throwException();
    });

    it('should not fail with * for day of month', function(){
      expect(function(){
        validate('* * * * * *');
      }).to.not.throwException();
    });

    it('should not fail with */2 for day of month', function(){
      expect(function(){
        validate('* * */2 * *');
      }).to.not.throwException();
    });
  });
});
