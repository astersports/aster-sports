# REMAINING PHASES AUDIT

Planning surface for deferred investigations + multi-phase audit items that
don't fit cleanly in `EMBER_PENDING_LEDGER.md` §4 (per-arc) or
`SKYFIRE_BUILD_QUEUE_v2.md` (per-product-phase). Each `A.N` section is a
discrete investigation or structural-design slot.

Sections A.1–A.3 are reserved for future registrations. A.4 is the primary
entry on 2026-05-23.

---

## A.4 — Anti-pattern #52 third-break structural investigation

**Status:** Open. Investigation written 2026-05-23 AM following two
empirical breaks on AP #52's registration day (2026-05-22).
**Owner:** Frank + chat-side claude.ai (design); CC sessions (implementation).
**Promotes:** an Option 3 implementation PR (PreToolUse tool-layer
enforcement) and a candidate AP "mechanical gates over verbal
acknowledgments."

### Problem statement

AP #52's per-call discipline — "construct the absolute path by prepending
the agent's known worktree prefix to any source-tree path; apply
mechanically, not attentionally" — broke twice on its registration day
2026-05-22:

- **PR #460** (AM session): agent self-detected mid-flight and recovered.
  Refinement captured in ledger §14 discipline-notes.
- **PR #473** (PM session, Q5+Q7 deferral comments): parent-checkout
  leakage detected post-merge. The worse class — leakage shipped before
  detection.

Plus the bash-compound `cd … 2>/dev/null` queued in 2026-05-23's session
opener is arguably the third break: same path-resolution failure mode,
different tool surface (Bash composition instead of Edit-tool input
construction).

The ledger watch list at `EMBER_PENDING_LEDGER.md:1407` says third break
promotes to "deeper investigation (Section A.4 in remaining-phases audit
doc — needs a structural answer beyond 'explicit path in every Edit
call')." This section fills that slot.

### Why per-call discipline is insufficient

Per the 2026-05-22 PM empirical A.4 investigation (referenced inline at
`scripts/check-parent-checkout-leakage.sh:10`):

1. **The Edit tool is path-honest.** It writes to whatever absolute path
   it's given. There is no tool-layer "silent revert" or "parent default."
2. **The failure mode is agent input construction.** Agents intend to
   edit a file in their worktree, construct the absolute path missing the
   `.claude/worktrees/agent-XXX/` prefix, and the edit lands at the
   parent checkout. The worktree then appears unchanged, and the agent
   misreports the result as a tool bug.
3. **Audit at investigation close:** 9 git stashes existed in the parent
   checkout, of which 6 were explicitly marked agent-leakage from the
   2026-05-21 and 2026-05-22 sessions. The prose discipline broke on
   its registration day (PR #473) despite explicit prompt instructions.
4. **The current AP #52 wording — "apply mechanically, not attentionally"
   — is itself attentional.** It tells the agent to behave mechanically.
   That's intent-layer enforcement of a mechanical-sounding rule. Under
   load (mid-session, multi-step prompt, conflicting attention), the
   intent layer degrades. The "apply mechanically" instruction can't
   actually force mechanical application; only the tool layer can.

The structural answer must remove the attention surface, not strengthen it.

### Diagnostic — why PR #473 broke despite registration (same day)

The two-hypothesis framing from chat-side feedback ("was the hook
bypassed via `--no-verify`? was the leakage written but not committed?")
both assume the warning hook existed when PR #473 leaked. **It didn't.**

Chronology (verified via `git log`):

| Event | PR | Date |
|---|---|---|
| AP #52 registered as candidate | #431 | 2026-05-22 AM |
| Q5+Q7 deferral comments PR — leakage event | #473 | 2026-05-22 PM |
| Pre-commit warning hook shipped — *response to #473* | #477 | 2026-05-22 PM (after #473) |

PR #477 created the hook *because* PR #473 leaked. There was no
detection mechanism at the time of #473. The discipline cycle worked
("failure observed → tool built") but only after the failure cost a
post-merge correction.

The deeper diagnostic question shifts: **why did the prose discipline
fail on its own registration day, before any tooling could backstop
it?** Three layered causes:

1. **Registration ≠ adoption.** PR #431 added text to CLAUDE.md. Agents
   spawned later that day read the text but didn't have it ingrained
   the way longer-standing APs are. New rules need a grace period of
   reinforcement, or tool-layer enforcement that doesn't depend on
   agent context-load.
2. **The failure surface looks like normal work.** Constructing an
   absolute path for Edit looks like ordinary Edit usage. The agent
   has no internal signal that something is off — the path "looks
   right" because parent and worktree paths share the same tail.
3. **No write-time feedback loop.** When the Edit lands in the parent,
   the worktree shows unchanged. The agent reads the worktree, sees no
   change, and constructs a plausible (wrong) story ("the Edit reverted").
   By the time the post-merge audit catches the parent stash, the agent
   is gone and the story sticks.

Causes 2 and 3 are exactly what Option 3 below addresses at the tool
layer: a PreToolUse gate makes wrong paths *visible at construction
time* by failing the call. The agent gets a write-time error instead of
a silent miss + plausible-story misdiagnosis.

### Candidate structural answers

#### Option 1 — CI gate (post-merge detection)

A GitHub Action that scans merged PR diffs for files modified outside
the declared agent worktree. Catches at merge time.

**Strengths:** centralized, no per-agent setup, runs even if local
hooks are missing.
**Weaknesses:** post-hoc only (catches after merge). GitHub doesn't
natively know "which clone did the edit" — needs an indirect signal
(commit metadata tagged by agent, branch naming convention, or PR
template field). Indirect signals can be forgotten.
**Recommendation:** Defense-in-depth only. Not the primary mechanism.

#### Option 2 — SHIPPED: pre-commit warning hook (PR #477)

This is the **existing defense layer**, not a candidate. The script
lives at `scripts/check-parent-checkout-leakage.sh` and runs via
`.husky/pre-commit` → `npx lint-staged` chain.

What it does (per script source):
- Resolves `git rev-parse --show-toplevel`.
- Returns silently if the toplevel is anything other than the hardcoded
  parent checkout path (`/home/user/skyfire-app` — Frank's machine
  only). Worktree commits skip the check.
- Counts active agent worktrees via `git worktree list | grep -c '/.claude/worktrees/agent-'`.
- If worktrees exist, emits a banner with `git diff --cached --stat` so
  the operator can verify intent before pressing through.
- Always exits 0 — **warning only, never blocks the commit.**

What it catches:
- Manual `git commit` in the parent checkout while agent worktrees are
  active, with non-empty staged diff. Operator sees the warning and can
  abort with Ctrl-C.

What it does NOT catch:
- Write-time leakage. The hook fires at commit-time, after the Edit
  already landed.
- Parent leakage that stays un-committed. PR #473's failure shape: the
  agent committed in its own worktree (which it owned), but the
  leakage in parent sat un-committed. The hook never ran on the parent
  because no commit was attempted there.
- Commits in environments where `GIT_TOPLEVEL` doesn't match the
  hardcoded path (other developers' clones, CI environments).
- Anything if all worktrees were torn down before the parent commit
  attempt.

The warning layer is **detection at commit-time in the operator's
parent checkout, conditional on active worktrees, banner-only**. It
caught some of the 6 leakage stashes (the ones surfaced via Frank's
parent commits since PR #477). It cannot catch the PR #473 failure
shape because that shape doesn't involve a parent commit at all.

#### Option 3 — PreToolUse hook for write-time enforcement [RECOMMENDED BRIDGE]

A Claude Code harness `PreToolUse` hook that validates `file_path` on
every `Edit`/`Write` tool call and **blocks the call** if the path
doesn't begin with the agent's worktree prefix.

Concrete implementation sketch:

1. **Agent session start (one-time per worktree-isolated agent):**
   ```
   AGENT_WORKTREE_PREFIX=$(git rev-parse --show-toplevel)
   echo "$AGENT_WORKTREE_PREFIX" > .claude/agent-worktree-prefix
   ```
   The prefix is computed mechanically from the agent's actual cwd at
   spawn, not passed via prompt.

2. **Hook registration in `.claude/settings.json` (or per-agent
   settings):**
   ```json
   {
     "hooks": {
       "PreToolUse": [
         {
           "matcher": "Edit|Write",
           "hooks": [
             {
               "type": "command",
               "command": "bash scripts/check-edit-worktree-prefix.sh"
             }
           ]
         }
       ]
     }
   }
   ```

3. **Hook script logic (`scripts/check-edit-worktree-prefix.sh`):**
   - Read the tool input JSON from stdin (the harness passes
     `{"tool_name": "...", "tool_input": {"file_path": "..."}}`).
   - Extract `file_path` via `jq -r .tool_input.file_path`.
   - Read stored prefix from `.claude/agent-worktree-prefix`.
   - If the prefix file doesn't exist (parent checkout, not an agent
     worktree), exit 0 (allow).
   - If `file_path` starts with `$AGENT_WORKTREE_PREFIX/`, exit 0
     (allow).
   - Otherwise, exit non-zero with a clear error message naming the
     mismatch.

**Strengths:**
- **Mechanical at the tool layer.** The Edit call fails before any
  write happens. No attentional dependency.
- **Write-time feedback.** Agent gets an immediate, named error
  instead of a silent miss.
- **No story-spinning.** The agent cannot misdiagnose "tool reverted"
  because the tool returned an error, not a success.
- **Works alongside Option 2.** Defense-in-depth — Option 2 catches
  what Option 3 misses (e.g., hand-edits in the parent, non-tool
  writes), and vice versa.

**Weaknesses:**
- Requires harness `PreToolUse` support per agent spawn.
- Per-worktree setup adds a step to the agent-spawn ritual (mitigated
  if the spawn script computes/writes the prefix automatically).
- Doesn't protect non-Edit writes (Bash `tee`, `sed -i`, `>`
  redirections). Mitigation: matcher could extend to `Bash` with a
  stricter parser, but at significant complexity cost. Probably out of
  scope for v1.

**Recommendation:** Ship as the next concrete defense layer. Scope to
one PR: hook script + settings entry + spawn-script prefix-write +
test fixture.

#### Option 4 — Architectural: no persistent parent checkout [LONG-TERM NORTH STAR]

The truer answer than Option 3. Option 3 prevents leakage *to* a
destination; Option 4 removes the destination.

Mechanism: agents always work in ephemeral worktrees. Frank's "main"
working surface is also a worktree (or a tmux session bound to one).
At session close, worktrees are merged or discarded. There is no
"parent checkout" sitting around accumulating stashes.

**Why this is the architecturally correct answer:**
- Eliminates the entire failure class. Wrong-path Edits don't have a
  parent destination to leak into.
- Removes the need for Options 1, 2, 3 entirely (they're all working
  around the existence of the parent).
- Aligns with the broader pattern: persistent shared state between
  agents is a recurring source of drift (cf. AP #45 ledger
  reconciliation, AP #43 cross-surface invariant tests, etc.).

**Why it's not the next PR:**
- Workflow change for Frank's day-to-day (every smoke session, every
  manual edit, every CLAUDE.md update goes through worktree creation).
- Needs design: how do non-agent edits flow? How do `git stash` /
  `git diff main` workflows work? How does iPhone smoke ergonomics
  change when there's no "stable main checkout" to deploy from?
- Tooling: aliases, scripts, or harness changes to make worktree-as-
  default ergonomic.

**Path:** Schedule as a multi-session arc after Option 3 ships and
the next 10 sessions accumulate empirical data on which leakage
shapes survive Option 3 + Option 2 combined. Option 4 design opens
when that data is in hand.

### Recommendation

Sequence:

1. **Option 3 next** — ship the PreToolUse hook as a single-scope PR.
   Bridge mechanism that converts AP #52's "apply mechanically" from
   intent-language to tool-layer enforcement.
2. **Option 2 retained** — defense-in-depth at commit time. Don't
   remove.
3. **Option 1 deferred** — revisit only if Options 2 + 3 prove
   insufficient. Indirect-signal cost is high.
4. **Option 4 archived as north star** — open the design arc when
   empirical data on Option 3 effectiveness is available. Not
   archived in the "ignore" sense; archived in the "load-bearing
   future direction" sense.

### Exit criteria

A.4 closes when all three hold:

- **(a)** Option 3 implementation shipped as a separate PR. Scope:
  `scripts/check-edit-worktree-prefix.sh` + `.claude/settings.json`
  hook entry + agent-spawn-script prefix-write + at least one test
  case (intentional cross-prefix Edit should fail; in-prefix Edit
  should pass).
- **(b)** 10 consecutive agent sessions with zero new
  parent-checkout leakage stashes (counted via `git stash list | grep
  agent-leakage`).
- **(c)** CLAUDE.md AP #52 entry updated to reference Option 3 as the
  primary mechanism, with Option 2 as defense-in-depth and the
  current per-call discipline language removed or downgraded to a
  fallback note.

### Appendix — candidate AP framing: "mechanical gates over verbal acknowledgments"

Surfaced in chat-side feedback during the 2026-05-23 AM session
opener after this CC session demonstrated two adjacent failure modes:

1. **Verbal pivot without task-list rewrite.** Agent said "Pivoting"
   while the task list still held the old plan; the queued work
   continued the old direction. Acknowledgment without mechanical
   state change.
2. **Bash compound `cd X 2>/dev/null; <fileop>`.** Agent said
   "discrete commands with explicit error checking" but queued a
   compound that silently swallows path-resolution errors — same
   underlying shape as AP #52, different tool surface.

The unified framing: **verbal acknowledgment is not the same as the
acknowledged action.** Acknowledgments tell the operator the agent
*understood*; they do not produce the *behavior* that understanding
should produce. Only mechanical state changes (task-list rewrites,
discrete tool calls, tool-layer gates) produce behavior.

A.4's Option 3 is the first concrete application of this framing.
AP #52's current text says "apply mechanically, not attentionally"
— but the rule is currently enforced attentionally (agents read it
and try to behave mechanically). Option 3 is the actual mechanical
gate that AP #52's "prepend the prefix mechanically" rule failed to
produce despite explicit instruction.

If the framing holds across additional instances, it promotes to a
registered anti-pattern in CLAUDE.md §11, likely numbered #60 or
later. Candidate phrasing for that future registration:

> **Mechanical gates over verbal acknowledgments.** When a discipline
> rule says "do X mechanically," the rule's enforcement layer
> determines whether it actually happens. Intent-layer rules
> ("agent: do X") enforced attentionally degrade under load. The
> structural fix is a mechanical gate at the tool / harness / CI
> layer that makes the wrong behavior fail rather than the right
> behavior require attention. Registered upon third instance with
> the mechanical-gate solution shipping as the validation signal.

Three observed instances so far (AP #52 prose-discipline failure,
verbal-pivot pattern, bash-compound pattern). Promotion criterion is
the third instance *with the mechanical-gate solution actually
shipping* — Option 3's PR is that validation signal.

---
