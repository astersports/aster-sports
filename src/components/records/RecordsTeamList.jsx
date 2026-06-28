import { useMemo, useState } from 'react';
import { AlertCircle, RotateCw, Trophy } from 'lucide-react';
import { EMPTY_SUMMARY } from '../../lib/teamRecords';
import TeamAccordion from './TeamAccordion';
import RecordsControls from './RecordsControls';
import { applyRecordsView, RECORDS_FILTERS } from './recordsSort';

// Self-contained team-records list: owns sort/filter state, renders the
// control row, and handles loading / error / empty states. RecordsPage stays
// thin (AP #6 cap discipline). One expanded team at a time.
export default function RecordsTeamList({ teams, recordsByTeam, loading, error, onRetry }) {
  const [sort, setSort] = useState('default');
  const [filter, setFilter] = useState('all');
  const [expanded, setExpanded] = useState(null);

  const summaryFor = (id) => recordsByTeam[id] || EMPTY_SUMMARY;

  const filterCounts = useMemo(() => {
    const counts = {};
    for (const f of RECORDS_FILTERS) counts[f.key] = teams.filter(f.match).length;
    return counts;
  }, [teams]);

  const view = useMemo(
    () => applyRecordsView(teams, (id) => recordsByTeam[id] || EMPTY_SUMMARY, { sort, filter }),
    [teams, recordsByTeam, sort, filter],
  );

  if (error) {
    return (
      <div className="bc-empty" role="alert" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
        <AlertCircle size={28} strokeWidth={1.75} aria-hidden="true" color="var(--as-bc-red)" />
        <span>Couldn&apos;t load the records. Try again in a moment.</span>
        {onRetry && (
          <button type="button" className="as-press" onClick={onRetry}
            style={{ minHeight: 44, padding: '0 18px', display: 'inline-flex', alignItems: 'center', gap: 6, borderRadius: 8, cursor: 'pointer', fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', fontSize: 13, color: '#151525', background: 'var(--as-bc-cobalt)', border: '1px solid var(--as-bc-cobalt)' }}>
            <RotateCw size={14} strokeWidth={1.75} aria-hidden="true" /> Retry
          </button>
        )}
      </div>
    );
  }

  if (loading) {
    return Array.from({ length: 5 }).map((_, i) => <div key={i} className="bc-team-skeleton" />);
  }

  if (!teams.length) {
    return (
      <div className="bc-empty" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
        <Trophy size={28} strokeWidth={1.75} aria-hidden="true" color="var(--as-bc-cobalt)" />
        <span>No teams in this season yet — the standings light up the moment the first game is in.</span>
      </div>
    );
  }

  return (
    <>
      <RecordsControls sort={sort} onSort={setSort} filter={filter} onFilter={setFilter} filterCounts={filterCounts} />
      <div role="status" aria-live="polite" aria-atomic="true" style={{ position: 'absolute', left: -9999, width: 1, height: 1, overflow: 'hidden' }}>
        {`Showing ${view.length} of ${teams.length} teams.`}
      </div>
      {!view.length ? (
        <div className="bc-empty">No teams match that circuit. Try another filter.</div>
      ) : (
        view.map((team) => (
          <TeamAccordion
            key={team.id}
            team={team}
            summary={summaryFor(team.id)}
            expanded={expanded === team.id}
            onToggle={() => setExpanded(expanded === team.id ? null : team.id)}
          />
        ))
      )}
    </>
  );
}
