// Stream A reminder IO: recipient resolution + push/email dispatch.
// Kept separate from _reminders.ts so each file stays under the 150 LOC cap
// (AP #11). Pure logic lives in _reminderLogic.ts (AP #30 mirror).

import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@4";

// Platform send-from (rebrand 2026-06-02; was briefings@legacyhoopers.org).
// astersports.app verified in Resend; from_name/reply-to stay the org.
const FROM_EMAIL = "noreply@astersports.app";
const FROM_NAME_FALLBACK = "Legacy Hoopers";
const REPLY_TO_FALLBACK = "olivejuiceinc1@gmail.com";

export interface Recipients { emails: string[]; userIds: string[]; count: number; }

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
  if (!playerIds.length) return { emails: [], userIds: [], count: 0 };

  const { data: pgs, error: pgErr } = await sb
    .from("player_guardians").select("guardian_id").in("player_id", playerIds);
  if (pgErr) throw new Error(`player_guardians: ${pgErr.message}`);
  const guardianIds = [...new Set((pgs ?? []).map((r: any) => r.guardian_id).filter(Boolean))];
  if (!guardianIds.length) return { emails: [], userIds: [], count: 0 };

  const { data: gs, error: gErr } = await sb
    .from("guardians").select("email, user_id, is_pilot_family")
    .eq("org_id", orgId).in("id", guardianIds);
  if (gErr) throw new Error(`guardians: ${gErr.message}`);
  const eligible = (gs ?? []).filter((g: any) => !pilotMode || g.is_pilot_family);
  const emails = [...new Set(eligible.map((g: any) => g.email).filter(Boolean))];
  const userIds = [...new Set(eligible.map((g: any) => g.user_id).filter(Boolean))];
  return { emails, userIds, count: eligible.length };
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

export async function sendReminderEmail(
  sb: SupabaseClient, orgId: string, emails: string[], subject: string, html: string, plain: string,
): Promise<number> {
  if (!emails.length) return 0;
  const { data: os, error: osErr } = await sb.from("organization_settings")
    .select("reply_to_email, from_name").eq("organization_id", orgId).maybeSingle();
  const fromName = (!osErr && os?.from_name) ? os.from_name : FROM_NAME_FALLBACK;
  const fromHeader = `${fromName} <${FROM_EMAIL}>`;
  const replyTo = (!osErr && os?.reply_to_email) ? os.reply_to_email : REPLY_TO_FALLBACK;
  const resend = new Resend(Deno.env.get("RESEND_API_KEY")!);
  let sent = 0;
  for (let i = 0; i < emails.length; i += 100) {
    const group = emails.slice(i, i + 100);
    const batch = group.map((to) => ({ from: fromHeader, to: [to], subject, html, text: plain, reply_to: replyTo }));
    const { data, error } = await resend.batch.send(batch);
    if (!error) sent += (data?.data ?? []).filter((r: any) => r?.id).length;
  }
  return sent;
}
