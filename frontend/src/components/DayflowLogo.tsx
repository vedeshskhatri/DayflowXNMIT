import React from 'react';

interface DayflowLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showText?: boolean;
}

export const DayflowLogo: React.FC<DayflowLogoProps> = ({
  size = 'md',
  className = '',
  showText = false,
}) => {
  const sizeMap = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-14 h-14',
    xl: 'w-16 h-16',
  };

  const dimension = sizeMap[size] || sizeMap.md;

  return (
    <div className={`inline-flex items-center space-x-3 ${className}`}>
      <div className={`relative ${dimension} flex-shrink-0 group`}>
        <svg
          viewBox="0 0 64 64"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full drop-shadow-md transition-transform duration-300 group-hover:scale-105"
        >
          <defs>
            {/* Background Base Squircle Gradient */}
            <linearGradient id="dfLogoBg" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#2D3E4E" />
              <stop offset="50%" stopColor="#3F556B" />
              <stop offset="100%" stopColor="#5E7892" />
            </linearGradient>

            {/* Rising Sun Radial Gradient */}
            <linearGradient id="dfLogoSun" x1="0%" y1="100%" x2="0%" y2="0%">
              <stop offset="0%" stopColor="#8E9E83" />
              <stop offset="100%" stopColor="#BDCFAA" />
            </linearGradient>

            {/* Infinity Flow Ribbon Gradient */}
            <linearGradient id="dfLogoInfinity" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#BDCFAA" />
              <stop offset="35%" stopColor="#F3EFDF" />
              <stop offset="70%" stopColor="#A7B7C6" />
              <stop offset="100%" stopColor="#BDCFAA" />
            </linearGradient>

            <filter id="dfGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="1.2" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Squircle Base Frame */}
          <rect
            x="2"
            y="2"
            width="60"
            height="60"
            rx="16"
            fill="url(#dfLogoBg)"
            stroke="#BDCFAA"
            strokeWidth="1.5"
            strokeOpacity="0.3"
          />

          {/* Rising Sun Behind Infinity Loop */}
          <path d="M 23 34 A 9 9 0 0 1 41 34 Z" fill="url(#dfLogoSun)" opacity="0.95" />

          {/* Sun Rays */}
          <line x1="32" y1="16" x2="32" y2="21" stroke="#BDCFAA" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="22" y1="20" x2="25" y2="24" stroke="#BDCFAA" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="42" y1="20" x2="39" y2="24" stroke="#BDCFAA" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="15" y1="28" x2="19" y2="30.5" stroke="#BDCFAA" strokeWidth="2.5" strokeLinecap="round" opacity="0.8" />
          <line x1="49" y1="28" x2="45" y2="30.5" stroke="#BDCFAA" strokeWidth="2.5" strokeLinecap="round" opacity="0.8" />

          {/* Infinity Flow Ribbon */}
          <path
            d="M 32 39 C 24 28 11 28 11 39 C 11 50 24 50 32 39 C 40 28 53 28 53 39 C 53 50 40 50 32 39 Z"
            stroke="url(#dfLogoInfinity)"
            strokeWidth="5.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
            filter="url(#dfGlow)"
          />

          {/* Center Core Accent Glow */}
          <circle cx="32" cy="39" r="1.8" fill="#FFFFFF" />
        </svg>
      </div>

      {showText && (
        <div className="flex flex-col">
          <span className="font-heading font-bold text-xl tracking-tight text-text-primary">
            Dayflow
          </span>
          <span className="text-[10px] text-text-muted font-medium -mt-1 tracking-wider uppercase">
            HRMS
          </span>
        </div>
      )}
    </div>
  );
};
