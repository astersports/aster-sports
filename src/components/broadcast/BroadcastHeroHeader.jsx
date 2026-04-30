import React from 'react';

/**
 * Broadcast hero. Eyebrow + headline + sub + tags + last-updated.
 *
 * The headline accepts plain text. An optional `accent` prop renders one
 * cobalt-emphasized word/phrase to the right of the headline using a
 * <b> tag (styled by .bc-hero-h1 b in broadcast.css). No raw HTML, no
 * dangerouslySetInnerHTML — safe for user-derived content.
 */
export default function BroadcastHeroHeader({
  eyebrow,
  headline,
  accent,
  sub,
  tags = [],
  lastUpdated,
}) {
  return (
    <header className="bc-hero">
      <div className="bc-hero-inner">
        {eyebrow && <div className="bc-hero-eye">{eyebrow}</div>}
        {(headline || accent) && (
          <h1 className="bc-hero-h1">
            {headline}
            {accent && <> <b>{accent}</b></>}
          </h1>
        )}
        {sub && <p className="bc-hero-sub">{sub}</p>}
        {tags.length > 0 && (
          <div className="bc-hero-tags">
            {tags.map((t) => (
              <span key={t} className="bc-hero-tag">{t}</span>
            ))}
          </div>
        )}
        {lastUpdated && (
          <p className="bc-last-updated">Last updated {lastUpdated}</p>
        )}
      </div>
    </header>
  );
}
