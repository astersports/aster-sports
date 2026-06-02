# Secret Rotation — Aster Sports

**Created:** 2026-06-02 to close Wave 3.B #25 P1 (no centralized rotation doc + no cadence + no rotation log).
**Companion:** `docs/DISASTER_RECOVERY.md` (§6 scenarios, §8 cadence table). This doc is the procedural detail; the runbook is the use-it-during-incident reference.
**Audit hook:** rotation events SHOULD be recorded in this file's §5 "Rotation history" table after each rotation.

---

## 1. WHAT LIVES WHERE

Three storage surfaces. Each has a different rotation procedure.

| Where | What | Rotation surface |
|---|---|---|
| `public.app_secrets` | HMAC token secrets (rsvp/callup/feedback/unsubscribe), `cron_secret`, `supabase_jwt_secret`, `anthropic_api_key`, VAPID public/private keys, and (pending Wave 3.B #28 / batch 8) `resend_api_key` | SQL `UPDATE public.app_secrets SET value = '...', rotated_at = now() WHERE name = '<name>'` — operator-driven via MCP / SQL editor |
| Supabase function env (Deno.env) | `RESEND_WEBHOOK_SECRET` (platform-managed by Resend; AP #33 exception) | Supabase dashboard → Functions → `<fn>` → Settings → Environment variables |
| Vercel project env | `VITE_SENTRY_DSN`, `VITE_POSTHOG_KEY`, `VITE_APP_BASE_URL`, `VITE_SUPABASE_*` | Vercel dashboard → Project → Settings → Environment Variables |
| Supabase project settings | `SUPABASE_SERVICE_ROLE_KEY`, project JWT secret, anon key | Supabase dashboard → Settings → API |

`public.app_secrets` is the **canonical home for shared secrets** per AP #33. New shared secrets land there unless they're platform-managed (AP #33's documented exception).

---

## 2. CADENCE (recommended baseline)

Re-stated from `DISASTER_RECOVERY.md §8` for ease of reference:

| Class | Cadence | Rationale |
|---|---|---|
| HMAC token secrets (`rsvp_token_secret`, `callup_token_secret`, `feedback_token_secret`, `unsubscribe_secret`) | Every 12 months | Low compromise risk (server-side only); rotation invalidates outstanding token links — minor parent inconvenience on the next briefing send |
| `cron_secret` | Every 6 months | Bearer-shared between Postgres pg_cron and 2 edge functions; rotation requires unscheduling + rescheduling pg_cron jobs (see §3.2) |
| `supabase_jwt_secret` | Only when Supabase platform rotates the project JWT secret | Must match the project's actual auth secret; do NOT rotate independently |
| `anthropic_api_key` | Per Anthropic best-practice OR immediately on key exposure | Outbound API key — rotate via Anthropic console first, then UPDATE here |
| `resend_api_key` | Every 12 months OR immediately on Resend dashboard rotation | Outbound API key |
| `vapid_public_key` + `vapid_private_key` | **Avoid rotating** | Rotation invalidates ALL existing push subscriptions; every user must re-grant push permission. Treat as effectively-permanent unless compromised |
| `RESEND_WEBHOOK_SECRET` (Deno.env) | Whenever Resend rotates it (operator-checked monthly) | Platform-managed |
| Supabase `SUPABASE_SERVICE_ROLE_KEY` | Immediately on suspected exposure; no scheduled rotation | Highest blast radius — every edge function's env var must update |
| Vercel + Supabase platform JWT secret | When platform rotates | Out of operator control |

**No automated rotation today.** Manual cadence; this doc + the §5 log are the discipline.

---

## 3. PROCEDURES

### 3.1 Rotating an `app_secrets` HMAC/token secret (rsvp / callup / feedback / unsubscribe)

```sql
update public.app_secrets
   set value = encode(extensions.gen_random_bytes(32), 'base64'),
       rotated_at = now()
 where name = 'rsvp_token_secret';   -- or callup_token_secret / feedback_token_secret / unsubscribe_secret
```

**Side effect:** all outstanding token URLs minted before the rotation become invalid. Parents who tap an old briefing's RSVP link see "Link expired" and need to wait for the next briefing send to get a fresh link. Plan rotations between briefing cycles to minimize the gap.

### 3.2 Rotating `cron_secret`

```sql
-- 1. Generate the new value:
update public.app_secrets
   set value = encode(extensions.gen_random_bytes(32), 'hex'),
       rotated_at = now()
 where name = 'cron_secret';

-- 2. Re-register pg_cron jobs (they captured the OLD value at scheduling time):
--    Unschedule + re-schedule per job. See briefing-cron-dispatch + briefing-auto-draft-tick
--    job definitions in mig 20260510225122_wave_4_3_f_cron_secret_to_app_secrets.sql + companions.
select cron.unschedule('briefing-cron-dispatch');
select cron.unschedule('briefing-auto-draft-tick');
-- Re-create with the canonical pattern (see DISASTER_RECOVERY.md §5 for the SELECT cron.schedule(...) template).
```

**Side effect:** brief window where pg_cron tries to call edge functions with the OLD secret and gets 401. The receiving edge functions read the secret on each request via `getAppSecret`, so once the UPDATE lands they accept the new value immediately. Re-scheduling pg_cron with the new value closes the window.

### 3.3 Rotating `anthropic_api_key`

```bash
# 1. Anthropic console → API Keys → revoke the old key + generate a new one
# 2. Apply the new value:
```

```sql
update public.app_secrets
   set value = '<paste the new key>',
       rotated_at = now()
 where name = 'anthropic_api_key';
```

**Side effect:** `parse-tournament-schedule` calls fail with 401 between revoke and UPDATE. Schedule rotation outside admin-active hours.

### 3.4 Rotating `resend_api_key`

Same pattern as `anthropic_api_key` once it migrates from `Deno.env` to `app_secrets` (Wave 3.B #28 / batch 8 follow-up). Until then, rotate via Vercel project env vars (Resend dashboard → API Keys → new key → paste into Vercel `RESEND_API_KEY` for each function that uses it → redeploy).

### 3.5 Rotating Supabase `SUPABASE_SERVICE_ROLE_KEY` (compromise response)

```
1. Supabase dashboard → Settings → API → Reset service_role key
2. New key appears. Copy it.
3. For EACH edge function that uses service-role auth (currently: all of them
   in supabase/functions/), Supabase dashboard → Functions → <fn> → Settings →
   update SUPABASE_SERVICE_ROLE_KEY env var → save.
4. Verify each function still works (smoke a parent invite, a briefing draft,
   a cron tick).
5. Update Vercel env if any client-side code references it (it should not, by design).
```

**Side effect:** brief 401 window per function during the env-var update. Schedule outside parent-active hours; pre-stage the new key in a notes app, do all functions in quick succession.

### 3.6 Re-affirming `supabase_jwt_secret` after Supabase rotates the project JWT secret

```
1. Supabase dashboard → Settings → API → JWT Settings → reveal current value.
2. UPDATE the cached copy in app_secrets:
```

```sql
update public.app_secrets
   set value = '<paste from Supabase dashboard>',
       rotated_at = now()
 where name = 'supabase_jwt_secret';
```

Only happens when Supabase platform-rotates (rare). Do NOT generate this value — it must match the actual project JWT secret.

---

## 4. PRE-ROTATION CHECKLIST

Before any rotation, sanity-check:

- [ ] **Notify operator / on-call** if rotation affects parent-facing flows (HMAC token secrets, service_role)
- [ ] **Read the canonical health surface** before + after: `SELECT * FROM public.cron_http_health_v;` for cron-affecting rotations
- [ ] **Confirm no in-flight briefing send** — `SELECT count(*) FROM comms_messages WHERE status = 'queued';` should be 0 (or wait for it to drain)
- [ ] **Set a calendar alarm for 10 min after rotation** to verify the canonical health surface still green
- [ ] **Add an entry to §5 below** (this is the discipline — see AP #45 for the doctrine on documenting changes)

---

## 5. ROTATION HISTORY (append-only)

Per AP #45 + DR runbook §9 discipline. Each rotation appends one row.

| Date (UTC) | Secret | Reason | Operator | Notes |
|---|---|---|---|---|
| _(no rotations recorded yet)_ | — | — | — | — |

When recording: avoid logging the secret VALUE itself. Reason + operator + timestamp are the audit fields. The actual value is queryable from `app_secrets.rotated_at` if needed.

---

## 6. CROSS-REFERENCES

- `DISASTER_RECOVERY.md §6` — compromised-secret scenario steps
- `DISASTER_RECOVERY.md §8` — cadence table (this doc restates with more procedural detail)
- `CLAUDE.md AP #33` — secrets-in-app_secrets doctrine + exception
- `CLAUDE.md AP #23 + #57` — REVOKE FROM PUBLIC + anon discipline for new SECDEF functions that READ secrets
- `supabase/migrations/20260510002836_app_secrets_table_replaces_guc_for_token_functions.sql` — the source-of-truth migration for the `app_secrets` table
