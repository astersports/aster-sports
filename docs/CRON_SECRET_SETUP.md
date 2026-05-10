# Cron Secret Setup Runbook

The two cron-driven edge functions in this project share a single
shared-secret bearer auth model:

- `briefing-cron-dispatch` (wave 3.17) — scheduled-send dispatcher.
- `briefing-auto-draft-tick` (wave 4.3-A) — auto-draft engine.

Both functions read `CRON_SECRET` from their env vars and reject any
request whose `Authorization: Bearer <token>` doesn't match. The
matching pg_cron jobs (`briefing-dispatch-tick` and
`briefing-auto-draft-tick`) read the same secret from the database
GUC `app.settings.cron_secret` and inject it into their HTTP POSTs.

Until BOTH the DB GUC and the function env var are set to the same
value, every cron tick gets a 401 — which is correct fail-loud
behavior and produces no draft / send activity.

## One-time setup (run once per environment)

### 1. Generate the secret

```bash
openssl rand -hex 32
```

Save the output. You'll paste it into two places below. Treat it like
any other production secret — do not commit it, do not Slack it,
share via 1Password or equivalent if multiple admins manage the org.

### 2. Set the database GUC

Supabase dashboard → **Database** → **Configuration** → **Custom Postgres Config**:

- Add a new entry:
  - Name: `app.settings.cron_secret`
  - Value: `<the secret from step 1>`
- Save. Supabase restarts the DB connection pool automatically.

Verify via SQL editor:
```sql
SELECT current_setting('app.settings.cron_secret', true);
```
Should return the secret you set (may take a few seconds for the
session pool to refresh).

### 3. Set the function env vars

Supabase dashboard → **Functions** → **Secrets** (project-wide secrets
panel; secrets are shared across all functions in the project).

- Add a new secret:
  - Name: `CRON_SECRET`
  - Value: `<same secret from step 1>`
- Save. Both `briefing-cron-dispatch` and `briefing-auto-draft-tick`
  pick it up automatically (no redeploy needed).

### 4. Verify end-to-end

After both step 2 and step 3 are complete, the next minute-tick
should succeed:

```sql
-- Check that recent cron runs returned 200, not 401:
SELECT
  start_time, end_time, status, return_message
FROM cron.job_run_details
WHERE jobid IN (
  SELECT jobid FROM cron.job
  WHERE jobname IN ('briefing-dispatch-tick', 'briefing-auto-draft-tick')
)
ORDER BY start_time DESC LIMIT 10;
```

You can also force a manual invocation without waiting for the cron:

```bash
CRON_SECRET="<the secret>" ./scripts/trigger-cron-dispatch.sh briefing-auto-draft-tick
```

A successful response looks like:

```json
{
  "processed": 22,
  "drafts_created": 0,
  "results": [
    {"trigger_id": "...", "org_id": "...", "kind": "weekly_digest", "skipped": "not_in_window"},
    {"trigger_id": "...", "org_id": "...", "kind": "game_recap", "skipped": "not_implemented"},
    ...
  ]
}
```

`drafts_created` will be 0 outside the Sunday 8am ET window — that's
the TZ gate doing its job. Test on a Sunday between 08:00-08:59 ET to
see `drafts_created: 1`.

## Rotation

If you ever need to rotate the secret:

1. Generate a new value (`openssl rand -hex 32`).
2. Update the function env var FIRST (step 3 above).
3. Update the DB GUC (step 2 above).

Brief 401 window between the two updates is fine — affected ticks
just don't run, the next tick after both updates succeed.

## Why two functions, one secret

`briefing-cron-dispatch` and `briefing-auto-draft-tick` are
separate functions by design (see CLAUDE.md anti-pattern #28
context for the registry-vs-bespoke split). They share a secret
because:

- The cron jobs run as the same DB role and read the same GUC.
- Operationally, having one secret to manage is simpler than two.
- Both functions are owned by the same team and serve cron-only
  traffic — no risk surface from sharing.

If a future wave adds a function with a fundamentally different
trust model (e.g., a third-party webhook receiver), it should get
its own secret.
