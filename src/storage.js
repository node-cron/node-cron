module.exports = (() => {
    if(!global.scheduledTasks){
        global.scheduledTasks = new Map();
    }
    
    return {
        save: (task) => {
            if(!task.options){
                const uuid = require('uuid');
                task.options = {};
                task.options.name = uuid.v4();
            }
            global.scheduledTasks.set(task.options.name, task);
        },
        getTasks: () => {
            return global.scheduledTasks;
        },
        delete: (task) => {
            if (typeof task === 'string') {
                const taskInstance = global.scheduledTasks.get(task).stop();
                // eslint-disable-next-line no-delete-var
                delete taskInstance;
                global.scheduledTasks.delete(task);
            } else {
                task.stop();
                // eslint-disable-next-line no-delete-var
                delete task;
                global.scheduledTasks.delete(task.options.name);
            }
        }
    };
})();