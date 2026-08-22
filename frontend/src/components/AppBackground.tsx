import React from 'react';

export const AppBackground: React.FC = () => {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none select-none z-0">
      {/* ── 1. Subtle Dot Grid Matrix with Radial Mask ──────────────────────── */}
      <div
        className="absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage: `radial-gradient(#A7B7C6 1.1px, transparent 1.1px)`,
          backgroundSize: '32px 32px',
          maskImage: 'radial-gradient(ellipse 80% 80% at 50% 35%, transparent 15%, black 90%)',
          WebkitMaskImage: 'radial-gradient(ellipse 80% 80% at 50% 35%, transparent 15%, black 90%)',
        }}
      />

      {/* ── 2. Soft Ambient Atmospheric Glow Orbs in Corners ────────────────── */}
      {/* Top-Left Sage Glow */}
      <div className="absolute -top-36 -left-36 w-[34rem] h-[34rem] bg-sage-light/20 rounded-full blur-[120px] animate-pulse-glow" />
      
      {/* Top-Right Soft Blue-Grey Glow */}
      <div
        className="absolute -top-32 -right-32 w-[32rem] h-[32rem] bg-blue-grey/20 rounded-full blur-[120px] animate-pulse-glow"
        style={{ animationDelay: '2.5s' }}
      />
      
      {/* Bottom-Left Slate Glow */}
      <div
        className="absolute -bottom-40 -left-40 w-[36rem] h-[36rem] bg-slate-brand/10 rounded-full blur-[130px] animate-pulse-glow"
        style={{ animationDelay: '1.2s' }}
      />
      
      {/* Bottom-Right Deep Sage Glow */}
      <div
        className="absolute -bottom-32 -right-32 w-[32rem] h-[32rem] bg-sage-deep/15 rounded-full blur-[110px] animate-pulse-glow"
        style={{ animationDelay: '3.8s' }}
      />

      {/* ── 3. Subtle Faint Geometric Concentric Rings ──────────────────────── */}
      <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full border border-blue-grey/10 animate-spin-very-slow hidden md:block" />
      <div className="absolute -top-12 -left-12 w-72 h-72 rounded-full border border-dashed border-sage-deep/15 animate-spin-reverse-slow hidden md:block" />
      <div className="absolute -bottom-28 -right-28 w-[30rem] h-[30rem] rounded-full border border-blue-grey/10 animate-spin-reverse-slow hidden md:block" />
      <div className="absolute -bottom-14 -right-14 w-80 h-80 rounded-full border border-dashed border-slate-brand/15 animate-spin-very-slow hidden md:block" />
    </div>
  );
};
