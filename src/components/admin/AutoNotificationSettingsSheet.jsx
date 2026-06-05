import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../context/useToast';
import { RSVP_MIN_GOING_DEFAULT } from '../../lib/cron/rsvpNudgeThreshold';
import FullScreenForm from '../shared/FullScreenForm';
import Input from '../shared/Input';
import Toggle from '../shared/Toggle';

export default function AutoNotificationSettingsSheet({ open, onClose, orgId }) {
  const { showToast } = useToast();
  const [reminders, setReminders] = useState(true);
  const [nudges, setNudges] = useState(true);
  const [minGoing, setMinGoing] = useState(String(RSVP_MIN_GOING_DEFAULT));
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!open || !orgId) return;
    let cancelled = false;
    supabase.from('organizations').select('auto_notifications').eq('id', orgId).maybeSingle()
      .then(({ data }) => {
        if (cancelled) return;
        const cfg = data?.auto_notifications || {};
        setReminders(cfg.reminders_enabled !== false);
        setNudges(cfg.nudges_enabled !== false);
        const raw = cfg.rsvp_min_going;
        setMinGoing(String(Number.isInteger(raw) && raw > 0 ? raw : RSVP_MIN_GOING_DEFAULT));
        setLoaded(true);
      });
    return () => { cancelled = true; };
  }, [open, orgId]);

  const handleSave = useCallback(async () => {
    setSaving(true);
    const parsedMin = parseInt(minGoing, 10);
    const rsvp_min_going = Number.isInteger(parsedMin) && parsedMin > 0 ? parsedMin : RSVP_MIN_GOING_DEFAULT;
    const { error } = await supabase.from('organizations').update({
      auto_notifications: { reminders_enabled: reminders, nudges_enabled: nudges, rsvp_min_going },
    }).eq('id', orgId);
    setSaving(false);
    if (error) {
      showToast("Couldn't save notification settings. Try again, or get in touch if it keeps happening.", 'error');
      return;
    }
    showToast('Notification settings saved', 'success');
    onClose();
  }, [reminders, nudges, minGoing, orgId, onClose, showToast]);

  const footer = (
    <button type="button" onClick={handleSave} disabled={saving} className="as-press"
      style={{
        minHeight: 44, padding: '0 24px', borderRadius: 10, border: 'none',
        backgroundColor: 'var(--as-accent)', color: 'var(--as-text-inverse)',
        fontSize: 15, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer',
        opacity: saving ? 0.6 : 1,
      }}>
      {saving ? 'Saving...' : 'Save'}
    </button>
  );

  return (
    <FullScreenForm open={open} onClose={onClose} title="Notification Settings" footer={footer}>
      {!loaded ? (
        <div style={{ padding: 24, textAlign: 'center', color: 'var(--as-text-tertiary)', fontSize: 13 }}>
          Loading settings...
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <Section title="Stream A — Event Reminders">
            <Toggle label="Event Reminders" checked={reminders} onChange={setReminders}
              description="Automatically remind parents 3 days, 1 day, and 4 hours before events" />
          </Section>
          <Section title="Stream B — RSVP Nudges">
            <Toggle label="RSVP Nudges" checked={nudges} onChange={setNudges}
              description="Draft a nudge when a game has fewer than the minimum confirmed going. Drafts land in the Radar for you to review and send — nothing is sent automatically." />
            <div style={{ marginTop: 16 }}>
              <Input label="Minimum confirmed going" type="number" inputMode="numeric" min={1} step={1}
                value={minGoing} onChange={(e) => setMinGoing(e.target.value)}
                aria-label="Minimum confirmed going before drafting an RSVP nudge" />
            </div>
          </Section>
        </div>
      )}
    </FullScreenForm>
  );
}

function Section({ title, children }) {
  return (
    <div style={{
      backgroundColor: 'var(--as-bg-card)', borderRadius: 10,
      border: '1px solid var(--as-border-default)', padding: 16,
    }}>
      <div style={{
        fontSize: 11, fontWeight: 500, letterSpacing: '0.05em',
        textTransform: 'uppercase', color: 'var(--as-text-tertiary)', marginBottom: 12,
      }}>{title}</div>
      {children}
    </div>
  );
}
