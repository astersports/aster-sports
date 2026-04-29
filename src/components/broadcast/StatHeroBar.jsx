import React from 'react';

/**
 * 3-to-5 cell stat bar. Used at the top of Records and team detail pages.
 * items: [{ value, label, variant?: 'gold' | 'green' }]
 */
export default function StatHeroBar({ items = [] }) {
  if (!items.length) return null;
  return (
    <div className="bc-statbar" role="group" aria-label="Summary statistics">
      {items.map((item, i) => (
        <div className="bc-statbar-item" key={`${item.label}-${i}`}>
          <span className={`bc-statbar-num ${item.variant || ''}`}>
            {item.value}
          </span>
          <span className="bc-statbar-lbl">{item.label}</span>
        </div>
      ))}
    </div>
  );
}
