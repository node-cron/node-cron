'use strict';

var expect = require('expect.js');
var sinon = require('sinon');
var cron = require('../src/cron.js');

describe('scheduling on hour', function(){
  beforeEach(function(){
    this.clock = sinon.useFakeTimers();
  });

  afterEach(function(){
    this.clock.restore();
  });

  it('should execute a task every hour', function() {
    var executed = 0;
    cron.schedule('0 * * * *', function(){
      executed += 1;
    });
    this.clock.tick(3000 * 60 * 60);
    expect(executed).to.equal(3);
  });

  it('should execute a task on hour 1', function() {
    var initialDate = new Date();
    initialDate.setHours(0);
    this.clock = sinon.useFakeTimers(initialDate.getTime());
    var executed = 0;
    cron.schedule('0 1 * * *', function(){
      executed += 1;
    });
    this.clock.tick(3000 * 60 * 60);
    expect(executed).to.equal(1);
  });

  it('should execute a task on hours multiples of 5', function() {
    var initialDate = new Date();
    initialDate.setMinutes(0);
    this.clock = sinon.useFakeTimers(initialDate.getTime());
    var executed = 0;
    cron.schedule('0 */5 * * *', function(){
      executed += 1;
    });
    this.clock.tick(1000 * 60 * 60 * 23);
    expect(executed).to.equal(4);
  });
});
