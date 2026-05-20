// @vitest-environment jsdom
//
// §4.O — AdminManagerLayout contract tests. Verify header, search,
// Add CTA, loading skeleton, empty state, and children-slot render
// paths. Tests the wrapper in isolation; per-page consumer tests
// (AdminMembersPage etc.) cover the layout+data integration.

import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render as rtlRender, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { Users } from 'lucide-react';
import AdminManagerLayout from '../AdminManagerLayout';

afterEach(() => cleanup());

// AdminManagerLayout now renders AdminBackHeader (PR for Frank-reported
// "missing back buttons", 2026-05-20), which uses useNavigate() and
// therefore needs a Router context. Wrap render() so every test in this
// file gets the Router for free.
function render(ui, options) {
  return rtlRender(ui, { wrapper: MemoryRouter, ...options });
}

describe('AdminManagerLayout', () => {
  it('renders title + subtitle', () => {
    render(<AdminManagerLayout title="Members" subtitle="3 guardians"><div>body</div></AdminManagerLayout>);
    expect(screen.getByText('Members')).toBeInTheDocument();
    expect(screen.getByText('3 guardians')).toBeInTheDocument();
  });

  it('renders Add button when onAdd provided + fires callback on click', async () => {
    const onAdd = vi.fn();
    render(<AdminManagerLayout title="Members" onAdd={onAdd} addLabel="New member"><div>body</div></AdminManagerLayout>);
    const btn = screen.getByRole('button', { name: /new member/i });
    expect(btn).toBeInTheDocument();
    await userEvent.click(btn);
    expect(onAdd).toHaveBeenCalledOnce();
  });

  it('omits Add button when onAdd not provided', () => {
    render(<AdminManagerLayout title="Members"><div>body</div></AdminManagerLayout>);
    // Scope to "new" / Add CTA buttons — the layout always renders a
    // back-nav button (AdminBackHeader, aria-label="Back") which is
    // expected to exist regardless of onAdd.
    expect(screen.queryByRole('button', { name: /new/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /add/i })).not.toBeInTheDocument();
  });

  it('renders search input when onSearchChange is provided + fires onChange', async () => {
    const onSearchChange = vi.fn();
    render(<AdminManagerLayout title="Members" searchValue="" onSearchChange={onSearchChange} searchPlaceholder="Find people…"><div>body</div></AdminManagerLayout>);
    const input = screen.getByPlaceholderText('Find people…');
    await userEvent.type(input, 'a');
    expect(onSearchChange).toHaveBeenCalledWith('a');
  });

  it('omits search input when no search props', () => {
    render(<AdminManagerLayout title="Members"><div>body</div></AdminManagerLayout>);
    expect(screen.queryByRole('searchbox')).not.toBeInTheDocument();
  });

  it('renders loading skeleton when loading=true (not children)', () => {
    render(<AdminManagerLayout title="Members" loading><div data-testid="body">body</div></AdminManagerLayout>);
    expect(screen.queryByTestId('body')).not.toBeInTheDocument();
  });

  it('renders empty state when isEmpty=true + loading=false (not children)', () => {
    render(
      <AdminManagerLayout
        title="Members"
        isEmpty
        emptyIcon={Users}
        emptyTitle="No matches"
        emptyDescription="Try a different search term."
      >
        <div data-testid="body">body</div>
      </AdminManagerLayout>,
    );
    expect(screen.queryByTestId('body')).not.toBeInTheDocument();
    expect(screen.getByText('No matches')).toBeInTheDocument();
    expect(screen.getByText('Try a different search term.')).toBeInTheDocument();
  });

  it('renders children when not loading + not empty', () => {
    render(
      <AdminManagerLayout title="Members" loading={false} isEmpty={false}>
        <div data-testid="body">visible</div>
      </AdminManagerLayout>,
    );
    expect(screen.getByTestId('body')).toBeInTheDocument();
  });

  it('renders tabs slot when provided', () => {
    render(
      <AdminManagerLayout title="Members" tabs={<div data-testid="tabs">my tabs</div>}>
        <div>body</div>
      </AdminManagerLayout>,
    );
    expect(screen.getByTestId('tabs')).toBeInTheDocument();
  });
});
