import { useDuties } from '../../hooks/useDuties';
import { useAuth } from '../../context/AuthContext';
import { isStaff } from '../../lib/permissions';

// Duties tab — grouped by duty_name. Each row in event_duties is one
// claimable slot (guardian_id nullable). Users tap Claim to take an
// open slot; Release if it's theirs. Staff can release any duty.
export default function EventDutiesTab({ eventId }) {
  const { guardianId, role } = useAuth();
  const { duties, loading, claim, unclaim } = useDuties(eventId);
  const staff = isStaff(role);

  if (loading) return <Empty text="Loading duties..." />;
  if (duties.length === 0) return <Empty text="No volunteer duties yet — check back closer to game day." />;

  const groups = {};
  duties.forEach((d) => {
    if (!groups[d.duty_name]) groups[d.duty_name] = [];
    groups[d.duty_name].push(d);
  });

  return (
    <div style={{ padding: '16px 16px 32px' }}>
      {Object.entries(groups).map(([name, slots]) => (
        <div key={name} style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--em-text-secondary)', marginBottom: 8 }}>
            {name}
          </div>
          <div style={{
            backgroundColor: 'var(--em-bg-card)', borderRadius: 10,
            border: '1px solid var(--em-border-default)', overflow: 'hidden',
          }}>
            {slots.map((slot, i) => {
              const claimed = !!slot.guardian_id || !!slot.claimed_by_name;
              // Parents match by guardianId; staff can release any claimed duty
              const isMine = claimed && (guardianId ? slot.guardian_id === guardianId : staff);
              return (
                <div key={slot.id} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '12px 14px',
                  borderTop: i === 0 ? 'none' : '1px solid var(--em-border-subtle)',
                }}>
                  <div style={{ fontSize: 15, color: claimed ? 'var(--em-text-primary)' : 'var(--em-text-tertiary)' }}>
                    {claimed ? (slot.claimed_by_name || 'Claimed') : 'Open'}
                  </div>
                  {!claimed && (
                    <button type="button" onClick={() => claim(slot.id)} className="sf-press"
                      style={btnStyle('var(--em-accent)', 'var(--em-text-inverse)')}>
                      Claim
                    </button>
                  )}
                  {isMine && (
                    <button type="button" onClick={() => unclaim(slot.id)} className="sf-press"
                      style={btnStyle('var(--em-bg-card)', 'var(--em-text-secondary)', true)}>
                      Release
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

function Empty({ text }) {
  return <div style={{ padding: 16, color: 'var(--em-text-tertiary)', fontSize: 15 }}>{text}</div>;
}

const btnStyle = (bg, color, bordered) => ({
  minHeight: 44, padding: '0 14px', borderRadius: 8,
  backgroundColor: bg, color,
  border: bordered ? '1px solid var(--em-border-default)' : 'none',
  fontSize: 13, fontWeight: 600,
});
