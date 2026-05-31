import React from 'react';
import { formatTournamentRange } from '../../lib/formatters';

// Compact tournament card. Frank-reported 2026-05-20 ("Redesign as the
// tiles take up too much space for tournaments"). The prior layout
// rendered ~200px per tournament with a separate body section and a
// dedicated row per participating team. This version collapses the
// per-team rows into inline chips and tightens the header to a single
// title-row plus a meta-row, cutting total height by ~50%.
//
// Date range now routes through the shared formatTournamentRange helper
// (was a local copy with a buggy `T00:00:00` midnight anchor that rendered
// date-only values one day early during EDT — fixed by the helper's noon anchor).

function statusPillClass(status) {
  if (status === 'Complete') return 'bc-tourney-pill complete';
  if (status === 'Up Next') return 'bc-tourney-pill next';
  return 'bc-tourney-pill';
}

function participantChipClass(participant) {
  const place = (participant.final_place || '').toLowerCase();
  if (place === 'champions') return 'bc-tourney-chip champions';
  if (place === 'finalists') return 'bc-tourney-chip finalists';
  return 'bc-tourney-chip';
}

function ParticipantChip({ participant, isCompleted }) {
  const { team, final_record_wins, final_record_losses } = participant;
  const hasRecord = (final_record_wins ?? 0) + (final_record_losses ?? 0) > 0;
  // 2026-05-20 — was `isCompleted && !final_place && hasRecord` which
  // hid the W/L when a team finished as Champions or Finalists. Frank
  // flagged on Records: Rumble for the Ring CT showed 8U Boys 1-2 but
  // 11U Girls (Finalists, 3-2) and 10U Black (Champions, 4-0) had no
  // record — same for ZG Chase for the Chain NY. Chip color carries
  // the podium label; the W/L is additional, not redundant.
  const showRecord = isCompleted && hasRecord;

  return (
    <span className={participantChipClass(participant)}>
      <span
        className="bc-tourney-team-dot"
        style={{ backgroundColor: team.team_color || 'var(--em-bc-text-mute)' }}
        aria-hidden="true"
      />
      {team.name}
      {showRecord && (
        <span className="bc-tourney-chip-record">
          {final_record_wins}–{final_record_losses}
        </span>
      )}
    </span>
  );
}

export default function TournamentCard({ tournament }) {
  if (!tournament) return null;

  const dateRange = formatTournamentRange(tournament.start_date, tournament.end_date);
  const status = tournament.display_status || 'Upcoming';
  const isCompleted = status === 'Complete';
  const participants = tournament.participants || [];

  return (
    <article className="bc-tourney">
      <div className="bc-tourney-title-row">
        <span className="bc-tourney-name">{tournament.name}</span>
        <span className={statusPillClass(status)}>{status}</span>
      </div>
      <div className="bc-tourney-meta-row">
        {dateRange && <span className="bc-tourney-date">{dateRange}</span>}
        {dateRange && tournament.primary_venue && <span className="bc-tourney-meta-sep">·</span>}
        {tournament.primary_venue && (
          <span className="bc-tourney-venue">{tournament.primary_venue}</span>
        )}
      </div>
      {participants.length > 0 && (
        <div className="bc-tourney-chips">
          {participants.map((p) => (
            <ParticipantChip
              key={p.team.id}
              participant={p}
              isCompleted={isCompleted}
            />
          ))}
        </div>
      )}
    </article>
  );
}
