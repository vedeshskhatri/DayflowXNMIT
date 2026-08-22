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
        return 'bg-sage-light shadow-[0_0_8px_rgba(200,214,175,0.9)]';
      case 'ON_LEAVE':
        return 'bg-copper-light shadow-[0_0_8px_rgba(217,148,82,0.9)]';
      case 'ABSENT':
      default:
        return 'bg-terracotta shadow-[0_0_8px_rgba(200,100,70,0.9)]';
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
        className="sticky top-0 z-40 bg-white/95 border-b border-navy/10 shadow-sm backdrop-blur-xl transition-all"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-4">
            {/* Left: Brand + Nav items */}
            <div className="flex items-center space-x-6 lg:space-x-8 min-w-0">
              <Link
                to="/"
                className="flex items-center space-x-2.5 group hover:bg-navy/5 rounded-2xl px-2 py-1 -mx-2 -my-1 transition-all flex-shrink-0"
              >
                <DayflowLogo size="md" />
                <div className="flex flex-col">
                  <span className="font-heading font-bold text-lg lg:text-xl tracking-tight text-navy-dark">
                    Dayflow
                  </span>
                  <span className="text-[10px] text-text-muted font-bold font-mono -mt-1 tracking-wider uppercase truncate max-w-[120px]">
                    {user?.company?.name || 'HRMS'}
                  </span>
                </div>
              </Link>

              {/* Desktop Navigation */}
              {user && (
                <nav className="hidden md:flex items-center space-x-1.5">
                  {navItems.map((item) => {
                    const isActive = location.pathname.startsWith(item.path);
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-heading font-bold transition-all ${
                          isActive
                            ? 'bg-navy text-white shadow-sm'
                            : 'text-text-muted hover:text-navy-dark hover:bg-cream'
                        }`}
                      >
                        <Icon className={`w-4 h-4 ${isActive ? 'text-copper-bright' : 'text-navy/50'}`} />
                        <span>{item.name}</span>
                      </Link>
                    );
                  })}
                </nav>
              )}
            </div>

            {/* Right: Actions, Streak & User Profile */}
            {user ? (
              <div className="flex items-center space-x-3 sm:space-x-4">
                {/* Attendance Quick Punch Widget */}
                <div className="hidden sm:block">
                  <AttendanceControl compact />
                </div>

                {/* Gamification Streak & Points Counter in Navbar */}
                <StreakWidget />

                {/* Profile Pill & Dropdown */}
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setProfileDropdownOpen((prev) => !prev)}
                    className="flex items-center space-x-2.5 p-1.5 pr-3 rounded-2xl border border-navy/10 bg-cream-light hover:bg-cream hover:border-navy/20 transition-all cursor-pointer shadow-sm"
                  >
                    {/* Avatar / Initials */}
                    {user.profilePicUrl ? (
                      <img
                        src={user.profilePicUrl}
                        alt={`${user.firstName} ${user.lastName}`}
                        className="w-8 h-8 rounded-xl object-cover ring-1 ring-navy/20"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-xl bg-navy text-white font-heading font-bold text-xs flex items-center justify-center ring-1 ring-navy/20">
                        {user.firstName?.[0] || 'U'}
                      </div>
                    )}

                    {/* Name & Role */}
                    <div className="hidden lg:flex flex-col text-left">
                      <span className="text-xs font-heading font-bold text-navy-dark leading-tight">
                        {user.firstName} {user.lastName}
                      </span>
                      <span className="text-[10px] text-text-muted font-bold font-mono">
                        {user.role === 'ADMIN' ? 'Admin' : user.role === 'HR_OFFICER' ? 'HR Officer' : 'Employee'}
                      </span>
                    </div>

                    <ChevronDown className="w-3.5 h-3.5 text-navy/40" />
                  </button>

                  {/* Profile Dropdown Menu */}
                  {profileDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-64 rounded-3xl bg-white border border-navy/10 shadow-modal p-2 animate-scaleUp z-50">
                      {/* User Bio Header */}
                      <div className="p-3 border-b border-navy/10 bg-cream-light rounded-2xl mb-1">
                        <p className="font-heading font-bold text-sm text-navy-dark">
                          {user.firstName} {user.lastName}
                        </p>
                        <p className="text-xs text-text-muted font-mono">{user.email}</p>
                        <div className="mt-2 flex items-center space-x-1.5">
                          <span className={`w-2 h-2 rounded-full ${getStatusDotClass(user.status)}`} />
                          <span className="text-[10px] font-bold text-navy-dark uppercase font-mono">
                            {getStatusLabel(user.status)}
                          </span>
                        </div>
                      </div>

                      {/* Menu Links */}
                      <Link
                        to="/profile"
                        onClick={() => setProfileDropdownOpen(false)}
                        className="flex items-center space-x-2.5 px-3 py-2 text-xs font-bold text-navy-dark hover:bg-cream rounded-xl transition-colors"
                      >
                        <User className="w-4 h-4 text-copper" />
                        <span>My Profile</span>
                      </Link>

                      {user.role === 'ADMIN' && (
                        <div className="px-3 py-1.5 text-[10px] text-copper-dark font-bold font-mono bg-copper-muted rounded-xl my-1 flex items-center space-x-1 border border-copper/30">
                          <ShieldCheck className="w-3 h-3 text-copper" />
                          <span>Admin Access Enabled</span>
                        </div>
                      )}

                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center space-x-2.5 px-3 py-2 text-xs font-bold text-terracotta hover:bg-terracotta-light rounded-xl transition-colors cursor-pointer text-left"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Mobile Hamburger Button */}
                <button
                  onClick={() => setMobileMenuOpen((prev) => !prev)}
                  className="md:hidden p-2 rounded-xl text-navy-dark hover:bg-cream"
                >
                  {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link
                  to="/login"
                  className="text-xs font-heading font-bold text-navy-dark hover:text-navy px-3 py-2"
                >
                  Sign In
                </Link>
                <Link
                  to="/signup"
                  className="btn-navy py-2 px-4 text-xs font-bold shadow-sm"
                >
                  Register Company
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && user && (
          <div className="md:hidden border-t border-navy/10 bg-white px-4 pt-3 pb-5 space-y-3 shadow-modal animate-fadeIn">
            <div className="mb-3">
              <AttendanceControl />
            </div>

            <nav className="space-y-1">
              {navItems.map((item) => {
                const isActive = location.pathname.startsWith(item.path);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center space-x-3 px-4 py-2.5 rounded-xl text-xs font-heading font-bold ${
                      isActive
                        ? 'bg-navy text-white'
                        : 'text-text-muted hover:text-navy-dark hover:bg-cream'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>

            <div className="pt-3 border-t border-navy/10">
              <button
                onClick={handleLogout}
                className="w-full flex items-center space-x-2 px-4 py-2 text-xs font-bold text-terracotta hover:bg-terracotta-light rounded-xl"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Real-time points award sound & toast notifications */}
      {socket && <PointsToast socket={socket} />}
    </>
  );
};
