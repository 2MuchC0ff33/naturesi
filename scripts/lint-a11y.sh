#!/bin/sh
# scripts/lint-a11y.sh — Accessibility lint (alias for lint-accessibility.sh)
exec "$(dirname -- "$0")/lint-accessibility.sh" "$@"
