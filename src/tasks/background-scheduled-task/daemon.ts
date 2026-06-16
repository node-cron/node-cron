import { fileURLToPath } from "url";
import logger, { noopLogger } from "../../logger";
import { InlineScheduledTask } from "../inline-scheduled-task";
import { ScheduledTask, TaskContext, TaskEvent } from "../scheduled-task";

export async function startDaemon(message: any): Promise<ScheduledTask> {
    const script = await importTaskModule(message.path);

    // The inline task in the daemon stays silent; the parent process logs from
    // the forwarded events using the user's configured logger.
    const task = new InlineScheduledTask(message.cron, script.task, { ...(message.options || {}), logger: noopLogger });

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

/* Loading the task file is the one step that legitimately fails at runtime
 * (missing file, a runtime that cannot run the file, unsupported TS syntax in
 * strip-only mode, etc.). We must surface the real reason rather than crash.
 *
 * HACK: CJS vs ESM combined with Windows vs Linux path/URL rules:
 *   1. On CJS, require should always receive a path
 *   2. On ESM + Windows, import should always receive a file URL
 *   3. On ESM + Linux, import can receive either a URL or a path
 * We cannot reliably tell at runtime which we are in, so we try the path first
 * and fall back to a file URL. If both fail we throw the FIRST error, which is
 * the meaningful one (the fallback usually fails with an unrelated URL error).
 */
async function importTaskModule(path: string) {
  try {
    return await import(path);
  } catch (firstError) {
    try {
      return await import(fileURLToPath(path));
    } catch {
      throw firstError;
    }
  }
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
        try {
          task = await startDaemon(message);
        } catch (error: any) {
          // Report the failure to the parent so it can reject start() with the
          // real cause, instead of crashing the daemon with an opaque exit.
          if (process.send) process.send({ event: 'daemon:error', jsonError: serializeError(error) });
        }
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