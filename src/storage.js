module.exports = (() => {
    if (!global.scheduledTasks) {
        global.scheduledTasks = new Map();
    }

    return {
        save: (task) => {
            if (!task.options) {
                const generateUUID = require('./uuid');
                task.options = {};
                task.options.name = generateUUID();
            }
            global.scheduledTasks.set(task.options.name, task);
        },
        getTasks: () => {
            return global.scheduledTasks;
        }
    };
})();