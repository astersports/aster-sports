import { useEffect, useState } from 'react';
import { useStaffProfile } from '../../hooks/useStaffProfile';
import { useToast } from '../../context/useToast';
import { formatPhone } from '../../lib/formatPhone';
import Label from '../shared/Label';

const inputStyle = {
  width: '100%', minHeight: 44, padding: '0 12px', borderRadius: 10,
  fontSize: 15, fontFamily: 'inherit',
  backgroundColor: 'var(--em-bg-tertiary)',
  border: '1.5px solid var(--em-border-default)',
  color: 'var(--em-text-primary)',
};

// Self-edit card for an admin/coach user's display_name + phone. These
// values render in the Tournament Briefing email contact footer. The
// footer drops any coach without both fields filled, so an unsaved
// profile means silent absence — incentive to fill it out.
export default function StaffProfileCard({ defaultDisplayName }) {
  const { profile, loading, saving, save } = useStaffProfile();
  const { showToast } = useToast();
  const [displayName, setDisplayName] = useState('');
  const [phone, setPhone] = useState('');
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (loading) return undefined;
    Promise.resolve().then(() => {
      setDisplayName(profile?.display_name ?? defaultDisplayName ?? '');
      setPhone(profile?.phone ?? '');
      setDirty(false);
    });
    return undefined;
  }, [loading, profile, defaultDisplayName]);

  const trimmedName = displayName.trim();
  const trimmedPhone = phone.trim();
  const validPhone = trimmedPhone === '' || /\d/.test(trimmedPhone);
  const canSave = dirty && trimmedName.length > 0 && trimmedName.length <= 80 && validPhone && !saving;

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!canSave) return;
    const { error } = await save({ display_name: trimmedName, phone: trimmedPhone });
    if (error) showToast("Couldn't save profile. Try again?", 'error');
    else { showToast('Profile saved', 'success'); setDirty(false); }
  };

  return (
    <section style={{ marginBottom: 16 }}>
      <Label>Contact info shown on briefings</Label>
      <form onSubmit={onSubmit} style={{
        backgroundColor: 'var(--em-bg-card)', border: '1px solid var(--em-border-default)',
        borderRadius: 10, padding: 14, display: 'flex', flexDirection: 'column', gap: 10,
      }}>
        <div>
          <label htmlFor="sp-name" style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--em-text-tertiary)', display: 'block', marginBottom: 6 }}>
            Display name
          </label>
          <input
            id="sp-name" type="text" value={displayName} maxLength={80}
            onChange={(e) => { setDisplayName(e.target.value); setDirty(true); }}
            placeholder='How parents see you (e.g. "Coach Kenny")'
            style={inputStyle}
          />
        </div>
        <div>
          <label htmlFor="sp-phone" style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--em-text-tertiary)', display: 'block', marginBottom: 6 }}>
            Phone
          </label>
          <input
            id="sp-phone" type="tel" value={phone}
            onChange={(e) => { setPhone(e.target.value); setDirty(true); }}
            onBlur={(e) => { const f = formatPhone(e.target.value); if (f !== phone) { setPhone(f); setDirty(true); } }}
            placeholder="(555) 123-4567"
            style={inputStyle}
          />
        </div>
        <button type="submit" disabled={!canSave} className="em-press"
          style={{
            minHeight: 44, borderRadius: 10, border: 'none',
            backgroundColor: canSave ? 'var(--em-accent)' : 'var(--em-bg-secondary)',
            color: canSave ? 'var(--em-text-inverse)' : 'var(--em-text-tertiary)',
            fontSize: 15, fontWeight: 600, fontFamily: 'inherit',
            cursor: canSave ? 'pointer' : 'default',
          }}>
          {saving ? 'Saving…' : 'Save profile'}
        </button>
      </form>
    </section>
  );
}
