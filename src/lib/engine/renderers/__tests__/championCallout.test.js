import { describe, expect, it } from 'vitest';
import render from '../championCallout';
import fixture from '../../__fixtures__/championCallout';

describe('template T2 — championCallout', () => {
  it('returns { html, plainText }', () => {
    const out = render(fixture);
    expect(out).toEqual(expect.objectContaining({ html: expect.any(String), plainText: expect.any(String) }));
  });
  it('uses gold-bordered cream box', () => {
    const { html } = render(fixture);
    expect(html).toContain('background-color:#fffbeb');
    expect(html).toContain('border:2px solid #fbbf24');
  });
  it('renders trophy emoji + uppercase team + tournament', () => {
    const { html } = render(fixture);
    expect(html).toContain('&#127942;');
    expect(html).toContain('11U GIRLS &mdash; CHAMPIONS');
    expect(html).toContain('ZG Rumble for the Ring CT');
  });
  it('plainText uses ASCII trophy fallback', () => {
    const { plainText } = render(fixture);
    expect(plainText).toContain('[Trophy]');
    expect(plainText).toContain('11U GIRLS');
  });
  it('matches snapshot', () => {
    expect(render(fixture)).toMatchSnapshot();
  });
});
