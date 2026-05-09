import { describe, expect, it } from 'vitest';
import render from '../tiebreakerExplainer';
import fixture from '../../__fixtures__/tiebreakerExplainer';

describe('template T3 — tiebreakerExplainer', () => {
  it('returns { html, plainText }', () => {
    const out = render(fixture);
    expect(out).toEqual(expect.objectContaining({ html: expect.any(String), plainText: expect.any(String) }));
  });
  it('uses light gray bg, no left-color stripe', () => {
    const { html } = render(fixture);
    expect(html).toContain('background-color:#f8fafc');
    expect(html).not.toMatch(/border-left:\d+px solid (#16a34a|#dc2626|#d97706)/);
  });
  it('default label is "How tiebreakers work:"', () => {
    const { html } = render(fixture);
    expect(html).toContain('How tiebreakers work:');
  });
  it('honors custom label override', () => {
    const out = render({ ...fixture, label: 'Custom label' });
    expect(out.html).toContain('Custom label');
    expect(out.html).not.toContain('How tiebreakers work:');
  });
  it('matches snapshot', () => {
    expect(render(fixture)).toMatchSnapshot();
  });
});
