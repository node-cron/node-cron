# Node Cron

[![npm](https://img.shields.io/npm/l/node-cron.svg)](https://github.com/merencia/node-cron/blob/master/LICENSE.md)
[![npm](https://img.shields.io/npm/v/node-cron.svg)](https://img.shields.io/npm/v/node-cron.svg)
[![Coverage Status](https://coveralls.io/repos/github/merencia/node-cron/badge.svg?branch=master)](https://coveralls.io/github/merencia/node-cron?branch=master)
[![Code Climate](https://codeclimate.com/github/merencia/node-cron/badges/gpa.svg)](https://codeclimate.com/github/merencia/node-cron)
[![Build Status](https://travis-ci.org/merencia/node-cron.svg?branch=master)](https://travis-ci.org/merencia/node-cron)
[![Dependency Status](https://david-dm.org/merencia/node-cron.svg)](https://david-dm.org/merencia/node-cron)
[![devDependency Status](https://david-dm.org/merencia/node-cron/dev-status.svg)](https://david-dm.org/merencia/node-cron#info=devDependencies)

The node-cron module is tiny task scheduler in pure JavaScript for node.js based on [GNU crontab](https://www.gnu.org/software/mcron/manual/html_node/Crontab-file.html). This module allows you to schedule task in node.js using full crontab syntax.


## Getting Started

Install node-cron using npm:

```console
$ npm install --save node-cron
```

Import node-cron and schedule a task:

```javascript
var cron = require('node-cron');

cron.schedule('* * * * *', function(){
  console.log('running a task every minute');
});
```

## Cron Syntax

This is a quick reference to cron syntax and also shows the options supported by node-cron.

### Allowed fields

```
 # ┌────────────── second (optional)
 # │ ┌──────────── minute
 # │ │ ┌────────── hour
 # │ │ │ ┌──────── day of month
 # │ │ │ │ ┌────── month
 # │ │ │ │ │ ┌──── day of week
 # │ │ │ │ │ │
 # │ │ │ │ │ │
 # * * * * * *
```

### Allowed values

|     field    |        value        |
|--------------|---------------------|
|    second    |         0-59        |
|    minute    |         0-59        |
|     hour     |         0-23        |
| day of month |         1-31        |
|     month    |     1-12 (or names) |
|  day of week |     0-7 (or names, 0 or 7 are sunday)  |


#### Using multiples values

You may use multiples values separated by comma:

```javascript
var cron = require('node-cron');

cron.schedule('1,2,4,5 * * * *', function(){
  console.log('running every minute 1, 2, 4 and 5');
});
```

#### Using ranges

You may also define a range of values:

```javascript
var cron = require('node-cron');

cron.schedule('1-5 * * * *', function(){
  console.log('running every minute to 1 from 5');
});
```

#### Using step values

Step values can be used in conjunction with ranges, following a range with '/' and a number. e.g: `1-10/2` that is the same as `2,4,6,8,10`. Steps are also permitted after an asterisk, so if you want to say “every two minutes”, just use `*/2`.

```javascript
var cron = require('node-cron');

cron.schedule('*/2 * * * *', function(){
  console.log('running a task every two minutes');
});
```

#### Using names

For month and week day you also may use names or short names. e.g:

```javascript
var cron = require('node-cron');

cron.schedule('* * * January,September Sunday', function(){
  console.log('running on Sundays of January and September');
});
```

Or with short names:

```javascript
var cron = require('node-cron');

cron.schedule('* * * Jan,Sep Sun', function(){
  console.log('running on Sundays of January and September');
});
```

## Cron methods

### Schedule

Schedules given task to be executed whenever the cron expression ticks.

Arguments:

- !string expression - Cron expression
- !Function func - Task to be executed
- boolean? immediateStart - Whether to start scheduler immediately after create.

## ScheduledTask methods

### Start

Starts the scheduled task.

```javascript
var cron = require('node-cron');

var task = cron.schedule('* * * * *', function() {
  console.log('immediately started');
}, false);

task.start();
```

### Stop

The task won't be executed unless re-started.

```javascript
var cron = require('node-cron');

var task = cron.schedule('* * * * *', function() {
  console.log('will execute every minute until stopped');
});

task.stop();
```

### Destroy

The task will be stopped and completely destroyed.

```javascript
var cron = require('node-cron');

var task = cron.schedule('* * * * *', function() {
  console.log('will not execute anymore, nor be able to restart');
});

task.destroy();
```

## Issues

Feel free to submit issues and enhancement requests [here](https://github.com/merencia/node-cron/issues).

## Contributors

In general, we follow the "fork-and-pull" Git workflow.

 - Fork the repo on GitHub;
 - Commit changes to a branch in your fork;
 - Pull request "upstream" with your changes;

NOTE: Be sure to merge the latest from "upstream" before making a pull request!

Please do not contribute code you did not write yourself, unless you are certain you have the legal ability to do so. Also ensure all contributed code can be distributed under the ISC License.

## License

node-cron is under [ISC License](https://github.com/merencia/node-cron/blob/master/LICENSE.md).
