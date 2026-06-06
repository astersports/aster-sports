import AdminProgramHealth from './AdminProgramHealth';
import QuickActions from '../admin/QuickActions';

// AdminTail — slot 5 (RoleTail) for admin home. The v2 Program-health KPI
// context card (Players · Events · Collected · Out + week) + the QuickActions
// shortcut grid (navigation chrome, not a card).
const LABEL = {
  fontSize: 11, fontWeight: 600, letterSpacing: '0.1em',
  textTransform: 'uppercase', color: 'var(--as-text-meta)', marginBottom: 8, padding: '0 2px',
};

export default function AdminTail({ season, nowMs, eventsCount }) {
  return (
    <>
      <AdminProgramHealth season={season} nowMs={nowMs} eventsCount={eventsCount} />
      <section className="min-w-0" aria-label="Shortcuts">
        <div style={LABEL}>Shortcuts</div>
        <QuickActions />
      </section>
    </>
  );
}
