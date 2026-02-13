# Agent Guidelines

Instructions for AI and automated agents working in this repository.

## Quality checks: use the unified check script

**Always use the project’s check script instead of running format, lint, or tests separately.**

- **Run:** `./scripts/check.sh` or `bun run check`
- **Do not run** `format:check`, `lint`, or `test` individually when verifying changes.

The check script runs format check, lint, and tests in order and:

- On **success**: prints a single line (`Format, lint, and tests passed.`), keeping output minimal.
- On **failure**: prints only the failing step’s errors (e.g. format issues, lint reports, or failed tests), not full logs.

Using this script keeps context smaller and surfaces only what needs to be fixed.
