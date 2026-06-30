// @vitest-environment jsdom
//
// ResetPasswordPage — completes the password-recovery flow (the screen the app
// was missing). Locks: a recovery session shows the form and updateUser saves
// the new password; mismatched passwords are rejected client-side without a DB
// call; no recovery session shows the expired state with a re-request link.

import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

const h = vi.hoisted(() => ({
  getSession: vi.fn(),
  onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe() {} } } })),
  updateUser: vi.fn(),
}));
vi.mock('../../lib/supabase', () => ({ supabase: { auth: h } }));

import ResetPasswordPage from '../ResetPasswordPage';

afterEach(() => { cleanup(); vi.clearAllMocks(); });

const renderPage = () => render(<MemoryRouter><ResetPasswordPage /></MemoryRouter>);

describe('ResetPasswordPage', () => {
  it('lets a recovery user set a new password (updateUser called, success shown)', async () => {
    h.getSession.mockResolvedValue({ data: { session: { user: { id: 'u1' } } } });
    h.updateUser.mockResolvedValue({ error: null });
    const { findByLabelText, getByLabelText, getByRole, findByText } = renderPage();
    fireEvent.change(await findByLabelText('New password'), { target: { value: 'supersecret' } });
    fireEvent.change(getByLabelText('Confirm password'), { target: { value: 'supersecret' } });
    fireEvent.click(getByRole('button', { name: /Save new password/ }));
    await findByText('Password updated');
    expect(h.updateUser).toHaveBeenCalledWith({ password: 'supersecret' });
  });

  it('reports same-password reuse plainly (not as an expired link)', async () => {
    h.getSession.mockResolvedValue({ data: { session: { user: { id: 'u1' } } } });
    h.updateUser.mockResolvedValue({ error: { code: 'same_password', message: 'New password should be different from the old password.' } });
    const { findByLabelText, getByLabelText, getByRole, findByText } = renderPage();
    fireEvent.change(await findByLabelText('New password'), { target: { value: 'supersecret' } });
    fireEvent.change(getByLabelText('Confirm password'), { target: { value: 'supersecret' } });
    fireEvent.click(getByRole('button', { name: /Save new password/ }));
    await findByText(/different from your current one/i);
  });

  it('rejects mismatched passwords without touching the DB', async () => {
    h.getSession.mockResolvedValue({ data: { session: { user: {} } } });
    const { findByLabelText, getByLabelText, getByRole, findByText } = renderPage();
    fireEvent.change(await findByLabelText('New password'), { target: { value: 'supersecret' } });
    fireEvent.change(getByLabelText('Confirm password'), { target: { value: 'different-1' } });
    fireEvent.click(getByRole('button', { name: /Save new password/ }));
    await findByText(/don.t match/i);
    expect(h.updateUser).not.toHaveBeenCalled();
  });

  it('shows the expired state + re-request link when there is no recovery session', async () => {
    h.getSession.mockResolvedValue({ data: { session: null } });
    const { findByText, getByRole } = renderPage();
    await findByText(/invalid or has expired/i);
    expect(getByRole('link', { name: /Send a new reset link/ }).getAttribute('href')).toBe('/forgot-password');
  });
});
