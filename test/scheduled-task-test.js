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

    it('should start a task by default', () => {
        let executed = 0;
        let scheduledTask = new ScheduledTask('* * * * * *', () => executed++);
        this.clock.tick(3000);
        assert.equal(3, executed);
        scheduledTask.stop();
    });

    it('should create a task stoped', () => {
        let executed = 0;
        let scheduledTask = new ScheduledTask('* * * * * *', () => executed++, { scheduled: false });
        this.clock.tick(3000);
        assert.equal(0, executed);
        scheduledTask.stop();
    });

    it('should start a task', () => {
        let executed = 0;
        let scheduledTask = new ScheduledTask('* * * * * *', () => executed++, { scheduled: false });
        this.clock.tick(3000);
        assert.equal(0, executed);
        scheduledTask.start();
        this.clock.tick(3000);
        assert.equal(3, executed);
        scheduledTask.stop();
    });

    it('should stop a task', () => {
        let executed = 0;
        let scheduledTask = new ScheduledTask('* * * * * *', () => executed++, { scheduled: true });
        this.clock.tick(3000);
        assert.equal(3, executed);
        scheduledTask.stop();
        this.clock.tick(3000);
        assert.equal(3, executed);
    });

    it('should emit event every minute', () => {
        let executed = 0;
        let scheduledTask = new ScheduledTask('0 * * * * *', () => executed++, { scheduled: true });
        this.clock.tick(60000 * 3);
        assert.equal(3, executed);
        scheduledTask.stop();
    });

    it('should emit event on start a task', async () => {
        let executed = 0;
        const scheduledTask = new ScheduledTask('* * * * * *', () => 10, { scheduled: false });
        scheduledTask.on('task-started', () => executed++);
        scheduledTask.start();
        await this.clock.tick(3000);
        assert.equal(3, executed);
        scheduledTask.stop();
    });

    it('should emit event on end a task', async () => {
        let executed = 0;
        const scheduledTask = new ScheduledTask('* * * * * *', () => 10, { scheduled: false });
        scheduledTask.on('task-finished', (value) => executed += value);
        scheduledTask.start();
        await this.clock.tick(3000);
        assert.equal(30, executed);
        scheduledTask.stop();
    });
});