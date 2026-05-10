// Wave 3.17: cron-driven dispatch for status='scheduled' briefings.
// pg_cron pings every minute → pull rows whose scheduled_for has
// passed → transition to 'queued' (atomic) → invoke v13 with a
// minted user JWT impersonating last_edited_by (since v13 is
// verify_jwt:true and rejects service-role keys). v13's user_roles
// check + pilot mode gate inherited unchanged.
//
// Shared secrets (waves 4.3-F + 4.3-G): `cron_secret` authenticates
// the pg_cron caller; `supabase_jwt_secret` signs the impersonation
// JWT. Both live in public.app_secrets, read via service-role SELECT
// at request time. Rotation = SQL UPDATE on the row. NULL value
// fails loud with a diagnosable error.

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

// Reads a value from public.app_secrets at request time. Throws on
// DB error or NULL value, with a diagnosable message so post-deploy
// state (e.g. supabase_jwt_secret NULL until admin populates) stays
// observable in net._http_response logs.
async function getAppSecret(sb: ReturnType<typeof createClient>, name: string): Promise<string> {
  const { data, error } = await sb.from("app_secrets").select("value").eq("name", name).maybeSingle();
  if (error) throw new Error(`getAppSecret('${name}') failed: ${error.message}`);
  if (!data || data.value === null) {
    throw new Error(`app_secrets.${name} is NULL — admin must populate via SQL UPDATE before this function can run.`);
  }
  return data.value as string;
}

Deno.serve(async (req) => {
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const sb = createClient(SUPABASE_URL, SERVICE_ROLE);

  // Auth: shared secret in app_secrets (wave 4.3-F). Empty Bearer
  // doesn't reach here — the read returns the secret value; the
  // compare rejects mismatches. NULL value (e.g. fresh provisioning)
  // surfaces via getAppSecret's error path.
  const presented = req.headers.get("Authorization")?.replace(/^Bearer\s+/, "") ?? "";
  let expectedCron: string;
  try { expectedCron = await getAppSecret(sb, "cron_secret"); }
  catch (e) { return json({ error: (e as Error).message }, 500); }
  if (presented !== expectedCron) {
    return json({ error: "Unauthorized" }, 401);
  }

  // JWT signing secret (wave 4.3-G); used downstream to mint user
  // JWTs for impersonated calls into send-tournament-message.
  let JWT_SECRET: string;
  try { JWT_SECRET = await getAppSecret(sb, "supabase_jwt_secret"); }
  catch (e) { return json({ error: (e as Error).message }, 500); }

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
