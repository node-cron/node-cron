'use strict';

var expect = require('expect.js');
var sinon = require('sinon');
var cron = require('../src/node-cron');

describe('scheduling with multiples values', () => {
  beforeEach(() => {
    this.clock = sinon.useFakeTimers();
  });

  afterEach(() => {
    this.clock.restore();
  });

  it('should accept multiples values in minute', () =>  {
    var initialDate = new Date();
    initialDate.setMinutes(0);
    var executed = 0;
    cron.schedule('2,3,4 * * * *', () => {
      executed += 1;
    });
    this.clock.tick(7000 * 60);
    expect(executed).to.equal(3);
  });

  it('should accept multiples values in hour', () =>  {
    var initialDate = new Date();
    initialDate.setMinutes(0);
    var executed = 0;
    cron.schedule('2,3,4 * * * *', () => {
      executed += 1;
    });
    this.clock.tick(7000 * 60);
    expect(executed).to.equal(3);
  });
});
