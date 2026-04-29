import React from 'react';
import ChampionshipBadge from './ChampionshipBadge';

/**
 * Single game log row. Win/loss tile + opponent + date + score.
 * result: 'W' | 'L'
 * date: pre-formatted string ("Apr 12")
 * score: pre-formatted string ("32-28")
 * isChampionship: bool — renders championship badge next to opponent name
 *
 * Game log is a vertical feed, not tabular data — no table semantics.
 */
export default function GameLogRow({ result, date, opponent, score, isChampionship }) {
  return (
    <div className="bc-glog">
      <div className={`bc-glog-result ${result}`} aria-label={result === 'W' ? 'Win' : 'Loss'}>
        {result}
      </div>
      <div className="bc-glog-mid">
        <div className="bc-glog-vs">
          {opponent || '—'}
          {isChampionship && <ChampionshipBadge />}
        </div>
        {date && <div className="bc-glog-date">{date}</div>}
      </div>
      <div className="bc-glog-score">{score}</div>
    </div>
  );
}
