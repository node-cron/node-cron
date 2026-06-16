# Node Cron

[![npm](https://img.shields.io/npm/l/node-cron.svg)](https://github.com/merencia/node-cron/blob/master/LICENSE.md)
[![npm](https://img.shields.io/npm/v/node-cron.svg)](https://img.shields.io/npm/v/node-cron.svg)
![NPM Downloads](https://img.shields.io/npm/dm/node-cron)
[![Coverage Status](https://coveralls.io/repos/github/node-cron/node-cron/badge.svg?branch=main)](https://coveralls.io/github/node-cron/node-cron?branch=main)

The node-cron module is tiny task scheduler in pure JavaScript for node.js based on [GNU crontab](https://www.gnu.org/software/mcron/manual/html_node/Crontab-file.html). This module allows you to schedule task in node.js using full crontab syntax.

### [Node-Cron Documentation](http://nodecron.com)

## Getting Started

Install node-cron using npm:

```console
npm install --save node-cron
```

Import node-cron and schedule a task:

- commonjs

```javascript
const cron = require('node-cron');

cron.schedule('* * * * *', () => {
  console.log('running a task every minute');
});
```

- es6 (module)

```javascript
import cron from 'node-cron';

cron.schedule('* * * * *', () => {
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

| field        | value                             |
| ------------ | --------------------------------- |
| second       | 0-59                              |
| minute       | 0-59                              |
| hour         | 0-23                              |
| day of month | 1-31                              |
| month        | 1-12 (or names)                   |
| day of week  | 0-7 (or names, 0 or 7 are sunday) |


## Issues

Feel free to submit issues and enhancement requests [here](https://github.com/merencia/node-cron/issues).

## Contributing

In general, we follow the "fork-and-pull" Git workflow.

- Fork the repo on GitHub;
- Commit changes to a branch in your fork;
- Pull request "upstream" with your changes;

NOTE: Be sure to merge the latest from "upstream" before making a pull request!

Please do not contribute code you did not write yourself, unless you are certain you have the legal ability to do so. Also ensure all contributed code can be distributed under the ISC License.

## Contributors

This project exists thanks to all the people who contribute. 
<a href="https://github.com/node-cron/node-cron/graphs/contributors"><img src="https://opencollective.com/node-cron/contributors.svg?width=890&button=false" /></a>


## Backers

Thank you to all our backers! 🙏 [[Become a backer](https://opencollective.com/node-cron#backer)]

<a href="https://opencollective.com/node-cron#backers" target="_blank"><img src="https://opencollective.com/node-cron/backers.svg?width=890"></a>

## Sponsors

Support this project by becoming a sponsor. Your logo will show up here with a link to your website. [[Become a sponsor](https://opencollective.com/node-cron#sponsor)]

<a href="https://opencollective.com/node-cron/sponsor/0/website" target="_blank"><img src="https://opencollective.com/node-cron/sponsor/0/avatar.svg"></a>
<a href="https://opencollective.com/node-cron/sponsor/1/website" target="_blank"><img src="https://opencollective.com/node-cron/sponsor/1/avatar.svg"></a>
<a href="https://opencollective.com/node-cron/sponsor/2/website" target="_blank"><img src="https://opencollective.com/node-cron/sponsor/2/avatar.svg"></a>
<a href="https://opencollective.com/node-cron/sponsor/3/website" target="_blank"><img src="https://opencollective.com/node-cron/sponsor/3/avatar.svg"></a>
<a href="https://opencollective.com/node-cron/sponsor/4/website" target="_blank"><img src="https://opencollective.com/node-cron/sponsor/4/avatar.svg"></a>
<a href="https://opencollective.com/node-cron/sponsor/5/website" target="_blank"><img src="https://opencollective.com/node-cron/sponsor/5/avatar.svg"></a>
<a href="https://opencollective.com/node-cron/sponsor/6/website" target="_blank"><img src="https://opencollective.com/node-cron/sponsor/6/avatar.svg"></a>
<a href="https://opencollective.com/node-cron/sponsor/7/website" target="_blank"><img src="https://opencollective.com/node-cron/sponsor/7/avatar.svg"></a>
<a href="https://opencollective.com/node-cron/sponsor/8/website" target="_blank"><img src="https://opencollective.com/node-cron/sponsor/8/avatar.svg"></a>
<a href="https://opencollective.com/node-cron/sponsor/9/website" target="_blank"><img src="https://opencollective.com/node-cron/sponsor/9/avatar.svg"></a>

## License

node-cron is under [ISC License](https://github.com/merencia/node-cron/blob/master/LICENSE.md).
