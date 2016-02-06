'use strict';

var expect = require('expect.js');
var sinon = require('sinon');
var cron = require('../src/cron.js');

describe('scheduling on day of the week', function(){
  beforeEach(function(){
    this.clock = sinon.useFakeTimers();
  });

  afterEach(function(){
    this.clock.restore();
  });

  it('should execute a task every day of the week', function() {
    var executed = 0;
    var initialDate = new Date();
    initialDate.setHours(0);
    this.clock = sinon.useFakeTimers(initialDate.getTime());
    cron.schedule('0 1 * * *', function(){
      executed += 1;
    });
    this.clock.tick(3000 * 60 * 60 * 24);
    expect(executed).to.equal(3);
  });

  it('should execute a task on mondays', function() {
    var initialDate = new Date(2016, 0, 31);
    this.clock = sinon.useFakeTimers(initialDate.getTime());
    var executed = 0;
    cron.schedule('0 1 * * 1', function(){
      executed += 1;
    });
    this.clock.tick(3000 * 60 * 60 * 24);
    expect(executed).to.equal(1);
  });

  it('should execute a task on mondays passing name', function() {
    var initialDate = new Date(2016, 0, 31);
    this.clock = sinon.useFakeTimers(initialDate.getTime());
    var executed = 0;
    cron.schedule('0 1 * * Monday', function(){
      executed += 1;
    });
    this.clock.tick(3000 * 60 * 60 * 24);
    expect(executed).to.equal(1);
  });

  it('should execute a task on days of the week multiple of 2', function() {
    var initialDate = new Date(2016, 1, 1);
    this.clock = sinon.useFakeTimers(initialDate.getTime());
    var executed = 0;
    cron.schedule('0 1 * * */2', function(){
      executed += 1;
    });
    this.clock.tick(1000 * 60 * 60 * 24 * 7);
    expect(executed).to.equal(3);
  });
});
