'use strict';

var expect = require('expect.js');
var sinon = require('sinon');
var cron = require('../src/node-cron');

describe('scheduling on minutes', function(){
  beforeEach(function(){
    this.clock = sinon.useFakeTimers();
  });

  afterEach(function(){
    this.clock.restore();
  });

  it('should execute a task every minute', function() {
    var executed = 0;
    cron.schedule('* * * * *', function(){
      executed += 1;
    });
    this.clock.tick(3000 * 60);
    expect(executed).to.equal(3);
  });

  it('should execute a task on minute 1', function() {
    var initialDate = new Date();
    initialDate.setMinutes(0);
    this.clock = sinon.useFakeTimers(initialDate.getTime());
    var executed = 0;
    cron.schedule('1 * * * *', function(){
      executed += 1;
    });
    this.clock.tick(3000 * 60);
    expect(executed).to.equal(1);
  });

  it('should execute a task on minutes multiples of 5', function() {
    var initialDate = new Date();
    initialDate.setMinutes(0);
    this.clock = sinon.useFakeTimers(initialDate.getTime());
    var executed = 0;
    cron.schedule('*/5 * * * *', function(){
      executed += 1;
    });
    this.clock.tick(1000 * 60 * 23);
    expect(executed).to.equal(4);
  });

  it('should execute a task every minute from 10 to 20', function() {
    var initialDate = new Date();
    initialDate.setMinutes(0);
    this.clock = sinon.useFakeTimers(initialDate.getTime());
    var executed = 0;
    cron.schedule('10-20 * * * *', function(){
      executed += 1;
    });
    this.clock.tick(1000 * 60 * 30);
    expect(executed).to.equal(11);
  });

  it('should execute a task every minute from 10 to 20 and from 30 to 35', function() {
    var initialDate = new Date();
    initialDate.setMinutes(0);
    this.clock = sinon.useFakeTimers(initialDate.getTime());
    var executed = 0;
    cron.schedule('10-20,30-35 * * * *', function(){
      executed += 1;
    });
    this.clock.tick(1000 * 60 * 40);
    expect(executed).to.equal(17);
  });
});
