import { greetingFor } from '../../lib/greetings';

// Header zone for ParentHomePage — greeting line + org context line.
// Extracted from ParentHomePage in the preemptive split arc per L99
// platform audit PART 5 Phase 4 / PQ3 (2026-05-21). Pure
// presentational. The kid switcher (ChildFilterChips) renders inside
// the schedule section in SignalZone so the visual rhythm of the
// page is preserved (anti-pattern #46 — extraction is invisible to
// users).
export default function ParentHomeHeader({ name, orgName, myTeamsCount }) {
  return (
    <section>
      <div style={{ color: 'var(--em-text-tertiary)', fontSize: 13 }}>{greetingFor()},</div>
      <h1 className="font-bold" style={{ color: 'var(--em-text-primary)', fontSize: 24, letterSpacing: '-0.025em', lineHeight: 1.2 }}>{name}</h1>
      {orgName && <div style={{ color: 'var(--em-text-tertiary)', fontSize: 13, marginTop: 2 }}>{orgName}{myTeamsCount > 0 ? ` · ${myTeamsCount} team${myTeamsCount !== 1 ? 's' : ''}` : ''}</div>}
    </section>
  );
}
