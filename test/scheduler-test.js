const { assert } = require('chai');
const Scheduler = require('../src/scheduler');

describe('Scheduler', () => {
    it('should emit an event on matched time', (done) => {
        let scheduler = new Scheduler('* * * * * *');

        scheduler.on('scheduled-time-matched', (date) => {
            assert.isNotNull(date);
            assert.instanceOf(date, Date);
            scheduler.stop();
            done();
        });
        scheduler.start();
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
    }).timeout(5100);
});