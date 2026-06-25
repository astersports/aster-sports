// ingest-game-results — F2 Phase 1 SCORES writer (BUILD SPEC v3 §3, DR-A=A1).
//
// ONE WRITER PER CONCERN: the schedule path (parse-tournament-schedule → events)
// is untouched. This sibling consumes ALREADY-IDENTIFIED games from the scraper
// and writes ONLY game_results. It does NOT parse TourneyMachine or derive
// schedule — TM is parsed once, by the schedule path.
//
// Auth: shared secret `ingest_secret` in public.app_secrets (CLAUDE.md AP #33;
// verify_jwt=false declared in config.toml per AP #31). Service-role client.
//
// Resolution (B2): OPPONENTS match-or-create; EVENTS match-ONLY — an unmatched
// game is a REVIEW FLAG in the response, never a silent insert (no phantom games
// on a public schedule). Idempotency: upsert on (org_id, external_game_id).
//
// Pure logic mirrored at src/lib/cron/ingestGameResultsHelpers.js (AP #30).

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { matchEvent, buildGameResultRow, normalizeName, type ScrapedGame } from "./_helpers.ts";

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
  if (!data || data.value === null) {
    throw new Error(`app_secrets.${name} is NULL — admin must populate via SQL UPDATE before this function can run.`);
  }
  return data.value as string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "POST only" }, 405);

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const sb = createClient(SUPABASE_URL, SERVICE_ROLE);

  // Shared-secret auth (app_secrets). Mismatch / NULL value both reject.
  const presented = req.headers.get("Authorization")?.replace(/^Bearer\s+/, "") ?? "";
  let expected: string;
  try { expected = await getAppSecret(sb, "ingest_secret"); }
  catch (e) { return json({ error: (e as Error).message }, 500); }
  if (presented !== expected) return json({ error: "Unauthorized" }, 401);

  let body: { org_id?: string; games?: ScrapedGame[] };
  try { body = await req.json(); } catch { return json({ error: "invalid JSON" }, 400); }
  const orgId = body.org_id;
  const games = Array.isArray(body.games) ? body.games : [];
  if (!orgId) return json({ error: "org_id required" }, 400);
  if (games.length === 0) return json({ upserted: 0, opponentsCreated: 0, reviewFlags: [] });

  // Candidate events: all games' teams within ±1 day of the scraped window
  // (matchEvent then narrows to ±3h + opponent). Batched — no per-row queries.
  const teamIds = [...new Set(games.map((g) => g.team_id).filter(Boolean))];
  const startMs = games.map((g) => Date.parse(g.start_at)).filter((n) => !Number.isNaN(n));
  if (startMs.length === 0) return json({ error: "no parseable start_at in games" }, 400);
  const minT = new Date(Math.min(...startMs) - 24 * 3600 * 1000).toISOString();
  const maxT = new Date(Math.max(...startMs) + 24 * 3600 * 1000).toISOString();

  const { data: events, error: evErr } = await sb
    .from("events").select("id, team_id, opponent, start_at")
    .in("team_id", teamIds).gte("start_at", minT).lte("start_at", maxT);
  if (evErr) return json({ error: `events query: ${evErr.message}` }, 500);
  const eventsByTeam = new Map<string, { id: string; opponent: string | null; start_at: string }[]>();
  for (const ev of events || []) {
    const arr = eventsByTeam.get(ev.team_id) || [];
    arr.push(ev); eventsByTeam.set(ev.team_id, arr);
  }

  // Opponent cache (match), then bulk-create the missing ones (create).
  const { data: opps, error: oppErr } = await sb
    .from("opponents").select("id, name").eq("org_id", orgId);
  if (oppErr) return json({ error: `opponents query: ${oppErr.message}` }, 500);
  const oppByName = new Map<string, string>();
  for (const o of opps || []) oppByName.set(normalizeName(o.name), o.id);

  const missing = [...new Set(
    games.map((g) => g.opponent).filter((n) => n && !oppByName.has(normalizeName(n))),
  )];
  let opponentsCreated = 0;
  if (missing.length) {
    const { data: created, error: cErr } = await sb
      .from("opponents").insert(missing.map((name) => ({ org_id: orgId, name }))).select("id, name");
    if (cErr) return json({ error: `opponent create: ${cErr.message}` }, 500);
    for (const o of created || []) oppByName.set(normalizeName(o.name), o.id);
    opponentsCreated = created?.length ?? 0;
  }

  // Match (no awaits): build rows or review-flag.
  const reviewFlags: Array<Record<string, unknown>> = [];
  const rows: Array<Record<string, unknown>> = [];
  for (const g of games) {
    const eventId = matchEvent(g, eventsByTeam.get(g.team_id) || []);
    if (!eventId) {
      reviewFlags.push({ external_game_id: g.external_game_id, opponent: g.opponent, start_at: g.start_at, reason: "no matching event" });
      continue;
    }
    rows.push(buildGameResultRow(g, eventId, orgId));
  }

  let upserted = 0;
  if (rows.length) {
    const { data: up, error: upErr } = await sb
      .from("game_results").upsert(rows, { onConflict: "org_id,external_game_id" }).select("id");
    if (upErr) return json({ error: `upsert: ${upErr.message}`, reviewFlags }, 500);
    upserted = up?.length ?? 0;
  }

  return json({ upserted, opponentsCreated, reviewFlags });
});
