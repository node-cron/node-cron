'use strict';

var expect = require('expect.js');
var Task = require('../../src/task');

describe('Task', () => {
  describe('hour', () => {
    it('should run a task on hour', () => {
      let executed = 0;
      var task = new Task('* * * * *', () => {
        executed += 1;
      });
      var date = new Date(2016, 1, 1);
      date.setHours(0);
      task.update(date);
      date.setHours(15);
      task.update(date);
      date.setHours(50);
      task.update(date);
      expect(3).to.equal(executed);
    });

    it('should run only on hour 12', () => {
      let executed = 0;
      var task = new Task('0 12 * * *', () => {
        executed += 1;
      });
      var date = new Date(2016, 1, 1);
      date.setHours(3);
      task.update(date);
      date.setHours(12);
      task.update(date);
      date.setHours(15);
      task.update(date);
      expect(1).to.equal(executed);
    });

    it('should run only on hours 20, 30 and 40 ', () => {
      let executed = 0;
      var task = new Task('0 5,10,20 * * *', () => {
        executed += 1;
      });
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
      expect(3).to.equal(executed);
    });

    it('should run in even hours', () => {
      let executed = 0;
      var task = new Task('* */2 * * *', () => {
        executed += 1;
      });
      var date = new Date(2016, 1, 1);
      date.setHours(0);
      task.update(date);
      date.setHours(15);
      task.update(date);
      date.setHours(50);
      task.update(date);
      expect(2).to.equal(executed);
    });

    it('should run every hour on range', () => {
      let executed = 0;
      var task = new Task('* 8-20 * * *', () => {
        executed += 1;
      });
      var date = new Date(2016, 1, 1);
      date.setHours(0);
      task.update(date);
      date.setHours(8);
      task.update(date);
      date.setHours(19);
      task.update(date);
      date.setHours(21);
      task.update(date);
      expect(2).to.equal(executed);
    });
  });
});

