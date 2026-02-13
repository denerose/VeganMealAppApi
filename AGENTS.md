# Agent Guidelines

Instructions for AI and automated agents working in this repository.

## Quality checks: use the unified check script

**Always use the project’s check script instead of running format, lint, or tests separately.**

- **Run:** `./scripts/check.sh` or `bun run check`
- **Do not run** `format:check`, `lint`, or `test` individually when verifying changes.

The check script runs format check, lint, and tests in order and:

- On **success**: prints a single line (`All checks passed.`), keeping output minimal.
- On **failure**: prints only the failing step’s errors (e.g. format issues, lint reports, or failed tests), not full logs.

Using this script keeps context smaller and surfaces only what needs to be fixed.

## Running containters
-Use `podman` not `docker` in command line

## Use enums, types and classes
- ALWAYS check for and prefer to use existing enums and classes over hardcoded strings or consts.
- Avoid use of type `any` use a valid type or class, import t ypes for libraries or use `unknown` in the last resort.