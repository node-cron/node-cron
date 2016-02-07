'use strict';

var expect = require('expect.js');
var sinon = require('sinon');
var cron = require('../src/node-cron');

describe('validate cron on task schaduling', function(){
  beforeEach(function(){
    this.clock = sinon.useFakeTimers();
  });

  afterEach(function(){
    this.clock.restore();
  });

  it('should fail with a invalid cron expression', function(){
    expect(function(){
      cron.schedule('65 * * * *', function(){});
    }).to.throwException(function(e){
      expect(e).to.equal('65 is a invalid expression for minute');
    });
  });
});
