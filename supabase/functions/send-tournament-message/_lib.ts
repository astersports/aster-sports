// Wave 4.1c — extracted helpers so send-tournament-message/index.ts
// stays under the 150-line cap (anti-pattern #11). Pure async helpers,
// no shared module state — index.ts owns the auth + dispatch loop.
//
// mintUnsubscribeUrl: returns a per-recipient unsubscribe URL via the
// public.mint_unsubscribe_token RPC. Returns null for admin BCC rows
// (no guardian_id) so the RFC 8058 header is omitted on QA copies.
//
// buildEmailRow: shapes one Resend email object including the optional
// List-Unsubscribe / List-Unsubscribe-Post headers when an unsubscribe
// URL is available.
//
// Recipient-attribution tag: we attach a Resend tag { recipient_id: <row.id> }
// so the resend-webhook-receiver can correlate open/click/bounce events back
// to the EXACT comms_message_recipients row. Resend echoes tags in the
// webhook payload (data.tags, an object keyed by tag name) but does NOT echo
// custom headers — so a tag is the only structural channel that survives the
// round-trip without a schema change. This replaces the receiver's fuzzy
// email_at_send + 7-day-window + limit(1) match, which misattributed events
// when the same address received multiple briefings inside 7 days. The row id
// is a UUID (ASCII hex + dashes), valid under Resend's tag-value charset
// (letters/numbers/underscores/dashes). Admin BCC rows still carry their own
// id, so their opens attribute to the BCC row (not a real family's row).

export async function mintUnsubscribeUrl(sb: any, supabaseUrl: string, guardianId: string | null) {
  if (!guardianId) return null;
  const { data: token, error } = await sb.rpc("mint_unsubscribe_token", { p_guardian_id: guardianId });
  if (error || !token) return null;
  return `${supabaseUrl}/functions/v1/unsubscribe-handler?t=${encodeURIComponent(token)}`;
}

// Wave C: best-effort push fan-out alongside email. Resolves the message's
// recipient guardians to their auth user_ids and POSTs to send-push (shared
// cron_secret Bearer). Push is the secondary channel — the caller treats any
// thrown error as non-fatal so it can never fail the email send. Recipients
// without a push_subscriptions row (opt-in is the per-device toggle) get
// email only; send-push returns sent:0 for them. Mirrors the exact recipient
// set, so the pilot-mode + audience scoping enforced upstream carry over.
export async function dispatchPushFanout(
  sb: any,
  supabaseUrl: string,
  message: { org_id: string; headline?: string | null; subject?: string | null },
  recipients: Array<{ guardian_id: string | null }>,
  fromName: string,
) {
  const guardianIds = [...new Set(recipients.map((r) => r.guardian_id).filter(Boolean))];
  if (!guardianIds.length) return;
  const { data: gRows, error: gErr } = await sb
    .from("guardians").select("user_id").eq("org_id", message.org_id).in("id", guardianIds);
  if (gErr) throw new Error(`guardian->user lookup: ${gErr.message}`);
  const userIds = [...new Set((gRows ?? []).map((g: any) => g.user_id).filter(Boolean))];
  if (!userIds.length) return;
  const { data: secretRow, error: secErr } = await sb
    .from("app_secrets").select("value").eq("name", "cron_secret").maybeSingle();
  if (secErr) throw new Error(`cron_secret read: ${secErr.message}`);
  const cronSecret = secretRow?.value as string | undefined;
  if (!cronSecret) return;
  const title = message.headline || message.subject || fromName;
  const body = message.headline && message.subject && message.headline !== message.subject
    ? message.subject : "";
  await fetch(`${supabaseUrl}/functions/v1/send-push`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${cronSecret}` },
    body: JSON.stringify({ user_ids: userIds, title, body, url: "/" }),
  });
}

export function buildEmailRow(r: any, message: any, fromHeader: string, replyTo: string, unsubscribeUrl: string | null) {
  const headers = unsubscribeUrl ? {
    "List-Unsubscribe": `<${unsubscribeUrl}>`,
    "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
  } : undefined;
  return {
    from: fromHeader,
    to: [r.email_at_send],
    subject: r.subject_rendered ?? message.subject,
    html: r.body_html_rendered ?? message.body_html,
    text: r.body_plain_rendered ?? message.body_plain,
    reply_to: replyTo,
    ...(r.id ? { tags: [{ name: "recipient_id", value: String(r.id) }] } : {}),
    ...(headers ? { headers } : {}),
  };
}
