// Cutover PR 7b-3 — briefing feedback aggregation hook. Two surface
// shapes:
//
//   useBriefingFeedback({ messageId })
//     → { meanRating, ratingCount, distribution, loading }
//     Per-briefing aggregation. Latest submission per recipient_email
//     wins (recipients can re-rate via a different star button; nonce
//     locks single-use per token, but a recipient who taps two
//     different stars writes two rows — latest at the same email is
//     authoritative).
//
//   useBriefingFeedback({ orgId, rolling: N })
//     → { meanRating, ratingCount, messageCount, atOrAboveThreshold, loading }
//     Cutover-gate metric. Rolling average across the last N sent
//     comms_messages in the org. atOrAboveThreshold = meanRating >= 4.0.
//
// Schema reference: briefing_feedback (PR 7a) has rating SMALLINT 1..5,
// recipient_email TEXT, message_id UUID, submitted_at TIMESTAMPTZ.

import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export const CUTOVER_GATE_THRESHOLD = 4.0;

function latestPerRecipient(rows) {
  // Per-message: dedupe by recipient_email, keep latest submitted_at.
  // For cutover-gate (mixed messages): dedupe by (message_id, recipient_email).
  const m = new Map();
  for (const r of rows) {
    const key = r.message_id ? `${r.message_id}|${r.recipient_email}` : r.recipient_email;
    const prior = m.get(key);
    if (!prior || (r.submitted_at && r.submitted_at > prior.submitted_at)) {
      m.set(key, r);
    }
  }
  return Array.from(m.values());
}

function computeDistribution(ratings) {
  const d = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const r of ratings) d[r] = (d[r] || 0) + 1;
  return d;
}

async function fetchSingleMessage(messageId) {
  const { data, error } = await supabase.from('briefing_feedback')
    .select('rating, recipient_email, submitted_at')
    .eq('message_id', messageId);
  if (error) throw error;
  const latest = latestPerRecipient(data || []);
  const ratings = latest.map((r) => r.rating);
  return {
    meanRating: ratings.length ? ratings.reduce((s, x) => s + x, 0) / ratings.length : null,
    ratingCount: ratings.length,
    distribution: computeDistribution(ratings),
  };
}

async function fetchCutoverGate(orgId, rolling) {
  const { data: messages, error: e1 } = await supabase.from('comms_messages')
    .select('id')
    .eq('org_id', orgId)
    .eq('status', 'sent')
    .not('sent_at', 'is', null)
    .order('sent_at', { ascending: false })
    .limit(rolling);
  if (e1) throw e1;
  const ids = (messages || []).map((m) => m.id);
  if (!ids.length) {
    return { meanRating: null, ratingCount: 0, messageCount: 0, atOrAboveThreshold: false };
  }
  const { data: rows, error: e2 } = await supabase.from('briefing_feedback')
    .select('rating, recipient_email, message_id, submitted_at')
    .in('message_id', ids);
  if (e2) throw e2;
  const latest = latestPerRecipient(rows || []);
  const ratings = latest.map((r) => r.rating);
  const meanRating = ratings.length ? ratings.reduce((s, x) => s + x, 0) / ratings.length : null;
  return {
    meanRating,
    ratingCount: ratings.length,
    messageCount: ids.length,
    atOrAboveThreshold: meanRating != null && meanRating >= CUTOVER_GATE_THRESHOLD,
  };
}

export function useBriefingFeedback({ messageId, orgId, rolling }) {
  const [state, setState] = useState({ loading: true });
  useEffect(() => {
    let alive = true;
    async function run() {
      setState({ loading: true });
      try {
        const result = messageId
          ? await fetchSingleMessage(messageId)
          : await fetchCutoverGate(orgId, rolling);
        if (alive) setState({ loading: false, ...result });
      } catch (err) {
        if (alive) setState({ loading: false, error: err });
      }
    }
    if (messageId || (orgId && rolling)) run();
    return () => { alive = false; };
  }, [messageId, orgId, rolling]);
  return state;
}
