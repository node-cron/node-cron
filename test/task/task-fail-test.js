'use strict';

var expect = require('expect.js');
var sinon = require('sinon');
var cron = require('../../src/node-cron');

describe('scheduling a task with exception', function(){
  beforeEach(function(){
    this.clock = sinon.useFakeTimers();
  });

  afterEach(function(){
    this.clock.restore();
  });

  it('should not stop on task exception', function() {
    var executed = 0;
    cron.schedule('* * * * *', function(){
      executed += 1;
      throw 'exception!';
    });
    this.clock.tick(3000 * 60);
    expect(executed).to.equal(3);
  });
});
