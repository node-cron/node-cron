import { randomUUID } from 'crypto';
import { ScheduledTask } from './tasks/scheduled-task';

const tasks = {};

export function save(task) {
    if (!task.options) {
        task.options = {};
        task.options.name = randomUUID();
    }
    tasks[task.options.name] = task;
}

export function getTasks(): ScheduledTask[] {
    return Object.values(tasks);
}

export function clear() {
    Object.keys(tasks).forEach((key) => {
        delete tasks[key];
    });
}

export function remove(name) {
    if (tasks[name]) {
        delete tasks[name];
    }
}