import { assert } from 'chai';
import { useFakeTimers } from 'sinon';
import ScheduledTask from './scheduled-task';

let clock;
describe('ScheduledTask', function() {
    beforeEach(function() {
        clock = useFakeTimers(new Date(2018, 0, 1, 0, 0, 0, 0));
    });

    afterEach(function() {
        clock.restore();
    });

    it('should start a task by default', function(done) {
        let executed = 0;
        let scheduledTask = new ScheduledTask('* * * * * *', () => {
            executed += 1;
        });
        clock.tick(3000);
        assert.equal(3, executed);
        scheduledTask.stop();
        done();
    });

    it('should create a task stoped', function(done) {
        let executed = 0;
        let scheduledTask = new ScheduledTask('* * * * * *', () => {
            executed += 1;
        }, { scheduled: false });
        clock.tick(3000);
        assert.equal(0, executed);
        scheduledTask.stop();
        done();
    });

    it('should start a task', function(done) {
        let executed = 0;
        let scheduledTask = new ScheduledTask('* * * * * *', () => {
            executed += 1;
        }, { scheduled: false });
        clock.tick(3000);
        assert.equal(0, executed);
        scheduledTask.start();
        clock.tick(3000);
        assert.equal(3, executed);
        scheduledTask.stop();
        done();
    });

    it('should stop a task', function() {
        let executed = 0;
        let scheduledTask = new ScheduledTask('* * * * * *', () => {
            executed += 1;
        }, { scheduled: true });
        clock.tick(3000);
        assert.equal(3, executed);
        scheduledTask.stop();
        clock.tick(3000);
        assert.equal(3, executed);
    });
    
    it('should create a task stopped and run it once created', function() {
        let executed = 0;
        new ScheduledTask('* * * * * *', () => {
            executed += 1;
        }, { scheduled: false, runOnInit: true });
        clock.tick(3000);
        assert.equal(1, executed);
    });
    
    it('should create a task stopped and run it once manually', function() {
        let executed = 0;
        let scheduledTask = new ScheduledTask('* * * * * *', () => {
            executed += 1;
        }, { scheduled: false });
        clock.tick(3000);
        assert.equal(0, executed);
        scheduledTask.execute();
        assert.equal(1, executed);
    });

    it('should emit event every minute', function() {
        let executed = 0;
        let scheduledTask = new ScheduledTask('0 * * * * *', () => {
            executed += 1;
        }, { scheduled: true });
        clock.tick(60000 * 3);
        assert.equal(3, executed);
        scheduledTask.stop();
    });
});
