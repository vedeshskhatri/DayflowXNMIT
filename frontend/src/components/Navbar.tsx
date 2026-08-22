import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Users, Clock, CalendarDays, LogOut, Menu, X, ShieldCheck, User, ChevronDown, Trophy } from 'lucide-react';
import { AttendanceControl } from './AttendanceControl';
import { DayflowLogo } from './DayflowLogo';
import { StreakWidget } from './rewards/StreakWidget';
import { PointsToast } from './rewards/PointsToast';
import { getSocket } from '../lib/socket';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const socket = user ? getSocket() : null;
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
    { name: 'Rewards', path: '/rewards', icon: Trophy },
  ];

  const getStatusDotClass = (status?: string) => {
    switch (status) {
      case 'PRESENT':
        return 'bg-sage-light shadow-[0_0_8px_rgba(189,207,170,0.8)]';
      case 'ON_LEAVE':
        return 'bg-sage-deep shadow-[0_0_8px_rgba(142,158,131,0.8)]';
      case 'ABSENT':
      default:
        return 'bg-terracotta shadow-[0_0_8px_rgba(201,123,99,0.8)]';
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
    <>
    <header
      className="sticky top-0 z-40 bg-white/85 border-b border-blue-grey/30 shadow-sm backdrop-blur-xl transition-all"
      style={{ boxShadow: '0 1px 2px 0 rgba(167,183,198,0.25), inset 0 1px 0 0 rgba(255,255,255,0.9)' }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Left: Brand + Nav items */}
          <div className="flex items-center space-x-6 lg:space-x-8 min-w-0">
            <Link
              to="/"
              className="flex items-center space-x-2.5 group hover:bg-slate-brand/5 rounded-xl px-2 py-1 -mx-2 -my-1 transition-all flex-shrink-0"
            >
              <DayflowLogo size="md" />
              <div className="flex flex-col">
                <span className="font-heading font-bold text-lg lg:text-xl tracking-tight text-text-primary">
                  Dayflow
                </span>
                <span className="text-[10px] text-text-muted font-medium -mt-1 tracking-wider uppercase truncate max-w-[120px]">
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
                      className={`relative flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
                        isActive
                          ? 'bg-slate-brand/12 text-slate-brand font-semibold'
                          : 'text-text-muted hover:text-text-primary hover:bg-cream/60'
                      }`}
                    >
                      <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-slate-brand' : 'text-blue-grey'}`} />
                      <span>{item.name}</span>
                      {isActive && (
                        <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-slate-brand rounded-full" />
                      )}
                    </Link>
                  );
                })}
              </nav>
            )}
          </div>

          {/* Right Toolbar: Streak Widget + Attendance Control + Integrated Profile Avatar */}
          {user ? (
            <div className="hidden md:flex items-center space-x-3 flex-shrink-0">
              {/* Gamification: Streak + Points */}
              <StreakWidget />

              {/* Attendance Action (Check In / Out / Completed) */}
              <AttendanceControl />

              {/* User Profile Avatar with Integrated Live Presence Dot */}
              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="flex items-center space-x-2 pl-1.5 pr-2 py-1 rounded-full border border-blue-grey/25 bg-white/80 hover:bg-white hover:border-slate-brand/30 shadow-sm transition-all group"
                  title={`Status: ${getStatusLabel(user.status)} • Click for Profile menu`}
                >
                  <div className="relative">
                    <div className="w-8 h-8 rounded-full bg-slate-brand/15 text-slate-brand font-heading font-bold flex items-center justify-center text-xs border border-slate-brand/30">
                      {user.firstName[0]}
                      {user.lastName[0]}
                    </div>
                    {/* Live Presence Dot attached cleanly to Avatar */}
                    <span
                      className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white ${getStatusDotClass(
                        user.status
                      )} ${user.status === 'PRESENT' ? 'animate-pulse' : ''}`}
                    />
                  </div>

                  <div className="flex items-center space-x-1.5 text-left pr-1">
                    <span className="text-xs font-semibold text-text-primary group-hover:text-slate-brand transition-colors whitespace-nowrap">
                      {user.firstName}
                    </span>
                    {user.role !== 'EMPLOYEE' && (
                      <span className="inline-flex items-center text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-slate-brand/15 text-slate-brand">
                        <ShieldCheck className="w-2.5 h-2.5 mr-0.5" />
                        {user.role}
                      </span>
                    )}
                  </div>
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-blue-grey transition-transform duration-300 ${
                      profileDropdownOpen ? 'rotate-180 text-slate-brand' : ''
                    }`}
                  />
                </button>

                {/* Dropdown Menu */}
                {profileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-modal border border-blue-grey/20 py-2 z-50 animate-fadeIn">
                    <div className="px-4 py-2 border-b border-blue-grey/15 mb-1">
                      <div className="flex items-center space-x-1.5">
                        <span className="text-xs font-semibold text-text-primary truncate">
                          {user.firstName} {user.lastName}
                        </span>
                      </div>
                      <p className="text-[11px] text-text-muted font-mono">{user.loginId}</p>
                      <div className="mt-1 flex items-center space-x-1.5 text-[11px]">
                        <span className={`w-2 h-2 rounded-full ${getStatusDotClass(user.status)}`} />
                        <span className="text-text-muted capitalize">{getStatusLabel(user.status)}</span>
                      </div>
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
              <Link to="/login" className="btn-primary text-sm py-2 px-4 rounded-full">
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
    {/* Gamification: Floating points toast + streak alerts (global, above everything) */}
    {user && <PointsToast socket={socket} />}
    </>
  );
};
