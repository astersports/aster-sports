// Wave 4.3-K Item 3 — pilot test scope picker.
//
// Renders a "Test scope" dropdown when the org has
// organization_settings.pilot_test_recipient_email set (i.e. pilot test
// mode is active). Lets the admin narrow the per-team synthetic test
// recipients to a single team, so admin@ inbox receives 1 email for
// that team instead of N team-views.
//
// Default selection: "All teams (N emails)" — passes all synthetic rows
// through unchanged.
// Per-team selection: client-side filter on the recipient list applied
// in sendWeeklyDigestFromWizard.filterSendable.
//
// State: dispatches SET_PILOT_TEST_SCOPE { value: team_id | null }.

const labelStyle = { fontSize: 11, fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--as-text-tertiary)', display: 'block', marginBottom: 8 };
const selectStyle = { width: '100%', minHeight: 44, padding: '0 12px', borderRadius: 10, border: '1.5px solid var(--as-border-default)', backgroundColor: 'var(--as-bg-tertiary)', fontSize: 15, color: 'var(--as-text-primary)' };
const helperStyle = { fontSize: 12, color: 'var(--as-text-tertiary)', marginTop: 8, lineHeight: 1.4 };

export default function PilotTestScopePicker({ teams, value, onChange, pilotTestRecipientEmail }) {
  if (!pilotTestRecipientEmail) return null;
  const teamList = (teams || []).slice().sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
  const allLabel = `All teams (${teamList.length} email${teamList.length === 1 ? '' : 's'})`;
  return (
    <section>
      <span style={labelStyle}>Test scope</span>
      <select aria-label="Pilot test scope" value={value || ''} onChange={(e) => onChange(e.target.value || null)} style={selectStyle}>
        <option value="">{allLabel}</option>
        {teamList.map((t) => <option key={t.id} value={t.id}>{t.name} (1 email)</option>)}
      </select>
      <div style={helperStyle}>
        Pilot test mode is on. Sends route to <strong>{pilotTestRecipientEmail}</strong>. Pick one team to receive a single email; default sends one per team.
      </div>
    </section>
  );
}
