import { describe, expect, it } from 'vitest';
import { renderChampionshipScenarios } from '../championshipScenarios';

describe('renderer #8 — championshipScenarios (uplifted shape)', () => {
  const fixture = {
    outcomes: [
      { tone: 'positive', label: 'Win Saturday + win Sunday', body: 'You take the bracket and the trophy.' },
      { tone: 'negative', label: 'Drop Saturday', body: 'Bracket lifeline depends on tiebreakers.' },
    ],
    tiebreaker: { label: 'How tiebreakers work', body: 'Head-to-head first, then PD capped at +20.' },
  };
  it('returns { html, plainText }', () => {
    const out = renderChampionshipScenarios(fixture);
    expect(out).toEqual(expect.objectContaining({ html: expect.any(String), plainText: expect.any(String) }));
  });
  it('outcome left borders match tone colors', () => {
    const { html } = renderChampionshipScenarios(fixture);
    expect(html).toContain('border-left:4px solid #16a34a'); // positive
    expect(html).toContain('border-left:4px solid #dc2626'); // negative
  });
  it('plainText starts with section header + lists each outcome + tiebreaker', () => {
    const { plainText } = renderChampionshipScenarios(fixture);
    expect(plainText.startsWith('CHAMPIONSHIP SCENARIOS')).toBe(true);
    expect(plainText).toContain('— Win Saturday + win Sunday');
    expect(plainText).toContain('— Drop Saturday');
    expect(plainText).toContain('How tiebreakers work');
  });
});
