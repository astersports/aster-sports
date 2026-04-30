import React from 'react';

function formatDateRange(startDate, endDate) {
  if (!startDate) return '';
  const s = new Date(startDate + 'T00:00:00');
  const sMonth = s.toLocaleDateString('en-US', { month: 'short' });
  const sDay = s.getDate();
  if (!endDate) return `${sMonth} ${sDay}`;
  const e = new Date(endDate + 'T00:00:00');
  const eMonth = e.toLocaleDateString('en-US', { month: 'short' });
  const eDay = e.getDate();
  if (sMonth === eMonth) return `${sMonth} ${sDay}–${eDay}`;
  return `${sMonth} ${sDay}–${eMonth} ${eDay}`;
}

function statusPillClass(status) {
  if (status === 'Complete') return 'bc-tourney-pill complete';
  if (status === 'Up Next') return 'bc-tourney-pill next';
  return 'bc-tourney-pill';
}

function ParticipantRow({ participant, isCompleted }) {
  const { team, final_place, final_record_wins, final_record_losses } = participant;
  const placement = final_place;
  const hasRecord = (final_record_wins ?? 0) + (final_record_losses ?? 0) > 0;
  const showRecord = isCompleted && !placement && hasRecord;
  const recordText = showRecord
    ? `${final_record_wins}–${final_record_losses}`
    : null;
  const badgeClass = placement && placement.toLowerCase() === 'finalists'
    ? 'bc-tourney-badge finalists'
    : 'bc-tourney-badge';

  return (
    <div className="bc-tourney-row">
      <span className="bc-tourney-team">
        <span
          className="bc-tourney-team-dot"
          style={{ backgroundColor: team.team_color || 'var(--sf-bc-text-mute)' }}
          aria-hidden="true"
        />
        {team.name}
      </span>
      {placement && <span className={badgeClass}>{placement}</span>}
      {recordText && <span className="bc-tourney-record">{recordText}</span>}
    </div>
  );
}

export default function TournamentCard({ tournament }) {
  if (!tournament) return null;

  const dateRange = formatDateRange(tournament.start_date, tournament.end_date);
  const status = tournament.display_status || 'Upcoming';
  const isCompleted = status === 'Complete';

  return (
    <article className="bc-tourney">
      <div className="bc-tourney-head">
        <div>
          <div className="bc-tourney-name">{tournament.name}</div>
          {dateRange && <div className="bc-tourney-date">{dateRange}</div>}
        </div>
        <span className={statusPillClass(status)}>{status}</span>
      </div>
      <div className="bc-tourney-body">
        {tournament.primary_venue && (
          <div className="bc-tourney-loc">{tournament.primary_venue}</div>
        )}
        {tournament.participants && tournament.participants.map((p) => (
          <ParticipantRow
            key={p.team.id}
            participant={p}
            isCompleted={isCompleted}
          />
        ))}
      </div>
    </article>
  );
}
