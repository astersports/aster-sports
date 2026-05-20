import { useEffect, useState } from 'react';
import { Copy } from 'lucide-react';
import AdminBackHeader from '../components/admin/AdminBackHeader';
import statGrid from '../lib/engine/renderers/statGrid';
import poolStandings from '../lib/engine/renderers/poolStandings';
import resultsTable from '../lib/engine/renderers/resultsTable';
import weeklySchedule from '../lib/engine/renderers/weeklySchedule';
import labeledKeys from '../lib/engine/renderers/labeledKeys';
import hotelBlock from '../lib/engine/renderers/hotelBlock';
import championCallout from '../lib/engine/renderers/championCallout';
import tiebreakerExplainer from '../lib/engine/renderers/tiebreakerExplainer';
import otherGames from '../lib/engine/renderers/otherGames';
import opsNotes from '../lib/engine/renderers/opsNotes';
import ctaButtons from '../lib/engine/renderers/ctaButtons';
import statsNarrative from '../lib/engine/renderers/statsNarrative';
import signoff from '../lib/engine/renderers/signoff';
import { composeWeeklyDigest } from '../lib/engine/renderers/weeklyDigest';
import { multiTeam as multiTeamDigestFixture } from '../lib/engine/__fixtures__/weeklyDigest';
import statGridFixture from '../lib/engine/__fixtures__/statGrid';
import poolStandingsFixture from '../lib/engine/__fixtures__/poolStandings';
import resultsTableFixture from '../lib/engine/__fixtures__/resultsTable';
import weeklyScheduleFixture from '../lib/engine/__fixtures__/weeklySchedule';
import labeledKeysFixture from '../lib/engine/__fixtures__/labeledKeys';
import hotelBlockFixture from '../lib/engine/__fixtures__/hotelBlock';
import championCalloutFixture from '../lib/engine/__fixtures__/championCallout';
import tiebreakerExplainerFixture from '../lib/engine/__fixtures__/tiebreakerExplainer';
import otherGamesFixture from '../lib/engine/__fixtures__/otherGames';
import opsNotesFixture from '../lib/engine/__fixtures__/opsNotes';
import ctaButtonsFixture from '../lib/engine/__fixtures__/ctaButtons';
import statsNarrativeFixture from '../lib/engine/__fixtures__/statsNarrative';
import signoffFixture from '../lib/engine/__fixtures__/signoff';

// L99 v6 §5.2 C1 follow-up — Engine Preview page redesign 2026-05-20.
// PR #371 removed the tile from the admin grid (dev surface, not
// production). PR #375-adjacent (this one) makes the page itself
// mobile-responsive + adds Back button + copy buttons for HTML and
// plainText output. Previous layout was a fixed 260px sidebar +
// flex main that got cut off on phone width.
//
// New layout:
//   - Mobile (≤700px): renderer picker is a native <select> dropdown
//     at the top; preview stacks below
//   - Desktop (>700px): keeps the original sidebar + main split
//   - Both: Copy HTML + Copy plainText buttons near the preview

const REGISTRY = [
  { key: 'stat_grid',            label: '#2 — Stat Grid',           render: statGrid,            fixture: statGridFixture },
  { key: 'pool_standings',       label: '#4 — Pool Standings',      render: poolStandings,       fixture: poolStandingsFixture },
  { key: 'results_table',        label: '#5 — Results Table',       render: resultsTable,        fixture: resultsTableFixture },
  { key: 'weekly_schedule',      label: '#6 — Weekly Schedule',     render: weeklySchedule,      fixture: weeklyScheduleFixture },
  { key: 'labeled_keys',         label: '#7 — Labeled Keys',        render: labeledKeys,         fixture: labeledKeysFixture },
  { key: 'hotel_block',          label: 'T1 — Hotel Block',         render: hotelBlock,          fixture: hotelBlockFixture },
  { key: 'champion_callout',     label: 'T2 — Champion Callout',    render: championCallout,     fixture: championCalloutFixture },
  { key: 'tiebreaker_explainer', label: 'T3 — Tiebreaker',          render: tiebreakerExplainer, fixture: tiebreakerExplainerFixture },
  { key: 'other_games',          label: 'T4 — Other Games',         render: otherGames,          fixture: otherGamesFixture },
  { key: 'ops_notes',            label: 'T5 — Ops Notes',           render: opsNotes,            fixture: opsNotesFixture },
  { key: 'cta_buttons',          label: 'T6 — CTA Buttons',         render: ctaButtons,          fixture: ctaButtonsFixture },
  { key: 'stats_narrative',      label: 'F1 — Stats Narrative',     render: statsNarrative,      fixture: statsNarrativeFixture },
  { key: 'signoff',              label: 'F2 — Signoff',             render: signoff,             fixture: signoffFixture },
  { key: 'weekly_digest',        label: 'K — Weekly Digest (kind)', render: composeWeeklyDigest, fixture: multiTeamDigestFixture },
];

const ITEM = (selected) => ({
  display: 'block', width: '100%', textAlign: 'left',
  padding: '8px 12px', borderRadius: 6, marginBottom: 2,
  fontSize: 13, fontWeight: selected ? 600 : 500, fontFamily: 'inherit',
  color: selected ? 'var(--em-accent)' : 'var(--em-text-primary)',
  backgroundColor: selected ? 'var(--em-accent-soft)' : 'transparent',
  border: 'none', cursor: 'pointer',
});
const EMAIL_FRAME = { maxWidth: 600, margin: '0 auto', backgroundColor: '#ffffff', borderRadius: 8, border: '1px solid var(--em-border-default)', boxShadow: 'var(--em-shadow-sm)', padding: 24, fontFamily: 'Inter,system-ui,sans-serif' };
const PLAIN_BOX = { maxWidth: 600, margin: '12px auto 0 auto', padding: 16, borderRadius: 8, backgroundColor: 'var(--em-bg-card)', border: '1px solid var(--em-border-default)', fontFamily: 'ui-monospace,SFMono-Regular,Menlo,monospace', fontSize: 12, color: 'var(--em-text-secondary)', whiteSpace: 'pre-wrap', overflowX: 'auto' };
const COPY_BTN = { display: 'inline-flex', alignItems: 'center', gap: 4, minHeight: 32, padding: '0 10px', borderRadius: 6, border: '1px solid var(--em-border-default)', backgroundColor: 'var(--em-bg-card)', color: 'var(--em-text-secondary)', fontSize: 12, fontWeight: 500, cursor: 'pointer' };

function useIsMobile() {
  const [m, setM] = useState(() => typeof window !== 'undefined' && window.innerWidth <= 700);
  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const onResize = () => setM(window.innerWidth <= 700);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  return m;
}

function copyToClipboard(text) {
  if (navigator.clipboard?.writeText) navigator.clipboard.writeText(text).catch(() => {});
}

export default function EngineDebugPreviewPage() {
  const [selectedKey, setSelectedKey] = useState(REGISTRY[0].key);
  const entry = REGISTRY.find((r) => r.key === selectedKey) || REGISTRY[0];
  const out = entry.render(entry.fixture);
  const isMobile = useIsMobile();

  return (
    <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', minHeight: 'calc(100vh - 56px)', backgroundColor: 'var(--em-bg-page)' }}>
      {!isMobile && (
        <aside style={{ width: 260, flexShrink: 0, borderRight: '1px solid var(--em-border-default)', backgroundColor: 'var(--em-bg-card)', overflowY: 'auto', padding: '16px 8px' }} aria-label="Renderer list">
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--em-text-tertiary)', padding: '6px 12px 8px' }}>Engine Renderers</div>
          {REGISTRY.map((r) => (
            <button key={r.key} type="button" onClick={() => setSelectedKey(r.key)} style={ITEM(r.key === selectedKey)}>{r.label}</button>
          ))}
        </aside>
      )}
      <main style={{ flex: 1, overflowY: 'auto', backgroundColor: 'var(--em-bg-page)', padding: isMobile ? 16 : 24 }}>
        {isMobile && <AdminBackHeader />}
        {isMobile && (
          <div style={{ marginBottom: 12 }}>
            <label htmlFor="ed-picker" style={{ display: 'block', fontSize: 11, fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--em-text-tertiary)', marginBottom: 6 }}>Renderer</label>
            <select id="ed-picker" value={selectedKey} onChange={(e) => setSelectedKey(e.target.value)} style={{ width: '100%', minHeight: 44, padding: '8px 12px', borderRadius: 10, border: '1.5px solid var(--em-border-default)', backgroundColor: 'var(--em-bg-tertiary)', color: 'var(--em-text-primary)', fontSize: 15, fontFamily: 'inherit' }}>
              {REGISTRY.map((r) => <option key={r.key} value={r.key}>{r.label}</option>)}
            </select>
          </div>
        )}
        <div style={{ maxWidth: 600, margin: '0 auto 8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
          <span style={{ fontSize: 13, color: 'var(--em-text-tertiary)' }}>Mock fixture: <code>__fixtures__/{entry.key}.js</code></span>
          <button type="button" onClick={() => copyToClipboard(out.html)} style={COPY_BTN} aria-label="Copy HTML"><Copy size={12} strokeWidth={1.75} /> HTML</button>
        </div>
        <div style={EMAIL_FRAME} dangerouslySetInnerHTML={{ __html: out.html }} />
        <div style={PLAIN_BOX}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <span style={{ fontWeight: 600, color: 'var(--em-text-primary)' }}>plainText</span>
            <button type="button" onClick={() => copyToClipboard(out.plainText || '')} style={COPY_BTN} aria-label="Copy plainText"><Copy size={12} strokeWidth={1.75} /> Copy</button>
          </div>
          {out.plainText || '(empty)'}
        </div>
      </main>
    </div>
  );
}
