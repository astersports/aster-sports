import { Trophy, Dumbbell, Target, Users, Medal, Calendar } from 'lucide-react';

const TYPES = [
  { key: 'practice', label: 'Practice', icon: Dumbbell, large: true },
  { key: 'game', label: 'Game', icon: Trophy, large: true },
  { key: 'skills_lab', label: 'Skills Lab', icon: Target },
  { key: 'tryout', label: 'Tryout', icon: Users },
  { key: 'tournament', label: 'Tournament', icon: Medal },
  { key: 'other', label: 'Other', icon: Calendar },
];

export default function StepType({ value, onSelect }) {
  return (
    <div style={{ padding: '24px 16px' }}>
      <h2 style={{ fontSize: 17, fontWeight: 600, color: 'var(--sf-text-primary)', marginBottom: 16 }}>
        What type of event?
      </h2>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {TYPES.map((t) => {
          const Icon = t.icon;
          const sel = value === t.key;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => onSelect(t.key)}
              className="sf-press"
              style={{
                minHeight: t.large ? 88 : 64,
                borderRadius: 12,
                border: sel ? '2px solid var(--sf-accent)' : '1px solid var(--sf-border-default)',
                backgroundColor: sel ? 'var(--sf-accent)' : 'var(--sf-bg-card)',
                color: sel ? 'var(--sf-text-inverse)' : 'var(--sf-text-primary)',
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                justifyContent: 'center', gap: 6, fontSize: 14, fontWeight: 500,
              }}
            >
              <Icon size={t.large ? 24 : 20} strokeWidth={1.75} />
              {t.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
