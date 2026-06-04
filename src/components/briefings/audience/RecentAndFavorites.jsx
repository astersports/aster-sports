// Wave 4.4-B Session 5d-b-2 — Recent + Favorite audience strips above
// the segmented audience-type picker on Step 2. Renders nothing when
// both lists are empty (no UX clutter for first-time admins).
//
// Click semantics:
//   chip body  → onApply(audience_type, audience_filter), stay on Step 2
//   star (recent)  → add to favorites (or remove if already favorited)
//   x (favorite)   → remove from favorites
//
// Label derivation: org_all → "All families"; team → resolve team_ids[0]
// to team.name; multi_team → "Name1 + Name2" if ≤2, else "{N} teams".

import { Star, X } from 'lucide-react';
import { useRecentAudiences } from '../../../hooks/useRecentAudiences';
import { useFavoriteAudiences } from '../../../hooks/useFavoriteAudiences';
import { useOrgTeams } from '../../../hooks/useOrgTeams';
import { audienceLabel } from '../../../lib/briefings/audienceLabels';

const wrap = { display: 'flex', flexDirection: 'column', gap: 12 };
const header = { fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--as-text-tertiary)' };
const strip = { display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4, scrollbarWidth: 'none' };
const chip = { display: 'flex', alignItems: 'center', gap: 8, minHeight: 56, padding: '8px 12px', borderRadius: 10, border: '1px solid var(--as-border-default)', backgroundColor: 'var(--as-bg-card)', flexShrink: 0, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left' };
const chipBody = { display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0, flex: 1, background: 'none', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left' };
const chipLabel = { fontSize: 13, fontWeight: 600, color: 'var(--as-text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 200 };
const chipMeta = { fontSize: 11, color: 'var(--as-text-tertiary)' };
const iconBtn = { background: 'none', border: 'none', padding: 4, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minHeight: 28, minWidth: 28 };
const skeleton = { ...chip, opacity: 0.5, width: 140, height: 56 };

function deriveLabel(audience_type, audience_filter, teamsById) {
  if (audience_type === 'org_all') return 'All families';
  const ids = audience_filter?.team_ids || (audience_filter?.team_id ? [audience_filter.team_id] : []);
  if (audience_type === 'team') return teamsById.get(ids[0])?.name || 'Team';
  if (audience_type === 'multi_team') {
    if (ids.length === 0) return 'Multiple teams';
    if (ids.length <= 2) return ids.map((i) => teamsById.get(i)?.name).filter(Boolean).join(' + ') || `${ids.length} teams`;
    return `${ids.length} teams`;
  }
  return audience_type;
}

function audienceKey(t, f) { return JSON.stringify({ t, f: f || null }); }

export default function RecentAndFavorites({ onApply }) {
  const { recents, loading: rLoading } = useRecentAudiences();
  const { favorites, loading: fLoading, add, remove } = useFavoriteAudiences();
  const { teams } = useOrgTeams();
  const loading = rLoading || fLoading;
  const teamsById = new Map(teams.map((t) => [t.id, t]));

  if (!loading && recents.length === 0 && favorites.length === 0) return null;

  const favoriteKeys = new Map(favorites.map((f) => [audienceKey(f.audience_type, f.audience_filter), f.id]));

  const toggleFavorite = (audience_type, audience_filter, label) => {
    const existingId = favoriteKeys.get(audienceKey(audience_type, audience_filter));
    if (existingId) remove(existingId);
    else add(audience_type, audience_filter, label);
  };

  return (
    <div style={wrap} data-testid="recent-and-favorites">
      <section>
        <div style={header}>Recent</div>
        <div style={strip} data-testid="recent-strip">
          {loading && recents.length === 0 ? <div style={skeleton} aria-busy="true" /> : recents.map((r) => {
            const label = deriveLabel(r.audience_type, r.audience_filter, teamsById);
            const isFav = favoriteKeys.has(audienceKey(r.audience_type, r.audience_filter));
            return (
              <div key={`${r.audience_type}-${r.last_sent}`} style={chip}>
                <button type="button" style={chipBody} onClick={() => onApply(r.audience_type, r.audience_filter)} data-testid="recent-chip-body">
                  <span style={chipLabel}>{label}</span>
                  {audienceLabel(r.audience_type) !== label && <span style={chipMeta}>{audienceLabel(r.audience_type)}</span>}
                </button>
                <button type="button" style={iconBtn} onClick={() => toggleFavorite(r.audience_type, r.audience_filter, label)} aria-label={isFav ? 'Remove favorite' : 'Save favorite'} data-testid="recent-star">
                  <Star size={16} strokeWidth={1.75} fill={isFav ? 'var(--as-accent)' : 'none'} color={isFav ? 'var(--as-accent)' : 'var(--as-text-tertiary)'} />
                </button>
              </div>
            );
          })}
        </div>
      </section>
      {favorites.length > 0 && (
        <section>
          <div style={header}>Favorites</div>
          <div style={strip} data-testid="favorites-strip">
            {favorites.map((f) => {
              const label = f.label || deriveLabel(f.audience_type, f.audience_filter, teamsById);
              return (
                <div key={f.id} style={chip}>
                  <button type="button" style={chipBody} onClick={() => onApply(f.audience_type, f.audience_filter)} data-testid="favorite-chip-body">
                    <span style={chipLabel}>{label}</span>
                    {audienceLabel(f.audience_type) !== label && <span style={chipMeta}>{audienceLabel(f.audience_type)}</span>}
                  </button>
                  <button type="button" style={iconBtn} onClick={() => remove(f.id)} aria-label="Remove favorite" data-testid="favorite-x">
                    <X size={16} strokeWidth={1.75} color="var(--as-text-tertiary)" />
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
