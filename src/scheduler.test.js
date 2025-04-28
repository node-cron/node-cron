import * as chai from 'chai';
const { assert } = chai;
import { useFakeTimers } from 'sinon/pkg/sinon-esm.js';
import Scheduler from './scheduler.js';

let clock;
describe('Scheduler', function() {
    beforeEach(function() {
        clock = useFakeTimers();
    });

    afterEach(function() {
        clock.restore();
    });

    it('should emit an event on matched time', function(done) {
        let scheduler = new Scheduler('* * * * * *');

        scheduler.on('scheduled-time-matched', (event) => {
            assert.isNotNull(event.date);
            assert.instanceOf(event.date, Date);
            assert.isNotNull(event.matchedDate);
            assert.equal(event.reason, 'time-matched');
            assert.equal(event.missedExecutions, 0);
            scheduler.stop();
            done();
        });

        scheduler.start();
        clock.tick(1000);
    });

    it('should emit an event every second', function(done) {
        let scheduler = new Scheduler('* * * * * *');
        let emited = 0;
        scheduler.on('scheduled-time-matched', (event) => {
            emited += 1;
            assert.isNotNull(event.date);
            assert.instanceOf(event.date, Date);
            assert.equal(event.reason, 'time-matched');
            assert.equal(event.missedExecutions, 0);
            if(emited === 5){
                scheduler.stop();
                done();
            }
        });
        scheduler.start();
        clock.tick(6000);
        assert.equal(5, emited);
    });

    it('should recover missed executions', function(done) {
        clock.restore();
        let scheduler = new Scheduler('* * * * * *', null, true);
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
            assert.equal(2, emited);
            done();
        }, 1000);
    }).timeout(3000);

    it('should ignore missed executions', function(done) {
        clock.restore();
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