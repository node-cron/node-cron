import ScheduledTask from '../scheduled-task.js';

let scheduledTask;

export async function register(message){
    const script = await import(message.path);
    scheduledTask = new ScheduledTask(message.cron, script.task, message.options);
    scheduledTask.on('task-done', (result) => {
        process.send({ type: 'task-done', result});
    });

    scheduledTask.on('task-started', (time) => {
        process.send({ type: 'task-started', time});
    });

    scheduledTask.on('scheduler-started', () => {
        process.send({ type: 'scheduler-started'});
    });

    scheduledTask.on('scheduler-stopped', () => {
        process.send({ type: 'scheduler-stopped'});
    }); 

    scheduledTask.on('scheduler-destroyed', () => {
      process.send({ type: 'scheduler-destroyed'});
    }); 

    process.send({ type: 'registred' });

    return scheduledTask;
}

export function bind(){
  process.on('message', (message) => {
    switch(message.type){
    case 'register':
        return register(message);
    }
  });
}

bind();