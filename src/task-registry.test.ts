import { assert } from 'chai';

import { TaskRegistry } from './task-registry.js';
import { InlineScheduledTask } from './tasks/inline-scheduled-task.js';

import type { ScheduledTask } from './tasks/scheduled-task.js';

describe('TaskRegistry', function(){
  const registry = new TaskRegistry();

  afterEach(function(){
    registry.killAll();
  })

  it('adds a new task', function(){
    const task = createTask();
    registry.add(task);
    assert.isTrue(registry.has(task.id));
  });

  it('does not add a task twice', function(){
    const task = createTask();
    registry.add(task);
    assert.throws(()=>{
      registry.add(task);
    }, `task ${task.id} already registred!`)
  });

  it('removes a task', function(){
    const task = createTask();
    registry.add(task);
    assert.isTrue(registry.has(task.id));
    registry.remove(task);
    assert.isFalse(registry.has(task.id));
  });

  it('removes a task when task is destroyed', function(){
    const task = createTask();
    registry.add(task);
    task.destroy();
    assert.isFalse(registry.has(task.id));
  });

  it('gets a task', function(){
    const task = createTask();
    registry.add(task);

    const storedTask = registry.get(task.id);

    assert.equal(task.id, storedTask?.id);
  });

  it('checks it has task by id', function(){
    const task = createTask();
    registry.add(task);
    assert.isTrue(registry.has(task.id));
  });

  it('checks it has task by id when task does not exist', function(){
    assert.isFalse(registry.has('invalid-id'));
  });

  it('returns all task', function(){
    registry.add(createTask());
    registry.add(createTask());
    registry.add(createTask());

    const tasks = registry.all();
    assert.lengthOf(tasks, 3);
  });

  it('kills all tasks', function() {
    registry.add(createTask());
    registry.add(createTask());
    registry.add(createTask());

    const tasks = registry.all();
    registry.killAll();

    tasks.forEach(t => {
      assert.equal(t.getStatus(), 'destroyed');
    })
  })
})

function createTask(): ScheduledTask {
  return new InlineScheduledTask('* * * * *', () => {});
}
