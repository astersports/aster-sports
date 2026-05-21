// Wave 3.12 — three-tab strip with badges. Active tab badge counts
// items needing attention; History badge informational.
//
// Wave 4.1b §6.F — the Compose tab key was repurposed: it always opened
// the composer instead of switching views. Renamed to "Drafts" with a
// count badge of in-progress drafts. The "Compose" CTA top-right
// (BriefingsHero) and the floating ComposeFab remain the only "start
// new" entry points.

import Badge from '../../shared/Badge';

const wrap = { display: 'flex', borderBottom: '1px solid var(--em-border-default)', gap: 4 };
const tabBase = (active) => ({
  flex: '1 1 auto', minHeight: 44, padding: '0 14px', fontSize: 14, fontWeight: 600, fontFamily: 'inherit',
  border: 'none', backgroundColor: 'transparent', cursor: 'pointer',
  color: active ? 'var(--em-text-primary)' : 'var(--em-text-secondary)',
  borderBottom: active ? '2px solid var(--em-accent)' : '2px solid transparent',
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
});
// Count-badge typography retained at fontWeight 700 + padding 2px 7px
// (slightly tighter than Badge's default 2px 8px) to preserve the
// inbox-tab rhythm; merged via the `style` override prop.
const COUNT_BADGE_STYLE = { fontWeight: 700, padding: '2px 7px' };

const TABS = [
  { key: 'active', label: 'Active' },
  { key: 'drafts', label: 'Drafts' },
  { key: 'history', label: 'History' },
];

export default function InboxTabs({ activeTab, activeCount, draftCount, historyCount, onChange }) {
  return (
    <div role="tablist" style={wrap}>
      {TABS.map((t) => {
        const isActive = t.key === activeTab;
        let badge = null;
        if (t.key === 'active' && activeCount > 0) badge = <Badge variant="urgent" pill style={COUNT_BADGE_STYLE}>{activeCount}</Badge>;
        if (t.key === 'drafts' && draftCount > 0) badge = <Badge variant="subtle" pill style={COUNT_BADGE_STYLE}>{draftCount}</Badge>;
        if (t.key === 'history' && historyCount > 0) badge = <Badge variant="subtle" pill style={COUNT_BADGE_STYLE}>{historyCount}</Badge>;
        return (
          <button key={t.key} type="button" role="tab" aria-selected={isActive} tabIndex={isActive ? 0 : -1}
            onClick={() => onChange(t.key)} style={tabBase(isActive)}>
            {t.label}{badge}
          </button>
        );
      })}
    </div>
  );
}
