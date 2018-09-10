'use strict';

var expect = require('expect.js');
var sinon = require('sinon');
var ScheduledTask = require('../src/scheduled-task');
var Task = require('../src/task');

describe('ScheduledTask', function() {
    beforeEach(function(){
        this.clock = sinon.useFakeTimers();
    });
    
    afterEach(function(){
        this.clock.restore();
    });
    
    it('should return scheduled status', function() {
        var task = new Task('* * * * *');
        var scheduledTask = new ScheduledTask(task, {});
        expect(scheduledTask.getStatus()).to.equal('scheduled');
    });

    it('should return running status', function(done) {
        var task = new Task('* * * * * *', function(){});
        var scheduledTask = new ScheduledTask(task, {});

        task.on('started', function() {
            expect(scheduledTask.getStatus()).to.equal('running');
            done();
        });

        this.clock.tick(1100);
    });

    it('should return stoped status', function() {
        var task = new Task('* * * * *');
        var scheduledTask = new ScheduledTask(task, {});
        scheduledTask.stop();
        expect(scheduledTask.getStatus()).to.equal('stoped');
    });

    it('should return destroyed status', function() {
        var task = new Task('* * * * *');
        var scheduledTask = new ScheduledTask(task, {});
        scheduledTask.destroy();
        expect(scheduledTask.getStatus()).to.equal('destroyed');
    });
});