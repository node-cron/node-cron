import ScheduledTask from '../scheduled-task';

let scheduledTask;

export async function register(message){
    const script = await import(message.path);
    scheduledTask = new ScheduledTask(message.cron, script.task, message.options);
    scheduledTask.on('task-done', (result) => {
      if (process.send) process.send({ type: 'task-done', result });
    });

    scheduledTask.on('task-started', (time) => {
      if (process.send) process.send({ type: 'task-started', time});
    });

    scheduledTask.on('scheduler-started', () => {
      if (process.send)  process.send({ type: 'scheduler-started'});
    });

    scheduledTask.on('scheduler-stopped', () => {
      if (process.send) process.send({ type: 'scheduler-stopped'});
    }); 

    scheduledTask.on('scheduler-destroyed', () => {
      if (process.send) process.send({ type: 'scheduler-destroyed'});
    }); 

    if (process.send) process.send({ type: 'registred' });

    return scheduledTask;
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