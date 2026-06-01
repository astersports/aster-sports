// Wave 4.8 6b Session 3 — shared Compose CTA. Deduplicates the inline
// CTA blocks from PR #115 (EventDetailHeader.ComposeRecapCta) and PR #116
// (tournament/ComposeTournamentCta). Drives copy + aria via the `kind`
// prop; anchor noun in aria varies by `anchorKind`.
//
// Caller contract:
//   <ComposeAnchorCta anchorKind="event"      anchor={event}      kind="game_recap" />
//   <ComposeAnchorCta anchorKind="tournament" anchor={tournament} kind="tournament_prelim" />
//   <ComposeAnchorCta anchorKind="tournament" anchor={tournament} kind="tournament_recap" />
//
// Parent must gate the predicate (past game / upcoming tournament / etc.).
// This component renders one button unconditionally.

import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useAnchorDraftStatus } from '../../hooks/useAnchorDraftStatus';

const wrapStyle = { display: 'flex', justifyContent: 'flex-end', marginBottom: 8 };
const baseStyle = {
  minHeight: 44, padding: '0 14px', borderRadius: 10,
  fontSize: 13, fontWeight: 500, fontFamily: 'inherit', cursor: 'pointer',
  border: '1.5px solid var(--as-border-default)',
  backgroundColor: 'var(--as-bg-card)', color: 'var(--as-text-primary)',
  display: 'inline-flex', alignItems: 'center', gap: 6,
};

const CTA_COPY = {
  game_recap:        { dflt: 'Compose recap',    sent: 'Recap sent' },
  tournament_prelim: { dflt: 'Compose briefing', sent: 'Briefing sent' },
  tournament_recap:  { dflt: 'Compose recap',    sent: 'Recap sent' },
};

const NOUN = { event: 'game', tournament: 'tournament' };

export default function ComposeAnchorCta({ anchorKind, anchor, kind }) {
  const navigate = useNavigate();
  const { orgId } = useAuth();
  const status = useAnchorDraftStatus({ orgId, anchorKind, anchorId: anchor?.id, kind });
  const copy = CTA_COPY[kind] || CTA_COPY.game_recap;
  const noun = NOUN[anchorKind] || 'anchor';
  const sentOnly = status.hasSent && !status.hasDraft;
  const label = status.hasDraft ? 'Resume draft' : (sentOnly ? copy.sent : copy.dflt);
  const style = sentOnly
    ? { ...baseStyle, backgroundColor: 'var(--as-bg-secondary)', color: 'var(--as-text-tertiary)', cursor: 'default' }
    : status.hasDraft
      ? { ...baseStyle, backgroundColor: 'var(--as-accent-soft)', borderColor: 'var(--as-accent)' }
      : baseStyle;
  const aria = sentOnly ? `${copy.sent} for this ${noun}` : `${label} for this ${noun}`;
  return (
    <div style={wrapStyle}>
      <button type="button" disabled={sentOnly} aria-disabled={sentOnly} aria-label={aria}
        onClick={() => navigate(`/admin/briefings/compose?kind=${kind}&anchor=${anchorKind}&id=${anchor.id}`)}
        className={sentOnly ? '' : 'as-press'} style={style}>
        {label}
      </button>
    </div>
  );
}
