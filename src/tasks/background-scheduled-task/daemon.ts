import { fileURLToPath } from "url";
import logger, { noopLogger } from "../../logger";
import { InlineScheduledTask } from "../inline-scheduled-task";
import { TaskContext, TaskEvent, TaskOptions } from "../scheduled-task";
import { IpcRunCoordinator } from "../../coordinator/ipc-run-coordinator";
import { createID } from "../../create-id";

export async function startDaemon(message: any): Promise<InlineScheduledTask> {
    const script = await importTaskModule(message.path);

    // The inline task in the daemon stays silent; the parent process logs from
    // the forwarded events using the user's configured logger.
    const options: TaskOptions = { ...(message.options || {}), logger: noopLogger };

    // The real coordinator lives in the parent; bridge to it over IPC so the
    // daemon coordinates through the same shared backend as every instance.
    if (options.distributed) {
      options.runCoordinator = new IpcRunCoordinator(process);
    }

    const task = new InlineScheduledTask(message.cron, script.task, options);

    task.on('task:started', (context => sendEvent('task:started', context)));

    task.on('task:stopped', (context => sendEvent('task:stopped', context)));

    task.on('task:destroyed', (context => sendEvent('task:destroyed', context)));

    task.on('execution:started', (context => sendEvent('execution:started', context)));

    task.on('execution:finished', (context => sendEvent('execution:finished', context)));

    task.on('execution:failed', (context => sendEvent('execution:failed', context)));

    task.on('execution:missed', (context => sendEvent('execution:missed', context)));

    task.on('execution:overlap', (context => sendEvent('execution:overlap', context)));

    /* v8 ignore next */
    task.on('execution:maxReached', (context => sendEvent('execution:maxReached', context)));

    task.on('execution:skipped', (context => sendEvent('execution:skipped', context)));

    /* v8 ignore next */
    if (process.send) process.send({ event: 'daemon:started' });

    task.start();
    return task;
}

/* Loading the task file is the one step that legitimately fails at runtime
 * (missing file, a runtime that cannot run the file, unsupported TS syntax in
 * strip-only mode, etc.). We must surface the real reason rather than crash.
 *
 * Windows and Linux differ in the path/URL shapes import() accepts, so try the
 * original specifier first and fall back to a file path. If both fail we throw
 * the first error, which is usually the meaningful task-loading failure.
 */
async function importTaskModule(path: string) {
  try {
    return await import(path);
  } catch (firstError) {
    try {
      return await import(fileURLToPath(path));
    /* v8 ignore start */
    } catch {
      throw firstError;
    }
    /* v8 ignore stop */
  }
}

function sendEvent(event: TaskEvent, context: TaskContext) {
  const message: any = { event: event, context: safelySerializeContext(context) };

  if(context.execution?.error){
    message.jsonError = serializeError(context.execution?.error)
  }

  /* v8 ignore next */
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

  if (context.reason) {
    safeContext.reason = context.reason;
  }

  /* v8 ignore next */
  if (context.task) {
    safeContext.task = {
      id: context.task.id,
      name: context.task.name,
      state: context.task.getStatus()
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
  let task: InlineScheduledTask;

  process.on('message', async (message: any) => {
    switch(message.command){
    case 'task:start':
        try {
          task = await startDaemon(message);
        } catch (error: any) {
          // Report the failure to the parent so it can reject start() with the
          // real cause, instead of crashing the daemon with an opaque exit.
          /* v8 ignore next */
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
      if (!task) {
        // No task loaded yet: report it instead of dropping the message, or
        // the parent's execute() waits for an event that never arrives. Echo the
        // parent's correlation id so its filtered execute() matches this failure.
        sendEvent('execution:failed', {
          date: new Date(),
          dateLocalIso: new Date().toISOString(),
          triggeredAt: new Date(),
          execution: { id: message.executionId ?? createID(), reason: 'invoked', error: new Error('Cannot execute: no task loaded') }
        });
        return task;
      }
      try {
        // Threads the parent's correlation id through so its execute() can
        // match the forwarded event to this call, not a concurrent scheduled fire.
        await task.execute(message.executionId);
      } catch(error: any){
        logger.debug('Daemon task:execute failed:', error);
      }
      return task;
    }
  });

  // When the parent dies the IPC channel disconnects. Exit instead of lingering
  // as an orphan: an orphaned daemon would keep running the schedule on its own,
  // and a distributed task's IPC coordination would hang with no parent to reply.
  process.on('disconnect', () => process.exit(0));
}

bind();
