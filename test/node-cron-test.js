const { assert } = require('chai');
const sinon = require('sinon');
const cron = require('../src/node-cron');
const Scheduler = require('../src/scheduler')

describe('node-cron', () => {
    beforeEach(() => {
        this.clock = sinon.useFakeTimers(new Date(2018, 0, 1, 0, 0, 0, 0));
    });

    afterEach(() => {
        this.clock.restore();
    });

    describe('schedule', () => {
        it('should schedule a task', () => {
            let executed = 0;
            cron.schedule('* * * * * *', () => {
                executed += 1;
            });

            this.clock.tick(2000);

            assert.equal(2, executed);
        });

        it('should schedule a task with America/Sao_Paulo timezone', (done) => {
            let startDate = new Date('Thu, 20 Sep 2018 00:00:00.000Z');
            this.clock.restore();
            this.clock = sinon.useFakeTimers(startDate);
            cron.schedule('* * * * * *', (date) => {
                assert.equal(19, date.getDate());
                assert.equal(8, date.getMonth());
                assert.equal(2018, date.getFullYear());
                assert.equal(21, date.getHours());
                assert.equal(0, date.getMinutes());
                assert.equal(1, date.getSeconds());
                done();
            }, {
                timezone: 'America/Sao_Paulo'
            });
            this.clock.tick(1000);
        });

        it('should schedule a task with Europe/Rome timezone', (done) => {
            let startDate = new Date('Thu, 20 Sep 2018 00:00:00.000Z');
            this.clock.restore();
            this.clock = sinon.useFakeTimers(startDate);
            cron.schedule('* * * * * *', (date) => {
                assert.equal(20, date.getDate());
                assert.equal(8, date.getMonth());
                assert.equal(2018, date.getFullYear());
                assert.equal(2, date.getHours());
                assert.equal(0, date.getMinutes());
                assert.equal(1, date.getSeconds());
                done();
            }, {
                timezone: 'Europe/Rome'
            });
            this.clock.tick(1000);
        });

        it('should schedule a task stoped', () => {
            let executed = 0;
            cron.schedule('* * * * * *', () => {
                executed += 1;
            }, { scheduled: false });

            this.clock.tick(2000);

            assert.equal(0, executed);
        });

        it('should start a stoped task', () => {
            let executed = 0;
            let scheduledTask = cron.schedule('* * * * * *', () => {
                executed += 1;
            }, { scheduled: false });

            this.clock.tick(2000);
            assert.equal(0, executed);
            scheduledTask.start();
            this.clock.tick(2000);
            assert.equal(2, executed);
        });

        it('should recover missed executions', (done) => {
            let executed = 0;
            this.clock.restore();
            let scheduledTask = cron.schedule('* * * * * *', () => {
                executed += 1;
            }, { recoverMissedExecutions: true });

            let startedAt = new Date();
            let nextSec = new Date(startedAt.getTime() + 1000);
            nextSec.setMilliseconds(0); // reset to the beginning of the next second
            let waitingTime = nextSec.getTime() - (new Date().getTime());
            let wait = true;
            // waiting time until next second + 1 second
            // So it will pass the ignored current second and miss exactly one execution of the next second

            while(wait){
                if((new Date().getTime() - startedAt.getTime()) > waitingTime + 1000){
                    wait = false;
                }
            }

            setTimeout(() => {
                scheduledTask.stop();
                assert.equal(2, executed);
                done();
            }, 10);
        }).timeout(4000);

        it('should schedule a background task', () => {
            let task = cron.schedule('* * * * * *', './test/assets/dummy-task.js');
            assert.isNotNull(task);
            assert.isDefined(task);
            assert.isTrue(task.isRunning());
            task.stop();
        });
    });

    describe('validate', () => {
        it('should validate a pattern', () => {
            assert.isTrue(cron.validate('* * * * * *'));
        });

        it('should fail with a invalid pattern', () => {
            assert.isFalse(cron.validate('62 * * * * *'));
        });
    });

    describe('getTasks', () => {
        beforeEach(() => {
            global.scheduledTasks = new Map();
        });

        it('should store a task', () => {
            cron.schedule('* * * * *', () => {});
            assert.lengthOf(cron.getTasks(), 1);
        });
    });
});
