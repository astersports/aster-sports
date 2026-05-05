export function StepArchive({ season, teams }) {
  return (
    <div>
      <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--em-text-primary)', marginBottom: 8 }}>Archive {season.name}</h2>
      <p style={{ fontSize: 15, color: 'var(--em-text-secondary)', marginBottom: 16, lineHeight: 1.5 }}>This will lock {season.name} to read-only and begin setting up the next season. All data is preserved.</p>
      <div style={{ padding: 16, backgroundColor: 'var(--em-bg-card)', borderRadius: 10, border: '1px solid var(--em-border-default)' }}>
        <div style={{ fontSize: 13, color: 'var(--em-text-tertiary)', marginBottom: 4 }}>Current season</div>
        <div style={{ fontSize: 17, fontWeight: 600, color: 'var(--em-text-primary)' }}>{season.name}</div>
        <div style={{ fontSize: 13, color: 'var(--em-text-tertiary)', marginTop: 4 }}>{teams.length} teams · {teams.reduce((s, t) => s + t.players.length, 0)} players</div>
      </div>
    </div>
  );
}

export function StepPlayers({ plan, setPlan }) {
  return (
    <div>
      <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--em-text-primary)', marginBottom: 12 }}>Carry Over Players</h2>
      {plan.teams.map((tm, ti) => (
        <div key={tm.id} style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: tm.team_color || 'var(--em-text-primary)', marginBottom: 8 }}>{tm.name}</div>
          {tm.players.map((p, pi) => (
            <div key={p.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--em-border-subtle)' }}>
              <span style={{ fontSize: 14, color: 'var(--em-text-primary)' }}>#{p.jersey_number || '—'} {p.first_name} {p.last_name}</span>
              <select value={p.action} onChange={(e) => { const next = [...plan.teams]; next[ti].players[pi].action = e.target.value; setPlan({ ...plan, teams: next }); }}
                style={{ fontSize: 13, padding: '4px 8px', borderRadius: 8, border: '1px solid var(--em-border-default)', backgroundColor: 'var(--em-bg-card)', color: 'var(--em-text-primary)', fontFamily: 'inherit', minHeight: 36 }}>
                <option value="keep">Keep</option>
                <option value="advance">Advance age</option>
                <option value="drop">Drop</option>
              </select>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

export function StepCoaches({ plan, setPlan }) {
  return (
    <div>
      <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--em-text-primary)', marginBottom: 12 }}>Carry Over Coaches</h2>
      {plan.teams.map((tm, ti) => (
        <div key={tm.id} style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: tm.team_color || 'var(--em-text-primary)', marginBottom: 8 }}>{tm.name}</div>
          {tm.coaches.map((c, ci) => (
            <div key={c.user_id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--em-border-subtle)' }}>
              <span style={{ fontSize: 14, color: 'var(--em-text-primary)', textTransform: 'capitalize' }}>{c.role.replace('_', ' ')}</span>
              <button type="button" onClick={() => { const next = [...plan.teams]; next[ti].coaches[ci].keep = !c.keep; setPlan({ ...plan, teams: next }); }} className="sf-press"
                style={{ minHeight: 36, padding: '0 12px', borderRadius: 8, border: 'none', fontSize: 13, fontWeight: 500, backgroundColor: c.keep ? 'var(--em-success-soft)' : 'var(--em-bg-secondary)', color: c.keep ? 'var(--em-success)' : 'var(--em-text-tertiary)', cursor: 'pointer', fontFamily: 'inherit' }}>{c.keep ? '✓ Keeping' : 'Dropped'}</button>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

export function StepDetails({ plan, setPlan }) {
  return (
    <div>
      <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--em-text-primary)', marginBottom: 12 }}>New Season Details</h2>
      <label style={{ display: 'block', marginBottom: 12 }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--em-text-secondary)', marginBottom: 4 }}>Season Name</div>
        <input type="text" value={plan.newSeasonName} onChange={(e) => setPlan({ ...plan, newSeasonName: e.target.value })}
          style={{ width: '100%', minHeight: 44, padding: '0 14px', borderRadius: 10, border: '1px solid var(--em-border-default)', backgroundColor: 'var(--em-bg-card)', fontSize: 15, color: 'var(--em-text-primary)', fontFamily: 'inherit' }} />
      </label>
      <div style={{ display: 'flex', gap: 12 }}>
        <label style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--em-text-secondary)', marginBottom: 4 }}>Start</div>
          <input type="date" value={plan.startDate} onChange={(e) => setPlan({ ...plan, startDate: e.target.value })}
            style={{ width: '100%', minHeight: 44, padding: '0 14px', borderRadius: 10, border: '1px solid var(--em-border-default)', backgroundColor: 'var(--em-bg-card)', fontSize: 15, color: 'var(--em-text-primary)', fontFamily: 'inherit' }} />
        </label>
        <label style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--em-text-secondary)', marginBottom: 4 }}>End</div>
          <input type="date" value={plan.endDate} onChange={(e) => setPlan({ ...plan, endDate: e.target.value })}
            style={{ width: '100%', minHeight: 44, padding: '0 14px', borderRadius: 10, border: '1px solid var(--em-border-default)', backgroundColor: 'var(--em-bg-card)', fontSize: 15, color: 'var(--em-text-primary)', fontFamily: 'inherit' }} />
        </label>
      </div>
    </div>
  );
}

export function StepPreview({ plan, stats }) {
  return (
    <div>
      <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--em-text-primary)', marginBottom: 12 }}>Preview & Commit</h2>
      <div style={{ padding: 16, backgroundColor: 'var(--em-bg-card)', borderRadius: 10, border: '1px solid var(--em-border-default)', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <Row label="New Season" value={plan.newSeasonName || '—'} />
        <Row label="Teams" value={stats.teams} />
        <Row label="Players carried" value={stats.players} />
        <Row label="Advanced age group" value={stats.advanced} />
        <Row label="Dropped" value={stats.dropped} color="var(--em-danger)" />
        <Row label="Coaches retained" value={stats.coaches} />
      </div>
    </div>
  );
}

function Row({ label, value, color }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
      <span style={{ color: 'var(--em-text-secondary)' }}>{label}</span>
      <span style={{ fontWeight: 600, color: color || 'var(--em-text-primary)' }}>{value}</span>
    </div>
  );
}
