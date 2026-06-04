// @vitest-environment jsdom
//
// AI-1 free-form draft controls. Locks: button gating (disabled until gist),
// draft vs redraft mode dispatch, and warnings/error rendering.

import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import AiDraftControls from '../AiDraftControls';

afterEach(cleanup);

const base = { gist: '', onGistChange: () => {}, onDraft: () => {}, loading: false, warnings: [], error: null, hasDrafted: false };

describe('AiDraftControls', () => {
  it('disables the button until the gist is non-empty', () => {
    const { rerender } = render(<AiDraftControls {...base} />);
    expect(screen.getByRole('button', { name: /draft with ai/i })).toBeDisabled();
    rerender(<AiDraftControls {...base} gist="practice moved to 6pm" />);
    expect(screen.getByRole('button', { name: /draft with ai/i })).not.toBeDisabled();
  });

  it('dispatches draft mode first, redraft once a draft exists', () => {
    const onDraft = vi.fn();
    const { rerender } = render(<AiDraftControls {...base} gist="x" onDraft={onDraft} />);
    fireEvent.click(screen.getByRole('button', { name: 'Draft with AI' }));
    expect(onDraft).toHaveBeenCalledWith('draft');
    rerender(<AiDraftControls {...base} gist="x" onDraft={onDraft} hasDrafted />);
    fireEvent.click(screen.getByRole('button', { name: 'Redraft with AI' }));
    expect(onDraft).toHaveBeenLastCalledWith('redraft');
  });

  it('shows a loading label and disables while drafting', () => {
    render(<AiDraftControls {...base} gist="x" loading />);
    expect(screen.getByText('Drafting...')).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('renders warnings and errors', () => {
    const { rerender } = render(<AiDraftControls {...base} gist="x" warnings={['venue missing']} />);
    expect(screen.getByText('venue missing')).toBeInTheDocument();
    rerender(<AiDraftControls {...base} gist="x" error={new Error('voice profile not configured')} />);
    expect(screen.getByText('voice profile not configured')).toBeInTheDocument();
  });
});
