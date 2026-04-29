import React from 'react';

/**
 * Small pill rendered next to the opponent name on a championship final game.
 * Uses gold accent to differentiate from regular game rows.
 */
export default function ChampionshipBadge() {
  return (
    <span className="bc-glog-champ" aria-label="Championship final">
      ★ Championship
    </span>
  );
}
