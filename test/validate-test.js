'use strict';

var expect = require('expect.js');
var cron = require('../src/node-cron');

describe('public .validate() method', function(){
  it('should succeed with a valid expression', function() {
    var result = cron.validate('59 * * * *');
    expect(result).to.equal(true);
  });

  it('should fail with an invalid expression', function() {
    var result = cron.validate('60 * * * *');
    expect(result).to.equal(false);
  });
});
