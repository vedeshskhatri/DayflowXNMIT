import React from 'react';

export const AuthBackground: React.FC = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none select-none z-0">
      {/* ── 1. Subtle Dot Grid Matrix with Radial Mask ──────────────────────── */}
      <div
        className="absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage: `radial-gradient(#A7B7C6 1px, transparent 1px)`,
          backgroundSize: '28px 28px',
          maskImage: 'radial-gradient(ellipse 70% 60% at 50% 50%, transparent 20%, black 85%)',
          WebkitMaskImage: 'radial-gradient(ellipse 70% 60% at 50% 50%, transparent 20%, black 85%)',
        }}
      />

      {/* ── 2. Soft Ambient Atmospheric Glow Orbs ───────────────────────────── */}
      {/* Top-Left Sage Orb */}
      <div className="absolute -top-32 -left-32 w-[28rem] h-[28rem] bg-sage-light/20 rounded-full blur-[100px] animate-pulse-glow" />
      {/* Top-Right Soft Blue-Grey Orb */}
      <div
        className="absolute -top-24 -right-24 w-[30rem] h-[30rem] bg-blue-grey/20 rounded-full blur-[110px] animate-pulse-glow"
        style={{ animationDelay: '2.5s' }}
      />
      {/* Bottom-Left Slate Brand Orb */}
      <div
        className="absolute -bottom-36 -left-36 w-[32rem] h-[32rem] bg-slate-brand/10 rounded-full blur-[120px] animate-pulse-glow"
        style={{ animationDelay: '1.2s' }}
      />
      {/* Bottom-Right Deep Sage Orb */}
      <div
        className="absolute -bottom-28 -right-28 w-[28rem] h-[28rem] bg-sage-deep/12 rounded-full blur-[100px] animate-pulse-glow"
        style={{ animationDelay: '3.8s' }}
      />

      {/* ── 3. Subtle Concentric Dashed Radar Circles in Corners ──────────────── */}
      <div className="absolute -top-20 -left-20 w-80 h-80 rounded-full border border-blue-grey/15 animate-spin-very-slow hidden sm:block" />
      <div className="absolute -bottom-24 -right-24 w-96 h-96 rounded-full border border-blue-grey/15 animate-spin-reverse-slow hidden sm:block" />
    </div>
  );
};
