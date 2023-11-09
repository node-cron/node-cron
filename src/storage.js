const { randomUUID } = require('crypto');

module.exports = (() => {
    if(!global.scheduledTasks){
        global.scheduledTasks = new Map();
    }
    
    return {
        save: (task) => {
            if(!task.options){
                task.options = {};
                task.options.name = randomUUID();
            }
            global.scheduledTasks.set(task.options.name, task);
        },
        getTasks: () => {
            return global.scheduledTasks;
        }
    };
})();