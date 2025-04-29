import BasicScheduledTask from '../basic-scheduled-task';

let basicScheduledTask;

export async function register(message){
    const script = await import(message.path);
    basicScheduledTask = new BasicScheduledTask(message.cron, script.task, message.options);
    basicScheduledTask.on('task-done', (result) => {
      if (process.send) process.send({ type: 'task-done', result });
    });

    basicScheduledTask.on('task-started', (time) => {
      if (process.send) process.send({ type: 'task-started', time});
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

bind();