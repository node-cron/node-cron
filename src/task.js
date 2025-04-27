
class Task{
    constructor(execution){
        if(typeof execution !== 'function') {
            throw 'execution must be a function';
        }
        this.execution = execution;
    }

    async execute(event) {
        return this.execution(event);
    }
}

export default Task;

