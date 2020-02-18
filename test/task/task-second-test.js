'use strict';

var expect = require('expect.js');
var Task = require('../../src/task');

describe('Task', () => {
  describe('second', () => {
    it('should run a task on second', () => {
      let executed = 0;
      var task = new Task('* * * * * *', () => {
        executed += 1;
      });
      var date = new Date(2016, 1, 1);
      date.setSeconds(0);
      task.update(date);
      date.setSeconds(15);
      task.update(date);
      date.setSeconds(50);
      task.update(date);
      expect(3).to.equal(executed);
    });

    it('should run only on second 33', () => {
      let executed = 0;
      var task = new Task('33 * * * * *', () => {
        executed += 1;
      });
      var date = new Date(2016, 1, 1);
      date.setSeconds(3);
      task.update(date);
      date.setSeconds(33);
      task.update(date);
      date.setSeconds(32);
      task.update(date);
      expect(1).to.equal(executed);
    });

    it('should run only on seconds 20, 30 and 40 ', () => {
      let executed = 0;
      var task = new Task('20,30,40 * * * * *', () => {
        executed += 1;
      });
      var date = new Date(2016, 1, 1);
      date.setSeconds(20);
      task.update(date);
      date.setSeconds(30);
      task.update(date);
      date.setSeconds(33);
      task.update(date);
      date.setSeconds(40);
      task.update(date);
      date.setSeconds(50);
      task.update(date);
      expect(3).to.equal(executed);
    });

    it('should run in even seconds', () => {
      let executed = 0;
      var task = new Task('*/2 * * * * *', () => {
        executed += 1;
      });
      var date = new Date(2016, 1, 1);
      date.setSeconds(0);
      task.update(date);
      date.setSeconds(15);
      task.update(date);
      date.setSeconds(50);
      task.update(date);
      expect(2).to.equal(executed);
    });
  });
});

