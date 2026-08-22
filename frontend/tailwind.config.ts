import type { Config } from 'tailwindcss';

/**
 * Dayflow Design System — Classic Navy, Warm Cream, Copper Gold, and Crisp White.
 * - Maximum surface: White (#FFFFFF) & Warm Cream (#FFF5E1)
 * - Primary brand: Classic Navy (#2D4263)
 * - Luxury Accent: Copper Accent (#B87333 / #D49A55)
 * - Headline Font: Special Gothic Expanded One / Syne / Space Grotesk
 * - Body Font: Inter
 */
const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // ── Maximum Surface & Backgrounds ─────────────────────────────────────
        white: '#FFFFFF',
        cream: {
          DEFAULT: '#FFF5E1', // Warm Cream background
          light: '#FFFAF0',   // Ultra-light surface
          subtle: '#F7EED9',  // Subtle border / card fill
        },

        // ── Primary Brand Navy ────────────────────────────────────────────────
        navy: {
          DEFAULT: '#2D4263', // Classic Navy brand
          dark: '#1D2D44',    // Deep high-contrast navy
          light: '#3D5A80',   // Soft navy hover / interactive
          subtle: '#EEF2F6',  // Light navy tint for tags / chips
        },

        // Backward-compatible slate token pointing to Classic Navy
        slate: {
          brand: '#2D4263',
          dark: '#1D2D44',
          light: '#3D5A80',
        },

        // ── Luxury Copper Accent / Gold ───────────────────────────────────────
        copper: {
          DEFAULT: '#B87333', // Copper Accent
          light: '#D49A55',   // Warm metallic gold highlight
          bright: '#E5A863',  // Bright glow / active indicator
          dark: '#8F531E',    // Deep copper text
          muted: '#F7E8D3',   // Subtle copper pill / badge fill
        },

        // Backward-compatible blue-grey token
        'blue-grey': '#B5C4D3',

        // ── Status Accents ────────────────────────────────────────────────────
        sage: {
          light: '#C8D6AF',   // Present status / positive indicator
          deep: '#8E9E83',    // Approved badge text / tag chip
        },

        terracotta: {
          DEFAULT: '#C86446', // Absent / Destructive actions / Errors
          light: '#F8EAE6',
        },

        // ── Typography Colors ─────────────────────────────────────────────────
        text: {
          primary: '#1A2536', // Deep charcoal-navy text (crisp on white and cream)
          muted: '#637083',   // Secondary helper text
          light: '#8E9BAC',   // Subtle timestamp / captions
        },
      },

      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        heading: ['"Space Grotesk"', '"Syne"', '"Unbounded"', '"Special Gothic Expanded One"', 'sans-serif'],
        display: ['"Special Gothic Expanded One"', '"Syne"', '"Space Grotesk"', 'sans-serif'],
      },

      borderRadius: {
        xl: '0.75rem',    // 12px
        '2xl': '1rem',    // 16px
        '3xl': '1.5rem',  // 24px
        full: '9999px',
      },

      boxShadow: {
        card: '0 2px 8px -2px rgba(45, 66, 99, 0.06), 0 1px 3px -1px rgba(45, 66, 99, 0.04)',
        elevated: '0 10px 30px -5px rgba(45, 66, 99, 0.1), 0 4px 10px -3px rgba(45, 66, 99, 0.05)',
        modal: '0 20px 40px -10px rgba(29, 45, 68, 0.2), 0 6px 12px -4px rgba(29, 45, 68, 0.1)',
        copper: '0 4px 14px 0 rgba(184, 115, 51, 0.25)',
        navy: '0 4px 14px 0 rgba(45, 66, 99, 0.25)',
      },

      maxWidth: {
        content: '80rem',
      },

      animation: {
        'float-slow': 'float 8s ease-in-out infinite',
        'pulse-glow': 'pulse-glow 4s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        'pulse-glow': {
          '0%, 100%': { opacity: '0.4', transform: 'scale(1)' },
          '50%': { opacity: '0.75', transform: 'scale(1.05)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
