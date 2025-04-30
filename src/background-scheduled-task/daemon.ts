import BasicScheduledTask from '../basic-scheduled-task';

let basicScheduledTask;

export async function register(message){
    const script = await import(message.path);

    const options = message.options;
    options.onError = () => {}

    basicScheduledTask = new BasicScheduledTask(message.cron, script.task, message.options);
    basicScheduledTask.on('task-done', (result) => {
      if (process.send) process.send({ type: 'task-done', result });
    });

    basicScheduledTask.on('task-started', (time) => {
      if (process.send) process.send({ type: 'task-started', time});
    });

    basicScheduledTask.on('task-error', (event, error) => {
      if (process.send) process.send({ type: 'task-error', event, error: serializeError(error)});
    });

    basicScheduledTask.on('scheduler-started', () => {
      if (process.send)  process.send({ type: 'scheduler-started'});
    });

    basicScheduledTask.on('scheduler-stopped', () => {
      if (process.send) process.send({ type: 'scheduler-stopped'});
    }); 

    basicScheduledTask.on('scheduler-destroyed', () => {
      if (process.send) process.send({ type: 'scheduler-destroyed'});
    }); 

    if (process.send) process.send({ type: 'registred' });

    return basicScheduledTask;
}

export function bind(){
  process.on('message', (message: any) => {
    switch(message.type){
    case 'register':
        return register(message);
    }
  });
}

function serializeError(err: Error) {
  const plain = {
    name:    err.name,
    message: err.message,
    stack:   err.stack,
    // copy any other own properties:
    ...Object.getOwnPropertyNames(err)
      .filter(k => !['name','message','stack'].includes(k))
      .reduce((acc, k) => {
        acc[k] = err[k];
        return acc;
      }, {})
  };
  return JSON.stringify(plain);
}

bind();