export function StepArchive({ season, teams }) {
  return (
    <div>
      <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--as-text-primary)', marginBottom: 8 }}>Archive {season.name}</h2>
      <p style={{ fontSize: 15, color: 'var(--as-text-secondary)', marginBottom: 16, lineHeight: 1.5 }}>This will lock {season.name} to read-only and begin setting up the next season. All data is preserved.</p>
      <div style={{ padding: 16, backgroundColor: 'var(--as-bg-card)', borderRadius: 10, border: '1px solid var(--as-border-default)' }}>
        <div style={{ fontSize: 13, color: 'var(--as-text-tertiary)', marginBottom: 4 }}>Current season</div>
        <div style={{ fontSize: 17, fontWeight: 600, color: 'var(--as-text-primary)' }}>{season.name}</div>
        <div style={{ fontSize: 13, color: 'var(--as-text-tertiary)', marginTop: 4 }}>{teams.length} teams · {teams.reduce((s, t) => s + t.players.length, 0)} players</div>
      </div>
    </div>
  );
}

export function StepPlayers({ plan, setPlan }) {
  return (
    <div>
      <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--as-text-primary)', marginBottom: 12 }}>Carry Over Players</h2>
      {plan.teams.map((tm, ti) => (
        <div key={tm.id} style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: tm.team_color || 'var(--as-text-primary)', marginBottom: 8 }}>{tm.name}</div>
          {tm.players.map((p, pi) => (
            <div key={p.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--as-border-subtle)' }}>
              <span style={{ fontSize: 14, color: 'var(--as-text-primary)' }}>#{p.jersey_number || '—'} {p.first_name} {p.last_name}</span>
              <select value={p.action} onChange={(e) => { const val = e.target.value; setPlan((prev) => ({ ...prev, teams: prev.teams.map((t, i) => i === ti ? { ...t, players: t.players.map((pl, j) => j === pi ? { ...pl, action: val } : pl) } : t) })); }}
                style={{ fontSize: 13, padding: '4px 8px', borderRadius: 8, border: '1px solid var(--as-border-default)', backgroundColor: 'var(--as-bg-card)', color: 'var(--as-text-primary)', fontFamily: 'inherit', minHeight: 44 }}>
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
      <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--as-text-primary)', marginBottom: 12 }}>Carry Over Coaches</h2>
      {plan.teams.map((tm, ti) => (
        <div key={tm.id} style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: tm.team_color || 'var(--as-text-primary)', marginBottom: 8 }}>{tm.name}</div>
          {tm.coaches.map((c, ci) => (
            <div key={c.user_id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--as-border-subtle)' }}>
              <span style={{ fontSize: 14, color: 'var(--as-text-primary)', textTransform: 'capitalize' }}>{c.role.replace('_', ' ')}</span>
              <button type="button" onClick={() => { setPlan((prev) => ({ ...prev, teams: prev.teams.map((t, i) => i === ti ? { ...t, coaches: t.coaches.map((co, j) => j === ci ? { ...co, keep: !co.keep } : co) } : t) })); }} className="as-press"
                style={{ minHeight: 44, padding: '0 12px', borderRadius: 8, border: 'none', fontSize: 13, fontWeight: 500, backgroundColor: c.keep ? 'var(--as-success-soft)' : 'var(--as-bg-secondary)', color: c.keep ? 'var(--as-success)' : 'var(--as-text-tertiary)', cursor: 'pointer', fontFamily: 'inherit' }}>{c.keep ? '✓ Keeping' : 'Dropped'}</button>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

export function StepDetails({ plan, setPlan, locationCount = 0 }) {
  return (
    <div>
      <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--as-text-primary)', marginBottom: 12 }}>New Season Details</h2>
      <label style={{ display: 'block', marginBottom: 12 }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--as-text-secondary)', marginBottom: 4 }}>Season Name</div>
        <input type="text" value={plan.newSeasonName} onChange={(e) => setPlan({ ...plan, newSeasonName: e.target.value })}
          style={{ width: '100%', minHeight: 44, padding: '0 14px', borderRadius: 10, border: '1px solid var(--as-border-default)', backgroundColor: 'var(--as-bg-card)', fontSize: 15, color: 'var(--as-text-primary)', fontFamily: 'inherit' }} />
      </label>
      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <label style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--as-text-secondary)', marginBottom: 4 }}>Start</div>
          <input type="date" value={plan.startDate} onChange={(e) => setPlan({ ...plan, startDate: e.target.value })}
            style={{ width: '100%', minHeight: 44, padding: '0 14px', borderRadius: 10, border: '1px solid var(--as-border-default)', backgroundColor: 'var(--as-bg-card)', fontSize: 15, color: 'var(--as-text-primary)', fontFamily: 'inherit' }} />
        </label>
        <label style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--as-text-secondary)', marginBottom: 4 }}>End</div>
          <input type="date" value={plan.endDate} onChange={(e) => setPlan({ ...plan, endDate: e.target.value })}
            style={{ width: '100%', minHeight: 44, padding: '0 14px', borderRadius: 10, border: '1px solid var(--as-border-default)', backgroundColor: 'var(--as-bg-card)', fontSize: 15, color: 'var(--as-text-primary)', fontFamily: 'inherit' }} />
        </label>
      </div>
      <button type="button" onClick={() => setPlan({ ...plan, carryLocations: !plan.carryLocations })} className="as-press"
        style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px solid var(--as-border-default)', backgroundColor: 'var(--as-bg-card)', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left' }}>
        <div style={{ width: 22, height: 22, borderRadius: 6, flexShrink: 0, backgroundColor: plan.carryLocations ? 'var(--as-accent)' : 'transparent', border: plan.carryLocations ? 'none' : '1.5px solid var(--as-border-default)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--as-text-inverse)', fontSize: 15, fontWeight: 700 }}>{plan.carryLocations ? '✓' : ''}</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--as-text-primary)' }}>Carry forward locations</div>
          <div style={{ fontSize: 12, color: 'var(--as-text-tertiary)', marginTop: 2 }}>Copy {locationCount} active location{locationCount === 1 ? '' : 's'} to the new season</div>
        </div>
      </button>
    </div>
  );
}

export function StepPreview({ plan, stats }) {
  return (
    <div>
      <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--as-text-primary)', marginBottom: 12 }}>Preview & Commit</h2>
      <div style={{ padding: 16, backgroundColor: 'var(--as-bg-card)', borderRadius: 10, border: '1px solid var(--as-border-default)', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <Row label="New Season" value={plan.newSeasonName || '—'} />
        <Row label="Teams" value={stats.teams} />
        <Row label="Players carried" value={stats.players} />
        <Row label="Advanced age group" value={stats.advanced} />
        <Row label="Dropped" value={stats.dropped} color="var(--as-danger)" />
        <Row label="Coaches retained" value={stats.coaches} />
        <Row label="Locations carried" value={stats.locations} />
      </div>
    </div>
  );
}

function Row({ label, value, color }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
      <span style={{ color: 'var(--as-text-secondary)' }}>{label}</span>
      <span style={{ fontWeight: 600, color: color || 'var(--as-text-primary)' }}>{value}</span>
    </div>
  );
}
