import { useDuties } from '../../hooks/useDuties';
import { useAuth } from '../../context/AuthContext';

// Duties tab — grouped by duty_name. Each row in event_duties is one
// claimable slot (guardian_id nullable). Users tap Claim to take an
// open slot; Release if it's theirs.
export default function EventDutiesTab({ eventId }) {
  const { user } = useAuth();
  const { duties, loading, claim, unclaim } = useDuties(eventId);

  if (loading) return <Empty text="Loading duties..." />;
  if (duties.length === 0) return <Empty text="No duties set for this event." />;

  const groups = {};
  duties.forEach((d) => {
    if (!groups[d.duty_name]) groups[d.duty_name] = [];
    groups[d.duty_name].push(d);
  });

  return (
    <div style={{ padding: '16px 16px 32px' }}>
      {Object.entries(groups).map(([name, slots]) => (
        <div key={name} style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--sf-text-secondary)', marginBottom: 8 }}>
            {name}
          </div>
          <div style={{
            backgroundColor: 'var(--sf-bg-card)', borderRadius: 10,
            border: '1px solid var(--sf-border-default)', overflow: 'hidden',
          }}>
            {slots.map((slot, i) => {
              const claimed = !!slot.guardian_id;
              const isMine = claimed && slot.guardian_id === user?.id;
              return (
                <div key={slot.id} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '12px 14px',
                  borderTop: i === 0 ? 'none' : '1px solid var(--sf-border-subtle)',
                }}>
                  <div style={{ fontSize: 14, color: claimed ? 'var(--sf-text-primary)' : 'var(--sf-text-tertiary)' }}>
                    {claimed ? (slot.claimed_by_name || 'Claimed') : 'Open'}
                  </div>
                  {!claimed && (
                    <button type="button" onClick={() => claim(slot.id)} className="sf-press"
                      style={btnStyle('var(--sf-accent)', 'var(--sf-text-inverse)')}>
                      Claim
                    </button>
                  )}
                  {isMine && (
                    <button type="button" onClick={() => unclaim(slot.id)} className="sf-press"
                      style={btnStyle('var(--sf-bg-card)', 'var(--sf-text-secondary)', true)}>
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
  return <div style={{ padding: 16, color: 'var(--sf-text-tertiary)', fontSize: 14 }}>{text}</div>;
}

const btnStyle = (bg, color, bordered) => ({
  minHeight: 44, padding: '0 14px', borderRadius: 8,
  backgroundColor: bg, color,
  border: bordered ? '1px solid var(--sf-border-default)' : 'none',
  fontSize: 13, fontWeight: 600,
});
