import { TaskRegistry } from './task-registry';
import { InlineScheduledTask } from './tasks/inline-scheduled-task';
import { ScheduledTask } from './tasks/scheduled-task';

describe('TaskRegistry', function(){
  const registry = new TaskRegistry();

  afterEach(function(){
    registry.killAll();
  })

  it('adds a new task', function(){
    const task = createTask();
    registry.add(task);
    expect(registry.has(task.id)).toBe(true);
  });

  it('does not add a task twice', function(){
    const task = createTask();
    registry.add(task);
    expect(()=>{
      registry.add(task);
    }).toThrow(`task ${task.id} already registered!`)
  });

  it('removes a task', function(){
    const task = createTask();
    registry.add(task);
    expect(registry.has(task.id)).toBe(true);
    registry.remove(task);
    expect(registry.has(task.id)).toBe(false);
  });

  it('does nothing when removing a task that is not registered', function(){
    const task = createTask();
    expect(() => registry.remove(task)).not.toThrow();
    expect(registry.has(task.id)).toBe(false);
  });

  it('removes a task when task is destroyed', function(){
    const task = createTask();
    registry.add(task);
    task.destroy();
    expect(registry.has(task.id)).toBe(false);
  });

  it('gets a task', function(){
    const task = createTask();
    registry.add(task);

    const storedTask = registry.get(task.id);

    expect(task.id).toBe(storedTask?.id);
  });

  it('checks it has task by id', function(){
    const task = createTask();
    registry.add(task);
    expect(registry.has(task.id)).toBe(true);
  });

  it('checks it has task by id when task does not exist', function(){
    expect(registry.has('invalid-id')).toBe(false);
  });

  it('returns all task', function(){
    registry.add(createTask());
    registry.add(createTask());
    registry.add(createTask());

    const tasks = registry.all();
    expect(tasks).toHaveLength(3);
  });

  it('calls destroy exactly once when remove is called', function(){
    const task = createTask();
    registry.add(task);

    let destroyCount = 0;
    const original = task.destroy.bind(task);
    task.destroy = function() {
      destroyCount++;
      return original();
    };

    registry.remove(task);
    expect(destroyCount).toBe(1);
    expect(registry.has(task.id)).toBe(false);
  });

  it('kills all tasks', function() {
    registry.add(createTask());
    registry.add(createTask());
    registry.add(createTask());

    const tasks = registry.all();
    registry.killAll();

    tasks.forEach(t => {
      expect(t.getStatus()).toBe('destroyed');
    })
  })
})

function createTask(): ScheduledTask {
  return new InlineScheduledTask('* * * * *', () => {});
}