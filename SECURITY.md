# Security Policy

## Supported versions

node-cron follows semantic versioning. Security fixes are released for the
latest `4.x` minor. Older majors (`3.x` and below) are not maintained.

| Version | Supported          |
| ------- | ------------------ |
| 4.x     | :white_check_mark: |
| < 4     | :x:                |

## Reporting a vulnerability

**Please do not open a public issue for security problems.**

Report privately through GitHub's [security advisories](https://github.com/node-cron/node-cron/security/advisories/new)
("Report a vulnerability"). Include:

- the affected version,
- a description of the issue and its impact,
- a minimal reproduction if you have one.

You can expect an initial response within a few days. Once a fix is ready, a
patched release is published and the advisory is disclosed with credit to the
reporter (unless you prefer to stay anonymous).

node-cron ships with **zero runtime dependencies**, so the attack surface is
limited to the package's own code and the Node.js runtime it runs on.
