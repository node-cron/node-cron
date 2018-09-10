'use strict';

var expect = require('expect.js');
var Task = require('../../src/task');

describe('Task', () => {
  describe('day of day', () => {
    it('should run on day', () => {
      var task = new Task('* * * * *', () => {
        this.executed += 1;
      });
      task.executed = 0;
      var date = new Date(2016, 1, 1);
      date.setDate(0);
      task.update(date);
      date.setDate(15);
      task.update(date);
      date.setDate(50);
      task.update(date);
      expect(3).to.equal(task.executed);
    });

    it('should run only on day 9', () => {
      var task = new Task('* * 9 * *', () => {
        this.executed += 1;
      });
      task.executed = 0;
      var date = new Date(2016, 1, 1);
      date.setDate(3);
      task.update(date);
      date.setDate(9);
      task.update(date);
      date.setDate(11);
      task.update(date);
      expect(1).to.equal(task.executed);
    });

    it('should run only on day 4, 6 and 12 ', () => {
      var task = new Task('* * 4,6,12 * *', () => {
        this.executed += 1;
      });
      task.executed = 0;
      var date = new Date(2016, 1, 1);
      date.setDate(1);
      task.update(date);
      date.setDate(4);
      task.update(date);
      date.setDate(6);
      task.update(date);
      date.setDate(8);
      task.update(date);
      date.setDate(12);
      task.update(date);
      expect(3).to.equal(task.executed);
    });

    it('should run in even day', () => {
      var task = new Task('* * */2 * *', () => {
        this.executed += 1;
      });
      task.executed = 0;
      var date = new Date(2016, 1, 1);
      date.setDate(2);
      task.update(date);
      date.setDate(15);
      task.update(date);
      date.setDate(20);
      task.update(date);
      expect(2).to.equal(task.executed);
    });
  });
});

