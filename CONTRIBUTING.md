# Contributing to node-cron

Thanks for taking the time to contribute! This guide covers the basics.

## Ground rules

- **Zero runtime dependencies.** This is part of node-cron's identity. PRs that
  add a runtime dependency will not be accepted; dev dependencies are fine.
- **Keep the API small.** Prefer a one-line API. If a feature needs a paragraph
  to explain, it probably needs redesigning.
- **Tests are required.** New behavior comes with tests; bug fixes come with a
  test that fails before the fix.
- Only contribute code you wrote yourself, or that you have the legal right to
  contribute under the project's ISC license.

## Development setup

Requires **Node.js >= 20**.

```bash
git clone https://github.com/node-cron/node-cron.git
cd node-cron
npm install
```

### Commands

| Command          | What it does                                  |
| ---------------- | --------------------------------------------- |
| `npm test`       | Run the test suite (Vitest) with coverage     |
| `npm run test:watch` | Run tests in watch mode                   |
| `npm run lint`   | Lint `src` with ESLint                        |
| `npm run build`  | Build the dual ESM/CJS bundle with Rollup     |
| `npm run check`  | Lint + test (run this before opening a PR)    |

Tests run against the TypeScript source. Background-task tests mock
`child_process.fork`; the real fork path is exercised against the built output.

## Workflow

We follow the fork-and-pull model:

1. Fork the repo and create a branch from `main`.
2. Make your change with tests. Run `npm run check` and make sure it's green.
3. Open a pull request against `main` with a clear description of the problem
   and the fix. Reference any related issue.

CI runs lint and the test suite on Node 20, 22 and 24 (and once under a non-UTC
timezone to guard timezone independence). All checks must pass.

## Reporting bugs

Open an issue using the bug report template. A minimal reproduction, your
Node.js version, and how you run your app (plain `node`, `tsx`, a bundler, etc.)
make bugs far easier to fix — see [SECURITY.md](./SECURITY.md) for security
issues, which should **not** be reported publicly.
