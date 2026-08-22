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
            {/* Background Gradient — Classic Navy */}
            <linearGradient id="dfLogoBg" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#2D4263" />
              <stop offset="100%" stopColor="#1D2D44" />
            </linearGradient>

            {/* Copper Gold Arc Gradient */}
            <linearGradient id="dfLogoCopper" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#E5A863" />
              <stop offset="50%" stopColor="#B87333" />
              <stop offset="100%" stopColor="#FFF5E1" />
            </linearGradient>

            {/* Hand Glow */}
            <linearGradient id="dfLogoHand" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="100%" stopColor="#FFF5E1" />
            </linearGradient>

            <filter id="dfCopperGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="1.5" result="blur" />
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
            stroke="#B87333"
            strokeWidth="1.5"
            strokeOpacity="0.4"
          />

          {/* Flowing Clock Orbital Arc in Copper Gold */}
          <circle
            cx="32"
            cy="32"
            r="22"
            stroke="url(#dfLogoCopper)"
            strokeWidth="2.8"
            strokeLinecap="round"
            strokeDasharray="105 35"
            filter="url(#dfCopperGlow)"
          />

          {/* Dial Track Dots */}
          <circle cx="32" cy="13" r="1.8" fill="#FFF5E1" />
          <circle cx="51" cy="32" r="1.8" fill="#E5A863" />
          <circle cx="32" cy="51" r="1.8" fill="#FFF5E1" />
          <circle cx="13" cy="32" r="1.8" fill="#E5A863" />

          {/* Clock Hands (10:10 Position) */}
          <path
            d="M32 32 L21 21"
            stroke="url(#dfLogoHand)"
            strokeWidth="3.4"
            strokeLinecap="round"
          />
          <path
            d="M32 32 L45 19"
            stroke="#E5A863"
            strokeWidth="2.8"
            strokeLinecap="round"
          />
          <circle cx="45" cy="19" r="2.4" fill="#B87333" filter="url(#dfCopperGlow)" />

          {/* Center Hub */}
          <circle cx="32" cy="32" r="4.5" fill="#FFFFFF" />
          <circle cx="32" cy="32" r="2.2" fill="#2D4263" />
        </svg>
      </div>

      {showText && (
        <div className="flex flex-col">
          <span className="font-heading font-bold text-xl tracking-tight text-navy-dark">
            Dayflow
          </span>
          <span className="text-[10px] text-copper font-bold -mt-1 tracking-wider uppercase">
            HRMS
          </span>
        </div>
      )}
    </div>
  );
};
