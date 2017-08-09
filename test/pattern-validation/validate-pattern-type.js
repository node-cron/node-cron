'use strict';

var expect = require('expect.js');
var Task = require('../../src/task');

describe('Task', function(){
  it('should accept string for pattern', function(){
     expect(function(){
        new Task('* * * * *');
      }).to.not.throwException();
  });

   it('should fail with a non string value for pattern', function(){
     expect(function(){
        new Task([]);
      }).to.throwException(function(e){
        expect('pattern must be a string!').to.equal(e);
      });
  });

});
