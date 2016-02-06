'use strict';

var expect = require('expect.js');
var sinon = require('sinon');
var cron = require('../src/node-cron');

describe('scheduling on day', function(){
  beforeEach(function(){
    this.clock = sinon.useFakeTimers();
  });

  afterEach(function(){
    this.clock.restore();
  });

  it('should execute a task every day', function() {
    var executed = 0;
    cron.schedule('0 0 * * *', function(){
      executed += 1;
    });
    this.clock.tick(3000 * 60 * 60 * 24);
    expect(executed).to.equal(3);
  });

  it('should execute a task on minute 1', function() {
    var initialDate = new Date();
    initialDate.setDate(0);
    this.clock = sinon.useFakeTimers(initialDate.getTime());
    var executed = 0;
    cron.schedule('0 0 1 * *', function(){
      executed += 1;
    });
    this.clock.tick(3000 * 60 * 60 * 24);
    expect(executed).to.equal(1);
  });

  it('should execute a task on minutes multiples of 5', function() {
    var initialDate = new Date();
    initialDate.setMinutes(0);
    this.clock = sinon.useFakeTimers(initialDate.getTime());
    var executed = 0;
    cron.schedule('0 0 */5 * *', function(){
      executed += 1;
    });
    this.clock.tick(1000 * 60 * 60 * 24 * 13);
    expect(executed).to.equal(2);
  });
});
