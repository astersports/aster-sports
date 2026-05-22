// Cutover PR 7b-1 — feedback_survey atomic renderer unit tests.

import { describe, expect, it } from 'vitest';
import render from '../feedbackSurvey';

const post = {
  kind: 'feedback_survey',
  feedback_token_urls: {
    1: 'https://x.test/?r=1',
    2: 'https://x.test/?r=2',
    3: 'https://x.test/?r=3',
    4: 'https://x.test/?r=4',
    5: 'https://x.test/?r=5',
  },
};

describe('feedback_survey renderer', () => {
  it('1. renders all 5 buttons with substituted URLs', () => {
    const { html } = render(post);
    for (let r = 1; r <= 5; r += 1) {
      expect(html).toContain(`https://x.test/?r=${r}`);
    }
  });

  it('2. each rating has its star-count label', () => {
    const { html } = render(post);
    expect(html).toContain('★ — Not useful');
    expect(html).toContain('★★ — Could be better');
    expect(html).toContain('★★★ — Decent');
    expect(html).toContain('★★★★ — Good');
    expect(html).toContain('★★★★★ — Excellent');
  });

  it('3. renders heading + sub-context', () => {
    const { html } = render(post);
    expect(html).toContain('How was this briefing?');
    expect(html).toContain('One tap. Helps us tune what shows up here.');
  });

  it('4. fail-loud fallback: feedback_token_urls absent → hrefs render literal {{feedback_*_url}} (AP #29)', () => {
    const pre = { ...post, feedback_token_urls: undefined };
    const { html, plainText } = render(pre);
    for (let r = 1; r <= 5; r += 1) {
      expect(html).toContain(`{{feedback_${r}_url}}`);
      expect(plainText).toContain(`{{feedback_${r}_url}}`);
    }
  });

  it('5. plain-text output enumerates all 5 URLs', () => {
    const { plainText } = render(post);
    expect(plainText).toContain('How was this briefing?');
    for (let r = 1; r <= 5; r += 1) {
      expect(plainText).toContain(`https://x.test/?r=${r}`);
    }
  });

  it('6. HTML escapes URLs (anti-XSS defense in depth)', () => {
    const malicious = {
      kind: 'feedback_survey',
      feedback_token_urls: {
        1: 'https://x.test/?r=1&"onclick=alert(1)"',
        2: 'https://x.test/?r=2',
        3: 'https://x.test/?r=3',
        4: 'https://x.test/?r=4',
        5: 'https://x.test/?r=5',
      },
    };
    const { html } = render(malicious);
    expect(html).toContain('&amp;&quot;onclick=alert(1)&quot;');
    expect(html).not.toContain('"onclick=alert(1)"');
  });
});
