'use strict';

var expect = require('expect.js');
var sinon = require('sinon');
var cron = require('../src/cron.js');

describe('scheduling on month', function(){
  beforeEach(function(){
    this.clock = sinon.useFakeTimers();
  });

  afterEach(function(){
    this.clock.restore();
  });

  it('should execute a task every month', function() {
    var executed = 0;
    var initialDate = new Date(2015, 2, 31);
    this.clock = sinon.useFakeTimers(initialDate.getTime());
    cron.schedule('0 0 1 * *', function(){
      executed += 1;
    });
    this.clock.tick(1000 * 60 * 60 * 24 * 65);
    expect(executed).to.equal(3);
  });

  it('should execute a task on month 2', function() {
    var initialDate = new Date();
    initialDate.setMonth(0);
    this.clock = sinon.useFakeTimers(initialDate.getTime());
    var executed = 0;
    cron.schedule('0 0 1 2 *', function(){
      executed += 1;
    });
    this.clock.tick(3000 * 60 * 60 * 24 * 31);
    expect(executed).to.equal(1);
  });

  it('should execute a task on months multiples of 2', function() {
    var initialDate = new Date(2015, 2, 31);
    this.clock = sinon.useFakeTimers(initialDate.getTime());
    var executed = 0;
    cron.schedule('0 0 1 */2 *', function(){
      executed += 1;
    });
    this.clock.tick(1000 * 60 * 60 * 24 * 63);
    expect(executed).to.equal(2);
  });
});
