// aau-ingest-tournament — generalized AAU TourneyMachine ingest writer.
//
// Populates the "standings backbone" (tournament_divisions /
// tournament_division_teams / tournament_pools / pool_teams / division_games) from a public
// TourneyMachine tournament so the astersports.io/aau hub can render real
// tournaments. PUBLIC tournament data only — no child/PII/money tables touched.
//
// Auth: shared secret `ingest_secret` in public.app_secrets (CLAUDE.md AP #33;
// verify_jwt=false declared in config.toml per AP #31). Service-role DB writes.
//
// Data path (all desktop-UA, server-rendered HTML — the JSON service is
// session-gated and unusable to scrapers):
//   1. GET Tournament.aspx?IDTournament=<idT>  → division list + tourney meta
//   2. GET Division.aspx?...&IDDivision=<idD>   → teams + pools + games per div
//
// EXTERNAL-vs-EXTERNAL only: every team is persisted with team_id/opponent_id
// NULL (display_name + external_team_key). division_games carries only games
// between two real (non-placeholder, non-our-team) teams — a BEFORE trigger
// (assert_division_game_external) rejects any game touching one of our teams,
// and bracket-seed placeholders are skipped until they resolve.
//
// Idempotent: upserts on the substrate unique keys. Resilient: per-division
// try/catch so one bad division doesn't abort the run; a Tournament.aspx fetch
// failure short-circuits with no destructive writes (stale data retained).
//
// Pure parsing lives in _parse.ts (Deno mirror of the vitest source of truth
// src/lib/aau/parseTournament.js, AP #30).

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  parseDivisionList,
  parseDivision,
  parseTournamentName,
  parseTournamentDates,
  parsePlaces,
  cleanPlaceName,
  normalizeName,
  type DivisionGame,
  type PlaceEntry,
} from "./_parse.ts";

const DESKTOP_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36";
const TM_BASE = "https://tourneymachine.com/Public/Results";
const FETCH_TIMEOUT_MS = 20_000;

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

/** GET a TourneyMachine page with a desktop UA + timeout. Mobile UA 302s to a
 * JS webapp, so the desktop UA is required for server-rendered HTML. */
async function fetchTM(url: string): Promise<string> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      redirect: "follow",
      signal: ctrl.signal,
      headers: {
        "User-Agent": DESKTOP_UA,
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
        "Cache-Control": "no-cache",
      },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.text();
  } finally {
    clearTimeout(timer);
  }
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
  try {
    expected = await getAppSecret(sb, "ingest_secret");
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
  if (presented !== expected) return json({ error: "Unauthorized" }, 401);

  let body: { idTournament?: string; orgId?: string; circuit?: string };
  try {
    body = await req.json();
  } catch {
    return json({ error: "invalid JSON" }, 400);
  }
  const idTournament = (body.idTournament || "").trim();
  const orgId = (body.orgId || "").trim();
  const circuit = body.circuit?.trim() || null;
  if (!idTournament) return json({ error: "idTournament required" }, 400);
  if (!orgId) return json({ error: "orgId required" }, 400);

  // ── DISCOVER ──────────────────────────────────────────────────────────────
  // A Tournament.aspx fetch failure short-circuits with NO destructive writes
  // (stale data retained — resilience requirement).
  let tournamentHtml: string;
  try {
    tournamentHtml = await fetchTM(`${TM_BASE}/Tournament.aspx?IDTournament=${encodeURIComponent(idTournament)}`);
  } catch (e) {
    return json({ error: `Tournament.aspx fetch failed: ${(e as Error).message} — stale data retained`, divisions: [] }, 502);
  }

  const tournamentName = parseTournamentName(tournamentHtml);
  const { startDate, endDate } = parseTournamentDates(tournamentHtml);
  const divisionList = parseDivisionList(tournamentHtml);
  if (divisionList.length === 0) {
    return json({ error: "no divisions discovered on Tournament.aspx", tournamentName, divisions: [] }, 422);
  }
  // Fail fast BEFORE any write: tournaments.start_date/end_date are NOT NULL, so
  // an unparseable date window must surface as a clean 4xx, not a 500 on insert.
  if (!startDate || !endDate) {
    return json({ error: "could not parse a start/end date window from Tournament.aspx", tournamentName, divisions: [] }, 422);
  }

  // ── tournaments row: match-or-create on (org_id, name, start_date) ───────────
  // No external_tournament_key column exists. Match within the org by name AND
  // start_date so same-named events in different seasons (Zero Gravity reuses
  // names year to year) resolve to distinct tournaments instead of colliding
  // (idempotent without a schema change — AP #21, no migration).
  let tournamentId: string;
  {
    const { data: existing, error: selErr } = await sb
      .from("tournaments")
      .select("id")
      .eq("org_id", orgId)
      .eq("name", tournamentName)
      .eq("start_date", startDate)
      .maybeSingle();
    if (selErr) return json({ error: `tournament select: ${selErr.message}` }, 500);
    if (existing) {
      tournamentId = existing.id as string;
    } else {
      const { data: created, error: insErr } = await sb
        .from("tournaments")
        .insert({
          org_id: orgId,
          name: tournamentName,
          circuit,
          start_date: startDate,
          end_date: endDate,
          schedule_status: "preliminary",
        })
        .select("id")
        .single();
      if (insErr) return json({ error: `tournament insert: ${insErr.message}` }, 500);
      tournamentId = created.id as string;
    }
  }

  // Our own teams in this org — used to keep division_games external-only
  // (a game touching one of our teams belongs in events/game_results, and the
  // assert_division_game_external trigger would reject it anyway).
  const ourTeamNames = new Set<string>();
  {
    const { data: ourTeams, error: tErr } = await sb.from("teams").select("name").eq("org_id", orgId);
    if (tErr) return json({ error: `teams query: ${tErr.message}` }, 500);
    for (const t of ourTeams || []) ourTeamNames.add(normalizeName(t.name as string));
  }

  // Venue addresses from the "Complexes" places panel (Tournament.aspx), keyed by
  // cleaned name so a game-row location ("4 - House of Sports - Court 1") matches the
  // place <h4> ("4 - House of Sports"). TM gives us the real street address, so we pin
  // the exact address instead of guessing from a bare site name (build-bible §3.3).
  const placeByClean = new Map<string, PlaceEntry>();
  for (const p of parsePlaces(tournamentHtml)) {
    if (p.street) placeByClean.set(p.cleanName, p);
  }

  // ── per-division ingest (try/catch isolated) ────────────────────────────────
  const now = new Date();
  const results: Array<Record<string, unknown>> = [];

  for (let i = 0; i < divisionList.length; i++) {
    const div = divisionList[i];
    try {
      const html = await fetchTM(
        `${TM_BASE}/Division.aspx?IDTournament=${encodeURIComponent(idTournament)}&IDDivision=${encodeURIComponent(div.externalDivisionKey)}`,
      );
      const { teams, games, pools } = parseDivision(html, now);

      // division row (upsert on tournament_id, name)
      const { data: divRow, error: divErr } = await sb
        .from("tournament_divisions")
        .upsert(
          {
            org_id: orgId,
            tournament_id: tournamentId,
            name: div.name,
            circuit,
            sort_order: i,
            external_division_key: div.externalDivisionKey,
          },
          { onConflict: "tournament_id,name" },
        )
        .select("id")
        .single();
      if (divErr) throw new Error(`division upsert: ${divErr.message}`);
      const divisionId = divRow.id as string;

      // pools (upsert on tournament_division_id, name) → name→id map
      const poolIdByName = new Map<string, string>();
      if (pools.length) {
        const { data: poolRows, error: poolErr } = await sb
          .from("tournament_pools")
          .upsert(
            pools.map((name, idx) => ({ org_id: orgId, tournament_division_id: divisionId, name, sort_order: idx })),
            { onConflict: "tournament_division_id,name" },
          )
          .select("id, name");
        if (poolErr) throw new Error(`pools upsert: ${poolErr.message}`);
        for (const p of poolRows || []) poolIdByName.set(normalizeName(p.name as string), p.id as string);
      }

      // teams — external only (team_id/opponent_id NULL). resolved_key auto-gens.
      const teamRows = teams.map((t, idx) => ({
        org_id: orgId,
        tournament_division_id: divisionId,
        display_name: t.displayName,
        external_team_key: t.externalTeamKey,
        sort_order: idx,
      }));
      if (teamRows.length) {
        const { error: teamErr } = await sb
          .from("tournament_division_teams")
          .upsert(teamRows, { onConflict: "tournament_division_id,resolved_key" });
        if (teamErr) throw new Error(`teams upsert: ${teamErr.message}`);
      }

      // Re-read the division's teams to resolve game sides → division_team ids
      // (resolved_key for an external team is lower(btrim(display_name))).
      const { data: dtRows, error: dtErr } = await sb
        .from("tournament_division_teams")
        .select("id, display_name")
        .eq("tournament_division_id", divisionId);
      if (dtErr) throw new Error(`teams reread: ${dtErr.message}`);
      const teamIdByName = new Map<string, string>();
      for (const r of dtRows || []) teamIdByName.set(normalizeName(r.display_name as string), r.id as string);

      // pool membership — the parser tags each team with its pool name; persist
      // it to pool_teams so pool-scoped standings can render from the DB shape
      // (tournament_division_teams carries no pool column). Also lets a game be
      // tagged to its pool when both sides share one (pool play); cross-pool
      // bracket games stay pool_id NULL.
      const poolNameByTeam = new Map<string, string>();
      for (const t of teams) if (t.pool) poolNameByTeam.set(normalizeName(t.displayName), normalizeName(t.pool));
      const poolTeamRows: Array<Record<string, unknown>> = [];
      for (const t of teams) {
        if (!t.pool) continue;
        const poolId = poolIdByName.get(normalizeName(t.pool));
        const teamId = teamIdByName.get(normalizeName(t.displayName));
        if (poolId && teamId) poolTeamRows.push({ org_id: orgId, tournament_pool_id: poolId, tournament_division_team_id: teamId });
      }
      if (poolTeamRows.length) {
        const { error: ptErr } = await sb
          .from("pool_teams")
          .upsert(poolTeamRows, { onConflict: "tournament_pool_id,tournament_division_team_id" });
        if (ptErr) throw new Error(`pool_teams upsert: ${ptErr.message}`);
      }

      // games — external-vs-external only. Skip: placeholder sides, sides not in
      // the standings (unresolved seeds), and any side that is one of our teams.
      // Each kept game carries its TM location string (g.location) so we can attach
      // a venue (build-bible §3.2; "every game, every venue").
      const gameRows: Array<Record<string, unknown> & { __location?: string }> = [];
      let skipped = 0;
      for (const g of games as DivisionGame[]) {
        const homeNorm = normalizeName(g.homeName);
        const awayNorm = normalizeName(g.awayName);
        if (g.homePlaceholder || g.awayPlaceholder) { skipped++; continue; }
        if (ourTeamNames.has(homeNorm) || ourTeamNames.has(awayNorm)) { skipped++; continue; }
        const homeId = teamIdByName.get(homeNorm);
        const awayId = teamIdByName.get(awayNorm);
        if (!homeId || !awayId) { skipped++; continue; }
        const homePool = poolNameByTeam.get(homeNorm);
        const awayPool = poolNameByTeam.get(awayNorm);
        const poolId = homePool && homePool === awayPool ? poolIdByName.get(homePool) ?? null : null;
        gameRows.push({
          org_id: orgId,
          tournament_division_id: divisionId,
          tournament_pool_id: poolId,
          home_division_team_id: homeId,
          away_division_team_id: awayId,
          home_score: g.homeScore,
          away_score: g.awayScore,
          status: g.status,
          start_at: g.startAt,
          external_game_id: g.externalGameId,
          __location: (g.location || "").trim(),
        });
      }

      // Resolve each distinct location → venue id ONCE (get_or_create_venue de-dups
      // globally; the unique index is an expression index PostgREST upsert can't
      // target — AP #25). New venues land geocode_status='pending' for geocode-venues
      // (§3.3). Court is left null for now — split it once the live TM location
      // format is verified (a wrong split would fragment one gym into many venues).
      const venueIdByLocation = new Map<string, string | null>();
      for (const loc of new Set(gameRows.map((r) => r.__location).filter(Boolean) as string[])) {
        const { data: vid, error: vErr } = await sb.rpc("get_or_create_venue", { p_name: loc, p_tm_key: null });
        if (vErr) throw new Error(`venue resolve ('${loc}'): ${vErr.message}`);
        const venueId = (vid as string | null) ?? null;
        venueIdByLocation.set(loc, venueId);
        // Enrich with the real street address when this location matches a parsed
        // place. enrich_venue_address only re-flags geocode when the address actually
        // changes, so repeated ingests don't churn good pins (idempotent).
        const place = venueId ? placeByClean.get(cleanPlaceName(loc)) : undefined;
        if (place) {
          const { error: enErr } = await sb.rpc("enrich_venue_address", {
            p_venue_id: venueId,
            p_address: place.street,
            p_city: place.city,
            p_state: place.state,
            p_zip: place.zip,
            p_tm_key: place.tmPlaceKey,
          });
          if (enErr) throw new Error(`venue enrich ('${loc}'): ${enErr.message}`);
        }
      }
      for (const r of gameRows) {
        r.venue_id = r.__location ? venueIdByLocation.get(r.__location) ?? null : null;
        delete r.__location;
      }

      let gamesUpserted = 0;
      if (gameRows.length) {
        const { data: up, error: gErr } = await sb
          .from("division_games")
          .upsert(gameRows, { onConflict: "tournament_division_id,external_game_id" })
          .select("id");
        if (gErr) throw new Error(`games upsert: ${gErr.message}`);
        gamesUpserted = up?.length ?? 0;
      }

      results.push({
        division: div.name,
        externalDivisionKey: div.externalDivisionKey,
        teams: teamRows.length,
        pools: pools.length,
        poolMemberships: poolTeamRows.length,
        gamesParsed: games.length,
        gamesUpserted,
        gamesSkipped: skipped,
      });
    } catch (e) {
      // Per-division isolation: record the failure, continue the run.
      results.push({ division: div.name, externalDivisionKey: div.externalDivisionKey, error: (e as Error).message });
    }
  }

  return json({
    tournamentId,
    tournamentName,
    startDate,
    endDate,
    divisionsDiscovered: divisionList.length,
    divisions: results,
  });
});
