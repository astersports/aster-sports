# scripts/

Repo-local operational scripts. Not part of the app bundle.

## check-file-length.sh

Flags any `.jsx` or `.js` file under `src/` that exceeds the 150-line limit from CLAUDE.md section 0, rule 9. Run locally before committing.

```bash
./scripts/check-file-length.sh
```

## rls-smoke.sh

Pilot-readiness guardrail. Hits the Supabase REST API with **only** the anon key (no user session) and expects zero rows from `event_rsvps`, `event_rides`, `event_duties`, `event_comments`. If any table returns rows, the org-scoped RLS policies from migration `009_fix_public_read_rls.sql` did not apply correctly and `009_revert.sql` must be run immediately.

### Env vars

| Var | Required | Default |
|---|---|---|
| `SUPABASE_URL` | no | `https://vrwwpsbfbnveawqwbdmj.supabase.co` |
| `SUPABASE_ANON_KEY` | **yes** | — |

The anon key is the public `anon` / `publishable` key from Supabase → Project Settings → API. It is safe to paste into a shell on a trusted machine; it is the same key bundled in the client build. Do not commit it.

### Run

```bash
export SUPABASE_ANON_KEY="eyJ..."
./scripts/rls-smoke.sh
```

Exits 0 if every table blocks the anon reader. Exits 1 and prints the leaking response body if any table returns rows.

### Dependencies

`curl`, `jq`. Both are pre-installed on the Crostini dev environment.
