'use strict';

var expect = require('expect.js');
var sinon = require('sinon');
var ScheduledTask = require('../src/scheduled-task');
var Task = require('../src/task');

describe('ScheduledTask', () => {
    beforeEach(() => {
        this.clock = sinon.useFakeTimers();
    });
    
    afterEach(() =>{
        this.clock.restore();
    });
    
    it('should return scheduled status', () => {
        var task = new Task('* * * * *');
        var scheduledTask = new ScheduledTask(task, {});
        expect(scheduledTask.getStatus()).to.equal('scheduled');
    });

    it('should return running status', (done) => {
        var task = new Task('* * * * * *', () =>{});
        var scheduledTask = new ScheduledTask(task, {});

        task.on('started', () => {
            expect(scheduledTask.getStatus()).to.equal('running');
            done();
        });

        this.clock.tick(1100);
    });

    it('should return stoped status', () => {
        var task = new Task('* * * * *');
        var scheduledTask = new ScheduledTask(task, {});
        scheduledTask.stop();
        expect(scheduledTask.getStatus()).to.equal('stoped');
    });

    it('should return destroyed status', () => {
        var task = new Task('* * * * *');
        var scheduledTask = new ScheduledTask(task, {});
        scheduledTask.destroy();
        expect(scheduledTask.getStatus()).to.equal('destroyed');
    });
});