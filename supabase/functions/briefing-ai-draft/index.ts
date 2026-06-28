// briefing-ai-draft — AI-draft compose edge fn. Drafts briefing PROSE in the
// org's voice (organizations.voice_config.ai_draft_profile as system prompt)
// around facts. PROSE ONLY: no send, no comms_messages write (Send stays the
// submitBriefing path). Single client: src/hooks/useAiDraft.js.
//
// JWT-verified inbound (verify_jwt:true, no config.toml entry). Reads
// anthropic_api_key from app_secrets for the DOWNSTREAM Claude call (AP #33) —
// same pattern + audit exemption as suggest-briefing-closer.
//
// FACTS-IN lane: the caller supplies facts. Free-form (AI-1) passes gist+facts;
// AI-2 anchored kinds resolve facts CLIENT-side (reusing the preview's
// RESOLVER_REGISTRY path) and pass them in. So no resolver runs in Deno. The
// proposal_id -> server-resolve path (design seam 4b) would need Deno resolvers
// and is not used in v1 (the cron creates empty shells; content is client-
// resolved at preview/send).

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { audienceFraming, AI_DRAFT_KINDS, ANCHORED_KINDS, buildAiDraftUserPrompt, buildPolishPrompt, factsToLines, parseAiDraftOutput, POLISH_STYLES } from "./_helpers.ts";

// Mirrors suggest-briefing-closer's proven model string for this deployment;
// bump to the latest per CLAUDE.md once a gateway smoke confirms it.
const MODEL = "claude-sonnet-4-5";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}

async function getAppSecret(sb: ReturnType<typeof createClient>, name: string): Promise<string> {
  const { data, error } = await sb.from("app_secrets").select("value").eq("name", name).maybeSingle();
  if (error) throw new Error(`getAppSecret('${name}') failed: ${error.message}`);
  if (!data || data.value === null) throw new Error(`app_secrets.${name} is NULL — populate it before this function can run.`);
  return data.value as string;
}

async function callClaude(apiKey: string, system: string, userPrompt: string, temperature: number): Promise<string> {
  const resp = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "x-api-key": apiKey, "anthropic-version": "2023-06-01", "content-type": "application/json" },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 2200,
      temperature,
      system,
      messages: [{ role: "user", content: userPrompt }],
    }),
  });
  if (!resp.ok) throw new Error(`Anthropic API ${resp.status}: ${(await resp.text()).slice(0, 300)}`);
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

  let body: { org_id?: string; kind?: string; mode?: string; audience?: { team_id?: string }; proposal_id?: string; facts?: Record<string, unknown>; gist?: string; polish_body?: string; style?: string };
  try { body = await req.json(); } catch { return json({ error: "Invalid JSON body" }, 400); }
  const { org_id, kind, mode = "draft", audience = {}, proposal_id, facts, gist, polish_body, style } = body;
  if (!org_id || !kind) return json({ error: "org_id and kind are required" }, 400);
  // Facts are supplied by the caller (free-form gist+facts, OR AI-2 anchored
  // kinds whose facts are resolved CLIENT-side and passed in). proposal_id ->
  // server-side resolution would need resolvers in Deno; not used in v1.
  if (proposal_id) {
    return json({ error: "Pass resolved facts instead of proposal_id (server-side proposal resolution isn't wired)." }, 400);
  }
  // Polish rewrites the admin's EXISTING body in the org voice, so it isn't
  // gated by the facts-draft kind set; it just needs text to rewrite.
  if (mode === "polish") {
    if (!polish_body || !String(polish_body).trim()) {
      return json({ error: "Add a message first, then polish it." }, 400);
    }
  } else if (!AI_DRAFT_KINDS.includes(kind)) {
    return json({ error: `AI draft isn't available for "${kind}" yet.` }, 400);
  }

  const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { data: roles, error: rolesErr } = await sb.from("user_roles").select("role")
    .eq("user_id", user.id).eq("organization_id", org_id).in("role", ["admin"]);
  if (rolesErr) return json({ error: `Authz check failed: ${rolesErr.message}` }, 500);
  if (!roles || roles.length === 0) return json({ error: "Not authorized" }, 403);

  try {
    const apiKey = await getAppSecret(sb, "anthropic_api_key");
    const { data: org, error: orgErr } = await sb.from("organizations").select("voice_config").eq("id", org_id).maybeSingle();
    if (orgErr) throw orgErr;
    const profile = (org?.voice_config as { ai_draft_profile?: string } | null)?.ai_draft_profile;
    if (!profile || profile.length < 200) return json({ error: "This org's AI voice profile isn't configured yet." }, 400);

    let teamName: string | null = null;
    if (audience?.team_id) {
      const { data: team, error: teamErr } = await sb.from("teams").select("name").eq("id", audience.team_id).maybeSingle();
      if (teamErr) throw teamErr;
      teamName = (team as { name?: string } | null)?.name ?? null;
    }

    const userPrompt = mode === "polish"
      ? buildPolishPrompt({
        body: polish_body!,
        // Own-key lookup only: `style` is user-controlled, so guard against
        // inherited keys (__proto__, toString) resolving to a non-string.
        styleDirective: (style && Object.prototype.hasOwnProperty.call(POLISH_STYLES, style)) ? POLISH_STYLES[style] : POLISH_STYLES.warmer,
        framing: audienceFraming(teamName),
      })
      : buildAiDraftUserPrompt({
        kind, framing: audienceFraming(teamName), factLines: factsToLines(facts ?? null), gist,
        narrativeOnly: ANCHORED_KINDS.includes(kind),
      });
    const temperature = mode === "polish" ? 0.6 : (mode === "redraft" ? 0.9 : 0.7);

    let raw = await callClaude(apiKey, profile, userPrompt, temperature);
    try {
      return json(parseAiDraftOutput(raw));
    } catch {
      // One retry with a terse correction (server-side per the contract).
      raw = await callClaude(apiKey, profile, `${userPrompt}\n\nReturn VALID minified JSON only, with keys body, card_summary, facts_used, warnings.`, temperature);
      return json(parseAiDraftOutput(raw));
    }
  } catch (e) {
    return json({ error: (e as Error).message ?? "Draft generation failed, try again." }, 500);
  }
});
