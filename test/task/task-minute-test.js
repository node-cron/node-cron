'use strict';

var expect = require('expect.js');
var Task = require('../../src/task');

describe('Task', () => {
  describe('minute', () => {
    it('should run a task on minute', () => {
      var task = new Task('* * * * *', () => {
        this.executed += 1;
      });
      task.executed = 0;
      var date = new Date(2016, 1, 1);
      date.setMinutes(0);
      task.update(date);
      date.setMinutes(15);
      task.update(date);
      date.setMinutes(50);
      task.update(date);
      expect(3).to.equal(task.executed);
    });

    it('should run only on minute 33', () => {
      var task = new Task('33 * * * *', () => {
        this.executed += 1;
      });
      task.executed = 0;
      var date = new Date(2016, 1, 1);
      date.setMinutes(3);
      task.update(date);
      date.setMinutes(33);
      task.update(date);
      date.setMinutes(32);
      task.update(date);
      expect(1).to.equal(task.executed);
    });

    it('should run only on minutes 20, 30 and 40 ', () => {
      var task = new Task('20,30,40 * * * *', () => {
        this.executed += 1;
      });
      task.executed = 0;
      var date = new Date(2016, 1, 1);
      date.setMinutes(20);
      task.update(date);
      date.setMinutes(30);
      task.update(date);
      date.setMinutes(33);
      task.update(date);
      date.setMinutes(40);
      task.update(date);
      date.setMinutes(50);
      task.update(date);
      expect(3).to.equal(task.executed);
    });

    it('should run in even minutes', () => {
      var task = new Task('*/2 * * * *', () => {
        this.executed += 1;
      });
      task.executed = 0;
      var date = new Date(2016, 1, 1);
      date.setMinutes(0);
      task.update(date);
      date.setMinutes(15);
      task.update(date);
      date.setMinutes(50);
      task.update(date);
      expect(2).to.equal(task.executed);
    });
  });
});

