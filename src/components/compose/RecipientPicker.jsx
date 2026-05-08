const labelStyle = {
  fontSize: 11,
  fontWeight: 500,
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
  color: 'var(--em-text-tertiary)',
};

const linkBtnStyle = {
  background: 'none',
  border: 'none',
  padding: 0,
  fontSize: 13,
  fontWeight: 500,
  color: 'var(--em-accent)',
  cursor: 'pointer',
  fontFamily: 'inherit',
};

export default function RecipientPicker({
  recipients, selectedIds, onToggle, onSelectAll, onSelectNone,
  testSendOnly, onTestSendOnlyChange, adminEmail, loading,
}) {
  const total = recipients.length;
  const selected = selectedIds.size;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <span style={labelStyle}>Recipients</span>
        <label className="flex items-center gap-2" style={{ fontSize: 13, color: 'var(--em-text-secondary)' }}>
          <input
            type="checkbox"
            checked={testSendOnly}
            onChange={(e) => onTestSendOnlyChange(e.target.checked)}
            style={{ width: 18, height: 18, cursor: 'pointer' }}
          />
          Send to me only (test)
        </label>
      </div>

      {testSendOnly ? (
        <div
          style={{
            padding: 12,
            borderRadius: 10,
            backgroundColor: 'var(--em-info-soft)',
            border: '1px solid var(--em-info)',
            color: 'var(--em-text-primary)',
            fontSize: 14,
          }}
        >
          Test send: only <strong>{adminEmail || 'your account email'}</strong> will receive this briefing.
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between" style={{ fontSize: 13, color: 'var(--em-text-secondary)' }}>
            <span>{selected} of {total} selected</span>
            <div className="flex gap-3">
              <button type="button" onClick={onSelectAll} style={linkBtnStyle}>Select all</button>
              <button type="button" onClick={onSelectNone} style={linkBtnStyle}>Deselect all</button>
            </div>
          </div>

          <div
            style={{
              borderRadius: 10,
              border: '1px solid var(--em-border-default)',
              backgroundColor: 'var(--em-bg-card)',
              maxHeight: 320,
              overflowY: 'auto',
            }}
          >
            {loading ? (
              <div style={{ padding: 16, textAlign: 'center', color: 'var(--em-text-tertiary)', fontSize: 13 }}>
                Loading recipients…
              </div>
            ) : total === 0 ? (
              <div style={{ padding: 16, textAlign: 'center', color: 'var(--em-text-tertiary)', fontSize: 13 }}>
                No active guardians on this team.
              </div>
            ) : (
              recipients.map((r) => {
                const checked = selectedIds.has(r.guardian_id);
                const childList = r.children.map((c) => `${c.first_name} ${c.last_name}`).join(', ');
                return (
                  <label
                    key={r.guardian_id}
                    className="flex items-start gap-3"
                    style={{
                      padding: '12px 14px',
                      borderTop: '1px solid var(--em-border-subtle)',
                      cursor: 'pointer',
                      minHeight: 44,
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => onToggle(r.guardian_id)}
                      style={{ width: 18, height: 18, marginTop: 2, cursor: 'pointer' }}
                      aria-label={`Include ${r.name}`}
                    />
                    <div className="flex-1 min-w-0">
                      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--em-text-primary)' }}>{r.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--em-text-secondary)' }}>{r.email}</div>
                      {childList && (
                        <div style={{ fontSize: 11, color: 'var(--em-text-tertiary)', marginTop: 2 }}>{childList}</div>
                      )}
                    </div>
                  </label>
                );
              })
            )}
          </div>
        </>
      )}
    </div>
  );
}
