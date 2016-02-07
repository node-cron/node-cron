'use strict';

var expect = require('expect.js');
var validate = require('../src/pattern-validation');

describe('pattern-validation.js', function(){
  describe('validate month', function(){
    it('should fail with invalid month', function(){
      expect(function(){
        validate('* * * 13 *');
      }).to.throwException(function(e){
        expect('13 is a invalid expression for month').to.equal(e);
      });
    });

    it('should fail with invalid month name', function(){
      expect(function(){
        validate('* * * foo *');
      }).to.throwException(function(e){
        expect('foo is a invalid expression for month').to.equal(e);
      });
    });

    it('should not fail with valid month', function(){
      expect(function(){
        validate('* * * 10 *');
      }).to.not.throwException();
    });

    it('should not fail with valid month name', function(){
      expect(function(){
        validate('* * * September *');
      }).to.not.throwException();
    });

    it('should not fail with * for month', function(){
      expect(function(){
        validate('* * * * *');
      }).to.not.throwException();
    });

    it('should not fail with */2 for month', function(){
      expect(function(){
        validate('* * * */2 *');
      }).to.not.throwException();
    });
  });
});
