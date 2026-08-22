import React from 'react';
import {
  Clock,
  CalendarCheck,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Users,
  Activity,
  CalendarDays,
} from 'lucide-react';

export const AuthBackground: React.FC = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none select-none z-0">
      {/* ── 1. Subtle Dot Grid Matrix with Radial Mask ──────────────────────── */}
      <div
        className="absolute inset-0 opacity-[0.45]"
        style={{
          backgroundImage: `radial-gradient(#A7B7C6 1.2px, transparent 1.2px)`,
          backgroundSize: '28px 28px',
          maskImage: 'radial-gradient(ellipse 70% 60% at 50% 50%, transparent 20%, black 85%)',
          WebkitMaskImage: 'radial-gradient(ellipse 70% 60% at 50% 50%, transparent 20%, black 85%)',
        }}
      />

      {/* ── 2. Soft Ambient Atmospheric Glow Orbs ───────────────────────────── */}
      {/* Top-Left Sage Orb */}
      <div className="absolute -top-32 -left-32 w-[28rem] h-[28rem] bg-sage-light/25 rounded-full blur-[100px] animate-pulse-glow" />
      {/* Top-Right Soft Blue-Grey Orb */}
      <div
        className="absolute -top-24 -right-24 w-[30rem] h-[30rem] bg-blue-grey/25 rounded-full blur-[110px] animate-pulse-glow"
        style={{ animationDelay: '2.5s' }}
      />
      {/* Bottom-Left Slate Brand Orb */}
      <div
        className="absolute -bottom-36 -left-36 w-[32rem] h-[32rem] bg-slate-brand/12 rounded-full blur-[120px] animate-pulse-glow"
        style={{ animationDelay: '1.2s' }}
      />
      {/* Bottom-Right Deep Sage Orb */}
      <div
        className="absolute -bottom-28 -right-28 w-[28rem] h-[28rem] bg-sage-deep/15 rounded-full blur-[100px] animate-pulse-glow"
        style={{ animationDelay: '3.8s' }}
      />

      {/* ── 3. Subtle Concentric Dashed Radar Circles in Corners ──────────────── */}
      {/* Top-Left Subtle Concentric Rings */}
      <div className="absolute -top-20 -left-20 w-80 h-80 rounded-full border border-blue-grey/15 animate-spin-very-slow hidden sm:block" />
      <div className="absolute -top-10 -left-10 w-60 h-60 rounded-full border border-dashed border-sage-deep/20 animate-spin-reverse-slow hidden sm:block" />

      {/* Bottom-Right Subtle Concentric Rings */}
      <div className="absolute -bottom-24 -right-24 w-96 h-96 rounded-full border border-blue-grey/15 animate-spin-reverse-slow hidden sm:block" />
      <div className="absolute -bottom-12 -right-12 w-72 h-72 rounded-full border border-dashed border-slate-brand/20 animate-spin-very-slow hidden sm:block" />

      {/* ── 4. Corner Scene 1 (Top-Left): Live Attendance & Presence ─────────── */}
      <div className="absolute top-10 left-8 xl:left-14 hidden lg:block animate-float-slow">
        <div className="bg-white/85 backdrop-blur-md border border-white/90 shadow-card hover:shadow-modal transition-all duration-300 rounded-2xl p-4 w-72 pointer-events-auto">
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center space-x-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sage-light opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-sage-light" />
              </span>
              <span className="text-xs font-semibold text-text-primary tracking-tight">
                Live Attendance
              </span>
            </div>
            <span className="text-[11px] font-medium text-sage-deep bg-sage-light/35 px-2 py-0.5 rounded-full">
              9:00 AM Shift
            </span>
          </div>

          <div className="flex items-center space-x-3 bg-cream/70 rounded-xl p-2.5 border border-blue-grey/15">
            <div className="w-8 h-8 rounded-lg bg-slate-brand/10 text-slate-brand flex items-center justify-center flex-shrink-0">
              <Clock className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-text-primary truncate">
                Shift Started • On Time
              </p>
              <p className="text-[10px] text-text-muted">
                1-tap NFC / Geo check-in logged
              </p>
            </div>
          </div>

          <div className="mt-2.5 flex items-center justify-between text-[11px] text-text-muted pt-1 border-t border-blue-grey/10">
            <div className="flex items-center space-x-1.5">
              <Users className="w-3.5 h-3.5 text-slate-brand" />
              <span>42 members present</span>
            </div>
            <span className="text-sage-deep font-semibold">98.2%</span>
          </div>
        </div>

        {/* Small floating status micro-pill near Top-Left */}
        <div className="mt-3 ml-6 inline-flex items-center space-x-1.5 bg-white/90 backdrop-blur-sm border border-blue-grey/25 px-3 py-1 rounded-full shadow-sm animate-float-subtle">
          <span className="w-2 h-2 rounded-full bg-sage-light" />
          <span className="text-[11px] font-medium text-text-primary">Dev Team: Active</span>
        </div>
      </div>

      {/* ── 5. Corner Scene 2 (Top-Right): Leave & Time-Off Management ────────── */}
      <div
        className="absolute top-12 right-8 xl:right-14 hidden lg:block animate-float-reverse"
        style={{ animationDelay: '1s' }}
      >
        <div className="bg-white/85 backdrop-blur-md border border-white/90 shadow-card hover:shadow-modal transition-all duration-300 rounded-2xl p-4 w-72 pointer-events-auto">
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 rounded-lg bg-sage-light/40 text-sage-deep flex items-center justify-center">
                <CalendarDays className="w-3.5 h-3.5" />
              </div>
              <span className="text-xs font-semibold text-text-primary tracking-tight">
                Time Off Approved
              </span>
            </div>
            <span className="text-[11px] font-semibold text-sage-deep bg-sage-light/35 px-2 py-0.5 rounded-full flex items-center space-x-1">
              <CheckCircle2 className="w-3 h-3 mr-0.5 inline" />
              Approved
            </span>
          </div>

          <div className="bg-cream/70 rounded-xl p-2.5 border border-blue-grey/15 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-text-primary">
                Summer Vacation
              </span>
              <span className="text-[11px] font-medium text-slate-brand">
                3 Days
              </span>
            </div>
            <div className="flex items-center justify-between text-[10px] text-text-muted">
              <span>Aug 24 – Aug 26</span>
              <span>Paid Time Off</span>
            </div>
          </div>

          <div className="mt-2.5 flex items-center justify-between text-[11px] text-text-muted pt-1 border-t border-blue-grey/10">
            <span>Remaining balance</span>
            <span className="font-semibold text-text-primary">18.5 Days</span>
          </div>
        </div>

        {/* Small floating status micro-pill near Top-Right */}
        <div className="mt-3 mr-4 flex justify-end">
          <div className="inline-flex items-center space-x-1.5 bg-white/90 backdrop-blur-sm border border-blue-grey/25 px-3 py-1 rounded-full shadow-sm animate-float-slow">
            <CalendarCheck className="w-3 h-3 text-slate-brand" />
            <span className="text-[11px] font-medium text-text-primary">Zero leave conflicts</span>
          </div>
        </div>
      </div>

      {/* ── 6. Corner Scene 3 (Bottom-Left): Real-Time Company Pulse ─────────── */}
      <div
        className="absolute bottom-10 left-8 xl:left-14 hidden lg:block animate-float-subtle"
        style={{ animationDelay: '2s' }}
      >
        <div className="bg-white/85 backdrop-blur-md border border-white/90 shadow-card hover:shadow-modal transition-all duration-300 rounded-2xl p-4 w-72 pointer-events-auto">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 rounded-lg bg-slate-brand/10 text-slate-brand flex items-center justify-center">
                <Activity className="w-3.5 h-3.5" />
              </div>
              <span className="text-xs font-semibold text-text-primary tracking-tight">
                Company Pulse
              </span>
            </div>
            <div className="flex items-center space-x-1 text-[10px] font-semibold text-slate-brand bg-slate-brand/10 px-2 py-0.5 rounded-full">
              <Sparkles className="w-2.5 h-2.5" />
              <span>Real-time Sync</span>
            </div>
          </div>

          <p className="text-[11px] text-text-muted mb-2">
            Instant socket updates across attendance & shifts
          </p>

          {/* Mini Progress Bar */}
          <div className="space-y-1">
            <div className="flex justify-between text-[11px] font-medium">
              <span className="text-text-muted">Attendance Rate</span>
              <span className="text-text-primary font-semibold">96.4%</span>
            </div>
            <div className="w-full h-2 bg-cream rounded-full overflow-hidden border border-blue-grey/20">
              <div className="h-full bg-gradient-to-r from-sage-light to-sage-deep rounded-full w-[96.4%]" />
            </div>
          </div>
        </div>
      </div>

      {/* ── 7. Corner Scene 4 (Bottom-Right): Payroll & Enterprise Security ──── */}
      <div
        className="absolute bottom-10 right-8 xl:right-14 hidden lg:block animate-float-slow"
        style={{ animationDelay: '3.2s' }}
      >
        <div className="bg-white/85 backdrop-blur-md border border-white/90 shadow-card hover:shadow-modal transition-all duration-300 rounded-2xl p-4 w-72 pointer-events-auto">
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 rounded-lg bg-sage-deep/15 text-sage-deep flex items-center justify-center">
                <ShieldCheck className="w-3.5 h-3.5" />
              </div>
              <span className="text-xs font-semibold text-text-primary tracking-tight">
                Enterprise Payroll
              </span>
            </div>
            <span className="text-[10px] font-semibold text-text-primary bg-cream px-2 py-0.5 rounded-full border border-blue-grey/20">
              August Cycle
            </span>
          </div>

          <div className="bg-cream/70 rounded-xl p-2.5 border border-blue-grey/15 space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-text-muted">Wage Components</span>
              <span className="font-semibold text-text-primary">100% Balanced</span>
            </div>
            <div className="flex items-center justify-between text-[10px] text-text-muted">
              <span>Basic + Allowances</span>
              <span className="text-sage-deep font-medium">Auto-Calculated</span>
            </div>
          </div>

          <div className="mt-2.5 flex items-center justify-between text-[10px] text-text-muted pt-1 border-t border-blue-grey/10">
            <span>Role-Based Encryption</span>
            <span className="text-slate-brand font-medium">HttpOnly Secured</span>
          </div>
        </div>
      </div>

      {/* ── 8. Extra Floating Geometric Accent Elements ──────────────────────── */}
      {/* Mid-Left Floating Micro-Chip */}
      <div className="absolute top-1/2 left-6 -translate-y-16 hidden xl:flex items-center space-x-2 bg-white/75 backdrop-blur-sm border border-blue-grey/20 px-3 py-1.5 rounded-xl shadow-sm animate-float-slow">
        <span className="w-2 h-2 rounded-full bg-slate-brand" />
        <span className="text-[11px] font-medium text-text-muted">Socket.IO Connected</span>
      </div>

      {/* Mid-Right Floating Micro-Chip */}
      <div
        className="absolute top-1/2 right-6 translate-y-8 hidden xl:flex items-center space-x-2 bg-white/75 backdrop-blur-sm border border-blue-grey/20 px-3 py-1.5 rounded-xl shadow-sm animate-float-reverse"
        style={{ animationDelay: '1.5s' }}
      >
        <span className="w-2 h-2 rounded-full bg-sage-deep" />
        <span className="text-[11px] font-medium text-text-muted">Zero-Delay Sync</span>
      </div>
    </div>
  );
};
