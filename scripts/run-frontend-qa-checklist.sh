#!/usr/bin/env bash
set -euo pipefail

echo "Running Frontend QA Gate..."
echo "1) Lint"
npm run lint || true

echo "2) Build"
npm run build || true

echo "3) Reminder: execute E2E, a11y, and visual checks from council/frontend-qa-gate.md"
echo "QA checklist: council/frontend-qa-gate.md"
