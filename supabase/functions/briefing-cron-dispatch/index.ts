// Wave 3.17: cron-driven dispatch for status='scheduled' briefings.
// pg_cron pings this every minute. We pull rows whose scheduled_for
// has passed, transition them to 'queued' (atomic), then invoke v13.
//
// AUTH STRATEGY (critical):
// v13 (send-tournament-message) requires a user JWT — its
// `supabaseAuth.auth.getUser()` rejects service-role keys. The cron
// edge function therefore MINTS a short-lived (60s) authenticated
// JWT for the message's `last_edited_by` user (the admin who
// scheduled the briefing) and forwards it to v13. v13 then performs
// its existing user_roles check on that admin and proceeds.
//
// This preserves v13 untouched. Pilot mode gate is inherited.
//
// REQUIRED SECRETS:
//   CRON_SECRET           (Frank sets via Supabase env + matching
//                          app.settings.cron_secret in Postgres)
//   SUPABASE_URL          (auto)
//   SUPABASE_SERVICE_ROLE_KEY (auto)
//   SUPABASE_JWT_SECRET   (auto in Supabase managed env)

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { create, getNumericDate } from "https://deno.land/x/djwt@v3.0.2/mod.ts";

const BATCH_LIMIT = 10;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

async function mintAuthenticatedJwt(userId: string, secret: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
  return await create(
    { alg: "HS256", typ: "JWT" },
    { sub: userId, aud: "authenticated", role: "authenticated", iat: getNumericDate(0), exp: getNumericDate(60) },
    key,
  );
}

Deno.serve(async (req) => {
  // Auth: shared secret with pg_cron. Empty Bearer = secret not yet
  // set by Frank in Postgres GUC; reject quietly so the every-minute
  // tick doesn't spam logs in the wrong direction.
  const auth = req.headers.get("Authorization");
  const expected = `Bearer ${Deno.env.get("CRON_SECRET") ?? ""}`;
  if (!Deno.env.get("CRON_SECRET") || auth !== expected) {
    return json({ error: "Unauthorized" }, 401);
  }

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const JWT_SECRET = Deno.env.get("SUPABASE_JWT_SECRET");
  if (!JWT_SECRET) return json({ error: "SUPABASE_JWT_SECRET missing" }, 500);

  const sb = createClient(SUPABASE_URL, SERVICE_ROLE);

  const { data: ready, error: readErr } = await sb
    .from("comms_messages")
    .select("id, org_id, last_edited_by, sent_by")
    .eq("status", "scheduled")
    .lte("scheduled_for", new Date().toISOString())
    .order("scheduled_for", { ascending: true })
    .limit(BATCH_LIMIT);
  if (readErr) return json({ error: readErr.message }, 500);
  if (!ready || ready.length === 0) return json({ processed: 0 });

  const dispatchUrl = `${SUPABASE_URL}/functions/v1/send-tournament-message`;
  const results: Array<Record<string, unknown>> = [];

  for (const row of ready) {
    // Atomic claim: transition status='scheduled' → 'queued' only
    // if still scheduled (prevents double-dispatch on tick races).
    const { data: claimed, error: claimErr } = await sb
      .from("comms_messages")
      .update({ status: "queued" })
      .eq("id", row.id)
      .eq("status", "scheduled")
      .select("id");
    if (claimErr || !claimed || claimed.length === 0) {
      results.push({ id: row.id, status: claimErr ? "claim_error" : "skipped_race", error: claimErr?.message });
      continue;
    }

    const impersonateUser = row.last_edited_by ?? row.sent_by;
    if (!impersonateUser) {
      // No user to impersonate — revert to scheduled so a future
      // tick (after admin opens the row) can retry.
      await sb.from("comms_messages").update({ status: "scheduled" }).eq("id", row.id);
      results.push({ id: row.id, status: "no_user_to_impersonate" });
      continue;
    }

    let userJwt: string;
    try { userJwt = await mintAuthenticatedJwt(impersonateUser, JWT_SECRET); }
    catch (e) {
      await sb.from("comms_messages").update({ status: "failed" }).eq("id", row.id);
      results.push({ id: row.id, status: "jwt_mint_failed", error: String(e) });
      continue;
    }

    try {
      const resp = await fetch(dispatchUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${userJwt}` },
        body: JSON.stringify({ message_id: row.id }),
      });
      const respBody = await resp.text();
      if (!resp.ok) {
        await sb.from("comms_messages").update({ status: "failed" }).eq("id", row.id);
        results.push({ id: row.id, status: "dispatch_failed", http: resp.status, body: respBody.slice(0, 200) });
      } else {
        results.push({ id: row.id, status: "dispatched" });
      }
    } catch (e) {
      await sb.from("comms_messages").update({ status: "failed" }).eq("id", row.id);
      results.push({ id: row.id, status: "fetch_error", error: String(e) });
    }
  }

  return json({ processed: ready.length, results });
});
