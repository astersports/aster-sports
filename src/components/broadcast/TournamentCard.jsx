import React from 'react';

// Compact tournament card. Frank-reported 2026-05-20 ("Redesign as the
// tiles take up too much space for tournaments"). The prior layout
// rendered ~200px per tournament with a separate body section and a
// dedicated row per participating team. This version collapses the
// per-team rows into inline chips and tightens the header to a single
// title-row plus a meta-row, cutting total height by ~50%.

function formatDateRange(startDate, endDate) {
  if (!startDate) return '';
  const s = new Date(startDate + 'T00:00:00');
  const sMonth = s.toLocaleDateString('en-US', { month: 'short', timeZone: 'America/New_York' });
  const sDay = s.getDate();
  if (!endDate) return `${sMonth} ${sDay}`;
  const e = new Date(endDate + 'T00:00:00');
  const eMonth = e.toLocaleDateString('en-US', { month: 'short', timeZone: 'America/New_York' });
  const eDay = e.getDate();
  if (sMonth === eMonth) return `${sMonth} ${sDay}–${eDay}`;
  return `${sMonth} ${sDay}–${eMonth} ${eDay}`;
}

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
  const { team, final_place, final_record_wins, final_record_losses } = participant;
  const hasRecord = (final_record_wins ?? 0) + (final_record_losses ?? 0) > 0;
  const showRecord = isCompleted && !final_place && hasRecord;

  return (
    <span className={participantChipClass(participant)}>
      <span
        className="bc-tourney-team-dot"
        style={{ backgroundColor: team.team_color || 'var(--sf-bc-text-mute)' }}
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

  const dateRange = formatDateRange(tournament.start_date, tournament.end_date);
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
