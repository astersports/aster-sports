import { useState } from 'react';
import { FileText } from 'lucide-react';
import { isStaff } from '../../lib/permissions';
import TournamentBriefing from './TournamentBriefing';

// Banner on event detail for any event with tournament_name set. Staff only.
// Opens the TournamentBriefing full-screen overlay on tap.

export default function TournamentBriefingBanner({ event, team, role }) {
  const [open, setOpen] = useState(false);
  if (!event?.tournament_name || !isStaff(role) || !team) return null;

  return (
    <>
      <div style={{
        backgroundColor: 'var(--em-accent-soft)', border: '1px solid var(--em-accent)',
        borderRadius: 10, padding: 12, margin: '12px 16px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
      }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--em-accent)', marginBottom: 2 }}>
            Tournament
          </div>
          <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--em-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {event.tournament_name}
          </div>
        </div>
        <button type="button" onClick={() => setOpen(true)} className="sf-press" style={{
          minHeight: 44, padding: '0 14px', borderRadius: 10,
          backgroundColor: 'var(--em-accent)', color: 'var(--em-text-inverse)',
          fontSize: 13, fontWeight: 600, border: 'none',
          display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap',
        }}>
          <FileText size={16} strokeWidth={1.75} />
          Briefing
        </button>
      </div>
      {open && <TournamentBriefing event={event} team={team} onClose={() => setOpen(false)} />}
    </>
  );
}
