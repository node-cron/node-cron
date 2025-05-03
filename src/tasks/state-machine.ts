type TaskStates = 'stopped' | 'idle' | 'running' | 'destroyed';

const allowedTransitions: Record<TaskStates, TaskStates[]> = {
  'stopped': ['stopped', 'idle', 'destroyed'],
  'idle': ['idle', 'running', 'stopped', 'destroyed'],
  'running': ['running', 'idle', 'stopped', 'destroyed'],
  'destroyed': ['destroyed']
}

export class StateMachine {
  state: TaskStates;

  constructor(initial: TaskStates = 'stopped'){
    this.state = initial;
  }

  changeState(state: TaskStates){
    if(allowedTransitions[this.state].includes(state)){
      this.state = state;
    } else {
      throw new Error(`invalid transition from ${this.state} to ${state}`);
    }
  }

}