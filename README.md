# Node Cron

[![npm](https://img.shields.io/npm/l/node-cron.svg)](https://github.com/node-cron/node-cron/blob/main/LICENSE.md)
[![npm](https://img.shields.io/npm/v/node-cron.svg)](https://img.shields.io/npm/v/node-cron.svg)
![NPM Downloads](https://img.shields.io/npm/dm/node-cron)
[![Coverage Status](https://coveralls.io/repos/github/node-cron/node-cron/badge.svg?branch=main)](https://coveralls.io/github/node-cron/node-cron?branch=main)

node-cron is a tiny, zero-dependency task scheduler for Node.js, written in TypeScript and based on [GNU crontab](https://www.gnu.org/software/mcron/manual/html_node/Crontab-file.html). It lets you schedule tasks using full cron syntax, and scale them up to timezones, background processes, lifecycle events, and custom logging when you need to.

### 📚 Full documentation: [nodecron.com](https://nodecron.com)

## Getting Started

Install node-cron using npm:

```console
npm install node-cron
```

Import node-cron and schedule a task:

- ES Modules

```javascript
import cron from 'node-cron';

cron.schedule('* * * * *', () => {
  console.log('running a task every minute');
});
```

- CommonJS

```javascript
const cron = require('node-cron');

cron.schedule('* * * * *', () => {
  console.log('running a task every minute');
});
```

`schedule` returns a `ScheduledTask` you can control at runtime:

```javascript
const task = cron.schedule('* * * * *', () => {});

task.stop();    // pause
task.start();   // resume
task.destroy(); // remove permanently
task.getStatus(); // 'stopped' | 'idle' | 'running' | 'destroyed'
```

Need a task that doesn't start immediately? Use `cron.createTask(...)` and call `task.start()` yourself.

## Cron Syntax

```
 # ┌────────────── second (optional)
 # │ ┌──────────── minute
 # │ │ ┌────────── hour
 # │ │ │ ┌──────── day of month
 # │ │ │ │ ┌────── month
 # │ │ │ │ │ ┌──── day of week
 # │ │ │ │ │ │
 # * * * * * *
```

| field        | value                             |
| ------------ | --------------------------------- |
| second       | 0-59 (optional)                   |
| minute       | 0-59                              |
| hour         | 0-23                              |
| day of month | 1-31 (or `L` for the last day)    |
| month        | 1-12 (or names)                   |
| day of week  | 0-7 (or names, 0 or 7 are sunday) |

See the [Cron Syntax guide](https://nodecron.com/cron-syntax) for ranges, steps, lists, named months/weekdays, and the `L` (last day of month) token.

## Options

Pass an options object as the third argument to tune behavior:

```javascript
cron.schedule('0 3 * * *', task, {
  name: 'nightly-backup',     // human-readable identifier
  timezone: 'America/Sao_Paulo',
  noOverlap: true,            // skip a run if the previous one is still going
  maxExecutions: 10,          // destroy the task after N runs
  maxRandomDelay: 30000,      // jitter (ms) added before each run
  onError: (err, ctx) => {    // called when a run throws (alongside the event)
    console.error(err);
  },
});
```

`onError` fires in addition to the `execution:failed` event (it does not replace
it) and receives the error plus the execution context. Errors thrown by the
callback are swallowed so they cannot crash the scheduler. For background tasks
the callback runs in the parent process, mirroring how `logger` is handled.

See [Scheduling Options](https://nodecron.com/scheduling-options) for the full list.

## Events

Tasks emit lifecycle events you can subscribe to with `.on()`, `.once()`, and `.off()`:

```javascript
const task = cron.schedule('* * * * *', async () => doWork());

task.on('execution:finished', (ctx) => console.log('result:', ctx.execution?.result));
task.on('execution:failed', (ctx) => console.error('failed:', ctx.execution?.error));
```

Available events: `task:started`, `task:stopped`, `task:destroyed`, `execution:started`, `execution:finished`, `execution:failed`, `execution:missed`, `execution:overlap`, `execution:maxReached`. See [Events & Observability](https://nodecron.com/event-listening).

## Background Tasks

Pass a file path instead of a function to run a job in an isolated forked process, ideal for heavy work that would otherwise block the event loop:

```javascript
// tasks/backup.js
export function task() { /* ... */ }

// app.js
cron.schedule('0 3 * * *', './tasks/backup.js');
```

See [Background Tasks](https://nodecron.com/background-tasks).

## Migrating from v3

v4 is a TypeScript rewrite with a smarter scheduler and a streamlined API (the `scheduled` and `runOnInit` options were removed; event names changed). See the [Migration Guide](https://nodecron.com/migrating-from-v3).

## Issues

Feel free to submit issues and enhancement requests [here](https://github.com/node-cron/node-cron/issues).

## Contributing

In general, we follow the "fork-and-pull" Git workflow.

- Fork the repo on GitHub;
- Commit changes to a branch in your fork;
- Pull request "upstream" with your changes;

NOTE: Be sure to merge the latest from "upstream" before making a pull request!

Please do not contribute code you did not write yourself, unless you are certain you have the legal ability to do so. Also ensure all contributed code can be distributed under the ISC License.

## License

node-cron is under [ISC License](https://github.com/node-cron/node-cron/blob/main/LICENSE.md).
