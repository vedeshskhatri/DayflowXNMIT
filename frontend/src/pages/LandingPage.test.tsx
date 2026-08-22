import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { LandingPage } from './LandingPage';
import { api } from '../lib/api';

// Dynamic mock auth user
let currentAuthUser: { id: string; role: string; email: string } | null = null;

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: currentAuthUser,
    isLoading: false,
    login: vi.fn(),
    logout: vi.fn(),
    updateUser: vi.fn(),
  }),
}));

describe('Dayflow Marketing Landing Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    currentAuthUser = null;
    window.scrollY = 0;
  });

  const renderLandingPage = () => {
    return render(
      <BrowserRouter>
        <LandingPage />
      </BrowserRouter>
    );
  };

  it('renders all seven core sections per specification', () => {
    renderLandingPage();

    // 1. Sticky Nav
    expect(screen.getByTestId('landing-nav')).toBeInTheDocument();

    // 2. Hero
    expect(screen.getByTestId('hero-section')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', {
        name: /Ditch scattered sheets and Slack pings/i,
      })
    ).toBeInTheDocument();

    // 3. Feature grid
    expect(screen.getByTestId('features-section')).toBeInTheDocument();
    expect(screen.getByText(/Live Presence & 1-Click Check-in/i)).toBeInTheDocument();
    expect(screen.getByText(/Tabbed Employee Directory/i)).toBeInTheDocument();
    expect(screen.getByText(/Role-Based Salary & Payroll Breakdown/i)).toBeInTheDocument();
    expect(screen.getByText(/Time-Off & Leave Approval Workflow/i)).toBeInTheDocument();

    // 4. How it works
    expect(screen.getByTestId('how-it-works-section')).toBeInTheDocument();
    expect(screen.getByText(/Check in from anywhere/i)).toBeInTheDocument();
    expect(screen.getByText(/Managers see live status/i)).toBeInTheDocument();
    expect(screen.getByText(/Attendance rolls up into payroll-ready reports/i)).toBeInTheDocument();

    // 5. Positioning strip
    expect(screen.getByTestId('positioning-section')).toBeInTheDocument();
    expect(screen.getByText(/Built for teams tired of spreadsheet attendance/i)).toBeInTheDocument();
    expect(screen.getByText(/Live status, not end-of-day guesswork/i)).toBeInTheDocument();
    expect(screen.getByText(/One login for presence, profiles, and payroll/i)).toBeInTheDocument();

    // 6. Final CTA band
    expect(screen.getByTestId('final-cta-section')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', {
        name: /Ready to bring clarity and flow to your team's workday\?/i,
      })
    ).toBeInTheDocument();

    // 7. Footer
    expect(screen.getByTestId('landing-footer')).toBeInTheDocument();
    expect(screen.getByText(/© 2026 Dayflow HRMS Inc\. All rights reserved\./i)).toBeInTheDocument();
  });

  it('sticky nav gains white background and shadow state after scrolling past 50px', () => {
    renderLandingPage();

    const nav = screen.getByTestId('landing-nav');
    expect(nav).toHaveClass('bg-transparent');

    // Simulate scrolling past 50px
    act(() => {
      window.scrollY = 75;
      fireEvent.scroll(window);
    });

    expect(nav).toHaveClass('bg-white/95');
    expect(nav).toHaveClass('shadow-sm');
  });

  it('unauthenticated user sees Login and Sign Up buttons; Dashboard button does not render', () => {
    currentAuthUser = null;
    renderLandingPage();

    expect(screen.getByTestId('nav-login-button')).toBeInTheDocument();
    expect(screen.getByTestId('nav-signup-button')).toBeInTheDocument();
    expect(screen.queryByTestId('nav-dashboard-button')).not.toBeInTheDocument();
  });

  it('authenticated user sees Dashboard button linking to /employees; Login/Sign Up buttons do not render and user is not redirected', () => {
    currentAuthUser = {
      id: 'emp-auth-123',
      role: 'EMPLOYEE',
      email: 'alexander@dayflow.internal',
    };

    renderLandingPage();

    const dashboardBtn = screen.getByTestId('nav-dashboard-button');
    expect(dashboardBtn).toBeInTheDocument();
    expect(dashboardBtn).toHaveAttribute('href', '/employees');

    expect(screen.queryByTestId('nav-login-button')).not.toBeInTheDocument();
    expect(screen.queryByTestId('nav-signup-button')).not.toBeInTheDocument();

    // Marketing page remains visible and mounted
    expect(screen.getByTestId('hero-section')).toBeInTheDocument();
  });

  it('asserts zero network calls to /employees and no live data-fetching while LandingPage is mounted', () => {
    const getSpy = vi.spyOn(api, 'get');

    renderLandingPage();

    // The hero showcase is strictly static mock data
    expect(screen.getByTestId('product-showcase-mock')).toBeInTheDocument();
    expect(screen.getByText('Priya Sharma')).toBeInTheDocument();
    expect(screen.getByText('Alexander Mitchell')).toBeInTheDocument();
    expect(screen.getByText('Ananya Iyer')).toBeInTheDocument();
    expect(screen.getByText('Rohan Verma')).toBeInTheDocument();

    // Verified: zero calls to /employees API
    expect(getSpy).not.toHaveBeenCalledWith('/employees');
    expect(getSpy).not.toHaveBeenCalled();
  });
});
