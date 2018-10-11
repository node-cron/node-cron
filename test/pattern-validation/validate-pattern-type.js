'use strict';

var expect = require('expect.js');
var Task = require('../../src/task');

describe('Task', () => {
  it('should accept a function', () => {
     expect(() => {
        new Task(() => {});
      }).to.not.throwException();
  });

   it('should fail without a function', () => {
     expect(() => {
      new Task([]);
      }).to.throwException((e) => {
        expect('execution must be a function').to.equal(e);
      });
  });

});
