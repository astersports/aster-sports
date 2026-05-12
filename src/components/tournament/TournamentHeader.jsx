import { useMemo, useState } from 'react';
import { Calendar, Edit2, ExternalLink, MapPin, Trophy } from 'lucide-react';
import StatusBadge from './StatusBadge';
import TournamentFormSheet from './TournamentFormSheet';
import ComposeTournamentCta from './ComposeTournamentCta';
import SendBriefingButton from '../briefings/SendBriefingButton';

function tournamentBriefingKinds(t) {
  const kinds = ['announcement', 'custom_message'];
  if (t?.start_date && new Date(t.start_date) > new Date()) kinds.unshift('tournament_prelim');
  if (t?.end_date && new Date(t.end_date) < new Date()) kinds.unshift('tournament_recap');
  return kinds;
}

function formatRange(start, end) {
  if (!start || !end) return '';
  const s = new Date(start + 'T12:00:00');
  const e = new Date(end + 'T12:00:00');
  const opts = { month: 'short', day: 'numeric', year: 'numeric' };
  if (start === end) return s.toLocaleDateString('en-US', opts);
  const sameMonth = s.getMonth() === e.getMonth();
  if (sameMonth) {
    const shortOpts = { month: 'short', day: 'numeric' };
    return `${s.toLocaleDateString('en-US', shortOpts)}–${e.getDate()}, ${s.getFullYear()}`;
  }
  return `${s.toLocaleDateString('en-US', opts)} – ${e.toLocaleDateString('en-US', opts)}`;
}

export default function TournamentHeader({ tournament, isStaff, onChange }) {
  const [editing, setEditing] = useState(false);
  const dateRange = formatRange(tournament.start_date, tournament.end_date);
  const briefingKinds = useMemo(() => tournamentBriefingKinds(tournament), [tournament]);
  // Wave 4.8 6b Session 2: gate Compose CTA on upcoming/completed.
  // In-flight tournaments (mid-event) render no CTA — neither prelim nor
  // recap fits the moment. Mirrors tournamentBriefingKinds:9-10 predicates.
  const now = new Date();
  const ctaKind = tournament.start_date && new Date(tournament.start_date) > now
    ? 'tournament_prelim'
    : (tournament.end_date && new Date(tournament.end_date) < now ? 'tournament_recap' : null);

  return (
    <div style={{ padding: '6px 16px 12px', borderBottom: '1px solid var(--em-border-default)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 8 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <Trophy size={14} strokeWidth={1.75} color="var(--em-text-tertiary)" />
            {tournament.circuit && (
              <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--em-text-secondary)' }}>
                {tournament.circuit}
              </span>
            )}
          </div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--em-text-primary)', margin: 0, lineHeight: 1.2, wordBreak: 'break-word' }}>
            {tournament.name}
          </h1>
        </div>
        <StatusBadge status={tournament.status} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--em-text-secondary)' }}>
          <Calendar size={13} strokeWidth={1.75} />
          <span>{dateRange}</span>
        </div>
        {tournament.tourney_url && (
          <a href={tournament.tourney_url} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 500, color: 'var(--em-accent)', textDecoration: 'none' }}>
            <ExternalLink size={13} strokeWidth={1.75} />
            <span>View on SE Tourney</span>
          </a>
        )}
        {tournament.primary_venue && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--em-text-secondary)' }}>
            <MapPin size={13} strokeWidth={1.75} />
            <span>{tournament.primary_venue}</span>
          </div>
        )}
      </div>

      {tournament.teams?.length > 0 && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: isStaff ? 12 : 0 }}>
          {tournament.teams.map((t) => (
            <span key={t.id} style={{
              fontSize: 13, fontWeight: 500, padding: '3px 10px', borderRadius: 999,
              backgroundColor: 'var(--em-bg-tertiary)', color: 'var(--em-text-primary)',
              borderLeft: `3px solid ${t.team_color || 'var(--em-text-tertiary)'}`,
            }}>
              {t.name}
            </span>
          ))}
        </div>
      )}

      {isStaff && ctaKind && <ComposeTournamentCta tournament={tournament} kind={ctaKind} />}
      {isStaff && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button onClick={() => setEditing(true)} className="sf-press" aria-label="Edit tournament" style={{
            minHeight: 40, padding: '0 14px', borderRadius: 10,
            border: '1.5px solid var(--em-border-default)',
            backgroundColor: 'var(--em-bg-card)', color: 'var(--em-text-primary)',
            fontSize: 13, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6,
            cursor: 'pointer',
          }}>
            <Edit2 size={14} strokeWidth={1.75} /> Edit
          </button>
          <SendBriefingButton anchorKind="tournament" anchorId={tournament.id} kindFilter={briefingKinds} />
        </div>
      )}

      {editing && (
        <TournamentFormSheet
          tournament={tournament}
          onClose={() => { setEditing(false); onChange?.(); }}
        />
      )}
    </div>
  );
}
