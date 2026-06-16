export type TaskState = 'stopped' | 'idle' | 'running' | 'destroyed';

const allowedTransitions: Record<TaskState, TaskState[]> = {
  'stopped': ['stopped', 'idle', 'destroyed'],
  'idle': ['idle', 'running', 'stopped', 'destroyed'],
  'running': ['running', 'idle', 'stopped', 'destroyed'],
  'destroyed': ['destroyed']
}

export class StateMachine {
  state: TaskState;

  constructor(initial: TaskState = 'stopped'){
    this.state = initial;
  }

  changeState(state: TaskState){
    if(allowedTransitions[this.state].includes(state)){
      this.state = state;
    } else {
      throw new Error(`invalid transition from ${this.state} to ${state}`);
    }
  }

}