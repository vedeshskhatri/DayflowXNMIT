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
            {/* Background Gradient */}
            <linearGradient id="dfLogoBg" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#5E7892" />
              <stop offset="100%" stopColor="#34485D" />
            </linearGradient>

            {/* Flowing Orbital Glow */}
            <linearGradient id="dfLogoFlow" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#BDCFAA" />
              <stop offset="50%" stopColor="#F3EFDF" />
              <stop offset="100%" stopColor="#C97B63" />
            </linearGradient>

            {/* Hand Glow */}
            <linearGradient id="dfLogoHand" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFFFFF" />
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
            stroke="#A7B7C6"
            strokeWidth="1.5"
            strokeOpacity="0.35"
          />

          {/* Flowing Clock Orbital Arc */}
          <circle
            cx="32"
            cy="32"
            r="22"
            stroke="url(#dfLogoFlow)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeDasharray="100 35"
            filter="url(#dfGlow)"
          />

          {/* Dial Track Dots */}
          <circle cx="32" cy="13" r="1.5" fill="#BDCFAA" />
          <circle cx="51" cy="32" r="1.5" fill="#BDCFAA" />
          <circle cx="32" cy="51" r="1.5" fill="#BDCFAA" />
          <circle cx="13" cy="32" r="1.5" fill="#BDCFAA" />

          {/* Clock Hands (10:10 Position) */}
          <path
            d="M32 32 L22 22"
            stroke="url(#dfLogoHand)"
            strokeWidth="3.2"
            strokeLinecap="round"
          />
          <path
            d="M32 32 L44 20"
            stroke="#F3EFDF"
            strokeWidth="2.6"
            strokeLinecap="round"
          />
          <circle cx="44" cy="20" r="2.2" fill="#C97B63" filter="url(#dfGlow)" />

          {/* Center Hub */}
          <circle cx="32" cy="32" r="4.2" fill="#FFFFFF" />
          <circle cx="32" cy="32" r="2.2" fill="#5E7892" />
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
