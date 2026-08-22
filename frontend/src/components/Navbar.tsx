import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Users, Clock, CalendarDays, LogOut, Menu, X, ShieldCheck, User, ChevronDown } from 'lucide-react';
import { AttendanceControl } from './AttendanceControl';
import { DayflowLogo } from './DayflowLogo';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setProfileDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    setProfileDropdownOpen(false);
    await logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Employees', path: '/employees', icon: Users },
    { name: 'Attendance', path: '/attendance', icon: Clock },
    { name: 'Time Off', path: '/timeoff', icon: CalendarDays },
  ];

  const getStatusDotClass = (status?: string) => {
    switch (status) {
      case 'PRESENT':
        return 'bg-sage-light shadow-[0_0_8px_rgba(189,207,170,0.8)]';
      case 'ON_LEAVE':
        return 'bg-sage-deep shadow-[0_0_8px_rgba(142,158,131,0.8)]';
      case 'ABSENT':
      default:
        return 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]';
    }
  };

  const getStatusLabel = (status?: string) => {
    switch (status) {
      case 'PRESENT':
        return 'Present';
      case 'ON_LEAVE':
        return 'On Leave';
      case 'ABSENT':
      default:
        return 'Absent';
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-blue-grey/30 shadow-sm backdrop-blur-md bg-white/95">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left: Brand + Nav items */}
          <div className="flex items-center space-x-8">
            <Link to="/" className="flex items-center space-x-3 group">
              <DayflowLogo size="md" />
              <div className="flex flex-col">
                <span className="font-heading font-bold text-xl tracking-tight text-text-primary">
                  Dayflow
                </span>
                <span className="text-[10px] text-text-muted font-medium -mt-1 tracking-wider uppercase">
                  {user?.company?.name || 'HRMS'}
                </span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            {user && (
              <nav className="hidden md:flex items-center space-x-1">
                {navItems.map((item) => {
                  const isActive = location.pathname.startsWith(item.path);
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-sm font-medium transition-all ${
                        isActive
                          ? 'bg-slate-brand/10 text-slate-brand font-semibold'
                          : 'text-text-muted hover:text-text-primary hover:bg-cream/60'
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${isActive ? 'text-slate-brand' : 'text-blue-grey'}`} />
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
              </nav>
            )}
          </div>

          {/* Right: Check In / Check Out Systray + Presence Status & Profile */}
          {user ? (
            <div className="hidden md:flex items-center space-x-4">
              {/* Check In / Check Out Systray */}
              <AttendanceControl />

              <div className="h-6 w-px bg-blue-grey/25" />

              {/* Presence Status Pill */}
              <div className="flex items-center space-x-2 bg-cream/70 border border-blue-grey/20 rounded-full px-3 py-1 text-xs">
                <span className={`w-2.5 h-2.5 rounded-full ${getStatusDotClass(user.status)}`} />
                <span className="font-medium text-text-primary">{getStatusLabel(user.status)}</span>
              </div>

              {/* User Profile Avatar with Interactive Dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="flex items-center space-x-2.5 pl-2 py-1 pr-2 rounded-xl border border-transparent hover:border-blue-grey/20 hover:bg-cream/60 transition-all group"
                  title="User Menu"
                >
                  <div className="w-9 h-9 rounded-full bg-slate-brand/15 text-slate-brand font-heading font-bold flex items-center justify-center text-sm border border-slate-brand/20 group-hover:scale-105 transition-transform">
                    {user.firstName[0]}
                    {user.lastName[0]}
                  </div>
                  <div className="flex flex-col text-left">
                    <div className="flex items-center space-x-1.5">
                      <span className="text-sm font-semibold text-text-primary leading-none group-hover:text-slate-brand transition-colors">
                        {user.firstName} {user.lastName}
                      </span>
                      {user.role !== 'EMPLOYEE' && (
                        <span className="inline-flex items-center text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-brand/15 text-slate-brand">
                          <ShieldCheck className="w-3 h-3 mr-0.5" />
                          {user.role}
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-text-muted mt-0.5">{user.loginId}</span>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-blue-grey transition-transform duration-200 ${profileDropdownOpen ? 'rotate-180 text-slate-brand' : ''}`} />
                </button>

                {/* Dropdown Menu (Wireframe: My Profile, Log Out) */}
                {profileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-modal border border-blue-grey/20 py-2 z-50 animate-fadeIn">
                    <div className="px-4 py-2 border-b border-blue-grey/15 mb-1">
                      <p className="text-xs font-semibold text-text-primary truncate">
                        {user.firstName} {user.lastName}
                      </p>
                      <p className="text-[11px] text-text-muted font-mono">{user.loginId}</p>
                    </div>

                    <Link
                      to="/profile"
                      onClick={() => setProfileDropdownOpen(false)}
                      className="flex items-center space-x-2.5 px-4 py-2.5 text-sm text-text-primary hover:bg-cream hover:text-slate-brand transition-colors"
                    >
                      <User className="w-4 h-4 text-slate-brand" />
                      <span className="font-medium">My Profile</span>
                    </Link>

                    <div className="border-t border-blue-grey/15 my-1" />

                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full flex items-center space-x-2.5 px-4 py-2.5 text-sm text-terracotta hover:bg-terracotta/10 transition-colors text-left"
                    >
                      <LogOut className="w-4 h-4" />
                      <span className="font-medium">Log Out</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="hidden md:flex items-center">
              <Link to="/login" className="btn-primary text-sm py-2 px-4">
                Sign In
              </Link>
            </div>
          )}

          {/* Mobile hamburger button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-text-primary hover:bg-cream"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6 text-slate-brand" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile dropdown menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-blue-grey/30 px-4 pt-2 pb-4 space-y-3 shadow-lg animate-fadeIn">
          {user ? (
            <>
              <div className="flex items-center justify-between pb-3 border-b border-blue-grey/20">
                <Link
                  to="/profile"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center space-x-3"
                >
                  <div className="w-10 h-10 rounded-full bg-slate-brand/15 text-slate-brand font-bold flex items-center justify-center">
                    {user.firstName[0]}
                    {user.lastName[0]}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-text-primary hover:text-slate-brand">
                      {user.firstName} {user.lastName}
                    </div>
                    <div className="text-xs text-text-muted">{user.loginId}</div>
                  </div>
                </Link>
                <div className="flex items-center space-x-1.5 bg-cream px-2.5 py-1 rounded-full text-xs">
                  <span className={`w-2 h-2 rounded-full ${getStatusDotClass(user.status)}`} />
                  <span className="font-medium">{getStatusLabel(user.status)}</span>
                </div>
              </div>

              {/* Mobile Check In / Check Out Systray */}
              <div className="py-2 border-b border-blue-grey/15 flex justify-center">
                <AttendanceControl />
              </div>

              <div className="space-y-1">
                {navItems.map((item) => {
                  const isActive = location.pathname.startsWith(item.path);
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-medium ${
                        isActive
                          ? 'bg-slate-brand/10 text-slate-brand font-semibold'
                          : 'text-text-primary hover:bg-cream'
                      }`}
                    >
                      <Icon className="w-5 h-5 text-slate-brand" />
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
              </div>

              <div className="pt-2">
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleLogout();
                  }}
                  className="w-full flex items-center justify-center space-x-2 py-2.5 rounded-xl text-sm font-medium text-terracotta bg-terracotta/10 hover:bg-terracotta/20 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Log out</span>
                </button>
              </div>
            </>
          ) : (
            <Link
              to="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="btn-primary w-full text-center block"
            >
              Sign In
            </Link>
          )}
        </div>
      )}
    </header>
  );
};
