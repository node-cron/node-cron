import { fileURLToPath } from "url";
import logger from "../../logger";
import { InlineScheduledTask } from "../inline-scheduled-task";
import { ScheduledTask, TaskContext, TaskEvent } from "../scheduled-task";

export async function startDaemon(message: any): Promise<ScheduledTask> {
    let script;
    /* HACK: this hack was added because CJS vs ESM issues in combination with Windows vs Linux issues:
     *
     * 1. On CJS, require should always receive a path
     * 2. On ESM + Windows, import should always receive a file URL
     * 3. On ESM + Linux, import can receive either a URL or a Path
     *
     * Because we need esModuleInterop: true on our TS config file, it's almost impossible
     * to determine during runtime whether we are running in CJS or ESM.
     * This try-catch ensures we will be able to import or require in any environment.
     * 
     * If both fail, then the path cannot be found.
     */
    try {
      script = await import(message.path);
    } catch {
      script = await import(fileURLToPath(message.path))
    }

    const task = new InlineScheduledTask(message.cron, script.task, message.options);

    task.on('task:started', (context => sendEvent('task:started', context)));

    task.on('task:stopped', (context => sendEvent('task:stopped', context)));

    task.on('task:destroyed', (context => sendEvent('task:destroyed', context)));

    task.on('execution:started', (context => sendEvent('execution:started', context)));

    task.on('execution:finished', (context => sendEvent('execution:finished', context)));

    task.on('execution:failed', (context => sendEvent('execution:failed', context)));

    task.on('execution:missed', (context => sendEvent('execution:missed', context)));

    task.on('execution:overlap', (context => sendEvent('execution:overlap', context)));

    task.on('execution:maxReached', (context => sendEvent('execution:maxReached', context)));

    if (process.send) process.send({ event: 'daemon:started' });
    
    task.start();
    return task;
}

function sendEvent(event: TaskEvent, context: TaskContext) {
  const message: any = { event: event, context: safelySerializeContext(context) };

  if(context.execution?.error){
    message.jsonError = serializeError(context.execution?.error)
  }

  if (process.send) process.send(message);
}

function serializeError(err: Error) {
  const plain = {
    name:    err.name,
    message: err.message,
    stack:   err.stack,
    ...Object.getOwnPropertyNames(err)
      .filter(k => !['name','message','stack'].includes(k))
      .reduce((acc, k) => {
        acc[k] = err[k];
        return acc;
      }, {})
  };
  return JSON.stringify(plain);
}

function safelySerializeContext(context: TaskContext): TaskContext {
  const safeContext: any = {
    date: context.date,
    dateLocalIso: context.dateLocalIso,
    triggeredAt: context.triggeredAt
  };
  
  if (context.task) {
    safeContext.task = {
      id: context.task.id,
      name: context.task.name,
      status: context.task.getStatus()
    };
  }
  
  if (context.execution) {
    safeContext.execution = {
      id: context.execution.id,
      reason: context.execution.reason,
      startedAt: context.execution.startedAt,
      finishedAt: context.execution.finishedAt,
      hasError: !!context.execution.error,
      result: context.execution.result
    };
  }

  return safeContext;
}


export function bind(){
  let task: ScheduledTask;

  process.on('message', async (message: any) => {
    switch(message.command){
    case 'task:start':
        task = await startDaemon(message);
        return task;
    case 'task:stop':
      if(task) task.stop();
      return task;
    case 'task:destroy':
      if(task) task.destroy();
      return task;
    case 'task:execute':
      try {
        if (task) await task.execute();
      } catch(error: any){
        logger.debug('Daemon task:execute falied:', error);
      }
      return task;
    }
  });
}

bind();