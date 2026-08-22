import React from 'react';

export const AppBackground: React.FC = () => {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none select-none z-0">
      {/* ── 1. Subtle Dot Grid Matrix with Radial Mask ──────────────────────── */}
      <div
        className="absolute inset-0 opacity-[0.4]"
        style={{
          backgroundImage: `radial-gradient(#2D4263 1px, transparent 1px)`,
          backgroundSize: '36px 36px',
          maskImage: 'radial-gradient(ellipse 80% 80% at 50% 35%, transparent 20%, black 90%)',
          WebkitMaskImage: 'radial-gradient(ellipse 80% 80% at 50% 35%, transparent 20%, black 90%)',
        }}
      />

      {/* ── 2. Soft Ambient Atmospheric Glow Orbs ───────────────────────────── */}
      {/* Top-Left Warm Cream / Copper Glow */}
      <div className="absolute -top-36 -left-36 w-[36rem] h-[36rem] bg-copper/10 rounded-full blur-[130px] animate-pulse-glow" />
      
      {/* Top-Right Classic Navy Glow */}
      <div
        className="absolute -top-32 -right-32 w-[34rem] h-[34rem] bg-navy/8 rounded-full blur-[120px] animate-pulse-glow"
        style={{ animationDelay: '2.5s' }}
      />
      
      {/* Bottom-Left Warm Ambient Glow */}
      <div
        className="absolute -bottom-40 -left-40 w-[38rem] h-[38rem] bg-cream-subtle/80 rounded-full blur-[140px] animate-pulse-glow"
        style={{ animationDelay: '1.2s' }}
      />
      
      {/* Bottom-Right Copper Accent Glow */}
      <div
        className="absolute -bottom-32 -right-32 w-[32rem] h-[32rem] bg-copper/10 rounded-full blur-[110px] animate-pulse-glow"
        style={{ animationDelay: '3.8s' }}
      />

      {/* ── 3. Subtle Faint Geometric Concentric Rings ──────────────────────── */}
      <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full border border-navy/5 animate-spin-very-slow hidden md:block" />
      <div className="absolute -top-12 -left-12 w-72 h-72 rounded-full border border-dashed border-copper/15 animate-spin-reverse-slow hidden md:block" />
      <div className="absolute -bottom-28 -right-28 w-[30rem] h-[30rem] rounded-full border border-navy/5 animate-spin-reverse-slow hidden md:block" />
      <div className="absolute -bottom-14 -right-14 w-80 h-80 rounded-full border border-dashed border-copper/15 animate-spin-very-slow hidden md:block" />
    </div>
  );
};
