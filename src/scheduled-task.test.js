import chai from 'chai';
const { assert } = chai;
import { useFakeTimers } from 'sinon/pkg/sinon-esm.js';
import ScheduledTask from './scheduled-task.js';

let clock;
describe('ScheduledTask', () => {
    beforeEach(() => {
        clock = useFakeTimers(new Date(2018, 0, 1, 0, 0, 0, 0));
    });

    afterEach(() => {
        clock.restore();
    });

    it('should start a task by default', (done) => {
        let executed = 0;
        let scheduledTask = new ScheduledTask('* * * * * *', () => {
            executed += 1;
        });
        clock.tick(3000);
        assert.equal(3, executed);
        scheduledTask.stop();
        done();
    });

    it('should create a task stoped', (done) => {
        let executed = 0;
        let scheduledTask = new ScheduledTask('* * * * * *', () => {
            executed += 1;
        }, { scheduled: false });
        clock.tick(3000);
        assert.equal(0, executed);
        scheduledTask.stop();
        done();
    });

    it('should start a task', (done) => {
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

    it('should stop a task', () => {
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
    
    it('should create a task stopped and run it once created', () => {
        let executed = 0;
        new ScheduledTask('* * * * * *', () => {
            executed += 1;
        }, { scheduled: false, runOnInit: true });
        clock.tick(3000);
        assert.equal(1, executed);
    });
    
    it('should create a task stopped and run it once manually', () => {
        let executed = 0;
        let scheduledTask = new ScheduledTask('* * * * * *', () => {
            executed += 1;
        }, { scheduled: false });
        clock.tick(3000);
        assert.equal(0, executed);
        scheduledTask.execute();
        assert.equal(1, executed);
    });

    it('should emit event every minute', () => {
        let executed = 0;
        let scheduledTask = new ScheduledTask('0 * * * * *', () => {
            executed += 1;
        }, { scheduled: true });
        clock.tick(60000 * 3);
        assert.equal(3, executed);
        scheduledTask.stop();
    });
});
