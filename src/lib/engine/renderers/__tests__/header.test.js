import { describe, expect, it } from 'vitest';
import { renderHeader } from '../header';

describe('renderer #1 — header (uplifted shape)', () => {
  const fixture = {
    eyebrow: 'Legacy Hoopers · Weekly Digest',
    headline: 'Week Ahead',
    sub_context: 'May 11–17',
    goldStripe: true,
  };
  it('returns { html, plainText }', () => {
    const out = renderHeader(fixture);
    expect(out).toEqual(expect.objectContaining({ html: expect.any(String), plainText: expect.any(String) }));
    expect(out.html).toContain('<table');
    // Title content stays in original case in the HTML — CSS text-transform
    // handles the visual uppercase. plainText below is where casing changes.
    expect(out.html).toContain('Legacy Hoopers · Weekly Digest');
    expect(out.html).toContain('background-color:#fbbf24'); // gold stripe
  });
  it('plainText uppercases eyebrow + headline + includes sub_context', () => {
    const { plainText } = renderHeader(fixture);
    expect(plainText).toContain('LEGACY HOOPERS · WEEKLY DIGEST');
    expect(plainText).toContain('WEEK AHEAD');
    expect(plainText).toContain('May 11–17');
  });
  it('omits gold stripe when not requested', () => {
    const out = renderHeader({ ...fixture, goldStripe: false });
    expect(out.html).not.toContain('background-color:#fbbf24');
  });
});
