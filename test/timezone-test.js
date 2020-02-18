'use strict';

var expect = require('expect.js');
var sinon = require('sinon');
var cron = require('../src/node-cron');

describe('scheduling with timezone', () => {
    beforeEach(() =>{
        this.clock = sinon.useFakeTimers();
    });
    
    afterEach(() =>{
        this.clock.restore();
    });
    
    it('should schedule a task without timezone', () => {
        var executed = 0;
        cron.schedule('0 0 * * *', () => {
            executed++;
        });
        
        this.clock.tick(1000 * 60 * 60 * 24);
        expect(executed).to.equal(1);
    });
    
    it('should schedule a task with timezone', () => {
        var executedAt;
        cron.schedule('0 0 * * *', () => {
            executedAt = new Date();
        }, {
            timezone: 'Etc/UTC'
        });
        
        this.clock.tick(1000 * 60 * 60 * 24 + 1);
        expect(executedAt.getHours()).to.equal(21);
    });
});

