// aau-scrape-tournament — AAU hub build spec §2/§9 step 2. The SINGLE platform-side
// scraper: TourneyMachine link → games[] → the existing ingest-game-results writer.
// "One writer per concern" holds — this does NOT write game_results directly; it
// produces the games[] payload and POSTs to ingest-game-results.
//
// Two phases (D3 per-tenant alias is operator-confirmed, never auto-guessed):
//   DISCOVER (no `mapping`): scrape → per division, the org's games + CANDIDATE internal
//     teams (by grade→age + gender). Read-only, no secret, no write. The operator reviews
//     and picks the team per division (10U Black vs Blue can't be inferred from the scrape).
//   INGEST  (`mapping` = {divisionId: team_id}, `commit`: true): build games[] with the
//     confirmed team_ids and POST to ingest-game-results (Bearer = app_secrets.ingest_secret).
//     `commit` false = dry preview of the exact payload.
//
// Step-0 verified: TM returns 200 to Supabase Edge egress. Auth: commit path requires the
// ingest_secret as Bearer; discover/preview are read-only and open (full operator-auth is
// the cross-project step 4, held for architect review). Deployed DARK — no cron yet.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";
const BASE = "https://tourneymachine.com/Public/Results/";
const GAME_ID = /^[PBG]\d+/;

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b, null, 2), { status: s, headers: { ...cors, "Content-Type": "application/json" } });

async function fetchText(url: string): Promise<{ status: number; body: string; finalUrl: string }> {
  const r = await fetch(url, { headers: { "User-Agent": UA, Accept: "text/html" }, redirect: "follow" });
  return { status: r.status, body: await r.text(), finalUrl: r.url };
}

function stripTags(s: string): string {
  return s.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&#\d+;/g, "").trim();
}
function cells(rowHtml: string): string[] {
  const out: string[] = [];
  const re = /<td[^>]*>([\s\S]*?)<\/td>/gi;
  let m;
  while ((m = re.exec(rowHtml))) out.push(stripTags(m[1]));
  return out;
}
function firstH1(html: string): string {
  const hs = [...html.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/gi)].map((m) => stripTags(m[1])).filter(Boolean);
  return hs[0] ?? "?";
}

// US Eastern DST (2nd Sun Mar 02:00 → 1st Sun Nov 02:00); localHour disambiguates the two days.
function isEasternDST(y: number, mo: number, d: number, h: number): boolean {
  if (mo < 3 || mo > 11) return false;
  if (mo > 3 && mo < 11) return true;
  if (mo === 3) {
    const first = new Date(y, 2, 1).getDay();
    const secondSun = first === 0 ? 8 : 14 - first + 1;
    if (d > secondSun) return true;
    if (d < secondSun) return false;
    return h >= 2;
  }
  const first = new Date(y, 10, 1).getDay();
  const firstSun = first === 0 ? 1 : 7 - first + 1;
  if (d < firstSun) return true;
  if (d > firstSun) return false;
  return h < 2;
}
// "Sat 06/13/26 9:00 AM" (ET) → ISO UTC
function parseDtISO(raw: string): string | null {
  const s = raw.replace(/\s+/g, " ").trim();
  const m = s.match(/(\d{1,2})\/(\d{1,2})\/(\d{2,4})\s+(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (!m) return null;
  let [, mo, d, y, h, mi, ap] = m as unknown as string[];
  let Y = parseInt(y, 10); if (Y < 100) Y += 2000;
  let H = parseInt(h, 10);
  if (ap.toUpperCase() === "PM" && H !== 12) H += 12;
  if (ap.toUpperCase() === "AM" && H === 12) H = 0;
  const off = isEasternDST(Y, +mo, +d, H) ? 4 : 5;
  return new Date(Date.UTC(Y, +mo - 1, +d, H + off, +mi, 0)).toISOString();
}

// division name → candidate age groups (grade key 8U=2nd,9U=3rd,10U=4th,11U=5th)
function divAges(div: string): string[] {
  const d = div.toLowerCase(); const a = new Set<string>();
  if (/\b2nd\b/.test(d) || /8u/.test(d)) a.add("8U");
  if (/\b3rd\b/.test(d) || /9u/.test(d)) a.add("9U");
  if (/\b4th\b/.test(d) || /10u/.test(d)) a.add("10U");
  if (/\b5th\b/.test(d) || /11u/.test(d)) a.add("11U");
  return [...a];
}
function divGender(div: string): string | null {
  const d = div.toLowerCase();
  if (/girl|women|female/.test(d)) return "female";
  if (/boy|men|male/.test(d)) return "male";
  return null;
}

interface Parsed { gameId: string; startAt: string | null; loc: string; opponent: string; ours: number | null; opp: number | null; }
function parseDivisionGames(html: string, alias: string): Parsed[] {
  const out: Parsed[] = [];
  for (const tr of html.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)) {
    const c = cells(tr[1]);
    if (c.length < 7 || !GAME_ID.test(c[0])) continue;
    const t1 = c[3] || "", t2 = c[6] || "";
    const a = alias.toLowerCase();
    const oneIs1 = t1.toLowerCase().includes(a), oneIs2 = t2.toLowerCase().includes(a);
    if (!oneIs1 && !oneIs2) continue;
    const s1 = /^\d+$/.test(c[4]) ? parseInt(c[4], 10) : null;
    const s2 = /^\d+$/.test(c[5]) ? parseInt(c[5], 10) : null;
    out.push({
      gameId: c[0], startAt: parseDtISO(c[1] || ""), loc: c[2] || "",
      opponent: oneIs1 ? t2 : t1,
      ours: oneIs1 ? s1 : s2, opp: oneIs1 ? s2 : s1,
    });
  }
  return out;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "POST only" }, 405);

  let body: any;
  try { body = await req.json(); } catch { return json({ error: "invalid JSON" }, 400); }
  const orgId: string = body.org_id;
  const alias: string = body.team_alias ?? "legacy";
  const link: string = body.tourney_url ?? (body.id_tournament ? `${BASE}Tournament.aspx?IDTournament=${body.id_tournament}` : "");
  const mapping: Record<string, string> | undefined = body.mapping;
  const commit: boolean = body.commit === true;
  if (!orgId) return json({ error: "org_id required" }, 400);
  if (!link) return json({ error: "tourney_url or id_tournament required" }, 400);

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const sb = createClient(SUPABASE_URL, SERVICE_ROLE);

  // 1. overview → resolve IDTournament + auto-discover division links
  const ov = await fetchText(link);
  if (ov.status !== 200) return json({ error: `overview HTTP ${ov.status}`, link }, 502);
  const idt = (ov.finalUrl.match(/IDTournament=([a-z0-9]+)/) || ov.body.match(/IDTournament=([a-z0-9]+)/) || [])[1] ?? null;
  if (!idt) return json({ error: "could not resolve IDTournament", finalUrl: ov.finalUrl }, 422);
  const divUrls = [...new Set(
    [...ov.body.matchAll(new RegExp(`Division\\.aspx\\?IDTournament=${idt}&(?:amp;)?IDDivision=[a-z0-9]+`, "gi"))]
      .map((m) => BASE + m[0].replace(/&amp;/g, "&")),
  )];

  // 2. fetch divisions, parse our games
  const divisions: Array<{ division: string; divisionId: string; ages: string[]; gender: string | null; games: Parsed[] }> = [];
  for (const u of divUrls) {
    const divId = (u.match(/IDDivision=([a-z0-9]+)/) || [])[1] ?? u;
    const h = await fetchText(u);
    if (h.status !== 200) continue;
    const games = parseDivisionGames(h.body, alias);
    if (!games.length) continue;
    const dname = firstH1(h.body);
    divisions.push({ division: dname, divisionId: divId, ages: divAges(dname), gender: divGender(dname), games });
  }

  // 3. org teams (for candidate resolution)
  const { data: teams, error: tErr } = await sb
    .from("teams").select("id, name, age_group, gender").eq("org_id", orgId);
  if (tErr) return json({ error: `teams query: ${tErr.message}` }, 500);
  const teamList = teams ?? [];
  const candidatesFor = (ages: string[], gender: string | null) =>
    teamList
      .filter((t) => (ages.length === 0 || ages.includes(t.age_group)) && (!gender || !t.gender || t.gender === gender))
      .map((t) => ({ team_id: t.id, name: t.name, age_group: t.age_group, gender: t.gender }));

  // DISCOVER — no mapping: propose per-division candidate teams for operator confirmation
  if (!mapping) {
    return json({
      mode: "discover", id_tournament: idt, alias, divisions_scanned: divUrls.length,
      proposal: divisions.map((d) => ({
        division: d.division, divisionId: d.divisionId, grade_ages: d.ages, gender: d.gender,
        games_found: d.games.length,
        candidate_teams: candidatesFor(d.ages, d.gender),
        sample: d.games.slice(0, 3).map((g) => ({ when: g.startAt, vs: g.opponent, score: g.ours == null ? null : `${g.ours}-${g.opp}` })),
      })),
      note: "Confirm one team_id per divisionId, then call again with {mapping:{divisionId:team_id}, commit:true}.",
    });
  }

  // INGEST — build games[] with confirmed team_ids
  const games: any[] = [];
  const skipped: any[] = [];
  for (const d of divisions) {
    const teamId = mapping[d.divisionId];
    if (!teamId) { skipped.push({ divisionId: d.divisionId, division: d.division, reason: "no team mapped" }); continue; }
    for (const g of d.games) {
      if (!g.startAt) { skipped.push({ gameId: g.gameId, reason: "unparseable date" }); continue; }
      games.push({
        external_game_id: `tm:${idt}:${g.gameId}`,
        team_id: teamId,
        opponent: g.opponent,
        start_at: g.startAt,
        our_score: g.ours,
        opponent_score: g.opp,
      });
    }
  }

  if (!commit) return json({ mode: "preview", id_tournament: idt, count: games.length, skipped, games });

  // commit: Bearer must equal app_secrets.ingest_secret; forward the same payload to ingest-game-results
  const presented = req.headers.get("Authorization")?.replace(/^Bearer\s+/, "") ?? "";
  const { data: sec, error: sErr } = await sb.from("app_secrets").select("value").eq("name", "ingest_secret").maybeSingle();
  if (sErr) return json({ error: `secret read: ${sErr.message}` }, 500);
  if (!sec?.value) return json({ error: "app_secrets.ingest_secret not set" }, 500);
  if (presented !== sec.value) return json({ error: "Unauthorized (commit requires ingest_secret Bearer)" }, 401);

  const resp = await fetch(`${SUPABASE_URL}/functions/v1/ingest-game-results`, {
    method: "POST",
    headers: { Authorization: `Bearer ${sec.value}`, "Content-Type": "application/json" },
    body: JSON.stringify({ org_id: orgId, games }),
  });
  const result = await resp.json().catch(() => ({}));
  return json({ mode: "ingest", id_tournament: idt, sent: games.length, skipped, ingest_status: resp.status, ingest_result: result });
});
