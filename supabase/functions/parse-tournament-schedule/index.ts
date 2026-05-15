// Wave 5 PR 2 — TourneyMachine schedule parser. Reads paste text +
// org context (teams + venues) → calls Claude API → returns
// structured rows. Per audit + spike: paste-only input (no URL
// fetch — TourneyMachine 403's WebFetch); LLM extraction; client
// applies validation rules + dedup before commit.
//
// Shared secrets (anti-pattern #33): anthropic_api_key lives in
// public.app_secrets. NULL value fails loud with diagnosable
// message.
//
// Helpers mirrored at src/lib/import/parseTournamentSchedulePrompt.js
// for vitest coverage (anti-pattern #30).

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { buildPrompt, parseClaudeOutput } from "./_helpers.ts";

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
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 4096,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Anthropic API ${resp.status}: ${text}`);
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

  let body: { paste?: string; tournament_id?: string; org_id?: string };
  try { body = await req.json(); }
  catch { return json({ error: "Invalid JSON body" }, 400); }
  if (!body.paste || !body.org_id) return json({ error: "paste and org_id required" }, 400);

  const sb = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  // Authz: caller must be admin in the org
  const { data: roles } = await sb
    .from("user_roles").select("role")
    .eq("user_id", user.id).eq("organization_id", body.org_id).in("role", ["admin"]);
  if (!roles || roles.length === 0) return json({ error: "Not authorized" }, 403);

  try {
    const apiKey = await getAppSecret(sb, "anthropic_api_key");
    const [{ data: teams = [] }, { data: venues = [] }] = await Promise.all([
      sb.from("teams").select("id, name").eq("org_id", body.org_id).is("archived_at", null),
      sb.from("locations").select("id, name").eq("org_id", body.org_id).is("archived_at", null),
    ]);
    const prompt = buildPrompt(body.paste, { teams, venues });
    const rawOutput = await callClaude(apiKey, prompt);
    const rows = parseClaudeOutput(rawOutput);
    return json({ ok: true, rows, teams, venues });
  } catch (e) {
    return json({ error: (e as Error).message ?? "Parse failed" }, 500);
  }
});
