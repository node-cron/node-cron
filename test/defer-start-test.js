'use strict';

var expect = require('expect.js');
var sinon = require('sinon');
var cron = require('../src/node-cron');

describe('defer a task', () => {
  beforeEach(() => {
    this.clock = sinon.useFakeTimers();
  });

  afterEach(() => {
    this.clock.restore();
  });

  it('should defer start of a task', () => {
    var executed = 0,
      task = cron.schedule('* * * * *', () => {
        executed++;
      }, false);

    this.clock.tick(1000 * 60);
    task.start();
    this.clock.tick(1001 * 60);
    expect(executed).to.equal(1);
  });
});
