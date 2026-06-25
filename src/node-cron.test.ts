import { fork } from 'child_process';
import { EventEmitter } from 'events';
import cron, { solvePath } from './node-cron';
import { InlineScheduledTask } from './tasks/inline-scheduled-task';

// Background tasks fork a daemon process; the daemon artifact only exists in the
// built output, so fork() is mocked with a fake child that replays the task
// lifecycle events. The real fork path is covered against the build.
vi.mock('child_process', () => ({ fork: vi.fn() }));

function makeFakeChild() {
  const child: any = new EventEmitter();
  child.killed = false;
  child.kill = () => { child.killed = true; };
  child.send = (msg: any) => {
    const event =
      msg.command === 'task:start' ? 'task:started' :
      msg.command === 'task:stop' ? 'task:stopped' :
      msg.command === 'task:destroy' ? 'task:destroyed' : undefined;
    if (event) {
      queueMicrotask(() => child.emit('message', { event, context: { date: new Date().toISOString() } }));
    }
    return true;
  };
  return child;
}

describe('node-cron', function() {
    beforeEach(() => {
      vi.mocked(fork).mockImplementation(() => makeFakeChild() as any);
    });

    afterEach(() => {
      vi.mocked(fork).mockReset();
    });

    describe('schedule', function() {
        it('should schedule a task', async function() {
            let executed = 0;
            const task = cron.schedule('* * * * * *', () => {
                executed += 1;
            });

            await new Promise<void>(resolve => {
                const check = setInterval(() => {
                    if (executed >= 1) {
                        clearInterval(check);
                        resolve();
                    }
                }, 50);
            });

            expect(executed).toBeGreaterThanOrEqual(1);
            task.stop();
        });

        it('should schedule an inline task with name', function() {
            const task = cron.schedule(
                '* * * * *',
                () => {},
                { name: 'Dummy Task' },
            ) as InlineScheduledTask;

            expect(task).toBeDefined();
            expect(task).toBeInstanceOf(InlineScheduledTask);
            expect(task.name).toBeDefined();
            expect(task.name).toBe('Dummy Task');

            task.stop();
        });

        it('should schedule a task with America/Sao_Paulo timezone', async function() {
          let localIso: string = '';
            const task = cron.schedule('* * * * * *', (event) => {
              localIso = event.dateLocalIso;
            }, {
                timezone: 'America/Sao_Paulo'
            });
            
            await new Promise(r=>{setTimeout(r, 1000)})

            expect(localIso.endsWith('-03:00')).toBe(true);
            task.stop();
        });

        it('should schedule a task with Europe/Istanbul timezone', async function() {
          let localIso: string = '';
            const task = cron.schedule('* * * * * *', (event) => {
              localIso = event.dateLocalIso;
            }, {
                timezone: 'Europe/Istanbul'
            });
            await new Promise(r=>{setTimeout(r, 1000)})
            console.log(localIso)
            expect(localIso.endsWith('+03:00')).toBe(true);
            task.stop();
        });

        it('should schedule a task with noOverlap option', function() {
            const task = cron.schedule(
                '* * * * * *',
                () => {},
                { noOverlap: true },
            );

            expect(task).toBeDefined();
            expect(task).toBeInstanceOf(InlineScheduledTask);
            expect(task.runner.noOverlap).toBeDefined();
            expect(task.runner.noOverlap).toBe(true);

            task.stop();
        });

        it('should schedule a task with maxExecutions option', function() {
            const task = cron.schedule(
                '* * * * * *',
                () => {},
                { maxExecutions: 5 },
            );

            expect(task).toBeDefined();
            expect(task).toBeInstanceOf(InlineScheduledTask);
            expect(task.runner.maxExecutions).toBeDefined();
            expect(task.runner.maxExecutions).toBe(5);

            task.stop();
        });

        it('should schedule a background task', async function() {
            const task = cron.schedule('* * * * *', '../test-assets/dummy-task.js');
            await wait(1000);
            expect(task).not.toBeNull();
            expect(task).toBeDefined();
            await task.destroy();
        });

        it('logs a background task start failure instead of throwing unhandled', async function() {
            const errors: any[] = [];
            const fakeLogger: any = { error: (...a: any[]) => errors.push(a), warn(){}, info(){}, debug(){} };

            vi.mocked(fork).mockImplementation(() => {
              const child: any = new EventEmitter();
              child.killed = false;
              child.kill = () => { child.killed = true; };
              child.send = () => {
                queueMicrotask(() => child.emit('message', {
                  event: 'daemon:error',
                  jsonError: JSON.stringify({ name: 'Error', message: 'load failed in child' })
                }));
                return true;
              };
              return child;
            });

            // schedule() auto-starts and does not return the promise; the failure
            // must be routed to the logger, not surface as an unhandled rejection.
            const task = cron.schedule('* * * * *', '../test-assets/dummy-task.js', { logger: fakeLogger });
            await wait(200);

            expect(errors.some(e => JSON.stringify(e).includes('load failed in child'))).toBe(true);
            await task.destroy();
        });

        it('logs background task start failure to default logger when no custom logger', async function() {
            const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

            vi.mocked(fork).mockImplementation(() => {
              const child: any = new EventEmitter();
              child.killed = false;
              child.kill = () => { child.killed = true; };
              child.send = () => {
                queueMicrotask(() => child.emit('message', {
                  event: 'daemon:error',
                  jsonError: JSON.stringify({ name: 'Error', message: 'daemon crashed' })
                }));
                return true;
              };
              return child;
            });

            const task = cron.schedule('* * * * *', '../test-assets/dummy-task.js');
            await wait(200);

            expect(spy.mock.calls.some(c => c.some((a: any) => String(a).includes('daemon crashed')))).toBe(true);
            spy.mockRestore();
            await task.destroy();
        });
    });
    
    describe('validate', function() {
        it('should validate a pattern', function() {
            expect(cron.validate('* * * * * *')).toBe(true);
        });

        it('should fail with a invalid pattern', function() {
            expect(cron.validate('62 * * * * *')).toBe(false);
        });
    });

    describe('validateDetailed', function() {
        it('returns a structured result', function() {
            const ok = cron.validateDetailed('0 30 9 * * *');
            expect(ok.valid).toBe(true);
            expect(ok.fields?.minute).toEqual([30]);

            const bad = cron.validateDetailed('62 * * * * *');
            expect(bad.valid).toBe(false);
            expect(bad.errors[0].field).toBe('second');
        });
    });

    describe('parse', function() {
        it('returns decomposed fields', function() {
            expect(cron.parse('0 30 9 * * *').hour).toEqual([9]);
        });
        it('throws on an invalid expression', function() {
            expect(() => cron.parse('62 * * * * *')).toThrow();
        });
    });

    describe('createTask', function(){
      it('creates a inline task', function(){
        const task = cron.createTask('* * * * *', ()=>{});
        expect(task).toBeDefined();
        expect(task.id).toBeDefined();
        expect(task.getStatus()).toBe('stopped');
      });

      it('creates an inline task with name', function() {
        const task = cron.createTask(
          '* * * * *',
          () => {},
          { name: 'Dummy Task' },
        );

        expect(task).toBeDefined();
        expect(task).toBeInstanceOf(InlineScheduledTask);
        expect(task.getStatus()).toBe('stopped');
        expect(task.name).toBeDefined();
        expect(task.name).toBe('Dummy Task');
      });

      it('creates an inline task with America/Sao_Paulo timezone', function() {
        const task = cron.createTask(
          '* * * * *',
          () => {},
          { timezone: 'America/Sao_Paulo' },
        ) as InlineScheduledTask;

        expect(task).toBeDefined();
        expect(task).toBeInstanceOf(InlineScheduledTask);
        expect(task.getStatus()).toBe('stopped');
        expect(task.timezone).toBeDefined();
        expect(task.timezone).toBe('America/Sao_Paulo');
      });

      it('creates an inline task with noOverlap option', function() {
        const task = cron.createTask(
          '* * * * *',
          () => {},
          { noOverlap: true },
        ) as InlineScheduledTask;

        expect(task).toBeDefined();
        expect(task).toBeInstanceOf(InlineScheduledTask);
        expect(task.getStatus()).toBe('stopped');
        expect(task.runner.noOverlap).toBeDefined();
        expect(task.runner.noOverlap).toBe(true);
      });

      it('creates an inline task with maxExecutions option', function() {
        const task = cron.createTask(
          '* * * * *',
          () => {},
          { maxExecutions: 5 },
        ) as InlineScheduledTask;

        expect(task).toBeDefined();
        expect(task).toBeInstanceOf(InlineScheduledTask);
        expect(task.getStatus()).toBe('stopped');
        expect(task.runner.maxExecutions).toBeDefined();
        expect(task.runner.maxExecutions).toBe(5);
      });

      it('creates a background task', function(){
        const task = cron.createTask('* * * * *', '../test-assets/dummy-task.js');
        expect(task).toBeDefined();
        expect(task.id).toBeDefined();
        expect(task.getStatus()).toBe('stopped');
      });
    })

     describe('solvePath', function(){
      it('should resolve an absolute path', function(){
        const path = '/home/usr/dir/script.js';
        const solvedPath = solvePath(path);
        expect(solvedPath).toBeDefined();
        expect(solvedPath).toContain(`file:///`);
        expect(solvedPath).toContain(path);
      });

      it('should resolve a file url', function(){
        const path = 'file:///home/usr/dir/script.js';
        const solvedPath = solvePath(path);
        expect(solvedPath).toBeDefined();
        expect(solvedPath).toBe(`file:///home/usr/dir/script.js`);
      });

      it('should resolve a relative path', function(){
        const path = './home/usr/dir/script.js';
        const solvedPath = solvePath(path);
        expect(solvedPath).toBeDefined();
        expect(solvedPath).toContain(`file:///`);
        expect(solvedPath).toContain(path.slice(1));
      });

      it('throws when the caller cannot be located in the stack', function(){
        const OrigError = globalThis.Error;
        const FakeError = class extends OrigError {
          constructor(msg?: string) {
            super(msg);
            this.stack = 'Error\n    at <anonymous>';
          }
        };
        globalThis.Error = FakeError as any;
        try {
          expect(() => solvePath('./relative.js')).toThrow('Could not locate task file');
        } finally {
          globalThis.Error = OrigError;
        }
      });
    })
});


function wait(time: number){
  return new Promise(r=> setTimeout(r, time));
}