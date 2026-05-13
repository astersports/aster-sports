# NEW CHAT STARTER PROMPT — Skyfire / Ember Build

## Instructions for Frank (copy-paste as first message in new chat)

The text below (between the `===` markers) is the exact opening message to paste into the new Claude chat. It forces the new chat to verify its understanding before doing ANY execution work. This prevents the "working from stale memory" failure that caused Session C to miss 15+ shipped features.

---

# PASTE THIS EXACTLY INTO NEW CHAT:

===

I'm continuing a Skyfire/Ember build from a prior chat. This is a mission-critical project with 30+ locked architectural decisions, a working production Supabase database with 36 tables, and 110 React components already shipped.

Before you write any code, generate any SQL, or take any execution step, you MUST complete these 4 verifications and report back to me. Do not skip any of them.

## Verification 1 — Read the state-of-affairs document

Read `/mnt/project/STATE_OF_AFFAIRS_L99_v5.md` end to end. This is the authoritative source for everything the prior chat established. If you find conflicting information in older docs (SKYFIRE_LEVEL99_MASTER.md, GENERATE_FRESH_AUDIT.md, SESSION_HANDOFF__2_.md, STATE_OF_AFFAIRS_L99.pdf, STATE_OF_AFFAIRS_L99_v3.md, STATE_OF_AFFAIRS_L99_v4.md), the v5 document takes precedence.

## Verification 2 — Read the build queue

Read `/mnt/project/SKYFIRE_BUILD_QUEUE_v2.md` end to end. This replaces SKYFIRE_BUILD_QUEUE.md which was stale by 4+ days and missing 15+ shipped features. Use v2 exclusively.

## Verification 3 — Verify filesystem state

Run `ls /mnt/project/ | wc -l` and confirm the result is 215 or higher. This confirms the complete project knowledge upload (110 JSX components + 29 hooks + 16 lib files + 13 migration files + all docs + screenshots + seed data).

Also check that these 4 specific files exist:
- `/mnt/project/EventDetailHeader.jsx` (the Phase 0A-1 fix location)
- `/mnt/project/SchedulePage.jsx` (the Phase 0A-2 fix location)
- `/mnt/project/RosterSection.jsx` (the Phase 0A-3 fix location)
- `/mnt/project/MIGRATION_013_READY.sql` (the next migration to ship, pre-written in this handoff)

## Verification 4 — Summarize back to me

After completing 1-3, summarize to me in EXACTLY this format:

```
## Ground truth confirmed

**Single next action:** [one sentence describing what ships first]

**Current migration number ready to ship:** [number, or "none queued"]

**3 open decisions needing my input:** 
1. [decision 1]
2. [decision 2]
3. [decision 3]
(If fewer than 3 open, note that)

**Top risk for this session:** [one sentence]

**Phase 0A status:** [COMPLETE / IN PROGRESS / NOT STARTED]

**Environment constraints:** [Docker available Y/N, RAM available, preferred migration workflow]
```

## CRITICAL RULES — Do not break these

1. **Do not execute anything** until I confirm your summary is correct. If your summary is wrong, we pause and investigate before any work.

2. **Do not re-ask the 30+ locked decisions.** These are documented in the v3 state-of-affairs. Treat them as final. Examples: Ember is the platform name, density toggle has 3 levels, coach compensation uses dual-entry, etc.

3. **Do not claim features are shipped without evidence.** Use the build queue v2 as source of truth. If you think something is shipped but it's not in BUILD_QUEUE_v2 as SHIPPED, verify via filesystem grep before claiming.

4. **Update BUILD_QUEUE_v2 immediately after every shipped feature.** Not at end of session. Immediately.

5. **Never write SQL that uses DELETE or destructive UPDATE without my explicit approval** in the same message. Additive migrations (CREATE TABLE IF NOT EXISTS, ADD COLUMN IF NOT EXISTS) are fine to propose and ship.

6. **Follow the 150-line file cap** enforced by scripts/check-file-length.sh. Split components before delivering.

7. **Deploy chain is:** `git add -A && git commit && git push origin v2 && git checkout main && git merge v2 && git push origin main && git checkout v2`. Always exact sequence.

8. **SQL migrations are NOT run via Claude Code.** I paste them into Supabase SQL Editor directly. My Chromebook has 4GB RAM so Docker-based CLI sync doesn't work. CLI is authenticated for `supabase migration repair` commands only.

9. **Answer first, then detail.** No preamble. No em dashes. No "leverage/utilize/seamless/robust/streamline."

10. **Design tokens absolute:** Inter font, 4px grid, 10px card radius, 44px tap targets, Lucide at stroke-width 1.75, CSS variables only (`--em-*` current, `--em-*` after Phase 0C).

Ready to begin verification. Post your summary when complete.

===

## After the new chat posts its summary

Read the summary carefully. Verify each claim against the state-of-affairs document. If the summary is accurate, reply:

> "Summary confirmed. Proceed with [whatever you want to do first]."

If the summary has errors, reply:

> "Summary has errors. Claim [X] is wrong — actual state is [Y] per [evidence]. Please re-verify and re-summarize."

Do not authorize any execution work until the summary is accurate.

---

## Why this protocol matters

The previous handoff failed because:
1. The build queue (April 19) was stale by 4+ days, missing 15+ shipped features
2. The new chat trusted the stale doc and wasted time rebuilding features that already worked
3. The new chat also proposed "new" schema that already existed in production
4. No verification step caught these drift issues before execution started

This protocol forces verification BEFORE execution. 2 minutes of reading saves 2+ hours of wasted work.
