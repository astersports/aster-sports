// Wave 4.1 §7.2 — UNSUBSCRIBE_URL substitution helper. Send pipelines
// (digestSend, scheduleChangeSend, rsvpNudgeSend) call applyUnsubscribeUrl
// per recipient row before INSERT. Mints a signed token via
// public.mint_unsubscribe_token RPC (HMAC-SHA256, no expiry) and
// replaces the {{UNSUBSCRIBE_URL}} placeholder injected by the footer
// renderer in both body_html_rendered and body_plain_rendered.
//
// Admin BCC rows: there's no guardian to mint for. Admin sees a copy
// of the parent body for QA, so the placeholder is replaced with a
// no-op anchor pointing at the org website. CAN-SPAM compliance is
// per-recipient — admin BCC is not a delivery to a real subscriber.
//
// pattern reference: rsvp-token-handler signed-link mint via RPC.

import { supabase } from './supabase';

const HANDLER_BASE = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/unsubscribe-handler`;
const ADMIN_BCC_FALLBACK_URL = 'https://www.legacyhoopers.org/';

export function buildUnsubscribeUrl(token) {
  return `${HANDLER_BASE}?t=${encodeURIComponent(token)}`;
}

export async function mintUnsubscribeUrl(guardianId) {
  if (!guardianId) return ADMIN_BCC_FALLBACK_URL;
  const { data, error } = await supabase.rpc('mint_unsubscribe_token', { p_guardian_id: guardianId });
  if (error) throw error;
  return buildUnsubscribeUrl(data);
}

export async function applyUnsubscribeUrl(row) {
  const url = await mintUnsubscribeUrl(row.guardian_id);
  return {
    ...row,
    body_html_rendered: (row.body_html_rendered || '').replace(/{{UNSUBSCRIBE_URL}}/g, url),
    body_plain_rendered: (row.body_plain_rendered || '').replace(/{{UNSUBSCRIBE_URL}}/g, url),
  };
}

export async function applyUnsubscribeUrls(rows) {
  const out = [];
  for (const row of rows) {
    out.push(await applyUnsubscribeUrl(row));
  }
  return out;
}
