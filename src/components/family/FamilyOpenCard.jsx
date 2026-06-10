import { Plus } from 'lucide-react';
import Badge from '../shared/Badge';
import { programBadge } from '../../lib/programGrouping';

// A discoverable open program on My Family (PR-B1): the family isn't enrolled and
// the window is open. Register CTA deep-links to the public funnel (/r/:slug).
// Names the grade-eligible child(ren); a program with no eligible child still
// shows informationally (architect-ratified — don't hide what exists).
function shortDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'America/New_York' });
}

export default function FamilyOpenCard({ program }) {
  const badge = programBadge(program.programType);
  const names = program.eligibleChildren || [];
  const hint = names.length === 0
    ? 'Open for registration'
    : `For ${names.length <= 2 ? names.join(' and ') : `${names.slice(0, -1).join(', ')}, and ${names[names.length - 1]}`}`;

  return (
    <section style={card} aria-label={`${program.name} open for registration`}>
      <div style={head}>
        <Badge variant={badge.variant}>{badge.label}</Badge>
        <span style={nameStyle}>{program.name}</span>
      </div>
      {program.closesAt && <div style={open}>Open · closes {shortDate(program.closesAt)}</div>}
      {program.slug ? (
        <a href={`/r/${program.slug}`} className="as-press" style={btn}>
          <Plus size={18} strokeWidth={2.3} aria-hidden="true" /> Register
        </a>
      ) : (
        <div style={{ ...hintStyle, marginTop: 11 }}>Registration link coming soon.</div>
      )}
      <div style={hintStyle}>{hint}</div>
    </section>
  );
}

const card = { backgroundColor: 'var(--as-bg-card)', border: '1px solid var(--as-border-default)', borderRadius: 13, padding: 15, marginBottom: 12 };
const head = { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 9 };
const nameStyle = { fontSize: 15, fontWeight: 700, color: 'var(--as-text-primary)' };
const open = { fontSize: 12, fontWeight: 700, color: 'var(--as-success)', marginBottom: 4 };
const btn = { width: '100%', minHeight: 48, marginTop: 8, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7, backgroundColor: 'var(--as-accent)', color: 'var(--as-text-inverse)', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 700, textDecoration: 'none' };
const hintStyle = { fontSize: 12, fontWeight: 500, color: 'var(--as-text-secondary)', marginTop: 8, textAlign: 'center' };
