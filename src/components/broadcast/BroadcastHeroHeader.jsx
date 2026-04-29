import React from 'react';

/**
 * Broadcast hero. Eyebrow + headline + sub + tags + last-updated.
 * Headline accepts a string with <b>...</b> for cobalt emphasis.
 */
export default function BroadcastHeroHeader({
  eyebrow,
  headline,
  sub,
  tags = [],
  lastUpdated,
}) {
  return (
    <header className="bc-hero">
      <div className="bc-hero-inner">
        {eyebrow && <div className="bc-hero-eye">{eyebrow}</div>}
        {headline && (
          // Wave 3a: headline is fixture-controlled. Wave 3b will accept a
          // tuple-array prop and render <b>cobalt</b> emphasis without raw HTML.
          <h1
            className="bc-hero-h1"
            dangerouslySetInnerHTML={{ __html: headline }}
          />
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
