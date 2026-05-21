import AdminGreeting from '../admin/AdminGreeting';

// Header zone for CoachHomePage — greeting + role chip surface area.
// Extracted from CoachHomePage in the preemptive split arc per L99
// platform audit PART 5 Phase 4 / PQ3 (2026-05-21). Pure
// presentational — no data fetching here; the parent page owns the
// orchestration and threads props in.
//
// Today this is a thin wrapper around AdminGreeting (shared across
// admin + coach home). The boundary exists so future coach-specific
// header chrome (settings affordance, role chip, view-as banner) has
// a clear home rather than re-inflating the page file past the cap.
export default function CoachHomeHeader({ user }) {
  return <AdminGreeting user={user} />;
}
