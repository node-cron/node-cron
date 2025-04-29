import { randomUUID } from 'crypto';

const scheduledTasks = {};

export function save(task) {
    if (!task.options) {
        task.options = {};
        task.options.name = randomUUID();
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

export function remove(name) {
    if (scheduledTasks[name]) {
        delete scheduledTasks[name];
    }
}