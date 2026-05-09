// Wave 3.12 — status priority + visual treatment for the inbox queue.
// Pure data module. Color tokens reference src/styles/tokens.css; if a
// token is missing, ADD it there rather than hardcoding hex.
//
// Sort order: lower number = higher priority (renders first).

export const STATUS_TABLE = {
  draft: {
    sort: 1,
    borderColor: 'var(--em-text-secondary)',
    pillBg: 'var(--em-bg-tertiary)',
    pillText: 'var(--em-text-primary)',
    label: 'DRAFT',
    action: 'Resume drafting',
  },
  scheduled_lt24h: {
    sort: 2,
    borderColor: 'var(--em-info)',
    pillBg: 'var(--em-info-soft)',
    pillText: 'var(--em-info)',
    label: 'SCHEDULED',
    action: 'Edit',
  },
  needs_briefing_tournament: {
    sort: 3,
    borderColor: 'var(--em-warning)',
    pillBg: 'var(--em-warning-soft)',
    pillText: 'var(--em-warning)',
    label: 'NEEDS BRIEFING',
    action: 'Compose',
  },
  needs_briefing_game: {
    sort: 4,
    borderColor: 'var(--em-warning)',
    pillBg: 'var(--em-warning-soft)',
    pillText: 'var(--em-warning)',
    label: 'NEEDS RECAP',
    action: 'Compose',
  },
  schedule_change_skipped: {
    sort: 5,
    borderColor: 'var(--em-danger)',
    pillBg: 'var(--em-danger-soft)',
    pillText: 'var(--em-danger)',
    label: 'SKIPPED NOTIFICATION',
    action: 'Send notification',
  },
  weekly_digest_due: {
    sort: 6,
    borderColor: 'var(--em-accent)',
    pillBg: 'var(--em-accent-soft)',
    pillText: 'var(--em-accent)',
    label: 'DIGEST DUE',
    action: 'Compose',
  },
  stale_draft: {
    sort: 7,
    borderColor: 'var(--em-text-tertiary)',
    pillBg: 'var(--em-bg-secondary)',
    pillText: 'var(--em-text-tertiary)',
    label: 'STALE DRAFT',
    action: 'Resume',
  },
  scheduled_gt24h: {
    sort: 8,
    borderColor: 'var(--em-info)',
    pillBg: 'var(--em-info-soft)',
    pillText: 'var(--em-info)',
    label: 'SCHEDULED',
    action: 'Edit',
  },
};

export function statusFor(row, now = Date.now()) {
  if (row.synthetic_id) return row.status;
  if (row.status === 'draft') {
    const editedMs = row.last_edited_at ? new Date(row.last_edited_at).getTime() : 0;
    return (editedMs && (now - editedMs) > 7 * 86400000) ? 'stale_draft' : 'draft';
  }
  if (row.status === 'scheduled') {
    const sched = row.scheduled_for ? new Date(row.scheduled_for).getTime() : 0;
    return (sched - now) < 86400000 ? 'scheduled_lt24h' : 'scheduled_gt24h';
  }
  return 'draft';
}

export function sortPriority(row, now = Date.now()) {
  return STATUS_TABLE[statusFor(row, now)]?.sort ?? 99;
}

// Items counted in the Active tab badge (excludes stale drafts +
// scheduled >24h since they aren't urgent).
const ACTIVE_BADGE_STATUSES = new Set([
  'draft', 'scheduled_lt24h', 'needs_briefing_tournament',
  'needs_briefing_game', 'schedule_change_skipped', 'weekly_digest_due',
]);

export function isActiveBadgeItem(row, now = Date.now()) {
  return ACTIVE_BADGE_STATUSES.has(statusFor(row, now));
}
