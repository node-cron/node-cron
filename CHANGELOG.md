# Changelog

All notable changes to this project are documented here. The format is based on
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project
follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [5.0.0](https://github.com/node-cron/node-cron/compare/node-cron-v4.5.0...node-cron-v5.0.0) (2026-06-22)


### ⚠ BREAKING CHANGES

* rename distributedTtl option to distributedLease ([#551](https://github.com/node-cron/node-cron/issues/551))

### Added

* add cron.parse and cron.validateDetailed ([#548](https://github.com/node-cron/node-cron/issues/548)) ([cbe36bc](https://github.com/node-cron/node-cron/commit/cbe36bc8841b6b0d1d27fbf8199084583636e639))
* add lastRun() introspection getter ([#557](https://github.com/node-cron/node-cron/issues/557)) ([5d858ca](https://github.com/node-cron/node-cron/commit/5d858ca4293b0ad1ecffff7fef1fb430a2c946fc))
* added bree to readme ([94c139f](https://github.com/node-cron/node-cron/commit/94c139fd418571106fc12c5d55817187488f460f))
* added bree to readme ([bee9aa0](https://github.com/node-cron/node-cron/commit/bee9aa0fa11df2fdf0509522ca81343ea58f3fe4))
* added jitter to the tasks ([e82975c](https://github.com/node-cron/node-cron/commit/e82975c0359c40d3d5ee5b5d7643c02e554c55b0))
* added maxExecutions option ([07c4510](https://github.com/node-cron/node-cron/commit/07c451010ecfec81d29008ec622be318dd1fdec1))
* added maxRandomDelay to the tasks ([0559ad9](https://github.com/node-cron/node-cron/commit/0559ad9b1110c130256b1bb0104ddb56b749848e))
* added Options ([259c6f0](https://github.com/node-cron/node-cron/commit/259c6f03c1cac497a224397719e18140999e0d5f))
* blocking io detection ([27563da](https://github.com/node-cron/node-cron/commit/27563dac1cbbe9de37d4b7a28940e10bb507710c))
* configurable executeTimeout for background tasks (default: no timeout) ([5f46889](https://github.com/node-cron/node-cron/commit/5f46889d0af259c05eed7a84e854858d533ab3d7))
* configurable executeTimeout for background tasks (default: no timeout) ([65aee63](https://github.com/node-cron/node-cron/commit/65aee635e70040dfeab3c7e9076a81777ec63a92))
* configurable logger + opt-out of the missed-execution warning ([1e3d420](https://github.com/node-cron/node-cron/commit/1e3d4208e46e4b9da163fffb8da06c6b1e7d7859))
* configurable logger + opt-out of the missed-execution warning ([14a5dd7](https://github.com/node-cron/node-cron/commit/14a5dd7b0456948aab8810bc1a6eb63e8ca99ab7))
* **day-of-month:** Quartz-style W, L-n and ? modifiers ([#570](https://github.com/node-cron/node-cron/issues/570)) ([cbe379b](https://github.com/node-cron/node-cron/commit/cbe379bce9d770c84328399dca514bd92a467c18))
* distributed run coordination (one instance per fire across a fleet) ([#549](https://github.com/node-cron/node-cron/issues/549)) ([2ba12f1](https://github.com/node-cron/node-cron/commit/2ba12f1646484df129ce44bf3d1fb81ec00f904f))
* getNext added on task ([7981164](https://github.com/node-cron/node-cron/commit/7981164b61d19a28cf29ff71bece1326d5f4f9a7))
* run task on demand or on init ([3792abb](https://github.com/node-cron/node-cron/commit/3792abb956e5b811258a14785c0687b64e4a1a5c))
* support `L` (last day of month) in the day-of-month field ([#396](https://github.com/node-cron/node-cron/issues/396)) ([1ab9abc](https://github.com/node-cron/node-cron/commit/1ab9abc806c0297c7f552b8b47681bfaa10a5f8d))
* support extended day-of-week tokens (# nth weekday and L last weekday) ([#560](https://github.com/node-cron/node-cron/issues/560)) ([c2db9d1](https://github.com/node-cron/node-cron/commit/c2db9d19644a4c451fb9788f65d6162bf78f16a4))
* task introspection (getNextRuns, match, msToNext, isBusy, runsLeft, getPattern) ([#547](https://github.com/node-cron/node-cron/issues/547)) ([394e57e](https://github.com/node-cron/node-cron/commit/394e57e935dfe220a9ef8e1d9b8ffbbe7dbc98c3))
* testing background task ([8450a1a](https://github.com/node-cron/node-cron/commit/8450a1a7ecf8542b407d9949a6b17449c68447c3))
* using async await and checking features, looking okay ([8b8f5eb](https://github.com/node-cron/node-cron/commit/8b8f5eb430c63ee4545678e392e9ac053a8526f8))


### Fixed

* add uuid dependency ([f370a0d](https://github.com/node-cron/node-cron/commit/f370a0d282da456db476bcd8b9eb472fef9ef3f2))
* add uuid dependency ([5d715f1](https://github.com/node-cron/node-cron/commit/5d715f178601b8595b4da22c363c89eff02bef26))
* background task resolution path ([57a7b74](https://github.com/node-cron/node-cron/commit/57a7b744bd24d765d4b706cf50c8265db92cfa50))
* badges ([111e803](https://github.com/node-cron/node-cron/commit/111e803c284830cbe8155e747e94295ed8c68a2e))
* build ([e3662e7](https://github.com/node-cron/node-cron/commit/e3662e7d8e9043889014e5bb90e017594ee70d46))
* build cjs and esm ([530fecc](https://github.com/node-cron/node-cron/commit/530fecc2a2e6a111afb9b0a18770e6279eceb330))
* chai import ([a12e1ee](https://github.com/node-cron/node-cron/commit/a12e1ee7af316f86e1655aa2f5d2c76351a5e328))
* change getStatus() return type to string ([c1dae18](https://github.com/node-cron/node-cron/commit/c1dae18bc6a47af3dbe6f364df0ca7a8ab73deb0))
* change getStatus() return type to string ([b8b6446](https://github.com/node-cron/node-cron/commit/b8b64464bcfee7d540b69c7721c4bfd843de2fee))
* cleanup execution:finished listener when execute() fails ([2c5141f](https://github.com/node-cron/node-cron/commit/2c5141f71e9c759782d2a12d207b9024944724bb))
* cleanup execution:finished listener when execute() fails ([fcab4de](https://github.com/node-cron/node-cron/commit/fcab4dea3588d1591344e3d38794bda056ea5744))
* create id function making it compatible with old node version li… ([ea019c7](https://github.com/node-cron/node-cron/commit/ea019c7732439dc35982e7c5ef1e2e2399970714))
* create id function making it compatible with old node version like node 16 ([29d96b5](https://github.com/node-cron/node-cron/commit/29d96b5eb79a6ef5868bc3643973a2d8fcdf2140))
* crypto import ([16d3a9b](https://github.com/node-cron/node-cron/commit/16d3a9b8907116fe30c2dbb344d4dc8888819c89))
* date parsed to 24:00 ([5bed625](https://github.com/node-cron/node-cron/commit/5bed62583b6174f5614e46698e45f3abcc851e2a))
* destroy ([a8d51ea](https://github.com/node-cron/node-cron/commit/a8d51eac3bbbe33165cc83e7bb121a79bfca4074))
* destroy ([3788243](https://github.com/node-cron/node-cron/commit/3788243f63c2884d41251896cbbd1a6fe1d75a65))
* fixed interop of ESM and CJS on Windows ([50bfc82](https://github.com/node-cron/node-cron/commit/50bfc82f7520b875f497fee3517755f6545b1727))
* fixed task import on Windows ([7821a27](https://github.com/node-cron/node-cron/commit/7821a27589c324bc78f2c81454d52248319e05fe))
* get next match ([c76f95e](https://github.com/node-cron/node-cron/commit/c76f95e92a717e54d97b40fa58d585dbeb6cb0f6))
* get next match ([c76f95e](https://github.com/node-cron/node-cron/commit/c76f95e92a717e54d97b40fa58d585dbeb6cb0f6))
* get next match ([e5d9cdd](https://github.com/node-cron/node-cron/commit/e5d9cdd247d25fcbfe0592acdf222e8294828436))
* get next run ([fbd6826](https://github.com/node-cron/node-cron/commit/fbd6826fdf7aad75e14234ebe595468b0ba9734f))
* getNextMatch returns past dates near DST boundaries ([d789934](https://github.com/node-cron/node-cron/commit/d789934dc4e0951f7f6b2d78221d2d92cdfc4419))
* getNextMatch() returns past dates near DST boundaries ([657497d](https://github.com/node-cron/node-cron/commit/657497dfe53fa0bc97890d8b1b32d1bbe399fdca))
* getNextMatch() returns past dates near DST boundaries ([5fa3232](https://github.com/node-cron/node-cron/commit/5fa3232867d1d6776079a993c987bbaa49555690))
* gmt on node 16 ([b3988ef](https://github.com/node-cron/node-cron/commit/b3988ef586cc42e18480ae29b55a1480dcd06aa7))
* handle GMT+0 as Z in getTimezoneGMT and fix EventEmitter ESM import ([f989527](https://github.com/node-cron/node-cron/commit/f98952775757deb91f8dcfd69752077c69e7dcc1))
* import EventEmitter as a named import in the inline task ([d846506](https://github.com/node-cron/node-cron/commit/d846506e50cc8001dec2a2c461af053a9acdc96b))
* import EventEmitter as a named import in the inline task ([59316b9](https://github.com/node-cron/node-cron/commit/59316b9a8e07559bae38fe11498fbe6c8f814e12))
* invalid value separator ([0c6b8f9](https://github.com/node-cron/node-cron/commit/0c6b8f95d768678379ea8b11565eae74c0529446))
* invalid value separator ([2319e04](https://github.com/node-cron/node-cron/commit/2319e049f9b3da26234cd2aeb2c6b45b48a3eeed))
* isDayWildcard ([a898e9e](https://github.com/node-cron/node-cron/commit/a898e9e3d91bf443d1d26b5e2cf5968fb0fdd808))
* lint ([386cb1a](https://github.com/node-cron/node-cron/commit/386cb1a39b7a2602a9c15d791b11a72cc1961a24))
* make test command compatible with windows shell ([31b5070](https://github.com/node-cron/node-cron/commit/31b50702b258350c7d00d1497246486b2e002458))
* make test command compatible with windows shell ([c5ea4b3](https://github.com/node-cron/node-cron/commit/c5ea4b34f7249fbff6132fa96e78e4f9d34ba4f8))
* matching with timezone ([33ad7a3](https://github.com/node-cron/node-cron/commit/33ad7a3b8bb97e74a0f2cdd8e959aa5f39866bda))
* overlap ([81053ea](https://github.com/node-cron/node-cron/commit/81053eaf932d460698911b950fafb88c7f96f650))
* overlap ([340eb12](https://github.com/node-cron/node-cron/commit/340eb12e3b2e4044463383fe2694a033571e4877))
* range with step ([f9751b3](https://github.com/node-cron/node-cron/commit/f9751b318b9a58871a458ba9d3d7d14d2d49f0bf))
* removing timeZoneName from localized time ([7ffaf13](https://github.com/node-cron/node-cron/commit/7ffaf136062f71ae9db3ee5da024d168dade3d7f))
* removing useless Object.asign ([fde1746](https://github.com/node-cron/node-cron/commit/fde1746cf8c7b7bd4a72bb53a7ea073a31d7c9bd))
* require ([bc3d96b](https://github.com/node-cron/node-cron/commit/bc3d96b86d8c34a7488d55fa8012280ffc4dd94f))
* resolve getNextMatch returning past dates near DST boundaries ([d175f12](https://github.com/node-cron/node-cron/commit/d175f1208923fefe5b76554487e898b7c992cb81))
* set max delay ([1c86d20](https://github.com/node-cron/node-cron/commit/1c86d200ea13f1c73db5045cbb04d525ed220699))
* stop ([9453ded](https://github.com/node-cron/node-cron/commit/9453ded5b0e46967e4db4f295fee28db35e936db))
* stop ([4523664](https://github.com/node-cron/node-cron/commit/45236640e04190d4eac03b1866f4deaba897b123))
* surface real background task start errors and stop orphaned daemons ([#535](https://github.com/node-cron/node-cron/issues/535)) ([da270d2](https://github.com/node-cron/node-cron/commit/da270d2cf3d2f01bf6ccca4602b9cbf9f1350d81))
* sync package-lock.json version with package.json (4.2.1) ([d84e060](https://github.com/node-cron/node-cron/commit/d84e060f374112265f4aff2f94bd192f6802e7ce))
* sync package-lock.json version with package.json (4.2.1) ([b806688](https://github.com/node-cron/node-cron/commit/b8066884cd5f63e0f6db2bdc9acbcee6d0e8bf74))
* tests ([3452cfc](https://github.com/node-cron/node-cron/commit/3452cfcd721d74da4ca99240419af8c5e201c50a))
* tolerate late heartbeats so drifting timers don't skip executions ([#534](https://github.com/node-cron/node-cron/issues/534)) ([e519d6c](https://github.com/node-cron/node-cron/commit/e519d6cd9a5814d92a338e17a7a12fcd18bc49e0))
* uuid ([a2c5851](https://github.com/node-cron/node-cron/commit/a2c58511bc0b044b0e39549f73f66d26a63aa144))


### Performance

* **build:** bundle dist into flat files instead of preserving modules ([#566](https://github.com/node-cron/node-cron/issues/566)) ([c80a396](https://github.com/node-cron/node-cron/commit/c80a3962473622dd032907afc54e922a15359bd8))
* **id:** drop crypto.randomBytes from internal id generation ([#564](https://github.com/node-cron/node-cron/issues/564)) ([7c5015c](https://github.com/node-cron/node-cron/commit/7c5015c1aaa0f26bc1d28d0b84c5f53935befe3a))
* **pattern:** parse cron expression once per TimeMatcher ([#562](https://github.com/node-cron/node-cron/issues/562)) ([dd0a2a9](https://github.com/node-cron/node-cron/commit/dd0a2a92a796933cc8f69e063be12438231ccdd2))
* **runner:** run inline when no random delay is configured ([#565](https://github.com/node-cron/node-cron/issues/565)) ([dad56e1](https://github.com/node-cron/node-cron/commit/dad56e1f26b744dc8579f141341bbbc58902c0bf))
* **time:** cache Intl.DateTimeFormat instances per timezone ([#561](https://github.com/node-cron/node-cron/issues/561)) ([cf69f32](https://github.com/node-cron/node-cron/commit/cf69f32ab04b6401a30a5f784547ef2819b9305f))
* **time:** compute the GMT offset lazily ([#563](https://github.com/node-cron/node-cron/issues/563)) ([a309d5f](https://github.com/node-cron/node-cron/commit/a309d5f511e4fcd65d7d378076fa027b419682c5))


### Changed

* build with Rollup (ESM + CJS + dts) and migrate tests to Vitest ([d51701c](https://github.com/node-cron/node-cron/commit/d51701c160aafb9ee8ca06184cff88a36aafa1d3))
* build with Rollup (ESM + CJS + dts) and migrate tests to Vitest ([9d9cc38](https://github.com/node-cron/node-cron/commit/9d9cc38b4af0776a4f9a65490e8352e499f33c1d))
* drop the now-dead LocalizedTime.set and cover localTimeToTimestamp ([ec785ae](https://github.com/node-cron/node-cron/commit/ec785ae315032f91c10ba75597ed397c1bea3396))
* hoist field sorting, widen search bound, add edge-case tests ([8c7eb05](https://github.com/node-cron/node-cron/commit/8c7eb057755726ef2acf3939eaca31e4d1c04dde))
* name the time-of-day bound check and drop the dead expressions field ([9bbf599](https://github.com/node-cron/node-cron/commit/9bbf599176186b894cfdf3e8852b8021b1ce1b35))
* rename distributedTtl option to distributedLease ([#551](https://github.com/node-cron/node-cron/issues/551)) ([23c7849](https://github.com/node-cron/node-cron/commit/23c78497d09fca8cf0a06894f32b98a928cbd482))
* rewrite matcher-walker to infer next run from cron fields ([58cabac](https://github.com/node-cron/node-cron/commit/58cabace30b31af45b8a2bc1b68ab0b521c9b6b8))
* rewrite matcher-walker to infer the next run from cron fields ([74874cd](https://github.com/node-cron/node-cron/commit/74874cdf54660b6c29a01655052736442a6c5d32))
* **src#node-cron:** apply optimizations ([72ff630](https://github.com/node-cron/node-cron/commit/72ff6302a5c60975ca11871fbfe7d7af04c23499))
* **src#node-cron:** apply optimizations ([f0cbe3b](https://github.com/node-cron/node-cron/commit/f0cbe3b5f8db948590c6f3ab785a82bfb97a73f3))
* **time-matcher:** use intl date format instead of moment ([5f278cb](https://github.com/node-cron/node-cron/commit/5f278cbd80900a12e12c48efeea377c1d460b469))
* use intl.DateTimeFormat instead of moment-timezone ([422fb05](https://github.com/node-cron/node-cron/commit/422fb05ff9a2388b5e9e85e41889c97275ea4380))

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
