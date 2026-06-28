// Stream A reminder IO: recipient resolution + push/email dispatch.
// Kept separate from _reminders.ts so each file stays under the 150 LOC cap
// (AP #11). Pure logic lives in _reminderLogic.ts (AP #30 mirror).

import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@4";

// Platform send-from (rebrand 2026-06-02; was briefings@legacyhoopers.org).
// astersports.app verified in Resend; from_name/reply-to stay the org.
const FROM_EMAIL = "noreply@astersports.app";
const FROM_NAME_FALLBACK = "Aster AAU";
const REPLY_TO_FALLBACK = "support@astersports.app";

export interface Recipients {
  emails: string[];
  userIds: string[];
  count: number;
  // Per-recipient (email, guardianId) pairs so sendReminderEmail can mint a
  // one-click unsubscribe URL per recipient (RFC 8058 + footer link).
  emailGuardians: Array<{ email: string; guardianId: string }>;
}

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";

// Mint a per-guardian one-click unsubscribe URL via the same RPC briefings
// use (public.mint_unsubscribe_token). Returns null on any error so a mint
// failure degrades to "no unsubscribe header" rather than blocking the send.
// Local copy (not imported from send-tournament-message/_lib.ts) because Edge
// deploys bundle the function directory only — cross-tree imports don't
// resolve (AP #30 rationale).
async function mintUnsubscribeUrl(sb: SupabaseClient, guardianId: string): Promise<string | null> {
  const { data: token, error } = await sb.rpc("mint_unsubscribe_token", { p_guardian_id: guardianId });
  if (error || !token) return null;
  return `${SUPABASE_URL}/functions/v1/unsubscribe-handler?t=${encodeURIComponent(token)}`;
}

// Resolve a team's roster guardians -> emails (all) + user_ids (push targets).
// Pilot mode mirrors send-tournament-message: only is_pilot_family guardians
// are eligible on either channel until pilot mode is turned off.
export async function resolveRecipients(
  sb: SupabaseClient, teamId: string, orgId: string, pilotMode: boolean,
): Promise<Recipients> {
  const { data: tps, error: tpErr } = await sb
    .from("team_players").select("player_id").eq("team_id", teamId).eq("status", "active");
  if (tpErr) throw new Error(`team_players: ${tpErr.message}`);
  const playerIds = [...new Set((tps ?? []).map((r: any) => r.player_id).filter(Boolean))];
  if (!playerIds.length) return { emails: [], userIds: [], count: 0, emailGuardians: [] };

  const { data: pgs, error: pgErr } = await sb
    .from("player_guardians").select("guardian_id").in("player_id", playerIds);
  if (pgErr) throw new Error(`player_guardians: ${pgErr.message}`);
  const guardianIds = [...new Set((pgs ?? []).map((r: any) => r.guardian_id).filter(Boolean))];
  if (!guardianIds.length) return { emails: [], userIds: [], count: 0, emailGuardians: [] };

  const { data: gs, error: gErr } = await sb
    .from("guardians").select("id, email, user_id, is_pilot_family")
    .eq("org_id", orgId).in("id", guardianIds);
  if (gErr) throw new Error(`guardians: ${gErr.message}`);
  const eligibleByPilot = (gs ?? []).filter((g: any) => !pilotMode || g.is_pilot_family);
  if (!eligibleByPilot.length) return { emails: [], userIds: [], count: 0, emailGuardians: [] };

  // Wave 3.A #19 P1 closure: filter out guardians who unsubscribed via
  // a prior briefing's One-Click List-Unsubscribe header or footer link.
  // guardian_email_preferences.unsubscribed_at is the canonical opt-out
  // signal — written by unsubscribe-handler + resend-webhook-receiver,
  // never previously read on the send path. Honors CAN-SPAM + iOS push
  // best-practice ("user said stop, app must stop").
  const eligibleIds = eligibleByPilot.map((g: any) => g.id);
  const { data: prefs, error: prefsErr } = await sb
    .from("guardian_email_preferences")
    .select("guardian_id, unsubscribed_at")
    .in("guardian_id", eligibleIds);
  if (prefsErr) throw new Error(`guardian_email_preferences: ${prefsErr.message}`);
  const unsubscribed = new Set((prefs ?? []).filter((p: any) => p.unsubscribed_at).map((p: any) => p.guardian_id as string));
  const eligible = eligibleByPilot.filter((g: any) => !unsubscribed.has(g.id));

  const emails = [...new Set(eligible.map((g: any) => g.email).filter(Boolean))];
  const userIds = [...new Set(eligible.map((g: any) => g.user_id).filter(Boolean))];
  // Dedupe by email, keeping the first guardian_id per email so each address
  // mints exactly one unsubscribe URL (mirrors the `emails` Set dedupe).
  const seen = new Set<string>();
  const emailGuardians: Array<{ email: string; guardianId: string }> = [];
  for (const g of eligible as any[]) {
    if (g.email && g.id && !seen.has(g.email)) { seen.add(g.email); emailGuardians.push({ email: g.email, guardianId: g.id }); }
  }
  return { emails, userIds, count: eligible.length, emailGuardians };
}

export async function sendReminderPush(
  supabaseUrl: string, cronSecret: string, userIds: string[], title: string, body: string,
): Promise<number> {
  if (!userIds.length) return 0;
  const resp = await fetch(`${supabaseUrl}/functions/v1/send-push`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${cronSecret}` },
    body: JSON.stringify({ user_ids: userIds, title, body, url: "/" }),
  });
  if (!resp.ok) return 0;
  const j = await resp.json().catch(() => ({}));
  return Number(j?.sent ?? 0);
}

// Append a per-recipient footer unsubscribe link to the composed bodies.
// Added here (IO) so composeReminder stays pure with no guardian context.
function withUnsubFooter(html: string, plain: string, unsubUrl: string): { html: string; plain: string } {
  const footerHtml = `<div style="max-width:480px;margin:12px auto 0;font-family:Arial,Helvetica,sans-serif;font-size:11px;color:#94a3b8;text-align:center;line-height:1.5;">`
    + `You're getting this because you have a player on this team. `
    + `<a href="${unsubUrl}" style="color:#94a3b8;text-decoration:underline;">Unsubscribe</a></div>`;
  const footerPlain = `\n\n—\nUnsubscribe: ${unsubUrl}`;
  return { html: html + footerHtml, plain: plain + footerPlain };
}

export async function sendReminderEmail(
  sb: SupabaseClient, orgId: string,
  emailGuardians: Array<{ email: string; guardianId: string }>,
  subject: string, html: string, plain: string,
): Promise<number> {
  if (!emailGuardians.length) return 0;
  const { data: os, error: osErr } = await sb.from("organization_settings")
    .select("reply_to_email, from_name").eq("organization_id", orgId).maybeSingle();
  const fromName = (!osErr && os?.from_name) ? os.from_name : FROM_NAME_FALLBACK;
  const fromHeader = `${fromName} <${FROM_EMAIL}>`;
  const replyTo = (!osErr && os?.reply_to_email) ? os.reply_to_email : REPLY_TO_FALLBACK;
  // Wave 3.A #19 P1 closure: prefer app_secrets.resend_api_key per AP #33.
  // Env fallback kept for the rollout window — remove in a follow-up PR
  // once operator confirms the app_secrets row is populated.
  const { data: keyRow } = await sb.from("app_secrets").select("value").eq("name", "resend_api_key").maybeSingle();
  const resendKey = (keyRow?.value as string | null) ?? Deno.env.get("RESEND_API_KEY");
  if (!resendKey) throw new Error("RESEND_API_KEY missing: not in app_secrets, not in Deno.env");
  const resend = new Resend(resendKey);
  // Mint per-recipient unsubscribe URLs up front (one RPC per recipient).
  const unsubUrls = await Promise.all(emailGuardians.map((eg) => mintUnsubscribeUrl(sb, eg.guardianId)));
  let sent = 0;
  for (let i = 0; i < emailGuardians.length; i += 100) {
    const group = emailGuardians.slice(i, i + 100);
    const batch = group.map((eg, j) => {
      const unsubUrl = unsubUrls[i + j];
      const body = unsubUrl ? withUnsubFooter(html, plain, unsubUrl) : { html, plain };
      const headers = unsubUrl ? {
        "List-Unsubscribe": `<${unsubUrl}>`,
        "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
      } : undefined;
      return { from: fromHeader, to: [eg.email], subject, html: body.html, text: body.plain, reply_to: replyTo, ...(headers ? { headers } : {}) };
    });
    const { data, error } = await resend.batch.send(batch);
    if (!error) sent += (data?.data ?? []).filter((r: any) => r?.id).length;
  }
  return sent;
}
