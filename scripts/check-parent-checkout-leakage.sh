#!/bin/bash
# Parent-checkout leakage detector
# Per CLAUDE.md anti-pattern #52 refinement (2026-05-22).
#
# Detects commits attempted IN THE PARENT CHECKOUT while agent worktrees
# exist. These commits may be agent-worktree leakage from a path-construction
# error (the Edit tool's path resolution defaults to the parent checkout
# even when an agent's pwd is the worktree).
#
# Per A.4 investigation findings (2026-05-22 PM): the failure mode is
# empirically real (6 documented instances across 2 sessions despite prose
# discipline). This hook provides mechanical surfacing at commit attempt.
#
# Action: warning only. Does NOT block the commit. The warning surfaces the
# staged diff so the operator can verify intent before pressing through.
#
# False-positive cost: low (Frank legitimately editing parent for testing
# sees a warning, ignores it).
# True-positive value: catches the failure mode at commit attempt rather
# than at the next session's parent-checkout audit.

# Resolve the git toplevel (the checkout this commit is happening in)
GIT_TOPLEVEL="$(git rev-parse --show-toplevel)"

# Only fire when committing IN THE PARENT CHECKOUT (not in a worktree).
# Detect by basename so the script works regardless of where the repo is
# cloned (was hardcoded /home/user/skyfire-app; broke silently on machines
# with a different prefix). Worktrees live under .claude/worktrees/agent-*
# so their basename starts with "agent-".
if [ "$(basename "$GIT_TOPLEVEL")" != "skyfire-app" ]; then
  # Worktree commit — normal agent activity, exit silently
  exit 0
fi

# Count active agent worktrees
WORKTREE_COUNT=$(git worktree list | grep -c '/.claude/worktrees/agent-' || true)

if [ "$WORKTREE_COUNT" -gt 0 ]; then
  echo ""
  echo "================================================================"
  echo "  PARENT-CHECKOUT LEAKAGE CHECK (anti-pattern #52 refinement)"
  echo "================================================================"
  echo ""
  echo "You are committing in the PARENT checkout while $WORKTREE_COUNT"
  echo "agent worktree(s) exist. This commit may be agent-worktree"
  echo "leakage from a path-construction error."
  echo ""
  echo "Staged changes:"
  echo ""
  git diff --cached --stat
  echo ""
  echo "If this is intentional (e.g., Frank editing parent for testing),"
  echo "proceed. If not, abort with Ctrl-C and investigate whether the"
  echo "changes belong in an agent worktree."
  echo ""
  echo "(This warning does not block the commit — it only surfaces it.)"
  echo "================================================================"
  echo ""
fi

# Exit 0 always — warning only, no block
exit 0
