import { ghostBtn, primaryBtn } from './registerStyles';

// Post-submit confirmation (spec §5.4/§5.6 voice). "+ Register another child" loops back
// keeping the guardian (PR D multi-child); each child is its own pending registration.
export default function RegisterConfirm({ result, program, onAddAnother, onDone }) {
  const already = result?.already_registered || [];
  const count = (result?.registration_ids || []).length;
  const reserved = count > 0;
  return (
    <div style={{ textAlign: 'center', paddingTop: 32 }}>
      <div style={{ fontSize: 48, color: 'var(--em-success)' }}>✓</div>
      <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--em-text-primary)', marginTop: 8 }}>
        {reserved ? 'Spot reserved!' : 'Already registered'}
      </h1>
      <p style={{ fontSize: 15, color: 'var(--em-text-secondary)', marginTop: 8 }}>
        {reserved
          ? `You’re in for ${program.name}. Your program admin will confirm payment and be in touch.`
          : `This player is already registered for ${program.name}.`}
      </p>
      {already.length > 0 && (
        <p style={{ fontSize: 13, color: 'var(--em-text-tertiary)', marginTop: 8 }}>Already on file: {already.join(', ')}</p>
      )}
      <button type="button" className="em-press" style={{ ...primaryBtn, marginTop: 24 }} onClick={onAddAnother}>+ Register another child</button>
      <button type="button" style={{ ...ghostBtn, width: '100%', marginTop: 8 }} onClick={onDone}>Done</button>
    </div>
  );
}
