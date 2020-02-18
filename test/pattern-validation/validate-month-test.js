'use strict';

var expect = require('expect.js');
var validate = require('../../src/pattern-validation');

describe('pattern-validation.js',  () => {
  describe('validate month',  () => {
    it('should fail with invalid month',  () => {
      expect( () => {
        validate('* * * 13 *');
      }).to.throwException((e) => {
        expect('13 is a invalid expression for month').to.equal(e);
      });
    });

    it('should fail with invalid month name',  () => {
      expect( () => {
        validate('* * * foo *');
      }).to.throwException(function(e){
        expect('foo is a invalid expression for month').to.equal(e);
      });
    });

    it('should not fail with valid month',  () => {
      expect( () => {
        validate('* * * 10 *');
      }).to.not.throwException();
    });

    it('should not fail with valid month name',  () => {
      expect( () => {
        validate('* * * September *');
      }).to.not.throwException();
    });

    it('should not fail with * for month',  () => {
      expect( () => {
        validate('* * * * *');
      }).to.not.throwException();
    });

    it('should not fail with */2 for month',  () => {
      expect( () => {
        validate('* * * */2 *');
      }).to.not.throwException();
    });
  });
});
