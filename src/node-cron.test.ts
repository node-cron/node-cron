import { assert }  from 'chai';
import { useFakeTimers, spy } from 'sinon';
import cron from './node-cron';

describe('node-cron', function() {
    let clock;

    beforeEach(function() {
        clock = useFakeTimers({
          now: new Date(2018, 0, 1, 0, 0, 0, 0),
          shouldAdvanceTime: true
        });
    });
    
    afterEach(function() {
        clock.restore();
    });
    
    describe('schedule', function() {
        it('should schedule a task', async function() {
            let executed = 0;
            const task = cron.schedule('* * * * * *', () => {
                executed += 1;
            });
            
            clock.tick(2000);
            // adds a delay after tick
            await new Promise(r=>{setTimeout(r, 200)})

            assert.equal(2, executed);
            task.stop();
        });
        
        it('should schedule a task with America/Sao_Paulo timezone', function(done) {
            let startDate = new Date('Thu, 20 Sep 2018 00:00:00.000Z');
            clock.restore();
            clock = useFakeTimers(startDate);
            const task = cron.schedule('* * * * * *', (event) => {
                assert.equal(19, event.date.getDate());
                assert.equal(8, event.date.getMonth());
                assert.equal(2018, event.date.getFullYear());
                assert.equal(21, event.date.getHours());
                assert.equal(0, event.date.getMinutes());
                assert.equal(1, event.date.getSeconds());
                task.stop();
                done();
            }, {
                timezone: 'America/Sao_Paulo'
            });

            clock.tick(1000);
            task.stop()
        });
        
        it('should schedule a task with Europe/Rome timezone', function(done) {
            let startDate = new Date('Thu, 20 Sep 2018 00:00:00.000Z');
            clock.restore();
            clock = useFakeTimers(startDate);
            const task = cron.schedule('* * * * * *', (event) => {
                assert.equal('2018-09-20T02:00:01.000+02:00', event.dateLocalIso);
                done();
            }, {
                timezone: 'Europe/Rome'
            });
            clock.tick(1000);
            task.stop();
        });
        
        it('should schedule a background task', async function() {
            let task = cron.schedule('* * * * *', '../test-assets/dummy-task');
            await wait(1000);
            assert.isNotNull(task);
            assert.isDefined(task);
            await task.destroy();
        }).timeout(10000);
    });
    
    describe('validate', function() {
        it('should validate a pattern', function() {
            assert.isTrue(cron.validate('* * * * * *')); 
        });
        
        it('should fail with a invalid pattern', function() {
            assert.isFalse(cron.validate('62 * * * * *')); 
        });
    });

    describe('getTaskRegistry', function() {
        it('should store a task', function() {
            const task = cron.schedule('* * * * *', () => {});
            assert.isTrue(cron.getTaskRegistry().all().length > 0);
        });
    });

    describe('createTask', function(){
      it('creates a inline task', function(){
        const task = cron.createTask('* * * * *', ()=>{});
        assert.isDefined(task);
        assert.isDefined(task.id);
        assert.equal(task.getStatus(), 'stopped');
      });

      it('creates a background task', function(){
        const task = cron.createTask('* * * * *', '../test-assets/dummy-task');
        assert.isDefined(task);
        assert.isDefined(task.id);
        assert.equal(task.getStatus(), 'stopped');
      });
    })
});


function wait(time: number){
  return new Promise(r=> setTimeout(r, time));
}