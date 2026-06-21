# Changelog

All notable changes to this project are documented here. The format is based on
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project
follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [4.5.0] - 2026-06-21

### Added
- **`lastRun()`** introspection getter on `ScheduledTask`: returns `{ date, result }` after
  a successful execution, `{ date, error }` after a failed one, or `null` before the first
  run. ([#557])
- **Extended day-of-week tokens**: `<weekday>#<nth>` (nth weekday of the month, e.g.
  `1#1` for the first Monday) and `<weekday>L` (last weekday of the month, e.g. `5L`
  for the last Friday). ([#560])

### Performance
- Cache `Intl.DateTimeFormat` instances per timezone instead of rebuilding on every
  call. ([#561])
- Parse the cron expression once per `TimeMatcher` instead of re-parsing in
  `MatcherWalker`. ([#562])
- Compute the GMT offset lazily (only when formatting ISO strings, not during the
  next-run search). ([#563])
- Replace `crypto.randomBytes` with `crypto.randomUUID` for internal ID
  generation. ([#564])
- Skip `setTimeout` jitter wrapper when `maxRandomDelay` is zero. ([#565])
- Bundle dist into flat files instead of preserving the module tree (reduces import
  time). ([#566])

### Fixed
- Flaky `should schedule a task` test: poll for the first execution instead of
  asserting an exact count after a fixed sleep.

### Changed
- Renamed internal functions `interprete` to `interpret` and
  `appendSeccondExpression` to `appendSecondExpression`. ([#567])
- Rewritten README and package metadata to surface scheduling capabilities
  (overlap prevention, distributed coordination, background tasks). ([#568])

## [4.4.1] - 2026-06-18

### Changed
- Renamed the `distributedTtl` option to **`distributedLease`** (same meaning:
  the safety lease, in ms, for lease-based coordinators). The old name was the
  only abbreviation in the options API; the new one groups with `distributed`.
  `distributedTtl` was introduced in 4.4.0 and is removed without an alias.

## [4.4.0] - 2026-06-17

### Added
- **Task introspection** on `ScheduledTask`: `getNextRuns(n)` (preview the next N
  run times), `match(date)`, `msToNext()`, `isBusy()`, `runsLeft()` and
  `getPattern()`. ([#547])
- **`cron.parse(expression)`** and **`cron.validateDetailed(expression)`**:
  decompose an expression into its fields, or get every field-level problem
  (without throwing) for tooling and richer error messages. ([#548])
- **Distributed run coordination** — opt-in `distributed: true` runs a task on a
  single instance per fire across a fleet. Ships a built-in `NODE_CRON_RUN`
  env-var default (one designated runner, no dependencies) and a pluggable
  `RunCoordinator` (via `setRunCoordinator`, or the per-task `runCoordinator`
  option) for high-availability, per-fire coordination (e.g. a Redis lock).
  Adds the `distributedTtl` option and an `execution:skipped` event carrying a
  `reason` (`'not-elected'` | `'coordinator-error'`). Works for inline and
  background tasks. ([#549])

### Fixed
- `getNextMatch` no longer scans every time of day on a day that matches the
  day-of-month but not the weekday. A dense expression constrained by both
  (e.g. `* * * 15 * 1`) could take minutes to resolve; it is now instant.

### Changed
- Internal-only cleanups (no public API change): fixed the `milisecond` →
  `millisecond` spelling and the `convertion/` → `conversion/` directory name.

## [4.3.0] - 2026-06-17

### Added
- **`L` (last day of month)** in the day-of-month field — e.g. `0 0 12 L * *`,
  leap-year aware and combinable with explicit days (`15,L`). ([#147])
- **`missedExecutionTolerance`** option (ms, default `1000`): a heartbeat that
  wakes a little late still runs its slot instead of being reported as missed.
  Always capped to the gap to the next slot, so it can never run a slot twice.
  ([#485])
- **`startTimeout`** option for background tasks (ms, default `5000`). ([#535])

### Fixed
- DST correctness in `getNextMatch`: no more ~1-year overshoot when a daily time
  falls in the spring-forward gap. ([#518])
- Background task start failures now reject with the **real cause** (e.g.
  unsupported TypeScript syntax, missing file) instead of an opaque timeout, and
  a failed or timed-out start no longer leaves an **orphaned daemon** running.
  ([#484])
- Long-timer drift no longer produces spurious "missed execution" warnings or
  skipped runs on daily/weekly schedules. ([#485])

### Changed
- Minimum supported Node.js is now **>= 20** (was `>= 20.11`); tested on Node
  20, 22 and 24.

> **Behavior note:** `missedExecutionTolerance` defaults to `1000`ms, so a
> scheduled run that wakes up to ~1s late now **executes** instead of emitting
> `execution:missed`. This is a bug-fix improvement, not an API break.

## [4.2.1] - 2025-07-10

### Fixed
- ESM/CJS interop and task-file import on Windows.

## [4.2.0] - 2025-06-30

### Added
- `getTasks()` and `getTask(id)` to inspect the task registry.

## [4.1.1] - 2025-06-20

### Fixed
- Overlap prevention (`noOverlap`).

## [4.1.0] - 2025-05-30

### Added
- Jitter via the `maxRandomDelay` option.

### Fixed
- `createID` compatibility with older Node versions (e.g. Node 16).

## [4.0.7] - 2025-05-22

### Fixed
- Dropped `timeZoneName` from the localized-time conversion (DST handling).

## [4.0.6] - 2025-05-20

### Fixed
- `getNextMatch` edge cases, including a time parsed as `24:00`.

## [4.0.5] - 2025-05-13

### Added
- Missing task options.

## [4.0.4] - 2025-05-12

### Fixed
- GMT offset on Node 16 and the `crypto` import.

## [4.0.3] - 2025-05-11

### Fixed
- Background task file resolution path.

## [4.0.2] - 2025-05-11

### Fixed
- Cap the heartbeat delay so long intervals don't overflow `setTimeout`.

## [4.0.1] - 2025-05-11

### Fixed
- Dual CommonJS/ESM build output.

## [4.0.0] - 2025-05-10

Full rewrite in TypeScript with a new, event-driven API: lifecycle events,
background tasks (run a task file in a forked process), `createTask` for tasks
that start stopped, per-task `logger`, and a dual ESM/CJS build. The legacy
`scheduled`/`runOnInit` options were removed and several event names changed.
See the [migration guide](https://nodecron.com/migrating-from-v3).

[Unreleased]: https://github.com/node-cron/node-cron/compare/v4.5.0...HEAD
[4.5.0]: https://github.com/node-cron/node-cron/compare/v4.4.1...v4.5.0
[4.4.1]: https://github.com/node-cron/node-cron/compare/v4.4.0...v4.4.1
[4.4.0]: https://github.com/node-cron/node-cron/compare/v4.3.0...v4.4.0
[4.3.0]: https://github.com/node-cron/node-cron/compare/v4.2.1...v4.3.0
[4.2.1]: https://github.com/node-cron/node-cron/compare/v4.2.0...v4.2.1
[4.2.0]: https://github.com/node-cron/node-cron/compare/v4.1.1...v4.2.0
[4.1.1]: https://github.com/node-cron/node-cron/compare/v4.1.0...v4.1.1
[4.1.0]: https://github.com/node-cron/node-cron/compare/v4.0.7...v4.1.0
[4.0.7]: https://github.com/node-cron/node-cron/compare/v4.0.6...v4.0.7
[4.0.6]: https://github.com/node-cron/node-cron/compare/v4.0.5...v4.0.6
[4.0.5]: https://github.com/node-cron/node-cron/compare/v4.0.4...v4.0.5
[4.0.4]: https://github.com/node-cron/node-cron/compare/v4.0.3...v4.0.4
[4.0.3]: https://github.com/node-cron/node-cron/compare/v4.0.2...v4.0.3
[4.0.2]: https://github.com/node-cron/node-cron/compare/v4.0.1...v4.0.2
[4.0.1]: https://github.com/node-cron/node-cron/compare/v4.0.0...v4.0.1
[4.0.0]: https://github.com/node-cron/node-cron/releases/tag/v4.0.0
[#147]: https://github.com/node-cron/node-cron/issues/147
[#484]: https://github.com/node-cron/node-cron/issues/484
[#485]: https://github.com/node-cron/node-cron/issues/485
[#518]: https://github.com/node-cron/node-cron/issues/518
[#535]: https://github.com/node-cron/node-cron/pull/535
[#557]: https://github.com/node-cron/node-cron/pull/557
[#560]: https://github.com/node-cron/node-cron/pull/560
[#561]: https://github.com/node-cron/node-cron/pull/561
[#562]: https://github.com/node-cron/node-cron/pull/562
[#563]: https://github.com/node-cron/node-cron/pull/563
[#564]: https://github.com/node-cron/node-cron/pull/564
[#565]: https://github.com/node-cron/node-cron/pull/565
[#566]: https://github.com/node-cron/node-cron/pull/566
[#567]: https://github.com/node-cron/node-cron/pull/567
[#568]: https://github.com/node-cron/node-cron/pull/568
[#547]: https://github.com/node-cron/node-cron/pull/547
[#548]: https://github.com/node-cron/node-cron/pull/548
[#549]: https://github.com/node-cron/node-cron/pull/549
