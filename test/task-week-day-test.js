'use strict';

var expect = require('expect.js');
var Task = require('../src/task');

describe('Task', function(){
  describe('week day', function(){
    it('should run on week day', function(){
      var task = new Task('* * * * *', function(){
        this.executed += 1;
      });
      task.executed = 0;
      var date = new Date(2016, 0, 1);
      date.setDate(4);
      task.update(date);
      date.setDate(5);
      task.update(date);
      date.setDate(6);
      task.update(date);
      expect(3).to.equal(task.executed);
    });

    it('should run only on week day 3', function(){
      var task = new Task('* * * * 3', function(){
        this.executed += 1;
      });
      task.executed = 0;
      var date = new Date(2016, 0, 1);
      date.setDate(5);
      task.update(date);
      date.setDate(6);
      task.update(date);
      date.setDate(9);
      task.update(date);
      expect(1).to.equal(task.executed);
    });

    it('should run only on week days 2, 3 and 5 ', function(){
      var task = new Task('* * * * 2,3,5', function(){
        this.executed += 1;
      });
      task.executed = 0;
      var date = new Date(2016, 0, 1);
      date.setDate(4);
      task.update(date);
      date.setDate(5);
      task.update(date);
      date.setDate(6);
      task.update(date);
      date.setDate(7);
      task.update(date);
      date.setDate(8);
      task.update(date);
      expect(3).to.equal(task.executed);
    });

    it('should run in even week days', function(){
      var task = new Task('* * * * */2', function(){
        this.executed += 1;
      });
      task.executed = 0;
      var date = new Date(2016, 0, 1);
      date.setDate(4);
      task.update(date);
      date.setDate(5);
      task.update(date);
      date.setDate(7);
      task.update(date);
      expect(2).to.equal(task.executed);
    });

    it('should run on monday', function(){
      var task = new Task('* * * * Monday', function(){
        this.executed += 1;
      });
      task.executed = 0;
      task.update(new Date(2016, 0, 4));
      expect(1).to.equal(task.executed);
    });
  });
});

