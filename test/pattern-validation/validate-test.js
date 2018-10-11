'use strict';

const { expect } = require('chai');
var cron = require('../../src/node-cron');

describe('public .validate() method', () => {
  it('should succeed with a valid expression', () =>  {
    var result = cron.validate('59 * * * *');
    expect(result).to.equal(true);
  });

  it('should fail with an invalid expression', () =>  {
    var result = cron.validate('60 * * * *');
    expect(result).to.equal(false);
  });

  it('should fail without a string', () =>  {
    var result = cron.validate('60 * * * *');
    expect(result).to.equal(false);
  });
});
