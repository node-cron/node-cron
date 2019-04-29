module.exports = (() => {
    if(!global.scheduledTasks){
        global.scheduledTasks = [];
    }
    
    return {
        save: (task) => {
            global.scheduledTasks.push(task);
        },
        getTasks: () => {
            return global.scheduledTasks;
        }
    };
})();