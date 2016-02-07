'use strict';

var expect = require('expect.js');
var validate = require('../src/pattern-validation');

describe('pattern-validation.js', function(){
  describe('validate week day', function(){
    it('should fail with invalid week day', function(){
      expect(function(){
        validate('* * * * 9');
      }).to.throwException(function(e){
        expect('9 is a invalid expression for week day').to.equal(e);
      });
    });

    it('should fail with invalid week day name', function(){
      expect(function(){
        validate('* * * * foo');
      }).to.throwException(function(e){
        expect('foo is a invalid expression for week day').to.equal(e);
      });
    });

    it('should not fail with valid week day', function(){
      expect(function(){
        validate('* * * * 5');
      }).to.not.throwException();
    });

    it('should not fail with valid week day name', function(){
      expect(function(){
        validate('* * * * Friday');
      }).to.not.throwException();
    });

    it('should not fail with * for week day', function(){
      expect(function(){
        validate('* * * * *');
      }).to.not.throwException();
    });

    it('should not fail with */2 for week day', function(){
      expect(function(){
        validate('* * * */2 *');
      }).to.not.throwException();
    });
  });
});
