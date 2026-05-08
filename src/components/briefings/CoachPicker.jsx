// Picker for which coaches to credit in the briefing's contact footer.
// Defaults all team_staff coaches checked. Operator can uncheck any
// individual coach. The footer drops anyone whose display_name or phone
// is empty — checking a coach with no profile data is a no-op.

const labelStyle = {
  fontSize: 11, fontWeight: 600, letterSpacing: '1.5px',
  textTransform: 'uppercase', color: 'var(--em-text-secondary)',
};

function rowStatus(coach) {
  if (coach.display_name && coach.phone) return null;
  return 'no profile yet';
}

export default function CoachPicker({ coaches, selectedIds, onToggle, loading }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ ...labelStyle, display: 'block', marginBottom: 6 }}>Contact footer</label>
      <div style={{
        backgroundColor: 'var(--em-bg-card)',
        border: '1px solid var(--em-border-default)',
        borderRadius: 10,
        padding: 4,
      }}>
        {loading && (
          <div style={{ padding: 12, fontSize: 13, color: 'var(--em-text-tertiary)' }}>
            Loading coaches…
          </div>
        )}
        {!loading && coaches.length === 0 && (
          <div style={{ padding: 12, fontSize: 13, color: 'var(--em-text-tertiary)' }}>
            No staff assigned to this team yet.
          </div>
        )}
        {!loading && coaches.map((c) => {
          const checked = selectedIds.has(c.user_id);
          const status = rowStatus(c);
          const labelText = c.display_name || '(unnamed coach)';
          return (
            <label
              key={c.user_id}
              className="flex items-center gap-3 sf-press"
              style={{
                padding: '10px 12px',
                minHeight: 44,
                borderRadius: 8,
                cursor: 'pointer',
              }}
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => onToggle(c.user_id)}
                style={{ width: 18, height: 18, flex: 'none', cursor: 'pointer' }}
                aria-label={`Include ${labelText}`}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--em-text-primary)' }}>
                  {labelText}
                </div>
                <div style={{ fontSize: 12, color: status ? 'var(--em-warning)' : 'var(--em-text-tertiary)' }}>
                  {status || c.phone}
                </div>
              </div>
            </label>
          );
        })}
      </div>
      <div style={{ fontSize: 11, color: 'var(--em-text-tertiary)', marginTop: 6 }}>
        Coaches without a saved name or phone are skipped in the email footer.
      </div>
    </div>
  );
}
