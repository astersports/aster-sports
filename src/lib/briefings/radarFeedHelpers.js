// Track-R R-1 — pure helpers for the Briefings Radar feed.
//
// Engine-consumption boundary (R-1 build spec §0): these are READ-side UI
// helpers. They shape comms_messages rows (the canonical "notified?" source)
// + enrichment lookups into ProposalCard view-models. No engine/resolver edits.

import { KIND_METADATA } from './kindMetadata';
import { audienceLabel } from './audienceLabels';

// Friendly time helpers (Eastern, matching the rest of the briefings UI).
function fmtDateTime(ts) {
  if (!ts) return '';
  return new Date(ts).toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZone: 'America/New_York' });
}
function fmtTime(ts) {
  if (!ts) return '';
  return new Date(ts).toLocaleString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'America/New_York' });
}

export function kindLabel(kind) {
  return KIND_METADATA[kind]?.label || kind;
}

// Anchor title from the pre-fetched lookup maps (events / tournaments by id).
export function anchorTitle(row, { eventsById = {}, tournamentsById = {} } = {}) {
  if (row.anchor_kind === 'event') return eventsById[row.anchor_id]?.title || 'Event';
  if (row.anchor_kind === 'tournament') return tournamentsById[row.anchor_id]?.name || 'Tournament';
  if (row.anchor_kind === 'multi_event') return 'Selected games';
  return 'All program';
}

// END-AWARE schedule_change summary (R-1 spec §4): show both start AND end so an
// end-only change is visible; never the start-only display. `change` is the
// latest event_change_audit row for the anchor (after_jsonb / before_jsonb).
export function summaryLine(row, ctx = {}) {
  const title = anchorTitle(row, ctx);
  if (row.kind === 'schedule_change') {
    const after = ctx.change?.after_jsonb || {};
    const before = ctx.change?.before_jsonb || {};
    if (after.start_at) {
      const now = `${fmtDateTime(after.start_at)}${after.end_at ? ` – ${fmtTime(after.end_at)}` : ''}`;
      const was = before.start_at ? ` (was ${fmtDateTime(before.start_at)}${before.end_at ? ` – ${fmtTime(before.end_at)}` : ''})` : '';
      return `${title} now ${now}${was}`;
    }
    return `Schedule change · ${title}`;
  }
  if (row.kind === 'weekly_digest') return 'Week-ahead digest for every family';
  if (row.kind === 'rsvp_nudge') return `RSVP reminder · ${title}`;
  return `${kindLabel(row.kind)} · ${title}`;
}

// "<n> families · <anchor>" — read-only audience pill (editable dropdown is R-3).
export function audiencePill(row, ctx = {}) {
  const n = row.recipient_count;
  const who = n == null ? '—' : `${n} ${n === 1 ? 'family' : 'families'}`;
  const scope = row.audience_type ? audienceLabel(row.audience_type) : anchorTitle(row, ctx);
  return `${who} · ${scope}`;
}

// Bucket a flat comms_messages list into the 3 Radar sections. `now` injected
// for testability. ready = LIVE drafts only (expires_at > now, the #678 fix).
export function bucketFeed(rows, now = Date.now()) {
  const ready = []; const scheduled = []; const sent = [];
  const weekAgo = now - 7 * 86400000;
  for (const r of rows || []) {
    if (r.status === 'draft') {
      if (!r.expires_at || new Date(r.expires_at).getTime() > now) ready.push(r);
    } else if (r.status === 'scheduled') {
      scheduled.push(r);
    } else if (r.status === 'sent' && r.sent_at && new Date(r.sent_at).getTime() > weekAgo) {
      sent.push(r);
    }
  }
  return { ready, scheduled, sent };
}

export { fmtDateTime, fmtTime };
