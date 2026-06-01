// Wave 5 PR 2 — /admin/import-schedule page. Single-paste TourneyMachine
// flow: paste → parse → preview → commit. Per audit + spike: paste-only;
// hybrid LLM + 8 validation rules; per-row inline edit before commit.

import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import AdminBackHeader from '../components/admin/AdminBackHeader';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/useToast';
import { useImportSchedule } from '../hooks/useImportSchedule';
import { useCoverageConflicts } from '../hooks/useCoverageConflicts';
import { useOrgCoaches } from '../hooks/useOrgCoaches';
import PastePane from '../components/schedule-import/PastePane';
import PreviewTable from '../components/schedule-import/PreviewTable';
import CoverageConflictBanner from '../components/schedule-import/CoverageConflictBanner';

const headerStyle = { padding: '24px 24px 16px 24px', borderBottom: '1px solid var(--as-border-default)', marginBottom: 24 };
const titleStyle = { fontSize: 20, fontWeight: 700, color: 'var(--as-text-primary)', marginBottom: 4 };
const subStyle = { fontSize: 13, color: 'var(--as-text-secondary)' };

export default function ImportSchedulePage() {
  const [params] = useSearchParams();
  const tournamentIdParam = params.get('tournament_id');
  const { orgId } = useAuth();
  const { showToast } = useToast();
  const [tournaments, setTournaments] = useState([]);
  const [tournamentId, setTournamentId] = useState(tournamentIdParam || '');

  useEffect(() => {
    if (!orgId) return;
    let cancelled = false;
    Promise.resolve().then(async () => {
      const { data } = await supabase.from('tournaments')
        .select('id, name, start_date, end_date').eq('org_id', orgId)
        .is('archived_at', null).order('start_date', { ascending: false }).limit(20);
      if (!cancelled) setTournaments(data || []);
    });
    return () => { cancelled = true; };
  }, [orgId]);

  const im = useImportSchedule(tournamentId);
  const { conflicts, coachNameMap } = useCoverageConflicts(im.rows);
  const coachOptions = useOrgCoaches();

  const onCommit = async () => {
    try {
      const { inserted, updated } = await im.commit();
      showToast(`Imported ${inserted} new + ${updated} updated events.`, 'success');
    } catch (e) {
      showToast(`Import failed: ${e.message}`, 'error');
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--as-bg-page)' }}>
      <div style={{ padding: '8px 16px 0' }}><AdminBackHeader /></div>
      <div style={headerStyle}>
        <div style={titleStyle}>Import tournament schedule</div>
        <div style={subStyle}>Paste from TourneyMachine. Parser maps games to your teams + venues. Preview before commit.</div>
        <div style={{ marginTop: 12, display: 'flex', gap: 8, alignItems: 'center' }}>
          <label htmlFor="t-pick" style={{ fontSize: 13, color: 'var(--as-text-secondary)' }}>Tournament:</label>
          <select id="t-pick" value={tournamentId} onChange={(e) => setTournamentId(e.target.value)}
            style={{ minHeight: 44, padding: '0 10px', borderRadius: 8, border: '1px solid var(--as-border-default)', backgroundColor: 'var(--as-bg-card)', fontSize: 13, fontFamily: 'inherit' }}>
            <option value="">Select…</option>
            {tournaments.map((t) => <option key={t.id} value={t.id}>{t.name} ({t.start_date} – {t.end_date})</option>)}
          </select>
        </div>
      </div>

      {im.state === 'idle' || im.state === 'parsing' || im.state === 'error' ? (
        <PastePane paste={im.paste} setPaste={im.setPaste} onParse={im.parse} parsing={im.state === 'parsing'} />
      ) : null}

      {im.state === 'preview' || im.state === 'committing' ? (
        <>
          <CoverageConflictBanner conflicts={conflicts} coachNameMap={coachNameMap}
            coachOptions={coachOptions} rows={im.rows}
            onDelegate={(idx, coachId) => im.updateRow(idx, { delegated_coach_user_id: coachId })} />
          <PreviewTable rows={im.rows} validation={im.validation} dedup={im.dedup} canCommit={im.canCommit}
            onUpdateRow={im.updateRow} onRemoveRow={im.removeRow} onCommit={onCommit}
            committing={im.state === 'committing'} teams={im.teams} />
        </>
      ) : null}

      {im.state === 'done' && (
        // Wave 5 follow-up — post-commit success view. Previously the
        // PreviewTable kept rendering with a live Commit button, which
        // let operators re-commit the same rows (stale dedup labels →
        // duplicate inserts). Replacing the preview with a confirmation
        // forces an explicit "Import another" reset.
        <div style={{ maxWidth: 720, margin: '16px auto', padding: 24, backgroundColor: 'var(--as-success-soft)', border: '1px solid var(--as-success)', borderRadius: 10, textAlign: 'center' }}>
          <div style={{ fontSize: 24, marginBottom: 8 }}>✓</div>
          <div style={{ fontSize: 17, fontWeight: 600, color: 'var(--as-text-primary)', marginBottom: 6 }}>Import complete</div>
          <div style={{ fontSize: 14, color: 'var(--as-text-secondary)', marginBottom: 16 }}>
            {im.lastCommit?.inserted || 0} new · {im.lastCommit?.updated || 0} updated
          </div>
          <button type="button" onClick={im.reset} className="as-press"
            style={{ minHeight: 44, padding: '0 24px', borderRadius: 10, border: '1px solid var(--as-accent)', backgroundColor: 'var(--as-bg-card)', color: 'var(--as-accent)', fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>
            Import another
          </button>
        </div>
      )}

      {im.error && (
        <div style={{ maxWidth: 720, margin: '16px auto', padding: 12, backgroundColor: 'var(--as-danger-soft)', border: '1px solid var(--as-danger)', borderRadius: 8, color: 'var(--as-text-primary)', fontSize: 13 }}>
          {im.error.message || String(im.error)}
        </div>
      )}
    </div>
  );
}
