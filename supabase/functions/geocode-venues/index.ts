// geocode-venues — batch geocoder for the AAU venues table (build-bible §3.3).
//
// Resolves lat/lng ONCE per venue (geocode_status='pending' → 'ok'/'failed') so the
// .io hub renders precise Apple/Google/Waze pins instead of address-text routing.
// Reads are never geocoded — only this worker writes lat/lng, and only for pending
// rows, so it's safe to run repeatedly (idempotent) and cheap (each venue billed once).
//
// Auth: shared secret `ingest_secret` in app_secrets (AP #33; verify_jwt=false in
// config.toml per AP #31) — same secret as aau-ingest-tournament (one AAU pipeline).
// Provider: Google Geocoding API; key in app_secrets.google_geocoding_key (operator
// sets it once via SQL — never in Deno.env, never echoed). SAFE BEFORE THE KEY LANDS:
// if the key is unset, the function returns {skipped:'no_key'} without erroring, so it
// can be wired/scheduled ahead of the key.
//
// Service-role DB writes. POST only. Optional body { batch?: number } (default 25).

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const GEOCODE_URL = "https://maps.googleapis.com/maps/api/geocode/json";
const DEFAULT_BATCH = 25;
const FETCH_TIMEOUT_MS = 15_000;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function getAppSecret(
  sb: ReturnType<typeof createClient>,
  name: string,
): Promise<string | null> {
  const { data, error } = await sb.from("app_secrets").select("value").eq("name", name).maybeSingle();
  if (error) throw new Error(`getAppSecret('${name}') failed: ${error.message}`);
  return (data?.value as string | null) ?? null;
}

/** Full address string for geocoding (name first — TM venues are site names). */
function venueQuery(v: { name: string; address: string | null; city: string | null; state: string | null; zip: string | null }): string {
  return [v.name, v.address, [v.city, v.state].filter(Boolean).join(", "), v.zip]
    .filter(Boolean)
    .join(", ");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "POST only" }, 405);

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const sb = createClient(SUPABASE_URL, SERVICE_ROLE);

  // Shared-secret auth (same secret as aau-ingest-tournament).
  const presented = req.headers.get("Authorization")?.replace(/^Bearer\s+/, "") ?? "";
  let expected: string | null;
  try {
    expected = await getAppSecret(sb, "ingest_secret");
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
  if (!expected || presented !== expected) return json({ error: "Unauthorized" }, 401);

  // Geocoding key — absent is NOT an error (function is safe to wire before the key
  // is set; venues simply stay 'pending' and directions use the address fallback).
  const apiKey = await getAppSecret(sb, "google_geocoding_key");
  if (!apiKey) {
    return json({ skipped: "no_key", message: "app_secrets.google_geocoding_key is unset — venues remain pending; set the key to enable precise pins." });
  }

  let batch = DEFAULT_BATCH;
  try {
    const body = await req.json();
    if (Number.isFinite(body?.batch)) batch = Math.max(1, Math.min(100, Math.floor(body.batch)));
  } catch { /* empty body ok */ }

  const { data: pending, error: selErr } = await sb
    .from("venues")
    .select("id, name, address, city, state, zip")
    .eq("geocode_status", "pending")
    .limit(batch);
  if (selErr) return json({ error: `venues select: ${selErr.message}` }, 500);
  if (!pending || pending.length === 0) return json({ ok: 0, failed: 0, remaining: 0, message: "no pending venues" });

  let ok = 0, failed = 0, rateLimited = false;
  for (const v of pending) {
    const q = venueQuery(v as never);
    if (!q) {
      await sb.from("venues").update({ geocode_status: "failed", geocoded_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq("id", v.id);
      failed++;
      continue;
    }
    const url = `${GEOCODE_URL}?address=${encodeURIComponent(q)}&key=${apiKey}`;
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
    let payload: { status?: string; results?: Array<{ geometry?: { location?: { lat: number; lng: number } } }> };
    try {
      const res = await fetch(url, { signal: ctrl.signal });
      payload = await res.json();
    } catch (e) {
      // network/timeout — leave pending, stop the run (retry next invocation)
      rateLimited = true;
      break;
    } finally {
      clearTimeout(timer);
    }

    const status = payload.status;
    if (status === "OK" && payload.results?.[0]?.geometry?.location) {
      const { lat, lng } = payload.results[0].geometry.location;
      const { error: upErr } = await sb
        .from("venues")
        .update({ lat, lng, geocode_status: "ok", geocoded_at: new Date().toISOString(), updated_at: new Date().toISOString() })
        .eq("id", v.id);
      if (upErr) return json({ error: `venue update: ${upErr.message}`, ok, failed }, 500);
      ok++;
    } else if (status === "ZERO_RESULTS" || status === "INVALID_REQUEST" || status === "NOT_FOUND") {
      // no usable result → mark failed; directions fall back to the address string
      await sb.from("venues").update({ geocode_status: "failed", geocoded_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq("id", v.id);
      failed++;
    } else {
      // OVER_QUERY_LIMIT / REQUEST_DENIED / 5xx → leave pending, backoff to next run
      rateLimited = true;
      break;
    }
  }

  const { count } = await sb.from("venues").select("id", { count: "exact", head: true }).eq("geocode_status", "pending");
  return json({ ok, failed, remaining: count ?? null, rateLimited });
});
