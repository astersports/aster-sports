# Disaster Recovery — Aster Sports

**Created:** 2026-06-02 to close Wave 3.B #25 P0-1 from `AUDIT_WAVE_3B_2026-05-29.md`.
**Status:** runbook only — procedures here have NOT been drilled against staging (P0-2 is the standing owner-action item; see §10).
**Owner:** frank@astersports.co (Frank Samaritano)
**Audience:** the human who finds production broken at 11 PM. Skim §1 for orientation, jump to the §3 scenario that matches the failure, do the steps.

---

## 1. PLATFORM IDENTITY

| Field | Value |
|---|---|
| Platform name | Aster Sports |
| Parent company | Olive Juice Inc. |
| Vercel project | `aster-sports` (org `legacyhoopers-projects`) |
| Live domains | `astersports.app` (primary), `.io` / `.co` (redirects pending Step 6) |
| Repo | `github.com/LegacyHoopers/aster-sports` (renamed from `skyfire-app` 2026-06-08; GitHub redirects the old name) |
| Supabase project | `vrwwpsbfbnveawqwbdmj` (project ref) |
| Supabase tier | Pro (daily backups + PITR enabled) |
| First tenant | Legacy Hoopers (`org_id` in `organizations` table) |

## 2. WHAT WE GUARANTEE

| Surface | RTO (max time to restore) | RPO (max data loss) | How |
|---|---|---|---|
| Vercel app rollback | ~1 min | 0 | Vercel UI "Promote" prior deploy |
| Edge function rollback | ~5 min | 0 | CI redeploys on push to `main`; revert PR + merge |
| Supabase PITR restore | 1–4 hr | ~5 min | Supabase Pro PITR (point-in-time recovery, last ~7 days) |
| Supabase daily backup | 1–6 hr | ~24 hr | Supabase Pro daily snapshot, retained 30 days |
| Secret rotation | ~30 sec | 0 | `UPDATE public.app_secrets SET value = '…', rotated_at = now() WHERE name = '<name>';` |

**Not guaranteed (no procedure today — flag these as P1/P0 if they ever bite):**
- Sentry source-map upload (3B.25.P1 — debug context lost without it)
- LeagueApps original JSON archive (3B.25.P1 — financial reconciliation source not preserved)
- Resend bounce-history export (no tooling)
- Cross-region failover (Supabase Pro is single-region — `us-east-1`)

---

## 3. SCENARIOS

### Scenario 1 — Production app is completely broken (most recent deploy regressed)

**RTO:** ~1 min · **RPO:** 0

1. Vercel dashboard → Project `aster-sports` → Deployments tab.
2. Find the last `Ready` deployment that pre-dates the regression. Click `...` → **Promote to Production**.
3. Confirm in browser: hard-reload `astersports.app`.
4. Open a PR that reverts the offending merge commit on `main`. Auto-merge per §15 once CI green.

**Verify:** Vercel dashboard shows the promoted deploy as "Production"; the regression symptom is gone.

### Scenario 2 — One edge function regressed (parents can't RSVP / invite link broken / push undelivered)

**RTO:** ~5 min · **RPO:** 0

1. Identify the offending PR (recent merge that touched `supabase/functions/<name>/`).
2. `git revert <sha>` on `main`, push, open PR with auto-merge.
3. `deploy-edge-functions.yml` (path-scoped) redeploys only the changed function.
4. While waiting, manually redeploy from Supabase dashboard (Functions → `<name>` → Redeploy) if speed matters.

**Verify:** Supabase dashboard shows the function's "Last deployed" timestamp updated; smoke-test the failing path.

### Scenario 3 — Bad schema migration shipped to production

**RTO:** 30 min – 2 hr · **RPO:** 0 (if caught fast) up to ~5 min (if PITR needed)

1. **First** — if the migration was applied via MCP `apply_migration` and you have a backout migration ready: write the down-migration as a new file (do NOT edit the bad one — see CLAUDE.md §12 migration immutability rule), apply via MCP.
2. If the data is corrupt and a clean rollback isn't possible: **PITR.** Supabase dashboard → Database → Backups → PITR. Pick a timestamp ~30 seconds before the bad migration ran. Restore to a **branch project first** (do not overwrite production). Verify schema + sample data, then promote.
3. If the migration ran against production but the repo mirror is wrong (AP #21 drift): create the canonical mirror file with the production version string as filename prefix.

**Verify:** schema matches expected state via `mcp__supabase__list_tables` + spot-check critical RLS policies via `get_advisors`.

### Scenario 4 — Production data corruption / accidental deletion (admin-facing operator error)

**RTO:** 1–4 hr · **RPO:** ~5 min (PITR) or ~24 hr (last daily snapshot)

1. Supabase dashboard → Database → Backups → **Point-in-Time Recovery**.
2. Pick a timestamp before the corruption.
3. Restore to a **new branch project** (always; never overwrite production directly).
4. Inspect the restored data: `SELECT * FROM <affected_table> WHERE …` via the branch project SQL editor.
5. If the restore looks clean: cherry-pick the affected rows via `INSERT INTO production.<table> SELECT * FROM branch.<table> WHERE …`. Or, if the whole table needs to come back, swap projects.

**Verify:** affected user/tenant can see the restored state in-app.

### Scenario 5 — Supabase Auth disaster (parents can't log in)

**RTO:** ~15 min (config) to ~2 hr (PITR if auth.users corrupted) · **RPO:** ~5 min PITR

1. Check Supabase dashboard → Authentication → Status. If the platform is degraded, watch `status.supabase.com` and wait.
2. If config-driven (custom SMTP misconfigured, JWT secret rotated incorrectly): Supabase dashboard → Authentication → Email Templates / SMTP Settings. Revert to defaults if needed.
3. If `auth.users` row was deleted/corrupted: PITR per Scenario 4, restore the row, re-attach the linked `staff_profiles` / `guardians` records.
4. If the Resend custom SMTP broke (parents get invite emails but links fail): see Scenario 8.

**Verify:** sign-in via `astersports.app/login` works for both an admin account and a parent account.

### Scenario 6 — Compromised secret (token leaked, API key exposed, JWT signing key suspected)

**RTO:** ~30 sec for rotation + ~5 min for redeploy if applicable · **RPO:** 0

All secrets except `RESEND_WEBHOOK_SECRET` (platform-managed by Resend) live in `public.app_secrets`. Rotation:

```sql
-- Generate a fresh secret (run via Supabase SQL Editor with service role, or via MCP):
UPDATE public.app_secrets
   SET value = encode(extensions.gen_random_bytes(32), 'base64'),  -- or 'hex' for cron_secret
       rotated_at = now()
 WHERE name = '<secret_name>';
```

**Known secrets** (per AP #33):

| Name | Used by | Generation | Notes |
|---|---|---|---|
| `rsvp_token_secret` | rsvp-token-handler (HMAC) | `gen_random_bytes(32)` base64 | Rotation invalidates all outstanding RSVP token links — parents must re-tap from next email |
| `callup_token_secret` | callup-token-handler (HMAC) | same | Same invalidation behavior |
| `feedback_token_secret` | feedback-token-handler (HMAC) | same | Same |
| `unsubscribe_secret` | unsubscribe-handler (HMAC) | same | Outstanding unsubscribe links break — low blast radius |
| `cron_secret` | briefing-cron-dispatch + briefing-auto-draft-tick (Bearer auth, shared with pg_cron) | `gen_random_bytes(32)` hex | Rotation requires updating `pg_cron` job definition (see §5) |
| `supabase_jwt_secret` | briefing-cron-dispatch (mints user JWTs) | **Read from Supabase dashboard** (Settings → API → JWT Settings) | NEVER overwrite with a generated value; must match the project's auth secret |
| `anthropic_api_key` | parse-tournament-schedule | From Anthropic console | Outbound; rotate via `console.anthropic.com` first, then UPDATE here |
| `vapid_public_key` + `vapid_private_key` | send-push | `npx web-push generate-vapid-keys` | Rotation invalidates all push subscriptions — users must re-grant push permission |

**Platform-managed exception:** `RESEND_WEBHOOK_SECRET` lives in `Deno.env` because Resend rotates it. Rotate via Resend dashboard → Webhooks → edit → "Reveal signing secret"; copy the new value into the Supabase function env var.

### Scenario 7 — Domain / DNS failure (astersports.app down or misrouted)

**RTO:** ~5–30 min · **RPO:** 0 (no data path)

1. Vercel dashboard → Project → Settings → Domains. Confirm `astersports.app` is bound to the current production deployment.
2. If the cert is invalid/expired: Vercel re-issues automatically; force via "Renew" button.
3. If the DNS is wrong: check the apex `A` record + `CNAME` in your DNS provider (Vercel-hosted DNS as of cutover; if you moved DNS elsewhere, check there).
4. Fallback URL (during incident only): the Vercel project's branch alias `aster-sports-git-main-legacyhoopers-projects.vercel.app` serves the current `main` deploy — use it to confirm the app itself is up if the custom domain is the thing that's down. (The legacy `skyfire-app.vercel.app` alias was removed in the 2026-06-08 rename.)

**Verify:** `dig astersports.app` returns Vercel IPs; HTTPS handshake works.

### Scenario 8 — Outbound email broken (Resend outage, domain de-verified, sender flagged as spam)

**RTO:** depends on cause; ~1 hr typical · **RPO:** no data loss (queued emails retry)

1. Check `status.resend.com` — if Resend platform is down, wait.
2. Resend dashboard → Domains → `astersports.app`. If status is not "Verified", check the DKIM/SPF/DMARC records in Vercel DNS; re-verify.
3. Check Resend's "Suppressions" tab for the affected recipient. If their address was bounced/marked as spam, remove the suppression.
4. Briefing engine: the `send-tournament-message` and `briefing-auto-draft-tick` functions log Resend errors to `event_notifications.failure_reason` for change-alert dispatches. Query that for the actual error.
5. If suspected outbound-sender issue: temporarily revert `FROM_EMAIL` to a known-good Resend-verified address (rotate via PR — fast cutover via #629 / #634 pattern).

**Verify:** Send a test parent invite to `olivejuiceinc1@gmail.com`; arrives with working links and from `noreply@astersports.app`.

### Scenario 9 — Account takeover / breach response

**RTO:** ~15 min to contain · **RPO:** depends on how long the compromise lasted

1. **Contain first, investigate after.**
2. Suspect compromised user account: Supabase dashboard → Authentication → Users → find user → "Sign out user" + revoke refresh tokens.
3. Suspect compromised admin: rotate `supabase_jwt_secret` (Scenario 6) — invalidates all sessions platform-wide; everyone must log back in. Then suspend the compromised admin's `user_roles` row.
4. Suspect compromised app_secret (e.g., HMAC key for tokens): rotate per Scenario 6.
5. Suspect compromised Supabase service_role key: Supabase dashboard → Settings → API → reset service_role key. Update `SUPABASE_SERVICE_ROLE_KEY` in every edge function env var (Supabase dashboard → Functions → each function → Settings).
6. **Logging:** `pii_audit_log` table records read/write of guardian PII. Query for the suspicious user's `actor_user_id` to scope the blast radius.

**Verify:** No new sessions can be created with compromised credentials; affected users notified per applicable breach-notification law (currently undefined — see §10 P0-2 open item).

### Scenario 10 — Total environment loss (Vercel account locked / Supabase project deleted / GitHub repo lost)

**RTO:** 4–24 hr · **RPO:** ~24 hr (last daily backup)

This is the catastrophic worst case. Today's posture: low-probability, high-impact, no automated recovery.

1. **Vercel:** if account locked, contact Vercel support; backup deploy artifacts are not retained outside Vercel. The repo at `github.com/LegacyHoopers/aster-sports` is the source of truth — clone + redeploy from there to a new Vercel project.
2. **Supabase:** if project deleted, daily backups are NOT retained after project deletion (per Supabase docs). The only protection is the migrations directory in the repo — provisioning a new project + running all migrations reproduces the schema (data is lost). Owner action: periodically `pg_dump` to off-platform storage (NOT IMPLEMENTED today; flagged as 3B.25.P1).
3. **GitHub:** if repo lost, the local clone on Frank's machine is the only copy. Push to a fresh GitHub repo immediately.

**Verify:** `astersports.app` serves the app; sign-in works; recent events visible.

---

## 4. MIGRATION DRIFT RECOVERY (AP #21 mirror-discipline)

Two failure modes to recognize:

**(a) Repo has a `.sql` file that was never applied to production.** Symptom: `supabase migration list` shows the file as pending. Action: apply via MCP `apply_migration` if intent is to ship, or delete the file if obsolete.

**(b) Production has a registered migration version that doesn't exist in the repo (orphan apply).** Symptom: production schema has a table/column/function the repo can't explain. Action: backfill the mirror `.sql` file with the canonical version string as filename prefix (per AP #21).

**The 5 originally-documented ghost migrations** (§5 of CLAUDE.md) are NOW materialized in the repo as of 2026-05-28 (see Wave 2.A #23 reconciliation). 3B.25.P0-3 (this audit) confirmed; closed by §4.AS.

---

## 5. pg_cron JOB RECOVERY

Two active jobs as of 2026-06-02:
- `briefing-cron-dispatch` — `* * * * *` (every minute)
- `briefing-auto-draft-tick` — `* * * * *` (every minute)

If a job stops firing or fails consistently:

```sql
-- Inspect recent runs (SQL-layer success; see PATTERN HOTEL warning below):
SELECT jobname, status, return_message, start_time
  FROM cron.job_run_details
 WHERE jobname IN ('briefing-cron-dispatch', 'briefing-auto-draft-tick')
 ORDER BY start_time DESC LIMIT 20;

-- Canonical HTTP-layer health (per Wave 3.A #22 P0-1 — SQL "success" only means enqueued):
SELECT status_code, count(*)
  FROM net._http_response
 WHERE created > now() - interval '1 hour'
 GROUP BY status_code;
```

To re-create a job after rotation of `cron_secret` (Scenario 6):

```sql
-- Unschedule the old one:
SELECT cron.unschedule('<jobname>');

-- Re-schedule with the new secret (see prior migrations 20260510225122_wave_4_3_f_cron_secret_to_app_secrets.sql for the canonical pattern):
SELECT cron.schedule('<jobname>', '* * * * *', $$
  SELECT net.http_post(
    url := 'https://vrwwpsbfbnveawqwbdmj.supabase.co/functions/v1/<fn>',
    headers := jsonb_build_object('Authorization', 'Bearer ' || (SELECT value FROM public.app_secrets WHERE name='cron_secret'))
  );
$$);
```

---

## 6. PUBLIC STATUS SOURCES (to consult during an incident)

- `status.supabase.com` — platform-wide DB / Auth / Functions health
- `status.vercel.com` — deployment + edge runtime
- `status.resend.com` — outbound email
- `status.anthropic.com` — only matters for `parse-tournament-schedule` (admin-facing tool)
- `status.github.com` — repo / Actions / CI

---

## 7. ON-CALL CONTACTS

| Surface | Person | Contact |
|---|---|---|
| Platform owner | Frank Samaritano | `frank@astersports.co` (auth login + admin) · `olivejuiceinc1@gmail.com` (operational) |
| Coaching | Kenny Lane | `coachkenny@legacyhoopers.org` |
| Supabase support (Pro tier) | Supabase | dashboard support widget; ~24 hr response |
| Vercel support (free tier) | Vercel | community Discord / email |

---

## 8. SECRET ROTATION CADENCE (recommended baseline)

No automated rotation today. Recommend manual cadence:

| Secret class | Cadence | Reason |
|---|---|---|
| HMAC token secrets (rsvp/callup/feedback/unsubscribe) | Every 12 months | Low compromise risk (server-side only); rotation invalidates outstanding token links |
| `cron_secret` | Every 6 months | Bearer-shared between Postgres + edge function; rotation requires pg_cron job re-registration |
| `supabase_jwt_secret` | Rotate ONLY when Supabase platform rotates the project's JWT secret | Must match auth; do not rotate independently |
| `anthropic_api_key` | Per Anthropic best-practice + immediately on key exposure | Outbound, can be rotated on Anthropic side first |
| `vapid_*` keys | Avoid rotation if possible | Rotation invalidates ALL push subscriptions; users must re-grant |
| Supabase service_role key | Rotate immediately on suspected exposure | Highest blast radius — every edge function must update its env var |

---

## 9. DRILL HISTORY

| Date | Scenario | Outcome | Lessons |
|---|---|---|---|
| _(none yet)_ | — | — | Backup-to-staging drill is the standing P0-2 (§10). |

---

## 10. STANDING OWNER ACTION ITEMS

Open items the runbook surfaces but does NOT itself close:

- **3B.25.P0-2 — Backup never restored to staging.** One-time drill: restore the last daily Supabase backup to a new Supabase project; document RTO observed; verify schema parity. Until done, the RTO numbers in §2 are estimates, not measured values.
- **3B.25.P1 — No off-platform DB backup.** Supabase daily backups vanish if the project is deleted. Recommend a weekly `pg_dump` to off-platform storage (S3 / Google Drive / GitHub LFS).
- **3B.25.P1 — Sentry source-map upload absent.** Production stack traces are minified-only; debugging is harder than it has to be. Add `@sentry/vite-plugin` config + auth token.
- **3B.25.P1 — LeagueApps source JSON not archived.** The original import files are not in the repo; financial reconciliation against the imports can't be re-run.
- **3B.27.P0-2 — No breach-notification policy.** Scenario 9 step 6 names "applicable breach-notification law" as currently undefined; resolves with the privacy policy / ToS work.

---

**Doctrine cross-references:** AP #21 (migration mirror), AP #25 (no compound onConflict spec), AP #33 (secrets in app_secrets), AP #45 (ledger reconciliation), AP #57 (REVOKE FROM anon), §4.AS (audit campaign close), §16.10 (bundle budget).
