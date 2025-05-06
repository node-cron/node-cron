export function task() {
    const err = new Error('failed task');
    err.extra = 'extra';
    throw err;
}