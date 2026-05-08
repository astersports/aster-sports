import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../context/useToast';
import FullScreenForm from '../shared/FullScreenForm';
import Toggle from '../shared/Toggle';

export default function AutoNotificationSettingsSheet({ open, onClose, orgId }) {
  const { showToast } = useToast();
  const [reminders, setReminders] = useState(true);
  const [nudges, setNudges] = useState(true);
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
        setLoaded(true);
      });
    return () => { cancelled = true; };
  }, [open, orgId]);

  const handleSave = useCallback(async () => {
    setSaving(true);
    const { error } = await supabase.from('organizations').update({
      auto_notifications: { reminders_enabled: reminders, nudges_enabled: nudges },
    }).eq('id', orgId);
    setSaving(false);
    if (error) {
      showToast("Couldn't save settings. The auto_notifications column may need to be added to the organizations table.", 'error');
      return;
    }
    showToast('Notification settings saved', 'success');
    onClose();
  }, [reminders, nudges, orgId, onClose, showToast]);

  const footer = (
    <button type="button" onClick={handleSave} disabled={saving} className="sf-press"
      style={{
        minHeight: 44, padding: '0 24px', borderRadius: 10, border: 'none',
        backgroundColor: 'var(--em-accent)', color: 'var(--em-text-inverse)',
        fontSize: 15, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer',
        opacity: saving ? 0.6 : 1,
      }}>
      {saving ? 'Saving...' : 'Save'}
    </button>
  );

  return (
    <FullScreenForm open={open} onClose={onClose} title="Notification Settings" footer={footer}>
      {!loaded ? (
        <div style={{ padding: 24, textAlign: 'center', color: 'var(--em-text-tertiary)', fontSize: 13 }}>
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
              description="Nudge parents 4 hours and 1 hour before RSVP deadline if they haven't responded" />
          </Section>
        </div>
      )}
    </FullScreenForm>
  );
}

function Section({ title, children }) {
  return (
    <div style={{
      backgroundColor: 'var(--em-bg-card)', borderRadius: 10,
      border: '1px solid var(--em-border-default)', padding: 16,
    }}>
      <div style={{
        fontSize: 11, fontWeight: 500, letterSpacing: '0.05em',
        textTransform: 'uppercase', color: 'var(--em-text-tertiary)', marginBottom: 12,
      }}>{title}</div>
      {children}
    </div>
  );
}
