import React from 'react';

/**
 * Tournament card. Dark navy header (name + dates + status pill),
 * white-on-navy body with location and per-team result rows.
 *
 * status: 'complete' | 'upcoming' | 'next'
 * results: [{ team, badge?: string }]   badge example: "Champions", "Finalists"
 */
export default function TournamentCard({
  name,
  dateRange,
  location,
  status = 'upcoming',
  results = [],
}) {
  const pillClass =
    status === 'next'     ? 'bc-tourney-pill next'
    : status === 'complete' ? 'bc-tourney-pill complete'
    : 'bc-tourney-pill';
  const pillLabel =
    status === 'next'     ? 'Up Next'
    : status === 'complete' ? 'Complete'
    : 'Upcoming';

  return (
    <article className="bc-tourney">
      <div className="bc-tourney-head">
        <div>
          <div className="bc-tourney-name">{name}</div>
          {dateRange && <div className="bc-tourney-date">{dateRange}</div>}
        </div>
        <span className={pillClass}>{pillLabel}</span>
      </div>
      <div className="bc-tourney-body">
        {location && <div className="bc-tourney-loc">{location}</div>}
        {results.map((r, i) => (
          <div className="bc-tourney-row" key={`${r.team}-${i}`}>
            <span className="bc-tourney-team">{r.team}</span>
            {r.badge && <span className="bc-tourney-badge">{r.badge}</span>}
          </div>
        ))}
      </div>
    </article>
  );
}
