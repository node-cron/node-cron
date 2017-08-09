'use strict';

var expect = require('expect.js');
var validate = require('../../src/pattern-validation');

describe('pattern-validation.js', function(){
  describe('validate minutes', function(){
    it('should fail with invalid minute', function(){
      expect(function(){
        validate('63 * * * *');
      }).to.throwException(function(e){
        expect('63 is a invalid expression for minute').to.equal(e);
      });
    });

    it('should not fail with valid minute', function(){
      expect(function(){
        validate('30 * * * *');
      }).to.not.throwException();
    });

    it('should not fail with *', function(){
      expect(function(){
        validate('* * * * *');
      }).to.not.throwException();
    });

    it('should not fail with */2', function(){
      expect(function(){
        validate('*/2 * * * *');
      }).to.not.throwException();
    });
  });
});
