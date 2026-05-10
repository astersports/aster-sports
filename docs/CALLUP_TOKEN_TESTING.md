# Callup Token Testing Runbook

End-to-end test paths for the wave 4.3-D callup token infrastructure
(`mint_callup_token`, `verify_callup_token`, `apply_callup_decline`,
`callup-token-handler` edge function).

## A. RPC roundtrip via Supabase MCP execute_sql

Run these queries via the Supabase SQL editor or MCP `execute_sql`
to confirm the mint/verify cycle.

### A1. Mint a token

```sql
WITH eligible AS (
  SELECT e.id AS event_id, tp.player_id, pg.guardian_id
  FROM events e
  JOIN team_players tp ON tp.team_id = e.team_id
  JOIN player_guardians pg ON pg.player_id = tp.player_id
  WHERE e.team_id IN (SELECT id FROM teams WHERE org_id='e3e95e21-3571-4e9a-985a-d5d01480d4a6')
    AND e.start_at > now()
  LIMIT 1
)
SELECT
  event_id, player_id, guardian_id,
  mint_callup_token(event_id, player_id, guardian_id, 'accept') AS token
FROM eligible;
```

Expected: a single row with three UUIDs and an opaque `token` string
in `payload.signature` shape (~200 chars).

### A2. Verify the token

```sql
SELECT verify_callup_token('<paste token from A1 here>');
```

Expected: a JSONB object with keys `e`, `p`, `g`, `r='accept'`, `n`,
`x`. No `_already_used` flag.

### A3. Verify-after-use

```sql
-- Insert the nonce (simulates the edge function's lock).
INSERT INTO callup_token_uses (nonce, event_id, player_id, guardian_id, response)
VALUES (
  (verify_callup_token('<token from A1>'))->>'n',
  '<event_id>'::uuid, '<player_id>'::uuid, '<guardian_id>'::uuid,
  'accept'
);

-- Re-verify; should now return _already_used: true.
SELECT verify_callup_token('<token from A1>');
```

Expected: same payload + `"_already_used": true`.

### A4. Bad signature

```sql
SELECT verify_callup_token('payload.bogus_signature');
```

Expected: NULL.

### A5. Bad response in mint

```sql
SELECT mint_callup_token(
  '<event_id>'::uuid, '<player_id>'::uuid, '<guardian_id>'::uuid,
  'maybe'
);
```

Expected: ERROR `invalid response: maybe`.

### A6. Cleanup

```sql
DELETE FROM callup_token_uses
WHERE used_at > now() - interval '5 minutes';
```

## B. Edge function smoke test

Test the live `callup-token-handler` with a minted token.

### B1. Mint and grab the token via SQL (steps A1).

### B2. Hit the handler

```bash
TOKEN="<token from A1>"
curl -i "https://vrwwpsbfbnveawqwbdmj.supabase.co/functions/v1/callup-token-handler?t=${TOKEN}&action=accept"
```

Expected:
- HTTP 200
- `Content-Type: text/html; charset=utf-8`
- HTML body containing "Got it — \<player first_name\> is in"

### B3. Verify side effects

```sql
-- Token use locked.
SELECT * FROM callup_token_uses
WHERE nonce = (verify_callup_token('<token>'))->>'n';
-- Expect 1 row with response='accept' and used_from_ip populated.

-- event_rsvps upserted.
SELECT response, responded_at FROM event_rsvps
WHERE event_id = '<event_id>' AND player_id = '<player_id>';
-- Expect response='going' and responded_at within last minute.
```

### B4. Decline path side effect

Mint a `decline` token (A1 with response='decline'), tap it, then
verify the player_id was removed from `events.academy_callup_player_ids`:

```sql
-- Setup: ensure the player is in the array.
UPDATE events SET academy_callup_player_ids = academy_callup_player_ids || '<player_id>'::uuid
WHERE id = '<event_id>';

-- Mint + tap (A1 + B2 with 'decline').

-- Verify removed.
SELECT academy_callup_player_ids FROM events WHERE id = '<event_id>';
-- player_id should NOT appear in the array.
```

### B5. Replay protection

Tap the same token twice. First tap returns "Got it"; second tap
returns "Already recorded as in" / "Already recorded as out".

## C. Pure helper smoke (covered by Vitest)

`src/lib/callup/__tests__/tokenPayload.test.js` covers the
`parseCallupTokenPayload` helper. Run with `npm test`.

## D. Secret rotation

The `callup_token_secret` row in `app_secrets` is provisioned with a
random 32-byte base64 value at migration time. Rotate via:

```sql
UPDATE app_secrets
SET value = encode(extensions.gen_random_bytes(32), 'base64'),
    rotated_at = now()
WHERE name = 'callup_token_secret';
```

After rotation, all previously-minted unused tokens become invalid
(verify returns NULL). New mints work immediately. No edge function
redeploy required (the function reads the secret per-verify call).

Distinct from `CRON_SECRET` (which requires dashboard sync between
the DB GUC and the function env var). The token secrets live in DB
rows only, so MCP `execute_sql` is sufficient to rotate.

## Known limitation

Token-driven declines do NOT write to `pii_audit_log`. The
`callup_token_uses` row is the audit trail. Reason: `log_pii_change`
inserts `auth.uid()` as `actor_user_id`, which is NULL from the
edge function's service-role context, and `pii_audit_log.actor_user_id`
is `NOT NULL`. Admin-flow `add_academy_callup` /
`remove_academy_callup` RPCs continue to write to `pii_audit_log`
for human-driven changes.
