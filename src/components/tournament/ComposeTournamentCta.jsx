// Wave 4.8 6b Session 2 — Compose CTA deep-link for tournament detail.
// Renders one of two kinds based on the parent's gate:
//   tournament_prelim  → upcoming (start_date > NOW)
//   tournament_recap   → completed (end_date < NOW)
// In-flight tournaments don't mount this component — the parent gates.
//
// Style mirrors PR #115's EventDetailHeader.composeCtaBase byte-for-byte.
// Natural extract point to a shared briefings/ComposeAnchorCta is Session 3
// when EventBriefingHistory + TournamentBriefingHistory inline their own
// "Compose new" rows — third caller forces dedupe.

import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useAnchorDraftStatus } from '../../hooks/useAnchorDraftStatus';

const composeCtaWrap = { display: 'flex', justifyContent: 'flex-end', marginBottom: 8 };
const composeCtaBase = {
  minHeight: 44, padding: '0 14px', borderRadius: 10,
  fontSize: 13, fontWeight: 500, fontFamily: 'inherit', cursor: 'pointer',
  border: '1.5px solid var(--em-border-default)',
  backgroundColor: 'var(--em-bg-card)', color: 'var(--em-text-primary)',
  display: 'inline-flex', alignItems: 'center', gap: 6,
};

const CTA_COPY = {
  tournament_prelim: { dflt: 'Compose briefing', sent: 'Briefing sent' },
  tournament_recap:  { dflt: 'Compose recap',    sent: 'Recap sent' },
};

export default function ComposeTournamentCta({ tournament, kind }) {
  const navigate = useNavigate();
  const { orgId } = useAuth();
  const status = useAnchorDraftStatus({ orgId, anchorKind: 'tournament', anchorId: tournament.id, kind });
  const copy = CTA_COPY[kind];
  const sentOnly = status.hasSent && !status.hasDraft;
  const label = status.hasDraft ? 'Resume draft' : (sentOnly ? copy.sent : copy.dflt);
  const style = sentOnly
    ? { ...composeCtaBase, backgroundColor: 'var(--em-bg-secondary)', color: 'var(--em-text-tertiary)', cursor: 'default' }
    : status.hasDraft
      ? { ...composeCtaBase, backgroundColor: 'var(--em-accent-soft)', borderColor: 'var(--em-accent)' }
      : composeCtaBase;
  const aria = sentOnly ? `${copy.sent} for this tournament` : `${label} for this tournament`;
  return (
    <div style={composeCtaWrap}>
      <button type="button" disabled={sentOnly} aria-disabled={sentOnly} aria-label={aria}
        onClick={() => navigate(`/admin/briefings/compose?kind=${kind}&anchor=tournament&id=${tournament.id}`)}
        className={sentOnly ? '' : 'sf-press'} style={style}>
        {label}
      </button>
    </div>
  );
}
