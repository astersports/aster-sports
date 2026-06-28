import { CARD, DIVIDER, SECTION_LABEL } from './settingsStyles';
import SettingsRow from './SettingsRow';
import SettingsSkeletonRow from './SettingsSkeletonRow';

// A labelled settings group: an icon'd section header + a card of rows, with
// search-filter awareness and loading/empty handling baked in. The page declares
// each group's rows declaratively; this component renders the header, the
// dividers between rows, the loading skeletons, and hides itself entirely when a
// search query filters out all of its rows. Token-only colors per CLAUDE.md §3.
export default function SettingsGroup({ label, icon: Icon, rows, query }) {
  const q = (query || '').trim().toLowerCase();
  const visible = q
    ? rows.filter((r) => `${r.title} ${r.summary} ${r.keywords || ''}`.toLowerCase().includes(q))
    : rows;
  if (visible.length === 0) return null;

  return (
    <section aria-labelledby={`settings-${label.toLowerCase()}`}>
      <h2 id={`settings-${label.toLowerCase()}`} style={SECTION_LABEL}>
        {Icon ? <Icon size={13} strokeWidth={2} aria-hidden="true" /> : null}
        {label}
      </h2>
      <ul role="list" style={{ ...CARD, margin: '0 0 20px', padding: 0 }}>
        {visible.map((r, i) => (
          <div key={r.id}>
            {i > 0 ? <div style={DIVIDER} /> : null}
            {r.loading
              ? <SettingsSkeletonRow />
              : <SettingsRow {...r} />}
          </div>
        ))}
      </ul>
    </section>
  );
}
