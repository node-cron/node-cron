module.exports = (() => {
    if(!global.scheduledTasks){
        global.scheduledTasks = new Map();
    }
    
    return {
        save: (task) => {
            global.scheduledTasks.set(task.name, task);
        },
        getTasks: () => {
            return global.scheduledTasks;
        }
    };
})();