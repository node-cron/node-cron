'use strict';

var expect = require('expect.js');
var sinon = require('sinon');
var cron = require('../../src/node-cron');

describe('scheduling a task with exception', () =>{
  beforeEach(() =>{
    this.clock = sinon.useFakeTimers();
  });

  afterEach(() =>{
    this.clock.restore();
  });

  it('should not stop on task exception', () => {
    var executed = 0;
    cron.schedule('* * * * *', () =>{
      executed += 1;
      throw 'exception!';
    });
    this.clock.tick(3000 * 60 + 1);
    expect(executed).to.equal(3);
  });
});
