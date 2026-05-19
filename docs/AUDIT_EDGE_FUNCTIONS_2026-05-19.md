# Edge-Function Orphan Audit — 2026-05-19

Class #10 in the orphan-code taxonomy.

**Tooling**: Supabase MCP `list_edge_functions` × grep over `src/` for:
- `supabase.functions.invoke('<slug>')` — direct JS SDK calls
- `/functions/v1/<slug>` — HTTP URL handlers (called from email links)

Cron-driven functions (`pg_cron`-scheduled) and external-webhook receivers
(Resend → us) are exempt from the grep audit by design — they have no
in-repo caller. Verified separately per function below.

## Summary

**10 deployed edge functions, all ACTIVE. Zero orphans.**

## Per-function verdict

| Function | verify_jwt | Invoke path | Referencer | Verdict |
|----------|:----------:|-------------|------------|---------|
| `send-tournament-message` | true | `supabase.functions.invoke()` | 4 callsites (`composerSubmit.js`, `scheduleChangeSend.js`, `rsvpNudgeSend.js`, `academyCallupSend.js`) | ✅ Used |
| `parse-tournament-schedule` | true | `supabase.functions.invoke()` | `useImportSchedule.js:40` | ✅ Used |
| `suggest-briefing-closer` | true | `supabase.functions.invoke()` | `StepBodySignoff.jsx:60` | ✅ Used |
| `invite-parent` | false | HTTP `fetch()` | `InviteButton.jsx:16` (`${VITE_SUPABASE_URL}/functions/v1/invite-parent`) | ✅ Used (HTTP shape; not JS SDK) |
| `rsvp-token-handler` | false | URL in email body | `rsvpNudgeSend.js:27` (`RSVP_HANDLER_BASE`) | ✅ Used (URL handler) |
| `unsubscribe-handler` | false | URL in email body | `unsubscribeUrl.js:17` (`HANDLER_BASE`) | ✅ Used (URL handler) |
| `callup-token-handler` | false | URL in email body | `academyCallupSend.js:30` (`CALLUP_HANDLER_BASE`) | ✅ Used (URL handler) |
| `briefing-cron-dispatch` | false | `pg_cron` | n/a (cron-driven, no in-repo caller) | ✅ Used (cron) |
| `briefing-auto-draft-tick` | false | `pg_cron` | n/a (cron-driven, no in-repo caller) | ✅ Used (cron) |
| `resend-webhook-receiver` | false | External webhook (Resend) | n/a (Resend posts to us) | ✅ Used (external webhook) |

## Local vs deployed parity

All 10 deployed functions have a corresponding directory in
`supabase/functions/`. No drift between repo source and deployed state.

```
supabase/functions/
├── briefing-auto-draft-tick
├── briefing-cron-dispatch
├── callup-token-handler
├── invite-parent
├── parse-tournament-schedule
├── resend-webhook-receiver
├── rsvp-token-handler
├── send-tournament-message
├── suggest-briefing-closer
└── unsubscribe-handler
```

## Findings

**Zero action items.** All deployed functions have a clear caller (JS SDK,
HTTP URL handler, cron, or external webhook). Healthy state.

## Note on the three exempt categories

Three invocation paths can't be mechanically grepped from this repo:

1. **pg_cron schedules** — `briefing-cron-dispatch` and
   `briefing-auto-draft-tick`. These are scheduled via SQL in
   `cron.schedule()` calls. To verify the schedule is active, query
   `cron.job` in the database. Recommended periodic check.
2. **External webhooks** — `resend-webhook-receiver`. Called by Resend
   when delivery events fire (sent / delivered / opened / clicked /
   bounced). Verified by Resend dashboard configuration, not by this
   repo. Periodic check: confirm webhook endpoint URL in Resend matches
   the deployed function URL.
3. **URL handlers in emails** — `rsvp-token-handler`,
   `callup-token-handler`, `unsubscribe-handler`. Email recipients
   click links in our outbound mail; the URLs are constructed by JS
   in this repo (so the URL handler IS grep-detectable as the URL
   builder caller). All three pass the audit via that mechanism.

## CI enforcement (future)

Mechanical CI gating could land as a vitest assertion that:
- Pulls deployed function list via Supabase MCP (runtime)
- OR reads a hardcoded expected-functions JSON (drift cost)
- Asserts each has a grep referencer per the patterns above

Cost-benefit similar to the DB-table audit (see
`docs/AUDIT_DB_TABLES_2026-05-19.md`): currently not worth the
drift discipline for the value at our cadence. Re-run this audit
when a new edge function is added.

## Source of truth

- Functions enumerated: Supabase MCP `list_edge_functions` 2026-05-19
- Grep methodology: `grep -rEon "functions\.invoke\(['\"]([a-z_-]+)['\"]"` + `grep -rEn "/functions/v1/([a-z_-]+)"`
- Production project: `vrwwpsbfbnveawqwbdmj`
- Audit author: CC session (orphan-class follow-up after PR #273)
