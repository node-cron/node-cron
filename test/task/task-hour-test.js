'use strict';

var expect = require('expect.js');
var Task = require('../../src/task');

describe('Task', function(){
  describe('hour', function(){
    it('should run a task on hour', function(){
      var task = new Task('* * * * *', function(){
        this.executed += 1;
      });
      task.executed = 0;
      var date = new Date(2016, 1, 1);
      date.setHours(0);
      task.update(date);
      date.setHours(15);
      task.update(date);
      date.setHours(50);
      task.update(date);
      expect(3).to.equal(task.executed);
    });

    it('should run only on hour 12', function(){
      var task = new Task('0 12 * * *', function(){
        this.executed += 1;
      });
      task.executed = 0;
      var date = new Date(2016, 1, 1);
      date.setHours(3);
      task.update(date);
      date.setHours(12);
      task.update(date);
      date.setHours(15);
      task.update(date);
      expect(1).to.equal(task.executed);
    });

    it('should run only on hours 20, 30 and 40 ', function(){
      var task = new Task('0 5,10,20 * * *', function(){
        this.executed += 1;
      });
      task.executed = 0;
      var date = new Date(2016, 1, 1);
      date.setHours(5);
      task.update(date);
      date.setHours(10);
      task.update(date);
      date.setHours(13);
      task.update(date);
      date.setHours(20);
      task.update(date);
      date.setHours(22);
      task.update(date);
      expect(3).to.equal(task.executed);
    });

    it('should run in even hours', function(){
      var task = new Task('* */2 * * *', function(){
        this.executed += 1;
      });
      task.executed = 0;
      var date = new Date(2016, 1, 1);
      date.setHours(0);
      task.update(date);
      date.setHours(15);
      task.update(date);
      date.setHours(50);
      task.update(date);
      expect(2).to.equal(task.executed);
    });

    it('should run every hour on range', function(){
      var task = new Task('* 8-20 * * *', function(){
        this.executed += 1;
      });
      task.executed = 0;
      var date = new Date(2016, 1, 1);
      date.setHours(0);
      task.update(date);
      date.setHours(8);
      task.update(date);
      date.setHours(19);
      task.update(date);
      date.setHours(21);
      task.update(date);
      expect(2).to.equal(task.executed);
    });
  });
});

