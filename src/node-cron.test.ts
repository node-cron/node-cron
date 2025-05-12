import { assert }  from 'chai';
import cron from './node-cron';

describe('node-cron', function() {
    describe('schedule', function() {
        it('should schedule a task', async function() {
            let executed = 0;
            const task = cron.schedule('* * * * * *', () => {
                executed += 1;
            });
            
            await new Promise(r=>{setTimeout(r, 1000)})

            assert.equal(1, executed);
            task.stop();
        }).timeout(10000);
        
        it('should schedule a task with America/Sao_Paulo timezone', async function() {
          let localIso: string = '';
            const task = cron.schedule('* * * * * *', (event) => {
              localIso = event.dateLocalIso;
            }, {
                timezone: 'America/Sao_Paulo'
            });
            
            await new Promise(r=>{setTimeout(r, 1000)})

            assert.isTrue(localIso.endsWith('-03:00'));
            task.stop();
        }).timeout(10000);
        
        it('should schedule a task with Europe/Istanbul timezone', async function() {
          let localIso: string = '';
            const task = cron.schedule('* * * * * *', (event) => {
              localIso = event.dateLocalIso;
            }, {
                timezone: 'Europe/Istanbul'
            });
            await new Promise(r=>{setTimeout(r, 1000)})
            console.log(localIso)
            assert.isTrue(localIso.endsWith('+03:00'));
            task.stop();
        }).timeout(10000);
        
        it('should schedule a background task', async function() {
            const task = cron.schedule('* * * * *', '../test-assets/dummy-task.js');
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

    describe('createTask', function(){
      it('creates a inline task', function(){
        const task = cron.createTask('* * * * *', ()=>{});
        assert.isDefined(task);
        assert.isDefined(task.id);
        assert.equal(task.getStatus(), 'stopped');
      });

      it('creates a background task', function(){
        const task = cron.createTask('* * * * *', '../test-assets/dummy-task.js');
        assert.isDefined(task);
        assert.isDefined(task.id);
        assert.equal(task.getStatus(), 'stopped');
      });
    })
});


function wait(time: number){
  return new Promise(r=> setTimeout(r, time));
}