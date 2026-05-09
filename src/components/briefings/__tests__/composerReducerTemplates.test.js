import { describe, expect, it } from 'vitest';
import { composerReducer, INITIAL_STATE } from '../composerReducer';

describe('composerReducer — wave 3.16 SET_ACTIVE_TEMPLATE', () => {
  it('initial state has activeTemplateId=null', () => {
    expect(INITIAL_STATE.activeTemplateId).toBeNull();
  });

  it('SET_ACTIVE_TEMPLATE stores the template id', () => {
    const s = composerReducer(INITIAL_STATE, { type: 'SET_ACTIVE_TEMPLATE', payload: { templateId: 'tr-weekend-wrapup-champs' } });
    expect(s.activeTemplateId).toBe('tr-weekend-wrapup-champs');
  });

  it('SET_ACTIVE_TEMPLATE with null clears the active selection', () => {
    const a = composerReducer(INITIAL_STATE, { type: 'SET_ACTIVE_TEMPLATE', payload: { templateId: 'gr-home-game' } });
    const b = composerReducer(a, { type: 'SET_ACTIVE_TEMPLATE', payload: { templateId: null } });
    expect(b.activeTemplateId).toBeNull();
  });

  it('SET_ACTIVE_TEMPLATE with no payload clears the active selection', () => {
    const a = composerReducer(INITIAL_STATE, { type: 'SET_ACTIVE_TEMPLATE', payload: { templateId: 'an-volunteer-ask' } });
    const b = composerReducer(a, { type: 'SET_ACTIVE_TEMPLATE' });
    expect(b.activeTemplateId).toBeNull();
  });

  it('SET_ACTIVE_TEMPLATE does not touch body — caller must dispatch UPDATE_BODY separately', () => {
    const seeded = { ...INITIAL_STATE, body: { headline: 'existing' } };
    const s = composerReducer(seeded, { type: 'SET_ACTIVE_TEMPLATE', payload: { templateId: 'an-volunteer-ask' } });
    expect(s.body).toEqual({ headline: 'existing' });
  });

  it('SET_ACTIVE_TEMPLATE → UPDATE_BODY sequence yields consistent state', () => {
    const a = composerReducer(INITIAL_STATE, { type: 'SET_ACTIVE_TEMPLATE', payload: { templateId: 'an-volunteer-ask' } });
    const b = composerReducer(a, { type: 'UPDATE_BODY', patch: { headline: 'We need volunteers', body_text: 'Body' } });
    expect(b.activeTemplateId).toBe('an-volunteer-ask');
    expect(b.body.headline).toBe('We need volunteers');
    expect(b.body.body_text).toBe('Body');
  });

  it('selecting a different template overwrites overlapping body fields via UPDATE_BODY merge', () => {
    const a = composerReducer(INITIAL_STATE, { type: 'UPDATE_BODY', patch: { headline: 'old', body_text: 'old' } });
    const b = composerReducer(a, { type: 'UPDATE_BODY', patch: { headline: 'new' } });
    expect(b.body.headline).toBe('new');
    expect(b.body.body_text).toBe('old'); // non-overlapping fields preserved
  });
});
