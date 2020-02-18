'use strict';

var expect = require('expect.js');
var sinon = require('sinon');
var cron = require('../src/node-cron');

describe('destroying a task', () => {
  beforeEach(() => {
    this.clock = sinon.useFakeTimers();
  });

  afterEach(() => {
    this.clock.restore();
  });

  it('should destroy the task', () => {
    var executed = 0,
      task = cron.schedule('* * * * *', () => {
        executed++;
      });

    this.clock.tick(1000 * 60 + 1);
    task.destroy();
    this.clock.tick(1000 * 60 + 1);
    task.start();
    this.clock.tick(1000 * 60 + 1);

    expect(executed).to.equal(1);
  });
});
