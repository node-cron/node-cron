import { assert } from 'chai';
import { InlineScheduledTask } from './inline-scheduled-task';

describe('InlineScheduledTask', function() {
  it('should be build with default values', function(){
    const task = new InlineScheduledTask('* * * * * *', ()=> {});

   assert.isTrue(task.id.startsWith('task-'));
   assert.equal(task.id, task.name);
   assert.isDefined(task.runner);
   assert.equal(task.getStatus(), 'stopped')
  })
})