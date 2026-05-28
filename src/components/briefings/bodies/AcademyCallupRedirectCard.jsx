// Wave 4.8 BUG (5/13 incident) — academy_callup_notice wizard redirect.
//
// Rendered inside the wizard Body step when
// KIND_METADATA.academy_callup_notice.wizardSupported === false. The
// wizard never populates events.academy_callup_player_ids, so the
// resolver's PlayerNotCalledUpError fires on Send. This card points
// admins at the canonical flow (EventDetail → lock roster →
// AcademyCallupPicker → auto-open AcademyCallupCompose) which is the
// only path that populates the field.

import { ArrowRight, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const wrap = {
  display: 'flex', flexDirection: 'column', gap: 14,
  padding: 16, borderRadius: 10,
  backgroundColor: 'var(--em-bg-card)', border: '1px solid var(--em-border-default)',
};
const heading = { fontSize: 17, fontWeight: 600, color: 'var(--em-text-primary)', margin: 0, lineHeight: 1.3 };
const stepList = { listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 10 };
const stepRow = { display: 'flex', alignItems: 'flex-start', gap: 12 };
const stepNumber = {
  flexShrink: 0, width: 24, height: 24, borderRadius: '50%',
  backgroundColor: 'var(--em-accent-soft)', color: 'var(--em-accent)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  fontSize: 12, fontWeight: 700,
};
const stepText = { fontSize: 14, color: 'var(--em-text-primary)', lineHeight: 1.4 };
const trailing = { fontSize: 13, color: 'var(--em-text-secondary)', lineHeight: 1.5 };
const footnote = { fontSize: 12, color: 'var(--em-text-secondary)', lineHeight: 1.4, marginTop: 2 };
const btn = {
  minHeight: 44, padding: '0 16px', borderRadius: 10,
  fontSize: 14, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer',
  border: 'none', backgroundColor: 'var(--em-accent)', color: 'var(--em-text-inverse)',
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
  alignSelf: 'flex-start',
};

const STEPS = [
  'Open the event in your schedule.',
  'Lock the roster.',
  'Tap Add next to the academy player.',
];

export default function AcademyCallupRedirectCard() {
  const navigate = useNavigate();
  return (
    <section style={wrap} aria-label="Academy call-up redirect">
      <h3 style={heading}>Academy call-ups start from the event</h3>
      <ol style={stepList}>
        {STEPS.map((text, i) => (
          <li key={text} style={stepRow}>
            <span style={stepNumber} aria-hidden="true">{i + 1}</span>
            <span style={stepText}>{text}</span>
          </li>
        ))}
      </ol>
      <p style={trailing}>The compose flow opens automatically with the right context.</p>
      <button type="button" onClick={() => navigate('/schedule')} className="em-press" style={btn} aria-label="Open schedule">
        <Calendar size={16} strokeWidth={1.75} aria-hidden="true" />
        Open Schedule
        <ArrowRight size={16} strokeWidth={1.75} aria-hidden="true" />
      </button>
      <p style={footnote}>Sending an academy call-up requires the player to be activated for a specific event first.</p>
    </section>
  );
}
