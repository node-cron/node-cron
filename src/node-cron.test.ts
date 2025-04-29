import { assert }  from 'chai';
import { useFakeTimers } from 'sinon';
import cron from './node-cron';

let clock;

describe('node-cron', function() {
    beforeEach(function() {
        clock = useFakeTimers(new Date(2018, 0, 1, 0, 0, 0, 0));
    });
    
    afterEach(function() {
        clock.restore();
    });
    
    describe('schedule', function() {
        it('should schedule a task', function() {
            let executed = 0;
            cron.schedule('* * * * * *', () => {
                executed += 1;
            });
            
            clock.tick(2000);
            
            assert.equal(2, executed);
        });
        
        it('should schedule a task with America/Sao_Paulo timezone', function(done) {
            let startDate = new Date('Thu, 20 Sep 2018 00:00:00.000Z');
            clock.restore();
            clock = useFakeTimers(startDate);
            cron.schedule('* * * * * *', (event) => {
                assert.equal(19, event.date.getDate());
                assert.equal(8, event.date.getMonth());
                assert.equal(2018, event.date.getFullYear());
                assert.equal(21, event.date.getHours());
                assert.equal(0, event.date.getMinutes());
                assert.equal(1, event.date.getSeconds());
                done();
            }, {
                timezone: 'America/Sao_Paulo'
            });
            clock.tick(1000);
        });
        
        it('should schedule a task with Europe/Rome timezone', function(done) {
            let startDate = new Date('Thu, 20 Sep 2018 00:00:00.000Z');
            clock.restore();
            clock = useFakeTimers(startDate);
            cron.schedule('* * * * * *', (event) => {
                assert.equal('Thu, 09/20/2018, 02:00:01', event.matchedDate);
                done();
            }, {
                timezone: 'Europe/Rome'
            });
            clock.tick(1000);
        });
        
        it('should schedule a task stoped', function() {
            let executed = 0;
            cron.schedule('* * * * * *', () => {
                executed += 1;
            }, { scheduled: false });
            
            clock.tick(2000);
            
            assert.equal(0, executed);
        });
        
        it('should start a stoped task', function() {
            let executed = 0;
            let BasicScheduledTask = cron.schedule('* * * * * *', () => {
                executed += 1;
            }, { scheduled: false });
            
            clock.tick(2000);
            assert.equal(0, executed);
            BasicScheduledTask.start();
            clock.tick(2000);
            assert.equal(2, executed);
        });
        
        it('should recover missed executions', function(done) {
            let executed = 0;
            clock.restore();
            let BasicScheduledTask = cron.schedule('* * * * * *', () => {
                executed += 1;
            }, { recoverMissedExecutions: true });
            
            let wait = true;
            let startedAt = new Date();
            
            while(wait){
                if((new Date().getTime() - startedAt.getTime()) > 1000){
                    wait = false;
                }
            }
            
            setTimeout(() => {
                BasicScheduledTask.stop();
                assert.equal(2, executed);
                done();
            }, 1000);
        }).timeout(4000);

        it('should schedule a background task', function() {
            let task = cron.schedule('* * * * * *', './test-assets/dummy-task');
            assert.isNotNull(task);
            assert.isDefined(task);
            task.stop();
        });
    });
    
    describe('validate', function() {
        it('should validate a pattern', function() {
            assert.isTrue(cron.validate('* * * * * *')); 
        });
        
        it('should fail with a invalid pattern', function() {
            assert.isFalse(cron.validate('62 * * * * *')); 
        });
    });

    describe('getTasks', function() {
        it('should store a task', function() {
            cron.schedule('* * * * *', () => {});
            assert.isTrue(cron.getTasks().length > 0);
        });
    });
});