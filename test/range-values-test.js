'use strict';

var expect = require('expect.js');
var sinon = require('sinon');
var cron = require('../src/node-cron');

describe('scheduling with range values', () =>{
  beforeEach(() =>{
    this.clock = sinon.useFakeTimers();
  });

  afterEach(() =>{
    this.clock.restore();
  });

  it('should accept range values in minute', () => {
    var initialDate = new Date();
    initialDate.setMinutes(0);
    var executed = 0;
    cron.schedule('2-4 * * * *', () =>{
      executed += 1;
    });
    this.clock.tick(7001 * 60);
    expect(executed).to.equal(3);
  });

  it('should accept range values in hour', () => {
    var initialDate = new Date();
    initialDate.setMinutes(0);
    var executed = 0;
    cron.schedule('0 2-4 * * *', () =>{
      executed += 1;
    });
    this.clock.tick(7001 * 60 * 60);
    expect(executed).to.equal(3);
  });
});
