import { describe, expect, it } from 'vitest';
import { composeRsvpNudge } from '../rsvpNudge';

const baseLinks = (token) => ({
  going: `https://example.com/r?t=${token}-g&action=going`,
  maybe: `https://example.com/r?t=${token}-m&action=maybe`,
  not_going: `https://example.com/r?t=${token}-n&action=not_going`,
});

describe('composeRsvpNudge', () => {
  it('emits header + summary + per-player CTA group + footer', () => {
    const out = composeRsvpNudge({
      eventTitle: 'Practice',
      eventTimeLabel: 'Mon, May 11 · 7:35 PM',
      eventLocation: "St. Patrick's",
      players: [{ id: 'p1', name: 'Milo' }],
      rsvpLinks: { p1: baseLinks('milo') },
    });
    expect(out.subject).toContain('RSVP');
    expect(out.html).toContain('QUICK RSVP');
    expect(out.html).toContain('Milo');
    expect(out.html).toContain('GOING');
    expect(out.html).toContain('MAYBE');
    expect(out.html).toContain('CAN’T MAKE IT');
    expect(out.html).toContain('action=going');
    expect(out.html).toContain('action=maybe');
    expect(out.html).toContain('action=not_going');
    const kinds = out.sections.map((s) => s.kind);
    expect(kinds[0]).toBe('header');
    expect(kinds.filter((k) => k === 'cta_buttons').length).toBe(2);
    expect(kinds[kinds.length - 1]).toBe('footer');
  });

  it('handles multi-player families with separate CTA groups per player', () => {
    const out = composeRsvpNudge({
      eventTitle: 'Practice',
      players: [
        { id: 'p1', name: 'Milo' },
        { id: 'p2', name: 'Charlie' },
      ],
      rsvpLinks: { p1: baseLinks('milo'), p2: baseLinks('charlie') },
    });
    expect(out.html).toContain('Milo');
    expect(out.html).toContain('Charlie');
    expect(out.html).toContain('milo-g');
    expect(out.html).toContain('charlie-g');
  });

  it('uses headline_override when provided', () => {
    const out = composeRsvpNudge({
      headline_override: 'Need a quick yes/no',
      eventTitle: 'Practice',
      players: [{ id: 'p1', name: 'Milo' }],
      rsvpLinks: { p1: baseLinks('x') },
    });
    expect(out.html).toContain('NEED A QUICK YES/NO');
  });

  it('renders custom_message above the buttons', () => {
    const out = composeRsvpNudge({
      eventTitle: 'Practice',
      custom_message: 'Quick favor — yes/no/maybe so we can plan.',
      players: [{ id: 'p1', name: 'Milo' }],
      rsvpLinks: { p1: baseLinks('x') },
    });
    expect(out.html).toContain('yes/no/maybe so we can plan');
    // Plain-text bypasses HTML escaping; verify there too.
    expect(out.plainText).toContain('Quick favor');
  });

  it('omits custom_message section when empty', () => {
    const out = composeRsvpNudge({
      eventTitle: 'Practice',
      custom_message: '',
      players: [],
      rsvpLinks: {},
    });
    const narrative = out.sections.filter((s) => s.kind === 'stats_narrative');
    // Only the summary line should show up (no players, no custom message)
    expect(narrative.length).toBeLessThanOrEqual(1);
  });

  it('plain-text path includes button text + URLs', () => {
    const out = composeRsvpNudge({
      eventTitle: 'Practice',
      players: [{ id: 'p1', name: 'Milo' }],
      rsvpLinks: { p1: baseLinks('milo') },
    });
    expect(out.plainText).toContain('GOING');
    expect(out.plainText).toContain('milo-g');
  });

  it('zero players: no CTA sections, header + summary only', () => {
    const out = composeRsvpNudge({
      eventTitle: 'Practice',
      players: [],
      rsvpLinks: {},
    });
    expect(out.sections.find((s) => s.kind === 'cta_buttons')).toBeUndefined();
  });
});
