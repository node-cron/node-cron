const { assert } = require('chai');
const sinon = require('sinon');
const ScheduledTask = require('../src/scheduled-task');

describe('ScheduledTask', () => {
    beforeEach(() => {
        this.clock = sinon.useFakeTimers(new Date(2018, 0, 1, 0, 0, 0, 0));
    });

    afterEach(() => {
        this.clock.restore();
    });

    it('should start a task by default', (done) => {
        let executed = 0;
        let scheduledTask = new ScheduledTask('* * * * * *', () => {
            executed += 1;
        });
        this.clock.tick(3000);
        assert.equal(3, executed);
        scheduledTask.stop();
        done();
    });

    it('should create a task stoped', (done) => {
        let executed = 0;
        let scheduledTask = new ScheduledTask('* * * * * *', () => {
            executed += 1;
        }, { scheduled: false });
        this.clock.tick(3000);
        assert.equal(0, executed);
        scheduledTask.stop();
        done();
    });

    it('should start a task', (done) => {
        let executed = 0;
        let scheduledTask = new ScheduledTask('* * * * * *', () => {
            executed += 1;
        }, { scheduled: false });
        this.clock.tick(3000);
        assert.equal(0, executed);
        scheduledTask.start();
        this.clock.tick(3000);
        assert.equal(3, executed);
        scheduledTask.stop();
        done();
    });

    it('should stop a task', () => {
        let executed = 0;
        let scheduledTask = new ScheduledTask('* * * * * *', () => {
            executed += 1;
        }, { scheduled: true });
        this.clock.tick(3000);
        assert.equal(3, executed);
        scheduledTask.stop();
        this.clock.tick(3000);
        assert.equal(3, executed);
    });
    
    it('should create a task stopped and run it once created', () => {
        let executed = 0;
        new ScheduledTask('* * * * * *', () => {
            executed += 1;
        }, { scheduled: false, runOnInit: true });
        this.clock.tick(3000);
        assert.equal(1, executed);
    });
    
    it('should create a task stopped and run it once manually', () => {
        let executed = 0;
        let scheduledTask = new ScheduledTask('* * * * * *', () => {
            executed += 1;
        }, { scheduled: false });
        this.clock.tick(3000);
        assert.equal(0, executed);
        scheduledTask.now();
        assert.equal(1, executed);
    });

    it('should emit event every minute', () => {
        let executed = 0;
        let scheduledTask = new ScheduledTask('0 * * * * *', () => {
            executed += 1;
        }, { scheduled: true });
        this.clock.tick(60000 * 3);
        assert.equal(3, executed);
        scheduledTask.stop();
    });
});
