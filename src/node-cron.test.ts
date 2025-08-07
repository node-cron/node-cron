import { assert }  from 'chai';

import cron, { solvePath } from './node-cron.js';
import { InlineScheduledTask } from './tasks/inline-scheduled-task.js';

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

        it('should schedule an inline task with name', function() {
            const task = cron.schedule(
                '* * * * *',
                () => {},
                { name: 'Dummy Task' },
            ) as InlineScheduledTask;

            assert.isDefined(task);
            assert.instanceOf(task, InlineScheduledTask);
            assert.isDefined(task.name);
            assert.equal(task.name, 'Dummy Task');

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

        it('should schedule a task with noOverlap option', function() {
            const task = cron.schedule(
                '* * * * * *',
                () => {},
                { noOverlap: true },
            );

            assert.isDefined(task);
            assert.instanceOf(task, InlineScheduledTask);
            assert.isDefined(task.runner.noOverlap);
            assert.isTrue(task.runner.noOverlap);

            task.stop();
        }).timeout(10000);

        it('should schedule a task with maxExecutions option', function() {
            const task = cron.schedule(
                '* * * * * *',
                () => {},
                { maxExecutions: 5 },
            );

            assert.isDefined(task);
            assert.instanceOf(task, InlineScheduledTask);
            assert.isDefined(task.runner.maxExecutions);
            assert.equal(task.runner.maxExecutions, 5);

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

      it('creates an inline task with name', function() {
        const task = cron.createTask(
          '* * * * *',
          () => {},
          { name: 'Dummy Task' },
        );

        assert.isDefined(task);
        assert.instanceOf(task, InlineScheduledTask);
        assert.equal(task.getStatus(), 'stopped');
        assert.isDefined(task.name);
        assert.equal(task.name, 'Dummy Task');
      });

      it('creates an inline task with America/Sao_Paulo timezone', function() {
        const task = cron.createTask(
          '* * * * *',
          () => {},
          { timezone: 'America/Sao_Paulo' },
        ) as InlineScheduledTask;

        assert.isDefined(task);
        assert.instanceOf(task, InlineScheduledTask);
        assert.equal(task.getStatus(), 'stopped');
        assert.isDefined(task.timezone);
        assert.equal(task.timezone, 'America/Sao_Paulo');
      });

      it('creates an inline task with noOverlap option', function() {
        const task = cron.createTask(
          '* * * * *',
          () => {},
          { noOverlap: true },
        ) as InlineScheduledTask;

        assert.isDefined(task);
        assert.instanceOf(task, InlineScheduledTask);
        assert.equal(task.getStatus(), 'stopped');
        assert.isDefined(task.runner.noOverlap);
        assert.isTrue(task.runner.noOverlap);
      });

      it('creates an inline task with maxExecutions option', function() {
        const task = cron.createTask(
          '* * * * *',
          () => {},
          { maxExecutions: 5 },
        ) as InlineScheduledTask;

        assert.isDefined(task);
        assert.instanceOf(task, InlineScheduledTask);
        assert.equal(task.getStatus(), 'stopped');
        assert.isDefined(task.runner.maxExecutions);
        assert.equal(task.runner.maxExecutions, 5);
      });

      it('creates a background task', function(){
        const task = cron.createTask('* * * * *', '../test-assets/dummy-task.js');
        assert.isDefined(task);
        assert.isDefined(task.id);
        assert.equal(task.getStatus(), 'stopped');
      });
    })

     describe('solvePath', function(){
      it('should resolve an absolute path', function(){
        const path = '/home/usr/dir/script.js';
        const solvedPath = solvePath(path);
        assert.isDefined(solvedPath);
        assert.include(solvedPath, `file:///`);
        assert.include(solvedPath, path);
      });

      it('should resolve a file url', function(){
        const path = 'file:///home/usr/dir/script.js';
        const solvedPath = solvePath(path);
        assert.isDefined(solvedPath);
        assert.equal(solvedPath, `file:///home/usr/dir/script.js`);
      });

      it('should resolve a relative path', function(){
        const path = './home/usr/dir/script.js';
        const solvedPath = solvePath(path);
        assert.isDefined(solvedPath);
        assert.include(solvedPath, `file:///`);
        assert.include(solvedPath, path.slice(1));
      });
    })
});


function wait(time: number){
  return new Promise(r=> setTimeout(r, time));
}
