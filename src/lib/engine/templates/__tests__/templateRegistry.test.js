import { describe, expect, it } from 'vitest';
import { getTemplatesForKind, TEMPLATES_BY_KIND } from '../index';

// Field-shape contract per body editor (mirrors §1 pre-flight).
// Keep in lockstep with src/components/briefings/bodies/<X>Body.jsx
// defaultValue exports.
// Wave 3.16.1: tourney_link_label added to game_recap, tournament_prelim,
// tournament_recap. URL is resolved at compose time from anchor; only the
// label lives on the body.
const EDITOR_SHAPES = {
  weekly_digest: ['body_notes', 'ops_notes'],
  game_recap: ['score', 'our_highlights', 'opp_highlights', 'player_of_game_name', 'coach_note', 'tourney_link_label'],
  tournament_prelim: ['hotel_block', 'sat_notes', 'sun_notes', 'opponent_scouting', 'lineup_notes', 'tourney_link_label'],
  tournament_recap: ['final_standing', 'game_results', 'mvp_name', 'takeaways', 'tourney_link_label'],
  announcement: ['headline', 'body_text'],
  custom_message: ['subject', 'body_text'],
  rsvp_nudge: ['headline_override', 'custom_message', 'ask_comment_field'],
};

describe('TEMPLATES_BY_KIND', () => {
  it('every kind in the registry exports a default array', () => {
    Object.entries(TEMPLATES_BY_KIND).forEach(([kind, templates]) => {
      expect(Array.isArray(templates), kind).toBe(true);
      expect(templates.length, kind).toBeGreaterThan(0);
    });
  });

  it('every template has id + name + body', () => {
    Object.entries(TEMPLATES_BY_KIND).forEach(([kind, templates]) => {
      templates.forEach((t) => {
        expect(t.id, `${kind}/${t.id}`).toBeTruthy();
        expect(t.name, `${kind}/${t.id}`).toBeTruthy();
        expect(t.body && typeof t.body === 'object', `${kind}/${t.id}`).toBe(true);
      });
    });
  });

  it('template ids are unique within their kind', () => {
    Object.entries(TEMPLATES_BY_KIND).forEach(([kind, templates]) => {
      const ids = templates.map((t) => t.id);
      expect(new Set(ids).size, kind).toBe(ids.length);
    });
  });

  it("template body keys are a subset of the body editor's field shape", () => {
    Object.entries(TEMPLATES_BY_KIND).forEach(([kind, templates]) => {
      const allowed = new Set(EDITOR_SHAPES[kind] || []);
      templates.forEach((t) => {
        Object.keys(t.body).forEach((k) => {
          expect(allowed.has(k), `${kind}/${t.id}: body field "${k}" not in editor shape`).toBe(true);
        });
      });
    });
  });
});

describe('getTemplatesForKind', () => {
  it('returns array for known kinds', () => {
    expect(getTemplatesForKind('weekly_digest').length).toBeGreaterThan(0);
    expect(getTemplatesForKind('tournament_recap').length).toBeGreaterThan(0);
  });

  it('returns empty array for schedule_change (auto-generated diff, no templates)', () => {
    expect(getTemplatesForKind('schedule_change')).toEqual([]);
  });

  it('returns templates for rsvp_nudge after wave 4.0', () => {
    const t = getTemplatesForKind('rsvp_nudge');
    expect(t.length).toBeGreaterThan(0);
    expect(t[0].id).toBe('rn-blank');
  });

  it('returns empty array for unknown kinds', () => {
    expect(getTemplatesForKind('not_a_real_kind')).toEqual([]);
  });
});
