'use strict';

var expect = require('expect.js');
var sinon = require('sinon');
var cron = require('../src/node-cron');

describe('scheduling with divided values', () => {
  beforeEach(() => {
    this.clock = sinon.useFakeTimers();
  });

  afterEach(() => {
    this.clock.restore();
  });

  it('should accept * divided by 2 for minutes', () =>  {
    var initialDate = new Date();
    initialDate.setMinutes(0);
    var executed = 0;
    cron.schedule('*/2 * * * *', () => {
      executed += 1;
    });
    this.clock.tick(5000 * 60);
    expect(executed).to.equal(2);
  });

  it('should accept 0-10 divided by 2 for minutes', () =>  {
    var initialDate = new Date();
    initialDate.setMinutes(0);
    var executed = 0;
    cron.schedule('0-10/2 * * * *', () => {
      executed += 1;
    });
    this.clock.tick(15000 * 60);
    expect(executed).to.equal(5);
  });

});
