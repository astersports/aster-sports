// Wave 5 PR 3b — LLM-suggested briefing closer. Admin clicks a
// "Suggest closer" button in StepBodySignoff; this function fetches
// the team's recent signoff_messages for voice grounding + the
// tournament's schedule shape (via describeScheduleGaps mirror),
// builds a prompt, calls Claude, and returns plain prose that the
// UI drops into the signoff textarea.
//
// Shared secrets (anti-pattern #33): anthropic_api_key from
// public.app_secrets — same row the parse-tournament-schedule
// function reads. NULL value fails loud.
//
// Helpers mirrored at src/lib/briefings/suggestCloserPrompt.js +
// src/lib/briefings/scheduleGaps.js for vitest coverage (anti-pattern
// #30). JWT-verified (verify_jwt:true). Reads app_secrets via
// service-role for the DOWNSTREAM Anthropic call — same exemption
// rationale as parse-tournament-schedule in verifyJwtConfigAudit.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { buildSuggestCloserPrompt, parseSuggestCloserOutput } from "./_helpers.ts";
import { describeScheduleGaps } from "./_scheduleGaps.ts";

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

async function callClaude(apiKey: string, prompt: string): Promise<string> {
  const resp = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "x-api-key": apiKey, "anthropic-version": "2023-06-01", "content-type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-5",
      max_tokens: 600,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Anthropic API ${resp.status}: ${text.slice(0, 500)}`);
  }
  const data = await resp.json();
  return data?.content?.[0]?.text ?? "";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "POST only" }, 405);

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return json({ error: "No auth header" }, 401);

  const supabaseAuth = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ?? Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } },
  );
  const { data: { user }, error: authErr } = await supabaseAuth.auth.getUser();
  if (authErr || !user) return json({ error: "Invalid auth" }, 401);

  let body: { tournament_id?: string; team_id?: string; org_id?: string };
  try { body = await req.json(); } catch { return json({ error: "Invalid JSON body" }, 400); }
  if (!body.tournament_id || !body.org_id) return json({ error: "tournament_id and org_id required" }, 400);

  const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  // Anti-pattern #36: check error explicitly on every Supabase call.
  const { data: roles, error: rolesErr } = await sb.from("user_roles").select("role")
    .eq("user_id", user.id).eq("organization_id", body.org_id).in("role", ["admin"]);
  if (rolesErr) return json({ error: `Authz check failed: ${rolesErr.message}` }, 500);
  if (!roles || roles.length === 0) return json({ error: "Not authorized" }, 403);

  try {
    const apiKey = await getAppSecret(sb, "anthropic_api_key");
    // team_id is optional. When present, scope schedule + voice to
    // that team; when absent (tournament-wide closer), pull all
    // events for the tournament and all signoffs for the org.
    const teamId = body.team_id || null;
    const evQuery = sb.from("events").select("start_at, end_at, opponent").eq("tournament_id", body.tournament_id);
    const vxQuery = sb.from("comms_messages").select("signoff_message").eq("org_id", body.org_id)
      .not("signoff_message", "is", null).neq("signoff_message", "").order("last_edited_at", { ascending: false }).limit(5);
    const [tRes, teamRes, evRes, vxRes] = await Promise.all([
      sb.from("tournaments").select("name").eq("id", body.tournament_id).maybeSingle(),
      teamId ? sb.from("teams").select("name").eq("id", teamId).maybeSingle() : Promise.resolve({ data: null, error: null }),
      teamId ? evQuery.eq("team_id", teamId) : evQuery,
      teamId ? vxQuery.eq("team_id", teamId) : vxQuery,
    ]);
    if (tRes.error) throw tRes.error;
    if (teamRes.error) throw teamRes.error;
    if (evRes.error) throw evRes.error;
    if (vxRes.error) throw vxRes.error;
    const tournamentName = tRes.data?.name || "";
    const teamName = (teamRes.data as { name?: string } | null)?.name || "";
    const scheduleGapsText = describeScheduleGaps(evRes.data || []);
    const voiceExamples = (vxRes.data || []).map((r: any) => r.signoff_message).filter(Boolean);
    const prompt = buildSuggestCloserPrompt({ tournamentName, teamName, scheduleGapsText, voiceExamples });
    const rawOutput = await callClaude(apiKey, prompt);
    const suggested_closer = parseSuggestCloserOutput(rawOutput);
    return json({ ok: true, suggested_closer });
  } catch (e) {
    return json({ error: (e as Error).message ?? "Suggest failed" }, 500);
  }
});
