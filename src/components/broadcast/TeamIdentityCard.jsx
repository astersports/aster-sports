import React from 'react';

/**
 * Team identity card. Numbered badge + name + meta + record + streak +
 * 5-stat grid (PPG / ALLOWED / DIFF / WIN% / GAMES).
 *
 * teamColor is the ONLY hex that may be passed inline. Sourced from the
 * teams.color column. Used as left border + badge text + record number.
 * Glow alpha derived from teamColor + '40' suffix (25% alpha).
 */
export default function TeamIdentityCard({
  number,
  name,
  meta,
  teamColor,
  record,
  streak,
  stats,
}) {
  const style = teamColor
    ? {
        '--team-color': teamColor,
        '--team-glow': `${teamColor}40`,
      }
    : undefined;
  return (
    <article className="bc-team" style={style} aria-label={`${name} record`}>
      <div className="bc-team-head">
        <div className="bc-team-badge">{number}</div>
        <div className="bc-team-id">
          <div className="bc-team-name">{name}</div>
          {meta && <div className="bc-team-meta">{meta}</div>}
        </div>
        <div>
          <div className="bc-team-rec">{record}</div>
          {streak && <div className="bc-team-streak">{streak}</div>}
        </div>
      </div>
      {stats && (
        <div className="bc-team-grid">
          <Cell num={stats.ppg}     label="PPG" />
          <Cell num={stats.allowed} label="Allowed" />
          <Cell num={formatDiff(stats.diff)} label="Diff" />
          <Cell num={`${stats.winPct}%`} label="Win %" />
          <Cell num={stats.gamesPlayed}  label="Games" />
        </div>
      )}
    </article>
  );
}

function Cell({ num, label }) {
  return (
    <div className="bc-team-cell">
      <div className="bc-team-cell-num">{num}</div>
      <div className="bc-team-cell-lbl">{label}</div>
    </div>
  );
}

function formatDiff(d) {
  if (d == null) return '—';
  const n = Number(d);
  if (Number.isNaN(n)) return '—';
  return n > 0 ? `+${n}` : `${n}`;
}
