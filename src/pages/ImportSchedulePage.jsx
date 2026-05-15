// Wave 5 PR 2 — /admin/import-schedule page. Single-paste TourneyMachine
// flow: paste → parse → preview → commit. Per audit + spike: paste-only;
// hybrid LLM + 8 validation rules; per-row inline edit before commit.

import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/useToast';
import { useImportSchedule } from '../hooks/useImportSchedule';
import PastePane from '../components/schedule-import/PastePane';
import PreviewTable from '../components/schedule-import/PreviewTable';

const headerStyle = { padding: '24px 24px 16px 24px', borderBottom: '1px solid var(--em-border-default)', marginBottom: 24 };
const titleStyle = { fontSize: 20, fontWeight: 700, color: 'var(--em-text-primary)', marginBottom: 4 };
const subStyle = { fontSize: 13, color: 'var(--em-text-secondary)' };

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

  const onCommit = async () => {
    try {
      const { inserted, updated } = await im.commit();
      showToast(`Imported ${inserted} new + ${updated} updated events.`, 'success');
    } catch (e) {
      showToast(`Import failed: ${e.message}`, 'error');
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--em-bg-page)' }}>
      <div style={headerStyle}>
        <div style={titleStyle}>Import tournament schedule</div>
        <div style={subStyle}>Paste from TourneyMachine. Parser maps games to your teams + venues. Preview before commit.</div>
        <div style={{ marginTop: 12, display: 'flex', gap: 8, alignItems: 'center' }}>
          <label htmlFor="t-pick" style={{ fontSize: 13, color: 'var(--em-text-secondary)' }}>Tournament:</label>
          <select id="t-pick" value={tournamentId} onChange={(e) => setTournamentId(e.target.value)}
            style={{ minHeight: 36, padding: '0 10px', borderRadius: 8, border: '1px solid var(--em-border-default)', backgroundColor: 'var(--em-bg-card)', fontSize: 13, fontFamily: 'inherit' }}>
            <option value="">Select…</option>
            {tournaments.map((t) => <option key={t.id} value={t.id}>{t.name} ({t.start_date} – {t.end_date})</option>)}
          </select>
        </div>
      </div>

      {im.state === 'idle' || im.state === 'parsing' || im.state === 'error' ? (
        <PastePane paste={im.paste} setPaste={im.setPaste} onParse={im.parse} parsing={im.state === 'parsing'} />
      ) : null}

      {im.state === 'preview' || im.state === 'committing' || im.state === 'done' ? (
        <PreviewTable rows={im.rows} validation={im.validation} dedup={im.dedup} canCommit={im.canCommit}
          onUpdateRow={im.updateRow} onRemoveRow={im.removeRow} onCommit={onCommit}
          committing={im.state === 'committing'} />
      ) : null}

      {im.error && (
        <div style={{ maxWidth: 720, margin: '16px auto', padding: 12, backgroundColor: 'var(--em-danger-soft)', border: '1px solid var(--em-danger)', borderRadius: 8, color: 'var(--em-text-primary)', fontSize: 13 }}>
          {im.error.message || String(im.error)}
        </div>
      )}
    </div>
  );
}
