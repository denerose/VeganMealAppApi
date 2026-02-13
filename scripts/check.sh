#!/usr/bin/env bash
# Runs format check, lint, and tests. Prints one line on success, or only failures/errors on failure.

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

format_out=$(bun run format:check 2>&1) || { echo "[Format failed]"; echo "$format_out"; exit 1; }

lint_out=$(bun run lint 2>&1) || { echo "[Lint failed]"; echo "$lint_out"; exit 1; }

test_out=$(bun run test 2>&1); test_exit=$?
if [ "$test_exit" -ne 0 ]; then
  echo "[Tests failed]"
  echo "$test_out" | grep -E '\(fail\)' || true
  echo "$test_out" | tail -15
  exit 1
fi

echo "Format, lint, and tests passed."
