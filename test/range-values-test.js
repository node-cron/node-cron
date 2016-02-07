'use strict';

var expect = require('expect.js');
var sinon = require('sinon');
var cron = require('../src/node-cron');

describe('scheduling with range values', function(){
  beforeEach(function(){
    this.clock = sinon.useFakeTimers();
  });

  afterEach(function(){
    this.clock.restore();
  });

  it('should accept range values in minute', function() {
    var initialDate = new Date();
    initialDate.setMinutes(0);
    var executed = 0;
    cron.schedule('2-4 * * * *', function(){
      executed += 1;
    });
    this.clock.tick(7000 * 60);
    expect(executed).to.equal(3);
  });

  it('should accept range values in hour', function() {
    var initialDate = new Date();
    initialDate.setMinutes(0);
    var executed = 0;
    cron.schedule('0 2-4 * * *', function(){
      executed += 1;
    });
    this.clock.tick(7000 * 60 * 60);
    expect(executed).to.equal(3);
  });
});
