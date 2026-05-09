import { useState } from 'react';
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

const sidebarStyle = {
  width: 260, flexShrink: 0, borderRight: '1px solid var(--em-border-default)',
  backgroundColor: 'var(--em-bg-card)', overflowY: 'auto',
  padding: '16px 8px',
};
const itemStyle = (selected) => ({
  display: 'block', width: '100%', textAlign: 'left',
  padding: '8px 12px', borderRadius: 6, marginBottom: 2,
  fontSize: 13, fontWeight: selected ? 600 : 500, fontFamily: 'inherit',
  color: selected ? 'var(--em-accent)' : 'var(--em-text-primary)',
  backgroundColor: selected ? 'var(--em-accent-soft)' : 'transparent',
  border: 'none', cursor: 'pointer',
});
const mainStyle = {
  flex: 1, overflowY: 'auto', backgroundColor: 'var(--em-bg-page)',
  padding: 24,
};
const emailFrameStyle = {
  maxWidth: 600, margin: '0 auto',
  backgroundColor: '#ffffff', borderRadius: 8,
  border: '1px solid var(--em-border-default)',
  boxShadow: 'var(--em-shadow-sm)', padding: 24,
  fontFamily: 'Inter,system-ui,sans-serif',
};
const plainBoxStyle = {
  maxWidth: 600, margin: '24px auto 0 auto',
  padding: 16, borderRadius: 8,
  backgroundColor: 'var(--em-bg-card)', border: '1px solid var(--em-border-default)',
  fontFamily: 'ui-monospace,SFMono-Regular,Menlo,monospace',
  fontSize: 12, color: 'var(--em-text-secondary)',
  whiteSpace: 'pre-wrap', overflowX: 'auto',
};

export default function EngineDebugPreviewPage() {
  const [selectedKey, setSelectedKey] = useState(REGISTRY[0].key);
  const entry = REGISTRY.find((r) => r.key === selectedKey) || REGISTRY[0];
  const out = entry.render(entry.fixture);

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 56px)', backgroundColor: 'var(--em-bg-page)' }}>
      <aside style={sidebarStyle} aria-label="Renderer list">
        <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--em-text-tertiary)', padding: '6px 12px 8px 12px' }}>
          Engine Renderers
        </div>
        {REGISTRY.map((r) => (
          <button key={r.key} type="button" onClick={() => setSelectedKey(r.key)}
            style={itemStyle(r.key === selectedKey)}>
            {r.label}
          </button>
        ))}
      </aside>
      <main style={mainStyle}>
        <div style={{ maxWidth: 600, margin: '0 auto 12px auto', fontSize: 13, color: 'var(--em-text-tertiary)' }}>
          Mock data fixture: <code>__fixtures__/{entry.key}.js</code>
        </div>
        <div style={emailFrameStyle} dangerouslySetInnerHTML={{ __html: out.html }} />
        <div style={plainBoxStyle}>
          <div style={{ fontWeight: 600, marginBottom: 6, color: 'var(--em-text-primary)' }}>plainText</div>
          {out.plainText || '(empty)'}
        </div>
      </main>
    </div>
  );
}
