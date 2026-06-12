#!/bin/bash
# SessionStart hook — aster-sports (Claude Code web sessions only).
# Two jobs, both non-blocking (the session always starts; failures degrade to report lines):
#   1) idempotent npm install so lint/test/build work from the first turn
#   2) CLAUDE.md §9.1 pre-flight report: branch divergence (AP #35),
#      checkout-leakage detection (AP #52), ledger-reconcile reminder (AP #45)

if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

cd "${CLAUDE_PROJECT_DIR:-.}" || exit 0

# ── 1. dependencies (idempotent; container cache makes repeat runs fast)
if npm install --no-audit --no-fund > /tmp/session-start-npm.log 2>&1; then
  echo "deps: npm install OK ($(ls node_modules 2>/dev/null | wc -l) top-level packages)"
else
  echo "deps: npm install FAILED — see /tmp/session-start-npm.log; lint/test/build unavailable until fixed"
fi

# ── 2. §9.1 pre-flight
git fetch origin --quiet 2>/dev/null || echo "preflight: git fetch origin failed — divergence counts may be stale"
BRANCH=$(git branch --show-current 2>/dev/null || echo "?")
AHEAD=$(git rev-list --count origin/main..HEAD 2>/dev/null || echo "?")
BEHIND=$(git rev-list --count HEAD..origin/main 2>/dev/null || echo "?")
echo "preflight: branch ${BRANCH} — ahead of origin/main: ${AHEAD}, behind: ${BEHIND}"
if [ "${AHEAD}" != "0" ] || [ "${BEHIND}" != "0" ]; then
  echo "preflight: DIVERGENCE vs origin/main — halt and reconcile before new work (CLAUDE.md §9.1 item 1 / AP #35)"
fi

if ! git diff --quiet HEAD 2>/dev/null; then
  echo "preflight: WARN unstaged changes in checkout — verify intentional, not agent-worktree leakage (AP #52)"
fi
STASHES=$(git stash list 2>/dev/null | wc -l)
if [ "${STASHES}" -gt 0 ]; then
  echo "preflight: WARN ${STASHES} stash(es) present — review for AP #52 leakage before new work"
fi

echo "preflight: reconcile docs/EMBER_PENDING_LEDGER.md §4 against merged PRs before dispatching new work (§9.1 item 3 / AP #45)"
exit 0
