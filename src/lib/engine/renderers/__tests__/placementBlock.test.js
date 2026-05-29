import { describe, expect, it } from 'vitest';
import render from '../placementBlock';

// This renderer had NO test while every sibling did — which is why the
// "Finaliststh PLACE" / "Championsth PLACE" bug shipped: the resolver
// correctly emits final_place as a free-text label, but the renderer
// assumed an integer rank and appended an ordinal suffix.
describe('renderer — placementBlock', () => {
  it('returns { html, plainText }', () => {
    expect(render({ final_place: 1 })).toEqual(
      expect.objectContaining({ html: expect.any(String), plainText: expect.any(String) }));
  });

  it('renders empty when no placement', () => {
    expect(render({})).toEqual({ html: '', plainText: '' });
  });

  // BUG (reported): "Finalists" must render verbatim, never "Finaliststh".
  it('renders a text "Finalists" label verbatim, no ordinal suffix', () => {
    const { html, plainText } = render({ final_place: 'Finalists', record: '2-2' });
    expect(html).toContain('FINALISTS');
    expect(html).not.toContain('Finaliststh');
    expect(html).not.toMatch(/Finalists(st|nd|rd|th) PLACE/);
    expect(plainText).toContain('FINALISTS');
  });

  // BUG (same root cause, unreported): "Champions" label must map to the
  // gold champion banner, not "Championsth PLACE".
  it('maps the "Champions" label to the champion banner, not "Championsth"', () => {
    const { html } = render({ final_place: 'Champions', record: '4-0' });
    expect(html).toContain('CHAMPIONS');
    expect(html).not.toContain('Championsth');
    expect(html).toContain('#92400e'); // champion-only stripe color
  });

  it('integer ranks still get the ordinal suffix; rank 1 = CHAMPIONS', () => {
    expect(render({ final_place: 3 }).html).toContain('3rd PLACE');
    expect(render({ final_place: 2 }).html).toContain('2nd PLACE');
    expect(render({ final_place: 1 }).html).toContain('CHAMPIONS');
  });
});
