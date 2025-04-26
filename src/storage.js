import { v4 as uuidv4 } from 'uuid';

const scheduledTasks = {};

export function save(task) {
    if (!task.options) {
        task.options = {};
        task.options.name = uuidv4();
    }
    scheduledTasks[task.options.name] = task;
}

export function getTasks() {
    return Object.values(scheduledTasks);
}

export function clear() {
    Object.keys(scheduledTasks).forEach((key) => {
        delete scheduledTasks[key];
    });
}