#!/bin/bash
# Manual invocation tool for the cron-driven edge functions.
# Useful for testing without waiting for the every-minute pg_cron tick.
#
# Usage:
#   CRON_SECRET="$(read from 1Password / dashboard)" \
#     ./scripts/trigger-cron-dispatch.sh briefing-auto-draft-tick
#   CRON_SECRET="..." \
#     ./scripts/trigger-cron-dispatch.sh briefing-cron-dispatch
#
# See docs/CRON_SECRET_SETUP.md for the secret coordination runbook.

set -euo pipefail

PROJECT_REF="vrwwpsbfbnveawqwbdmj"
FN_NAME="${1:-briefing-auto-draft-tick}"

if [[ -z "${CRON_SECRET:-}" ]]; then
  echo "Error: CRON_SECRET env var not set." >&2
  echo "Usage: CRON_SECRET=<secret> $0 <function-name>" >&2
  exit 2
fi

curl -fsS -X POST \
  "https://${PROJECT_REF}.supabase.co/functions/v1/${FN_NAME}" \
  -H "Authorization: Bearer ${CRON_SECRET}" \
  -H "Content-Type: application/json" \
  -d '{}' | jq .
