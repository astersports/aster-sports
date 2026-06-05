import { Trophy } from 'lucide-react';

// ParentTail — slot 5 (RoleTail) for parent home. The single "Your season"
// context card (shell contract v2 delight tier = one card): achievement +
// week-of-season + records peek, or the off-season wrap. Honest rendering —
// no game_results means progress only, never a fake 0-0. Presentational;
// the page shapes the props.
//
// Palette: gold = achievement ONLY (--as-gold*, operator-ratified D5
// 2026-06-05). The Trophy + record badge are the only gold on the page.
const LABEL = {
  fontSize: 11, fontWeight: 600, letterSpacing: '0.1em',
  textTransform: 'uppercase', color: 'var(--as-text-meta)', marginBottom: 8,
};
const CARD = {
  backgroundColor: 'var(--as-bg-card)', border: '1px solid var(--as-border-default)',
  borderTop: '3px solid var(--as-accent)', borderRadius: 12,
  boxShadow: 'var(--as-shadow-sm)', padding: 14,
};
const LINK_BTN = {
  display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
  width: '100%', minHeight: 44, marginTop: 11, paddingTop: 10,
  borderTop: '1px solid var(--as-border-subtle)', background: 'none', border: 'none',
  borderTopWidth: 1, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
  fontSize: 12, color: 'var(--as-text-secondary)',
};

export default function ParentTail({ achievement, seasonLabel, progressLabel, onViewRecords, offSeason }) {
  return (
    <section className="min-w-0" aria-label="Your season">
      <div style={LABEL}>Your season</div>
      <div style={CARD}>
        {achievement && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Trophy size={20} strokeWidth={1.75} color="var(--as-gold)" aria-hidden="true" />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--as-text-primary)' }}>{achievement.title}</div>
              {achievement.subtitle && (
                <div style={{ fontSize: 12, color: 'var(--as-text-secondary)', marginTop: 1 }}>{achievement.subtitle}</div>
              )}
            </div>
            {achievement.recordBadge && (
              <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--as-gold-text)', backgroundColor: 'var(--as-gold-soft)', borderRadius: 6, padding: '3px 9px', whiteSpace: 'nowrap' }}>
                {achievement.recordBadge}
              </span>
            )}
          </div>
        )}

        {offSeason && (
          <div style={{ marginTop: achievement ? 11 : 0 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--as-text-primary)' }}>{seasonLabel}, wrapped</div>
            <div style={{ fontSize: 12, color: 'var(--as-text-secondary)', marginTop: 4 }}>No events on the calendar right now.</div>
            {offSeason.records?.length > 0 && (
              <div style={{ display: 'flex', gap: 8, marginTop: 11 }}>
                {offSeason.records.map((r) => (
                  <div key={r.label} style={{ flex: 1, textAlign: 'center', backgroundColor: 'var(--as-bg-secondary)', borderRadius: 8, padding: 8 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--as-text-primary)' }}>{r.value}</div>
                    <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--as-text-meta)' }}>{r.label}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <button type="button" onClick={onViewRecords} className="as-press" style={LINK_BTN} aria-label="View season records">
          <span>
            {offSeason?.nextSeasonLabel
              ? offSeason.nextSeasonLabel
              : <>{seasonLabel}{progressLabel ? <> · <b style={{ color: 'var(--as-text-primary)', fontWeight: 700 }}>{progressLabel}</b></> : null}</>}
          </span>
          <span style={{ color: 'var(--as-accent)', fontWeight: 600, flexShrink: 0 }}>View records ›</span>
        </button>
      </div>
    </section>
  );
}
