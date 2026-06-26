// aau-submit-tournament — PUBLIC self-serve TourneyMachine ingest trigger.
//
// Screen 01 ("Find / Discovery") on astersports.io/aau: a parent pastes a public
// TourneyMachine tournament link, and the hub ingests it itself — no operator in the
// loop. This is the PUBLIC surface (verify_jwt=false, config.toml, AP #31): it takes a
// URL, resolves the IDTournament, then invokes the secret-gated aau-ingest-tournament
// worker SERVER-SIDE. The ingest_secret is read from app_secrets (AP #33) and never
// leaves the server — the browser only ever sends a URL.
//
// Parent-submitted tournaments attach to the dedicated public-listed "AAU Tournaments"
// directory org (DIRECTORY_ORG_ID) which has no teams, so every scraped game is external
// and ingests in full (the assert_division_game_external trigger skips our-team games).
//
// Abuse controls (this endpoint triggers an outbound scrape):
//   • Host allowlist — the pasted URL must live on tourneymachine.com (SSRF guard).
//   • IDTournament format bound — alphanumeric, length-bounded.
//   • Global rate cap — <=20 submissions/min across all callers → 429.
//   • Per-id dedup window — same tournament within 10 min returns the existing row,
//     no re-scrape (re-paste is idempotent).
//
// The full scrape runs in EdgeRuntime.waitUntil so the request returns immediately with
// a submissionId; the UI polls get_aau_ingest_status until status flips to ok/error.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const DIRECTORY_ORG_ID = "a51e2a00-aa17-4d12-9e00-000000000001";
const DEDUP_WINDOW_MIN = 10;
const RATE_WINDOW_MS = 60_000;
const RATE_MAX = 20;
const DESKTOP_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36";
const FETCH_TIMEOUT_MS = 8_000;
const MAX_REDIRECTS = 5;

const TM_HOST_RE = /(^|\.)tourneymachine\.com$/i;
const ID_RE = /^[A-Za-z0-9]{12,48}$/;
const ID_IN_TEXT = /IDTournament=([A-Za-z0-9]{12,48})/i;

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

async function getAppSecret(sb: ReturnType<typeof createClient>, name: string): Promise<string> {
  const { data, error } = await sb.from("app_secrets").select("value").eq("name", name).maybeSingle();
  if (error) throw new Error(`getAppSecret('${name}') failed: ${error.message}`);
  if (!data || data.value === null) throw new Error(`app_secrets.${name} is NULL`);
  return data.value as string;
}

function idFromUrl(u: URL): string | null {
  for (const [k, v] of u.searchParams) {
    if (k.toLowerCase() === "idtournament" && ID_RE.test(v)) return v;
  }
  return null;
}

/** GET one TourneyMachine page with a desktop UA + timeout, WITHOUT auto-following
 *  redirects — so the caller validates each hop's host before issuing the next request
 *  (SSRF: no off-host fetch is ever made). */
async function fetchTMNoRedirect(url: string): Promise<Response> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
  try {
    return await fetch(url, {
      redirect: "manual",
      signal: ctrl.signal,
      headers: { "User-Agent": DESKTOP_UA, Accept: "text/html" },
    });
  } finally {
    clearTimeout(timer);
  }
}

/** Resolve a pasted value to an IDTournament. Accepts a bare id, an IDTournament query
 *  param, or a TourneyMachine short/redirect link. Redirects are followed MANUALLY with
 *  a per-hop host check (host-locked to tourneymachine.com) so the runtime never issues
 *  a request to an off-host redirect target. Returns {error} with kindness microcopy on
 *  any miss. */
async function resolveIdTournament(raw: string): Promise<{ id: string } | { error: string }> {
  const s = (raw || "").trim();
  if (!s) return { error: "Paste your tournament's TourneyMachine link." };
  // bare id (no scheme, no slashes/dots)
  if (ID_RE.test(s) && !/[/.]/.test(s)) return { id: s };

  let current: URL;
  try {
    current = new URL(s.startsWith("http") ? s : `https://${s}`);
  } catch {
    return { error: "That doesn't look like a link. Copy the tournament URL from TourneyMachine." };
  }

  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    // Validate the host of THIS url before fetching it — an off-host hop never gets a request.
    if (!TM_HOST_RE.test(current.hostname)) {
      return { error: "Only TourneyMachine links work here. Open your tournament on tourneymachine.com and copy its link." };
    }
    const direct = idFromUrl(current);
    if (direct) return { id: direct };

    let res: Response;
    try {
      res = await fetchTMNoRedirect(current.toString());
    } catch {
      break; // timeout / network — fall through to the generic miss
    }
    if (res.status >= 300 && res.status < 400) {
      const loc = res.headers.get("location");
      if (!loc) break;
      try {
        current = new URL(loc, current); // resolve relative redirects; host re-checked next loop
      } catch {
        break;
      }
      continue;
    }
    // 2xx (or other terminal): scan the page body for an embedded IDTournament
    const body = await res.text().catch(() => "");
    const m = body.match(ID_IN_TEXT);
    if (m) return { id: m[1] };
    break;
  }
  return { error: "Couldn't find a tournament at that link. Open it on TourneyMachine and copy the URL from your browser." };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ ok: false, error: "POST only" }, 405);

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const sb = createClient(SUPABASE_URL, SERVICE_ROLE);

  let body: { url?: string };
  try {
    body = await req.json();
  } catch {
    return json({ ok: false, error: "invalid JSON" }, 400);
  }

  const resolved = await resolveIdTournament(body.url || "");
  if ("error" in resolved) return json({ ok: false, error: resolved.error }, 400);
  const idTournament = resolved.id;

  // global rate cap
  const rateSince = new Date(Date.now() - RATE_WINDOW_MS).toISOString();
  const { count: recent, error: rateErr } = await sb
    .from("aau_ingest_submissions")
    .select("id", { count: "exact", head: true })
    .gte("created_at", rateSince);
  if (rateErr) return json({ ok: false, error: "Couldn't start the import. Try again in a moment." }, 500);
  if ((recent ?? 0) >= RATE_MAX) {
    return json({ ok: false, error: "We're a little busy right now. Try again in a minute." }, 429);
  }

  // per-id dedup within the window. A recent 'ok' row → return it (no re-scrape). A recent
  // 'pending' row → another caller is already scraping this exact tournament; hand back its
  // submissionId so this caller just polls the in-flight job instead of starting a second one.
  const dwSince = new Date(Date.now() - DEDUP_WINDOW_MIN * 60_000).toISOString();
  const { data: dup, error: dupErr } = await sb
    .from("aau_ingest_submissions")
    .select("id, status, tournament_id")
    .eq("id_tournament", idTournament)
    .in("status", ["ok", "pending"])
    .gte("created_at", dwSince)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (dupErr) return json({ ok: false, error: "Couldn't start the import. Try again in a moment." }, 500);
  if (dup?.status === "ok" && dup.tournament_id) {
    return json({ ok: true, status: "ready", tournamentId: dup.tournament_id });
  }
  if (dup?.status === "pending") {
    return json({ ok: true, status: "ingesting", submissionId: dup.id }, 202);
  }

  // open a submission row
  const { data: sub, error: subErr } = await sb
    .from("aau_ingest_submissions")
    .insert({ id_tournament: idTournament, source_url: (body.url || "").slice(0, 500), status: "pending" })
    .select("id")
    .single();
  if (subErr) return json({ ok: false, error: "Couldn't start the import. Try again." }, 500);
  const submissionId = sub.id as string;

  let ingestSecret: string;
  try {
    ingestSecret = await getAppSecret(sb, "ingest_secret");
  } catch {
    await sb.from("aau_ingest_submissions")
      .update({ status: "error", error: "ingest_secret unset", updated_at: new Date().toISOString() })
      .eq("id", submissionId);
    return json({ ok: false, error: "The importer isn't configured yet. We're on it." }, 500);
  }

  // background the full scrape; respond immediately
  const work = (async () => {
    try {
      const r = await fetch(`${SUPABASE_URL}/functions/v1/aau-ingest-tournament`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${ingestSecret}`,
          apikey: SERVICE_ROLE,
        },
        body: JSON.stringify({ idTournament, orgId: DIRECTORY_ORG_ID }),
      });
      const out = await r.json().catch(() => ({}));
      if (!r.ok || !out?.tournamentId) {
        await sb.from("aau_ingest_submissions")
          .update({ status: "error", error: String(out?.error || `HTTP ${r.status}`).slice(0, 300), updated_at: new Date().toISOString() })
          .eq("id", submissionId);
        return;
      }
      await sb.from("aau_ingest_submissions")
        .update({ status: "ok", tournament_id: out.tournamentId, updated_at: new Date().toISOString() })
        .eq("id", submissionId);
    } catch (e) {
      await sb.from("aau_ingest_submissions")
        .update({ status: "error", error: String(e).slice(0, 300), updated_at: new Date().toISOString() })
        .eq("id", submissionId);
    }
  })();

  // @ts-ignore — EdgeRuntime is the Supabase Deno runtime global
  if (typeof EdgeRuntime !== "undefined") EdgeRuntime.waitUntil(work);
  else await work;

  return json({ ok: true, status: "ingesting", submissionId, idTournament }, 202);
});
