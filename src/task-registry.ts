import { ScheduledTask } from "./tasks/scheduled-task";

const tasks = new Map<string, ScheduledTask> ();

export class TaskRegistry {
  add(task: ScheduledTask): void{
    if(this.has(task.id)){
      throw Error(`task ${task.id} already registered!`)
    }
    
    tasks.set(task.id, task);

    task.on('task:destroyed', () => {
      this.remove(task);
    });
  }

  get(taskId: string): ScheduledTask | undefined {
    return tasks.get(taskId);
  }

  remove(task: ScheduledTask ){
    if(this.has(task.id)){
      tasks.delete(task.id);
      task.destroy();
    }
  }

  all(): typeof tasks {
    return tasks;
  }

  has(taskId: string): boolean {
    return tasks.has(taskId);
  }

  killAll() {
   tasks.forEach(id => this.remove(id));
  }
}