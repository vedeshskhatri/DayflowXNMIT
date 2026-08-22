import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, type Variants } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { DayflowLogo } from '../components/DayflowLogo';
import {
  Clock,
  Radio,
  UserCheck,
  Calculator,
  CalendarCheck,
  CheckCircle2,
  ArrowRight,
  Menu,
  X,
  Search,
} from 'lucide-react';

// Hardcoded static preview data for the Hero showcase (Zero network / Zero sockets)
const MOCK_SHOWCASE_EMPLOYEES = [
  {
    id: 'emp-mock-1',
    name: 'Priya Sharma',
    role: 'Lead Product Designer',
    department: 'Design',
    initials: 'PS',
    status: 'PRESENT' as const,
    statusText: 'In Office • Checked in 09:05 AM',
    tags: ['Figma', 'UI/UX', 'Design Systems'],
  },
  {
    id: 'emp-mock-2',
    name: 'Alexander Mitchell',
    role: 'Staff Systems Architect',
    department: 'Engineering',
    initials: 'AM',
    status: 'PRESENT' as const,
    statusText: 'Remote • Checked in 08:52 AM',
    tags: ['Node.js', 'PostgreSQL', 'Architecture'],
  },
  {
    id: 'emp-mock-3',
    name: 'Ananya Iyer',
    role: 'Senior Frontend Engineer',
    department: 'Engineering',
    initials: 'AI',
    status: 'ON_LEAVE' as const,
    statusText: 'On Paid Leave • Returns Monday',
    tags: ['React', 'TypeScript', 'Tailwind'],
  },
  {
    id: 'emp-mock-4',
    name: 'Rohan Verma',
    role: 'Operations & Payroll Lead',
    department: 'Operations',
    initials: 'RV',
    status: 'ABSENT' as const,
    statusText: 'Not Checked In Today',
    tags: ['Compliance', 'Payroll', 'Audit'],
  },
];

export const LandingPage: React.FC = () => {
  const { user } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Smooth scroll helper
  const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Subtle scroll animation configuration
  const fadeUpVariant: Variants = {
    hidden: { opacity: 0, y: 16 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.28, ease: 'easeOut' },
    },
  };

  return (
    <div className="min-h-screen bg-cream text-text-primary font-sans selection:bg-slate-brand/20 selection:text-slate-brand">
      {/* ── SECTION 1: STICKY NAV BAR ──────────────────────────────── */}
      <header
        data-testid="landing-nav"
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-250 ${
          isScrolled
            ? 'bg-white/95 backdrop-blur-md shadow-sm border-b border-blue-grey/20 py-3.5'
            : 'bg-transparent py-5'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          {/* Brand Logo / Wordmark */}
          <Link to="/" className="flex items-center space-x-3 group" aria-label="Dayflow Home">
            <DayflowLogo size="md" showText />
          </Link>

          {/* Desktop Navigation Links & Auth Actions */}
          <nav className="hidden md:flex items-center space-x-8">
            <a
              href="#features"
              onClick={(e) => scrollToSection(e, 'features')}
              className="text-xs font-medium text-text-muted hover:text-text-primary transition-colors"
            >
              Features
            </a>
            <a
              href="#how-it-works"
              onClick={(e) => scrollToSection(e, 'how-it-works')}
              className="text-xs font-medium text-text-muted hover:text-text-primary transition-colors"
            >
              How It Works
            </a>
            <a
              href="#platform-values"
              onClick={(e) => scrollToSection(e, 'platform-values')}
              className="text-xs font-medium text-text-muted hover:text-text-primary transition-colors"
            >
              Why Dayflow
            </a>

            <div className="flex items-center space-x-3 pl-4 border-l border-blue-grey/25">
              {user ? (
                <Link
                  to="/employees"
                  data-testid="nav-dashboard-button"
                  className="bg-slate-brand hover:bg-slate-brand/90 text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-sm transition-all hover:shadow flex items-center space-x-1.5"
                >
                  <span>Go to Dashboard</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              ) : (
                <>
                  <Link
                    to="/login"
                    data-testid="nav-login-button"
                    className="text-xs font-semibold text-text-primary hover:text-slate-brand px-3 py-2 rounded-xl transition-colors"
                  >
                    Login
                  </Link>
                  <Link
                    to="/signup"
                    data-testid="nav-signup-button"
                    className="bg-slate-brand hover:bg-slate-brand/90 text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-sm transition-all hover:shadow"
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </nav>

          {/* Mobile Menu Toggle Button */}
          <button
            type="button"
            data-testid="mobile-menu-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl text-text-primary hover:bg-white/60 transition-colors"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile Menu Drawer */}
        {mobileMenuOpen && (
          <div
            data-testid="mobile-drawer"
            className="md:hidden bg-white border-b border-blue-grey/20 px-6 py-5 space-y-4 shadow-md animate-fadeIn"
          >
            <div className="flex flex-col space-y-3 text-sm font-medium">
              <a
                href="#features"
                onClick={(e) => scrollToSection(e, 'features')}
                className="text-text-primary hover:text-slate-brand py-1"
              >
                Features
              </a>
              <a
                href="#how-it-works"
                onClick={(e) => scrollToSection(e, 'how-it-works')}
                className="text-text-primary hover:text-slate-brand py-1"
              >
                How It Works
              </a>
              <a
                href="#platform-values"
                onClick={(e) => scrollToSection(e, 'platform-values')}
                className="text-text-primary hover:text-slate-brand py-1"
              >
                Why Dayflow
              </a>
            </div>

            <div className="pt-4 border-t border-blue-grey/20 flex flex-col space-y-2">
              {user ? (
                <Link
                  to="/employees"
                  className="w-full text-center bg-slate-brand text-white text-xs font-semibold py-2.5 rounded-xl shadow-sm"
                >
                  Go to Dashboard
                </Link>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="w-full text-center py-2 text-xs font-semibold text-text-primary hover:bg-cream/40 rounded-xl"
                  >
                    Login
                  </Link>
                  <Link
                    to="/signup"
                    className="w-full text-center bg-slate-brand text-white text-xs font-semibold py-2.5 rounded-xl shadow-sm"
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      {/* ── SECTION 2: HERO ────────────────────────────────────────── */}
      <section
        data-testid="hero-section"
        className="pt-32 pb-16 md:pt-40 md:pb-24 overflow-hidden"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            {/* Hero Left Column: Copy & Actions */}
            <motion.div
              className="lg:col-span-6 space-y-6"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUpVariant}
            >
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/80 border border-blue-grey/25 text-xs text-text-muted shadow-xs">
                <span className="w-2 h-2 rounded-full bg-sage-light ring-2 ring-sage-deep/30" />
                <span className="font-medium">Modern HR &amp; Live Team Presence</span>
              </div>

              <h1 className="font-heading font-bold text-3xl sm:text-4xl md:text-5xl text-text-primary tracking-tight leading-[1.15]">
                Ditch scattered sheets and Slack pings. One live view of who&apos;s in, who&apos;s out, and payroll-ready data.
              </h1>

              <p className="font-sans text-sm sm:text-base text-text-muted leading-relaxed max-w-xl">
                Dayflow gives modern teams real-time presence tracking, 1-click check-ins, automated leave approvals, and compliant salary breakdowns in a unified, calm interface.
              </p>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-3 sm:space-y-0 sm:space-x-4 pt-2">
                <Link
                  to="/signup"
                  data-testid="hero-primary-cta"
                  className="bg-slate-brand hover:bg-slate-brand/90 text-white font-heading font-semibold text-sm px-6 py-3.5 rounded-xl shadow-sm hover:shadow transition-all text-center flex items-center justify-center space-x-2 group"
                >
                  <span>Get Started Free</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                </Link>

                <a
                  href="#how-it-works"
                  data-testid="hero-secondary-cta"
                  onClick={(e) => scrollToSection(e, 'how-it-works')}
                  className="bg-white hover:bg-white/80 text-text-primary border border-blue-grey/30 font-heading font-semibold text-sm px-6 py-3.5 rounded-xl shadow-xs transition-colors text-center"
                >
                  See How It Works
                </a>
              </div>

              {/* Quality reassurance highlights */}
              <div className="pt-6 grid grid-cols-3 gap-3 border-t border-blue-grey/20 text-xs text-text-muted">
                <div className="flex items-center space-x-1.5">
                  <CheckCircle2 className="w-4 h-4 text-sage-deep flex-shrink-0" />
                  <span>Zero clutter</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <CheckCircle2 className="w-4 h-4 text-sage-deep flex-shrink-0" />
                  <span>Real-time sync</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <CheckCircle2 className="w-4 h-4 text-sage-deep flex-shrink-0" />
                  <span>Instant setup</span>
                </div>
              </div>
            </motion.div>

            {/* Hero Right Column: Realistic Mocked Product Showcase (Zero network / Zero sockets) */}
            <motion.div
              className="lg:col-span-6"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUpVariant}
            >
              <div
                data-testid="product-showcase-mock"
                className="bg-white rounded-2xl border border-blue-grey/25 shadow-card p-5 sm:p-6 space-y-4 relative"
              >
                {/* Simulated App Header */}
                <div className="flex items-center justify-between pb-3 border-b border-blue-grey/15">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-3 h-3 rounded-full bg-terracotta/70" />
                    <div className="w-3 h-3 rounded-full bg-amber-400/70" />
                    <div className="w-3 h-3 rounded-full bg-sage-deep/70" />
                    <span className="text-[11px] font-mono text-text-muted ml-2">
                      dayflow.app/employees
                    </span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-sage-light/40 text-sage-deep border border-sage-deep/20">
                      <Radio className="w-2.5 h-2.5 mr-1 text-sage-deep animate-pulse" />
                      Live Feed
                    </span>
                  </div>
                </div>

                {/* Simulated Attendance Presence Summary Bar */}
                <div className="p-3.5 rounded-xl bg-cream/40 border border-blue-grey/20 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-sage-light ring-2 ring-sage-deep/30" />
                      <span className="font-semibold text-text-primary">18 Present</span>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-sage-deep" />
                      <span className="font-semibold text-text-primary">2 On Leave</span>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-terracotta" />
                      <span className="font-semibold text-text-primary">4 Absent</span>
                    </div>
                  </div>

                  <span className="text-[10px] font-mono text-text-muted">Today • 09:41 AM</span>
                </div>

                {/* Simulated Search Filter Input */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    readOnly
                    value="Search 24 team members..."
                    className="w-full bg-cream/30 border border-blue-grey/20 rounded-xl pl-8 pr-3 py-1.5 text-xs text-text-muted cursor-default select-none"
                  />
                </div>

                {/* Simulated Employee Cards Grid (Matching Real Dashboard Design) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {MOCK_SHOWCASE_EMPLOYEES.map((emp) => {
                    const isPresent = emp.status === 'PRESENT';
                    const isOnLeave = emp.status === 'ON_LEAVE';
                    const isAbsent = emp.status === 'ABSENT';

                    return (
                      <div
                        key={emp.id}
                        className="p-3.5 rounded-xl bg-white border border-blue-grey/20 shadow-xs hover:border-slate-brand/40 transition-colors space-y-2.5"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center space-x-2.5">
                            <div className="w-9 h-9 rounded-full bg-slate-brand/15 text-slate-brand font-heading font-bold text-xs flex items-center justify-center">
                              {emp.initials}
                            </div>
                            <div>
                              <p className="font-heading font-bold text-xs text-text-primary leading-tight">
                                {emp.name}
                              </p>
                              <p className="text-[10px] text-text-muted">{emp.role}</p>
                            </div>
                          </div>

                          {/* Status Indicator Dot matching master DESIGN-SYSTEM.md */}
                          <div
                            title={emp.status}
                            className="flex items-center justify-center p-1"
                          >
                            {isPresent && (
                              <span
                                data-testid="status-dot-present"
                                className="w-2.5 h-2.5 rounded-full bg-sage-light ring-2 ring-sage-deep/40"
                              />
                            )}
                            {isOnLeave && (
                              <span
                                data-testid="status-dot-onleave"
                                className="w-2.5 h-2.5 rounded-full bg-sage-deep ring-2 ring-sage-deep/30"
                              />
                            )}
                            {isAbsent && (
                              <span
                                data-testid="status-dot-absent"
                                className="w-2.5 h-2.5 rounded-full bg-terracotta ring-2 ring-terracotta/40"
                              />
                            )}
                          </div>
                        </div>

                        <div className="text-[10px] text-text-muted bg-cream/30 px-2 py-1 rounded-lg flex items-center justify-between">
                          <span className="truncate">{emp.statusText}</span>
                          <span className="font-semibold text-slate-brand">{emp.department}</span>
                        </div>

                        <div className="flex flex-wrap gap-1">
                          {emp.tags.slice(0, 2).map((t, idx) => (
                            <span
                              key={idx}
                              className="px-1.5 py-0.5 rounded text-[9px] bg-blue-grey/15 text-text-muted font-medium"
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── SECTION 3: FEATURE GRID ────────────────────────────────── */}
      <section
        id="features"
        data-testid="features-section"
        className="py-16 md:py-24 bg-cream/60 border-t border-b border-blue-grey/20"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <motion.div
            className="text-center max-w-2xl mx-auto space-y-3"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUpVariant}
          >
            <span className="text-xs font-bold text-slate-brand uppercase tracking-wider">
              Core Capabilities
            </span>
            <h2 className="font-heading font-bold text-2xl sm:text-3xl text-text-primary">
              Everything your team needs for daily presence and payroll clarity
            </h2>
            <p className="text-xs sm:text-sm text-text-muted">
              Built deliberately around real workplace workflows without redundant enterprise overhead.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Feature Card 1: Live Presence & 1-Click Check-in */}
            <motion.div
              className="bg-white rounded-xl shadow-sm p-6 border border-blue-grey/25 space-y-4 hover:shadow transition-shadow"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUpVariant}
            >
              <div className="w-11 h-11 rounded-xl bg-slate-brand/10 text-slate-brand flex items-center justify-center">
                <Clock className="w-5 h-5" />
              </div>
              <div className="space-y-2">
                <h3 className="font-heading font-bold text-base text-text-primary">
                  Live Presence &amp; 1-Click Check-in
                </h3>
                <p className="text-xs text-text-muted leading-relaxed">
                  Track real-time check-in and check-out with automatic presence indicators, IP verification, and instant status updates across your entire workspace.
                </p>
              </div>
            </motion.div>

            {/* Feature Card 2: Tabbed Employee Directory */}
            <motion.div
              className="bg-white rounded-xl shadow-sm p-6 border border-blue-grey/25 space-y-4 hover:shadow transition-shadow"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUpVariant}
            >
              <div className="w-11 h-11 rounded-xl bg-slate-brand/10 text-slate-brand flex items-center justify-center">
                <UserCheck className="w-5 h-5" />
              </div>
              <div className="space-y-2">
                <h3 className="font-heading font-bold text-base text-text-primary">
                  Tabbed Employee Directory
                </h3>
                <p className="text-xs text-text-muted leading-relaxed">
                  Access rich, multi-tab employee profiles with organized tabs for resumes, contact details, private records, and security governance.
                </p>
              </div>
            </motion.div>

            {/* Feature Card 3: Role-Based Salary & Payroll Breakdown */}
            <motion.div
              className="bg-white rounded-xl shadow-sm p-6 border border-blue-grey/25 space-y-4 hover:shadow transition-shadow"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUpVariant}
            >
              <div className="w-11 h-11 rounded-xl bg-slate-brand/10 text-slate-brand flex items-center justify-center">
                <Calculator className="w-5 h-5" />
              </div>
              <div className="space-y-2">
                <h3 className="font-heading font-bold text-base text-text-primary">
                  Role-Based Salary &amp; Payroll Breakdown
                </h3>
                <p className="text-xs text-text-muted leading-relaxed">
                  Compute accurate monthly wages, standard allowances, HRA, PF deductions, and professional taxes with role-guarded privacy.
                </p>
              </div>
            </motion.div>

            {/* Feature Card 4: Time-Off & Leave Approval Workflow */}
            <motion.div
              className="bg-white rounded-xl shadow-sm p-6 border border-blue-grey/25 space-y-4 hover:shadow transition-shadow"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUpVariant}
            >
              <div className="w-11 h-11 rounded-xl bg-slate-brand/10 text-slate-brand flex items-center justify-center">
                <CalendarCheck className="w-5 h-5" />
              </div>
              <div className="space-y-2">
                <h3 className="font-heading font-bold text-base text-text-primary">
                  Time-Off &amp; Leave Approval Workflow
                </h3>
                <p className="text-xs text-text-muted leading-relaxed">
                  Effortlessly request, review, and approve leave with real-time balance checks, multi-day calendar pickers, and automated team notifications.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── SECTION 4: HOW IT WORKS ────────────────────────────────── */}
      <section
        id="how-it-works"
        data-testid="how-it-works-section"
        className="py-16 md:py-24"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <motion.div
            className="text-center max-w-2xl mx-auto space-y-3"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUpVariant}
          >
            <span className="text-xs font-bold text-slate-brand uppercase tracking-wider">
              Step-by-Step Workflow
            </span>
            <h2 className="font-heading font-bold text-2xl sm:text-3xl text-text-primary">
              How Dayflow streamlines your workday
            </h2>
            <p className="text-xs sm:text-sm text-text-muted">
              From morning check-in to end-of-month compensation in 3 frictionless steps.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Step 01 */}
            <motion.div
              className="bg-white rounded-xl shadow-sm p-6 border border-blue-grey/25 space-y-4 relative"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUpVariant}
            >
              <span className="inline-block font-heading font-bold text-2xl text-slate-brand/40">
                01
              </span>
              <h3 className="font-heading font-bold text-base text-text-primary">
                Check in from anywhere
              </h3>
              <p className="text-xs text-text-muted leading-relaxed">
                Employees clock in with a single tap from web or mobile with instantaneous status broadcast to the entire organization.
              </p>
            </motion.div>

            {/* Step 02 */}
            <motion.div
              className="bg-white rounded-xl shadow-sm p-6 border border-blue-grey/25 space-y-4 relative"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUpVariant}
            >
              <span className="inline-block font-heading font-bold text-2xl text-slate-brand/40">
                02
              </span>
              <h3 className="font-heading font-bold text-base text-text-primary">
                Managers see live status
              </h3>
              <p className="text-xs text-text-muted leading-relaxed">
                Real-time presence dashboards display who&apos;s present, on leave, or working remotely without disruptive status pings.
              </p>
            </motion.div>

            {/* Step 03 */}
            <motion.div
              className="bg-white rounded-xl shadow-sm p-6 border border-blue-grey/25 space-y-4 relative"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUpVariant}
            >
              <span className="inline-block font-heading font-bold text-2xl text-slate-brand/40">
                03
              </span>
              <h3 className="font-heading font-bold text-base text-text-primary">
                Attendance rolls up into payroll-ready reports
              </h3>
              <p className="text-xs text-text-muted leading-relaxed">
                Validated work hours and approved leaves automatically calculate wage components and tax deductions ready for payout.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── SECTION 5: POSITIONING STRIP ───────────────────────────── */}
      <section
        id="platform-values"
        data-testid="positioning-section"
        className="py-16 bg-gradient-to-r from-white via-cream/50 to-white border-t border-b border-blue-grey/20"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center md:text-left"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUpVariant}
          >
            <div className="space-y-2 p-4">
              <h4 className="font-heading font-bold text-lg text-text-primary">
                Built for teams tired of spreadsheet attendance
              </h4>
              <p className="text-xs text-text-muted leading-relaxed">
                No more manual reconciliations, lost paper forms, or chaotic Friday messaging threads.
              </p>
            </div>

            <div className="space-y-2 p-4 md:border-l md:border-blue-grey/20">
              <h4 className="font-heading font-bold text-lg text-text-primary">
                Live status, not end-of-day guesswork
              </h4>
              <p className="text-xs text-text-muted leading-relaxed">
                Instant visibility into office attendance, remote check-ins, and active working sessions.
              </p>
            </div>

            <div className="space-y-2 p-4 md:border-l md:border-blue-grey/20">
              <h4 className="font-heading font-bold text-lg text-text-primary">
                One login for presence, profiles, and payroll
              </h4>
              <p className="text-xs text-text-muted leading-relaxed">
                Unified workspace governance that connects daily timesheets directly to compensation rules.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── SECTION 6: FINAL CTA BAND ──────────────────────────────── */}
      <section
        data-testid="final-cta-section"
        className="py-16 md:py-24 bg-slate-brand text-white relative overflow-hidden"
      >
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6 relative z-10">
          <motion.div
            className="space-y-4"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUpVariant}
          >
            <h2 className="font-heading font-bold text-2xl sm:text-3xl md:text-4xl text-white tracking-tight">
              Ready to bring clarity and flow to your team&apos;s workday?
            </h2>
            <p className="text-xs sm:text-sm text-white/80 max-w-xl mx-auto leading-relaxed">
              Join forward-thinking teams using Dayflow for effortless attendance, leave approvals, and transparent payroll management.
            </p>

            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center space-y-3 sm:space-y-0 sm:space-x-4">
              <Link
                to="/signup"
                data-testid="cta-band-signup"
                className="bg-white hover:bg-cream text-slate-brand font-heading font-semibold text-sm px-8 py-3.5 rounded-xl shadow-md transition-all w-full sm:w-auto"
              >
                Get Started Free
              </Link>
              <Link
                to="/login"
                data-testid="cta-band-login"
                className="bg-transparent hover:bg-white/10 text-white border border-white/40 font-heading font-semibold text-sm px-8 py-3.5 rounded-xl transition-colors w-full sm:w-auto"
              >
                Sign In to Workspace
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── SECTION 7: FOOTER ──────────────────────────────────────── */}
      <footer
        data-testid="landing-footer"
        className="bg-white border-t border-blue-grey/25 py-12 text-xs text-text-muted"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
            {/* Column 1: Brand & Bio */}
            <div className="md:col-span-2 space-y-3">
              <Link to="/" className="inline-block" aria-label="Dayflow">
                <DayflowLogo size="sm" showText />
              </Link>
              <p className="text-xs text-text-muted leading-relaxed max-w-sm">
                Dayflow is the unified team presence and HR platform designed for calm, modern workplaces.
              </p>
            </div>

            {/* Column 2: Product Links */}
            <div className="space-y-2.5">
              <span className="font-heading font-bold text-xs text-text-primary uppercase tracking-wider block">
                Product
              </span>
              <ul className="space-y-2">
                <li>
                  <a
                    href="#features"
                    onClick={(e) => scrollToSection(e, 'features')}
                    className="hover:text-text-primary transition-colors"
                  >
                    Features
                  </a>
                </li>
                <li>
                  <a
                    href="#how-it-works"
                    onClick={(e) => scrollToSection(e, 'how-it-works')}
                    className="hover:text-text-primary transition-colors"
                  >
                    How It Works
                  </a>
                </li>
                <li>
                  <Link to="/login" className="hover:text-text-primary transition-colors">
                    Login Portal
                  </Link>
                </li>
                <li>
                  <Link to="/signup" className="hover:text-text-primary transition-colors">
                    Create Workspace
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 3: Company Links */}
            <div className="space-y-2.5">
              <span className="font-heading font-bold text-xs text-text-primary uppercase tracking-wider block">
                Company
              </span>
              <ul className="space-y-2">
                <li>
                  <a href="#platform-values" onClick={(e) => scrollToSection(e, 'platform-values')} className="hover:text-text-primary transition-colors">
                    Why Dayflow
                  </a>
                </li>
                <li>
                  <Link to="/login" className="hover:text-text-primary transition-colors">
                    Security Architecture
                  </Link>
                </li>
                <li>
                  <Link to="/login" className="hover:text-text-primary transition-colors">
                    Privacy Policy
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 4: Legal Links */}
            <div className="space-y-2.5">
              <span className="font-heading font-bold text-xs text-text-primary uppercase tracking-wider block">
                Legal
              </span>
              <ul className="space-y-2">
                <li>
                  <Link to="/login" className="hover:text-text-primary transition-colors">
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link to="/login" className="hover:text-text-primary transition-colors">
                    SOC-2 Overview
                  </Link>
                </li>
                <li>
                  <Link to="/login" className="hover:text-text-primary transition-colors">
                    Cookie Policy
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-6 border-t border-blue-grey/15 flex flex-col sm:flex-row items-center justify-between text-[11px] gap-2">
            <p>&copy; 2026 Dayflow HRMS Inc. All rights reserved.</p>
            <p className="text-text-muted">Designed in accordance with Dayflow Design System.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};
