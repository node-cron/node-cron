const { assert } = require('chai');
const sinon = require('sinon');
const Scheduler = require('../src/scheduler');

describe('Scheduler', () => {
    beforeEach(() => {
        this.clock = sinon.useFakeTimers();
    });

    afterEach(() => {
        this.clock.restore();
    });

    it('should emit an event on matched time', (done) => {
        let scheduler = new Scheduler('* * * * * *');

        scheduler.on('scheduled-time-matched', (date) => {
            assert.isNotNull(date);
            assert.instanceOf(date, Date);
            scheduler.stop();
            done();
        });

        scheduler.start();
        this.clock.tick(1000);
    });

    it('should emit an event every second', (done) => {
        let scheduler = new Scheduler('* * * * * *');
        let emited = 0;
        scheduler.on('scheduled-time-matched', (date) => {
            emited += 1;
            assert.isNotNull(date);
            assert.instanceOf(date, Date);
            if(emited === 5){
                scheduler.stop();
                done();
            }
        });
        scheduler.start();
        this.clock.tick(5000);
    });

    it('should recover missed executions', (done) => {
        this.clock.restore();
        let scheduler = new Scheduler('* * * * * *', null, true);
        let emited = 0;
        scheduler.on('scheduled-time-matched', () => {
            emited += 1;
        });
        scheduler.start();
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
            scheduler.stop();
            assert.equal(2, emited);
            done();
        }, 10);
    }).timeout(4000);

    it('should ignore missed executions', (done) => {
        this.clock.restore();
        let scheduler = new Scheduler('* * * * * *', null, false);
        let emited = 0;
        scheduler.on('scheduled-time-matched', () => {
            emited += 1;
        });
        scheduler.start();
        let wait = true;
        let startedAt = new Date();

        while(wait){
            if((new Date().getTime() - startedAt.getTime()) > 1000){
                wait = false;
            }
        }

        setTimeout(() => {
            scheduler.stop();
            assert.equal(1, emited);
            done();
        }, 1000);
    }).timeout(3000);
});
