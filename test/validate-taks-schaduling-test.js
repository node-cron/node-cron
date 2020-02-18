'use strict';

var expect = require('expect.js');
var sinon = require('sinon');
var cron = require('../src/node-cron');

describe('validate cron on task schaduling', () => {
  beforeEach(() => {
    this.clock = sinon.useFakeTimers();
  });

  afterEach(() => {
    this.clock.restore();
  });

  it('should fail with a invalid cron expression', () => {
    expect(() => {
      cron.schedule('65 * * * *', () => {});
    }).to.throwException(function(e){
      expect(e).to.equal('65 is a invalid expression for minute');
    });
  });

  it('validate some spaces in task string', () => {
    var result = cron.validate('5    * * * *');
    expect(result).to.equal(true);
  });

  it('multiple spaces in task string', () => {
    var result = cron.validate('5    *    *  *   *');
    expect(result).to.equal(true);
  });

  it('spaces in begin and end of string', () => {
    var result = cron.validate('       5 * *    * *     ');
    expect(result).to.equal(true);
  });

});
