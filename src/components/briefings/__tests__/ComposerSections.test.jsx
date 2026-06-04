// @vitest-environment jsdom
//
// PR-A kind-adaptive render lock (architect-requested). The one-screen composer
// renders all sections together when a kind is composable, and ONLY the body
// (redirect card) when the kind is blocked (wizardSupported:false). Child step
// components are stubbed — this asserts the section gating, not their internals.

import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';

vi.mock('../StepAnchorAudience', () => ({ default: () => <div data-testid="anchor-audience" /> }));
vi.mock('../StepBodySignoff', () => ({ default: () => <div data-testid="body-signoff" /> }));
vi.mock('../StepSendConfirm', () => ({ default: () => <div data-testid="send-confirm" /> }));
vi.mock('../PreviewPanel', () => ({ default: () => <div data-testid="preview" /> }));
vi.mock('../ScheduleForLaterPicker', () => ({ default: () => <div data-testid="schedule" /> }));

const ComposerSections = (await import('../ComposerSections')).default;

const base = {
  state: { kind: 'announcement', send_mode: 'now', scheduled_for: null },
  dispatch: () => {}, audience: { filtered: 1 }, recipients: [], coaches: [],
  onSend: () => {}, sending: false, onSaveDraft: () => {}, onCancel: () => {},
};

afterEach(cleanup);

describe('ComposerSections (one-screen kind-adaptive render)', () => {
  it('renders every section together when the kind is composable', () => {
    render(<ComposerSections {...base} blocked={false} />);
    for (const id of ['anchor-audience', 'body-signoff', 'schedule', 'preview', 'send-confirm']) {
      expect(screen.getByTestId(id)).toBeInTheDocument();
    }
  });

  it('renders ONLY the body (redirect) when the kind is blocked', () => {
    render(<ComposerSections {...base} blocked />);
    expect(screen.getByTestId('body-signoff')).toBeInTheDocument();
    expect(screen.queryByTestId('anchor-audience')).toBeNull();
    expect(screen.queryByTestId('send-confirm')).toBeNull();
    expect(screen.queryByTestId('schedule')).toBeNull();
    expect(screen.queryByTestId('preview')).toBeNull();
  });
});
