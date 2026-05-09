// Wave 3.12 — three-tab strip with badges. Active tab badge counts
// items needing attention; History badge informational.

const wrap = { display: 'flex', borderBottom: '1px solid var(--em-border-default)', gap: 4 };
const tabBase = (active) => ({
  flex: '1 1 auto', minHeight: 44, padding: '0 14px', fontSize: 14, fontWeight: 600, fontFamily: 'inherit',
  border: 'none', backgroundColor: 'transparent', cursor: 'pointer',
  color: active ? 'var(--em-text-primary)' : 'var(--em-text-secondary)',
  borderBottom: active ? '2px solid var(--em-accent)' : '2px solid transparent',
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
});
const badgeStyle = (tone) => ({
  fontSize: 11, fontWeight: 700, padding: '2px 7px', borderRadius: 9999,
  backgroundColor: tone === 'urgent' ? 'var(--em-accent)' : 'var(--em-bg-tertiary)',
  color: tone === 'urgent' ? 'var(--em-text-inverse)' : 'var(--em-text-tertiary)',
});

const TABS = [
  { key: 'active', label: 'Active' },
  { key: 'history', label: 'History' },
  { key: 'compose', label: 'Compose' },
];

export default function InboxTabs({ activeTab, activeCount, historyCount, onChange }) {
  return (
    <div role="tablist" style={wrap}>
      {TABS.map((t) => {
        const isActive = t.key === activeTab;
        let badge = null;
        if (t.key === 'active' && activeCount > 0) badge = <span style={badgeStyle('urgent')}>{activeCount}</span>;
        if (t.key === 'history' && historyCount > 0) badge = <span style={badgeStyle('subtle')}>{historyCount}</span>;
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
