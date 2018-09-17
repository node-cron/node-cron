'use strict';

var expect = require('expect.js');
var Task = require('../../src/task');

describe('Task', () => {
  it('should accept string for pattern', () => {
     expect(() => {
        new Task('* * * * *');
      }).to.not.throwException();
  });

   it('should fail with a non string value for pattern', () => {
     expect(() => {
      new Task([]);
      }).to.throwException((e) => {
        expect('pattern must be a string!').to.equal(e);
      });
  });

});
