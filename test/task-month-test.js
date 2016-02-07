'use strict';

var expect = require('expect.js');
var Task = require('../src/task');

describe('Task', function(){
  describe('month', function(){
    it('should run a task on month', function(){
      var task = new Task('* * * * *', function(){
        this.executed += 1;
      });
      task.executed = 0;
      var date = new Date(2016, 1, 1);
      date.setMonth(0);
      task.update(date);
      date.setMonth(10);
      task.update(date);
      date.setMonth(12);
      task.update(date);
      expect(3).to.equal(task.executed);
    });

    it('should run only on month 9', function(){
      var task = new Task('* * * 9 *', function(){
        this.executed += 1;
      });
      task.executed = 0;
      var date = new Date(2016, 3, 1);
      date.setMonth(3);
      task.update(date);
      date.setMonth(8);
      task.update(date);
      date.setMonth(10);
      task.update(date);
      expect(1).to.equal(task.executed);
    });

    it('should run only on months 2, 4 and 6 ', function(){
      var task = new Task('* * * 2,4,6 *', function(){
        this.executed += 1;
      });
      task.executed = 0;
      var date = new Date(2016, 1, 1);
      date.setMonth(0);
      task.update(date);
      date.setMonth(1);
      task.update(date);
      date.setMonth(3);
      task.update(date);
      date.setMonth(5);
      task.update(date);
      date.setMonth(7);
      task.update(date);
      expect(3).to.equal(task.executed);
    });

    it('should run in even months', function(){
      var task = new Task('* * * */2 *', function(){
        this.executed += 1;
      });
      task.executed = 0;
      var date = new Date(2016, 1, 1);
      date.setMonth(1);
      task.update(date);
      date.setMonth(9);
      task.update(date);
      date.setMonth(8);
      task.update(date);
      expect(2).to.equal(task.executed);
    });

    it('should run on September', function(){
      var task = new Task('* * * Sep *', function(){
        this.executed += 1;
      });
      task.executed = 0;
      task.update(new Date(2016, 8, 1));
      expect(1).to.equal(task.executed);
    });
  });
});

