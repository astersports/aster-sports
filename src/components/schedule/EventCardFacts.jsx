import { Car, Check, Hand, HelpCircle, Lock, X } from 'lucide-react';

// DESIGN SYSTEM D3 (docs/SCHEDULE_CARD_DESIGN_SYSTEM): the density split.
// COMPACT = icon grammar (a glance: ✓9 ?1 ✗1 of 11 · 🚗2 · ✋1).
// DETAILED = word grammar (a briefing: breakdown row + needs row with
// seat math and NAMED slots). Feature gates (D3) and the Hidden-roster
// privacy guard (§10.1(2)) apply to both. Data rides the batch — zero
// requests here.

const pair = (Icon, n, color, key) => (
  <span key={key} style={{ display: 'inline-flex', alignItems: 'center', gap: 2, color, fontWeight: 700 }}>
    <Icon size={12} strokeWidth={2} aria-hidden="true" />{n}
  </span>
);

export default function EventCardFacts({ suppressCount, isStaffView, count, rideCount, dutyCount, commitment, academyNames = [], compact, ridesEnabled = true, dutiesEnabled = true }) {
  const fs = compact ? 12 : 13;
  const going = count?.going ?? 0;
  const maybe = count?.maybe ?? 0;
  const cant = count?.not_going ?? 0;
  const denom = count?.denominator ?? 0;
  const requests = ridesEnabled ? (rideCount?.requests || 0) : 0;
  const offers = ridesEnabled ? (rideCount?.offers || 0) : 0;
  const dutiesOpen = dutiesEnabled && dutyCount ? Math.max(0, dutyCount.total - dutyCount.claimed) : 0;
  const suppressed = suppressCount && !isStaffView;
  const academyInline = academyNames.length > 0
    ? <span style={{ color: 'var(--as-academy)', fontWeight: 500 }}> · {academyNames.join(', ')} not activated</span>
    : null;

  if (suppressed) {
    return (
      <div style={{ fontSize: fs, color: 'var(--as-text-tertiary)', marginTop: compact ? 4 : 6, display: 'flex', alignItems: 'center', gap: 5 }}>
        <Lock size={12} strokeWidth={1.75} aria-hidden="true" />Counts hidden for evaluations{compact && academyInline}
      </div>
    );
  }

  if (compact) {
    const parts = [];
    if (denom > 0) {
      parts.push(pair(Check, going, going > 0 ? 'var(--as-success)' : 'var(--as-text-tertiary)', 'g'));
      if (maybe > 0) parts.push(pair(HelpCircle, maybe, 'var(--as-warning)', 'm'));
      if (cant > 0) parts.push(pair(X, cant, 'var(--as-danger)', 'x'));
      parts.push(<span key="of" style={{ color: 'var(--as-text-tertiary)' }}>of {denom}</span>);
    }
    if (requests > 0) parts.push(pair(Car, requests, 'var(--as-warning)', 'r'));
    if (dutiesOpen > 0) parts.push(pair(Hand, dutiesOpen, 'var(--as-warning)', 'd'));
    if (parts.length === 0 && !academyInline && !commitment) return null;
    return (
      <div style={{ fontSize: fs, marginTop: 4, display: 'flex', alignItems: 'center', gap: 7, whiteSpace: 'nowrap', overflow: 'hidden' }}>
        {parts}
        {commitment && <span style={{ color: 'var(--as-accent)', fontWeight: 600 }}>· {commitment}</span>}
        {academyInline}
      </div>
    );
  }

  // DETAILED — word grammar: breakdown row, then needs row.
  const lines = [];
  if (denom > 0) {
    const breakdown = [`${going} of ${denom} going`,
      maybe > 0 ? `${maybe} maybe` : null,
      cant > 0 ? `${cant} can't` : null,
      requests === 0 && offers > 0 ? 'rides covered' : null].filter(Boolean).join(' · ');
    lines.push(
      <div key="rsvp" style={{ fontSize: fs, color: 'var(--as-text-tertiary)', marginTop: 6, display: 'flex', alignItems: 'center', gap: 5 }}>
        {going > 0 && <Check size={12} strokeWidth={1.75} aria-hidden="true" style={{ flexShrink: 0 }} />}
        <span>{breakdown}</span>
      </div>
    );
  }
  const needs = [];
  if (requests > 0) needs.push(`${requests} ride seat${requests === 1 ? '' : 's'} needed${offers > 0 ? ` · ${offers} offered` : ''}`);
  if (dutiesOpen > 0) {
    const names = dutyCount?.openNames?.length ? dutyCount.openNames : null;
    needs.push(names ? names.map((n) => `${n} open`).join(' · ') : `${dutiesOpen} volunteer${dutiesOpen === 1 ? '' : 's'} needed`);
  }
  if (needs.length > 0) {
    lines.push(<div key="needs" style={{ fontSize: fs, fontWeight: 600, color: 'var(--as-warning)', marginTop: 4 }}>{needs.join(' · ')}</div>);
  }
  if (academyNames.length > 0) {
    lines.push(
      <div key="academy" style={{ fontSize: fs, fontWeight: 500, color: 'var(--as-academy)', marginTop: 4 }}>
        {`${academyNames.join(' and ')} ${academyNames.length === 1 ? "isn't" : "aren't"} activated for this game`}
      </div>
    );
  }
  if (commitment) {
    lines.push(
      <div key="commit" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 600, color: 'var(--as-accent)', backgroundColor: 'var(--as-accent-soft)', padding: '3px 8px', borderRadius: 6, marginTop: 7, alignSelf: 'flex-start' }}>
        <Check size={11} strokeWidth={1.75} aria-hidden="true" />{commitment}
      </div>
    );
  }
  return lines.length > 0 ? <>{lines}</> : null;
}
