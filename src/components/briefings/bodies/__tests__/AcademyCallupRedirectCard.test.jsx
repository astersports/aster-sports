// @vitest-environment jsdom
//
// Wave 4.8 BUG (5/13 incident) — AcademyCallupRedirectCard renders in
// place of the player picker when the wizard cannot complete an
// academy_callup_notice. Tests cover the visible content (heading,
// numbered steps, button label) and the navigation target.

import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

const navigateSpy = vi.fn();
vi.mock('react-router-dom', () => ({
  useNavigate: () => navigateSpy,
}));

const { default: AcademyCallupRedirectCard } = await import('../AcademyCallupRedirectCard');

afterEach(() => { cleanup(); vi.clearAllMocks(); });

describe('AcademyCallupRedirectCard', () => {
  it('a. renders the heading explaining the canonical flow', () => {
    render(<AcademyCallupRedirectCard />);
    expect(screen.getByText('Academy call-ups start from the event')).toBeInTheDocument();
  });

  it('b. renders all three numbered instruction steps', () => {
    render(<AcademyCallupRedirectCard />);
    expect(screen.getByText(/Open the event in your schedule/i)).toBeInTheDocument();
    expect(screen.getByText(/Lock the roster/i)).toBeInTheDocument();
    expect(screen.getByText(/Tap Add next to the academy player/i)).toBeInTheDocument();
  });

  it('c. renders the trailing "compose flow opens automatically" hint', () => {
    render(<AcademyCallupRedirectCard />);
    expect(screen.getByText(/compose flow opens automatically/i)).toBeInTheDocument();
  });

  it('d. renders the "Open Schedule" button', () => {
    render(<AcademyCallupRedirectCard />);
    expect(screen.getByRole('button', { name: /open schedule/i })).toBeInTheDocument();
  });

  it('e. tapping the button navigates to /schedule', () => {
    render(<AcademyCallupRedirectCard />);
    fireEvent.click(screen.getByRole('button', { name: /open schedule/i }));
    expect(navigateSpy).toHaveBeenCalledWith('/schedule');
  });

  it('f. renders the footnote explaining the activation requirement', () => {
    render(<AcademyCallupRedirectCard />);
    expect(screen.getByText(/requires the player to be activated/i)).toBeInTheDocument();
  });
});
