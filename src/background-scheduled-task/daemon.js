import ScheduledTask from '../scheduled-task.js';

let scheduledTask;

async function register(message){
     
    const script = require(message.path);
    scheduledTask = new ScheduledTask(message.cron, script.task, message.options);
    scheduledTask.on('task-done', (result) => {
        process.send({ type: 'task-done', result});
    });

    scheduledTask.on('task-started', (time) => {
        process.send({ type: 'task-started', time});
    });
    
    process.send({ type: 'registred' });
}

process.on('message', (message) => {
    switch(message.type){
    case 'register':
        return register(message);
    }
});
