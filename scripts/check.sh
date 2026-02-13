#!/usr/bin/env bash
# Runs format check, lint, and tests. Prints one line on success, or only failures/errors on failure.
# Extensible: add or remove steps in the CHECK_NAMES and CHECK_CMDS arrays.

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

CHECK_NAMES=( "Format" "Lint" "Tests" )
CHECK_CMDS=( "bun run format:check" "bun run lint" "bun run test" )

for i in "${!CHECK_CMDS[@]}"; do
  name="${CHECK_NAMES[$i]}"
  cmd="${CHECK_CMDS[$i]}"
  out=$(eval "$cmd" 2>&1)
  exit_code=$?
  if [ "$exit_code" -ne 0 ]; then
    echo "[${name} failed]"
    if [ "$name" = "Tests" ]; then
      echo "$out" | grep -E '\(fail\)' || true
      echo "$out" | tail -15
    else
      echo "$out"
    fi
    exit 1
  fi
done

echo "All checks passed."
