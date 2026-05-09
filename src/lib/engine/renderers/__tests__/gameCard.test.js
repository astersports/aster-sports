import { describe, expect, it } from 'vitest';
import { renderGameCard } from '../gameCard';

describe('renderer #3 — gameCard (uplifted shape)', () => {
  const fixture = {
    variant: 'championship',
    rail: { timePrimary: '10:00', timeSuffix: 'AM' },
    primary: 'CHAMPIONSHIP — LEGACY VS WAVE',
    secondary: { text: 'Stamford Sportsplex', link: { text: 'Map', url: 'https://example.com/map' } },
    stakeLine: { text: 'Win and you take the bracket.', tone: 'green' },
    bonusBadge: false,
  };
  it('returns { html, plainText }', () => {
    const out = renderGameCard(fixture);
    expect(out).toEqual(expect.objectContaining({ html: expect.any(String), plainText: expect.any(String) }));
  });
  it('championship variant uses gold border + cream bg', () => {
    const { html } = renderGameCard(fixture);
    expect(html).toContain('border:1px solid #fbbf24');
    expect(html).toContain('background-color:#fffbeb');
  });
  it('plainText carries time, primary, secondary link, and stake line', () => {
    const { plainText } = renderGameCard(fixture);
    expect(plainText).toContain('10:00 AM');
    expect(plainText).toContain('CHAMPIONSHIP — LEGACY VS WAVE');
    expect(plainText).toContain('Stamford Sportsplex');
    expect(plainText).toContain('https://example.com/map');
    expect(plainText).toContain('Win and you take the bracket.');
  });
  it('bonus badge surfaces in both html and plainText', () => {
    const out = renderGameCard({ ...fixture, bonusBadge: true });
    expect(out.html).toContain('BONUS');
    expect(out.plainText).toContain('[BONUS]');
  });
});
