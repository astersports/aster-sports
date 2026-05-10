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

export async function mintUnsubscribeUrl(sb: any, supabaseUrl: string, guardianId: string | null) {
  if (!guardianId) return null;
  const { data: token, error } = await sb.rpc("mint_unsubscribe_token", { p_guardian_id: guardianId });
  if (error || !token) return null;
  return `${supabaseUrl}/functions/v1/unsubscribe-handler?t=${encodeURIComponent(token)}`;
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
    ...(headers ? { headers } : {}),
  };
}
