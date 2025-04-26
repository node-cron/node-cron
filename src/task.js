
class Task{
    constructor(execution){
        if(typeof execution !== 'function') {
            throw 'execution must be a function';
        }
        this.execution = execution;
    }

    async execute(now) {
        return this.execution(now);
    }
}

export default Task;

