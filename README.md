# Node Cron

[![npm version](https://img.shields.io/npm/v/node-cron.svg?color=2f9d5f)](https://www.npmjs.com/package/node-cron)
[![npm downloads](https://img.shields.io/npm/dm/node-cron.svg?color=2f9d5f)](https://www.npmjs.com/package/node-cron)
[![used by](https://img.shields.io/badge/used%20by-220k%2B%20repos-2f9d5f)](https://github.com/node-cron/node-cron/network/dependents)
[![coverage](https://coveralls.io/repos/github/node-cron/node-cron/badge.svg?branch=main)](https://coveralls.io/github/node-cron/node-cron?branch=main)
[![zero dependencies](https://img.shields.io/badge/dependencies-0-2f9d5f)](https://www.npmjs.com/package/node-cron?activeTab=dependencies)
[![license](https://img.shields.io/npm/l/node-cron.svg?color=2f9d5f)](https://github.com/node-cron/node-cron/blob/main/LICENSE.md)
[![sponsor](https://img.shields.io/badge/%E2%9D%A4%20sponsor-2f9d5f)](https://github.com/sponsors/node-cron)

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

> **Bundlers:** background tasks fork a helper that node-cron resolves relative to its own files in `node_modules`. If you bundle your app (esbuild, webpack, Rollup, etc.), mark node-cron as external so it stays on disk (`--external:node-cron`, or `externals: ['node-cron']` in webpack). Otherwise the fork fails with `Cannot find module '.../daemon.js'`. Inline function tasks are unaffected.

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
task.on('task:failed', () => task.start()); // background task's daemon died unexpectedly (crash, OOM-kill); restart manually
```

All events: `task:started`, `task:stopped`, `task:destroyed`, `task:failed`, `execution:started`, `execution:finished`, `execution:failed`, `execution:missed`, `execution:overlap`, `execution:maxReached`, `execution:skipped`. See [Events & Observability](https://nodecron.com/event-listening).

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
| day of month | 1-31 (or `L` for the last day; `L-3` offset from last; `15W`, `LW` for nearest weekday) |
| month        | 1-12 (or names)                   |
| day of week  | 0-7 (or names, 0 or 7 are Sunday; `2#3`, `5L`) |

Supports ranges (`1-5`), steps (`*/2`), lists (`1,15`), named months/weekdays, `L` (last day of month), `L-n` (offset from the last day), `#` (nth weekday), `<weekday>L` (last weekday of month), `W` (nearest weekday), and `?` (alias for `*` in the day fields, for Quartz-style expressions). See the [Cron Syntax guide](https://nodecron.com/cron-syntax).

An inverted range wraps around the field instead of being rejected: `22-2` in the hour field means 22:00 through 02:59 (22,23,0,1,2), and `sat-sun` in the day-of-week field means saturday,sunday.

The `W` modifier in the day-of-month field fires on the nearest weekday (Monday-Friday) to a given day, without crossing the month boundary: `15W` is the nearest weekday to the 15th, `1W` the first weekday of the month, and `LW` the last weekday of the month. Only weekends are adjusted for; **there is no holiday awareness**.

The `L-n` form fires `n` days before the last day of the month (`L-3` is the third-to-last day). In months where the offset reaches before the 1st (e.g. `L-29` in February), it simply does not fire that month.

> **Note on Quartz:** `L`, `L-n`, `W`, `LW`, `#`, `<weekday>L` and `?` are borrowed from [Quartz](https://www.quartz-scheduler.org/), but node-cron is **not** Quartz-compatible. Two differences matter:
> - **Day-of-week numbering** is standard cron, not Quartz: `0-7` with `0`/`7` = Sunday and `1` = Monday. In Quartz `1` = Sunday, so the same numeric weekday fires on a different day.
> - **day-of-month and day-of-week** are combined with **AND** (both must match), and may both be set; Quartz instead treats them as mutually exclusive and requires `?` in one of them.
>
> `?` is accepted purely as an alias for `*` in the day fields so Quartz-style expressions parse, not as a semantic compatibility guarantee.

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

## Timezones and DST

Schedules match wall-clock time in the task's `timezone`. Across a daylight-saving fall-back the repeated hour runs once, so a sub-hourly schedule (for example `*/15`) can pause for up to the length of the DST shift during that hour. If you need a fixed interval to keep firing uninterrupted across DST transitions, use a zone without DST, for example `timezone: 'UTC'`. See [Timezones & DST](https://nodecron.com/timezones-and-dst) for the full model.

## Migrating from v3

v4 is a TypeScript rewrite with a smarter scheduler and a streamlined API. See the [Migration Guide](https://nodecron.com/migrating-from-v3).

## Sponsors

node-cron is zero-dependency infrastructure used in production by 220,000+ repositories. If it is part of your stack, sponsoring helps keep it tested, DST-correct, and maintained.

<!-- sponsors:begin -->
<!-- auto-generated from sponsors.tpl.md by @goreleaser/sponsors, do not edit by hand -->
<div align="center">
  <p><strong>Silver sponsors</strong><br/> <a href="https://easysaas.at" target="_blank" rel="noopener sponsored"><img src="https://avatars.githubusercontent.com/u/24415042?s=64&v=4" alt="easySAAS" height="52"/></a>
  </p>
</div>

<!-- sponsors:end -->

Become a sponsor on [**GitHub Sponsors**](https://github.com/sponsors/node-cron) or [**Open Collective**](https://opencollective.com/node-cron).

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
