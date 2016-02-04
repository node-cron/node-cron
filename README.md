# Node Cron

[![Coverage Status](https://coveralls.io/repos/github/merencia/node-cron/badge.svg?branch=master)](https://coveralls.io/github/merencia/node-cron?branch=master)
[![Dependency Status](https://david-dm.org/merencia/node-cron.svg)](https://david-dm.org/merencia/node-cron)
[![devDependency Status](https://david-dm.org/merencia/node-cron/dev-status.svg)](https://david-dm.org/merencia/node-cron#info=devDependencies)
[![Build Status](https://travis-ci.org/merencia/node-cron.svg?branch=master)](https://travis-ci.org/merencia/node-cron)


The node-cron module is tiny task scheduler in pure JavaScrip for node.js based on GNU crontab. Besides, node-cron wont stop your node.js application if your task throw an exception, rather than it going to try run your task again in the next time occurrence.
## Getting Started 

Install node-cron using npm:

```sh

$ npm install --save node-cron
```

Import node-cron and schedule a task:

```javascript

var cron = require('node-cron');

cron.schedule('* * * * *', function(){
  console.log('running a task in every minute');
});
```

## Quick Cron Reference

```

 # ┌───────────── min (0 - 59)
 # │ ┌────────────── hour (0 - 23)
 # │ │ ┌─────────────── day of month (1 - 31)
 # │ │ │ ┌──────────────── month (1 - 12)
 # │ │ │ │ ┌───────────────── day of week (0 - 6) (0 to 6 are Sunday to Saturday)
 # │ │ │ │ │
 # │ │ │ │ │
 # * * * * *
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
