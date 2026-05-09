import { describe, expect, it } from 'vitest';
import render from '../poolStandings';
import fixture from '../../__fixtures__/poolStandings';

describe('renderer #4 — poolStandings', () => {
  it('returns { html, plainText }', () => {
    const out = render(fixture);
    expect(out).toEqual(expect.objectContaining({ html: expect.any(String), plainText: expect.any(String) }));
  });
  it('own-team row gets cobalt highlight + 3px left border', () => {
    const { html } = render(fixture);
    expect(html).toContain('background-color:#eff6ff');
    expect(html).toContain('border-left:3px solid #4a8fd4');
    expect(html).toContain('Legacy');
  });
  it('PD column color-codes positive vs negative', () => {
    const { html } = render(fixture);
    expect(html).toContain('color:#16a34a'); // +12, +5
    expect(html).toContain('color:#dc2626'); // -17
  });
  it('plainText is tabular ASCII with own-team marker', () => {
    const { plainText } = render(fixture);
    expect(plainText).toMatch(/TEAM\s+W\s+L\s+PD/);
    expect(plainText).toContain('Legacy');
    expect(plainText).toContain('* = own team');
  });
  it('matches snapshot', () => {
    expect(render(fixture)).toMatchSnapshot();
  });
});
