# Node Cron

[![npm](https://img.shields.io/npm/l/node-cron.svg)](https://github.com/node-cron/node-cron/blob/main/LICENSE.md)
[![npm](https://img.shields.io/npm/v/node-cron.svg)](https://img.shields.io/npm/v/node-cron.svg)
![NPM Downloads](https://img.shields.io/npm/dm/node-cron)
[![Coverage Status](https://coveralls.io/repos/github/node-cron/node-cron/badge.svg?branch=main)](https://coveralls.io/github/node-cron/node-cron?branch=main)

Job scheduling for Node.js with overlap prevention, distributed coordination, and background tasks. Schedule recurring tasks with cron expressions, prevent overlapping runs, coordinate across multiple instances, and run heavy jobs in isolated background processes. Zero dependencies, written in TypeScript.

### Full documentation: [nodecron.com](https://nodecron.com)

## Getting Started

```console
npm install node-cron
```

```javascript
import cron from 'node-cron';

cron.schedule('* * * * *', () => {
  console.log('running a task every minute');
});
```

## Overlap Prevention

Long-running tasks can overlap when the next tick fires before the previous run finishes. `noOverlap` skips a run instead of stacking them:

```javascript
cron.schedule('* * * * *', async () => {
  await slowJob();
}, { noOverlap: true });
```

## Distributed Coordination

Running multiple instances of your app? `distributed: true` ensures only one instance executes each scheduled fire. Out of the box it uses an env-var flag; for high availability, plug in a [Redis coordinator](https://nodecron.com/distributed-coordination):

```javascript
cron.schedule('0 3 * * *', runNightlyBackup, {
  name: 'nightly-backup',
  distributed: true,
});
```

## Background Tasks

Pass a file path instead of a function to run a job in an isolated forked process, so heavy work never blocks your event loop:

```javascript
cron.schedule('0 3 * * *', './tasks/backup.js');
```

## Runtime Control

Every task exposes a single consistent interface for control and inspection:

```javascript
const task = cron.schedule('0 3 * * *', doWork, {
  name: 'nightly-backup',
  timezone: 'America/Sao_Paulo',
});

task.stop();          // pause
task.start();         // resume
task.destroy();       // remove permanently
task.getStatus();     // 'stopped' | 'idle' | 'running' | 'destroyed'
task.getNextRun();    // next scheduled Date, or null
task.lastRun();       // { date, result } or { date, error }, or null
```

## Events

Tasks emit lifecycle events for observability:

```javascript
task.on('execution:finished', (ctx) => console.log('result:', ctx.execution?.result));
task.on('execution:failed', (ctx) => console.error('failed:', ctx.execution?.error));
task.on('execution:overlap', () => console.warn('skipped: previous run still active'));
task.on('execution:skipped', (ctx) => console.log('not elected:', ctx.reason));
```

All events: `task:started`, `task:stopped`, `task:destroyed`, `execution:started`, `execution:finished`, `execution:failed`, `execution:missed`, `execution:overlap`, `execution:maxReached`, `execution:skipped`. See [Events & Observability](https://nodecron.com/event-listening).

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
| day of week  | 0-7 (or names, 0 or 7 are Sunday; `2#3`, `5L`) |

Supports ranges (`1-5`), steps (`*/2`), lists (`1,15`), named months/weekdays, `L` (last day of month), `#` (nth weekday), and `<weekday>L` (last weekday of month). See the [Cron Syntax guide](https://nodecron.com/cron-syntax).

## When to Use node-cron

- Recurring jobs on a schedule (cron expressions with second-level precision)
- Overlap prevention for long-running tasks
- Coordinating scheduled tasks across multiple instances or replicas
- Running heavy jobs in isolated background processes
- Runtime control: start, stop, inspect, and observe tasks programmatically

## When to Consider Something Else

- **Durable job queues with retries and priorities**: use [BullMQ](https://bullmq.io), [Agenda](https://github.com/agenda/agenda), or [Sidequest](https://sidequestjs.com)
- **Persistent workflow orchestration**: use [Temporal](https://temporal.io) or [Inngest](https://inngest.com)
- **Exactly-once guarantees across crashes**: node-cron coordinates but does not persist state to a database; a queue or workflow engine is a better fit

## Options

```javascript
cron.schedule('0 3 * * *', task, {
  name: 'nightly-backup',
  timezone: 'America/Sao_Paulo',
  noOverlap: true,
  distributed: true,
  maxExecutions: 10,
  maxRandomDelay: 30000,
});
```

See [Scheduling Options](https://nodecron.com/scheduling-options) for the full list.

## Migrating from v3

v4 is a TypeScript rewrite with a smarter scheduler and a streamlined API. See the [Migration Guide](https://nodecron.com/migrating-from-v3).

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
