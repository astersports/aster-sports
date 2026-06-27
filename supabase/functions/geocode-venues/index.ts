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

/** Strip TM's "N - " court-sheet ordinal prefix + "- Court X" suffix so the geocoder
 *  sees the real site name ("Harry S. Truman High School"), not "3 - … - Court 3".
 *  The prefix regex requires whitespace on BOTH sides of the hyphen so it only matches
 *  TM's "3 - Venue" sheet ordinal — never a hyphenated name like "24-7 Fitness". */
export function cleanVenueName(name: string): string {
  return (
    name
      .replace(/^\s*\d+\s+-\s+/, "")
      .replace(/\s*-\s*court\s*[0-9A-Za-z]+\s*$/i, "")
      .trim() || name
  );
}

/** Full address string for geocoding (cleaned name first — TM venues are site names). */
function venueQuery(v: { name: string; address: string | null; city: string | null; state: string | null; zip: string | null }): string {
  return [cleanVenueName(v.name), v.address, [v.city, v.state].filter(Boolean).join(", "), v.zip]
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
  // A DB error fetching it returns a controlled JSON 500 (like the ingest_secret fetch).
  let apiKey: string | null;
  try {
    apiKey = await getAppSecret(sb, "google_geocoding_key");
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
  if (!apiKey) {
    return json({ skipped: "no_key", message: "app_secrets.google_geocoding_key is unset — venues remain pending; set the key to enable precise pins." });
  }

  let batch = DEFAULT_BATCH;
  try {
    const body = await req.json();
    if (Number.isFinite(body?.batch)) batch = Math.max(1, Math.min(100, Math.floor(body.batch)));
  } catch { /* empty body ok */ }

  // Atomically CLAIM a batch (pending → processing, FOR UPDATE SKIP LOCKED) so two
  // concurrent runs never grab the same row → no double-billing. Stranded 'processing'
  // rows (a crashed run) self-heal: claim_pending_venues reclaims them after a stale
  // window. (build-bible §3.3; Copilot review #1109.)
  const { data: pending, error: selErr } = await sb.rpc("claim_pending_venues", { p_batch: batch });
  if (selErr) return json({ error: `claim venues: ${selErr.message}` }, 500);
  if (!pending || pending.length === 0) return json({ ok: 0, failed: 0, remaining: 0, message: "no pending venues" });

  let ok = 0, failed = 0, rateLimited = false;
  for (const v of pending) {
    const q = venueQuery(v as never);
    if (!q) {
      await sb.from("venues").update({ geocode_status: "failed", geocoded_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq("id", v.id);
      failed++;
      continue;
    }
    // region=us + a Northeast viewport BIAS the result toward the AAU footprint (not a
    // hard restrict). The confidence gate below is the real guard against a wrong pin.
    const url = `${GEOCODE_URL}?address=${encodeURIComponent(q)}&key=${apiKey}&region=us&bounds=${encodeURIComponent("39.0,-80.5|47.5,-69.0")}`;
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
    let payload: { status?: string; results?: Array<{ partial_match?: boolean; geometry?: { location?: { lat: number; lng: number }; location_type?: string } }> };
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
    const top = payload.results?.[0];
    const loc = top?.geometry?.location;
    // CONFIDENCE GATE: a bare TM site name with no city/state geocodes ambiguously
    // (Google sent "Harry S. Truman High School" to NJ). Reject Google's own
    // partial_match flag AND APPROXIMATE location_type so we NEVER persist a wrong pin —
    // those rows mark 'failed' and directions fall back to the name/address link.
    const lowConfidence = top?.partial_match === true || top?.geometry?.location_type === "APPROXIMATE";
    if (status === "OK" && loc && !lowConfidence) {
      const { lat, lng } = loc;
      const { error: upErr } = await sb
        .from("venues")
        .update({ lat, lng, geocode_status: "ok", geocoded_at: new Date().toISOString(), updated_at: new Date().toISOString() })
        .eq("id", v.id);
      if (upErr) return json({ error: `venue update: ${upErr.message}`, ok, failed }, 500);
      ok++;
    } else if (status === "OK" || status === "ZERO_RESULTS" || status === "INVALID_REQUEST" || status === "NOT_FOUND") {
      // no usable result, OR a low-confidence/approximate match → mark failed so
      // directions fall back to the address/name link instead of a wrong pin.
      await sb.from("venues").update({ geocode_status: "failed", geocoded_at: new Date().toISOString() }).eq("id", v.id);
      failed++;
    } else if (status === "OVER_QUERY_LIMIT" || status === "UNKNOWN_ERROR") {
      // transient → stop the run; claimed-but-unprocessed rows self-heal via the
      // stale-reclaim in claim_pending_venues on the next invocation.
      rateLimited = true;
      break;
    } else {
      // REQUEST_DENIED / unexpected → a PERMANENT config error (bad key, billing
      // disabled, or the Geocoding API not enabled on the project). Surface loudly so
      // the operator fixes it instead of the run looping + re-billing. Claimed rows
      // self-heal via stale reclaim.
      return json(
        { error: `geocoding ${status ?? "error"} — likely a bad key, billing disabled, or the Geocoding API not enabled on the project`, ok, failed, status: status ?? null },
        502,
      );
    }
  }

  const { count } = await sb.from("venues").select("id", { count: "exact", head: true }).in("geocode_status", ["pending", "processing"]);
  return json({ ok, failed, remaining: count ?? null, rateLimited });
});
