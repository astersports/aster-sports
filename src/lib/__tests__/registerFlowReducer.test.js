import { describe, expect, it } from 'vitest';
import { entrySeq, init, reducer } from '../registerFlowReducer';

const apply = (state, ...actions) => actions.reduce(reducer, state);
const named = (s, name) => apply(s, { type: 'FIELD', section: 'player', field: 'first_name', value: name });

describe('registerFlowReducer (R1 multi-child one-submit)', () => {
  it('init: entry phase, empty children, draft seeded with the URL division', () => {
    const s = init('div-1');
    expect(s.phase).toBe('entry');
    expect(s.children).toEqual([]);
    expect(s.draft.divisionId).toBe('div-1');
  });

  it('COMMIT_CHILD appends to children[] and lands on the roster; draft resets', () => {
    let s = named(init('div-1'), 'Charlie');
    s = reducer(s, { type: 'COMMIT_CHILD' });
    expect(s.phase).toBe('roster');
    expect(s.children).toHaveLength(1);
    expect(s.children[0]).toMatchObject({ division_id: 'div-1', player: { first_name: 'Charlie' } });
    expect(s.draft.player.first_name).toBe('');
  });

  it('ADD_CHILD → COMMIT accumulates a second child (one array → one submit)', () => {
    let s = reducer(named(init('div-1'), 'Charlie'), { type: 'COMMIT_CHILD' });
    s = reducer(s, { type: 'ADD_CHILD', divisionId: 'div-1' });
    expect(s.phase).toBe('entry');
    s = reducer(named(s, 'Milo'), { type: 'COMMIT_CHILD' });
    expect(s.children.map((c) => c.player.first_name)).toEqual(['Charlie', 'Milo']);
  });

  it('EDIT_CHILD loads the draft; COMMIT replaces in place (no append)', () => {
    let s = reducer(named(init('div-1'), 'Charlie'), { type: 'COMMIT_CHILD' });
    s = reducer(s, { type: 'EDIT_CHILD', index: 0 });
    expect(s.editIndex).toBe(0);
    expect(s.draft.player.first_name).toBe('Charlie');
    s = reducer(named(s, 'Charles'), { type: 'COMMIT_CHILD' });
    expect(s.children).toHaveLength(1);
    expect(s.children[0].player.first_name).toBe('Charles');
    expect(s.editIndex).toBeNull();
  });

  it('REMOVE_CHILD drops the row', () => {
    let s = reducer(named(init('div-1'), 'A'), { type: 'COMMIT_CHILD' });
    s = reducer(reducer(s, { type: 'ADD_CHILD', divisionId: 'div-1' }), { type: 'COMMIT_CHILD' });
    expect(s.children).toHaveLength(2);
    s = reducer(s, { type: 'REMOVE_CHILD', index: 0 });
    expect(s.children).toHaveLength(1);
  });

  it('CANCEL_ENTRY returns to roster without committing the draft', () => {
    let s = reducer(named(init('div-1'), 'A'), { type: 'COMMIT_CHILD' });
    s = reducer(s, { type: 'ADD_CHILD', divisionId: 'div-1' });
    s = reducer(named(s, 'Temp'), { type: 'CANCEL_ENTRY' });
    expect(s.phase).toBe('roster');
    expect(s.children).toHaveLength(1);
  });

  it('entrySeq: first child gets guardian; single-division subsequent skips division+guardian; multi-division adds division; edit = player+details', () => {
    expect(entrySeq({ children: [], editIndex: null }, false)).toEqual(['player', 'guardian', 'details']);
    expect(entrySeq({ children: [{}], editIndex: null }, true)).toEqual(['player', 'details']);
    expect(entrySeq({ children: [{}], editIndex: null }, false)).toEqual(['division', 'player', 'details']);
    expect(entrySeq({ children: [{}], editIndex: 0 }, false)).toEqual(['player', 'details']);
  });

  it('pure: same input → deeply-equal output', () => {
    expect(reducer(init('d'), { type: 'COMMIT_CHILD' })).toEqual(reducer(init('d'), { type: 'COMMIT_CHILD' }));
  });

  // ── B3 funnel: authed select path ──
  it('AUTHED_INIT(select) → select phase + pre-filled guardian; without select → entry', () => {
    const g = { first_name: 'Frank', last_name: 'S', email: 'f@x.com', phone: '555' };
    const sel = reducer(init('d'), { type: 'AUTHED_INIT', guardian: g, select: true });
    expect(sel.phase).toBe('select');
    expect(sel.authed).toBe(true);
    expect(sel.guardian).toMatchObject(g);
    const noSel = reducer(init('d'), { type: 'AUTHED_INIT', guardian: g, select: false });
    expect(noSel.phase).toBe('entry');
    expect(noSel.authed).toBe(true);
  });

  it('SELECT_CHILDREN commits existing players carrying player_id → roster (the dedupe fix)', () => {
    let s = reducer(init('d'), { type: 'AUTHED_INIT', guardian: { email: 'f@x.com' }, select: true });
    s = reducer(s, { type: 'SELECT_CHILDREN', divisionId: 'd', picks: [
      { player_id: 'p1', first_name: 'Charlie', last_name: 'S', grade: 5, gender: 'female' },
      { player_id: 'p2', first_name: 'Milo', last_name: 'S', grade: 2, gender: 'male' },
    ] });
    expect(s.phase).toBe('roster');
    expect(s.children).toHaveLength(2);
    expect(s.children[0]).toMatchObject({ division_id: 'd', player: { player_id: 'p1', first_name: 'Charlie', grade: 5 } });
    // every selected child carries a real player_id → submit hits the (program,player) guard
    expect(s.children.every((c) => !!c.player.player_id)).toBe(true);
  });

  it('entrySeq: an authed first child SKIPS the guardian step (identity pre-filled)', () => {
    expect(entrySeq({ children: [], editIndex: null, authed: true }, true)).toEqual(['player', 'details']);
    expect(entrySeq({ children: [], editIndex: null, authed: false }, true)).toEqual(['player', 'guardian', 'details']);
  });
});
